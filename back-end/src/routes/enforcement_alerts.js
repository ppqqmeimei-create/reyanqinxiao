import express from 'express';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/alerts/enforcement
 * 获取执法预警列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, level, type, officer_id } = req.query;
    const skip = (page - 1) * limit;

    let query = { dimension: 'enforcement' };
    if (status) query.status = status;
    if (level) query.level = level;
    if (type) query.type = type;
    if (officer_id) query.assigned_to = officer_id;

    const alerts = await Alert.find(query)
      .populate('assigned_to', 'name username role badge_number')
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
      message: '获取执法预警列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/alerts/enforcement
 * 创建执法预警
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, level, type, location, latitude, longitude, risk_score, description, officer_id } = req.body;

    // 验证必要字段
    if (!title || !type || !location || !officer_id) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    // 生成案件编号
    const caseNumber = `CASE-${Date.now()}`;

    const alert = new Alert({
      title,
      level: level || 'warning',
      type,
      dimension: 'enforcement',
      category: 'enforcement',
      location,
      latitude,
      longitude,
      risk_score: risk_score || 0,
      description,
      created_by: req.user.id,
      assigned_to: officer_id,
      status: 'pending',
      urgency: level === 'critical' ? '紧急' : '一般'
    });

    await alert.save();

    res.status(201).json({
      success: true,
      message: '执法预警创建成功',
      data: { alert, caseNumber }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建执法预警失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/alerts/enforcement/:id
 * 获取执法预警详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('assigned_to', 'name username role badge_number phone')
      .populate('created_by', 'name username')
      .populate('resolved_by', 'name username');

    if (!alert || alert.dimension !== 'enforcement') {
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
 * PUT /api/v1/alerts/enforcement/:id
 * 更新执法预警
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { status, assigned_to, resolution_notes, evidence_count } = req.body;

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
 * POST /api/v1/alerts/enforcement/:id/evidence
 * 上传执法证据
 */
router.post('/:id/evidence', authenticate, async (req, res) => {
  try {
    const { type, url, description } = req.body;

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: '预警不存在'
      });
    }

    // 这里可以扩展为实际的证据存储逻辑
    res.json({
      success: true,
      message: '证据上传成功',
      data: {
        evidence: {
          type,
          url,
          description,
          uploaded_at: new Date()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '上传证据失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/alerts/enforcement/:id/penalty
 * 记录执法处罚
 */
router.post('/:id/penalty', authenticate, async (req, res) => {
  try {
    const { penalty_type, penalty_amount, penalty_description } = req.body;

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: '预警不存在'
      });
    }

    // 这里可以扩展为实际的处罚记录逻辑
    res.json({
      success: true,
      message: '处罚记录成功',
      data: {
        penalty: {
          penalty_type,
          penalty_amount,
          penalty_description,
          status: 'issued',
          issued_at: new Date()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '记录处罚失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/alerts/enforcement/:id
 * 删除执法预警
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
