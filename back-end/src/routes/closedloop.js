import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createTaskFromWarning,
  updateTaskProgress,
  uploadEvidence,
  getResearchAggregation
} from '../services/closedLoopService.js';

const router = express.Router();

/**
 * POST /api/v1/tasks/createFromWarning
 */
router.post('/tasks/createFromWarning', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { warning_id, assigned_to, deadline } = req.body;
    if (!warning_id || !assigned_to) {
      return res.status(400).json({ success: false, message: 'warning_id 和 assigned_to 为必填' });
    }

    const task = await createTaskFromWarning({
      warning_id,
      assigned_to,
      deadline,
      created_by: req.user.id
    });

    res.status(201).json({ success: true, message: '预警转任务成功', data: { task } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/v1/tasks/updateProgress
 */
router.put('/tasks/updateProgress', authenticate, authorize('admin', 'manager', 'inspector'), async (req, res) => {
  try {
    const { task_id, progress, notes } = req.body;
    if (!task_id || progress === undefined) {
      return res.status(400).json({ success: false, message: 'task_id 和 progress 为必填' });
    }

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ success: false, message: 'progress 必须在0-100之间' });
    }

    const task = await updateTaskProgress({
      task_id,
      progress,
      notes,
      operator: req.user.id
    });

    res.json({ success: true, message: '任务进度更新成功', data: { task } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/evidence/upload
 */
router.post('/evidence/upload', authenticate, authorize('admin', 'manager', 'inspector'), async (req, res) => {
  try {
    const { task_id, warning_id, type, url, description } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'url 为必填' });
    }

    const evidence = await uploadEvidence({ task_id, warning_id, type, url, description });

    res.status(201).json({
      success: true,
      message: '证据上传成功',
      data: {
        evidence,
        binding: {
          task_id: evidence.task_id,
          warning_id: warning_id || null
        }
      }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/analysis/aggregation
 */
router.get('/analysis/aggregation', authenticate, authorize('admin', 'manager', 'inspector'), async (req, res) => {
  try {
    const { start_at, end_at, hotspot_precision, hotspot_limit } = req.query;

    const data = await getResearchAggregation({ start_at, end_at, hotspot_precision, hotspot_limit });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: '聚合分析查询失败', error: error.message });
  }
});

export default router;
