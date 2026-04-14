/**
 * ==========================================
 * Offline Store - 离线CRDTs同步引擎
 * ==========================================
 * 基于CRDTs的无冲突离线数据同步
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useOfflineStore = defineStore('offline', () => {
  // ===== 网络状态 =====
  const isOnline = ref(true);
  const networkType = ref('wifi');
  const lastOnlineTime = ref(null);
  const lastOfflineTime = ref(null);

  // ===== CRDTs状态向量时钟 =====
  // 每个设备一个逻辑时钟，用于检测并发修改
  const vectorClock = ref({
    deviceId: null,
    clock: 0,
    history: {},  // { deviceId: clock }
  });

  // ===== 离线操作日志（CRDTs OpLog）=====
  // 每个操作记录：{ id, type, key, value, vectorClock, timestamp, tombstone }
  const opLog = ref([]);

  // ===== 同步状态 =====
  const syncState = ref({
    status: 'idle',    // 'idle' | 'syncing' | 'merging' | 'conflict' | 'error'
    progress: 0,
    lastSyncTime: null,
    pendingOps: 0,
    mergedOps: 0,
    conflicts: [],
    error: null,
  });

  // ===== 同步结果精细化记录（已同步/待同步/失败） =====
  const syncResultLog = ref([]); // { id, opId, type, collection, key, status: 'pending'|'synced'|'failed', error, syncedAt }

  // ===== 各类型离线数据 =====
  const offlineData = ref({
    tasks: [],
    alerts: [],
    evidence: [],
    intelligence: [],
    deviceStatus: [],
  });

  // ===== 冲突记录 =====
  const conflictLog = ref([]);

  // ===== 计算属性 =====
  const hasPendingSync = computed(() => syncState.value.pendingOps > 0);

  // 精细化同步统计
  const syncedCount = computed(() => syncResultLog.value.filter(o => o.status === 'synced').length);
  const failedCount = computed(() => syncResultLog.value.filter(o => o.status === 'failed').length);
  const pendingCount = computed(() => syncResultLog.value.filter(o => o.status === 'pending').length);

  const offlineDuration = computed(() => {
    if (!lastOfflineTime.value || isOnline.value) return 0;
    return Date.now() - new Date(lastOfflineTime.value).getTime();
  });

  // ===== 网络监听 =====
  function setOnlineStatus(status) {
    const wasOffline = !isOnline.value;
    isOnline.value = status;

    if (status) {
      lastOnlineTime.value = new Date().toISOString();
      // 恢复在线，触发同步
      if (wasOffline) {
        _mergePendingOps();
      }
    } else {
      lastOfflineTime.value = new Date().toISOString();
    }
  }

  function setNetworkType(type) {
    networkType.value = type;
  }

  // ===== CRDTs操作 =====
  /**
   * 添加一个离线操作（CRDTs LWW-Register风格）
   * 冲突解决策略：Last-Writer-Wins (LWW) + Vector Clock
   */
  function addOfflineOp(operation) {
    _incrementClock();

    const op = {
      id: `OP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: operation.type,     // 'create' | 'update' | 'delete'
      collection: operation.collection,  // 'tasks' | 'alerts' | 'evidence' | ...
      key: operation.key,
      value: operation.value,
      vectorClock: { ...vectorClock.value },
      timestamp: new Date().toISOString(),
      deviceId: vectorClock.value.deviceId,
      tombstone: false,  // 删除标记（CRDTs墓碑）
      merged: false,
    };

    opLog.value.unshift(op);
    _persistOpLog();

    // 同步结果精细化记录：新增操作初始状态为 pending
    syncResultLog.value.unshift({
      id: `SR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      opId: op.id,
      type: op.type,
      collection: op.collection,
      key: op.key,
      status: 'pending',  // pending | synced | failed
      error: null,
      syncedAt: null,
    });
    _persistSyncResultLog();

    _updateSyncState();

    return op.id;
  }

  // ===== 删除操作（墓碑标记）=====
  function markAsDeleted(collection, key) {
    return addOfflineOp({
      type: 'delete',
      collection,
      key,
      value: null,
    });
  }

  // ===== CRDTs合并（核心算法）=====
  /**
   * 合并远程操作日志
   * 冲突解决：
   * 1. 比较向量时钟判断并发关系
   * 2. LWW策略：时间戳晚的覆盖早的
   * 3. 同Key的并发修改记录为冲突
   */
  async function mergeRemoteOps(remoteOps) {
    syncState.value.status = 'merging';
    let mergedCount = 0;
    const conflicts = [];

    for (const remoteOp of remoteOps) {
      // 跳过已合并的
      if (remoteOp.merged) continue;

      // 查找本地对应操作
      const localOp = opLog.value.find(
        o => o.collection === remoteOp.collection && o.key === remoteOp.key
      );

      if (!localOp) {
        // 无冲突，直接合并
        opLog.value.unshift({ ...remoteOp, merged: true });
        mergedCount++;
      } else {
        // 检测并发关系
        const comparison = _compareVectorClocks(localOp.vectorClock, remoteOp.vectorClock);

        if (comparison === 'CONCURRENT') {
          // 并发冲突：LWW策略
          if (new Date(remoteOp.timestamp) > new Date(localOp.timestamp)) {
            // 远程更新更晚，合并远程
            const idx = opLog.value.findIndex(o => o.id === localOp.id);
            if (idx !== -1) opLog.value[idx] = { ...remoteOp, merged: true };

            conflicts.push({
              type: 'CONCURRENT_UPDATE',
              collection: remoteOp.collection,
              key: remoteOp.key,
              localOp,
              remoteOp,
              resolution: 'REMOTE_WINS',
              resolvedAt: new Date().toISOString(),
            });
          } else {
            conflicts.push({
              type: 'CONCURRENT_UPDATE',
              collection: remoteOp.collection,
              key: remoteOp.key,
              localOp,
              remoteOp,
              resolution: 'LOCAL_WINS',
              resolvedAt: new Date().toISOString(),
            });
          }
          mergedCount++;
        } else if (comparison === 'REMOTE_AFTER_LOCAL') {
          // 远程操作在本地操作之后，直接合并
          const idx = opLog.value.findIndex(o => o.id === localOp.id);
          if (idx !== -1) opLog.value[idx] = { ...remoteOp, merged: true };
          mergedCount++;
        }
        // REMOTE_BEFORE_LOCAL 或 EQUAL：本地操作已包含远程操作，无需处理
      }
    }

    syncState.value.mergedOps += mergedCount;
    syncState.value.conflicts.push(...conflicts);
    conflictLog.value.push(...conflicts);
    _persistOpLog();
    _updateSyncState();

    return { mergedCount, conflicts };
  }

  // ===== 向量时钟比较 =====
  function _compareVectorClocks(vc1, vc2) {
    const keys1 = Object.keys(vc1.history || {});
    const keys2 = Object.keys(vc2.history || {});

    // 简单的LWW近似比较（实际应用中需要完整向量时钟实现）
    if (vc1.timestamp > vc2.timestamp) return 'LOCAL_AFTER_REMOTE';
    if (vc1.timestamp < vc2.timestamp) return 'REMOTE_AFTER_LOCAL';

    // 并发（无法确定先后）
    return 'CONCURRENT';
  }

  // ===== 逻辑时钟 =====
  function _incrementClock() {
    vectorClock.value.clock++;
    vectorClock.value.history[vectorClock.value.deviceId] = vectorClock.value.clock;
  }

  // ===== 同步状态更新 =====
  function _updateSyncState() {
    syncState.value.pendingOps = opLog.value.filter(o => !o.merged).length;
  }

  // ===== 离线数据存取 =====
  function saveOfflineData(collection, data) {
    offlineData.value[collection] = data;
    uni.setStorageSync(`offline_${collection}`, data);
  }

  function getOfflineData(collection) {
    if (offlineData.value[collection]?.length) {
      return offlineData.value[collection];
    }
    const saved = uni.getStorageSync(`offline_${collection}`);
    if (saved) {
      offlineData.value[collection] = saved;
      return saved;
    }
    return [];
  }

  // ===== 持久化 =====
  function _persistOpLog() {
    uni.setStorageSync('crdt_oplog', opLog.value.slice(0, 500));
  }

  function _persistVectorClock() {
    uni.setStorageSync('crdt_vector_clock', vectorClock.value);
  }

  function _persistSyncResultLog() {
    uni.setStorageSync('crdt_sync_result', syncResultLog.value.slice(0, 500));
  }

  // ===== 触发同步（精细化：逐条标记已同步/失败）=====
  async function _mergePendingOps() {
    if (!isOnline.value) return;

    const pendingOps = opLog.value.filter(o => !o.merged);
    if (pendingOps.length === 0) {
      syncState.value.status = 'idle';
      return;
    }

    syncState.value.status = 'syncing';
    syncState.value.progress = 0;

    try {
      let synced = 0;
      let failed = 0;
      const total = pendingOps.length;

      for (let i = 0; i < pendingOps.length; i++) {
        const op = pendingOps[i];

        try {
          // 模拟上传到服务器
          await new Promise((resolve, reject) => {
            setTimeout(() => {
              // 模拟 5% 概率的失败
              if (Math.random() < 0.05) {
                reject(new Error('网络超时'));
              } else {
                resolve();
              }
            }, 100);
          });

          // 成功：标记为已同步
          const record = syncResultLog.value.find(r => r.opId === op.id);
          if (record) {
            record.status = 'synced';
            record.syncedAt = new Date().toISOString();
          }

          // 标记 opLog 中的操作
          const idx = opLog.value.findIndex(o => o.id === op.id);
          if (idx !== -1) opLog.value[idx].merged = true;

          synced++;
        } catch (err) {
          // 失败：标记为 failed，记录错误
          const record = syncResultLog.value.find(r => r.opId === op.id);
          if (record) {
            record.status = 'failed';
            record.error = err.message;
          }
          failed++;
        }

        // 更新进度
        syncState.value.progress = Math.round(((i + 1) / total) * 100);
        syncState.value.pendingOps = pendingOps.length - (i + 1);
      }

      syncState.value.mergedOps += synced;
      syncState.value.progress = 100;
      syncState.value.lastSyncTime = new Date().toISOString();
      syncState.value.status = failed > 0 ? 'conflict' : 'idle';
      syncState.value.pendingOps = 0;

      _persistOpLog();
      _persistSyncResultLog();

      // 广播同步完成
      uni.$emit('offline:sync-complete', { synced, failed });
    } catch (error) {
      syncState.value.status = 'error';
      syncState.value.error = error.message;
      uni.$emit('offline:sync-error', error);
    }
  }

  function triggerSync() {
    if (isOnline.value) {
      _mergePendingOps();
    }
  }

  // ===== 初始化 =====
  function init() {
    // 初始化设备ID
    const savedVC = uni.getStorageSync('crdt_vector_clock');
    if (savedVC && savedVC.deviceId) {
      vectorClock.value = savedVC;
    } else {
      vectorClock.value = {
        deviceId: `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        clock: 0,
        history: {},
      };
      _persistVectorClock();
    }

    // 恢复OpLog
    const savedLog = uni.getStorageSync('crdt_oplog');
    if (Array.isArray(savedLog)) opLog.value = savedLog;

    // 恢复冲突日志
    const savedConflicts = uni.getStorageSync('crdt_conflicts');
    if (Array.isArray(savedConflicts)) conflictLog.value = savedConflicts;

    // 恢复同步结果记录
    const savedResultLog = uni.getStorageSync('crdt_sync_result');
    if (Array.isArray(savedResultLog)) syncResultLog.value = savedResultLog;

    // 网络监听
    uni.onNetworkStatusChange(res => {
      setOnlineStatus(res.isConnected);
      setNetworkType(res.networkType);
    });

    // 初始化网络状态
    uni.getNetworkType({
      success: res => {
        const connected = res.networkType !== 'none';
        setOnlineStatus(connected);
        setNetworkType(res.networkType);
      },
    });

    _updateSyncState();
  }

  return {
    // 状态
    isOnline,
    networkType,
    lastOnlineTime,
    lastOfflineTime,
    vectorClock,
    opLog,
    syncState,
    offlineData,
    conflictLog,
    syncResultLog,

    // 计算属性
    hasPendingSync,
    syncedCount,
    failedCount,
    pendingCount,

    // Actions
    setOnlineStatus,
    setNetworkType,
    addOfflineOp,
    markAsDeleted,
    mergeRemoteOps,
    saveOfflineData,
    getOfflineData,
    triggerSync,

    // 初始化
    init,
  };
});
