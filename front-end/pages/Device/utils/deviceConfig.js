/**
 * 设备界面 - 设备类型和分类配置
 * 文件: front-end/pages/Device/utils/deviceConfig.js
 * 功能: 提供设备类型、分类、健康度等配置
 */

/**
 * 设备分类配置
 */
export const deviceCategories = {
  ecology: {
    key: 'ecology',
    name: '生态监测设备',
    icon: '🌍',
    color: '#10b981',
    description: '边境生态警务防控设备'
  },
  fooddrug: {
    key: 'fooddrug',
    name: '食品药品设备',
    icon: '🏥',
    color: '#f59e0b',
    description: '食品药品企业监测设备'
  },
  enforcement: {
    key: 'enforcement',
    name: '执法设备',
    icon: '👮',
    color: '#ef4444',
    description: '边境活物走私智能防控设备'
  }
};

/**
 * 设备类型配置
 */
export const deviceTypes = {
  // 环保设备类型
  ecology: [
    {
      key: 'water-sensor',
      name: '水质传感器',
      icon: '💧',
      description: '监测水体质量参数',
      parameters: ['pH值', '溶解氧', '浊度', '电导率']
    },
    {
      key: 'air-sensor',
      name: '空气传感器',
      icon: '💨',
      description: '监测空气质量指标',
      parameters: ['红外触发强度', 'PM10', 'NO2', 'SO2', 'O3']
    },
    {
      key: 'soil-sensor',
      name: '活体探测传感器',
      icon: '🐾',
      description: '监测活体物种异常与保护等级',
      parameters: ['活体保护等级', '目标数量', '物种特征', '状态指标']
    },
    {
      key: 'waste-monitor',
      name: '废弃物监测',
      icon: '♻️',
      description: '监测固体废弃物',
      parameters: ['重量', '成分', '温度', '湿度']
    }
  ],

  // 食品药品设备类型
  fooddrug: [
    {
      key: 'temperature-sensor',
      name: '温度传感器',
      icon: '🌡️',
      description: '冷链温度监测',
      parameters: ['当前温度', '最高温度', '最低温度', '平均温度'],
      alertThreshold: { min: -25, max: -18 }
    },
    {
      key: 'humidity-sensor',
      name: '湿度传感器',
      icon: '💧',
      description: '环境湿度监测',
      parameters: ['相对湿度', '露点温度', '绝对湿度'],
      alertThreshold: { min: 30, max: 70 }
    },
    {
      key: 'quality-detector',
      name: '质量检测器',
      icon: '🔬',
      description: '产品质量检测',
      parameters: ['检测项目', '检测结果', '检测时间', '检测人员']
    },
    {
      key: 'safety-monitor',
      name: '安全监测器',
      icon: '🚨',
      description: '安全事件监测',
      parameters: ['事件类型', '事件等级', '事件时间', '处理状态']
    }
  ],

  // 执法设备类型
  enforcement: [
    {
      key: 'gps-tracker',
      name: 'GPS追踪器',
      icon: '📍',
      description: '实时位置追踪',
      parameters: ['纬度', '经度', '精度', '速度', '方向'],
      features: ['实时定位', '轨迹记录', '地理围栏']
    },
    {
      key: 'camera-hd',
      name: '高清摄像头',
      icon: '📹',
      description: '高清视频采集',
      parameters: ['分辨率', '帧率', '存储空间', '电池电量'],
      features: ['4K录制', '夜视', '人脸识别']
    },
    {
      key: 'audio-recorder',
      name: '音频记录器',
      icon: '🎙️',
      description: '现场音频记录',
      parameters: ['采样率', '比特率', '存储空间', '电池电量'],
      features: ['高保真录音', '降噪', '时间戳']
    },
    {
      key: 'evidence-collector',
      name: '证据采集器',
      icon: '📦',
      description: '物证管理系统',
      parameters: ['物证数量', '物证类型', '存储位置', '链条状态'],
      features: ['物证管理', '链条追踪', '数据加密']
    }
  ]
};

/**
 * 设备状态配置
 */
export const deviceStatus = {
  online: {
    key: 'online',
    name: '在线',
    icon: '🟢',
    color: '#10b981'
  },
  offline: {
    key: 'offline',
    name: '离线',
    icon: '⚫',
    color: '#6b7280'
  },
  warning: {
    key: 'warning',
    name: '预警',
    icon: '🟡',
    color: '#f59e0b'
  },
  error: {
    key: 'error',
    name: '错误',
    icon: '🔴',
    color: '#ef4444'
  }
};

/**
 * 设备健康度配置
 */
export const deviceHealth = {
  healthy: {
    key: 'healthy',
    name: '健康',
    icon: '✅',
    color: '#10b981',
    range: [80, 100]
  },
  warning: {
    key: 'warning',
    name: '预警',
    icon: '⚠️',
    color: '#f59e0b',
    range: [50, 79]
  },
  critical: {
    key: 'critical',
    name: '严重',
    icon: '❌',
    color: '#ef4444',
    range: [0, 49]
  }
};

