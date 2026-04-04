import { QueryTypes } from 'sequelize';
import Alert from '../models/Alert.js';
import { Task, TaskEvidence } from '../models/Task.js';
import { sequelize } from '../config/database.js';

export async function createTaskFromWarning({ warning_id, assigned_to, deadline, created_by }) {
  const alert = await Alert.findByPk(warning_id);
  if (!alert) {
    const err = new Error('预警不存在');
    err.statusCode = 404;
    throw err;
  }

  const task = await Task.create({
    title: `[闭环处置] ${alert.title}`,
    description: alert.description || '由预警自动转任务',
    type: 'inspection',
    priority: alert.level === 'critical' ? 'urgent' : 'high',
    alert_id: alert.id,
    assigned_to,
    created_by,
    location: alert.location,
    latitude: alert.latitude,
    longitude: alert.longitude,
    deadline: deadline || null,
    status: 'pending',
    progress: 0
  });

  await alert.update({ status: 'processing', assigned_to });
  return task;
}

export async function updateTaskProgress({ task_id, progress, notes, operator }) {
  const task = await Task.findByPk(task_id);
  if (!task) {
    const err = new Error('任务不存在');
    err.statusCode = 404;
    throw err;
  }

  const nextStatus = Number(progress) >= 100 ? 'completed' : (Number(progress) > 0 ? 'in-progress' : task.status);
  const payload = {
    progress: Number(progress),
    status: nextStatus,
    notes: notes || task.notes
  };

  if (Number(progress) >= 100) {
    payload.end_time = new Date();
    payload.completion_notes = notes || '一线执法员完成处置';
  }

  await task.update(payload);

  if (task.alert_id && Number(progress) >= 100) {
    const alert = await Alert.findByPk(task.alert_id);
    if (alert) {
      await alert.update({
        status: 'resolved',
        resolved_by: operator,
        resolved_at: new Date(),
        resolution_notes: payload.completion_notes
      });
    }
  }

  return task;
}

export async function uploadEvidence({ task_id, warning_id, type, url, description }) {
  let resolvedTaskId = task_id;

  if (!resolvedTaskId && warning_id) {
    const latestTask = await Task.findOne({
      where: { alert_id: warning_id },
      order: [['created_at', 'DESC']]
    });
    resolvedTaskId = latestTask?.id;
  }

  if (!resolvedTaskId) {
    const err = new Error('请提供 task_id 或可关联任务的 warning_id');
    err.statusCode = 400;
    throw err;
  }

  const evidence = await TaskEvidence.create({
    task_id: resolvedTaskId,
    type: type || 'image',
    url,
    description: description || ''
  });

  return evidence;
}

export async function getResearchAggregation({ start_at, end_at, hotspot_precision = 2, hotspot_limit = 10 }) {
  const replacements = { start_at: start_at || '1970-01-01', end_at: end_at || '2999-12-31' };

  const risk_distribution = await sequelize.query(
    `SELECT level, COUNT(*) AS count
     FROM alerts
     WHERE created_at BETWEEN :start_at AND :end_at
     GROUP BY level`,
    { replacements, type: QueryTypes.SELECT }
  );

  const hotspot_sql = `
    SELECT
      ROUND(latitude, ${Number(hotspot_precision)}) AS lat_grid,
      ROUND(longitude, ${Number(hotspot_precision)}) AS lng_grid,
      COUNT(*) AS warning_count,
      ROUND(AVG(risk_score), 1) AS avg_risk
    FROM alerts
    WHERE latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND created_at BETWEEN :start_at AND :end_at
    GROUP BY ROUND(latitude, ${Number(hotspot_precision)}), ROUND(longitude, ${Number(hotspot_precision)})
    ORDER BY warning_count DESC, avg_risk DESC
    LIMIT ${Number(hotspot_limit)}
  `;

  const hotspot_areas = await sequelize.query(hotspot_sql, {
    replacements,
    type: QueryTypes.SELECT
  });

  const high_frequency_periods = await sequelize.query(
    `SELECT HOUR(created_at) AS hour_bucket, COUNT(*) AS count
     FROM alerts
     WHERE created_at BETWEEN :start_at AND :end_at
     GROUP BY HOUR(created_at)
     ORDER BY count DESC`,
    { replacements, type: QueryTypes.SELECT }
  );

  return {
    risk_distribution,
    hotspot_areas,
    high_frequency_periods
  };
}
