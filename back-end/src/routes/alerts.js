import express from 'express';
import { fn, col, Op, QueryTypes } from 'sequelize';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { writeAuditLog } from '../services/auditLog.js';
import { sequelize } from '../config/database.js';

const router = express.Router();

async function loadSimilarityWeights() {
  try {
    const rows = await sequelize.query(
      'SELECT `key`, `value` FROM system_params WHERE `group` = :groupName',
      { replacements: { groupName: 'similarity_weights' }, type: QueryTypes.SELECT }
    );

    const map = Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));
    return {
      type: Number.isFinite(map.type) ? map.type : 25,
      level: Number.isFinite(map.level) ? map.level : 20,
      category: Number.isFinite(map.category) ? map.category : 10,
      location: Number.isFinite(map.location) ? map.location : 35,
      risk: Number.isFinite(map.risk) ? map.risk : 10
    };
  } catch (error) {
    return {
      type: 25,
      level: 20,
      category: 10,
      location: 35,
      risk: 10
    };
  }
}

function validateWeights(input = {}) {
  const allowKeys = ['type', 'level', 'category', 'location', 'risk'];
  const next = {};

  for (const key of allowKeys) {
    if (input[key] === undefined) continue;
    const n = Number(input[key]);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      const err = new Error(`${key} 权重必须是 0-100 的数字`);
      err.statusCode = 400;
      throw err;
    }
    next[key] = n;
  }

  return next;
}

async function saveSimilarityWeights(partialWeights = {}) {
  const keys = Object.keys(partialWeights);
  if (keys.length === 0) return loadSimilarityWeights();

  for (const key of keys) {
    await sequelize.query(
      `INSERT INTO system_params (\`group\`, \`key\`, \`value\`, description)
       VALUES (:groupName, :key, :value, :description)
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), description = VALUES(description)`,
      {
        replacements: {
          groupName: 'similarity_weights',
          key,
          value: String(partialWeights[key]),
          description: `相似案件权重:${key}`
        },
        type: QueryTypes.INSERT
      }
    );
  }

  return loadSimilarityWeights();
}

function mapLevelToRiskLevel(level) {
  const map = { critical: 'high', warning: 'medium', info: 'low' };
  return map[level] || 'unknown';
}

function normalizeAlertView(input) {
  const row = input?.toJSON ? input.toJSON() : (input || {});
  return {
    ...row,
    id: row.id,
    title: row.title,
    type: row.type,
    level: row.level,
    status: row.status,
    riskScore: row.riskScore ?? row.risk_score ?? 0,
    riskLevel: row.riskLevel ?? row.risk_level ?? mapLevelToRiskLevel(row.level),
    speciesType: row.speciesType ?? row.species_type ?? null,
    targetType: row.targetType ?? row.target_type ?? 'unknown',
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    borderSection: row.borderSection ?? row.border_section ?? null,
    sourceChannel: row.sourceChannel ?? row.source_channel ?? row.source ?? 'device',
    createdAt: row.createdAt ?? row.created_at
  };
}

/**
 * GET /api/v1/alerts
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;
    const { status, level, type } = req.query;

    const where = {};
    if (status) where.status = status;
    if (level) where.level = level;
    if (type) where.type = type;

    const { count, rows } = await Alert.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit
    });

    const alerts = rows.map(normalizeAlertView);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取预警列表失败', error: error.message });
  }
});

/**
 * GET /api/v1/alerts/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const total = await Alert.count();

    const byLevelRows = await Alert.findAll({
      attributes: ['level', [fn('COUNT', col('id')), 'count']],
      group: ['level'],
      raw: true
    });

    const byStatusRows = await Alert.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    const by_level = Object.fromEntries(byLevelRows.map((r) => [r.level, Number(r.count)]));
    const by_status = Object.fromEntries(byStatusRows.map((r) => [r.status, Number(r.count)]));

    res.json({ success: true, data: { total, by_level, by_status } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计失败', error: error.message });
  }
});

/**
 * GET /api/v1/alerts/similarity/weights
 * 查询相似案件权重配置
 */
router.get('/similarity/weights', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const weights = await loadSimilarityWeights();
    res.json({ success: true, data: { weights } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取权重配置失败', error: error.message });
  }
});

/**
 * PUT /api/v1/alerts/similarity/weights
 * 更新相似案件权重配置
 */
router.put('/similarity/weights', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const next = validateWeights(req.body || {});
    if (Object.keys(next).length === 0) {
      return res.status(400).json({ success: false, message: '至少提供一个权重字段' });
    }

    const weights = await saveSimilarityWeights(next);

    writeAuditLog('alert.similarity.weights.update', {
      operator: req.user?.id,
      patch: next,
      weights
    });

    res.json({ success: true, message: '权重更新成功', data: { weights } });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: '更新权重配置失败', error: error.message });
  }
});

/**
 * GET /api/v1/alerts/:id/similar
 * 规则版相似案件（类型/等级/位置/风险分）
 */
