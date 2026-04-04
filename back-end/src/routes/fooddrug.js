import express from 'express';
import Alert from '../models/Alert.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/fooddrug/alerts
 * 获取食品药品预警列表
 */
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, level, type, enterprise_id } = req.query;
    const skip = (page - 1) * limit;

    let query = { category: 'fooddrug' };
    if (status) query.status = status;
    if (level) query.level = level;
    if (type) query.type = type;
    if (enterprise_id) query.enterprise_id = enterprise_id;

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
 * GET /api/v1/fooddrug/alerts/:id
 * 获取食品药品预警详情
 */
router.get('/alerts/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('assigned_to', 'name username role phone')
      .populate('created_by', 'name username')
      .populate('resolved_by', 'name username');

    if (!alert) {
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
 * POST /api/v1/fooddrug/alerts
 * 创建食品药品预警
 */
router.post('/alerts', authenticate, async (req, res) => {
  try {
    const { title, description, type, level, enterprise_id, product_id, location, latitude, longitude, issue_description, affected_count } = req.body;

    // 验证必要字段
    if (!title || !type || !level || !location) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    const alert = new Alert({
      title,
      description,
      type,
      level,
      status: 'pending',
      category: 'fooddrug',
      enterprise_id,
      product_id,
      location,
      latitude,
      longitude,
      issue_description,
      affected_count,
      created_by: req.user.id,
      risk_score: calculateRiskScore(level, affected_count)
    });

    await alert.save();

    res.status(201).json({
      success: true,
      message: '预警创建成功',
      data: { alert }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建预警失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/fooddrug/alerts/:id
 * 更新食品药品预警
 */
router.put('/alerts/:id', authenticate, async (req, res) => {
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
 * GET /api/v1/fooddrug/recalls
 * 获取召回列表
 */
router.get('/recalls', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    // 这里需要连接到实际的Recall模型
    // 暂时返回示例数据
    res.json({
      success: true,
      data: {
        recalls: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取召回列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/fooddrug/recalls
 * 创建召回
 */
router.post('/recalls', authenticate, async (req, res) => {
  try {
    const { product_id, reason, level, recall_date, deadline } = req.body;

    if (!product_id || !reason || !recall_date) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    // 这里需要创建Recall记录
    res.status(201).json({
      success: true,
      message: '召回创建成功',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建召回失败',
      error: error.message
    });
  }
});

/**
 * 计算风险评分
 */
function calculateRiskScore(level, affectedCount = 0) {
  let score = 0;
  
  // 根据级别计算基础分数
  switch(level) {
    case 'critical':
      score = 80;
      break;
    case 'warning':
      score = 50;
      break;
    case 'info':
      score = 20;
      break;
    default:
      score = 0;
  }
  
  // 根据影响数量调整分数
  if (affectedCount > 1000) {
    score = Math.min(100, score + 20);
  } else if (affectedCount > 100) {
    score = Math.min(100, score + 10);
  }
  
  return score;
}

export default router;
