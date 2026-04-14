/**
 * ==========================================
 * 情报研判模块 - 核心配置
 * ==========================================
 */

export const INTELLIGENCE_CONFIG = {
  // 线索来源
  CLUE_SOURCES: {
    SENSOR: { label: '传感器网络', icon: '📡', priority: 1 },
    REPORT: { label: '群众举报', icon: '📢', priority: 2 },
    SIBLING_UNIT: { label: '兄弟单位通报', icon: '🤝', priority: 3 },
    PATROL: { label: '巡逻发现', icon: '🚶', priority: 4 },
    ANALYSIS: { label: '数据分析', icon: '📊', priority: 5 },
    COOPERATION: { label: '国际合作', icon: '🌍', priority: 6 },
  },

  // 情报生命周期
  LIFECYCLE_STAGES: {
    RECEIVED: { label: '情报接收', color: '#1890FF' },
    TRIAGED: { label: '情报分拣', color: '#722ED1' },
    EVALUATING: { label: '评估核查', color: '#FA8C16' },
    PROCESSING: { label: '案件经营', color: '#13C2C2' },
    VERIFIED: { label: '情报核实', color: '#52C41A' },
    DISMISSED: { label: '排除作废', color: '#999' },
    DELIVERED: { label: '情报下发', color: '#00D4FF' },
  },

  // 关联分析规则
  ASSOCIATION_RULES: {
    TIME_WINDOW: 72 * 60 * 60 * 1000,  // 72小时内
    GEO_RADIUS: 5000,                     // 5公里范围
    PERSON_VEHICLE_LINK: true,           // 人员车辆关联
    CROSS_BORDER_PATTERN: true,           // 跨境模式识别
  },

  // 可视化配色
  GRAPH_COLORS: {
    NODE_PERSON: '#00D4FF',
    NODE_VEHICLE: '#722ED1',
    NODE_GOODS: '#FA8C16',
    NODE_LOCATION: '#52C41A',
    NODE_SPECIES: '#EB2F96',
    NODE_CASE: '#F5222D',
    EDGE_NORMAL: 'rgba(0, 212, 255, 0.3)',
    EDGE_SUSPICIOUS: 'rgba(255, 77, 79, 0.6)',
    EDGE_CONFIRMED: 'rgba(82, 196, 26, 0.5)',
  },

  // 评估维度权重
  EVALUATION_WEIGHTS: {
    sourceReliability: 0.3,    // 来源可信度
    informationSpecificity: 0.25, // 信息具体程度
    historicalAccuracy: 0.2,   // 历史准确率
    corroborationLevel: 0.15,  // 佐证程度
    timeliness: 0.1,            // 时效性
  },
};

export default INTELLIGENCE_CONFIG;
