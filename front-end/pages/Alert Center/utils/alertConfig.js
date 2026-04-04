/**
 * 预警界面配置文件
 * 文件: front-end/pages/Alert Center/utils/alertConfig.js
 * 功能: 提供预警分类、风险评分、法律依据等配置
 */

/**
 * 预警分类配置
 */
export const alertCategories = [
  {
    value: 'ecology',
    label: '环保预警',
    icon: '🌍',
    color: '#10b981',
    department: '广西环食药侦查总队'
  },
  {
    value: 'fooddrug',
    label: '食品药品',
    icon: '🏥',
    color: '#f59e0b',
    department: '广西环食药侦查总队'
  },
  {
    value: 'enforcement',
    label: '生态警务',
    icon: '👮',
    color: '#ef4444',
    department: '广西环食药侦查总队'
  }
];

/**
 * 预警等级配置
 */
export const alertLevels = [
  {
    value: 'critical',
    label: '严重威胁',
    icon: '🔴',
    color: '#FF4D4F',
    scoreRange: [80, 100],
    description: '需要立即处理的严重走私/生态威胁事件'
  },
  {
    value: 'high',
    label: '高风险',
    icon: '🟠',
    color: '#FFA940',
    scoreRange: [60, 79],
    description: '需要重点关注的高风险事件'
  },
  {
    value: 'medium',
    label: '中风险',
    icon: '🟡',
    color: '#FAAD14',
    scoreRange: [40, 59],
    description: '需要跟踪的中等风险事件'
  },
  {
    value: 'low',
    label: '低风险',
    icon: '🟢',
    color: '#52C41A',
    scoreRange: [0, 39],
    description: '低风险事件'
  }
];

/**
 * 预警类型配置 - 走私活物兼环境监测
 */
export const alertTypes = {
  ecology: [
    { key: 'wildlife-track',   name: '野生动物活动',   icon: '🐾', unit: '' },
    { key: 'habitat-damage',   name: '栖息地破坏',     icon: '🌿', unit: '' },
    { key: 'water-quality',    name: '水质异常',       icon: '💧', unit: '' },
    { key: 'border-anomaly',   name: '边境走私异常',   icon: '🛡️', unit: '' }
  ],
  fooddrug: [
    { key: 'temperature', name: '温度异常', icon: '🌡️', unit: '℃' },
    { key: 'humidity', name: '湿度异常', icon: '💧', unit: '%' },
    { key: 'quality', name: '质量问题', icon: '⚠️', unit: '' },
    { key: 'safety', name: '安全隐患', icon: '🚨', unit: '' }
  ],
  enforcement: [
    { key: 'infrared-trigger', name: '红外触发', icon: '🔴', unit: '' },
    { key: 'checkpoint-anomaly', name: '车辆冲卡告警', icon: '🚗', unit: '' },
    { key: 'report', name: '群众举报线索', icon: '📢', unit: '' },
    { key: 'patrol-discovery', name: '野生动物异常移动', icon: '👮', unit: '' },
    { key: 'intelligence', name: '情报线索', icon: '🧠', unit: '' }
  ]
};

/**
 * 法律依据配置
 */
