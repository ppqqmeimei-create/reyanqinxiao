/**
 * evidenceStorage.js — 取证离线存储工具类
 * 职责：
 *   1. 将临时图片持久化保存到应用私有目录（防系统清理）
 *   2. 将完整元数据写入 evidence_sync_queue 队列
 *   3. 生成防伪唯一校验码（时间戳 + 用户ID 的简易哈希）
 */

const QUEUE_KEY = 'evidence_sync_queue'

/**
 * 生成简易防伪哈希（唯一校验码）
 * 算法：将 timestamp+userId 做字符求和，转36进制，取前12位大写
 * @param {number} timestamp
 * @param {string} userId
 * @returns {string}  形如 "EV-A3F2C1D9E8B7"
 */
export function generateCheckCode(timestamp, userId) {
  const raw = String(timestamp) + String(userId || 'ANONYMOUS')
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0
  }
  // 附加随机盐，避免相同入参碰撞
  const salt = Math.floor(Math.random() * 0xFFFF)
  const combined = Math.abs(hash ^ salt ^ timestamp)
  const code = combined.toString(36).toUpperCase().padStart(8, '0').slice(0, 8)
  return `EV-${code}-${String(timestamp).slice(-6)}`
}

/**
 * 将临时图片持久化保存到私有目录
 * @param {string} tempPath  uni.chooseImage / canvasToTempFilePath 返回的临时路径
 * @returns {Promise<string>}  持久化后的文件路径
 */
function persistFile(tempPath) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    // 微信小程序使用 wx.saveFile
    uni.saveFile({
      tempFilePath: tempPath,
      success: (res) => resolve(res.savedFilePath),
      fail: (err) => {
        // saveFile 失败时降级：直接用临时路径（短期内有效）
        console.warn('[EvidenceStorage] saveFile 失败，降级使用临时路径:', err)
        resolve(tempPath)
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    // 其他平台直接使用临时路径
    resolve(tempPath)
    // #endif
  })
}

/**
 * 读取当前队列
 * @returns {Array}
 */
export function getQueue() {
  try {
    const q = uni.getStorageSync(QUEUE_KEY)
    return Array.isArray(q) ? q : []
  } catch (e) {
    return []
  }
}

/**
 * 保存一条取证记录到离线队列
 * @param {object} photoData
 * @param {string} photoData.tempPath     - 水印合成后的临时路径
 * @param {string} photoData.latitude     - 纬度
 * @param {string} photoData.longitude    - 经度
 * @param {string} photoData.timeStr      - 格式化时间字符串
 * @param {string} photoData.operator     - 执法人员姓名/警号
 * @param {string} [photoData.alertId]    - 关联预警ID（可选）
 * @returns {Promise<object>}  写入队列后的完整记录
 */
export async function saveToOfflineQueue(photoData) {
  const timestamp = Date.now()
  const userInfo = uni.getStorageSync('user_info') || {}
  const userId = userInfo.badgeNumber || userInfo.id || 'UNKNOWN'

  // 1. 持久化图片文件
  let filePath = photoData.tempPath
  try {
    filePath = await persistFile(photoData.tempPath)
  } catch (e) {
    console.warn('[EvidenceStorage] 持久化失败:', e)
  }

  // 2. 生成唯一校验码
  const checkCode = generateCheckCode(timestamp, userId)

  // 3. 构建完整记录
  const record = {
    id: checkCode,                        // 以校验码作为唯一ID
    filePath,                             // 持久化路径
    tempPath: photoData.tempPath,         // 保留临时路径备用
    captureTime: timestamp,
    timeStr: photoData.timeStr,
    latitude: photoData.latitude,
    longitude: photoData.longitude,
    operator: photoData.operator,
    userId,
    alertId: photoData.alertId || null,
    checkCode,                            // 防伪唯一校验码
    syncStatus: 'pending',                // pending | uploading | done | failed
    retryCount: 0
  }

  // 4. 写入队列
  try {
    const queue = getQueue()
    queue.push(record)
    uni.setStorageSync(QUEUE_KEY, queue)
    console.log(`[EvidenceStorage] 已入队: ${checkCode}，当前队列长度: ${queue.length}`)
  } catch (e) {
    console.error('[EvidenceStorage] 写入队列失败:', e)
    throw new Error('存储失败，请检查设备空间')
  }

  return record
}

/**
 * 从队列中移除一条记录（上传成功后调用）
 * @param {string} recordId  记录的 checkCode / id
 */
export function removeFromQueue(recordId) {
  try {
    const queue = getQueue().filter(r => r.id !== recordId)
    uni.setStorageSync(QUEUE_KEY, queue)
  } catch (e) {
    console.error('[EvidenceStorage] 移除队列记录失败:', e)
  }
}

/**
 * 更新队列中某条记录的状态
 * @param {string} recordId
 * @param {Partial<object>} patch
 */
export function updateQueueRecord(recordId, patch) {
  try {
    const queue = getQueue().map(r => r.id === recordId ? { ...r, ...patch } : r)
    uni.setStorageSync(QUEUE_KEY, queue)
  } catch (e) {
    console.error('[EvidenceStorage] 更新队列记录失败:', e)
  }
}

/**
 * 删除持久化文件（上传成功后清理磁盘）
 * @param {string} filePath
 */
export function deletePersistedFile(filePath) {
  // #ifdef MP-WEIXIN
  try {
    const fs = wx.getFileSystemManager()
    fs.unlink({ filePath, fail: () => {} })
  } catch (e) {}
  // #endif
}

/**
 * 获取队列中待同步的记录数量
 * @returns {number}
 */
export function getPendingCount() {
  const queue = getQueue()
  return queue.filter(r => r.syncStatus === 'pending' || r.syncStatus === 'uploading').length
}

/**
 * 清空整个队列（谨慎使用）
 */
export function clearQueue() {
  try {
    const queue = getQueue()
    queue.forEach(r => {
      if (r.filePath) deletePersistedFile(r.filePath)
    })
    uni.removeStorageSync(QUEUE_KEY)
  } catch (e) {
    console.error('[EvidenceStorage] 清空队列失败:', e)
  }
}
