/**
 * ==========================================
 * 影子追踪算法 v2.0 - 犯罪行为模式增强版
 * ==========================================
 *
 * 升级说明：
 * v1.0: 纯物理运动模型（线性外推）
 * v2.0: 融合犯罪行为模式 + 环境约束
 *
 * 融合权重：
 * - 物理运动模型: 30%
 * - 犯罪行为模式: 40%
 * - 环境上下文约束: 30%
 */

import { BUSINESS_CONSTANTS } from './systemConfig.js';

// 边境走私典型行为模式库
const CRIMINAL_PATTERNS = {
  // 夜间运输模式（22:00 - 05:00）
  NIGHT_TRANSPORT: {
    weight: 0.85,
    timeRange: { start: 22, end: 5 },
    typicalSpeed: { min: 30, max: 60 }, // km/h
    routePreference: ['小路', '山路', '林间道'],
    restDuration: { min: 5, max: 30 }, // 分钟
  },
  // 昼间小额走私模式
  DAY_SMUGGLING: {
    weight: 0.65,
    timeRange: { start: 6, end: 21 },
    typicalSpeed: { min: 20, max: 40 },
    routePreference: ['常规道路', '村道'],
    restDuration: { min: 10, max: 60 },
  },
  // 团伙作案模式
  GROUP_OPERATION: {
    weight: 0.75,
    minVehicles: 2,
    coordinationInterval: { min: 5, max: 15 }, // 分钟
    spreadDistance: { min: 500, max: 2000 }, // 米
    typicalSpeed: { min: 40, max: 80 },
  },
  // 快速冲关模式
  RAPID_ESCAPE: {
    weight: 0.90,
    typicalSpeed: { min: 80, max: 120 },
    accelerationPhase: true,
    noStop: true,
  },
  // 伪装正常模式
  NORMAL_DISGUISE: {
    weight: 0.55,
    typicalSpeed: { min: 30, max: 50 },
    obeysTraffic: true,
    restDuration: { min: 30, max: 120 },
  },
};

// 环境约束因素
const ENVIRONMENT_CONSTRAINTS = {
  // 边境地形约束
  terrain: {
    MOUNTAIN: { speedFactor: 0.4, routeFactor: 0.3 },
    FOREST: { speedFactor: 0.6, routeFactor: 0.5 },
    ROAD: { speedFactor: 1.0, routeFactor: 0.9 },
    WATER: { speedFactor: 0.0, routeFactor: 0.0 },
    SETTLEMENT: { speedFactor: 0.7, routeFactor: 0.8 },
  },
  // 卡口约束（走私分子会刻意绕行）
  checkpointRadius: 2000, // 米，会绕开2km内卡口
  // 保护区约束
  protectedAreaWeight: 0.8, // 减少进入保护区的概率
  // 季节性约束
  seasonalFactor: {
    dry: { monthRange: [11, 12, 1, 2], factor: 1.2 }, // 旱季活动频繁
    wet: { monthRange: [5, 6, 7, 8, 9], factor: 0.7 }, // 雨季减少活动
  },
};

// 历史行为学习（简化版）
class BehaviorLearner {
  constructor() {
    this.routeHistory = new Map(); // 目标ID -> 路线偏好
    this.speedHistory = new Map(); // 目标ID -> 速度模式
    this.timeHistory = new Map(); // 目标ID -> 时间窗口
  }

