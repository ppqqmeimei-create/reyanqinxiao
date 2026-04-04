import express from 'express';
import Task, { TaskEvidence, TaskCollaborationFlow } from '../models/Task.js';
import Alert from '../models/Alert.js';
import { authenticate } from '../middleware/auth.js';
import { writeAuditLog } from '../services/auditLog.js';

const router = express.Router();

async function createCollaborationFlow({ task, fromStatus, toStatus, action, operatorId, notes, payload }) {
  await TaskCollaborationFlow.create({
    task_id: task.id,
    from_status: fromStatus || null,
    to_status: toStatus,
    action,
    operator_id: operatorId || null,
    department: task.joint_departments?.[0] || null,
    notes: notes || null,
    payload: payload || null
  });
}

function normalizeTaskView(input) {
  const row = input?.toJSON ? input.toJSON() : (input || {});
  const timeline = (row.timeline || row.collaborationFlows || []).map((f) => ({
    ...f,
    toStatus: f.toStatus || f.to_status,
    fromStatus: f.fromStatus || f.from_status,
    createdAt: f.createdAt || f.created_at,
    actionLabel: (f.action === 'collaboration_status_update' ? '协同状态更新' : (f.action === 'task_create_with_collaboration' ? '任务创建' : '状态流转'))
  }));

  return {
    ...row,
    warningId: row.warningId ?? row.warning_id ?? row.alert_id ?? row.alertId ?? null,
    alertId: row.alertId ?? row.alert_id ?? row.warning_id ?? row.warningId ?? null,
    jointCaseNo: row.jointCaseNo ?? row.joint_case_no ?? null,
    jointDepartments: row.jointDepartments ?? row.joint_departments ?? [],
    collaborationStatus: row.collaborationStatus ?? row.collaboration_status ?? 'none',
    collaborationNotes: row.collaborationNotes ?? row.collaboration_notes ?? null,
    timeline
  };
}

/**
 * GET /api/v1/tasks
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;
    const { status, type, assigned_to, collaboration_status } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (assigned_to) where.assigned_to = assigned_to;
    if (collaboration_status) where.collaboration_status = collaboration_status;

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: [
        { model: Alert, as: 'alert', attributes: ['id', 'title', 'level'] }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        tasks: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取任务列表失败', error: error.message });
  }
});

/**
 * GET /api/v1/tasks/stats/summary
 */
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const total = await Task.count();
    const pending = await Task.count({ where: { status: 'pending' } });
    const inProgress = await Task.count({ where: { status: 'in-progress' } });
    const completed = await Task.count({ where: { status: 'completed' } });
    const cancelled = await Task.count({ where: { status: 'cancelled' } });

    res.json({
      success: true,
      data: {
        overall: { total, pending, inProgress, completed, cancelled }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取任务统计失败', error: error.message });
  }
});

/**
 * GET /api/v1/tasks/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: Alert, as: 'alert' },
        { model: TaskEvidence, as: 'evidence' },
        {
          model: TaskCollaborationFlow,
          as: 'collaborationFlows',
          separate: true,
          order: [['created_at', 'DESC']],
          limit: 30
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    const view = normalizeTaskView(task);
    res.json({ success: true, data: { task: view } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取任务详情失败', error: error.message });
  }
});

/**
 * POST /api/v1/tasks
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title, description, type, priority, alert_id, warning_id,
      assigned_to, location, latitude, longitude, deadline,
      joint_case_no, joint_departments, collaboration_status, collaboration_notes
    } = req.body;

    if (!title || !type || !assigned_to || !location) {
      return res.status(400).json({ success: false, message: '缺少必要字段' });
    }

    const task = await Task.create({
      title,
      description,
      type,
      priority: priority || 'medium',
      alert_id: alert_id || warning_id || null,
      warning_id: warning_id || alert_id || null,
      assigned_to,
      created_by: req.user.id,
      location,
      latitude,
      longitude,
      deadline,
      status: 'pending',
      progress: 0,
      joint_case_no: joint_case_no || null,
      joint_departments: Array.isArray(joint_departments) ? joint_departments : null,
      collaboration_status: collaboration_status || 'none',
      collaboration_notes: collaboration_notes || null
    });

    if (task.collaboration_status !== 'none') {
      await createCollaborationFlow({
        task,
        fromStatus: 'none',
        toStatus: task.collaboration_status,
        action: 'task_create_with_collaboration',
        operatorId: req.user?.id,
        notes: collaboration_notes,
        payload: { joint_case_no: task.joint_case_no, joint_departments: task.joint_departments }
      });
    }

    writeAuditLog('task.create', {
      operator: req.user?.id,
      taskId: task.id,
      alertId: task.alert_id || task.warning_id || null,
      assignedTo: assigned_to
    });

    res.status(201).json({ success: true, message: '任务创建成功', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建任务失败', error: error.message });
  }
});

/**
 * PUT /api/v1/tasks/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    await task.update({ ...req.body, updated_at: new Date() });

    res.json({ success: true, message: '任务更新成功', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新任务失败', error: error.message });
  }
});

/**
 * DELETE /api/v1/tasks/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    await task.destroy();
    res.json({ success: true, message: '任务删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除任务失败', error: error.message });
  }
});

/**
 * PUT /api/v1/tasks/:id/start
 */
