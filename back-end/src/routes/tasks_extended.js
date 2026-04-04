import express from 'express';
import Task from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/tasks/by-category/:category
 * 按分类获取任务列表
 */
router.get('/by-category/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // 验证分类
    const validCategories = ['ecology', 'fooddrug', 'enforcement'];
    if (!validCategories.includes(category)) {
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取分类任务列表失败',
      error: error.message
    });
  }
});

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
      byCategory: {
        ecology: await Task.countDocuments({ category: 'ecology' }),
        fooddrug: await Task.countDocuments({ category: 'fooddrug' }),
        enforcement: await Task.countDocuments({ category: 'enforcement' })
      },
      byPriority: {
        low: await Task.countDocuments({ priority: 'low' }),
        medium: await Task.countDocuments({ priority: 'medium' }),
        high: await Task.countDocuments({ priority: 'high' }),
        urgent: await Task.countDocuments({ priority: 'urgent' })
      }
    };

    res.json({
      success: true,
      data: { stats }
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

    const stats = {
      total: await Task.countDocuments({ category }),
      pending: await Task.countDocuments({ category, status: 'pending' }),
      inProgress: await Task.countDocuments({ category, status: 'in-progress' }),
      completed: await Task.countDocuments({ category, status: 'completed' }),
      byPriority: {
        low: await Task.countDocuments({ category, priority: 'low' }),
        medium: await Task.countDocuments({ category, priority: 'medium' }),
        high: await Task.countDocuments({ category, priority: 'high' }),
        urgent: await Task.countDocuments({ category, priority: 'urgent' })
      }
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
        taskId: task._id,
        progress: task.progress,
        status: task.status,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        completionRate: task.progress
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
 * GET /api/v1/tasks/categories/list
 * 获取任务分类列表
 */
router.get('/categories/list', authenticate, async (req, res) => {
  try {
    const categories = {
      ecology: [
        { code: 'quick-sampling', name: '快速取样', icon: '🧪' },
        { code: 'complete-sampling', name: '完整取样', icon: '🔬' },
        { code: 'inspection', name: '现场检查', icon: '📋' },
        { code: 'monitoring', name: '实时监测', icon: '📊' }
      ],
      fooddrug: [
        { code: 'product-inspection', name: '产品检查', icon: '🏥' },
        { code: 'recall-management', name: '召回管理', icon: '⚠️' },
        { code: 'compliance-check', name: '合规检查', icon: '✅' },
        { code: 'enterprise-audit', name: '企业审计', icon: '🔍' }
      ],
      enforcement: [
        { code: 'case-investigation', name: '案件调查', icon: '👮' },
        { code: 'evidence-collection', name: '证据采集', icon: '📸' },
        { code: 'penalty-execution', name: '处罚执行', icon: '⚖️' },
        { code: 'follow-up-inspection', name: '后续检查', icon: '🔎' }
      ]
    };

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

/**
 * POST /api/v1/tasks
 * 创建任务（带分类验证）
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, type, category, status, assigned_to, location, priority, estimated_hours } = req.body;

    // 验证必要字段
    if (!title || !type || !category || !assigned_to || !location) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    // 验证分类
    const validCategories = ['ecology', 'fooddrug', 'enforcement'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: '无效的任务分类'
      });
    }

    const task = new Task({
      title,
      type,
      category,
      status: status || 'pending',
      assigned_to,
      location,
      priority: priority || 'medium',
      estimated_hours,
      created_by: req.user.id,
      progress: 0
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: { task }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建任务失败',
      error: error.message
    });
  }
});

export default router;
