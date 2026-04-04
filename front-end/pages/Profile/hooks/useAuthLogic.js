/* ==========================================
   认证逻辑 Hook
   封装登出清除缓存、生物识别调用、离线凭证校验
   ========================================== */

/**
 * 认证逻辑 Hook
 * @returns {Object} 认证相关方法
 */
export function useAuthLogic() {
	
	/**
	 * 停止所有后台服务
	 */
	const stopBackgroundServices = async () => {
		try {
			// 停止GPS上报
			uni.stopLocationUpdate && uni.stopLocationUpdate()
			
			// 停止WebSocket心跳
			const socketTask = uni.getStorageSync('socket_task')
			if (socketTask) {
				socketTask.close()
				uni.removeStorageSync('socket_task')
			}
			
			// 停止后台定位
			uni.offLocationChange && uni.offLocationChange()
			
			console.log('[Auth] 后台服务已停止')
		} catch (error) {
			console.error('[Auth] 停止后台服务失败:', error)
		}
	}
	
	/**
	 * 清除敏感缓存
	 * 保留离线地图包和AI模型
	 */
	const clearSensitiveCache = () => {
		try {
			// 清除用户凭证
			uni.removeStorageSync('user_token')
			uni.removeStorageSync('refresh_token')
			uni.removeStorageSync('user_info')
			
			// 清除临时证据缓存
			uni.removeStorageSync('temp_evidence_cache')
			uni.removeStorageSync('offline_evidence')
			uni.removeStorageSync('pending_uploads')
			
			// 清除执勤状态
			uni.removeStorageSync('on_duty')
			uni.removeStorageSync('duty_start_time')
			
			// 清除敏感设置
			uni.removeStorageSync('biometric_enabled')
			
			// 保留以下数据：
			// - offline_maps (离线地图包)
			// - ai_model (AI模型文件)
			// - app_settings (应用设置)
			
			console.log('[Auth] 敏感缓存已清除')
		} catch (error) {
			console.error('[Auth] 清除缓存失败:', error)
			throw error
		}
	}
	
	/**
	 * 记录退出日志
	 */
	const logLogout = () => {
		try {
			const logEntry = {
				action: 'logout',
				timestamp: new Date().toISOString(),
				device: uni.getSystemInfoSync().model,
				reason: 'user_initiated'
			}
			
			// 记录到本地日志
			const logs = uni.getStorageSync('security_logs') || []
			logs.push(logEntry)
			
			// 只保留最近100条日志
			if (logs.length > 100) {
				logs.shift()
			}
			
			uni.setStorageSync('security_logs', logs)
			
			console.log('[Auth] 退出日志已记录:', logEntry)
		} catch (error) {
			console.error('[Auth] 记录日志失败:', error)
		}
	}
	
	/**
	 * 安全退出登录
	 */
	const handleLogout = async () => {
		try {
			console.log('[Auth] 开始安全退出流程...')
			
			// 1. 停止所有后台服务
			await stopBackgroundServices()
			
			// 2. 清除敏感缓存
			clearSensitiveCache()
			
			// 3. 记录退出日志
			logLogout()
			
			// 4. 通知服务器（如果在线）
			try {
				await notifyServerLogout()
			} catch (error) {
				// 离线情况下忽略服务器通知失败
				console.warn('[Auth] 服务器通知失败（可能离线）:', error)
			}
			
			// 5. 重定向到登录页
			uni.reLaunch({
				url: '/pages/login/index'
			})
			
			console.log('[Auth] 安全退出完成')
			
		} catch (error) {
			console.error('[Auth] 退出流程异常:', error)
			throw error
		}
	}
	
	/**
	 * 通知服务器退出登录
	 */
	const notifyServerLogout = () => {
		return new Promise((resolve, reject) => {
			// 修复：从 storage 读取 token（兼容 'token' 和 'user_token' 两种key）
			const token   = uni.getStorageSync('token') || uni.getStorageSync('user_token')
			const baseURL = uni.getStorageSync('baseURL') || 'http://localhost:5000'
			
			if (!token) { resolve(); return }
			
			uni.request({
				url: baseURL + '/api/auth/logout',
				method: 'POST',
				header: { 'Authorization': `Bearer ${token}` },
				timeout: 3000,
				success: (res) => {
					if (res.statusCode === 200) {
						console.log('[Auth] 服务器已确认退出')
						resolve()
					} else {
						reject(new Error('服务器响应异常: ' + res.statusCode))
					}
				},
				fail: (error) => { reject(error) }
			})
		})
	}
	
	/**
	 * 生物识别验证
	 */
	const verifyBiometric = () => {
		return new Promise((resolve, reject) => {
			// 检查设备是否支持生物识别
			uni.checkIsSupportSoterAuthentication({
				success: (res) => {
					const supportModes = res.supportMode || []
					
					if (supportModes.length === 0) {
						reject(new Error('设备不支持生物识别'))
						return
					}
					
					// 优先使用指纹，其次面容
					const authMode = supportModes.includes('fingerPrint') 
						? 'fingerPrint' 
						: supportModes[0]
					
					// 开始生物识别
					uni.startSoterAuthentication({
						requestAuthModes: [authMode],
						challenge: Math.random().toString(36).substring(2),
						authContent: '验证身份以继续',
						success: (authRes) => {
							console.log('[Auth] 生物识别成功')
							resolve(authRes)
						},
						fail: (authError) => {
							console.error('[Auth] 生物识别失败:', authError)
							reject(authError)
						}
					})
				},
				fail: (error) => {
					console.error('[Auth] 检查生物识别支持失败:', error)
					reject(error)
				}
			})
		})
	}
	
	/**
	 * 校验离线凭证
	 * 用于离线环境下的身份验证
	 */
	const verifyOfflineCredential = (credential) => {
		try {
			// 获取本地存储的凭证哈希
			const storedHash = uni.getStorageSync('offline_credential_hash')
			
			if (!storedHash) {
				return {
					valid: false,
					reason: 'no_offline_credential'
				}
			}
			
			// 简单哈希验证（实际应使用更安全的算法）
			const inputHash = simpleHash(credential)
			
			if (inputHash === storedHash) {
				// 更新最后验证时间
				uni.setStorageSync('last_offline_verify', Date.now())
				
				return {
					valid: true,
					timestamp: Date.now()
				}
			} else {
				return {
					valid: false,
					reason: 'credential_mismatch'
				}
			}
		} catch (error) {
			console.error('[Auth] 离线凭证校验失败:', error)
			return {
				valid: false,
				reason: 'verify_error',
				error
			}
		}
	}
	
	/**
	 * 简单哈希函数（示例）
	 * 实际应使用 crypto-js 等库
	 */
	const simpleHash = (str) => {
		let hash = 0
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i)
			hash = ((hash << 5) - hash) + char
			hash = hash & hash
		}
		return hash.toString(36)
	}
	
	/**
	 * 设置离线凭证
	 */
	const setOfflineCredential = (credential) => {
		try {
			const hash = simpleHash(credential)
			uni.setStorageSync('offline_credential_hash', hash)
			uni.setStorageSync('offline_credential_set_time', Date.now())
			
			console.log('[Auth] 离线凭证已设置')
			return true
		} catch (error) {
			console.error('[Auth] 设置离线凭证失败:', error)
			return false
		}
	}
	
	/**
	 * 检查Token是否过期
	 */
	const isTokenExpired = () => {
		try {
			const token = uni.getStorageSync('user_token')
			const tokenExpiry = uni.getStorageSync('token_expiry')
			
			if (!token || !tokenExpiry) {
				return true
			}
			
			return Date.now() > tokenExpiry
		} catch (error) {
			console.error('[Auth] 检查Token失败:', error)
			return true
		}
	}
	
	/**
	 * 刷新Token
	 */
	const refreshToken = () => {
		return new Promise((resolve, reject) => {
			const refreshToken = uni.getStorageSync('refresh_token')
			
			if (!refreshToken) {
				reject(new Error('无刷新令牌'))
				return
			}
			
			uni.request({
				url: (uni.getStorageSync('baseURL') || 'http://localhost:5000') + '/api/auth/refresh',
				method: 'POST',
				data: {
					refresh_token: refreshToken
				},
				success: (res) => {
					if (res.statusCode === 200 && res.data.token) {
						// 保存新Token
						uni.setStorageSync('user_token', res.data.token)
						uni.setStorageSync('token_expiry', Date.now() + res.data.expires_in * 1000)
						
						console.log('[Auth] Token刷新成功')
						resolve(res.data.token)
					} else {
						reject(new Error('Token刷新失败'))
					}
				},
				fail: (error) => {
					reject(error)
				}
			})
		})
	}
	
	/**
	 * 紧急数据销毁
	 * 用于极端情况下的数据清除
	 */
	const emergencyDestroy = () => {
		try {
			console.log('[Auth] 执行紧急数据销毁...')
			
			// 清除所有敏感数据
			clearSensitiveCache()
			
			// 额外清除可能的敏感文件
			// 注意：这里只是示例，实际需要根据文件系统API实现
			const sensitiveKeys = [
				'temp_evidence_cache',
				'offline_evidence',
				'pending_uploads',
				'captured_images',
				'voice_records'
			]
			
			sensitiveKeys.forEach(key => {
				uni.removeStorageSync(key)
			})
			
			// 记录销毁日志
			const logEntry = {
				action: 'emergency_destroy',
				timestamp: new Date().toISOString(),
				device: uni.getSystemInfoSync().model
			}
			
			const logs = uni.getStorageSync('security_logs') || []
			logs.push(logEntry)
			uni.setStorageSync('security_logs', logs)
			
			console.log('[Auth] 紧急数据销毁完成')
			return true
			
		} catch (error) {
			console.error('[Auth] 紧急数据销毁失败:', error)
			return false
		}
	}
	
	// 返回所有方法
	return {
		handleLogout,
		verifyBiometric,
		verifyOfflineCredential,
		setOfflineCredential,
		isTokenExpired,
		refreshToken,
		emergencyDestroy,
		stopBackgroundServices,
		clearSensitiveCache
	}
}

export default useAuthLogic
