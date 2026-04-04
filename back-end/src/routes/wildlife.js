// ============================================
// 热眼擒枭——边境活物走私智能防控系统
// 野生动物走私案件 & 走私预警 路由
// ============================================
import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const GUANGXI_KEY_PORTS = [
  { name: '友谊关', latitude: 22.1128, longitude: 106.7612 },
  { name: '东兴口岸', latitude: 21.5450, longitude: 107.9720 }
];

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getNearbyKeyPort(latitude, longitude, radiusKm = 5) {
  return GUANGXI_KEY_PORTS.find(port =>
    calculateDistanceKm(latitude, longitude, port.latitude, port.longitude) <= radiusKm
  ) || null;
}

function getBoundaryMarkerSensitivity(borderSection = '', location = '') {
  const key = `${borderSection}${location}`;
  if (key.includes('友谊关') || key.includes('东兴')) return 0.95;
  if (key.includes('那坡') || key.includes('龙州')) return 0.85;
  return 0.75;
}

function getForestCanopyOcclusion(borderSection = '', location = '') {
  const key = `${borderSection}${location}`;
  if (key.includes('那坡')) return 0.90;
  if (key.includes('龙州')) return 0.82;
  if (key.includes('凭祥')) return 0.76;
  return 0.70;
}

function calculateGuangxiRiskScore(payload) {
  const {
    protection_level,
    hotspot_level,
    historical_case_count,
    nearby_officers,
    border_section,
    location,
    latitude,
    longitude,
    target_moving_direction,
    device_count,
    device_types
  } = payload;

  // ── 权重：物种珍稀度30% | 靠近边境线距离30% | 历史走私频次20% | 监控设备完整度20% ──

  // 1. 物种珍稀度（满分30）
  const RARITY_SCORES = {
    '国家一级': 30, 'CITES附录I': 29,
    '国家二级': 22, 'CITES附录II': 20,
    '省级': 14,     '未知': 10
  };
  const rarityScore = RARITY_SCORES[protection_level] ?? 10;

  // 2. 靠近边境线距离（满分30）
  const GUANGXI_BORDER_REFS = [
    { latitude: 22.1128, longitude: 106.7612 },
    { latitude: 21.5450, longitude: 107.9720 },
    { latitude: 22.4868, longitude: 106.6719 },
    { latitude: 23.4200, longitude: 105.8400 },
    { latitude: 23.1340, longitude: 106.4170 }
  ];
  let borderDistanceScore = 2;
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!isNaN(lat) && !isNaN(lon)) {
    const minDistKm = Math.min(
      ...GUANGXI_BORDER_REFS.map(r => calculateDistanceKm(lat, lon, r.latitude, r.longitude))
    );
    if      (minDistKm <= 1)  borderDistanceScore = 30;
    else if (minDistKm <= 3)  borderDistanceScore = 24;
    else if (minDistKm <= 5)  borderDistanceScore = 18;
    else if (minDistKm <= 10) borderDistanceScore = 12;
    else if (minDistKm <= 20) borderDistanceScore = 6;
    else                       borderDistanceScore = 2;
  } else {
    const key = `${border_section || ''}${location || ''}`;
    if (/友谊关|东兴|浦寨/.test(key))    borderDistanceScore = 26;
    else if (/水口|那坡|靖西/.test(key))  borderDistanceScore = 20;
    else if (/边境|凭祥|龙州/.test(key))  borderDistanceScore = 14;
    else                                    borderDistanceScore = 6;
  }

  // 3. 历史走私频次（满分20）
  const historyScore = Math.min(Math.round((Number(historical_case_count) || 0) * 1.5), 20);

  // 4. 监控设备完整度（满分20）
  const KEY_DEVICES = ['infrared-camera', 'life-radar', 'fiber-vibration', 'checkpoint-camera', 'drone'];
  let devTypes = [];
  if (Array.isArray(device_types)) devTypes = device_types;
  else if (typeof device_types === 'string' && device_types.startsWith('[')) {
    try { devTypes = JSON.parse(device_types); } catch { devTypes = []; }
  }
  const devCount = Number(device_count) || 0;
  const coveredKey = KEY_DEVICES.filter(d => devTypes.includes(d)).length;
  let deviceScore = Math.min(devCount * 2, 10) + Math.round((coveredKey / KEY_DEVICES.length) * 10);
  if (devCount === 0 && devTypes.length === 0) {
    deviceScore = Math.min((Number(hotspot_level) || 0) * 3, 15);
  }
  deviceScore = Math.min(deviceScore, 20);

  // 汇总 + 口岸5km加成
  let score = rarityScore + borderDistanceScore + historyScore + deviceScore;
  let guangxiBorderBoost = 0;
  if (!isNaN(lat) && !isNaN(lon)) {
    const nearPort = GUANGXI_KEY_PORTS.find(
      p => calculateDistanceKm(lat, lon, p.latitude, p.longitude) <= 5
    );
    if (nearPort) guangxiBorderBoost = Math.round(score * 0.2);
  }
  const finalScore = Math.min(Math.round(score) + guangxiBorderBoost, 100);

  let riskLevel = 'low';
  if      (finalScore >= 90) riskLevel = 'extreme';
  else if (finalScore >= 70) riskLevel = 'high';
  else if (finalScore >= 50) riskLevel = 'medium';

  const markerSensitivity = getBoundaryMarkerSensitivity(border_section, location);
  const canopyOcclusion   = getForestCanopyOcclusion(border_section, location);

  return {
    risk_score:  finalScore,
    risk_level:  riskLevel,
    score_breakdown: {
      rarity_score_30pct:           rarityScore,
      border_distance_score_30pct:  borderDistanceScore,
      history_score_20pct:          historyScore,
      device_integrity_score_20pct: deviceScore,
      guangxi_port_boost:           guangxiBorderBoost
    },
    border_marker_sensitivity: markerSensitivity,
    border_forest_occlusion:   canopyOcclusion,
    key_port_boost_applied:    guangxiBorderBoost > 0,
    key_port_name: GUANGXI_KEY_PORTS.find(
      p => !isNaN(lat) && calculateDistanceKm(lat, lon, p.latitude, p.longitude) <= 5
    )?.name || null
  };
}

