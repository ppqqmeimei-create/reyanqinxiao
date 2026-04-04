/* ==========================================
   预警逻辑处理工具函数
   包含预警分类、风险评分、优先级排序等
   ========================================== */

/**
 * 预警分类
 * @param {Object} alert - 预警对象
 * @returns {String} - 预警级别 (critical, warning, info)
 */
export function classifyAlert(alert) {
	// 根据风险评分分类
	if (alert.riskScore >= 80) {
		return 'critical'
	} else if (alert.riskScore >= 60) {
		return 'warning'
	} else {
		return 'info'
	}
}

/**
 * 计算风险评分
 * @param {Object} alert - 预警对象
 * @returns {Number} - 风险评分 (0-100)
 */
export function calculateRiskScore(alert) {
	let score = 0
	
	// 1. 目标类型权重 (30分)
	const targetWeights = {
		'human': 30,
		'vehicle': 25,
		'animal': 10
	}
	score += targetWeights[alert.target] || 0
	
	// 2. 停留时长权重 (30分)
	const normalDuration = 60 // 正常通过时长60秒
	const durationRatio = alert.duration / normalDuration
	if (durationRatio > 3) {
		score += 30
	} else if (durationRatio > 2) {
		score += 20
	} else if (durationRatio > 1.5) {
		score += 10
	}
	
	// 3. 传感器数量权重 (20分)
	const sensorCount = alert.sensors ? alert.sensors.length : 0
	score += Math.min(sensorCount * 5, 20)
	
	// 4. 时间因素权重 (20分)
	const hour = new Date(alert.time).getHours()
	// 夜间(22:00-6:00)风险更高
	if (hour >= 22 || hour < 6) {
		score += 20
	} else if (hour >= 18 || hour < 8) {
		score += 10
	}
	
	return Math.min(score, 100)
}

/**
 * 预警优先级排序
 * @param {Array} alerts - 预警列表
 * @returns {Array} - 排序后的预警列表
 */
export function sortAlertsByPriority(alerts) {
	return alerts.sort((a, b) => {
		// 1. 未处理的优先于已处理的
		if (a.handled !== b.handled) {
			return a.handled ? 1 : -1
		}
		
		// 2. 风险评分高的优先
		if (a.riskScore !== b.riskScore) {
			return b.riskScore - a.riskScore
		}
		
		// 3. 时间新的优先
		return new Date(b.time) - new Date(a.time)
	})
}

/**
 * 过滤预警
 * @param {Array} alerts - 预警列表
 * @param {Object} filters - 过滤条件
 * @returns {Array} - 过滤后的预警列表
 */
export function filterAlerts(alerts, filters) {
	let filtered = [...alerts]
	
	// 按级别过滤
	if (filters.level && filters.level !== 'all') {
		filtered = filtered.filter(alert => alert.level === filters.level)
	}
	
	// 按目标类型过滤
	if (filters.target && filters.target !== 'all') {
		filtered = filtered.filter(alert => alert.target === filters.target)
	}
	
	// 按位置过滤
	if (filters.location) {
		filtered = filtered.filter(alert => 
			alert.location.includes(filters.location)
		)
	}
	
	// 按时间范围过滤
	if (filters.startTime && filters.endTime) {
		filtered = filtered.filter(alert => {
			const alertTime = new Date(alert.time)
			return alertTime >= filters.startTime && alertTime <= filters.endTime
		})
	}
	
	return filtered
}

/**
 * 获取预警统计
 * @param {Array} alerts - 预警列表
 * @returns {Object} - 统计数据
 */
export function getAlertStatistics(alerts) {
	const stats = {
		total: alerts.length,
		critical: 0,
		warning: 0,
		info: 0,
		handled: 0,
		unhandled: 0,
		byTarget: {
			human: 0,
			vehicle: 0,
			animal: 0
		},
		byLocation: {},
		byHour: Array(24).fill(0)
	}
	
	alerts.forEach(alert => {
		// 按级别统计
		if (alert.level === 'critical') stats.critical++
		else if (alert.level === 'warning') stats.warning++
		else stats.info++
		
		// 按处理状态统计
		if (alert.handled) stats.handled++
		else stats.unhandled++
		
		// 按目标类型统计
		if (alert.target in stats.byTarget) {
			stats.byTarget[alert.target]++
		}
		
		// 按位置统计
		if (alert.location) {
			stats.byLocation[alert.location] = (stats.byLocation[alert.location] || 0) + 1
		}
		
		// 按小时统计
		const hour = new Date(alert.time).getHours()
		stats.byHour[hour]++
	})
	
	return stats
}