router.put('/:id/start', authenticate, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    await task.update({ status: 'in-progress', start_time: new Date() });

    writeAuditLog('task.start', {
      operator: req.user?.id,
      taskId: task.id
    });

    res.json({ success: true, message: '任务已开始', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: '开始任务失败', error: error.message });
  }
});

/**
 * PUT /api/v1/tasks/:id/complete
 */
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const { completion_notes, evidence = [] } = req.body;

    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    await task.update({
      status: 'completed',
      end_time: new Date(),
      progress: 100,
      completion_notes
    });

    if (Array.isArray(evidence) && evidence.length > 0) {
      await TaskEvidence.bulkCreate(
        evidence.map((e) => ({
          task_id: task.id,
          type: e.type || 'image',
          url: e.url,
          description: e.description || ''
        }))
      );
    }

    writeAuditLog('task.complete', {
      operator: req.user?.id,
      taskId: task.id,
      evidenceCount: Array.isArray(evidence) ? evidence.length : 0
    });

    res.json({ success: true, message: '任务已完成', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: '完成任务失败', error: error.message });
  }
});

/**
 * PUT /api/v1/tasks/:id/progress
 */
router.put('/:id/progress', authenticate, async (req, res) => {
  try {
    const { progress } = req.body;
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ success: false, message: '进度值必须在0-100之间' });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    await task.update({ progress });

    writeAuditLog('task.progress', {
      operator: req.user?.id,
      taskId: task.id,
      progress
    });

    res.json({ success: true, message: '进度更新成功', data: { task } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新进度失败', error: error.message });
  }
});

/**
 * PUT /api/v1/tasks/:id/collaboration
 * 更新联合执法协同状态并记录时间线
 */
router.put('/:id/collaboration', authenticate, async (req, res) => {
  try {
    const { collaboration_status, collaboration_notes, joint_case_no, joint_departments } = req.body;

    if (!collaboration_status) {
      return res.status(400).json({ success: false, message: 'collaboration_status 为必填项' });
    }

    const allow = ['none', 'pending', 'in-progress', 'done'];
    if (!allow.includes(collaboration_status)) {
      return res.status(400).json({ success: false, message: 'collaboration_status 不合法' });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    const prev = task.collaboration_status || 'none';

    await task.update({
      collaboration_status,
      collaboration_notes: collaboration_notes ?? task.collaboration_notes,
      joint_case_no: joint_case_no ?? task.joint_case_no,
      joint_departments: Array.isArray(joint_departments) ? joint_departments : task.joint_departments
    });

    await createCollaborationFlow({
      task,
      fromStatus: prev,
      toStatus: collaboration_status,
      action: 'collaboration_status_update',
      operatorId: req.user?.id,
      notes: collaboration_notes,
      payload: {
        joint_case_no: task.joint_case_no,
        joint_departments: task.joint_departments
      }
    });

    writeAuditLog('task.collaboration.update', {
      operator: req.user?.id,
      taskId: task.id,
      fromStatus: prev,
      toStatus: collaboration_status
    });

    const latestFlows = await TaskCollaborationFlow.findAll({
      where: { task_id: task.id },
      order: [['created_at', 'DESC']],
      limit: 30
    });

    const timeline = latestFlows.map((f) => ({
      ...f.toJSON(),
      toStatus: f.toJSON().to_status,
      fromStatus: f.toJSON().from_status,
      createdAt: f.toJSON().created_at
    }));

    const taskView = normalizeTaskView({ ...task.toJSON(), timeline });

    res.json({ success: true, message: '协同状态更新成功', data: { task: taskView, timeline } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新协同状态失败', error: error.message });
  }
});

/**
 * GET /api/v1/tasks/:id/collaboration/timeline
 * 查询联合执法流转时间线
 */
router.get('/:id/collaboration/timeline', authenticate, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' });
    }

    const flows = await TaskCollaborationFlow.findAll({
      where: { task_id: task.id },
      order: [['created_at', 'DESC']],
      limit: 100
    });

    const timeline = flows.map((f) => ({
      ...f.toJSON(),
      toStatus: f.toJSON().to_status,
      fromStatus: f.toJSON().from_status,
      createdAt: f.toJSON().created_at
    }));

    res.json({ success: true, data: { flows, timeline } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取协同流转时间线失败', error: error.message });
  }
});

export default router;
