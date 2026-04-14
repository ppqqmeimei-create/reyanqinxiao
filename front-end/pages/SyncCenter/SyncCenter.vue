<template>
  <view class="sync-page" :class="{ 'night-mode': appStore.nightModeEnabled }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <view class="nav-title">
        <text class="title-text">数据同步中心</text>
        <text class="subtitle">Offline Sync Center</text>
      </view>
    </view>

    <!-- 网络状态 -->
    <view class="network-status" :class="offlineStore.isOnline ? 'online' : 'offline'">
      <view class="status-indicator">
        <view class="status-dot" :class="{ pulse: offlineStore.isOnline }"></view>
        <text class="status-text">
          {{ offlineStore.isOnline ? '网络已连接' : '离线模式' }}
        </text>
      </view>
      <text class="network-type">{{ getNetworkLabel(offlineStore.networkType) }}</text>
      <view class="offline-duration" v-if="!offlineStore.isOnline">
        <text>已离线 {{ formatDuration(offlineStore.offlineDuration) }}</text>
      </view>
    </view>

    <!-- 同步状态总览 -->
    <view class="sync-overview">
      <view class="overview-card main">
        <view class="overview-icon">
          {{ syncStatusIcon }}
        </view>
        <view class="overview-info">
          <text class="overview-status">{{ syncStatusText }}</text>
          <text class="overview-desc">{{ syncStatusDesc }}</text>
        </view>
        <view class="sync-btn" v-if="offlineStore.isOnline && offlineStore.hasPendingSync" @click="triggerSync">
          <text>{{ offlineStore.syncState.status === 'syncing' ? '同步中...' : '立即同步' }}</text>
        </view>
      </view>

      <!-- 同步进度 -->
      <view v-if="offlineStore.syncState.status === 'syncing'" class="sync-progress-card">
        <view class="progress-header">
          <text class="progress-title">正在同步</text>
          <text class="progress-percent">{{ offlineStore.syncState.progress }}%</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: offlineStore.syncState.progress + '%' }"></view>
        </view>
        <view class="progress-stats">
          <text>待同步: {{ offlineStore.syncState.pendingOps }}条</text>
          <text>已合并: {{ offlineStore.syncState.mergedOps }}条</text>
        </view>
      </view>

      <!-- 已同步/待同步/失败 三色计数卡 -->
      <view class="sync-result-cards">
        <view class="sync-result-card synced">
          <text class="sync-result-num">{{ offlineStore.syncedCount }}</text>
          <text class="sync-result-label">已同步</text>
          <text class="sync-result-icon">✓</text>
        </view>
        <view class="sync-result-card pending">
          <text class="sync-result-num">{{ offlineStore.pendingCount }}</text>
          <text class="sync-result-label">待同步</text>
          <text class="sync-result-icon">⏳</text>
        </view>
        <view class="sync-result-card failed">
          <text class="sync-result-num">{{ offlineStore.failedCount }}</text>
          <text class="sync-result-label">失败</text>
          <text class="sync-result-icon">✕</text>
        </view>
      </view>

      <!-- 失败详情（存在失败记录时展示） -->
      <view v-if="offlineStore.failedCount > 0" class="sync-failed-hint">
        <text class="failed-hint-icon">⚠️</text>
        <text class="failed-hint-text">有 {{ offlineStore.failedCount }} 条数据同步失败，请检查网络后重试</text>
        <text class="failed-retry" @click="retryFailedOps">重试</text>
      </view>
    </view>

    <!-- 同步队列 -->
    <view class="sync-queue">
      <view class="section-header">
        <text class="section-title">离线操作队列</text>
        <text class="section-count">{{ offlineStore.opLog.length }} 条</text>
      </view>

      <view v-if="offlineStore.opLog.length === 0" class="empty-queue">
        <text class="empty-icon">✓</text>
        <text class="empty-text">暂无待同步操作</text>
        <text class="empty-sub">所有数据已与服务器同步</text>
      </view>

      <view v-else class="queue-list">
        <view
          v-for="op in displayedOps"
          :key="op.id"
          class="queue-item"
          :class="{ merged: op.merged, tombstone: op.tombstone }"
        >
          <view class="op-type-badge" :class="op.type">
            {{ getOpTypeIcon(op.type) }}
          </view>
          <view class="op-info">
            <text class="op-collection">{{ getCollectionLabel(op.collection) }}</text>
            <text class="op-detail">{{ op.key }}</text>
            <text class="op-time">{{ formatTime(op.timestamp) }}</text>
          </view>
          <view class="op-status">
            <text class="status-tag" :class="{ merged: op.merged, pending: !op.merged }">
              {{ op.merged ? '已合并' : '待同步' }}
            </text>
            <text v-if="op.tombstone" class="tombstone-tag">已删除</text>
          </view>
        </view>

        <view v-if="offlineStore.opLog.length > displayLimit" class="load-more" @click="displayLimit += 10">
          <text>加载更多 ({{ offlineStore.opLog.length - displayLimit }} 条)</text>
        </view>
      </view>
    </view>

    <!-- CRDTs 状态 -->
    <view class="crdt-status">
      <view class="section-header">
        <text class="section-title">CRDTs 状态向量</text>
        <view class="vc-badge">向量时钟</view>
      </view>

      <view class="vc-card">
        <view class="vc-row">
          <text class="vc-label">设备ID</text>
          <text class="vc-value mono">{{ offlineStore.vectorClock.deviceId || '未初始化' }}</text>
        </view>
        <view class="vc-row">
          <text class="vc-label">逻辑时钟</text>
          <text class="vc-value">{{ offlineStore.vectorClock.clock }}</text>
        </view>
        <view class="vc-row">
          <text class="vc-label">设备历史</text>
          <view class="vc-history">
            <view v-for="(clock, deviceId) in offlineStore.vectorClock.history" :key="deviceId" class="vc-history-item">
              <text class="device-id">{{ deviceId.substr(0, 12) }}...</text>
              <text class="device-clock">{{ clock }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 冲突记录 -->
    <view class="conflict-section">
      <view class="section-header">
        <text class="section-title">冲突记录</text>
        <text class="section-count">{{ offlineStore.conflictLog.length }} 条</text>
      </view>

      <view v-if="offlineStore.conflictLog.length === 0" class="empty-conflict">
        <text class="empty-text">暂无冲突记录</text>
        <text class="empty-sub">所有操作已自动合并解决</text>
      </view>

      <view v-else class="conflict-list">
        <view
          v-for="conflict in displayedConflicts"
          :key="conflict.id || `${conflict.collection}-${conflict.key}-${conflict.resolvedAt}`"
          class="conflict-item"
          :class="conflict.resolution"
        >
          <view class="conflict-header">
            <text class="conflict-type-badge">{{ getConflictTypeLabel(conflict.type) }}</text>
            <text class="conflict-resolved">{{ getResolutionLabel(conflict.resolution) }}</text>
          </view>
          <text class="conflict-detail">
            {{ getCollectionLabel(conflict.collection) }} / {{ conflict.key }}
          </text>
          <text class="conflict-time">{{ formatTime(conflict.resolvedAt) }}</text>
        </view>

        <view v-if="offlineStore.conflictLog.length > conflictDisplayLimit" class="load-more" @click="conflictDisplayLimit += 5">
          <text>加载更多</text>
        </view>
      </view>
    </view>

    <!-- 存储管理 -->
    <view class="storage-section">
      <view class="section-header">
        <text class="section-title">本地存储管理</text>
      </view>

      <view class="storage-grid">
        <view v-for="item in storageItems" :key="item.key" class="storage-item">
          <view class="storage-icon">{{ item.icon }}</view>
          <view class="storage-info">
            <text class="storage-name">{{ item.name }}</text>
            <text class="storage-count">{{ item.count }} 条</text>
          </view>
          <view class="storage-actions">
            <text class="action-text" @click="exportStorage(item)">导出</text>
            <text class="action-text danger" @click="clearStorage(item)">清除</text>
          </view>
        </view>
      </view>

      <!-- 全部清除 -->
      <view class="danger-zone">
        <view class="danger-btn" @click="showClearConfirm">
          <text class="btn-icon">🗑️</text>
          <text>清除所有本地数据</text>
        </view>
        <text class="danger-hint">此操作不可恢复，请在同步完成后执行</text>
      </view>
    </view>

    <!-- 同步日志 -->
    <view class="log-section">
      <view class="section-header">
        <text class="section-title">同步日志</text>
        <view class="log-filter">
          <view
            v-for="level in logLevels"
            :key="level"
            class="log-level-tag"
            :class="{ active: selectedLogLevel === level }"
            @click="selectedLogLevel = selectedLogLevel === level ? 'ALL' : level"
          >
            <text>{{ level }}</text>
          </view>
        </view>
      </view>

      <view class="log-list">
        <view v-for="log in filteredLogs" :key="log.id" class="log-item" :class="'level-' + log.level">
          <text class="log-time">{{ log.time }}</text>
          <text class="log-level">{{ log.level }}</text>
          <text class="log-message">{{ log.message }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../../stores/app.js';
import { useOfflineStore } from '../../stores/offline.js';

const appStore = useAppStore();
const offlineStore = useOfflineStore();

const displayLimit = ref(10);
const conflictDisplayLimit = ref(5);
const selectedLogLevel = ref('ALL');

const logLevels = ['INFO', 'WARN', 'ERROR'];

const displayedOps = computed(() => offlineStore.opLog.slice(0, displayLimit.value));
const displayedConflicts = computed(() => offlineStore.conflictLog.slice(0, conflictDisplayLimit.value));

// 模拟同步日志
const syncLogs = ref([
  { id: 1, level: 'INFO', time: '09:23:15', message: '检测到网络恢复，开始同步' },
  { id: 2, level: 'INFO', time: '09:23:16', message: '上传待同步操作 3 条' },
  { id: 3, level: 'INFO', time: '09:23:18', message: '合并远程操作 5 条' },
  { id: 4, level: 'WARN', time: '09:23:18', message: '检测到1条并发冲突，使用LWW策略解决' },
  { id: 5, level: 'INFO', time: '09:23:19', message: '同步完成，共处理 8 条操作' },
  { id: 6, level: 'INFO', time: '08:10:00', message: '进入离线模式，启用本地操作队列' },
  { id: 7, level: 'ERROR', time: '08:05:32', message: '网络中断，切换到离线模式' },
]);

const filteredLogs = computed(() => {
  if (selectedLogLevel.value === 'ALL') return syncLogs.value;
  return syncLogs.value.filter(l => l.level === selectedLogLevel.value);
});

const storageItems = ref([
  { key: 'offline_tasks', name: '离线任务', count: 0, icon: '📋' },
  { key: 'offline_alerts', name: '离线预警', count: 0, icon: '🚨' },
  { key: 'evidence_sync_queue', name: '待上传证据', count: 0, icon: '📷' },
  { key: 'crdt_oplog', name: 'CRDTs操作日志', count: 0, icon: '📜' },
]);

const syncStatusIcon = computed(() => {
  const status = offlineStore.syncState.status;
  if (status === 'syncing') return '🔄';
  if (status === 'error') return '❌';
  if (status === 'conflict') return '⚠️';
  if (offlineStore.failedCount > 0) return '⚠️';
  if (offlineStore.hasPendingSync) return '⏳';
  return '✓';
});

const syncStatusText = computed(() => {
  const status = offlineStore.syncState.status;
  if (status === 'syncing') return '同步中';
  if (status === 'error') return '同步失败';
  if (status === 'conflict') return '存在冲突';
  if (offlineStore.failedCount > 0) return '部分失败';
  if (offlineStore.hasPendingSync) return '待同步';
  return '已同步';
});

const syncStatusDesc = computed(() => {
  if (offlineStore.failedCount > 0) {
    return `失败 ${offlineStore.failedCount} 条 | 已同步 ${offlineStore.syncedCount} 条`;
  }
  if (offlineStore.syncState.lastSyncTime) {
    return `上次同步: ${formatTime(offlineStore.syncState.lastSyncTime)}`;
  }
  return offlineStore.isOnline ? '所有数据已同步' : '等待网络恢复';
});

function goBack() {
  uni.navigateBack();
}

function triggerSync() {
  uni.vibrateShort && uni.vibrateShort();
  offlineStore.triggerSync();
}

function retryFailedOps() {
  uni.showModal({
    title: '重试失败操作',
    content: `确认重试 ${offlineStore.failedCount} 条失败的同步操作？`,
    confirmText: '确认重试',
    confirmColor: '#00D4FF',
    success: (res) => {
      if (res.confirm) {
        // 将所有失败记录重置为 pending
        offlineStore.syncResultLog.forEach(record => {
          if (record.status === 'failed') {
            record.status = 'pending';
            record.error = null;
          }
        });
        // 触发同步
        offlineStore.triggerSync();
      }
    }
  });
}

function getNetworkLabel(type) {
  const map = {
    wifi: 'WiFi',
    '4g': '4G',
    '5g': '5G',
    '3g': '3G',
    '2g': '2G',
    none: '无网络',
  };
  return map[type] || type;
}

function getOpTypeIcon(type) {
  const map = { create: '+', update: '↻', delete: '×' };
  return map[type] || '·';
}

function getCollectionLabel(collection) {
  const map = {
    tasks: '任务',
    alerts: '预警',
    evidence: '取证',
    intelligence: '情报',
    deviceStatus: '设备',
  };
  return map[collection] || collection;
}

function getConflictTypeLabel(type) {
  const map = {
    CONCURRENT_UPDATE: '并发更新',
    DELETED_THEN_UPDATED: '删除后更新',
    UNKNOWN: '未知冲突',
  };
  return map[type] || type;
}

function getResolutionLabel(resolution) {
  const map = {
    LOCAL_WINS: '本地优先',
    REMOTE_WINS: '远程优先',
    MERGED: '已合并',
    MANUAL: '需手动处理',
  };
  return map[resolution] || resolution;
}

function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0秒';
  if (ms < 60000) return `${Math.round(ms / 1000)}秒`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}分钟`;
  return `${Math.round(ms / 3600000)}小时`;
}

function exportStorage(item) {
  uni.showToast({ title: `导出 ${item.name}`, icon: 'none' });
}

function clearStorage(item) {
  uni.showModal({
    title: '确认清除',
    content: `确定要清除 ${item.name} 的所有本地数据吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync(item.key);
        item.count = 0;
        uni.showToast({ title: '已清除', icon: 'success' });
      }
    },
  });
}

