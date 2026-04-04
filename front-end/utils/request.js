/**
 * 全局 HTTP 请求封装
 * 自动携带 token、统一错误处理、支持离线降级
 */

const BASE_URL = 'http://localhost:5000/api/v1'

/**
 * 核心请求函数
 */
function request(options) {
	return new Promise((resolve, reject) => {
		const token = uni.getStorageSync('user_token') || uni.getStorageSync('token')

		const header = {
			'Content-Type': 'application/json',
			...options.header
		}

		if (token) {
			header['Authorization'] = `Bearer ${token}`
		}

		uni.request({
			url: BASE_URL + options.url,
			method: options.method || 'GET',
			data: options.data,
			header,
			timeout: options.timeout || 10000,
			success: (res) => {
				if (res.statusCode === 401) {
					uni.removeStorageSync('user_token')
					uni.removeStorageSync('user_info')
					uni.reLaunch({ url: '/pages/login/index' })
					reject(new Error('登录已过期'))
					return
				}

				if (res.statusCode >= 200 && res.statusCode < 300) {
					resolve(res.data)
				} else {
					reject(new Error(res.data?.message || `HTTP ${res.statusCode}`))
				}
			},
			fail: (err) => {
				console.warn('[Request] 网络请求失败:', err)
				reject(new Error('网络连接失败，请检查网络'))
			}
		})
	})
}

export const http = {
	get: (url, data, options = {}) =>
		request({ url, method: 'GET', data, ...options }),

	post: (url, data, options = {}) =>
		request({ url, method: 'POST', data, ...options }),

	put: (url, data, options = {}) =>
		request({ url, method: 'PUT', data, ...options }),

	delete: (url, data, options = {}) =>
		request({ url, method: 'DELETE', data, ...options })
}

// ── API 模块 ────────────────────────────────

export const authAPI = {
	login: (data) => request({ url: '/auth/login', method: 'POST', data }),
	register: (data) => request({ url: '/auth/register', method: 'POST', data }),
	logout: () => request({ url: '/auth/logout', method: 'POST' }),
	getMe: () => request({ url: '/auth/me', method: 'GET' }),
	updateStatus: (data) => request({ url: '/auth/update-status', method: 'PUT', data })
}

export const alertAPI = {
	getList: (params) => request({ url: '/alerts', method: 'GET', data: params }),
	getDetail: (id) => request({ url: `/alerts/${id}`, method: 'GET' }),
	getSimilarCases: (id, params = {}) => request({ url: `/alerts/${id}/similar`, method: 'GET', data: params }),
	getSimilarityWeights: () => request({ url: '/alerts/similarity/weights', method: 'GET' }),
	updateSimilarityWeights: (data) => request({ url: '/alerts/similarity/weights', method: 'PUT', data }),
	create: (data) => request({ url: '/alerts', method: 'POST', data }),
	assign: (id, data) => request({ url: `/alerts/${id}/assign`, method: 'PUT', data }),
	resolve: (id, data = {}) => request({ url: `/alerts/${id}/resolve`, method: 'PUT', data }),
	ignore: (id, data = {}) => request({ url: `/alerts/${id}/ignore`, method: 'PUT', data }),
	getStats: () => request({ url: '/alerts/stats', method: 'GET' })
}

export const taskAPI = {
	getList: (params) => request({ url: '/tasks', method: 'GET', data: params }),
	getDetail: (id) => request({ url: `/tasks/${id}`, method: 'GET' }),
	getCollaborationTimeline: (id) => request({ url: `/tasks/${id}/collaboration/timeline`, method: 'GET' }),
	updateCollaboration: (id, data) => request({ url: `/tasks/${id}/collaboration`, method: 'PUT', data }),
	create: (data) => request({ url: '/tasks', method: 'POST', data }),
	start: (id) => request({ url: `/tasks/${id}/start`, method: 'PUT', data: {} }),
	updateProgress: (id, data) => request({ url: `/tasks/${id}/progress`, method: 'PUT', data }),
	complete: (id, data = {}) => request({ url: `/tasks/${id}/complete`, method: 'PUT', data }),
	cancel: (id) => request({ url: `/tasks/${id}`, method: 'PUT', data: { status: 'cancelled' } }),
	getStats: () => request({ url: '/tasks/stats/summary', method: 'GET' })
}

export const deviceAPI = {
	getList: (params) => request({ url: '/devices', method: 'GET', data: params }),
	getDetail: (id) => request({ url: `/devices/${id}`, method: 'GET' }),
	create: (data) => request({ url: '/devices', method: 'POST', data }),
	update: (id, data) => request({ url: `/devices/${id}`, method: 'PUT', data }),
	heartbeat: (id, data) => request({ url: `/devices/${id}/heartbeat`, method: 'PUT', data }),
	getStats: () => request({ url: '/devices/stats', method: 'GET' }),
	getTopology: () => request({ url: '/devices/topology', method: 'GET' })
}

export const gisAPI = {
	getSensorDevices: () => request({ url: '/devices?type=camera-infrared', method: 'GET' }),
	getAlerts: () => request({ url: '/gis/alerts-on-map', method: 'GET' }),
	getHeatmap: () => request({ url: '/gis/heatmap', method: 'GET' }),
	getNearbyAlerts: (params) => request({ url: '/gis/nearby-alerts', method: 'GET', data: params }),
	reportSmuggling: (data) => request({ url: '/gis/report-alert', method: 'POST', data }),
	sendSOS: (data) => request({ url: '/fusion/dispatch', method: 'POST', data })
}

export const dashboardAPI = {
	getMetrics: () => request({ url: '/fusion/metrics', method: 'GET' }),
	getSmugglingTrend: (days = 7) => request({ url: `/fusion/smuggling-trend?days=${days}`, method: 'GET' }),
	getEcologyTrend: (days = 7) => request({ url: `/fusion/ecology-trend?days=${days}`, method: 'GET' }),
	getHeartbeatFeed: (limit = 10) => request({ url: `/fusion/heartbeat-feed?limit=${limit}`, method: 'GET' }),
	getAggregation: (params) => request({ url: '/fusion/aggregation', method: 'GET', data: params }),
	getFusionEvents: (params) => request({ url: '/fusion/events', method: 'GET', data: params }),
	getClosedLoopOverview: () => request({ url: '/fusion/closed-loop/overview', method: 'GET' })
}

export const sensingAPI = {
	heartbeat: (data) => request({ url: '/sensing/heartbeat', method: 'POST', data }),
	statusReport: (data) => request({ url: '/sensing/status-report', method: 'POST', data })
}

export const evidenceAPI = {
	upload: (data) => request({ url: '/evidence/upload', method: 'POST', data })
}

export const analysisAPI = {
	aggregation: (params) => request({ url: '/analysis/aggregation', method: 'GET', data: params })
}

export const enforcementAPI = {
	recommendInspectors: (params) => request({ url: '/enforcement/dispatch/recommend-inspectors', method: 'GET', data: params })
}

export const closedLoopAPI = {
	createFromWarning: (data) => request({ url: '/tasks/createFromWarning', method: 'POST', data }),
	updateProgress: (data) => request({ url: '/tasks/updateProgress', method: 'PUT', data })
}

export default http
