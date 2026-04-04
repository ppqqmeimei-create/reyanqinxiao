import express from 'express';

const router = express.Router();

const MOCK_EVENTS = [
  {
    id: 91001,
    scene: 'enforcement',
    stage: 'prewarning',
    title: '友谊关红外触发疑似穿山甲转运',
    level: 'critical',
    status: 'pending',
    location: '凭祥市友谊关口岸北侧便道',
    latitude: 22.1128,
    longitude: 106.7612,
    species_type: '穿山甲',
    target_type: 'animal',
    risk_score: 96,
    source: 'infrared-camera',
    created_at: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: 91002,
    scene: 'enforcement',
    stage: 'disposal',
    title: '东兴卡口车辆异常，疑似食蟹猴走私',
    level: 'warning',
    status: 'processing',
    location: '东兴万尾金滩卡口',
    latitude: 21.5318,
    longitude: 108.0325,
    species_type: '食蟹猴',
    target_type: 'vehicle',
    risk_score: 88,
    source: 'checkpoint-camera',
    created_at: new Date(Date.now() - 45 * 60 * 1000)
  },
  {
    id: 92001,
    scene: 'ecology',
    stage: 'prewarning',
    title: '那坡边境河段氨氮异常升高',
    level: 'warning',
    status: 'pending',
    location: '那坡界河监测点-03',
    latitude: 23.4245,
    longitude: 105.8336,
    pollutant_type: '氨氮',
    pollutant_value: 1.8,
    standard_value: 1.0,
    risk_score: 79,
    source: 'water-monitor',
    created_at: new Date(Date.now() - 70 * 60 * 1000)
  },
  {
    id: 93001,
    scene: 'fooddrug',
    stage: 'research',
    title: '边贸冻品批次检出风险成分',
    level: 'warning',
    status: 'processing',
    location: '凭祥边贸冷链仓',
    latitude: 22.105,
    longitude: 106.75,
    product_type: 'food',
    risk_score: 73,
    source: 'manual',
    created_at: new Date(Date.now() - 95 * 60 * 1000)
  }
];

function toDashboard(events) {
  const total = events.length;
  const prewarning = events.filter((e) => e.stage === 'prewarning').length;
  const disposal = events.filter((e) => e.stage === 'disposal').length;
  const evidence = events.filter((e) => e.stage === 'evidence').length;
  const research = events.filter((e) => e.stage === 'research').length;
  const critical = events.filter((e) => e.level === 'critical').length;
  const warning = events.filter((e) => e.level === 'warning').length;
  return {
    total,
    stages: { prewarning, disposal, evidence, research },
    levels: { critical, warning }
  };
}

/**
 * GET /api/v1/fusion/events
 * 生态警务闭环事件流
 */
router.get('/events', async (req, res) => {
  const { scene, stage, level, limit = 50 } = req.query;

  const events = MOCK_EVENTS
    .filter((e) => (!scene || e.scene === scene))
    .filter((e) => (!stage || e.stage === stage))
    .filter((e) => (!level || e.level === level))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, Number(limit));

  res.json({
    success: true,
    data: {
      events,
      dashboard: toDashboard(events)
    }
  });
});

/**
 * GET /api/v1/fusion/closed-loop/overview
 * 感知-预警-处置-取证-研判闭环概览
 */
router.get('/closed-loop/overview', async (req, res) => {
  const enforcement = MOCK_EVENTS.filter((e) => e.scene === 'enforcement');
  const ecology = MOCK_EVENTS.filter((e) => e.scene === 'ecology');

  res.json({
    success: true,
    data: {
      direction: '走私活物防控 + 环境监测协同',
      loop: {
        sensing: 42,
        prewarning: 18,
        disposal: 11,
        evidence: 9,
        research: 6,
        closure_rate: 81.8
      },
      enforcement: toDashboard(enforcement),
      ecology: toDashboard(ecology)
    }
  });
});

/**
 * GET /api/v1/fusion/metrics
 * 双轨核心指标：走私预警/生态异常/闭环任务/设备在线率
 */