  /**
   * 学习目标的历史行为
   */
  learn(targetId, trajectory) {
    if (!trajectory || trajectory.length < 3) return;

    // 学习路线偏好（简化：统计经过的地点类型）
    const routes = trajectory.map(p => p.terrainType || 'ROAD').filter(Boolean);
    const routePreference = this.countFrequency(routes);
    this.routeHistory.set(targetId, routePreference);

    // 学习速度模式
    const speeds = trajectory.map(p => p.speed || 0).filter(s => s > 0);
    if (speeds.length > 0) {
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const variance = speeds.reduce((acc, s) => acc + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
      this.speedHistory.set(targetId, { avgSpeed, variance });
    }

    // 学习时间窗口
    const hours = trajectory.map(p => new Date(p.timestamp).getHours()).filter(h => h !== undefined);
    if (hours.length > 0) {
      this.timeHistory.set(targetId, {
        preferredHours: this.countFrequency(hours),
        avgHour: Math.round(hours.reduce((a, b) => a + b, 0) / hours.length),
      });
    }
  }

  countFrequency(arr) {
    const freq = {};
    arr.forEach(item => { freq[item] = (freq[item] || 0) + 1; });
    return freq;
  }

  /**
   * 获取目标的路线偏好
   */
  getRoutePreference(targetId) {
    return this.routeHistory.get(targetId) || {};
  }

  /**
   * 获取目标的速度模式
   */
  getSpeedPattern(targetId) {
    return this.speedHistory.get(targetId) || { avgSpeed: 40, variance: 10 };
  }

  /**
   * 获取目标的时间窗口
   */
  getTimePreference(targetId) {
    return this.timeHistory.get(targetId) || { avgHour: 2 };
  }
}

// 全局学习器实例
const globalLearner = new BehaviorLearner();

/**
 * v2.0影子追踪主算法
 *
 * @param {Object} params - 输入参数
 * @param {Array} params.currentTrajectory - 当前轨迹点 [{lat, lng, speed, timestamp, terrainType}]
 * @param {string} params.targetId - 目标唯一标识
 * @param {number} params.timeWindow - 预测时间窗口（秒）
 * @param {Object} params.environment - 环境上下文
 * @returns {Object} 预测结果
 */
export function shadowTrackingV2(params) {
  const {
    currentTrajectory = [],
    targetId = 'unknown',
    timeWindow = 1800, // 默认30分钟
    environment = {},
  } = params;

  if (currentTrajectory.length < 2) {
    return _generateFallbackPrediction(timeWindow);
  }

  // ===== 1. 物理运动模型 (30%) =====
  const physicsResult = _physicsBasedPrediction(currentTrajectory, timeWindow);

  // ===== 2. 犯罪行为模式 (40%) =====
  const patternResult = _criminalPatternPrediction(currentTrajectory, targetId, timeWindow);

  // ===== 3. 环境约束 (30%) =====
  const envResult = _environmentConstraintPrediction(
    currentTrajectory,
    timeWindow,
    environment
  );

  // ===== 4. 融合计算 =====
  const weights = { physics: 0.3, pattern: 0.4, env: 0.3 };
  const fusionResult = _fusePredictions(physicsResult, patternResult, envResult, weights);

  // ===== 5. 影子点生成 =====
  const shadowPoints = _generateShadowPoints(fusionResult, timeWindow);

  // ===== 6. 置信度评估 =====
  const confidence = _assessConfidence(currentTrajectory, patternResult, envResult);

  return {
    shadowPoints,
    primaryDirection: fusionResult.direction,
    primarySpeed: fusionResult.avgSpeed,
    confidence,
    confidenceLevel: confidence >= 0.8 ? 'HIGH' : confidence >= 0.5 ? 'MEDIUM' : 'LOW',
    predictedArea: fusionResult.predictedArea,
    recommendedAction: _getRecommendedAction(fusionResult),
    algorithm: 'shadowTrackingV2',
    weights,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 物理运动模型（线性外推）
 */
function _physicsBasedPrediction(trajectory, timeWindow) {
  const last = trajectory[trajectory.length - 1];
  const prev = trajectory[trajectory.length - 2];

  // 计算速度和方向
  const timeDiff = (new Date(last.timestamp) - new Date(prev.timestamp)) / 1000; // 秒
  const distance = _haversineDistance(prev.lat, prev.lng, last.lat, last.lng); // 米
  const speed = timeDiff > 0 ? (distance / timeDiff) * 3.6 : 40; // km/h
  const direction = _calculateBearing(prev.lat, prev.lng, last.lat, last.lng); // 度

  // 加速度（简化）
  const prevSpeed = prev.speed || speed;
  const acceleration = (speed - prevSpeed) / timeDiff; // m/s²

  // 时间窗口内的位移
  const futurePositions = [];
  const intervals = Math.min(12, Math.ceil(timeWindow / 300)); // 每5分钟一个点

  for (let i = 1; i <= intervals; i++) {
    const futureTime = timeWindow * (i / intervals); // 秒
    const adjustedSpeed = Math.max(10, Math.min(120, speed + acceleration * futureTime));
    const distance = (adjustedSpeed / 3.6) * futureTime; // 米
    const rad = direction * Math.PI / 180;
    futurePositions.push({
      lat: last.lat + (distance / 111000) * Math.cos(rad),
      lng: last.lng + (distance / (111000 * Math.cos(last.lat * Math.PI / 180))) * Math.sin(rad),
      speed: adjustedSpeed,
      timestamp: new Date(new Date(last.timestamp).getTime() + futureTime * 1000).toISOString(),
      confidence: Math.max(0.3, 1 - i * 0.08),
    });
  }

  return {
    positions: futurePositions,
    avgSpeed: speed,
    direction,
    acceleration,
    confidence: 0.5,
  };
}

/**
 * 犯罪行为模式预测
 */
function _criminalPatternPrediction(trajectory, targetId, timeWindow) {
  const last = trajectory[trajectory.length - 1];
  const currentHour = new Date(last.timestamp).getHours();
  const currentSpeed = last.speed || 40;

  // 检测匹配的犯罪模式
  let matchedPattern = null;
  let patternWeight = 0;

  // 夜间运输模式
  if ((currentHour >= 22 || currentHour < 5) && currentSpeed >= 30) {
    matchedPattern = CRIMINAL_PATTERNS.NIGHT_TRANSPORT;
    patternWeight = matchedPattern.weight;
  }
  // 快速冲关模式
  else if (currentSpeed >= 80) {
    matchedPattern = CRIMINAL_PATTERNS.RAPID_ESCAPE;
    patternWeight = matchedPattern.weight;
  }
  // 团伙作案
  else if (trajectory.length >= 3) {
    const speeds = trajectory.map(t => t.speed || 0);
    const variance = speeds.reduce((acc, s) => acc + Math.pow(s - speeds[0], 2), 0) / speeds.length;
    if (variance < 5) {
      matchedPattern = CRIMINAL_PATTERNS.GROUP_OPERATION;
      patternWeight = matchedPattern.weight;
    }
  }

  // 如果有历史学习数据，应用学习到的偏好
  const learnedRoute = globalLearner.getRoutePreference(targetId);
  const learnedSpeed = globalLearner.getSpeedPattern(targetId);
  const learnedTime = globalLearner.getTimePreference(targetId);

  // 基于模式生成预测
  const futurePositions = [];
  const intervals = Math.min(12, Math.ceil(timeWindow / 300));
  const direction = trajectory.length >= 2
    ? _calculateBearing(
        trajectory[trajectory.length - 2].lat, trajectory[trajectory.length - 2].lng,
        last.lat, last.lng
      )
    : 90;

  for (let i = 1; i <= intervals; i++) {
    // 基于模式的预测速度
    let speed = matchedPattern
      ? matchedPattern.typicalSpeed.min +
        (matchedPattern.typicalSpeed.max - matchedPattern.typicalSpeed.min) * (i / intervals)
      : learnedSpeed.avgSpeed;

    // 如果有历史偏好，做偏移
    speed = Math.max(20, speed + (Math.random() - 0.5) * learnedSpeed.variance);

    const futureTime = timeWindow * (i / intervals);
    const distance = (speed / 3.6) * futureTime;

    // 方向偏移（基于路线偏好）
    let dirOffset = 0;
    if (Object.keys(learnedRoute).length > 0) {
      const routeKeys = Object.keys(learnedRoute);
      dirOffset = routeKeys.indexOf('ROAD') >= 0 ? 0 : 15 * (Math.random() - 0.5);
    }

    const rad = (direction + dirOffset) * Math.PI / 180;
    futurePositions.push({
      lat: last.lat + (distance / 111000) * Math.cos(rad),
      lng: last.lng + (distance / (111000 * Math.cos(last.lat * Math.PI / 180))) * Math.sin(rad),
      speed,
      timestamp: new Date(new Date(last.timestamp).getTime() + futureTime * 1000).toISOString(),
      confidence: patternWeight * (1 - i * 0.05),
      pattern: matchedPattern?.weight ? matchedPattern : null,
    });
  }

  // 学习当前轨迹
  globalLearner.learn(targetId, trajectory);

  return {
    positions: futurePositions,
    avgSpeed: matchedPattern
      ? (matchedPattern.typicalSpeed.min + matchedPattern.typicalSpeed.max) / 2
      : learnedSpeed.avgSpeed,
    direction,
    matchedPattern: matchedPattern?.weight ? matchedPattern : null,
    confidence: patternWeight,
  };
}

/**
 * 环境约束预测
 */
function _environmentConstraintPrediction(trajectory, timeWindow, environment) {
  const last = trajectory[trajectory.length - 1];
  const terrain = environment.terrain || 'ROAD';
  const terrainConfig = ENVIRONMENT_CONSTRAINTS.terrain[terrain] || ENVIRONMENT_CONSTRAINTS.terrain.ROAD;

  // 计算季节因子
  const month = new Date().getMonth() + 1;
  let seasonalFactor = 1.0;
  for (const [key, value] of Object.entries(ENVIRONMENT_CONSTRAINTS.seasonalFactor)) {
    if (value.monthRange.includes(month)) {
      seasonalFactor = value.factor;
      break;
    }
  }

  // 卡口规避预测
  const checkpoints = environment.checkpoints || [];
  const direction = trajectory.length >= 2
    ? _calculateBearing(
        trajectory[trajectory.length - 2].lat, trajectory[trajectory.length - 2].lng,
        last.lat, last.lng
      )
    : 90;

  const futurePositions = [];
  const intervals = Math.min(12, Math.ceil(timeWindow / 300));
  const baseSpeed = (last.speed || 40) * terrainConfig.speedFactor * seasonalFactor;

  for (let i = 1; i <= intervals; i++) {
    const speed = Math.max(5, baseSpeed * (0.8 + 0.2 * Math.random()));

    // 检查是否有卡口需要绕行
    let dirOffset = 0;
    const nextPos = _extrapolatePosition(last, direction, speed, timeWindow * (i / intervals));

    checkpoints.forEach(cp => {
      const dist = _haversineDistance(nextPos.lat, nextPos.lng, cp.lat, cp.lng);
      if (dist < ENVIRONMENT_CONSTRAINTS.checkpointRadius) {
        // 绕行偏移
        dirOffset += (Math.random() > 0.5 ? 1 : -1) * 30 * (1 - dist / ENVIRONMENT_CONSTRAINTS.checkpointRadius);
      }
    });

    const rad = (direction + dirOffset) * Math.PI / 180;
    const futureTime = timeWindow * (i / intervals);
    const distance = (speed / 3.6) * futureTime;

    futurePositions.push({
      lat: last.lat + (distance / 111000) * Math.cos(rad),
      lng: last.lng + (distance / (111000 * Math.cos(last.lat * Math.PI / 180))) * Math.sin(rad),
      speed,
      timestamp: new Date(new Date(last.timestamp).getTime() + futureTime * 1000).toISOString(),
      confidence: terrainConfig.routeFactor * seasonalFactor * (1 - i * 0.04),
      terrain,
    });
  }

  return {
    positions: futurePositions,
    avgSpeed: baseSpeed,
    direction,
    terrain,
    seasonalFactor,
    confidence: terrainConfig.routeFactor * seasonalFactor,
  };
}

/**
 * 多模型融合
 */
function _fusePredictions(physics, pattern, env, weights) {
  const allPositions = [
    { positions: physics.positions, weight: weights.physics, speed: physics.avgSpeed, direction: physics.direction },
    { positions: pattern.positions, weight: weights.pattern, speed: pattern.avgSpeed, direction: pattern.direction },
    { positions: env.positions, weight: weights.env, speed: env.avgSpeed, direction: env.direction },
  ];

  // 加权平均融合
  const fusedPositions = [];
  const positionsCount = Math.max(...allPositions.map(p => p.positions.length));

  for (let i = 0; i < positionsCount; i++) {
    let latSum = 0, lngSum = 0, speedSum = 0, dirSum = 0, confSum = 0;

    allPositions.forEach(({ positions, weight, speed, direction }) => {
      if (positions[i]) {
        latSum += positions[i].lat * weight;
        lngSum += positions[i].lng * weight;
        speedSum += (positions[i].speed || speed) * weight;
        confSum += (positions[i].confidence || 0.5) * weight;
      }
    });

    const totalWeight = allPositions.reduce((acc, { weight }) => acc + weight, 0);

    fusedPositions.push({
      lat: latSum / totalWeight,
      lng: lngSum / totalWeight,
      speed: speedSum / totalWeight,
      confidence: confSum / totalWeight,
      timestamp: pattern.positions[i]?.timestamp,
    });
  }

  return {
    positions: fusedPositions,
    avgSpeed: fusedPositions.reduce((acc, p) => acc + p.speed, 0) / fusedPositions.length,
    direction: pattern.direction, // 使用模式预测的方向
    predictedArea: _calculatePredictedArea(fusedPositions),
    confidence: allPositions.reduce((acc, p) => acc + p.weight * p.positions[0]?.confidence, 0),
  };
}

/**
 * 生成影子点（用于地图可视化）
 */
function _generateShadowPoints(fusionResult, timeWindow) {
  return fusionResult.positions.map((pos, idx) => ({
    id: `shadow-${idx}`,
    latitude: pos.lat,
    longitude: pos.lng,
    confidence: pos.confidence,
    timestamp: pos.timestamp,
    opacity: Math.max(0.1, pos.confidence * 0.8),
    size: Math.max(8, pos.confidence * 20),
    speed: pos.speed,
    label: `${idx + 1}/${fusionResult.positions.length}`,
  }));
}

/**
 * 计算预测区域（椭圆范围）
 */
function _calculatePredictedArea(positions) {
  if (positions.length < 2) return null;
  const lats = positions.map(p => p.lat);
  const lngs = positions.map(p => p.lng);
  const center = {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
  const radiusLat = (Math.max(...lats) - Math.min(...lats)) / 2 * 111000;
  const radiusLng = (Math.max(...lngs) - Math.min(...lngs)) / 2 * 111000 * Math.cos(center.lat * Math.PI / 180);
  return { center, radiusLat, radiusLng };
}

/**
 * 置信度评估
 */
function _assessConfidence(trajectory, patternResult, envResult) {
  let confidence = 0;

  // 轨迹点数量
  if (trajectory.length >= 5) confidence += 0.25;
  else if (trajectory.length >= 3) confidence += 0.15;
  else if (trajectory.length >= 2) confidence += 0.05;

  // 模式匹配度
  confidence += patternResult.confidence * 0.35;

  // 环境一致性
  confidence += envResult.confidence * 0.25;

  // 时效性（轨迹越新越准确）
  const lastTime = new Date(trajectory[trajectory.length - 1]?.timestamp).getTime();
  const age = Date.now() - lastTime;
  if (age < 60000) confidence += 0.15; // 1分钟内
  else if (age < 300000) confidence += 0.1; // 5分钟内
  else if (age < 900000) confidence += 0.05; // 15分钟内

  return Math.min(Math.max(confidence, 0), 1);
}

/**
 * 获取推荐行动
 */
function _getRecommendedAction(fusionResult) {
  const speed = fusionResult.avgSpeed;
  const confidence = fusionResult.confidence;

  if (confidence >= 0.7 && speed >= 80) {
    return {
      action: 'RAPID_DISPATCH',
      description: '目标高速移动，建议立即调度拦截力量',
      priority: 'IMMEDIATE',
      suggestedPosition: _estimateInterceptPoint(fusionResult),
    };
  }

  if (confidence >= 0.5) {
    return {
      action: 'DISPATCH',
      description: '目标位置可预测，建议部署监控',
      priority: 'PRIORITY',
      suggestedPosition: _estimateInterceptPoint(fusionResult),
    };
  }

  return {
    action: 'MONITOR',
    description: '预测置信度较低，建议持续跟踪',
    priority: 'ROUTINE',
    suggestedPosition: null,
  };
}

function _estimateInterceptPoint(fusionResult) {
  if (!fusionResult.positions || fusionResult.positions.length === 0) return null;
  const midPoint = fusionResult.positions[Math.floor(fusionResult.positions.length / 3)];
  return midPoint ? { lat: midPoint.lat, lng: midPoint.lng } : null;
}

function _generateFallbackPrediction(timeWindow) {
  return {
    shadowPoints: [],
    primaryDirection: null,
    primarySpeed: 0,
    confidence: 0,
    confidenceLevel: 'LOW',
    predictedArea: null,
    recommendedAction: { action: 'MONITOR', description: '数据不足，无法预测', priority: 'ROUTINE' },
    algorithm: 'shadowTrackingV2',
    weights: { physics: 0.3, pattern: 0.4, env: 0.3 },
    timestamp: new Date().toISOString(),
  };
}

// ===== 辅助函数 =====
function _haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function _extrapolatePosition(pos, direction, speed, time) {
  const distance = (speed / 3.6) * time;
  const rad = direction * Math.PI / 180;
  return {
    lat: pos.lat + (distance / 111000) * Math.cos(rad),
    lng: pos.lng + (distance / (111000 * Math.cos(pos.lat * Math.PI / 180))) * Math.sin(rad),
  };
}

export default shadowTrackingV2;
