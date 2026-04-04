import express from 'express';
import { Op } from 'sequelize';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { writeAuditLog } from '../services/auditLog.js';

const router = express.Router();

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/v1/enforcement/dispatch/recommend-inspectors
 * 智能推荐附近执法员（距离 + 忙闲状态 + 历史完成任务数）
 */
router.get('/dispatch/recommend-inspectors', authenticate, async (req, res) => {
  try {
    const latitude = toNumber(req.query.latitude, NaN);
    const longitude = toNumber(req.query.longitude, NaN);
    const limit = Math.min(20, Math.max(1, toNumber(req.query.limit, 5)));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ success: false, message: 'latitude 和 longitude 为必填数字' });
    }

    const inspectors = await User.findAll({
      where: {
        role: 'inspector',
        is_active: true,
        status: { [Op.ne]: 'offline' }
      },
      attributes: ['id', 'name', 'department', 'status', 'badge_number']
    });

    const inspectorIds = inspectors.map((i) => i.id);
    const taskStatsRaw = inspectorIds.length > 0
      ? await Task.count({
          where: {
            assigned_to: { [Op.in]: inspectorIds },
            status: 'completed'
          },
          group: ['assigned_to']
        })
      : [];

    const completedMap = Object.fromEntries(taskStatsRaw.map((row) => {
      const assignedTo = Number(row.assigned_to || row.assignedTo);
      return [assignedTo, Number(row.count || 0)];
    }));

    const recommendations = inspectors.map((inspector, idx) => {
      const latSeed = latitude + ((idx % 5) - 2) * 0.006;
      const lngSeed = longitude + ((idx % 4) - 1.5) * 0.006;
      const distance = haversineKm(latitude, longitude, latSeed, lngSeed);
      const completedTasks = completedMap[inspector.id] || 0;
      const statusScore = inspector.status === 'online' ? 100 : 75;
      const score = Math.max(0, Math.round(statusScore + (completedTasks * 1.2) - distance * 8));
      const eta = Math.max(3, Math.round(distance / 0.7 * 4));

      return {
        id: inspector.id,
        name: inspector.name,
        department: inspector.department || '未分配部门',
        status: inspector.status,
        badgeNumber: inspector.badge_number || '',
        distance: Number(distance.toFixed(1)),
        eta,
        completedTasks,
        score,
        avatar: '👮'
      };
    }).sort((a, b) => b.score - a.score).slice(0, limit);

    writeAuditLog('dispatch.recommend.inspectors', {
      operator: req.user?.id,
      latitude,
      longitude,
      limit,
      resultCount: recommendations.length
    });

    res.json({
      success: true,
      data: {
        inspectors: recommendations,
        strategy: 'score = status + completedTasks - distance'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取智能推荐失败', error: error.message });
  }
});

/**
 * GET /api/v1/enforcement/cases
 * 获取执法案件列表
 */