function enrichLegalBasisForGuangxiSpecies(speciesName = '', baseLegalBasis = '') {
  const text = speciesName || '';
  let speciesCategory = null;

  if (/食蟹猴|猕猴|猴/.test(text)) speciesCategory = 'primate';
  else if (/鹦鹉|鹩哥|鹩/.test(text)) speciesCategory = 'parrot';
  else if (/黄花梨|紫檀|沉香|红木|名贵木材|木材/.test(text)) speciesCategory = 'precious_timber';

  if (!speciesCategory) {
    return {
      legal_basis: baseLegalBasis,
      guangxi_regulation_matched: false,
      species_category: null
    };
  }

  const guangxiRegulationMap = {
    primate: '《广西壮族自治区野生动物保护条例》第二十八条、第三十二条',
    parrot: '《广西壮族自治区野生动物保护条例》第二十六条、第三十二条',
    precious_timber: '《广西壮族自治区野生动物保护条例》第三十四条'
  };

  const guangxiLaw = guangxiRegulationMap[speciesCategory];
  const legal = baseLegalBasis && baseLegalBasis.trim().length > 0
    ? `${baseLegalBasis}；${guangxiLaw}`
    : guangxiLaw;

  return {
    legal_basis: legal,
    guangxi_regulation_matched: true,
    species_category: speciesCategory
  };
}


// ─── 走私预警 ───────────────────────────────

/**
 * GET /api/v1/wildlife/smuggling-alerts
 * 获取走私预警列表（按风险评分降序）
 */
