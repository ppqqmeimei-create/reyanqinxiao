/**
 * 预警API服务
 */
import { request, handleError } from './errorHandler.js'

const BASE_URL = 'http://localhost:5000/api'  // 根据实际情况修改

export const alertAPI = {
	/**
	 * 获取预警列表
	 */
	async getAlerts(params = {}) {
		try {
			return await request({
				url: `${BASE_URL}/alerts/list`,
				method: 'GET',
				data: {
					page: params.page || 1,
					limit: params.limit || 20,
					status: params.status,
					level: params.level
				},
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`
				}
			})
		} catch (error) {
			handleError(error, 'getAlerts')
			throw error
		}
	},
	
	/**
	 * 获取预警详情
	 */
	async getAlertDetail(id) {
		try {
			return await request({
				url: `${BASE_URL}/alerts/${id}`,
				method: 'GET',
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`
				}
			})
		} catch (error) {
			handleError(error, 'getAlertDetail')
			throw error
		}
	},
	
	/**
	 * 创建预警
	 */
	async createAlert(data) {
		try {
			return await request({
				url: `${BASE_URL}/alerts`,
				method: 'POST',
				data: data,
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`,
					'Content-Type': 'application/json'
				}
			})
		} catch (error) {
			handleError(error, 'createAlert')
			throw error
		}
	},
	
	/**
	 * 分配预警
	 */
	async assignAlert(alertId, userId) {
		try {
			return await request({
				url: `${BASE_URL}/alerts/${alertId}/assign`,
				method: 'PUT',
				data: { user_id: userId },
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`,
					'Content-Type': 'application/json'
				}
			})
		} catch (error) {
			handleError(error, 'assignAlert')
			throw error
		}
	},
	
	/**
	 * 解决预警
	 */
	async resolveAlert(alertId, notes) {
		try {
			return await request({
				url: `${BASE_URL}/alerts/${alertId}/resolve`,
				method: 'PUT',
				data: { notes: notes },
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`,
					'Content-Type': 'application/json'
				}
			})
		} catch (error) {
			handleError(error, 'resolveAlert')
			throw error
		}
	},
	
	/**
	 * 忽略预警
	 */
	async ignoreAlert(alertId, reason) {
		try {
			return await request({
				url: `${BASE_URL}/alerts/${alertId}/ignore`,
				method: 'PUT',
				data: { reason: reason },
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`,
					'Content-Type': 'application/json'
				}
			})
		} catch (error) {
			handleError(error, 'ignoreAlert')
			throw error
		}
	},
	
	/**
	 * 获取预警统计
	 */
	async getStats() {
		try {
			return await request({
				url: `${BASE_URL}/alerts/stats`,
				method: 'GET',
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`
				}
			})
		} catch (error) {
			handleError(error, 'getStats')
			throw error
		}
	},
	
	/**
	 * 获取附近检查员
	 */
	async getNearbyInspectors(location) {
		try {
			return await request({
				url: `${BASE_URL}/inspectors/nearby`,
				method: 'GET',
				data: {
					latitude: location.latitude,
					longitude: location.longitude,
					radius: 10  // 10公里范围
				},
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`
				}
			})
		} catch (error) {
			handleError(error, 'getNearbyInspectors')
			throw error
		}
	}
}
