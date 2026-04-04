# 热眼擒枭部署文档

## 环境要求

### 硬件要求

| 配置 | 最低配置 | 推荐配置 |
|-----|---------|---------|
| CPU | 2核 | 4核+ |
| 内存 | 4GB | 8GB+ |
| 硬盘 | 50GB | 100GB+ |
| 带宽 | 2Mbps | 5Mbps+ |

### 软件要求

| 软件 | 版本要求 | 说明 |
|-----|---------|------|
| Node.js | >= 16.0.0 | 后端运行环境 |
| MySQL | >= 8.0 | 主数据库 |
| Redis | >= 6.0 | 缓存（可选） |
| Nginx | >= 1.18 | Web服务器 |
| PM2 | latest | 进程管理器 |

---

## 环境准备

### 1. 安装 Node.js

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
nvm alias default 18

# 验证安装
node --version
npm --version
```

### 2. 安装 MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# macOS (Homebrew)
brew install mysql
```

### 3. 安装 Redis（可选）

```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis
```

### 4. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

---

## 项目部署

### 1. 获取代码

```bash
git clone <repository-url>
cd reyanqinxiao
```

### 2. 安装依赖

```bash
# 后端依赖
cd back-end
npm install

# 管理后台依赖
cd ../admin
npm install
```

### 3. 配置环境变量

**后端环境变量 (back-end/.env):**

```env
# 服务配置
PORT=5000
NODE_ENV=production
API_PREFIX=/api/v1

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=reyanqinxiao
DB_USER=root
DB_PASSWORD=your_secure_password

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=http://your-domain.com,http://localhost:3000,http://localhost:3001

# 日志配置
LOG_LEVEL=info
```

### 4. 初始化数据库

```bash
mysql -u root -p

# 创建数据库
CREATE DATABASE reyanqinxiao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 执行SQL脚本
mysql -u root -p reyanqinxiao < SQL_NEW/01_init.sql
mysql -u root -p reyanqinxiao < SQL_NEW/02_seed.sql
mysql -u root -p reyanqinxiao < SQL_NEW/03_rbac.sql
```

### 5. 修改默认密码

```bash
mysql -u root -p reyanqinxiao

UPDATE users SET password='$2a$10$YOUR_NEW_HASH_HERE' WHERE role='admin';
EXIT;
```

---

## PM2 部署后端

### 1. 全局安装 PM2

```bash
npm install -g pm2
```

### 2. 创建 PM2 配置文件

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'reyanqinxiao-api',
    script: 'src/server.js',
    cwd: '/path/to/reyanqinxiao/back-end',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
}
```

### 3. 启动服务

```bash
cd /path/to/reyanqinxiao/back-end
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. PM2 常用命令

```bash
pm2 list                    # 查看进程列表
pm2 logs reyanqinxiao-api   # 查看日志
pm2 restart reyanqinxiao-api # 重启服务
pm2 stop reyanqinxiao-api    # 停止服务
pm2 delete reyanqinxiao-api  # 删除进程
```

---

## Nginx 配置

### 1. 后端API代理配置

```nginx
# /etc/nginx/conf.d/reyanqinxiao-api.conf

server {
    listen 80;
    server_name api.your-domain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 请求日志
    access_log /var/log/nginx/reyanqinxiao-api-access.log;
    error_log /var/log/nginx/reyanqinxiao-api-error.log;

    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文件上传限制
    client_max_body_size 50M;
}
```

### 2. 管理后台静态资源

```nginx
# /etc/nginx/conf.d/reyanqinxiao-admin.conf

server {
    listen 80;
    server_name admin.your-domain.com;

    root /path/to/reyanqinxiao/admin/dist;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 3. 重载 Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## HTTPS 配置（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.your-domain.com -d admin.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 移动端部署

### 1. HBuilderX 云打包

1. 在 HBuilderX 中打开 `front-end` 项目
2. 右键项目 -> 发行 -> 原生App-云打包
3. 选择 Android/iOS 平台
4. 配置证书（Android需要签名证书，iOS需要描述文件）
5. 点击打包

### 2. 离线打包（Android）

1. 安装 Android Studio
2. 创建uni-app离线打包工程
3. 集成 uni-app SDK
4. 配置 AppID 和签名
5. 构建 APK

---

## Docker 部署

### 1. Dockerfile

```dockerfile
# back-end/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

### 2. 构建和运行

```bash
# 构建镜像
docker build -t reyanqinxiao-api -f back-end/Dockerfile .

# 运行容器
docker run -d \
  --name reyanqinxiao-api \
  -p 5000:5000 \
  --env-file back-end/.env \
  reyanqinxiao-api

# 查看日志
docker logs -f reyanqinxiao-api
```

### 3. Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: ./back-end
    ports:
      - "5000:5000"
    env_file:
      - ./back-end/.env
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: reyanqinxiao
    volumes:
      - mysql_data:/var/lib/mysql
      - ./SQL_NEW:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 系统维护

### 日志管理

```bash
# 查看后端日志
pm2 logs reyanqinxiao-api --lines 100

# 日志轮转配置
# /etc/logrotate.d/reyanqinxiao
/path/to/reyanqinxiao/back-end/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
```

### 数据库备份

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/path/to/backups
DB_NAME=reyanqinxiao
DB_USER=root
DB_PASS=your_password

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 删除30天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

### 监控配置

```bash
# 使用 PM2 Plus (可选)
pm2 link <secret_key> <public_key>

# 或使用 Prometheus + Grafana
```

---

## 故障排查

### 常见问题

1. **端口被占用**
   ```bash
   lsof -i :5000
   # 或
   netstat -tlnp | grep 5000
   ```

2. **数据库连接失败**
   - 检查MySQL服务状态
   - 验证用户名密码
   - 检查防火墙设置

3. **CORS跨域问题**
   - 确认Nginx配置正确
   - 检查后端CORS白名单

4. **静态资源加载失败**
   - 确认dist目录存在
   - 检查Nginx root路径

### 安全检查清单

- [ ] 修改默认密码
- [ ] 配置HTTPS
- [ ] 设置防火墙规则
- [ ] 启用日志审计
- [ ] 定期备份数据库
- [ ] 更新系统依赖
