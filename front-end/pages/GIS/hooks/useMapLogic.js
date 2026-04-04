/**
 * 地图逻辑处理工具
 * 处理坐标转换、影子追踪算法、轨迹平滑等逻辑
 */

/**
 * 影子追踪算法
 * 根据目标最后已知位置和速度，预测可能的位置范围
 */
export function calculateShadowPath(lastPosition, velocity, timeElapsed) {
	const { latitude, longitude } = lastPosition
	const { speed, direction } = velocity
	
	// 计算可能的移动距离（米）
	const maxDistance = speed * timeElapsed
	
	// 根据方向计算预测位置
	const predictedLat = latitude + (maxDistance * Math.cos(direction * Math.PI / 180)) / 111000
	const predictedLng = longitude + (maxDistance * Math.sin(direction * Math.PI / 180)) / (111000 * Math.cos(latitude * Math.PI / 180))
	
	// 计算概率扩散半径（随时间增加不确定性）
	const uncertaintyRadius = Math.min(maxDistance * 0.3 + timeElapsed * 2, 500)
	
	return {
		predictedPosition: {
			latitude: predictedLat,
			longitude: predictedLng
		},
		uncertaintyRadius,
		probability: Math.max(100 - timeElapsed * 5, 20) // 概率随时间衰减
	}
}

/**
 * 轨迹平滑算法
 * 使用移动平均法平滑GPS轨迹点
 */
export function smoothTrajectory(points, windowSize = 5) {
	if (points.length < windowSize) return points
	
	const smoothed = []
	const halfWindow = Math.floor(windowSize / 2)
	
	for (let i = 0; i < points.length; i++) {
		const start = Math.max(0, i - halfWindow)
		const end = Math.min(points.length, i + halfWindow + 1)
		const window = points.slice(start, end)
		
		const avgLat = window.reduce((sum, p) => sum + p.latitude, 0) / window.length
		const avgLng = window.reduce((sum, p) => sum + p.longitude, 0) / window.length
		
		smoothed.push({
			latitude: avgLat,
			longitude: avgLng
		})
	}
	
	return smoothed
}

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
 * 判断点是否在多边形内
 * 使用射线法
 */
export function isPointInPolygon(point, polygon) {
	let inside = false
	const x = point.longitude
	const y = point.latitude
	
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].longitude
		const yi = polygon[i].latitude
		const xj = polygon[j].longitude
		const yj = polygon[j].latitude
		
		const intersect = ((yi > y) !== (yj > y)) &&
						  (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
		
		if (intersect) inside = !inside
	}
	
	return inside
}

/**
 * 生成拓扑连接线
 * 连接相邻的传感器节点
 */
export function generateTopologyLinks(sensors, maxDistance = 1000) {
	const links = []
	
	for (let i = 0; i < sensors.length; i++) {
		for (let j = i + 1; j < sensors.length; j++) {
			const distance = calculateDistance(
				{ latitude: sensors[i].latitude, longitude: sensors[i].longitude },
				{ latitude: sensors[j].latitude, longitude: sensors[j].longitude }
			)
			
			if (distance <= maxDistance) {
				links.push({
					id: `link-${i}-${j}`,
					from: sensors[i].id,
					to: sensors[j].id,
					distance,
					points: [
						{ latitude: sensors[i].latitude, longitude: sensors[i].longitude },
						{ latitude: sensors[j].latitude, longitude: sensors[j].longitude }
					]
				})
			}
		}
	}
	
	return links
}

/**
 * 计算拦截点
 * 根据目标位置和巡逻员位置，计算最佳拦截点
 */
export function calculateInterceptPoint(targetPos, targetVelocity, patrolPos, patrolSpeed) {
	const { latitude: tLat, longitude: tLng } = targetPos
	const { speed: tSpeed, direction: tDir } = targetVelocity
	const { latitude: pLat, longitude: pLng } = patrolPos
	
	// 简化计算：假设目标直线运动
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
 * 坐标系转换：WGS84 转 GCJ02（火星坐标系）
 */
export function wgs84ToGcj02(wgsLat, wgsLng) {
	const a = 6378245.0
	const ee = 0.00669342162296594323
	
	let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0)
	let dLng = transformLng(wgsLng - 105.0, wgsLat - 35.0)
	
	const radLat = wgsLat / 180.0 * Math.PI
	let magic = Math.sin(radLat)
	magic = 1 - ee * magic * magic
	const sqrtMagic = Math.sqrt(magic)
	
	dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI)
	dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI)
	
	return {
		latitude: wgsLat + dLat,
		longitude: wgsLng + dLng
	}
}

function transformLat(x, y) {
	let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
	ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
	ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
	ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
	return ret
}

function transformLng(x, y) {
	let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
	ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
	ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
	ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
	return ret
}

/**
 * 导出所有方法
 */
export function useMapLogic() {
	return {
		calculateShadowPath,
		smoothTrajectory,
		calculateDistance,
		calculateBearing,
		isPointInPolygon,
		generateTopologyLinks,
		calculateInterceptPoint,
		wgs84ToGcj02
	}
}
