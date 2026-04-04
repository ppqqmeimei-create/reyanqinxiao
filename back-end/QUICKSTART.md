# 后端快速启动指南

## 🚀 5 分钟快速开始

### 前置要求

- Node.js 18+ ([下载](https://nodejs.org/))
- npm 9+ (随 Node.js 安装)
- MongoDB 5.0+ ([下载](https://www.mongodb.com/try/download/community))

### 步骤 1: 安装依赖

```bash
cd back-end
npm install
```

### 步骤 2: 配置环境

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件（可选，使用默认值也可以）
# 重要: 修改 JWT_SECRET 为强密钥
```

### 步骤 3: 启动服务

**Windows**:
```bash
start.bat
```

**Linux/Mac**:
```bash
chmod +x start.sh
./start.sh
```

**或使用 npm**:
```bash
npm run dev
```

### 步骤 4: 验证服务

打开浏览器访问:
- 健康检查: http://localhost:3000/health
- API 文档: http://localhost:3000/api/docs

---

## 📚 API 测试示例

### 1. 用户注册

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "name": "测试用户"
  }'
```

### 2. 用户登录

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGc...",
    "user": {
      "id": "...",
      "username": "testuser",
      "name": "测试用户",
      "role": "inspector",
      "status": "online"
    }
  }
}
```

### 3. 获取当前用户

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

### 4. 创建预警

```bash
curl -X POST http://localhost:3000/api/v1/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token_here>" \
  -d '{
    "title": "水质污染预警",
    "description": "某地区水质检测异常",
    "level": "critical",
    "type": "water-pollution",
    "category": "water",
    "location": "监测点A",
    "latitude": 39.9042,
    "longitude": 116.4074,
    "risk_score": 85,
    "pollutant_type": "重金属",
    "pollutant_value": 2.5,
    "standard_value": 1.0,
    "affected_population": 5000
  }'
```

### 5. 获取预警列表

```bash
curl -X GET "http://localhost:3000/api/v1/alerts?page=1&limit=10" \
  -H "Authorization: Bearer <your_token_here>"
```

---

## 🔧 常见问题

### Q: MongoDB 连接失败

**A**: 确保 MongoDB 服务正在运行
```bash
# Windows
mongod

# Linux/Mac
brew services start mongodb-community
```

### Q: 端口 3000 已被占用

**A**: 修改 `.env` 文件中的 PORT 值
```env
PORT=3001
```

### Q: 依赖安装失败

**A**: 清除缓存并重新安装
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q: JWT_SECRET 警告

**A**: 在 `.env` 文件中设置强密钥
```env
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
```

---

## 📊 项目结构

```
back-end/
├── src/
│   ├── server.js              # 应用入口
│   ├── config/
│   │   └── database.js        # 数据库配置
│   ├── models/                # 数据模型
│   │   ├── User.js
│   │   ├── Alert.js
│   │   ├── Task.js
│   │   └── Device.js
│   ├── routes/                # API 路由
│   │   ├── auth.js
│   │   ├── alerts.js
│   │   ├── tasks.js
│   │   ├── devices.js
│   │   ├── gis.js
│   │   └── users.js
│   └── middleware/            # 中间件
│       ├── auth.js
│       └── validation.js
├── logs/                      # 日志文件
├── .env                       # 环境变量
├── package.json               # 项目配置
└── README.md                  # 项目说明
```

---

## 🧪 运行测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成覆盖率报告
npm test -- --coverage
```

---

## 📝 代码检查

```bash
# 检查代码风格
npm run lint

# 自动修复代码风格
npm run lint:fix
```

---

## 🚢 生产部署

### 使用 PM2

```bash
# 全局安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/server.js --name "reyanjingxiao-api"

# 查看日志
pm2 logs reyanjingxiao-api

# 重启应用
pm2 restart reyanjingxiao-api

# 停止应用
pm2 stop reyanjingxiao-api
```

### 使用 Docker

```bash
# 构建镜像
docker build -t reyanjingxiao-api .

# 运行容器
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://mongo:27017/reyanjingxiao \
  -e JWT_SECRET=your-secret-key \
  reyanjingxiao-api
```

---

## 📞 支持

如有问题，请查看:
- README.md - 详细文档
- BACKEND_TECH_VERIFICATION.md - 技术验证报告
- logs/ - 日志文件

---

**最后更新**: 2026年3月13日
