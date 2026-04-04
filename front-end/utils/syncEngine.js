/**
 * syncEngine.js — 取证后台同步引擎（性能加固版）
 * 改动：
 *   1. uploadRecord 支持上传进度，通过 uni.$emit('sync-progress', ...) 广播
 *   2. startSync 统一获取 Token，不在循环内反复读取 Storage
 *   3. startSync 增加 5 分钟最大执行时间限制，超时自动释放 isSyncing 锁
 *   4. 网络监听保持单例注册
 */

import {
  getQueue,
  removeFromQueue,
  updateQueueRecord,
  deletePersistedFile
} from './evidenceStorage.js'

const MAX_RETRY      = 5           // 最大重试次数
const MAX_SYNC_MS    = 5 * 60 * 1000  // 最大同步时间：5 分钟
const RECORD_TIMEOUT = 60000       // 单条上传超时：60 秒

const UPLOAD_URL = (() => {
  try {
    const base = uni.getStorageSync('baseURL') || 'http://127.0.0.1:3000'
    return `${base}/api/v1/evidence/upload`
  } catch (e) {
    return 'http://127.0.0.1:3000/api/v1/evidence/upload'
  }
})()

let isSyncing         = false
let networkListenerOn = false
let syncTimeoutTimer  = null   // 全局超时定时器句柄

// ─── 进度事件广播 ────────────────────────────────────────────
/**
 * 广播同步进度事件
 * @param {'waiting'|'uploading'|'done'|'error'} status
 * @param {object} [payload]
 */
function emitProgress(status, payload = {}) {
  try {
    uni.$emit('sync-progress', { status, ...payload })
  } catch (e) {
    // uni.$emit 在某些平台可能不可用，静默忽略
  }
}

// ─── 单条记录上传 ────────────────────────────────────────────
/**
 * 上传单条取证记录（含进度回调）
 * @param {object} record
 * @param {string} token   由 startSync 统一获取并传入
 * @returns {Promise<boolean>}
 */