router.get('/:id/similar', authenticate, async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit || 5)));
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: '预警不存在' });
    }

    const candidates = await Alert.findAll({
      where: {
        id: { [Op.ne]: alert.id },
        created_at: { [Op.gte]: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365) }
      },
      order: [['created_at', 'DESC']],
      limit: 200
    });

    const baseLat = Number(alert.latitude || 0);
    const baseLng = Number(alert.longitude || 0);
    const baseRisk = Number(alert.risk_score || 0);

    const weights = await loadSimilarityWeights();

    const similar = candidates.map((item) => {
      const lat = Number(item.latitude || 0);
      const lng = Number(item.longitude || 0);
      const risk = Number(item.risk_score || 0);

      const geoDistance = Math.sqrt(Math.pow(baseLat - lat, 2) + Math.pow(baseLng - lng, 2));
      const locationScore = Math.max(0, weights.location - geoDistance * 120);
      const typeScore = item.type === alert.type ? weights.type : 0;
      const levelScore = item.level === alert.level ? weights.level : 0;
      const categoryScore = item.category === alert.category ? weights.category : 0;
      const riskScore = Math.max(0, weights.risk - Math.abs(baseRisk - risk) / 10);
      const score = Math.round(typeScore + levelScore + categoryScore + locationScore + riskScore);

      const matchedDimensions = [
        item.type === alert.type ? 'type' : null,
        item.level === alert.level ? 'level' : null,
        item.category === alert.category ? 'category' : null,
        locationScore > 0 ? 'location' : null,
        riskScore > 0 ? 'risk' : null
      ].filter(Boolean);

      return {
        ...normalizeAlertView(item),
        similarityScore: score,
        similarityExplain: {
          matchedDimensions,
          geoDistance,
          scoreBreakdown: {
            type: Math.round(typeScore),
            level: Math.round(levelScore),
            category: Math.round(categoryScore),
            location: Math.round(locationScore),
            risk: Math.round(riskScore)
          }
        }
      };
    }).filter((x) => x.similarityScore >= 20)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    writeAuditLog('alert.similar.query', {
      operator: req.user?.id,
      alertId: Number(req.params.id),
      resultCount: similar.length
    });

    res.json({
      success: true,
      data: {
        reference: normalizeAlertView(alert),
        weights,
        similarityMeta: {
          threshold: 20,
          formula: 'type + level + category + location + risk'
        },
        similar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取相似案件失败', error: error.message });
  }
});

/**
 * GET /api/v1/alerts/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: '预警不存在' });
    }

    const view = normalizeAlertView(alert);
    res.json({ success: true, data: { alert: view } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取预警详情失败', error: error.message });
  }
});

/**
 * POST /api/v1/alerts
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title, description, level, type, category, location,
      latitude, longitude, risk_score, pollutant_type,
      pollutant_value, standard_value, affected_population, source
    } = req.body;

    if (!title || !level || !type || !category || !location) {
      return res.status(400).json({ success: false, message: '缺少必要字段' });
    }

    const alert = await Alert.create({
      title,
      description,
      level,
      type,
      category,
      location,
      latitude,
      longitude,
      risk_score: risk_score || 0,
      pollutant_type,
      pollutant_value,
      standard_value,
      exceed_ratio: pollutant_value && standard_value ? (pollutant_value / standard_value).toFixed(2) : null,
      affected_population,
      source: source || 'manual',
      created_by: req.user.id
    });

    res.status(201).json({ success: true, message: '预警创建成功', data: { alert } });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建预警失败', error: error.message });
  }
});

/**
 * PUT /api/v1/alerts/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: '预警不存在' });
    }

    await alert.update({ ...req.body, updated_at: new Date() });
    res.json({ success: true, message: '预警更新成功', data: { alert } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新预警失败', error: error.message });
  }
});

/**
 * DELETE /api/v1/alerts/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: '预警不存在' });
    }

    await alert.destroy();
    res.json({ success: true, message: '预警删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除预警失败', error: error.message });
  }
});

/**
 * PUT /api/v1/alerts/:id/assign
 */
router.put('/:id/assign', authenticate, async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, message: '缺少用户ID' });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: '预警不存在' });
    }

    await alert.update({ assigned_to: user_id, status: 'processing' });

    writeAuditLog('alert.assign', {
      operator: req.user?.id,
      alertId: Number(req.params.id),
      assignedTo: Number(user_id)
    });

    res.json({ success: true, message: '预警已分配', data: { alert } });
  } catch (error) {
    res.status(500).json({ success: false, message: '分配预警失败', error: error.message });
  }
});

/**
 * PUT /api/v1/alerts/:id/resolve
 */
router.put('/:id/resolve', authenticate, async (req, res) => {
  try {
    const { resolution_notes } = req.body;

    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: '预警不存在' });
    }

    await alert.update({
      status: 'resolved',
      resolved_at: new Date(),
      resolved_by: req.user.id,
      resolution_notes
    });

    writeAuditLog('alert.resolve', {
      operator: req.user?.id,
      alertId: Number(req.params.id)
    });

    res.json({ success: true, message: '预警已解决', data: { alert } });
  } catch (error) {
    res.status(500).json({ success: false, message: '解决预警失败', error: error.message });
  }
});

/**
 * PUT /api/v1/alerts/:id/ignore
 */
router.put('/:id/ignore', authenticate, async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: '预警不存在' });
    }

    await alert.update({ status: 'ignored' });

    writeAuditLog('alert.ignore', {
      operator: req.user?.id,
      alertId: Number(req.params.id)
    });

    res.json({ success: true, message: '预警已忽略', data: { alert } });
  } catch (error) {
    res.status(500).json({ success: false, message: '忽略预警失败', error: error.message });
  }
});

/**
 * GET /api/v1/alerts/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const total = await Alert.count();

    const byLevelRows = await Alert.findAll({
      attributes: ['level', [fn('COUNT', col('id')), 'count']],
      group: ['level'],
      raw: true
    });

    const byStatusRows = await Alert.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    const by_level = Object.fromEntries(byLevelRows.map((r) => [r.level, Number(r.count)]));
    const by_status = Object.fromEntries(byStatusRows.map((r) => [r.status, Number(r.count)]));

    res.json({ success: true, data: { total, by_level, by_status } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计失败', error: error.message });
  }
});

export default router;
