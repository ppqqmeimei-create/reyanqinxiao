/**
 * 任务API - 安全防护中间件
 * 文件: back-end/src/middleware/taskSecurity.js
 * 功能: 提供任务API的安全防护
 */

import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * 请求速率限制中间件
 */
export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,  // 时间窗口（毫秒）
    max,       // 最大请求数
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,  // 返回速率限制信息在 RateLimit-* 头中
    legacyHeaders: false,   // 禁用 X-RateLimit-* 头
    skip: (req) => {
      // 跳过某些请求（例如管理员）
      return req.user && req.user.role === 'admin';
    },
    keyGenerator: (req) => {
      // 使用用户ID作为限制键
      return req.user ? req.user.id : req.ip;
    }
  });
};

/**
 * 输入验证中间件
 */
export const validateTaskInput = (req, res, next) => {
  const { title, description, type, category, priority } = req.body;
  
  // 验证标题
  if (title) {
    if (typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        message: '标题必须是字符串'
      });
    }
    if (title.length < 5 || title.length > 200) {
      return res.status(400).json({
        success: false,
        message: '标题长度必须在5-200个字符之间'
      });
    }
    // 防止XSS攻击
    if (/<script|javascript:|onerror|onclick/i.test(title)) {
      return res.status(400).json({
        success: false,
        message: '标题包含非法内容'
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
        message: '描述长度不能超过5000个字符'
      });
    }
    // 防止XSS攻击
    if (/<script|javascript:|onerror|onclick/i.test(description)) {
      return res.status(400).json({
        success: false,
        message: '描述包含非法内容'
      });
    }
  }
  
  // 验证任务类型
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
 */
export const checkTaskPermission = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    
    if (!taskId) {
      return next();
    }
    
    // 这里需要导入Task模型
    // const Task = require('../models/Task.js').default;
    // const task = await Task.findById(taskId);
    
    // 暂时使用模拟实现
    const task = {
      id: taskId,
      assigned_to: req.user.id,
      created_by: req.user.id
    };
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }
    
    // 检查用户是否有权限访问此任务
    const isAssignee = task.assigned_to && task.assigned_to.toString() === req.user.id;
    const isCreator = task.created_by && task.created_by.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAssignee && !isCreator && !isAdmin) {
      logger.warn(`User ${req.user.id} attempted unauthorized access to task ${taskId}`);
      return res.status(403).json({
        success: false,
        message: '您没有权限访问此任务'
      });
    }
    
    // 将任务信息附加到请求对象
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
 * 日志记录中间件
 */
export const logTaskOperation = (operation) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // 记录操作日志
      const logData = {
        timestamp: new Date().toISOString(),
        userId: req.user ? req.user.id : 'anonymous',
        operation,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        taskId: req.params.id || req.body.id,
        category: req.body.category,
        type: req.body.type
      };
      
      if (res.statusCode >= 400) {
        logger.error(`Task operation failed: ${JSON.stringify(logData)}`);
      } else {
        logger.info(`Task operation completed: ${JSON.stringify(logData)}`);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * 异常处理中间件
 */
export const handleTaskError = (err, req, res, next) => {
  logger.error(`Task API error: ${err.message}`, err);
  
  // 处理验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // 处理MongoDB错误
  if (err.name === 'MongoError') {
    return res.status(500).json({
      success: false,
      message: '数据库错误'
    });
  }
  
  // 处理其他错误
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '服务器错误',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
};

/**
 * 审计日志记录
 */
export const auditLog = async (taskId, action, oldValue, newValue, userId) => {
  try {
    // 这里需要导入AuditLog模型
    // const AuditLog = require('../models/AuditLog.js').default;
    
    const auditData = {
      task_id: taskId,
      action,
      old_value: oldValue,
      new_value: newValue,
      changed_by: userId,
      created_at: new Date()
    };
    
    logger.info(`Audit log: ${JSON.stringify(auditData)}`);
    
    // await AuditLog.create(auditData);
  } catch (error) {
    logger.error(`Failed to create audit log: ${error.message}`);
  }
};

export default {
  createRateLimiter,
  validateTaskInput,
  checkTaskPermission,
  logTaskOperation,
  handleTaskError,
  auditLog
};
