/**
 * GIS地图优化配置
 * 文件: front-end/pages/GIS/utils/gisOptimization.js
 * 功能: 提供GIS地图的图层、筛选、工具栏等配置
 */

/**
 * 预警类型配置 - 走私活物兼环境监测
 */
export const alertSourceTypes = [
  {
    key: 'wildlife-track',
    name: '野生动物活动',
    icon: '🐾',
    color: '#ff4d4f',
    description: '野生动物活动监测'
  },
  {
    key: 'habitat-damage',
    name: '栖息地破坏',
    icon: '🌿',
    color: '#faad14',
    description: '栖息地破坏监测'
  },
  {
    key: 'border-anomaly',
    name: '边境走私异常',
    icon: '🛡️',
    color: '#52c41a',
    description: '边境走私异常监测'
  },
  {
    key: 'water-quality',
    name: '水质异常',
    icon: '💧',
    color: '#1890ff',
    description: '跨境水质异常监测'
  }
];

/**
 * 图层配置
 */
export const mapLayers = [
  {
    key: 'smuggling_spot',
    name: '走私预警点',
    icon: '📍',
    visible: true,
    description: '显示走私预警位置标记'
  },
  {
    key: 'monitoring_point',
    name: '监测点标记',
    icon: '📡',
    visible: true,
    description: '显示监测设备位置'
  },
  {
    key: 'smuggling_path',
    name: '走私路径',
    icon: '➡️',
    visible: true,
    description: '显示走私路径'
  },
  {
    key: 'alert_range',
    name: '预警范围圈',
    icon: '⭕',
    visible: true,
    description: '显示预警影响范围'
  }
];

/**
 * 风险等级配置
 */
export const riskLevels = [
  {
    key: 'critical',
    name: '紧急',
    color: '#ff4d4f',
    score: 80,
    description: '风险评分 80-100'
  },
  {
    key: 'high',
    name: '高风险',
    color: '#ff7a45',
    score: 60,
    description: '风险评分 60-79'
  },
  {
    key: 'medium',
    name: '中风险',
    color: '#faad14',
    score: 40,
    description: '风险评分 40-59'
  },
  {
    key: 'low',
    name: '低风险',
    color: '#52c41a',
    score: 20,
    description: '风险评分 20-39'
  }
];

/**
 * 工具栏配置 - 按用户维度
 */
export const toolbarByCategory = {
  ecology: [
    { id: 'report', icon: 'sos.png', text: '上报预警', color: '#FF4D4F' },
    { id: 'analysis', icon: 'layers.png', text: '数据分析', color: '#00D4FF' },
    { id: 'layer', icon: 'satellite.png', text: '走私预警', color: '#00D4FF' },
    { id: 'location', icon: 'location.png', text: '定位', color: '#00D4FF' },
    { id: 'search', icon: 'compass.png', text: '搜索', color: '#00D4FF' }
  ],

  enforcement: [
    { id: 'report', icon: 'sos.png', text: '上报案件', color: '#FF4D4F' },
    { id: 'analysis', icon: 'layers.png', text: '数据分析', color: '#00D4FF' },
    { id: 'evidence', icon: 'camera.png', text: '证据', color: '#00D4FF' },
    { id: 'location', icon: 'location.png', text: '定位', color: '#00D4FF' },
    { id: 'search', icon: 'compass.png', text: '搜索', color: '#00D4FF' }
  ]
};

/**
 * 获取预警类型信息
 */
export function getAlertSourceType(key) {
  return alertSourceTypes.find(t => t.key === key) || null;
}

/**
 * 获取图层信息
 */
export function getMapLayer(key) {
  return mapLayers.find(l => l.key === key) || null;
}

/**
 * 获取风险等级信息
 */
export function getRiskLevel(key) {
  return riskLevels.find(r => r.key === key) || null;
}

/**
 * 根据风险评分获取风险等级
 */
export function getRiskLevelByScore(score) {
  if (score >= 80) return riskLevels[0]; // critical
  if (score >= 60) return riskLevels[1]; // high
  if (score >= 40) return riskLevels[2]; // medium
  return riskLevels[3]; // low
}

/**
 * 获取用户维度的工具栏
 */
export function getToolbarByCategory(category) {
  return toolbarByCategory[category] || toolbarByCategory.ecology;
}

/**
 * 生成标记点
 */
