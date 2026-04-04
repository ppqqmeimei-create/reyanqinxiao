/**
 * 证据采集工具
 * 处理多媒体采集与本地 SQLite 暂存逻辑
 */

/**
 * 采集证据
 * @param {Object} data - 证据数据
 * @returns {Promise} - 返回证据对象
 */
export function captureEvidence(data) {
	return new Promise((resolve, reject) => {
		try {
			// 生成证据ID
			const evidenceId = generateEvidenceId()
			
			// 构建证据对象
			const evidence = {
				id: evidenceId,
				taskId: data.taskId,
				type: data.type || 'photo',
				path: data.path,
				location: data.location,
				sensorData: data.sensorData,
				timestamp: Date.now(),
				synced: false
			}
			
			// 保存到本地存储
			saveToLocalStorage(evidence)
			
			// 如果有网络，尝试上传
			if (isOnline()) {
				uploadEvidence(evidence).then(() => {
					evidence.synced = true
					updateLocalStorage(evidence)
				}).catch(err => {
					console.log('上传失败，已保存到本地:', err)
				})
			}
			
			resolve(evidence)
		} catch (error) {
			reject(error)
		}
	})
}

/**
 * 生成证据ID
 */
function generateEvidenceId() {
	const timestamp = Date.now()
	const random = Math.floor(Math.random() * 10000)
	return `EVD-${timestamp}-${random}`
}

/**
 * 保存到本地存储
 */
function saveToLocalStorage(evidence) {
	try {
		// 获取现有证据列表
		const existingEvidence = uni.getStorageSync('offline_evidence') || []
		
		// 添加新证据
		existingEvidence.push(evidence)
		
		// 保存回本地
		uni.setStorageSync('offline_evidence', existingEvidence)
		
		console.log('证据已保存到本地:', evidence.id)
	} catch (error) {
		console.error('保存证据失败:', error)
	}
}

/**
 * 更新本地存储
 */
function updateLocalStorage(evidence) {
	try {
		const existingEvidence = uni.getStorageSync('offline_evidence') || []
		const index = existingEvidence.findIndex(e => e.id === evidence.id)
		
		if (index > -1) {
			existingEvidence[index] = evidence
			uni.setStorageSync('offline_evidence', existingEvidence)
		}
	} catch (error) {
		console.error('更新证据失败:', error)
	}
}

/**
 * 上传证据
 */
function uploadEvidence(evidence) {
	return new Promise((resolve, reject) => {
		// 模拟上传
		setTimeout(() => {
			const success = Math.random() > 0.2 // 80% 成功率
			if (success) {
				resolve()
			} else {
				reject(new Error('上传失败'))
			}
		}, 1000)
		
		// 实际项目中应该调用真实的上传接口
		// uni.uploadFile({
		//   url: 'https://api.example.com/evidence/upload',
		//   filePath: evidence.path,
		//   name: 'file',
		//   formData: {
		//     id: evidence.id,
		//     taskId: evidence.taskId,
		//     location: JSON.stringify(evidence.location),
		//     sensorData: JSON.stringify(evidence.sensorData),
		//     timestamp: evidence.timestamp
		//   },
		//   success: resolve,
		//   fail: reject
		// })
	})
}

/**
 * 检查网络状态
 */
function isOnline() {
	try {
		const networkType = uni.getStorageSync('network_type')
		return networkType !== 'none'
	} catch (error) {
		return false
	}
}

/**
 * 获取离线证据数量
 */
export function getOfflineEvidenceCount() {
	try {
		const evidence = uni.getStorageSync('offline_evidence') || []
		return evidence.filter(e => !e.synced).length
	} catch (error) {
		return 0
	}
}

/**
 * 获取所有离线证据
 */
export function getOfflineEvidence() {
	try {
		return uni.getStorageSync('offline_evidence') || []
	} catch (error) {
		return []
	}
}

/**
 * 同步离线证据
 */
export function syncOfflineEvidence() {
	return new Promise((resolve, reject) => {
		try {
			const evidence = getOfflineEvidence()
			const unsyncedEvidence = evidence.filter(e => !e.synced)
			
			if (unsyncedEvidence.length === 0) {
				resolve({ synced: 0 })
				return
			}
			
			// 批量上传
			const uploadPromises = unsyncedEvidence.map(e => uploadEvidence(e))
			
			Promise.all(uploadPromises)
				.then(() => {
					// 标记为已同步
					unsyncedEvidence.forEach(e => {
						e.synced = true
						updateLocalStorage(e)
					})
					
					resolve({ synced: unsyncedEvidence.length })
				})
				.catch(reject)
		} catch (error) {
			reject(error)
		}
	})
}

/**
 * 清理已同步的证据
 */
export function cleanSyncedEvidence() {
	try {
		const evidence = getOfflineEvidence()
		const unsyncedEvidence = evidence.filter(e => !e.synced)
		uni.setStorageSync('offline_evidence', unsyncedEvidence)
		return evidence.length - unsyncedEvidence.length
	} catch (error) {
		return 0
	}
}

/**
 * 生成证据水印
 */
export function generateWatermark(evidence) {
	const { location, sensorData, timestamp } = evidence
	
	return {
		timestamp: new Date(timestamp).toISOString(),
		location: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
		altitude: sensorData.altitude || 0,
		smell: sensorData.smell || 0,
		vibration: sensorData.vibration || 0,
		infrared: sensorData.infrared || 0
	}
}

/**
 * 导出所有方法
 */
export function useEvidence() {
	return {
		captureEvidence,
		getOfflineEvidenceCount,
		getOfflineEvidence,
		syncOfflineEvidence,
		cleanSyncedEvidence,
		generateWatermark
	}
}

export default {
	captureEvidence,
	getOfflineEvidenceCount,
	getOfflineEvidence,
	syncOfflineEvidence,
	cleanSyncedEvidence,
	generateWatermark
}