export const legalBasis = {
  ecology: [
    {
      law: '《野生动物保护法》',
      articles: ['第十条', '第二十条', '第三十条'],
      penalties: {
        minor: '1000-5000元',
        moderate: '5000-50000元',
        severe: '50000-500000元'
      }
    },
    {
      law: '《海关法》',
      articles: ['第十五条', '第二十五条', '第三十五条'],
      penalties: {
        minor: '2000-10000元',
        moderate: '10000-100000元',
        severe: '100000-1000000元'
      }
    },
    {
      law: '《边境管理条例》',
      articles: ['第十二条', '第二十二条', '第三十二条'],
      penalties: {
        minor: '1000-5000元',
        moderate: '5000-50000元',
        severe: '50000-500000元'
      }
    }
  ],
  fooddrug: [
    {
      law: '《食品安全法》',
      articles: ['第三十四条', '第四十八条', '第六十三条'],
      penalties: {
        minor: '1000-10000元',
        moderate: '10000-100000元',
        severe: '100000-1000000元'
      }
    },
    {
      law: '《药品管理法》',
      articles: ['第二十四条', '第四十八条', '第七十三条'],
      penalties: {
        minor: '2000-20000元',
        moderate: '20000-200000元',
        severe: '200000-2000000元'
      }
    }
  ],
  enforcement: [
    {
      law: '《野生动物保护法》',
      articles: ['第二十三条', '第二十四条', '第三百四十一条'],
      penalties: {
        minor: '罚款',
        moderate: '没收违法所得',
        severe: '从重处罚'
      }
    },
    {
      law: '《海关法》',
      articles: ['第八十二条', '第三条', '第十条'],
      penalties: {
        minor: '罚款',
        moderate: '拘役',
        severe: '有期徒刑'
      }
    },
    {
      law: '《边境管理条例》',
      articles: ['第十五条', '第二十条', '第三十条'],
      penalties: {
        minor: '警告',
        moderate: '行政处罚',
        severe: '移送司法机关'
      }
    }
  ]
};

/**
 * 风险评分计算
 */
export function calculateRiskScore(alert) {
  let score = 0;

  // 1. 风险评分计算权重 (40分)
  if (alert.concentration) {
    const standardValue = alert.standardValue || 1;
    const exceedRatio = alert.concentration / standardValue;
    
    if (exceedRatio >= 10) {
      score += 40;
    } else if (exceedRatio >= 5) {
      score += 30;
    } else if (exceedRatio >= 2) {
      score += 20;
    } else if (exceedRatio >= 1) {
      score += 10;
    }
  }

  // 2. 影响人口权重 (30分)
  if (alert.affectedPopulation) {
    if (alert.affectedPopulation >= 10000) {
      score += 30;
    } else if (alert.affectedPopulation >= 5000) {
      score += 25;
    } else if (alert.affectedPopulation >= 1000) {
      score += 20;
    } else if (alert.affectedPopulation >= 100) {
      score += 10;
    }
  }

  // 3. 时间因素权重 (20分)
  if (alert.timestamp) {
    const hour = new Date(alert.timestamp).getHours();
    // 工作时间(8:00-18:00)风险较低，非工作时间风险较高
    if (hour >= 22 || hour < 6) {
      score += 20; // 夜间
    } else if (hour >= 18 || hour < 8) {
      score += 15; // 早晚
    } else {
      score += 10; // 工作时间
    }
  }

  // 4. 持续时间权重 (10分)
  if (alert.duration) {
    if (alert.duration >= 3600) { // 1小时以上
      score += 10;
    } else if (alert.duration >= 1800) { // 30分钟以上
      score += 7;
    } else if (alert.duration >= 600) { // 10分钟以上
      score += 5;
    }
  }

  return Math.min(Math.round(score), 100);
}

/**
 * 计算超标倍数
 */
export function calculateExceedRatio(concentration, standardValue) {
  if (!standardValue || standardValue === 0) return 0;
  return (concentration / standardValue).toFixed(2);
}

/**
 * 计算影响人口
 */
export function calculateAffectedPopulation(location, radius, populationDensity) {
  // 基于地理位置、半径和人口密度计算影响人口
  const area = Math.PI * radius * radius; // 圆形区域面积
  return Math.round(area * populationDensity);
}

/**
 * 获取预警等级
 */
export function getAlertLevel(riskScore) {
  for (const level of alertLevels) {
    const [min, max] = level.scoreRange;
    if (riskScore >= min && riskScore <= max) {
      return level;
    }
  }
  return alertLevels[3]; // 默认返回低风险
}

/**
 * 获取预警类型信息
 */
export function getAlertType(category, typeKey) {
  const types = alertTypes[category] || [];
  return types.find(t => t.key === typeKey);
}

/**
 * 获取法律依据
 */
