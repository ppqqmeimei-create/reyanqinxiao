import { evidenceAPI } from './request'

const QUEUE_KEY = 'pending_evidence_queue'

function readQueue() {
  return uni.getStorageSync(QUEUE_KEY) || []
}

function writeQueue(list) {
  uni.setStorageSync(QUEUE_KEY, list)
}

function networkOnline() {
  const net = uni.getStorageSync('network_type')
  return net && net !== 'none' && net !== 'unknown'
}

export function enqueueEvidence(payload) {
  const queue = readQueue()
  queue.push({
    ...payload,
    _id: Date.now() + Math.floor(Math.random() * 1000),
    queuedAt: new Date().toISOString(),
    retryCount: 0
  })
  writeQueue(queue)
  return queue.length
}

export async function flushEvidenceQueue() {
  if (!networkOnline()) return { flushed: 0, pending: readQueue().length }

  const queue = readQueue()
  if (!Array.isArray(queue) || queue.length === 0) return { flushed: 0, pending: 0 }

  const pending = []
  let flushed = 0

  for (const item of queue) {
    try {
      await evidenceAPI.upload({
        task_id: item.task_id,
        warning_id: item.warning_id,
        type: item.type || 'mixed',
        url: item.url || 'offline://queued-evidence',
        description: item.description || '',
        payload: {
          photos: item.photos || [],
          videos: item.videos || [],
          uploadTime: item.uploadTime,
          source: 'offline-queue'
        }
      })
      flushed += 1
    } catch (e) {
      pending.push({ ...item, retryCount: (item.retryCount || 0) + 1 })
    }
  }

  writeQueue(pending)
  return { flushed, pending: pending.length }
}

export function getEvidenceQueueCount() {
  const queue = readQueue()
  return Array.isArray(queue) ? queue.length : 0
}