/**
 * 获取设备分类
 */
export function getDeviceCategory(categoryKey) {
  return deviceCategories[categoryKey] || null;
}

/**
 * 获取设备类型
 */
export function getDeviceType(categoryKey, typeKey) {
  const types = deviceTypes[categoryKey] || [];
  return types.find(t => t.key === typeKey) || null;
}

/**
 * 获取分类下的所有设备类型
 */
export function getCategoryTypes(categoryKey) {
  return deviceTypes[categoryKey] || [];
}

/**
 * 获取设备状态
 */
export function getDeviceStatus(statusKey) {
  return deviceStatus[statusKey] || null;
}

/**
 * 获取设备健康度
 */
export function getDeviceHealth(healthScore) {
  if (healthScore >= 80) return deviceHealth.healthy;
  if (healthScore >= 50) return deviceHealth.warning;
  return deviceHealth.critical;
}

/**
 * 计算设备健康度评分
 */
export function calculateHealthScore(battery, signal) {
  // 电池权重40%，信号权重60%
  return Math.round((battery * 0.4 + signal * 0.6));
}

/**
 * 获取所有分类
 */
export function getAllCategories() {
  return Object.values(deviceCategories);
}

/**
 * 获取所有设备类型（按分类）
 */
export function getAllDeviceTypes() {
  return deviceTypes;
}

/**
 * 验证设备分类
 */
export function isValidCategory(categoryKey) {
  return categoryKey in deviceCategories;
}

/**
 * 验证设备类型
 */
export function isValidDeviceType(categoryKey, typeKey) {
  const types = deviceTypes[categoryKey] || [];
  return types.some(t => t.key === typeKey);
}

/**
 * 获取设备类型的参数列表
 */
export function getDeviceTypeParameters(categoryKey, typeKey) {
  const type = getDeviceType(categoryKey, typeKey);
  return type ? type.parameters : [];
}

/**
 * 获取设备类型的特性列表
 */
export function getDeviceTypeFeatures(categoryKey, typeKey) {
  const type = getDeviceType(categoryKey, typeKey);
  return type ? type.features || [] : [];
}

/**
 * 获取设备类型的告警阈值
 */
export function getDeviceTypeAlertThreshold(categoryKey, typeKey) {
  const type = getDeviceType(categoryKey, typeKey);
  return type ? type.alertThreshold || null : null;
}

/**
 * 格式化设备信息
 */
export function formatDeviceInfo(device) {
  const category = getDeviceCategory(device.category);
  const type = getDeviceType(device.category, device.type);
  const status = getDeviceStatus(device.status);
  const health = getDeviceHealth(device.health_score || 100);

  return {
    ...device,
    categoryName: category?.name || '未知',
    categoryIcon: category?.icon || '❓',
    typeName: type?.name || '未知',
    typeIcon: type?.icon || '❓',
    statusName: status?.name || '未知',
    statusIcon: status?.icon || '❓',
    healthName: health?.name || '未知',
    healthIcon: health?.icon || '❓'
  };
}

/**
 * 获取设备列表的统计信息
 */
export function getDeviceListStats(devices) {
  const stats = {
    total: devices.length,
    byCategory: {},
    byStatus: {},
    byHealth: {},
    avgHealthScore: 0
  };

  // 按分类统计
  Object.keys(deviceCategories).forEach(key => {
    stats.byCategory[key] = devices.filter(d => d.category === key).length;
  });

  // 按状态统计
  Object.keys(deviceStatus).forEach(key => {
    stats.byStatus[key] = devices.filter(d => d.status === key).length;
  });

  // 按健康度统计
  Object.keys(deviceHealth).forEach(key => {
    const health = deviceHealth[key];
    stats.byHealth[key] = devices.filter(d => {
      const score = d.health_score || 100;
      return score >= health.range[0] && score <= health.range[1];
    }).length;
  });

  // 计算平均健康度
  if (devices.length > 0) {
    const totalScore = devices.reduce((sum, d) => sum + (d.health_score || 100), 0);
    stats.avgHealthScore = Math.round(totalScore / devices.length);
  }

  return stats;
}

export default {
  deviceCategories,
  deviceTypes,
  deviceStatus,
  deviceHealth,
  getDeviceCategory,
  getDeviceType,
  getCategoryTypes,
  getDeviceStatus,
  getDeviceHealth,
  calculateHealthScore,
  getAllCategories,
  getAllDeviceTypes,
  isValidCategory,
  isValidDeviceType,
  getDeviceTypeParameters,
  getDeviceTypeFeatures,
  getDeviceTypeAlertThreshold,
  formatDeviceInfo,
  getDeviceListStats
};
