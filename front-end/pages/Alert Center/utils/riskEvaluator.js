/**
 * 风险评估工具
 * 根据时间偏差倍数自动计算风险等级与颜色代码
 */

/**
 * 评估风险等级
 * @param {number} deviation - 时间偏差倍数
 * @returns {string} - 风险等级：critical, warning, normal
 */
export function evaluateRiskLevel(deviation) {
	if (deviation >= 3) {
		return 'critical' // 高危：偏差 >= 3倍
	} else if (deviation >= 1.5) {
		return 'warning' // 预警：偏差 >= 1.5倍
	} else {
		return 'normal' // 正常：偏差 < 1.5倍
	}
}

/**
 * 获取风险等级对应的颜色
 * @param {string} riskLevel - 风险等级
 * @returns {string} - 颜色代码
 */
export function getRiskColor(riskLevel) {
	const colorMap = {
		critical: '#FF4D4F',  // 警报红
		warning: '#FFA940',   // 预警橙
		normal: '#73D13D',    // 安全绿
		handled: '#595959'    // 已处理灰
	}
	return colorMap[riskLevel] || '#8c8c8c'
}

/**
 * 获取风险等级文本
 * @param {string} riskLevel - 风险等级
 * @returns {string} - 风险等级文本
 */
export function getRiskLevelText(riskLevel) {
	const textMap = {
		critical: '高危拦截',
		warning: '逻辑异常',
		normal: '正常',
		handled: '已处理'
	}
	return textMap[riskLevel] || '未知'
}

/**
 * 计算时间偏差倍数
 * @param {number} normalTime - 标准耗时（秒）
 * @param {number} actualTime - 实际耗时（秒）
 * @returns {number} - 偏差倍数
 */
export function calculateDeviation(normalTime, actualTime) {
	if (normalTime === 0) return 0
	return parseFloat((actualTime / normalTime).toFixed(1))
}

/**
 * 综合评估预警优先级
 * @param {object} alert - 预警对象
 * @returns {number} - 优先级分数（越高越紧急）
 */
export function calculatePriority(alert) {
	let score = 0
	
	// 时间偏差权重
	if (alert.timeDeviation >= 3) {
		score += 100
	} else if (alert.timeDeviation >= 2) {
		score += 50
	} else if (alert.timeDeviation >= 1.5) {
		score += 25
	}
	
	// 多模态证据权重
	if (alert.evidence) {
		if (alert.evidence.infrared) score += 30
		if (alert.evidence.smell) score += 20
		if (alert.evidence.vibration) score += 10
	}
	
	// 时间新鲜度权重
	const now = new Date()
	const alertTime = new Date(alert.timestamp)
	const minutesAgo = (now - alertTime) / 1000 / 60
	
	if (minutesAgo < 5) {
		score += 50
	} else if (minutesAgo < 15) {
		score += 30
	} else if (minutesAgo < 30) {
		score += 10
	}
	
	return score
}

/**
 * 生成预警描述文本
 * @param {object} alert - 预警对象
 * @returns {string} - 描述文本
 */
export function generateAlertDescription(alert) {
	const deviation = alert.timeDeviation
	const location = alert.location
	const targetType = alert.targetType
	
	let description = ''
	
	// 根据目标类型
	const typeText = {
		human: '人员',
		vehicle: '车辆',
		animal: '动物'
	}[targetType] || '目标'
	
	// 根据偏差程度
	if (deviation >= 3) {
		description = `${typeText}在 ${location} 严重滞留，已超正常时长 ${deviation} 倍`
	} else if (deviation >= 2) {
		description = `${typeText}在 ${location} 异常停留，超时 ${deviation} 倍`
	} else if (deviation >= 1.5) {
		description = `${typeText}在 ${location} 通过时间异常`
	} else {
		description = `${typeText}在 ${location} 正常通过`
	}
	
	// 添加证据信息
	if (alert.evidence) {
		const evidenceList = []
		if (alert.evidence.infrared) evidenceList.push('检测到体温')
		if (alert.evidence.smell) evidenceList.push('气味异常')
		if (alert.evidence.vibration) evidenceList.push('震动异常')
		
		if (evidenceList.length > 0) {
			description += `，${evidenceList.join('、')}`
		}
	}
	
	return description
}

/**
 * 判断是否需要立即拦截
 * @param {object} alert - 预警对象
 * @returns {boolean} - 是否需要立即拦截
 */
export function shouldIntercept(alert) {
	// 高危等级
	if (alert.riskLevel === 'critical') return true
	
	// 时间偏差超过 3 倍
	if (alert.timeDeviation >= 3) return true
	
	// 多模态证据齐全（红外 + 气味 + 震动）
	if (alert.evidence && 
		alert.evidence.infrared && 
		alert.evidence.smell && 
		alert.evidence.vibration) {
		return true
	}
	
	return false
}

/**
 * 格式化时间差
 * @param {Date} timestamp - 时间戳
 * @returns {string} - 格式化后的时间差
 */
export function formatTimeAgo(timestamp) {
	const now = new Date()
	const alertTime = new Date(timestamp)
	const diff = Math.floor((now - alertTime) / 1000)
	
	if (diff < 60) return '刚刚'
	if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
	if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
	return Math.floor(diff / 86400) + '天前'
}

/**
 * 根据预警信息自动生成办案建议
 * @param {object} alert - 预警对象
 * @returns {string} - 办案建议文本
 */
export function generateSuggestion(alert) {
	const level = alert.level || 'unknown'
	const type = alert.type || alert.alert_type || ''

	if (type.includes('wildlife') || type.includes('animal') || type.includes('smuggling')) {
		if (level === 'critical') return '【紧急】立即启动野生动物走私应急预案，协调海关、边检、森林公安联合查缉，锁定嫌疑车辆后追踪货物去向。'
		if (level === 'high') return '【高危】通知属地森林公安前往核查，调取周边监控和卡口数据，联系举报人核实线索。'
		return '【一般】记录在案，安排执法人员实地巡查，重点时段加密巡逻频次。'
	}

	if (type.includes('water') || type.includes('habitat')) {
		if (level === 'critical') return '【紧急】立即通知生态环境执法部门，封锁污染区域，采样送检，同步上报市生态环境局。'
		if (level === 'high') return '【高危】安排环境监测人员现场核查，调取近期监测数据，评估生态损害程度。'
		return '【一般】纳入日常巡查清单，择期开展水质/生态专项调查。'
	}

	if (type.includes('food') || type.includes('drug')) {
		if (level === 'critical') return '【紧急】立即通报市场监管局，启动产品召回程序，追踪同批次产品流向，排查下游企业。'
		if (level === 'high') return '【高危】通知企业整改，抽样送检，必要时采取行政强制措施。'
		return '【一般】记录违规情况，通知企业自查整改，下期重点复查。'
	}

	// Default suggestion
	if (level === 'critical') return '【紧急】立即响应，启动应急预案，协调多部门联合处置。'
	if (level === 'high') return '【高危】认真核查，分析研判风险，必要时升级预警等级。'
	return '【一般】持续关注，定期跟踪核查。'
}

/**
 * 导出所有方法
 */
export default {
	evaluateRiskLevel,
	getRiskColor,
	getRiskLevelText,
	calculateDeviation,
	calculatePriority,
	generateAlertDescription,
	shouldIntercept,
	formatTimeAgo,
	generateSuggestion
}
