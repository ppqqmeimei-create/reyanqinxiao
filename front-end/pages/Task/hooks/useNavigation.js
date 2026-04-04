/**
 * 导航计算工具
 * 计算拦截点偏差角与步速引导
 */

/**
 * 计算两点之间的距离（米）
 * 使用 Haversine 公式
 */
export function calculateDistance(point1, point2) {
	const R = 6371000 // 地球半径（米）
	const lat1 = point1.latitude * Math.PI / 180
	const lat2 = point2.latitude * Math.PI / 180
	const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180
	const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180
	
	const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
			  Math.cos(lat1) * Math.cos(lat2) *
			  Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
	
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	
	return R * c
}

/**
 * 计算两点之间的方位角（度）
 * 以北为0度，顺时针
 */
export function calculateBearing(point1, point2) {
	const lat1 = point1.latitude * Math.PI / 180
	const lat2 = point2.latitude * Math.PI / 180
	const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180
	
	const y = Math.sin(deltaLng) * Math.cos(lat2)
	const x = Math.cos(lat1) * Math.sin(lat2) -
			  Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
	
	const bearing = Math.atan2(y, x) * 180 / Math.PI
	
	return (bearing + 360) % 360
}

/**
 * 计算预计到达时间（秒）
 * @param {number} distance - 距离（米）
 * @param {number} speed - 速度（米/秒），默认3m/s
 */
export function calculateETA(distance, speed = 3) {
	return Math.ceil(distance / speed)
}

/**
 * 计算建议速度
 * @param {number} distance - 距离（米）
 * @param {number} timeLimit - 时间限制（秒）
 */
export function calculateRecommendedSpeed(distance, timeLimit) {
	return distance / timeLimit
}

/**
 * 获取方位文本
 * @param {number} bearing - 方位角（度）
 */
export function getBearingText(bearing) {
	const directions = [
		{ name: '北', min: 337.5, max: 22.5 },
		{ name: '东北', min: 22.5, max: 67.5 },
		{ name: '东', min: 67.5, max: 112.5 },
		{ name: '东南', min: 112.5, max: 157.5 },
		{ name: '南', min: 157.5, max: 202.5 },
		{ name: '西南', min: 202.5, max: 247.5 },
		{ name: '西', min: 247.5, max: 292.5 },
		{ name: '西北', min: 292.5, max: 337.5 }
	]
	
	for (const dir of directions) {
		if (bearing >= dir.min && bearing < dir.max) {
			return dir.name
		}
	}
	
	return '北'
}

/**
 * 计算偏差角
 * @param {number} currentBearing - 当前朝向
 * @param {number} targetBearing - 目标方位
 */
export function calculateDeviationAngle(currentBearing, targetBearing) {
	let deviation = targetBearing - currentBearing
	
	// 归一化到 -180 到 180 度
	if (deviation > 180) {
		deviation -= 360
	} else if (deviation < -180) {
		deviation += 360
	}
	
	return deviation
}

/**
 * 获取导航指令
 * @param {number} deviationAngle - 偏差角
 */
export function getNavigationInstruction(deviationAngle) {
	const absDeviation = Math.abs(deviationAngle)
	
	if (absDeviation < 15) {
		return '直行'
	} else if (absDeviation < 45) {
		return deviationAngle > 0 ? '稍向右转' : '稍向左转'
	} else if (absDeviation < 90) {
		return deviationAngle > 0 ? '向右转' : '向左转'
	} else if (absDeviation < 135) {
		return deviationAngle > 0 ? '大幅右转' : '大幅左转'
	} else {
		return '掉头'
	}
}

/**
 * 计算拦截点
 * 根据目标移动方向和速度，计算最佳拦截位置
 */
export function calculateInterceptPoint(targetPos, targetVelocity, patrolPos, patrolSpeed) {
	const { latitude: tLat, longitude: tLng } = targetPos
	const { speed: tSpeed, direction: tDir } = targetVelocity
	const { latitude: pLat, longitude: pLng } = patrolPos
	
	// 计算目标速度向量
	const tVx = tSpeed * Math.sin(tDir * Math.PI / 180)
	const tVy = tSpeed * Math.cos(tDir * Math.PI / 180)
	
	// 计算相对位置
	const dx = (tLng - pLng) * 111000 * Math.cos(pLat * Math.PI / 180)
	const dy = (tLat - pLat) * 111000
	
	// 求解拦截时间
	const a = tVx * tVx + tVy * tVy - patrolSpeed * patrolSpeed
	const b = 2 * (dx * tVx + dy * tVy)
	const c = dx * dx + dy * dy
	
	const discriminant = b * b - 4 * a * c
	
	if (discriminant < 0) {
		// 无法拦截，返回目标当前位置
		return { latitude: tLat, longitude: tLng, interceptTime: Infinity }
	}
	
	const t = (-b - Math.sqrt(discriminant)) / (2 * a)
	
	if (t < 0) {
		// 已经错过拦截时机
		return { latitude: tLat, longitude: tLng, interceptTime: 0 }
	}
	
	// 计算拦截点
	const interceptLat = tLat + (tVy * t) / 111000
	const interceptLng = tLng + (tVx * t) / (111000 * Math.cos(tLat * Math.PI / 180))
	
	return {
		latitude: interceptLat,
		longitude: interceptLng,
		interceptTime: t
	}
}

/**
 * 格式化距离显示
 * @param {number} distance - 距离（米）
 */
export function formatDistance(distance) {
	if (distance < 1000) {
		return Math.round(distance) + 'm'
	} else {
		return (distance / 1000).toFixed(1) + 'km'
	}
}

/**
 * 格式化时间显示
 * @param {number} seconds - 秒数
 */
export function formatTime(seconds) {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const secs = seconds % 60
	
	if (hours > 0) {
		return `${hours}小时${minutes}分钟`
	} else if (minutes > 0) {
		return `${minutes}分钟${secs}秒`
	} else {
		return `${secs}秒`
	}
}

/**
 * 判断是否接近目标
 * @param {number} distance - 距离（米）
 * @param {number} threshold - 阈值（米），默认50米
 */
export function isNearTarget(distance, threshold = 50) {
	return distance <= threshold
}

/**
 * 导出所有方法
 */
export function useNavigation() {
	return {
		calculateDistance,
		calculateBearing,
		calculateETA,
		calculateRecommendedSpeed,
		getBearingText,
		calculateDeviationAngle,
		getNavigationInstruction,
		calculateInterceptPoint,
		formatDistance,
		formatTime,
		isNearTarget
	}
}

export default {
	calculateDistance,
	calculateBearing,
	calculateETA,
	calculateRecommendedSpeed,
	getBearingText,
	calculateDeviationAngle,
	getNavigationInstruction,
	calculateInterceptPoint,
	formatDistance,
	formatTime,
	isNearTarget
}
