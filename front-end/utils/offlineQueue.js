/**
 * offlineQueue.js — 离线任务/预警队列管理
 * 职责：
 *   1. 管理离线状态下的任务/预警队列
 *   2. 网络状态感知与队列优先级
 *   3. 与 syncEngine 协同处理离线数据
 */

const TASK_QUEUE_KEY = 'offline_task_queue'
const ALERT_QUEUE_KEY = 'offline_alert_queue'

/**
 * 检查网络是否可用
 * @returns {boolean}
 */
export function isNetworkAvailable() {
  try {
    const net = uni.getStorageSync('network_type')
    return net && net !== 'none' && net !== 'unknown'
  } catch (e) {
    return false
  }
}

/**
 * 读取离线任务队列
 * @returns {Array}
 */
export function getOfflineTaskQueue() {
  try {
    const q = uni.getStorageSync(TASK_QUEUE_KEY)
    return Array.isArray(q) ? q : []
  } catch (e) {
    return []
  }
}

/**
 * 读取离线预警队列
 * @returns {Array}
 */
export function getOfflineAlertQueue() {
  try {
    const q = uni.getStorageSync(ALERT_QUEUE_KEY)
    return Array.isArray(q) ? q : []
  } catch (e) {
    return []
  }
}

/**
 * 添加任务到离线队列
 * @param {object} taskData
 * @returns {number} 队列长度
 */
export function addTaskToQueue(taskData) {
  const queue = getOfflineTaskQueue()
  const record = {
    ...taskData,
    _id: Date.now() + Math.floor(Math.random() * 1000),
    queuedAt: new Date().toISOString(),
    retryCount: 0,
    syncStatus: 'pending',
    priority: taskData.priority || 'normal'
  }
  queue.push(record)
  uni.setStorageSync(TASK_QUEUE_KEY, queue)
  return queue.length
}

/**
 * 添加预警到离线队列
 * @param {object} alertData
 * @returns {number} 队列长度
 */
export function addAlertToQueue(alertData) {
  const queue = getOfflineAlertQueue()
  const record = {
    ...alertData,
    _id: Date.now() + Math.floor(Math.random() * 1000),
    queuedAt: new Date().toISOString(),
    retryCount: 0,
    syncStatus: 'pending'
  }
  queue.push(record)
  uni.setStorageSync(ALERT_QUEUE_KEY, queue)
  return queue.length
}

/**
 * 从任务队列移除已完成同步的记录
 * @param {string} recordId
 */
export function removeTaskFromQueue(recordId) {
  try {
    const queue = getOfflineTaskQueue().filter(r => r._id !== recordId)
    uni.setStorageSync(TASK_QUEUE_KEY, queue)
  } catch (e) {
    console.error('[OfflineQueue] 移除任务记录失败:', e)
  }
}

/**
 * 从预警队列移除已完成同步的记录
 * @param {string} recordId
 */
export function removeAlertFromQueue(recordId) {
  try {
    const queue = getOfflineAlertQueue().filter(r => r._id !== recordId)
    uni.setStorageSync(ALERT_QUEUE_KEY, queue)
  } catch (e) {
    console.error('[OfflineQueue] 移除预警记录失败:', e)
  }
}

/**
 * 更新任务队列中记录的状态
 * @param {string} recordId
 * @param {Partial<object>} patch
 */
export function updateTaskRecord(recordId, patch) {
  try {
    const queue = getOfflineTaskQueue().map(r => r._id === recordId ? { ...r, ...patch } : r)
    uni.setStorageSync(TASK_QUEUE_KEY, queue)
  } catch (e) {
    console.error('[OfflineQueue] 更新任务记录失败:', e)
  }
}

/**
 * 更新预警队列中记录的状态
 * @param {string} recordId
 * @param {Partial<object>} patch
 */
export function updateAlertRecord(recordId, patch) {
  try {
    const queue = getOfflineAlertQueue().map(r => r._id === recordId ? { ...r, ...patch } : r)
    uni.setStorageSync(ALERT_QUEUE_KEY, queue)
  } catch (e) {
    console.error('[OfflineQueue] 更新预警记录失败:', e)
  }
}

/**
 * 获取待同步的任务数量
 * @returns {number}
 */
export function getPendingTaskCount() {
  const queue = getOfflineTaskQueue()
  return queue.filter(r => r.syncStatus === 'pending' || r.syncStatus === 'uploading').length
}

/**
 * 获取待同步的预警数量
 * @returns {number}
 */
export function getPendingAlertCount() {
  const queue = getOfflineAlertQueue()
  return queue.filter(r => r.syncStatus === 'pending' || r.syncStatus === 'uploading').length
}

/**
 * 获取离线队列总数量
 * @returns {{ taskCount: number, alertCount: number, total: number }}
 */
export function getOfflineQueueStats() {
  const taskCount = getPendingTaskCount()
  const alertCount = getPendingAlertCount()
  return {
    taskCount,
    alertCount,
    total: taskCount + alertCount
  }
}

/**
 * 清空所有离线队列（谨慎使用）
 */
export function clearAllQueues() {
  uni.removeStorageSync(TASK_QUEUE_KEY)
  uni.removeStorageSync(ALERT_QUEUE_KEY)
}

/**
 * 按优先级排序任务队列（高优先级优先同步）
 * @returns {Array}
 */
export function getSortedTaskQueue() {
  const queue = getOfflineTaskQueue()
  const priorityOrder = { high: 0, normal: 1, low: 2 }
  return queue.sort((a, b) => {
    return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
  })
}

/**
 * 初始化离线队列网络监听
 */
export function initOfflineQueueListener() {
  // 监听网络状态变化
  uni.onNetworkStatusChange((res) => {
    uni.setStorageSync('network_type', res.networkType)
    if (res.isConnected) {
      console.log('[OfflineQueue] 网络恢复，触发队列同步检查')
      uni.$emit('network-restored')
    } else {
      console.log('[OfflineQueue] 网络断开，进入离线模式')
      uni.$emit('network-lost')
    }
  })

  // 初始化网络状态
  uni.getNetworkType({
    success: (res) => {
      uni.setStorageSync('network_type', res.networkType)
    }
  })
}
