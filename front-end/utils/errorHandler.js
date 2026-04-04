/**
 * 错误处理工具
 */

/**
 * 统一错误处理
 */
export function handleError(error, context = '') {
	console.error(`[${context}] 错误:`, error)
	
	let message = '操作失败，请重试'
	let duration = 2000
	
	if (error.statusCode === 401) {
		message = '登录已过期，请重新登录'
		duration = 1500
		setTimeout(() => {
			uni.reLaunch({ url: '/pages/login/login' })
		}, duration)
	} else if (error.statusCode === 403) {
		message = '权限不足'
	} else if (error.statusCode === 404) {
		message = '数据不存在'
	} else if (error.statusCode === 500) {
		message = '服务器错误'
	} else if (!error.statusCode) {
		message = '网络连接失败'
	} else if (error.data && error.data.message) {
		message = error.data.message
	}
	
	uni.showToast({
		title: message,
		icon: 'none',
		duration: duration
	})
}

/**
 * 网络请求封装（带重试机制）
 */
export async function request(options, maxRetries = 3) {
	let retries = 0
	
	while (retries < maxRetries) {
		try {
			const res = await uni.request(options)
			
			if (res.statusCode === 200) {
				return res.data
			} else {
				throw {
					statusCode: res.statusCode,
					data: res.data
				}
			}
		} catch (error) {
			retries++
			
			if (retries >= maxRetries) {
				throw error
			}
			
			// 等待后重试（指数退避）
			await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)))
		}
	}
}

/**
 * 数据验证
 */
export function validateAlert(alert) {
	if (!alert || typeof alert !== 'object') {
		console.warn('预警数据格式错误:', alert)
		return false
	}
	
	// 必填字段
	if (!alert.id || !alert.title || !alert.level) {
		console.warn('预警缺少必填字段:', alert)
		return false
	}
	
	// 枚举值验证
	if (!['critical', 'warning', 'handled', 'info'].includes(alert.level)) {
		console.warn('预警级别无效:', alert.level)
		return false
	}
	
	// 数值范围验证
	if (alert.riskScore !== undefined && (alert.riskScore < 0 || alert.riskScore > 100)) {
		console.warn('风险评分超出范围:', alert.riskScore)
		return false
	}
	
	return true
}

/**
 * 防抖函数
 */
export function debounce(fn, delay = 300) {
	let timer = null
	return function(...args) {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			fn.apply(this, args)
		}, delay)
	}
}

/**
 * 节流函数
 */
export function throttle(fn, delay = 300) {
	let lastTime = 0
	return function(...args) {
		const now = Date.now()
		if (now - lastTime >= delay) {
			fn.apply(this, args)
			lastTime = now
		}
	}
}