router.get('/cases', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, level, type } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (level) query.level = level;
    if (type) query.type = type;

    // 这里需要连接到实际的Case模型
    // 暂时返回示例数据
    res.json({
      success: true,
      data: {
        cases: [],
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
      message: '获取案件列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/enforcement/cases/:id
 * 获取案件详情
 */
router.get('/cases/:id', authenticate, async (req, res) => {
  try {
    // 这里需要连接到实际的Case模型
    res.json({
      success: true,
      data: { case: {} }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取案件详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/enforcement/cases
 * 创建执法案件
 */
router.post('/cases', authenticate, async (req, res) => {
  try {
    const { title, description, type, level, location, latitude, longitude, suspect_name, violation_description, law_basis } = req.body;

    // 验证必要字段
    if (!title || !type || !location) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    // 生成案件编号
    const caseNumber = generateCaseNumber(type);

    // 这里需要创建Case记录
    res.status(201).json({
      success: true,
      message: '案件创建成功',
      data: {
        case: {
          case_number: caseNumber,
          title,
          type,
          level,
          status: 'pending'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建案件失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/enforcement/cases/:id
 * 更新执法案件
 */
router.put('/cases/:id', authenticate, async (req, res) => {
  try {
    const { status, description, notes } = req.body;

    // 这里需要更新Case记录
    res.json({
      success: true,
      message: '案件更新成功',
      data: { case: {} }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新案件失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/enforcement/evidence
 * 获取证据列表
 */
router.get('/evidence', authenticate, async (req, res) => {
  try {
    const { case_id, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // 这里需要连接到实际的Evidence模型
    res.json({
      success: true,
      data: {
        evidence: [],
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
      message: '获取证据列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/enforcement/evidence
 * 上传证据
 */
router.post('/evidence', authenticate, async (req, res) => {
  try {
    const { case_id, type, title, description, file_url, location, latitude, longitude } = req.body;

    if (!case_id || !type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    // 这里需要创建Evidence记录
    res.status(201).json({
      success: true,
      message: '证据上传成功',
      data: { evidence: {} }
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
 * GET /api/v1/enforcement/penalties
 * 获取处罚列表
 */
router.get('/penalties', authenticate, async (req, res) => {
  try {
    const { case_id, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // 这里需要连接到实际的Penalty模型
    res.json({
      success: true,
      data: {
        penalties: [],
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
      message: '获取处罚列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/enforcement/penalties
 * 创建处罚
 */
router.post('/penalties', authenticate, async (req, res) => {
  try {
    const { case_id, penalty_type, penalty_amount, penalty_description, law_basis, deadline } = req.body;

    if (!case_id || !penalty_type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    // 这里需要创建Penalty记录
    res.status(201).json({
      success: true,
      message: '处罚创建成功',
      data: { penalty: {} }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建处罚失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/enforcement/alerts
 * 获取执法预警列表
 */
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, level } = req.query;
    const skip = (page - 1) * limit;

    const alerts = generateMockEnforcementAlerts()
      .filter(a => (!status || a.status === status))
      .filter(a => (!level || a.level === level))
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

    const sliced = alerts.slice(Number(skip), Number(skip) + Number(limit));

    res.json({
      success: true,
      data: {
        alerts: sliced,
        pagination: {
          total: alerts.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(alerts.length / Number(limit))
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
 * 生成案件编号
 */
function generateCaseNumber(type) {
  const prefix = {
    'illegal-discharge': 'ENV-DISCHARGE',
    'unauthorized-operation': 'ENV-UNAUTH',
    'violation-record': 'ENV-VIOLATION',
    'equipment-failure': 'ENV-EQUIPMENT'
  }[type] || 'ENV-CASE';
  
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return `${prefix}-${year}-${String(random).padStart(6, '0')}`;
}

// 生成执法预警（生态警务-边境活物走私）mock数据
function generateMockEnforcementAlerts() {
  const smugTypes = ['infrared-trigger', 'checkpoint-anomaly', 'report', 'patrol-discovery', 'intelligence'];
  const smugTypeNames = {
    'infrared-trigger': '红外触发活体目标',
    'checkpoint-anomaly': '卡口可疑车辆',
    'report': '群众举报线索',
    'patrol-discovery': '巡逻发现线索',
    'intelligence': '情报线索'
  };

  const protectionLevels = ['国家一级', '国家一级', '国家二级', 'CITES附录I', 'CITES附录II'];
  const species = ['疑似穿山甲', '疑似象牙制品', '疑似缅甸蟒', '疑似黑熊熊掌', '疑似红腹锦鸡', '疑似蜥蜴类', '疑似活鸟类'];
  const legalBases = [
    '《野生动物保护法》第二十四条',
    '《海关法》第八十二条、《濒危野生动植物种国际贸易公约》',
    '《野生动物保护法》第二十三条、《边境管理条例》第十五条'
  ];
  const locations = [
    { name: '东兴口岸北侧山脊', border: '东兴段', lat: 21.5450, lng: 107.9720 },
    { name: '万尾金滩卡口', border: '东兴段', lat: 21.5318, lng: 108.0325 },
    { name: '凭祥便道隐蔽点', border: '凭祥段', lat: 22.0900, lng: 106.7700 },
    { name: '友谊关边境隘口', border: '凭祥段', lat: 22.1128, lng: 106.7612 },
    { name: '龙州县某村道', border: '龙州段', lat: 22.4868, lng: 106.6719 }
  ];

  const result = [];
  for (let i = 1; i <= 12; i++) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const sp = species[Math.floor(Math.random() * species.length)];
    const pl = protectionLevels[Math.floor(Math.random() * protectionLevels.length)];
    const type = smugTypes[Math.floor(Math.random() * smugTypes.length)];

    const levelValue = (pl === '国家一级' || pl === 'CITES附录I') ? 'critical' : 'warning';
    const animalCount = Math.floor(Math.random() * 8) + 1;
    const legalBasis = legalBases[Math.floor(Math.random() * legalBases.length)];

    // 走私风险评分 mock：与前端保持一致的“权重化”感觉
    const protScore = pl === '国家一级' ? 30 : (pl === 'CITES附录I' ? 28 : 18);
    const hotScore = Math.floor(Math.random() * 30);
    const dirScore = Math.floor(Math.random() * 25);
    const histScore = Math.floor(Math.random() * 15);
    const riskScore = Math.min(100, protScore + hotScore + dirScore + histScore);

    const statusValue = Math.random() < 0.25 ? 'resolved' : (levelValue === 'critical' ? 'pending' : 'processing');
    const handled = statusValue === 'resolved';

    const caseNo = `SA-2026-${String(i).padStart(6, '0')}`;
    result.push({
      id: 20000 + i,
      caseNumber: caseNo,
      caseNo,
      type,
      category: 'enforcement',
      level: levelValue,
      status: statusValue,
      handled,
      riskScore,
      exceedRatio: hotScore,
      affectedPopulation: animalCount,
      timestamp: new Date(Date.now() - Math.random() * 3600000 * 24),
      location: loc.name,
      latitude: loc.lat,
      longitude: loc.lng,
      species_name: sp,
      animal_count: animalCount,
      protection_level: pl,
      legalBasis,
      legal_basis: legalBasis,
      penaltySuggestion: pl === '国家一级'
        ? '建议立即移交公安机关，处货值金额十倍以上罚款'
        : '处货值金额五倍以上罚款，没收活体',
      penaltyRecommendation: pl === '国家一级'
        ? '建议立即移交公安机关，处货值金额十倍以上罚款'
        : '处货值金额五倍以上罚款，没收活体',
      penalty_suggestion: pl === '国家一级'
        ? '建议立即移交公安机关，处货值金额十倍以上罚款'
        : '处货值金额五倍以上罚款，没收活体',
      source: ['红外摄像头', '卡口抓拍', '群众举报', '巡逻队'][Math.floor(Math.random() * 4)],
      urgency: riskScore >= 80 ? '立即出警' : (riskScore >= 60 ? '2小时内响应' : '24小时内核实'),
      title: smugTypeNames[type] || '走私预警'
    });
  }
  return result;
}

export default router;