function showClearConfirm() {
  uni.showModal({
    title: '⚠️ 危险操作',
    content: '此操作将清除所有本地存储数据，包括未同步的操作记录、取证文件、离线任务等。此操作不可恢复！',
    confirmText: '我已知悉风险',
    confirmColor: '#FF4D4F',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.showModal({
          title: '再次确认',
          content: '再次确认：所有本地数据将被永久删除，是否继续？',
          confirmText: '确认删除',
          confirmColor: '#FF4D4F',
          success: (res2) => {
            if (res2.confirm) {
              uni.showToast({ title: '正在清除...', icon: 'none' });
              storageItems.value.forEach(item => {
                uni.removeStorageSync(item.key);
                item.count = 0;
              });
              uni.showToast({ title: '已清除所有本地数据', icon: 'success' });
            }
          },
        });
      }
    },
  });
}

onMounted(() => {
  // 更新存储计数
  storageItems.value[0].count = uni.getStorageInfoSync().keys?.filter(k => k.includes('offline_task')).length || 0;
  storageItems.value[1].count = offlineStore.opLog.filter(o => o.collection === 'alerts').length;
  storageItems.value[2].count = offlineStore.opLog.filter(o => o.collection === 'evidence').length;
  storageItems.value[3].count = offlineStore.opLog.length;
});
</script>

