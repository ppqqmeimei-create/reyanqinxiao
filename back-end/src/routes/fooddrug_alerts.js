import express from 'express';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/alerts/fooddrug
 * 获取食品药品预警列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, level, type } = req.query;
    const skip = (page - 1) * limit;

    let query = { dimension: 'fooddrug' };
    if (status) query.status = status;
    if (level) query.level = level;
    if (type) query.type = type;

    const alerts = await Alert.find(query)
      .populate('assigned_to', 'name username role')
      .populate('created_by', 'name username')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);

    res.json({
      success: true,
      data: {
        alerts,
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
      message: '获取食品药品预警列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/alerts/fooddrug
 * 创建食品药品预警
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, level, type, product_name, enterprise_name, risk_score, description } = req.body;

    // 验证必要字段
    if (!title || !type || !product_name) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    const alert = new Alert({
      title,
      level: level || 'warning',
      type,
      dimension: 'fooddrug',
      category: 'fooddrug',
      location: enterprise_name || '未知',
      risk_score: risk_score || 0,
      description,
      created_by: req.user.id,
      status: 'pending'
    });

    await alert.save();

    res.status(201).json({
      success: true,
      message: '食品药品预警创建成功',
      data: { alert }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建食品药品预警失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/alerts/fooddrug/:id
 * 获取食品药品预警详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('assigned_to', 'name username role phone')
      .populate('created_by', 'name username')
      .populate('resolved_by', 'name username');

    if (!alert || alert.dimension !== 'fooddrug') {
      return res.status(404).json({
        success: false,
        message: '预警不存在'
      });
    }

    res.json({
      success: true,
      data: { alert }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取预警详情失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/alerts/fooddrug/:id
 * 更新食品药品预警
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, assigned_to, resolution_notes } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status,
        assigned_to,
        resolution_notes,
        resolved_by: status === 'resolved' ? req.user.id : undefined,
        resolved_at: status === 'resolved' ? new Date() : undefined
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: '预警不存在'
      });
    }

    res.json({
      success: true,
      message: '预警更新成功',
      data: { alert }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新预警失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/alerts/fooddrug/:id
 * 删除食品药品预警
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: '预警不存在'
      });
    }

    res.json({
      success: true,
      message: '预警删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除预警失败',
      error: error.message
    });
  }
});

export default router;
