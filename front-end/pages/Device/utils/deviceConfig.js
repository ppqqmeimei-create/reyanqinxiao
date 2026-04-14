/**
 * 设备界面 - 设备类型与状态配置
 * 文件: front-end/pages/Device/utils/deviceConfig.js
 * 功能: 提供设备分类、类型、状态与健康度配置
 */

/**
 * 设备分类配置
 */
export const deviceCategories = {
	enforcement: {
		key: 'enforcement',
		name: '边境执法设备',
		icon: '执',
		color: '#ef4444',
		description: '服务于边境巡查、布控与证据采集的核心设备'
	}
}

/**
 * 设备类型配置
 */
export const deviceTypes = {
	enforcement: [
		{
			key: 'gps-tracker',
			name: '定位追踪终端',
			icon: '位',
			description: '实时回传位置与轨迹信息',
			parameters: ['纬度', '经度', '精度', '速度', '方向'],
			features: ['实时定位', '轨迹记录', '区域围栏']
		},
		{
			key: 'camera-hd',
			name: '高清布控摄像头',
			icon: '摄',
			description: '用于高清视频采集与现场布控',
			parameters: ['分辨率', '帧率', '存储空间', '电池电量'],
			features: ['高清录制', '夜视增强', '目标识别']
		},
		{
			key: 'audio-recorder',
			name: '现场录音终端',
			icon: '录',
			description: '用于现场音频取证与留痕',
			parameters: ['采样率', '比特率', '存储空间', '电池电量'],
			features: ['高保真录音', '降噪处理', '时间戳固化']
		},
		{
			key: 'evidence-collector',
			name: '证据采集终端',
			icon: '证',
			description: '负责物证采集、登记与链路管理',
			parameters: ['物证数量', '物证类型', '存储位置', '链条状态'],
			features: ['物证管理', '链路追踪', '数据加密']
		}
	]
}

/**
 * 设备状态配置
 */
export const deviceStatus = {
	online: {
		key: 'online',
		name: '在线',
		icon: '在线',
		color: '#10b981'
	},
	offline: {
		key: 'offline',
		name: '离线',
		icon: '离线',
		color: '#6b7280'
	},
	warning: {
		key: 'warning',
		name: '预警',
		icon: '预警',
		color: '#f59e0b'
	},
	error: {
		key: 'error',
		name: '故障',
		icon: '故障',
		color: '#ef4444'
	}
}

/**
 * 设备健康度配置
 */
export const deviceHealth = {
	healthy: {
		key: 'healthy',
		name: '健康',
		icon: '优',
		color: '#10b981',
		range: [80, 100]
	},
	warning: {
		key: 'warning',
		name: '预警',
		icon: '警',
		color: '#f59e0b',
		range: [50, 79]
	},
	critical: {
		key: 'critical',
		name: '严重',
		icon: '危',
		color: '#ef4444',
		range: [0, 49]
	}
}

export function getDeviceCategory(categoryKey) {
	return deviceCategories[categoryKey] || null
}

export function getDeviceType(categoryKey, typeKey) {
	const types = deviceTypes[categoryKey] || []
	return types.find(t => t.key === typeKey) || null
}

export function getCategoryTypes(categoryKey) {
	return deviceTypes[categoryKey] || []
}

export function getDeviceStatus(statusKey) {
	return deviceStatus[statusKey] || null
}

export function getDeviceHealth(healthScore) {
	if (healthScore >= 80) return deviceHealth.healthy
	if (healthScore >= 50) return deviceHealth.warning
	return deviceHealth.critical
}

/**
 * 计算设备健康度评分
 */
export function calculateHealthScore(battery, signal) {
	return Math.round(battery * 0.4 + signal * 0.6)
}

export function getAllCategories() {
	return Object.values(deviceCategories)
}

export function getAllDeviceTypes() {
	return deviceTypes
}

export function isValidCategory(categoryKey) {
	return categoryKey in deviceCategories
}

export function isValidDeviceType(categoryKey, typeKey) {
	const types = deviceTypes[categoryKey] || []
	return types.some(t => t.key === typeKey)
}

export function getDeviceTypeParameters(categoryKey, typeKey) {
	const type = getDeviceType(categoryKey, typeKey)
	return type ? type.parameters : []
}

export function getDeviceTypeFeatures(categoryKey, typeKey) {
	const type = getDeviceType(categoryKey, typeKey)
	return type ? type.features || [] : []
}

export function getDeviceTypeAlertThreshold(categoryKey, typeKey) {
	const type = getDeviceType(categoryKey, typeKey)
	return type ? type.alertThreshold || null : null
}

export function formatDeviceInfo(device) {
	const category = getDeviceCategory(device.category)
	const type = getDeviceType(device.category, device.type)
	const status = getDeviceStatus(device.status)
	const health = getDeviceHealth(device.health_score || 100)

	return {
		...device,
		categoryName: category?.name || '未知',
		categoryIcon: category?.icon || '未',
		typeName: type?.name || '未知',
		typeIcon: type?.icon || '未',
		statusName: status?.name || '未知',
		statusIcon: status?.icon || '未知',
		healthName: health?.name || '未知',
		healthIcon: health?.icon || '未'
	}
}

export function getDeviceListStats(devices) {
	const stats = {
		total: devices.length,
		byCategory: {},
		byStatus: {},
		byHealth: {},
		avgHealthScore: 0
	}

	Object.keys(deviceCategories).forEach(key => {
		stats.byCategory[key] = devices.filter(d => d.category === key).length
	})

	Object.keys(deviceStatus).forEach(key => {
		stats.byStatus[key] = devices.filter(d => d.status === key).length
	})

	Object.keys(deviceHealth).forEach(key => {
		const health = deviceHealth[key]
		stats.byHealth[key] = devices.filter(d => {
			const score = d.health_score || 100
			return score >= health.range[0] && score <= health.range[1]
		}).length
	})

	if (devices.length > 0) {
		const totalScore = devices.reduce((sum, d) => sum + (d.health_score || 100), 0)
		stats.avgHealthScore = Math.round(totalScore / devices.length)
	}

	return stats
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
}