router.get('/smuggling-alerts', authenticate, async (req, res) => {
  try {
    const { level, status, border_section, limit = 50, offset = 0 } = req.query;
    // Mock data — replace with DB query when connected
    const rawAlerts = generateMockSmugglingAlerts();
    const alerts = rawAlerts.map(alert => {
      const riskPatch = calculateGuangxiRiskScore(alert);
      const legalPatch = enrichLegalBasisForGuangxiSpecies(alert.species_name, alert.legal_basis);
      return { ...alert, ...riskPatch, ...legalPatch };
    });
    const filtered = alerts
      .filter(a => (!level || a.level === level))
      .filter(a => (!status || a.status === status))
      .filter(a => (!border_section || a.border_section === border_section))
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: {
        alerts: filtered,
        total: filtered.length,
        counts: {
          critical: alerts.filter(a => a.level === 'critical').length,
          warning:  alerts.filter(a => a.level === 'warning').length,
          pending:  alerts.filter(a => a.status === 'pending').length,
          resolved: alerts.filter(a => a.status === 'resolved').length
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/wildlife/smuggling-alerts/stats
 * 当日防控数据看板统计（含本月广西段边境线巡逻覆盖率）
 */
router.get('/smuggling-alerts/stats', authenticate, async (req, res) => {
  const GUANGXI_BORDER_TOTAL_KM = 1020;
  const borderSections = [
    { section: '东兴段',   totalKm: 60,  patrolledKm: 58 },
    { section: '凭祥段',   totalKm: 97,  patrolledKm: 91 },
    { section: '龙州段',   totalKm: 183, patrolledKm: 152 },
    { section: '那坡段',   totalKm: 207, patrolledKm: 163 },
    { section: '靖西段',   totalKm: 152, patrolledKm: 118 },
    { section: '大新段',   totalKm: 113, patrolledKm: 84 },
    { section: '宁明段',   totalKm: 146, patrolledKm: 103 },
    { section: '防城港段', totalKm: 62,  patrolledKm: 59 }
  ];
  const totalPatrolledKm = borderSections.reduce((s, b) => s + b.patrolledKm, 0);
  const patrolCoverageRate = Math.round((totalPatrolledKm / GUANGXI_BORDER_TOTAL_KM) * 100 * 10) / 10;

  res.json({
    success: true,
    data: {
      today_wildlife_alerts: 7,
      online_officers: 12,
      pending_leads: 3,
      checkpoint_anomalies: 2,
      cases_this_month: 18,
      animals_seized_this_month: 34,
      patrol_coverage: {
        guangxi_border_total_km: GUANGXI_BORDER_TOTAL_KM,
        total_patrolled_km: totalPatrolledKm,
        coverage_rate_percent: patrolCoverageRate,
        label: `本月广西段边境线巡逻覆盖率 ${patrolCoverageRate}%`,
        by_section: borderSections.map(b => ({
          ...b,
          coverage_percent: Math.round((b.patrolledKm / b.totalKm) * 100 * 10) / 10
        }))
      }
    }
  });
});

/**
 * POST /api/v1/wildlife/smuggling-alerts/:id/dispatch
 * 一键派警
 */
router.post('/smuggling-alerts/:id/dispatch', authenticate, async (req, res) => {
  const { id } = req.params;
  const { officer_ids, notes } = req.body;
  res.json({
    success: true,
    message: '派警指令已下达',
    data: { alert_id: id, dispatched_officers: officer_ids, dispatch_time: new Date() }
  });
});

/**
 * POST /api/v1/wildlife/smuggling-alerts/:id/resolve
 * 确认处置预警
 */
router.post('/smuggling-alerts/:id/resolve', authenticate, async (req, res) => {
  const { id } = req.params;
  res.json({ success: true, message: '预警已确认处置', data: { alert_id: id, resolved_at: new Date() } });
});

// ─── 野生动物案件 ────────────────────────────

/**
 * GET /api/v1/wildlife/cases
 * 获取走私案件列表
 */
router.get('/cases', authenticate, async (req, res) => {
  try {
    const { status, priority, limit = 20, offset = 0 } = req.query;
    const cases = generateMockWildlifeCases();
    const filtered = cases
      .filter(c => (!status || c.status === status))
      .filter(c => (!priority || c.priority === priority))
      .slice(Number(offset), Number(offset) + Number(limit));
    res.json({ success: true, data: { cases: filtered, total: filtered.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/wildlife/cases
 * 新建走私案件
 */
router.post('/cases', authenticate, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const caseNumber = `WL-${year}-${String(Date.now()).slice(-6)}`;
    const newCase = { ...req.body, case_number: caseNumber, status: 'reporting', created_at: new Date() };
    res.status(201).json({ success: true, message: '案件已创建', data: { case: newCase } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/wildlife/cases/:id
 */
router.get('/cases/:id', authenticate, async (req, res) => {
  const cases = generateMockWildlifeCases();
  const found = cases.find(c => c.id === Number(req.params.id));
  if (!found) return res.status(404).json({ success: false, message: '案件不存在' });
  res.json({ success: true, data: { case: found } });
});

/**
 * PUT /api/v1/wildlife/cases/:id
 */
router.put('/cases/:id', authenticate, async (req, res) => {
  res.json({ success: true, message: '案件已更新', data: { case_id: req.params.id, ...req.body } });
});

// ─── 生物样本 ────────────────────────────────

/**
 * GET /api/v1/wildlife/biological-samples
 */
router.get('/biological-samples', authenticate, async (req, res) => {
  res.json({ success: true, data: { samples: generateMockBioSamples() } });
});

/**
 * POST /api/v1/wildlife/biological-samples
 */
router.post('/biological-samples', authenticate, async (req, res) => {
  const sampleNumber = `BS-${Date.now()}`;
  res.status(201).json({
    success: true, message: '样本已录入',
    data: { sample: { ...req.body, sample_number: sampleNumber, lab_status: '待送检', created_at: new Date() } }
  });
});

// ─── 边境防控设备 ────────────────────────────

/**
 * GET /api/v1/wildlife/border-devices
 */
router.get('/border-devices', authenticate, async (req, res) => {
  res.json({ success: true, data: { devices: generateMockBorderDevices() } });
});

/**
 * POST /api/v1/wildlife/border-devices/:id/remote-control
 * 远程控制边境设备
 */
router.post('/border-devices/:id/remote-control', authenticate, async (req, res) => {
  const { action } = req.body; // e.g. 'capture', 'rotate', 'restart'
  res.json({ success: true, message: `远程指令「${action}」已下发`, data: { device_id: req.params.id, action, sent_at: new Date() } });
});

// ─── Mock 数据生成 ────────────────────────────

function generateMockSmugglingAlerts() {
  return [
    {
      id: 1001, alert_code: 'SA-2026-000101',
      alert_type: 'checkpoint-anomaly', level: 'critical', status: 'pending',
      species_name: '食蟹猴', animal_count: 12,
      protection_level: 'CITES附录II',
      target_moving_direction: '北偏东15°',
      location: '东兴市万尾金滩沿海便道发现疑似非法运输食蟹猴', border_section: '东兴段',
      latitude: 21.5318, longitude: 108.0325,
      risk_score: 94, hotspot_level: 5, historical_case_count: 7,
      nearby_officers: 5,
      legal_basis: '《野生动物保护法》第二十三条；《濒危野生动植物种国际贸易公约》',
      penalty_suggestion: '立即拦截车辆，固定证据后移送刑侦',
      law_enforcement_unit: '广西环食药侦查总队东兴边境支队',
      created_at: new Date(Date.now() - 600000)
    },
    {
      id: 1002, alert_code: 'SA-2026-000102',
      alert_type: 'infrared-trigger', level: 'critical', status: 'pending',
      species_name: '疑似穿山甲', animal_count: 3,
      protection_level: '国家一级',
      target_moving_direction: '西向',
      location: '凭祥市友谊关附近红外相机抓拍疑似穿山甲走私', border_section: '凭祥段',
      latitude: 22.1128, longitude: 106.7612,
      risk_score: 96, hotspot_level: 5, historical_case_count: 10,
      nearby_officers: 4,
      legal_basis: '《野生动物保护法》第二十四条；《刑法》第三百四十一条',
      penalty_suggestion: '立即布控友谊关及周边卡口并开展联合查缉',
      law_enforcement_unit: '广西环食药侦查总队凭祥边境支队',
      created_at: new Date(Date.now() - 1200000)
    },
    {
      id: 1003, alert_code: 'SA-2026-000103',
      alert_type: 'intelligence', level: 'warning', status: 'processing',
      species_name: '未知活体', animal_count: 0,
      protection_level: '未知',
      target_moving_direction: '南向',
      location: '中越边境那坡县某界碑处发现异常震动', border_section: '那坡段',
      latitude: 23.4245, longitude: 105.8336,
      risk_score: 82, hotspot_level: 4, historical_case_count: 5,
      nearby_officers: 3,
      legal_basis: '《边境管理条例》；《野生动物保护法》',
      penalty_suggestion: '扩大巡查半径并启用无人机热成像复核',
      law_enforcement_unit: '广西环食药侦查总队那坡边境支队',
      created_at: new Date(Date.now() - 3600000)
    }
  ];
}

function generateMockWildlifeCases() {
  return [
    {
      id: 1, case_number: 'WL-2026-000101',
      title: '东兴万尾金滩疑似食蟹猴非法运输案',
      status: 'investigating', priority: 'urgent',
      species_name: '食蟹猴', protection_level: 'CITES附录II',
      animal_count: 12, animal_condition: '活体',
      location: '广西东兴市万尾金滩边境便道', border_section: '东兴段',
      latitude: 21.5318, longitude: 108.0325,
      suspect_count: 2, law_enforcement_unit: '广西环食药侦查总队东兴边境支队',
      legal_basis: '《野生动物保护法》第二十三条',
      created_at: new Date(Date.now() - 86400000)
    },
    {
      id: 2, case_number: 'WL-2026-000102',
      title: '友谊关疑似穿山甲走私案',
      status: 'investigating', priority: 'urgent',
      species_name: '中华穿山甲', protection_level: '国家一级',
      animal_count: 3, animal_condition: '活体',
      location: '广西凭祥市友谊关附近边境路段', border_section: '凭祥段',
      latitude: 22.1128, longitude: 106.7612,
      suspect_count: 3, law_enforcement_unit: '广西环食药侦查总队凭祥边境支队',
      legal_basis: '《野生动物保护法》第二十四条、《刑法》第三百四十一条',
      created_at: new Date(Date.now() - 7 * 3600000)
    },
    {
      id: 3, case_number: 'WL-2026-000103',
      title: '那坡界碑异常震动线索核查案',
      status: 'investigating', priority: 'high',
      species_name: '未知活体', protection_level: '未知',
      animal_count: 0, animal_condition: '混合',
      location: '广西那坡县中越边境某界碑', border_section: '那坡段',
      latitude: 23.4245, longitude: 105.8336,
      suspect_count: 1, law_enforcement_unit: '广西环食药侦查总队那坡边境支队',
      legal_basis: '《边境管理条例》',
      created_at: new Date(Date.now() - 3 * 3600000)
    }
  ];
}

function generateMockBioSamples() {
  return [
    {
      id: 1, sample_number: 'BS-2026-000101',
      case_id: 2, sample_type: '血样',
      species_name: '中华穿山甲', animal_id: 'PANGOLIN-001',
      collection_location: '友谊关口岸查获现场',
      collection_time: new Date(Date.now() - 3600000),
      lab_status: '检测中', storage_temp: '-20°C',
      lab_sent_to: '广西野生动物司法鉴定中心'
    },
    {
      id: 2, sample_number: 'BS-2026-000102',
      case_id: 1, sample_type: '毛发',
      species_name: '食蟹猴', animal_id: 'MACAQUE-001',
      collection_location: '东兴万尾金滩查获现场',
      collection_time: new Date(Date.now() - 5400000),
      lab_status: '待送检', storage_temp: '-20°C',
      lab_sent_to: '广西野生动物司法鉴定中心'
    }
  ];
}

function generateMockBorderDevices() {
  return [
    { id: 1, device_code: 'BD-IR-001', name: '东兴口岸红外热成像摄像头A', device_type: 'infrared-camera', status: 'online', border_section: '东兴段', latitude: 21.5450, longitude: 107.9720, battery: 85, signal_strength: 92, is_remote_controllable: true, trigger_count_today: 3, law_enforcement_unit: '广西环食药侦查总队东兴边境支队' },
    { id: 2, device_code: 'BD-FV-001', name: '万尾金滩边境震动光纤01', device_type: 'fiber-vibration', status: 'warning', border_section: '东兴段', latitude: 21.5318, longitude: 108.0325, battery: 76, signal_strength: 83, is_remote_controllable: false, trigger_count_today: 5, law_enforcement_unit: '广西环食药侦查总队东兴边境支队' },
    { id: 3, device_code: 'BD-IR-002', name: '友谊关口岸红外热成像摄像头', device_type: 'infrared-camera', status: 'warning', border_section: '凭祥段', latitude: 22.1128, longitude: 106.7612, battery: 23, signal_strength: 65, is_remote_controllable: true, trigger_count_today: 2, law_enforcement_unit: '广西环食药侦查总队凭祥边境支队' },
    { id: 4, device_code: 'BD-LR-001', name: '龙州水口口岸活体探测雷达01', device_type: 'life-radar', status: 'online', border_section: '龙州段', latitude: 22.4868, longitude: 106.6719, battery: 78, signal_strength: 80, is_remote_controllable: false, trigger_count_today: 1, law_enforcement_unit: '广西环食药侦查总队龙州边境支队' },
    { id: 5, device_code: 'BD-FV-002', name: '那坡界碑震动光纤01', device_type: 'fiber-vibration', status: 'warning', border_section: '那坡段', latitude: 23.4245, longitude: 105.8336, battery: 69, signal_strength: 74, is_remote_controllable: false, trigger_count_today: 4, law_enforcement_unit: '广西环食药侦查总队那坡边境支队' }
  ];
}

/**
 * POST /api/v1/wildlife/calculate-risk-score
 * 广西边境走私风险评分接口
 * body: { protection_level, hotspot_level, historical_case_count, nearby_officers, border_section, location, latitude, longitude, target_moving_direction }
 */
router.post('/calculate-risk-score', authenticate, (req, res) => {
  try {
    const result = calculateGuangxiRiskScore(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/v1/wildlife/legal-basis/:species
 * 根据物种名称自动匹配广西高发物种法律依据
 */
router.get('/legal-basis/:species', authenticate, (req, res) => {
  const species = decodeURIComponent(req.params.species || '');
  const result = enrichLegalBasisForGuangxiSpecies(species, '');
  const base = [
    { law: '《野生动物保护法》', articles: ['第二十三条', '第二十四条'], penalties: { minor: '罚款', moderate: '没收违法所得', severe: '移送司法机关' } },
    { law: '《海关法》', articles: ['第八十二条'], penalties: { minor: '罚款', moderate: '拘役', severe: '有期徒刑' } }
  ];
  if (result.guangxi_regulation_matched) {
    base.push({
      law: '《广西壮族自治区野生动物保护条例》',
      articles: result.legal_basis.match(/第[^；、]+条/g) || [],
      penalties: { minor: '警告+罚款', moderate: '没收活体+罚款', severe: '移送公安，追究刑事责任' }
    });
  }
  res.json({
    success: true,
    data: {
      species,
      legal_basis: result.legal_basis || '《野生动物保护法》',
      guangxi_regulation_matched: result.guangxi_regulation_matched,
      species_category: result.species_category,
      laws: base
    }
  });
});

export default router;