<style lang="scss" scoped>
@mixin night-mode-colors {
  --bg: #1A0000;
  --surface: #2D0000;
  --border: #4D0000;
}

.sync-page {
  min-height: 100vh;
  background: #060A14;
  color: #E8F4FF;
  padding-bottom: 60rpx;

  &.night-mode { @include night-mode-colors; }
}

.nav-header {
  display: flex;
  align-items: center;
  padding: 60rpx 30rpx 20rpx;
  background: linear-gradient(180deg, #0C1B2A 0%, #060A14 100%);
  border-bottom: 1px solid #1A3350;

  .nav-back { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center;
    .icon { font-size: 36rpx; color: #00D4FF; } }
  .nav-title { flex: 1; text-align: center;
    .title-text { font-size: 34rpx; font-weight: 700; color: #E8F4FF; display: block; }
    .subtitle { font-size: 20rpx; color: #7AA8CC; } }
}

.network-status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 30rpx;
  background: #0C1B2A;
  border-bottom: 1px solid #1A3350;

  &.online {
    .status-dot { background: #52C41A; }
    .status-text { color: #52C41A; }
  }

  &.offline {
    background: rgba(255, 169, 64, 0.1);
    border-color: rgba(255, 169, 64, 0.3);
    .status-dot { background: #FFA940; }
    .status-text { color: #FFA940; }
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex: 1;
  }

  .status-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;

    &.pulse { animation: dot-pulse 2s infinite; }
  }

  .status-text { font-size: 26rpx; font-weight: 600; }
  .network-type { font-size: 22rpx; color: #7AA8CC; }
  .offline-duration { font-size: 22rpx; color: #FFA940; }
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.sync-overview {
  padding: 20rpx 30rpx;

  .overview-card {
    background: #0C1B2A;
    border-radius: 20rpx;
    padding: 24rpx;
    border: 1px solid #1A3350;
    display: flex;
    align-items: center;
    gap: 16rpx;

    &.main { border-color: rgba(0, 212, 255, 0.3); }

    .overview-icon { font-size: 48rpx; }
    .overview-info { flex: 1; }
    .overview-status { font-size: 28rpx; font-weight: 700; color: #E8F4FF; display: block; }
    .overview-desc { font-size: 22rpx; color: #7AA8CC; display: block; margin-top: 4rpx; }
  }

  .sync-btn {
    padding: 10rpx 20rpx;
    background: rgba(0, 212, 255, 0.15);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 10rpx;
    font-size: 22rpx;
    color: #00D4FF;
  }

  .sync-progress-card {
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-top: 16rpx;
    border: 1px solid #1A3350;

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12rpx;
      .progress-title { font-size: 24rpx; color: #7AA8CC; }
      .progress-percent { font-size: 24rpx; font-weight: 700; color: #00D4FF; }
    }

    .progress-bar {
      height: 10rpx;
      background: #1A3350;
      border-radius: 5rpx;
      overflow: hidden;
      margin-bottom: 12rpx;
      .progress-fill { height: 100%; background: linear-gradient(90deg, #00D4FF, #007AFF); border-radius: 5rpx; transition: width 0.3s; }
    }

    .progress-stats { display: flex; justify-content: space-between; font-size: 22rpx; color: #4A6A8A; }
  }

  /* 已同步/待同步/失败 三色计数卡 */
  .sync-result-cards {
    display: flex;
    gap: 12rpx;
    margin-top: 16rpx;
  }

  .sync-result-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    padding: 20rpx 16rpx;
    border-radius: 16rpx;
    border: 1px solid;
    position: relative;

    &.synced {
      background: rgba(82, 196, 26, 0.08);
      border-color: rgba(82, 196, 26, 0.3);
      .sync-result-num { color: #52C41A; }
      .sync-result-icon { color: #52C41A; }
    }
    &.pending {
      background: rgba(255, 169, 64, 0.08);
      border-color: rgba(255, 169, 64, 0.3);
      .sync-result-num { color: #FFA940; }
      .sync-result-icon { color: #FFA940; }
    }
    &.failed {
      background: rgba(255, 77, 79, 0.08);
      border-color: rgba(255, 77, 79, 0.3);
      .sync-result-num { color: #FF4D4F; }
      .sync-result-icon { color: #FF4D4F; }
    }

    .sync-result-num {
      font-size: 40rpx;
      font-weight: 800;
      line-height: 1;
    }
    .sync-result-label {
      font-size: 20rpx;
      color: #7AA8CC;
    }
    .sync-result-icon {
      font-size: 24rpx;
      position: absolute;
      top: 10rpx;
      right: 10rpx;
    }
  }

  /* 失败提示条 */
  .sync-failed-hint {
    display: flex;
    align-items: center;
    gap: 10rpx;
    margin-top: 12rpx;
    padding: 14rpx 18rpx;
    background: rgba(255, 77, 79, 0.08);
    border: 1px solid rgba(255, 77, 79, 0.25);
    border-radius: 12rpx;

    .failed-hint-icon { font-size: 24rpx; flex-shrink: 0; }
    .failed-hint-text { flex: 1; font-size: 22rpx; color: #FF8080; }
    .failed-retry {
      font-size: 22rpx;
      color: #FF4D4F;
      font-weight: 700;
      flex-shrink: 0;
      padding: 4rpx 12rpx;
      background: rgba(255, 77, 79, 0.12);
      border-radius: 8rpx;
    }
  }
}

.sync-queue, .crdt-status, .conflict-section, .storage-section, .log-section {
  padding: 0 30rpx;
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;

  .section-title { font-size: 28rpx; font-weight: 700; color: #E8F4FF; }
  .section-count { font-size: 22rpx; color: #4A6A8A; }
  .vc-badge {
    padding: 4rpx 14rpx;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 10rpx;
    font-size: 20rpx;
    color: #00D4FF;
  }
}

.empty-queue, .empty-conflict {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 40rpx 30rpx;
  text-align: center;
  border: 1px solid #1A3350;

  .empty-icon { font-size: 60rpx; display: block; margin-bottom: 16rpx; color: #52C41A; }
  .empty-text { font-size: 26rpx; color: #E8F4FF; display: block; margin-bottom: 8rpx; }
  .empty-sub { font-size: 22rpx; color: #7AA8CC; }
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #0C1B2A;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  border: 1px solid #1A3350;
  transition: all 0.2s;

  &.merged { opacity: 0.6; }
  &.tombstone { opacity: 0.4; }

  .op-type-badge {
    width: 48rpx;
    height: 48rpx;
    border-radius: 10rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: 700;
    flex-shrink: 0;

    &.create { background: rgba(82, 196, 26, 0.15); color: #52C41A; }
    &.update { background: rgba(0, 212, 255, 0.15); color: #00D4FF; }
    &.delete { background: rgba(255, 77, 79, 0.15); color: #FF4D4F; }
  }

  .op-info {
    flex: 1;
    .op-collection { font-size: 24rpx; font-weight: 600; color: #E8F4FF; display: block; }
    .op-detail { font-size: 22rpx; color: #7AA8CC; display: block; }
    .op-time { font-size: 20rpx; color: #4A6A8A; display: block; margin-top: 4rpx; }
  }

  .op-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4rpx;
    .status-tag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx;
      &.merged { background: rgba(82, 196, 26, 0.15); color: #52C41A; }
      &.pending { background: rgba(255, 169, 64, 0.15); color: #FFA940; }
    }
    .tombstone-tag { font-size: 18rpx; padding: 2rpx 10rpx; border-radius: 6rpx; background: rgba(255, 77, 79, 0.1); color: #FF4D4F; }
  }
}

.vc-card {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #1A3350;

  .vc-row {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
    padding: 12rpx 0;
    border-bottom: 1px solid #1A3350;
    &:last-child { border: none; }
    .vc-label { font-size: 22rpx; color: #7AA8CC; width: 120rpx; flex-shrink: 0; }
    .vc-value { font-size: 22rpx; color: #E8F4FF; word-break: break-all; &.mono { font-family: monospace; } }
    .vc-history { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
    .vc-history-item { display: flex; justify-content: space-between; gap: 16rpx;
      .device-id { font-size: 20rpx; color: #7AA8CC; font-family: monospace; }
      .device-clock { font-size: 20rpx; color: #00D4FF; font-weight: 600; }
    }
  }
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.conflict-item {
  background: #0C1B2A;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  border: 1px solid #1A3350;

  &.LOCAL_WINS { border-color: rgba(82, 196, 26, 0.3); }
  &.REMOTE_WINS { border-color: rgba(0, 212, 255, 0.3); }

  .conflict-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8rpx;
    .conflict-type-badge { font-size: 22rpx; padding: 4rpx 12rpx; background: rgba(255, 169, 64, 0.15); color: #FFA940; border-radius: 6rpx; }
    .conflict-resolved { font-size: 20rpx; padding: 4rpx 12rpx; background: rgba(82, 196, 26, 0.15); color: #52C41A; border-radius: 6rpx; }
  }
  .conflict-detail { font-size: 24rpx; color: #E8F4FF; display: block; margin-bottom: 4rpx; }
  .conflict-time { font-size: 20rpx; color: #4A6A8A; }
}

.storage-grid {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.storage-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #1A3350;

  .storage-icon { font-size: 36rpx; }
  .storage-info { flex: 1; .storage-name { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; } .storage-count { font-size: 22rpx; color: #7AA8CC; } }
  .storage-actions { display: flex; gap: 16rpx;
    .action-text { font-size: 24rpx; color: #00D4FF; &.danger { color: #FF4D4F; } }
  }
}

.danger-zone {
  background: rgba(255, 77, 79, 0.05);
  border: 1px solid rgba(255, 77, 79, 0.2);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-top: 20rpx;

  .danger-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    padding: 16rpx;
    background: rgba(255, 77, 79, 0.1);
    border: 1px solid rgba(255, 77, 79, 0.3);
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #FF4D4F;
    margin-bottom: 12rpx;
    &:active { background: rgba(255, 77, 79, 0.2); }
    .btn-icon { font-size: 28rpx; }
  }

  .danger-hint { font-size: 20rpx; color: #7AA8CC; text-align: center; display: block; }
}

.log-section { padding-bottom: 40rpx; }

.log-filter {
  display: flex;
  gap: 8rpx;
  .log-level-tag {
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    background: #1A3350;
    font-size: 20rpx;
    color: #7AA8CC;
    &.active { background: rgba(0, 212, 255, 0.15); color: #00D4FF; }
  }
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 16rpx;
  border: 1px solid #1A3350;
  max-height: 400rpx;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 10rpx 0;
  border-bottom: 1px solid #1A3350;
  &:last-child { border: none; }

  .log-time { font-size: 20rpx; color: #4A6A8A; width: 80rpx; flex-shrink: 0; font-family: monospace; }
  .log-level { font-size: 20rpx; width: 60rpx; flex-shrink: 0; font-weight: 600; }
  .log-message { font-size: 22rpx; color: #E8F4FF; flex: 1; }

  &.level-INFO { .log-level { color: #00D4FF; } }
  &.level-WARN { .log-level { color: #FFA940; } }
  &.level-ERROR { .log-level { color: #FF4D4F; } }
}

.load-more {
  text-align: center;
  padding: 16rpx;
  font-size: 24rpx;
  color: #00D4FF;
}
</style>