function uploadRecord(record, token) {
  return new Promise((resolve) => {
    updateQueueRecord(record.id, { syncStatus: 'uploading' })
    emitProgress('uploading', { id: record.id, percent: 0 })

    const uploadTask = uni.uploadFile({
      url: UPLOAD_URL,
      filePath: record.filePath || record.tempPath,
      name: 'evidence_image',
      header: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      formData: {
        check_code:   record.checkCode,
        capture_time: String(record.captureTime),
        latitude:     record.latitude,
        longitude:    record.longitude,
        operator:     record.operator,
        user_id:      record.userId || '',
        alert_id:     record.alertId || ''
      },
      timeout: RECORD_TIMEOUT,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[SyncEngine] 上传成功: ${record.id}`)
          emitProgress('done', { id: record.id, percent: 100 })
          deletePersistedFile(record.filePath)
          removeFromQueue(record.id)
          resolve(true)
        } else {
          console.warn(`[SyncEngine] 服务器拒绝: ${record.id} status=${res.statusCode}`)
          emitProgress('error', { id: record.id, error: `HTTP ${res.statusCode}` })
          updateQueueRecord(record.id, {
            syncStatus: 'failed',
            retryCount: (record.retryCount || 0) + 1,
            lastError:  `HTTP ${res.statusCode}`
          })
          resolve(false)
        }
      },
      fail: (err) => {
        const retryCount = (record.retryCount || 0) + 1
        console.warn(`[SyncEngine] 上传失败: ${record.id} retry=${retryCount}`, err.errMsg)
        emitProgress('error', { id: record.id, error: err.errMsg || '网络错误' })
        updateQueueRecord(record.id, {
          syncStatus: retryCount >= MAX_RETRY ? 'failed' : 'pending',
          retryCount,
          lastError:  err.errMsg || '网络错误'
        })
        resolve(false)
      }
    })

    // 注册进度回调（uni.uploadFile 返回 uploadTask 对象）
    if (uploadTask && typeof uploadTask.onProgressUpdate === 'function') {
      uploadTask.onProgressUpdate((progressRes) => {
        const percent = progressRes.progress || 0
        console.log(`[SyncEngine] 进度 ${record.id} ${percent}%`)
        emitProgress('uploading', { id: record.id, percent })
      })
    }
  })
}

// ─── 启动同步 ────────────────────────────────────────────────
/**
 * 启动同步：遍历队列，逐条上传
 * - Token 在此统一获取一次，不在循环内反复读取 Storage
 * - 超过 MAX_SYNC_MS (5分钟) 自动熔断，释放 isSyncing 锁
 * @param {object}  [options]
 * @param {boolean} [options.force=false]  强制同步 failed 记录
 * @returns {Promise<{success:number, failed:number, skipped:number}>}
 */
export async function startSync(options = {}) {
  if (isSyncing) {
    console.log('[SyncEngine] 已有同步任务进行中，跳过')
    return { success: 0, failed: 0, skipped: 0 }
  }

  const queue = getQueue()
  if (queue.length === 0) {
    console.log('[SyncEngine] 队列为空，无需同步')
    return { success: 0, failed: 0, skipped: 0 }
  }

  const targets = queue.filter(r =>
    r.syncStatus === 'pending' ||
    r.syncStatus === 'uploading' ||   // 上次中断的记录重置为 pending
    (options.force && r.syncStatus === 'failed' && (r.retryCount || 0) < MAX_RETRY)
  )

  // 将上次异常中断的 uploading 重置为 pending
  targets.forEach(r => {
    if (r.syncStatus === 'uploading') updateQueueRecord(r.id, { syncStatus: 'pending' })
  })

  if (targets.length === 0) {
    console.log('[SyncEngine] 无待上传记录')
    emitProgress('waiting', { total: queue.length })
    return { success: 0, failed: 0, skipped: queue.length }
  }

  // ── 统一获取 Token（只读一次 Storage）
  let token = ''
  try {
    token = uni.getStorageSync('user_token') || uni.getStorageSync('token') || ''
  } catch (e) {}

  isSyncing = true
  let aborted = false

  // ── 5 分钟超时熔断
  syncTimeoutTimer = setTimeout(() => {
    if (!isSyncing) return
    console.warn('[SyncEngine] 同步超时（5分钟），强制释放锁')
    aborted = true
    isSyncing = false
    emitProgress('error', { error: '同步超时，已自动中止' })
    // 将仍在 uploading 状态的记录重置回 pending
    getQueue()
      .filter(r => r.syncStatus === 'uploading')
      .forEach(r => updateQueueRecord(r.id, { syncStatus: 'pending' }))
  }, MAX_SYNC_MS)

  console.log(`[SyncEngine] 开始同步，共 ${targets.length} 条`)
  emitProgress('uploading', { id: targets[0]?.id, percent: 0, total: targets.length })

  let success = 0, failed = 0

  for (const record of targets) {
    if (aborted) break
    const ok = await uploadRecord(record, token)
    ok ? success++ : failed++
    // 条间间隔，避免打爆服务器
    if (!aborted) await new Promise(r => setTimeout(r, 300))
  }

  // 清理超时定时器
  clearTimeout(syncTimeoutTimer)
  syncTimeoutTimer = null

  if (!aborted) {
    isSyncing = false
    console.log(`[SyncEngine] 同步完成 成功${success} 失败${failed}`)
    const remaining = getQueue().length
    emitProgress(remaining === 0 ? 'done' : 'waiting', {
      success, failed, remaining
    })
  }

  return { success, failed, skipped: queue.length - targets.length }
}

// ─── 网络监听 ────────────────────────────────────────────────
/**
 * 初始化网络监听（全局单例）
 */
export function initNetworkListener() {
  if (networkListenerOn) return
  networkListenerOn = true

  let lastNetworkType = 'unknown'

  uni.getNetworkType({
    success: (res) => {
      lastNetworkType = res.networkType
      uni.setStorageSync('network_type', res.networkType)
      console.log(`[SyncEngine] 当前网络: ${res.networkType}`)
      if (res.networkType !== 'none') {
        const q = getQueue()
        if (q.length > 0) {
          console.log(`[SyncEngine] 发现 ${q.length} 条遗留记录，自动同步`)
          startSync()
        }
      }
    }
  })

  uni.onNetworkStatusChange((res) => {
    const prevType = lastNetworkType
    const currType = res.networkType
    lastNetworkType = currType
    uni.setStorageSync('network_type', currType)
    console.log(`[SyncEngine] 网络变化: ${prevType} → ${currType}`)
    if (prevType === 'none' && currType !== 'none') {
      console.log('[SyncEngine] 网络恢复，自动触发同步')
      setTimeout(() => startSync(), 1000)
    }
  })
}

/**
 * 初始化同步引擎（在 App.vue onLaunch 中调用）
 */
export function initSyncEngine() {
  console.log('[SyncEngine] 引擎初始化')
  initNetworkListener()
}

/**
 * 获取当前同步状态
 * @returns {{ isSyncing: boolean, queueLength: number }}
 */
export function getSyncStatus() {
  return {
    isSyncing,
    queueLength: getQueue().length
  }
}
