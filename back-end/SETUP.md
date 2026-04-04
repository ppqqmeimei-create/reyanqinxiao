# 后端项目设置指南

## 📋 项目结构

```
back-end/
├── app/
│   ├── __init__.py              # 应用初始化
│   ├── models/                  # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py              # 用户模型
│   │   ├── alert.py             # 预警模型
│   │   ├── task.py              # 任务模型
│   │   └── device.py            # 设备模型
│   ├── routes/                  # API路由
│   │   ├── __init__.py
│   │   ├── auth.py              # 认证接口
│   │   ├── alerts.py            # 预警接口
│   │   ├── tasks.py             # 任务接口
│   │   ├── devices.py           # 设备接口
│   │   └── gis.py               # GIS接口
│   ├── services/                # 业务逻辑
│   │   ├── __init__.py
│   │   ├── auth_service.py      # 认证服务
│   │   ├── alert_service.py     # 预警服务
│   │   └── gis_service.py       # GIS服务
│   └── utils/                   # 工具函数
│       ├── __init__.py
│       ├── decorators.py        # 装饰器
│       ├── validators.py        # 验证器
│       └── helpers.py           # 辅助函数
├── config/
│   ├── __init__.py
│   └── settings.py              # 配置文件
├── tests/                       # 测试文件
│   ├── __init__.py
│   ├── test_auth.py
│   ├── test_alerts.py
│   └── test_tasks.py
├── logs/                        # 日志文件
├── .env                         # 环境变量
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git忽略文件
├── run.py                       # 启动文件
├── requirements.txt             # 依赖列表
├── README.md                    # 项目说明
└── SETUP.md                     # 设置指南
```

## 🚀 快速开始

### 1. 安装Python依赖

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
FLASK_ENV=development
FLASK_APP=run.py
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///app.db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-jwt-secret-key
```

### 3. 初始化数据库

```bash
# 创建数据库表
python
>>> from run import create_app
>>> from flask_sqlalchemy import SQLAlchemy
>>> app = create_app()
>>> with app.app_context():
>>>     db.create_all()
>>> exit()
```

### 4. 运行项目

```bash
python run.py
```

项目将在 `http://localhost:5000` 运行

## 📚 API接口文档

### 认证接口 (`/api/auth`)

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "role": "inspector"
  }
}
```

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser@example.com",
  "password": "password123",
  "name": "张三"
}

Response:
{
  "message": "注册成功",
  "user_id": 1
}
```

### 预警接口 (`/api/alerts`)

#### 获取预警列表
```
GET /api/alerts?page=1&limit=10
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": 1,
      "title": "某化工厂排污口检测到重金属超标",
      "level": "critical",
      "riskScore": 92,
      "location": "某化工厂",
      "time": "2024-03-12T14:32:00",
      "status": "pending"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### 创建预警
```
POST /api/alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新预警",
  "level": "warning",
  "location": "某地点",
  "description": "预警描述"
}

Response:
{
  "id": 2,
  "message": "预警创建成功"
}
```

### 任务接口 (`/api/tasks`)

#### 获取任务列表
```
GET /api/tasks?status=pending
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": 1,
      "title": "检查任务",
      "status": "pending",
      "assignee": "张三",
      "createdAt": "2024-03-12T10:00:00"
    }
  ],
  "total": 50
}
```

#### 创建任务
```
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "新检查任务",
  "description": "任务描述",
  "assignee_id": 1,
  "priority": "high"
}

Response:
{
  "id": 2,
  "message": "任务创建成功"
}
```

### 设备接口 (`/api/devices`)

#### 获取设备列表
```
GET /api/devices
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": 1,
      "name": "监测点1",
      "type": "sensor",
      "status": "online",
      "location": "某地点",
      "lastUpdate": "2024-03-12T14:30:00"
    }
  ],
  "total": 30
}
```

### GIS接口 (`/api/gis`)

#### 获取污染源
```
GET /api/gis/pollution-sources
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": 1,
      "name": "某化工厂",
      "type": "factory",
      "latitude": 39.9042,
      "longitude": 116.4074,
      "riskLevel": "high"
    }
  ]
}
```

#### 获取监测点
```
GET /api/gis/monitoring-points
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": 1,
      "name": "监测点1",
      "latitude": 39.9062,
      "longitude": 116.4094,
      "status": "online"
    }
  ]
}
```

## 🧪 运行测试

```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_auth.py

# 生成覆盖率报告
pytest --cov=app tests/
```

## 📝 开发规范

### 代码风格
- 遵循 PEP 8 规范
- 使用 4 个空格缩进
- 函数和类之间空两行

### 命名规范
- 函数名：`snake_case`
- 类名：`PascalCase`
- 常量：`UPPER_CASE`

### 注释规范
- 模块级注释：在文件顶部
- 函数注释：使用 docstring
- 复杂逻辑：添加行注释

## 🔐 安全建议

1. **环境变量**
   - 不要提交 `.env` 文件
   - 使用 `.env.example` 作为模板

2. **密钥管理**
   - 定期更换 SECRET_KEY
   - 使用强密码

3. **数据库**
   - 定期备份
   - 使用参数化查询防止SQL注入

4. **API认证**
   - 使用 JWT token
   - 设置合理的过期时间

## 🚀 部署

### 使用Gunicorn部署

```bash
# 安装Gunicorn
pip install gunicorn

# 运行应用
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### 使用Docker部署

创建 `Dockerfile`：

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "run:app"]
```

构建和运行：

```bash
docker build -t heateyeapp .
docker run -p 5000:5000 heateyeapp
```

## 📞 常见问题

### Q: 如何重置数据库？
```bash
python
>>> from run import create_app
>>> from flask_sqlalchemy import SQLAlchemy
>>> app = create_app()
>>> with app.app_context():
>>>     db.drop_all()
>>>     db.create_all()
>>> exit()
```

### Q: 如何添加新的API接口？
1. 在 `app/routes/` 中创建新的蓝图
2. 在 `run.py` 中注册蓝图
3. 编写相应的模型和服务

### Q: 如何调试？
```bash
# 启用调试模式
export FLASK_ENV=development
export FLASK_DEBUG=1
python run.py
```

---

**设置完成后，请告诉我！** 😊