export function generateMarker(id, latitude, longitude, type, title, riskScore) {
  const riskLevel = getRiskLevelByScore(riskScore);
  const alertType = getAlertSourceType(type);
  
  return {
    id,
    latitude,
    longitude,
    title: title || '监测点',
    iconPath: `/static/markers/${type}_${riskLevel.key}.png`,
    width: 40,
    height: 40,
    callout: {
      content: `${title}\n风险: ${riskScore}分`,
      color: '#ffffff',
      fontSize: 12,
      borderRadius: 4,
      bgColor: riskLevel.color,
      padding: 5,
      textAlign: 'center'
    },
    customCallout: {
      anchorX: 0,
      anchorY: 0,
      display: 'ALWAYS'
    }
  };
}

/**
 * 生成多边形（预警范围圈）
 */
export function generateCircle(id, latitude, longitude, radius, type, riskScore) {
  const riskLevel = getRiskLevelByScore(riskScore);
  
  return {
    latitude,
    longitude,
    radius,
    color: riskLevel.color,
    fillColor: riskLevel.color,
    strokeWidth: 2,
    zIndex: 1
  };
}

/**
 * 生成折线（走私路径）
 */
export function generatePolyline(id, points, type, riskScore) {
  const riskLevel = getRiskLevelByScore(riskScore);
  
  return {
    points: points.map(p => ({
      latitude: p.latitude,
      longitude: p.longitude
    })),
    color: riskLevel.color,
    width: 3,
    dottedLine: false,
    arrowLine: true,
    arrowIconPath: '/static/icons/arrow.png',
    borderColor: riskLevel.color,
    colorList: [riskLevel.color],
    zIndex: 0
  };
}

/**
 * 计算两点之间的距离（单位：米）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 计算预警范围半径（基于风险评分）
 */
export function calculateAlertRadius(riskScore, baseRadius = 500) {
  // 风险评分越高，预警范围越大
  const radiusMultiplier = (riskScore / 100) * 3; // 最大3倍
  return baseRadius * radiusMultiplier;
}

/**
 * 生成走私路径点
 */
export function generateDiffusionPath(sourcePoint, windDirection, distance, steps = 5) {
  const points = [sourcePoint];
  const stepDistance = distance / steps;
  
  for (let i = 1; i <= steps; i++) {
    const angle = windDirection * Math.PI / 180;
    const lat = sourcePoint.latitude + (stepDistance * i / 111000) * Math.cos(angle);
    const lon = sourcePoint.longitude + (stepDistance * i / 111000) * Math.sin(angle) / Math.cos(sourcePoint.latitude * Math.PI / 180);
    
    points.push({
      latitude: lat,
      longitude: lon
    });
  }
  
  return points;
}

/**
 * 格式化监测数据
 */
export function formatSensorData(sensor) {
  return {
    id: sensor.id,
    name: sensor.name,
    type: sensor.type,
    status: sensor.status,
    latitude: sensor.latitude,
    longitude: sensor.longitude,
    lastUpdate: new Date(sensor.last_update),
    data: {
      // 水质数据
      pH: sensor.pH,
      temperature: sensor.temperature,
      COD: sensor.COD,
      // 大气数据
      PM25: sensor.PM25,
      AQI: sensor.AQI,
      SO2: sensor.SO2,
      // 活体物种数据
      heavy_metal: sensor.heavy_metal,
      organic: sensor.organic
    }
  };
}

/**
 * 检查是否需要预警
 */
export function shouldAlert(sensorData, thresholds) {
  for (const [key, threshold] of Object.entries(thresholds)) {
    if (sensorData.data[key] && sensorData.data[key] > threshold) {
      return true;
    }
  }
  return false;
}

/**
 * 生成预警信息
 */
export function generateAlert(sensor, riskScore, message) {
  const riskLevel = getRiskLevelByScore(riskScore);
  
  return {
    id: `alert_${sensor.id}_${Date.now()}`,
    sensor_id: sensor.id,
    sensor_name: sensor.name,
    type: sensor.type,
    level: riskLevel.key,
    risk_score: riskScore,
    message: message,
    timestamp: new Date(),
    location: {
      latitude: sensor.latitude,
      longitude: sensor.longitude
    }
  };
}

export default {
  alertSourceTypes,
  mapLayers,
  riskLevels,
  toolbarByCategory,
  getAlertSourceType,
  getMapLayer,
  getRiskLevel,
  getRiskLevelByScore,
  getToolbarByCategory,
  generateMarker,
  generateCircle,
  generatePolyline,
  calculateDistance,
  calculateAlertRadius,
  generateDiffusionPath,
  formatSensorData,
  shouldAlert,
  generateAlert
};