/**
 * 判断是否需要立即响应
 * @param {Object} alert - 预警对象
 * @returns {Boolean} - 是否需要立即响应
 */
export function needsImmediateResponse(alert) {
	// 高危预警需要立即响应
	if (alert.level === 'critical') {
		return true
	}
	
	// 人员目标需要立即响应
	if (alert.target === 'human') {
		return true
	}
	
	// 风险评分超过85需要立即响应
	if (alert.riskScore >= 85) {
		return true
	}
	
	return false
}

/**
 * 生成预警摘要
 * @param {Object} alert - 预警对象
 * @returns {String} - 预警摘要
 */
export function generateAlertSummary(alert) {
	const targetText = {
		'human': '疑似人员',
		'vehicle': '疑似车辆',
		'animal': '疑似动物'
	}[alert.target] || '未知目标'
	
	const levelText = {
		'critical': '高危',
		'warning': '预警',
		'info': '信息'
	}[alert.level] || ''
	
	return `${levelText}：${alert.location}检测到${targetText}，停留${alert.duration}秒，风险评分${alert.riskScore}`
}

/**
 * 计算预警趋势
 * @param {Array} alerts - 预警列表
 * @param {Number} days - 天数
 * @returns {Object} - 趋势数据
 */
export function calculateAlertTrend(alerts, days = 7) {
	const now = new Date()
	const trend = {
		dates: [],
		counts: [],
		criticalCounts: []
	}
	
	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(now)
		date.setDate(date.getDate() - i)
		date.setHours(0, 0, 0, 0)
		
		const nextDate = new Date(date)
		nextDate.setDate(nextDate.getDate() + 1)
		
		const dayAlerts = alerts.filter(alert => {
			const alertTime = new Date(alert.time)
			return alertTime >= date && alertTime < nextDate
		})
		
		trend.dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
		trend.counts.push(dayAlerts.length)
		trend.criticalCounts.push(
			dayAlerts.filter(a => a.level === 'critical').length
		)
	}
	
	return trend
}

/**
 * 预警去重
 * @param {Array} alerts - 预警列表
 * @param {Number} timeWindow - 时间窗口（毫秒）
 * @param {Number} distanceThreshold - 距离阈值（米）
 * @returns {Array} - 去重后的预警列表
 */
export function deduplicateAlerts(alerts, timeWindow = 300000, distanceThreshold = 100) {
	const deduplicated = []
	const processed = new Set()
	
	alerts.forEach((alert, index) => {
		if (processed.has(index)) return
		
		// 查找相似预警
		const similar = alerts.filter((other, otherIndex) => {
			if (otherIndex <= index || processed.has(otherIndex)) return false
			
			// 时间接近
			const timeDiff = Math.abs(new Date(alert.time) - new Date(other.time))
			if (timeDiff > timeWindow) return false
			
			// 位置接近
			const distance = calculateDistance(
				alert.latitude, alert.longitude,
				other.latitude, other.longitude
			)
			if (distance > distanceThreshold) return false
			
			// 目标类型相同
			if (alert.target !== other.target) return false
			
			return true
		})
		
		// 合并相似预警
		if (similar.length > 0) {
			const merged = {
				...alert,
				riskScore: Math.max(alert.riskScore, ...similar.map(s => s.riskScore)),
				sensors: [...alert.sensors, ...similar.flatMap(s => s.sensors)]
			}
			deduplicated.push(merged)
			similar.forEach((_, i) => processed.add(alerts.indexOf(similar[i])))
		} else {
			deduplicated.push(alert)
		}
		
		processed.add(index)
	})
	
	return deduplicated
}

/**
 * 计算两点间距离（米）
 * @param {Number} lat1 - 纬度1
 * @param {Number} lon1 - 经度1
 * @param {Number} lat2 - 纬度2
 * @param {Number} lon2 - 经度2
 * @returns {Number} - 距离（米）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 6371000 // 地球半径（米）
	const dLat = (lat2 - lat1) * Math.PI / 180
	const dLon = (lon2 - lon1) * Math.PI / 180
	const a = 
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

export default {
	classifyAlert,
	calculateRiskScore,
	sortAlertsByPriority,
	filterAlerts,
	getAlertStatistics,
	needsImmediateResponse,
	generateAlertSummary,
	calculateAlertTrend,
	deduplicateAlerts
}
