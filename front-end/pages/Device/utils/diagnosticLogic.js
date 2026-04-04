/**
 * 设备诊断逻辑
 * 设备状态分级逻辑（计算健康分数、报警阈值）
 */

/**
 * 计算系统健康分数
 * @param {Array} devices - 设备列表
 * @returns {number} - 健康分数 (0-100)
 */
export function calculateHealthScore(devices) {
	if (!devices || devices.length === 0) return 0
	
	let totalScore = 0
	
	devices.forEach(device => {
		let deviceScore = 100
		
		// 状态扣分
		if (device.status === 'offline') {
			deviceScore = 0
		} else if (device.status === 'warning') {
			deviceScore -= 30
		}
		
		// 电量扣分
		if (device.battery < 20) {
			deviceScore -= 20
		} else if (device.battery < 50) {
			deviceScore -= 10
		}
		
		// 信号扣分
		if (device.signal < 40) {
			deviceScore -= 20
		} else if (device.signal < 70) {
			deviceScore -= 10
		}
		
		totalScore += Math.max(deviceScore, 0)
	})
	
	return Math.round(totalScore / devices.length)
}

/**
 * 评估设备状态
 * @param {Object} device - 设备对象
 * @returns {string} - 状态等级: online, warning, offline
 */
export function evaluateDeviceStatus(device) {
	// 离线判断
	const now = new Date()
	const lastActive = new Date(device.lastActive)
	const inactiveMinutes = (now - lastActive) / 1000 / 60
	
	if (inactiveMinutes > 60) {
		return 'offline'
	}
	
	// 预警判断
	if (device.battery < 20 || device.signal < 40) {
		return 'warning'
	}
	
	return 'online'
}

/**
 * 按优先级排序设备
 * @param {Array} devices - 设备列表
 * @returns {Array} - 排序后的设备列表
 */
export function sortDevicesByPriority(devices) {
	return [...devices].sort((a, b) => {
		// 优先级权重
		const priorityMap = {
			offline: 3,
			warning: 2,
			online: 1
		}
		
		// 按状态排序
		const priorityDiff = priorityMap[b.status] - priorityMap[a.status]
		if (priorityDiff !== 0) return priorityDiff
		
		// 相同状态下，按电量排序（低电量优先）
		return a.battery - b.battery
	})
}

/**
 * 判断设备是否需要检查
 * @param {Object} device - 设备对象
 * @param {Object} currentLocation - 当前位置
 * @returns {boolean} - 是否需要检查
 */
export function shouldCheckDevice(device, currentLocation) {
	// 离线或低电量
	if (device.status === 'offline' || device.battery < 20) {
		// 如果提供了当前位置，检查距离
		if (currentLocation && device.location) {
			const distance = calculateDistance(currentLocation, device.location)
			// 距离小于500米时建议检查
			return distance < 500
		}
		return true
	}
	return false
}

/**
 * 计算两点之间的距离（米）
 */
function calculateDistance(point1, point2) {
	const R = 6371000
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
 * 生成设备健康报告
 * @param {Array} devices - 设备列表
 * @returns {Object} - 健康报告
 */
export function generateHealthReport(devices) {
	const report = {
		totalDevices: devices.length,
		onlineDevices: 0,
		warningDevices: 0,
		offlineDevices: 0,
		lowBatteryDevices: [],
		weakSignalDevices: [],
		criticalDevices: [],
		healthScore: 0
	}
	
	devices.forEach(device => {
		// 统计状态
		if (device.status === 'online') {
			report.onlineDevices++
		} else if (device.status === 'warning') {
			report.warningDevices++
		} else {
			report.offlineDevices++
		}
		
		// 低电量设备
		if (device.battery < 20) {
			report.lowBatteryDevices.push(device)
		}
		
		// 弱信号设备
		if (device.signal < 40) {
			report.weakSignalDevices.push(device)
		}
		
		// 关键设备（离线或低电量）
		if (device.status === 'offline' || device.battery < 10) {
			report.criticalDevices.push(device)
		}
	})
	
	// 计算健康分数
	report.healthScore = calculateHealthScore(devices)
	
	return report
}

/**
 * 获取设备状态文本
 * @param {string} status - 状态
 * @returns {string} - 状态文本
 */
export function getStatusText(status) {
	const statusMap = {
		online: '在线',
		warning: '预警',
		offline: '离线'
	}
	return statusMap[status] || '未知'
}

/**
 * 获取设备类型文本
 * @param {string} type - 类型
 * @returns {string} - 类型文本
 */
export function getDeviceTypeText(type) {
	const typeMap = {
		'camera-visible': '可见光摄像头',
		'camera-infrared': '红外摄像头',
		'fiber': '震动光纤',
		'smell': '气味探头'
	}
	return typeMap[type] || '未知设备'
}

/**
 * 判断是否需要报警
 * @param {Object} device - 设备对象
 * @returns {boolean} - 是否需要报警
 */
export function shouldAlert(device) {
	// 离线超过2小时
	const now = new Date()
	const lastActive = new Date(device.lastActive)
	const inactiveHours = (now - lastActive) / 1000 / 60 / 60
	
	if (inactiveHours > 2) return true
	
	// 电量低于10%
	if (device.battery < 10) return true
	
	// 信号低于30%
	if (device.signal < 30) return true
	
	return false
}

/**
 * 计算设备在线率
 * @param {Array} devices - 设备列表
 * @returns {number} - 在线率 (0-100)
 */
export function calculateOnlineRate(devices) {
	if (!devices || devices.length === 0) return 0
	
	const onlineCount = devices.filter(d => d.status === 'online').length
	return Math.round((onlineCount / devices.length) * 100)
}

/**
 * 导出所有方法
 */
export default {
	calculateHealthScore,
	evaluateDeviceStatus,
	sortDevicesByPriority,
	shouldCheckDevice,
	generateHealthReport,
	getStatusText,
	getDeviceTypeText,
	shouldAlert,
	calculateOnlineRate
}
