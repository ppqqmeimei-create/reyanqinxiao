import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import dotenv from 'dotenv';
import winston from 'winston';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

// 加载环境变量
dotenv.config();

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 Express 应用
const app = express();

// 初始化数据库连接
connectDB();

// ==================== 日志配置 ====================
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'reyanjingxiao-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// ==================== 中间件配置 ====================

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制 100 个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ==================== 路由导入 ====================
import authRoutes from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import taskRoutes from './routes/tasks.js';
import deviceRoutes from './routes/devices.js';
import gisRoutes from './routes/gis.js';
import gisExtendedRoutes from './routes/gis_extended.js';
import userRoutes from './routes/users.js';
import wildlifeRoutes from './routes/wildlife.js';
import enforcementRoutes from './routes/enforcement.js';
import fooddrugRoutes from './routes/fooddrug.js';
import fusionRoutes from './routes/fusion.js';
import sensingRoutes from './routes/sensing.js';
import closedloopRoutes from './routes/closedloop.js';
import realtimeRoutes from './routes/realtime.js';
import evidenceRoutes from './routes/evidence.js';
import statsRoutes from './routes/stats.js';
import logsRoutes from './routes/logs.js';
import connectDB from './config/database.js';
import { initWebSocket } from './services/websocketHub.js';

// ==================== 路由注册 ====================
const apiPrefix = process.env.API_PREFIX || '/api/v1';

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/alerts`, alertRoutes);
app.use(`${apiPrefix}/tasks`, taskRoutes);
app.use(`${apiPrefix}/devices`, deviceRoutes);
app.use(`${apiPrefix}/gis`, gisRoutes);
app.use(`${apiPrefix}/gis`, gisExtendedRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/wildlife`, wildlifeRoutes);
app.use(`${apiPrefix}/enforcement`, enforcementRoutes);
app.use(`${apiPrefix}/fooddrug`, fooddrugRoutes);
app.use(`${apiPrefix}/fusion`, fusionRoutes);
app.use(`${apiPrefix}/sensing`, sensingRoutes);
app.use(`${apiPrefix}`, closedloopRoutes);
app.use(`${apiPrefix}/fusion`, realtimeRoutes);
app.use(`${apiPrefix}/evidence`, evidenceRoutes);
app.use(`${apiPrefix}/stats`, statsRoutes);
app.use(`${apiPrefix}/logs`, logsRoutes);

// ==================== 健康检查端点 ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// ==================== API 文档端点 ====================
app.get('/api/docs', (req, res) => {
  res.json({
    name: '热眼擒枭 API',
    version: '1.0.0',
    description: '生态环保监控系统 API 文档',
    baseUrl: `http://${process.env.HOST}:${process.env.PORT}${apiPrefix}`,
    endpoints: {
      auth: {
        login: 'POST /auth/login',
        register: 'POST /auth/register',
        logout: 'POST /auth/logout',
        me: 'GET /auth/me',
        updateStatus: 'PUT /auth/update-status'
      },
      alerts: {
        list: 'GET /alerts',
        create: 'POST /alerts',
        getById: 'GET /alerts/:id',
        update: 'PUT /alerts/:id',
        delete: 'DELETE /alerts/:id',
        assign: 'PUT /alerts/:id/assign',
        resolve: 'PUT /alerts/:id/resolve',
        ignore: 'PUT /alerts/:id/ignore',
        stats: 'GET /alerts/stats',
        similar: 'GET /alerts/:id/similar（返回 similar + weights）',
        getSimilarityWeights: 'GET /alerts/similarity/weights',
        updateSimilarityWeights: 'PUT /alerts/similarity/weights',
        normalizedFields: 'id,title,type,level,status,riskScore,riskLevel,speciesType,targetType,location,latitude,longitude,borderSection,sourceChannel,createdAt'
      },
      tasks: {
        list: 'GET /tasks',
        create: 'POST /tasks',
        getById: 'GET /tasks/:id（含 collaborationStatus/collaborationNotes/jointCaseNo/jointDepartments/timeline）',
        update: 'PUT /tasks/:id',
        delete: 'DELETE /tasks/:id',
        updateCollaboration: 'PUT /tasks/:id/collaboration',
        getCollaborationTimeline: 'GET /tasks/:id/collaboration/timeline'
      },
      devices: {
        list: 'GET /devices',
        create: 'POST /devices',
        getById: 'GET /devices/:id',
        update: 'PUT /devices/:id',
        delete: 'DELETE /devices/:id'
      },
      gis: {
        pollutionSources: 'GET /gis/pollution-sources',
        monitoringPoints: 'GET /gis/monitoring-points',
        reportPollution: 'POST /gis/report-pollution'
      },
      wildlife: {
        smugglingAlerts: 'GET /wildlife/smuggling-alerts',
        smugglingStats: 'GET /wildlife/smuggling-alerts/stats'
      },
      fusion: {
        events: 'GET /fusion/events',
        overview: 'GET /fusion/closed-loop/overview',
        dispatch: 'POST /fusion/dispatch'
      }
    }
  });
});

// ==================== 404 处理 ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.path
  });
});

// ==================== 错误处理中间件 ====================
app.use((err, req, res, next) => {
  logger.error('未处理的错误:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== 服务器启动 ====================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const httpServer = http.createServer(app);
initWebSocket(httpServer, `${apiPrefix}/ws/command`);

httpServer.listen(PORT, HOST, () => {
  logger.info(`🚀 服务器运行在 http://${HOST}:${PORT}`);
  logger.info(`📚 API 文档: http://${HOST}:${PORT}/api/docs`);
  logger.info(`💚 健康检查: http://${HOST}:${PORT}/health`);
  logger.info(`📡 WebSocket: ws://${HOST}:${PORT}${apiPrefix}/ws/command`);
  logger.info(`环境: ${process.env.NODE_ENV}`);
});

export default app;