router.get('/metrics', async (req, res) => {
  const enforcement = MOCK_EVENTS.filter((e) => e.scene === 'enforcement');
  const ecology = MOCK_EVENTS.filter((e) => e.scene === 'ecology');

  const smugglingCritical = enforcement.filter((e) => e.level === 'critical').length;
  const smugglingWarning = enforcement.filter((e) => e.level === 'warning').length;

  res.json({
    success: true,
    data: {
      smugglingToday: smugglingCritical + smugglingWarning,
      smugglingDelta: 21,
      ecologyAbnormal: ecology.filter((e) => e.level !== 'normal').length + 22,
      water: 11,
      air: 9,
      soil: 9,
      closureInProgress: MOCK_EVENTS.filter((e) => e.status === 'processing' || e.status === 'pending').length + 30,
      pendingReview: 12,
      deviceOnlineRate: 93.2,
      deviceOnline: 138,
      deviceTotal: 148
    }
  });
});

/**
 * GET /api/v1/fusion/smuggling-trend
 * 走私高发时段分析（6时段）
 */
router.get('/smuggling-trend', async (req, res) => {
  res.json({
    success: true,
    data: [
      { slot: '00-04', count: 12, percent: 86, level: 'critical' },
      { slot: '04-08', count: 6, percent: 42, level: 'warning' },
      { slot: '08-12', count: 3, percent: 21, level: 'normal' },
      { slot: '12-16', count: 4, percent: 28, level: 'normal' },
      { slot: '16-20', count: 7, percent: 50, level: 'warning' },
      { slot: '20-24', count: 14, percent: 100, level: 'critical' }
    ]
  });
});

/**
 * GET /api/v1/fusion/ecology-trend
 * 生态异常7日趋势
 */
router.get('/ecology-trend', async (req, res) => {
  res.json({
    success: true,
    data: [
      { day: '周一', freq: 11, percent: 46, level: 'normal' },
      { day: '周二', freq: 14, percent: 58, level: 'warning' },
      { day: '周三', freq: 9, percent: 38, level: 'normal' },
      { day: '周四', freq: 18, percent: 75, level: 'warning' },
      { day: '周五', freq: 22, percent: 92, level: 'critical' },
      { day: '周六', freq: 24, percent: 100, level: 'critical' },
      { day: '周日', freq: 16, percent: 67, level: 'warning' }
    ]
  });
});

/**
 * GET /api/v1/fusion/heartbeat-feed
 * 实时事件滚动播报
 */
router.get('/heartbeat-feed', async (req, res) => {
  const { limit = 10 } = req.query;

  const now = new Date();
  const feed = [
    { time: formatTime(now), type: '红外卡口', level: 'critical', message: '友谊关北侧便道疑似穿山甲转运' },
    { time: formatTime(new Date(now.getTime() - 14 * 1000)), type: '震动光纤', level: 'warning', message: '3#监测点周边异常震动，请注意' },
    { time: formatTime(new Date(now.getTime() - 28 * 1000)), type: '水质监测', level: 'warning', message: '界河监测点-03氨氮超标80%' },
    { time: formatTime(new Date(now.getTime() - 43 * 1000)), type: '卡口摄像头', level: 'critical', message: '东兴万尾金滩车辆异常，请核实' },
    { time: formatTime(new Date(now.getTime() - 57 * 1000)), type: '空气监测', level: 'normal', message: '边境监测站空气质量良好' },
    { time: formatTime(new Date(now.getTime() - 71 * 1000)), type: '红外卡口', level: 'warning', message: '凭祥友谊关区域有人员靠近边界' }
  ];

  res.json({
    success: true,
    data: feed.slice(0, Number(limit))
  });
});

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * GET /api/v1/fusion/aggregation
 * 物种分析汇总
 */
router.get('/aggregation', async (req, res) => {
  res.json({
    success: true,
    data: [
      { name: '穿山甲', count: 9, percent: 100 },
      { name: '食蟹猴', count: 7, percent: 78 },
      { name: '巨蜥', count: 5, percent: 56 },
      { name: '眼镜王蛇', count: 3, percent: 34 }
    ]
  });
});

/**
 * POST /api/v1/fusion/dispatch
 * 闭环派警/处置指令
 */
router.post('/dispatch', async (req, res) => {
  const { event_id, action = 'dispatch', officers = [] } = req.body;

  if (!event_id) {
    return res.status(400).json({
      success: false,
      message: 'event_id 不能为空'
    });
  }

  return res.json({
    success: true,
    message: '处置指令下发成功',
    data: {
      event_id,
      action,
      officers,
      dispatched_at: new Date().toISOString()
    }
  });
});

export default router;
