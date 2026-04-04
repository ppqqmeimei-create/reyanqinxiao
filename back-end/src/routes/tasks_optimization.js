import express from 'express';
import Task from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';
import {
  createRateLimiter,
  validateTaskInput,
  checkTaskPermission,
  asyncHandler
} from '../middleware/taskMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// 应用速率限制
const limiter = createRateLimiter(15 * 60 * 1000, 100);  // 15分钟100个请求
router.use(limiter);

/**
 * GET /api/v1/tasks/by-category/:category
 * 按分类获取任务列表
 */
router.get('/by-category/:category', authenticate, asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  // 记录请求
  logger.logRequest(req);

  // 验证分类
  const validCategories = ['ecology', 'fooddrug', 'enforcement'];
  if (!validCategories.includes(category)) {
    logger.warn(`Invalid category requested: ${category}`, { userId: req.user.id });
    return res.status(400).json({
      success: false,
      message: '无效的任务分类'
    });
  }

  let query = { category };
  if (status) query.status = status;

  const tasks = await Task.find(query)
    .populate('assigned_to', 'name username role')
    .populate('created_by', 'name username')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(query);

  logger.info(`Retrieved ${tasks.length} tasks for category: ${category}`, {
    userId: req.user.id,
    category,
    total
  });

  res.json({
    success: true,
    data: {
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

/**
 * GET /api/v1/tasks/stats/summary
 * 获取任务统计摘要
 */
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const stats = {
      total: await Task.countDocuments(),
      pending: await Task.countDocuments({ status: 'pending' }),
      inProgress: await Task.countDocuments({ status: 'in-progress' }),
      completed: await Task.countDocuments({ status: 'completed' }),
      cancelled: await Task.countDocuments({ status: 'cancelled' })
    };

    // 按分类统计
    const categoryStats = {};
    const categories = ['ecology', 'fooddrug', 'enforcement'];
    
    for (const category of categories) {
      categoryStats[category] = {
        total: await Task.countDocuments({ category }),
        pending: await Task.countDocuments({ category, status: 'pending' }),
        inProgress: await Task.countDocuments({ category, status: 'in-progress' }),
        completed: await Task.countDocuments({ category, status: 'completed' })
      };
    }

    res.json({
      success: true,
      data: {
        overall: stats,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取任务统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/tasks/stats/by-category/:category
 * 按分类获取任务统计
 */
router.get('/stats/by-category/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;

    // 验证分类
    const validCategories = ['ecology', 'fooddrug', 'enforcement'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: '无效的任务分类'
      });
    }

    const stats = {
      total: await Task.countDocuments({ category }),
      pending: await Task.countDocuments({ category, status: 'pending' }),
      inProgress: await Task.countDocuments({ category, status: 'in-progress' }),
      completed: await Task.countDocuments({ category, status: 'completed' }),
      cancelled: await Task.countDocuments({ category, status: 'cancelled' })
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取分类任务统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/tasks/:id/progress
 * 获取任务进度
 */
router.get('/:id/progress', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: {
        taskId: task.id,
        progress: task.progress,
        status: task.status,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取任务进度失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/tasks/:id/progress
 * 更新任务进度
 */
router.put('/:id/progress', authenticate, async (req, res) => {
  try {
    const { progress, status, actualHours } = req.body;

    // 验证进度值
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return res.status(400).json({
        success: false,
        message: '进度值必须在0-100之间'
      });
    }

    const updateData = {};
    if (progress !== undefined) updateData.progress = progress;
    if (status) updateData.status = status;
    if (actualHours !== undefined) updateData.actual_hours = actualHours;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      message: '任务进度更新成功',
      data: { task }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新任务进度失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/tasks
 * 创建任务（带验证）
 */
router.post('/', authenticate, validateTaskInput, asyncHandler(async (req, res) => {
  const { title, type, category, status, assigned_to, location, deadline, priority, estimated_hours } = req.body;

  // 记录请求
  logger.logRequest(req);

  // 数据验证
  if (!title || !type || !category || !assigned_to || !location) {
    logger.warn('Task creation failed: missing required fields', { userId: req.user.id });
    return res.status(400).json({
      success: false,
      message: '缺少必要字段: title, type, category, assigned_to, location'
    });
  }

  const task = new Task({
    title,
    type,
    category,
    status: status || 'pending',
    assigned_to,
    location,
    deadline,
    priority: priority || 'medium',
    estimated_hours,
    created_by: req.user.id,
    progress: 0
  });

  await task.save();

  // 记录任务创建
  logger.logTaskOperation('CREATE', task.id, req.user.id, {
    title,
    category,
    type,
    priority
  });

  res.status(201).json({
    success: true,
    message: '任务创建成功',
    data: { task }
  });
}));

/**
 * GET /api/v1/tasks/categories/list
 * 获取任务分类列表
 */
router.get('/categories/list', authenticate, async (req, res) => {
  try {
    const categories = [
      {
        key: 'ecology',
        name: '环保任务',
        icon: '🌍',
        color: '#10b981',
        types: [
          { key: 'quick-sampling', name: '快速取样' },
          { key: 'complete-sampling', name: '完整取样' },
          { key: 'inspection', name: '现场检查' },
          { key: 'monitoring', name: '实时监测' }
        ]
      },
      {
        key: 'fooddrug',
        name: '食品药品任务',
        icon: '🏥',
        color: '#f59e0b',
        types: [
          { key: 'product-inspection', name: '产品检查' },
          { key: 'recall-management', name: '召回管理' },
          { key: 'compliance-check', name: '合规检查' },
          { key: 'enterprise-audit', name: '企业审计' }
        ]
      },
      {
        key: 'enforcement',
        name: '执法任务',
        icon: '👮',
        color: '#ef4444',
        types: [
          { key: 'case-investigation', name: '案件调查' },
          { key: 'evidence-collection', name: '证据采集' },
          { key: 'penalty-execution', name: '处罚执行' },
          { key: 'follow-up-inspection', name: '后续检查' }
        ]
      }
    ];

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取任务分类列表失败',
      error: error.message
    });
  }
});

export default router;
