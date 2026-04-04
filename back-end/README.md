# 热眼擒枭 - 后端 API 服务

生态环保监控系统的 Node.js 后端服务，提供统一的 RESTful API 接口。

## 🚀 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js 4.18+
- **数据库**: MySQL 5.7+ / 8.0+
- **ORM**: Sequelize 6.35+
- **缓存**: Redis 6.0+
- **认证**: JWT (JSON Web Token)
- **验证**: Joi
- **日志**: Winston
- **安全**: Helmet, CORS, Rate Limiting

## 📋 项目结构

```
back-end/
├── src/
│   ├── server.js                 # 应用入口
│   ├── config/
│   │   └── database.js           # 数据库配置
│   ├── models/                   # 数据模型
│   │   ├── User.js              # 用户模型
│   │   ├── Alert.js             # 预警模型
│   │   ├── Task.js              # 任务模型
│   │   └── Device.js            # 设备模型
│   ├── routes/                   # API 路由
│   │   ├── auth.js              # 认证路由
│   │   ├── alerts.js            # 预警路由
│   │   ├── tasks.js             # 任务路由
│   │   ├── devices.js           # 设备路由
│   │   ├── gis.js               # GIS 路由
│   │   └── users.js             # 用户路由
│   └── middleware/               # 中间件
│       ├── auth.js              # 认证中间件
│       └── validation.js        # 验证中间件
├── logs/                         # 日志文件
├── .env                          # 环境变量
├── .env.example                  # 环境变量示例
├── package.json                  # 依赖配置
└── README.md                     # 项目说明
```

## 🔧 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

MONGODB_URI=mongodb://localhost:27017/reyanjingxiao
REDIS_URL=redis://localhost:6379/0

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:8080,http://localhost:5173
```

### 3. 启动服务

**开发模式**（带热重载）：
```bash
npm run dev
```

**生产模式**：
```bash
npm start
```

### 4. 验证服务

访问健康检查端点：
```bash
curl http://localhost:3000/health
```

查看 API 文档：
```bash
curl http://localhost:3000/api/docs
```

## 📚 API 文档

### 基础信息

- **基础 URL**: `http://localhost:3000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **请求格式**: JSON
- **响应格式**: JSON

### 认证接口

#### 登录
```http
POST /auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGc...",
    "user": {
      "id": "...",
      "username": "user123",
      "name": "用户名",
      "role": "inspector",
      "status": "online"
    }
  }
}
```

#### 注册
```http
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "name": "新用户"
}
```

#### 获取当前用户
```http
GET /auth/me
Authorization: Bearer <token>
```

#### 登出
```http
POST /auth/logout
Authorization: Bearer <token>
```

#### 更新用户状态
```http
PUT /auth/update-status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "busy"  // online, offline, busy
}
```

### 预警接口

#### 获取预警列表
```http
GET /alerts?page=1&limit=10&status=pending&level=critical
Authorization: Bearer <token>
```

#### 获取预警详情
```http
GET /alerts/:id
Authorization: Bearer <token>
```

#### 创建预警
```http
POST /alerts
Authorization: Bearer <token>
Content-Type: application/json

{
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
}
```

#### 分配预警
```http
PUT /alerts/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "user_id_here"
}
```

#### 解决预警
```http
PUT /alerts/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution_notes": "已处理完毕"
}
```

#### 忽略预警
```http
PUT /alerts/:id/ignore
Authorization: Bearer <token>
```

#### 获取预警统计
```http
GET /alerts/stats
Authorization: Bearer <token>
```

### 任务接口

#### 获取任务列表
```http
GET /tasks?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### 创建任务
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "水质采样任务",
  "description": "对某地区进行水质采样",
  "type": "complete-sampling",
  "priority": "high",
  "assigned_to": "user_id",
  "location": "监测点A",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "deadline": "2024-12-31T23:59:59Z"
}
```

#### 开始任务
```http
PUT /tasks/:id/start
Authorization: Bearer <token>
```

#### 完成任务
```http
PUT /tasks/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "completion_notes": "任务已完成",
  "evidence": ["url1", "url2"]
}
```

#### 更新任务进度
```http
PUT /tasks/:id/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "progress": 50
}
```

### 设备接口

#### 获取设备列表
```http
GET /devices?page=1&limit=10&status=online
Authorization: Bearer <token>
```

