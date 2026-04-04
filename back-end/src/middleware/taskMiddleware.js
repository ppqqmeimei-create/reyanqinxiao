import rateLimit from 'express-rate-limit';
import logger from './logger.js';

/**
 * 速率限制中间件
 * 防止API滥用和DDoS攻击
 */
export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,  // 时间窗口 (毫秒)
    max,       // 最大请求数
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,  // 返回速率限制信息在 RateLimit-* 头中
    legacyHeaders: false,   // 禁用 X-RateLimit-* 头
    skip: (req) => {
      // 跳过健康检查请求
      return req.path === '/health';
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: req.rateLimit.resetTime
      });
    }
  });
};

/**
 * 输入验证中间件
 * 验证请求体中的数据
 */
export const validateTaskInput = (req, res, next) => {
  const { title, description, category, type, priority } = req.body;

  // 验证标题
  if (title) {
    if (typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        message: '标题必须是字符串'
      });
    }
    if (title.length < 2 || title.length > 200) {
      return res.status(400).json({
        success: false,
        message: '标题长度必须在2-200字符之间'
      });
    }
  }

  // 验证描述
  if (description) {
    if (typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        message: '描述必须是字符串'
      });
    }
    if (description.length > 5000) {
      return res.status(400).json({
        success: false,
        message: '描述长度不能超过5000字符'
      });
    }
  }

  // 验证分类
  if (category) {
    const validCategories = ['ecology', 'fooddrug', 'enforcement'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: '无效的任务分类'
      });
    }
  }

  // 验证类型
  if (type) {
    const validTypes = [
      'quick-sampling', 'complete-sampling', 'inspection', 'monitoring',
      'product-inspection', 'recall-management', 'compliance-check', 'enterprise-audit',
      'case-investigation', 'evidence-collection', 'penalty-execution', 'follow-up-inspection'
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的任务类型'
      });
    }
  }

  // 验证优先级
  if (priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: '无效的优先级'
      });
    }
  }

  next();
};

/**
 * 权限检查中间件
 * 验证用户是否有权限访问任务
 */
export const checkTaskPermission = async (req, res, next) => {
  try {
    const { Task } = await import('../models/Task.js');
    const taskId = req.params.id;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 检查用户是否是任务的分配人或创建者或管理员
    const isAssignee = task.assigned_to?.toString() === req.user.id;
    const isCreator = task.created_by?.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAssignee && !isCreator && !isAdmin) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} to task ${taskId}`);
      return res.status(403).json({
        success: false,
        message: '您没有权限访问此任务'
      });
    }

    // 将任务对象附加到请求中
    req.task = task;
    next();
  } catch (error) {
    logger.error(`Permission check error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '权限检查失败'
    });
  }
};

/**
 * 错误处理中间件
 * 统一处理所有错误
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // 处理特定类型的错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: err.errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: '无效的ID格式'
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: '数据已存在'
    });
  }

  // 默认错误响应
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 异步错误包装器
 * 捕获异步函数中的错误
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  createRateLimiter,
  validateTaskInput,
  checkTaskPermission,
  errorHandler,
  asyncHandler
};