export function getLegalBasis(category, severity) {
  const laws = legalBasis[category] || [];
  if (laws.length === 0) return null;
  
  // 根据严重程度选择法律
  const law = laws[0]; // 简化处理，实际应根据具体情况选择
  return {
    law: law.law,
    articles: law.articles,
    penalty: law.penalties[severity] || law.penalties.minor
  };
}

/**
 * 生成处罚建议
 */
export function generatePenaltyRecommendation(alert) {
  const riskScore = alert.riskScore || 0;
  const exceedRatio = alert.exceedRatio || 1;
  
  let severity = 'minor';
  if (riskScore >= 80 || exceedRatio >= 10) {
    severity = 'severe';
  } else if (riskScore >= 60 || exceedRatio >= 5) {
    severity = 'moderate';
  }
  
  const legalInfo = getLegalBasis(alert.category, severity);
  
  return {
    severity,
    recommendation: `根据${legalInfo?.law}，建议处以${legalInfo?.penalty}的罚款`,
    legalBasis: legalInfo,
    immediateAction: riskScore >= 80 ? '立即停产整改' : '限期整改'
  };
}

/**
 * 预警排序
 */
export function sortAlerts(alerts, sortBy = 'riskScore') {
  return [...alerts].sort((a, b) => {
    if (sortBy === 'riskScore') {
      // 按风险评分从高到低排序
      return (b.riskScore || 0) - (a.riskScore || 0);
    } else if (sortBy === 'time') {
      // 按时间从新到旧排序
      return new Date(b.timestamp) - new Date(a.timestamp);
    } else if (sortBy === 'exceedRatio') {
      // 按超标倍数从高到低排序
      return (b.exceedRatio || 0) - (a.exceedRatio || 0);
    }
    return 0;
  });
}

/**
 * 过滤预警
 */
export function filterAlerts(alerts, filters) {
  return alerts.filter(alert => {
    // 按分类过滤
    if (filters.category && alert.category !== filters.category) {
      return false;
    }
    
    // 按等级过滤
    if (filters.level && alert.level !== filters.level) {
      return false;
    }
    
    // 按状态过滤
    if (filters.status === 'handled' && !alert.handled) {
      return false;
    }
    if (filters.status === 'unhandled' && alert.handled) {
      return false;
    }
    
    // 按时间范围过滤
    if (filters.startTime && new Date(alert.timestamp) < new Date(filters.startTime)) {
      return false;
    }
    if (filters.endTime && new Date(alert.timestamp) > new Date(filters.endTime)) {
      return false;
    }
    
    return true;
  });
}

/**
 * 格式化预警数据
 */
export function formatAlert(rawAlert) {
  const riskScore = calculateRiskScore(rawAlert);
  const level = getAlertLevel(riskScore);
  const exceedRatio = calculateExceedRatio(rawAlert.concentration, rawAlert.standardValue);
  const penalty = generatePenaltyRecommendation({
    ...rawAlert,
    riskScore,
    exceedRatio
  });
  
  return {
    id: rawAlert.id,
    caseNumber: rawAlert.caseNumber || `CASE-${Date.now()}`,
    category: rawAlert.category,
    type: rawAlert.type,
    alertType: getAlertType(rawAlert.category, rawAlert.type),
    timestamp: rawAlert.timestamp,
    location: rawAlert.location,
    concentration: rawAlert.concentration,
    standardValue: rawAlert.standardValue,
    exceedRatio,
    affectedPopulation: rawAlert.affectedPopulation || 0,
    riskScore,
    level,
    legalBasis: penalty.legalBasis,
    penaltyRecommendation: penalty.recommendation,
    immediateAction: penalty.immediateAction,
    handled: rawAlert.handled || false,
    description: rawAlert.description || ''
  };
}

export default {
  alertCategories,
  alertLevels,
  alertTypes,
  legalBasis,
  calculateRiskScore,
  calculateExceedRatio,
  calculateAffectedPopulation,
  getAlertLevel,
  getAlertType,
  getLegalBasis,
  generatePenaltyRecommendation,
  sortAlerts,
  filterAlerts,
  formatAlert
};