#### 添加设备
```http
POST /devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "device_id": "CAM-001",
  "name": "可见光摄像头-A01",
  "type": "camera-visible",
  "location": "某地区",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "manufacturer": "某厂商",
  "model": "型号",
  "firmware_version": "1.0.0"
}
```

#### 设备心跳更新
```http
PUT /devices/:id/heartbeat
Content-Type: application/json

{
  "battery": 85,
  "signal_strength": 92,
  "metadata": {
    "temperature": 25.5,
    "humidity": 60
  }
}
```

#### 获取设备统计
```http
GET /devices/stats
Authorization: Bearer <token>
```

### GIS 接口

#### 获取污染源
```http
GET /gis/pollution-sources
Authorization: Bearer <token>
```

#### 获取监测点
```http
GET /gis/monitoring-points
Authorization: Bearer <token>
```

#### 上报污染
```http
POST /gis/report-pollution
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "water-pollution",
  "category": "water",
  "location": "某地区",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "pollutant_type": "重金属",
  "pollutant_value": 2.5,
  "standard_value": 1.0,
  "description": "发现污染",
  "affected_population": 1000
}
```

#### 获取地图预警
```http
GET /gis/alerts-on-map
Authorization: Bearer <token>
```

#### 获取热力图数据
```http
GET /gis/heatmap
Authorization: Bearer <token>
```

#### 获取附近预警
```http
GET /gis/nearby-alerts?latitude=39.9042&longitude=116.4074&radius=5000
Authorization: Bearer <token>
```

### 用户接口

#### 获取用户列表
```http
GET /users?page=1&limit=10&role=inspector
Authorization: Bearer <token>
```

#### 获取用户详情
```http
GET /users/:id
Authorization: Bearer <token>
```

#### 更新用户信息
```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新名字",
  "phone": "13800138000",
  "department": "部门"
}
```

#### 修改密码
```http
PUT /users/:id/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "old_password": "old_password",
  "new_password": "new_password"
}
```

#### 获取用户统计
```http
GET /users/stats
Authorization: Bearer <token>
```

## 🔐 安全特性

- ✅ JWT 令牌认证
- ✅ 密码加密存储 (bcrypt)
- ✅ CORS 跨域保护
- ✅ 速率限制
- ✅ Helmet 安全头
- ✅ 输入验证和清理
- ✅ SQL 注入防护 (MongoDB)
- ✅ XSS 防护

## 📊 数据模型

### User (用户)
- username: 用户名
- email: 邮箱
- password: 密码（加密）
- name: 姓名
- role: 角色 (inspector, manager, admin)
- status: 状态 (online, offline, busy)
- phone: 电话
- avatar: 头像
- is_active: 是否激活

### Alert (预警)
- title: 标题
- description: 描述
- level: 级别 (critical, warning, info)
- status: 状态 (pending, processing, resolved, ignored)
- type: 类型 (water-pollution, air-pollution, soil-pollution, waste-pollution)
- category: 分类 (water, air, soil, waste)
- location: 位置
- latitude/longitude: 坐标
- risk_score: 风险评分
- assigned_to: 分配给
- created_by: 创建者

### Task (任务)
- title: 标题
- description: 描述
- type: 类型 (quick-sampling, complete-sampling, inspection, monitoring)
- status: 状态 (pending, in-progress, completed, cancelled)
- priority: 优先级 (low, medium, high, urgent)
- assigned_to: 分配给
- location: 位置
- progress: 进度 (0-100)
- evidence: 证据
- checklist: 检查清单

### Device (设备)
- device_id: 设备ID
- name: 设备名称
- type: 类型 (camera-visible, camera-infrared, fiber, smell, water-monitor, air-monitor, soil-monitor)
- status: 状态 (online, offline, warning, error)
- location: 位置
- latitude/longitude: 坐标
- battery: 电池电量
- signal_strength: 信号强度
- metadata: 元数据

## 🧪 测试

运行测试：
```bash
npm test
```

## 📝 日志

日志文件位置：
- `logs/error.log` - 错误日志
- `logs/combined.log` - 所有日志

## 🚀 部署

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
```

### PM2 部署

```bash
npm install -g pm2

pm2 start src/server.js --name "reyanjingxiao-api"
pm2 save
pm2 startup
```

## 📞 支持

如有问题，请联系开发团队。

## 📄 许可证

MIT License
