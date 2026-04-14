<template>
	<view class="sync-manager">
		<view class="sync-status-bar" :class="syncStatus">
			<!-- 脉冲光环 -->
			<view class="sync-pulse-ring" :class="syncStatus"></view>
			<view class="status-icon-wrapper">
				<view v-if="syncStatus === 'syncing'" class="loading-spinner"></view>
				<text v-else-if="syncStatus === 'synced'" class="status-emoji">✓</text>
				<text v-else class="status-emoji">✗</text>
			</view>
			<view class="status-content">
				<text class="status-title">{{ statusTitle }}</text>
				<text class="status-detail">{{ statusDetail }}</text>
			</view>
			<view v-if="syncStatus === 'syncing'" class="sync-progress-bar">
				<view class="progress-fill" :style="{ width: syncProgress + '%' }"></view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
	syncStatus: { type: String, default: 'synced' },
	syncProgress: { type: Number, default: 0 }
})
const statusTitle = computed(() => ({ synced: '数据已同步', syncing: '正在同步', offline: '离线模式' }[props.syncStatus] || '未知状态'))
const statusDetail = computed(() => {
	if (props.syncStatus === 'syncing') return '正在同步：3条取证视频 (' + props.syncProgress + '%)'
	if (props.syncStatus === 'offline') return '待同步：5条证据已加密保存'
	return '所有数据已安全上传'
})
</script>

<style lang="scss" scoped>
.sync-manager { margin-top: 16rpx }
.sync-status-bar { position: relative; background: rgba(42,47,62,.6); border-radius: 20rpx; padding: 20rpx 24rpx; border: 1px solid rgba(255,255,255,.06); display: flex; align-items: center; gap: 16rpx; overflow: hidden;
	&.synced { border-color: rgba(115,209,61,.3); box-shadow: 0 0 20rpx rgba(115,209,61,.08) }
	&.syncing { border-color: rgba(255,169,64,.3); box-shadow: 0 0 20rpx rgba(255,169,64,.08) }
	&.offline { border-color: rgba(255,77,79,.3); box-shadow: 0 0 20rpx rgba(255,77,79,.08) }
}
.sync-pulse-ring { position: absolute; top: 50%; left: 24rpx; transform: translateY(-50%); width: 40rpx; height: 40rpx; border-radius: 50%; opacity: 0;
	&.synced { animation: pulseGreen 2s ease-in-out infinite }
	&.syncing { animation: pulseOrange 1.5s ease-in-out infinite }
	&.offline {}
}
@keyframes pulseGreen { 0%,100%{box-shadow:0 0 0 0 rgba(115,209,61,.5)} 50%{box-shadow:0 0 0 16rpx rgba(115,209,61,0)} }
@keyframes pulseOrange { 0%,100%{box-shadow:0 0 0 0 rgba(255,169,64,.5)} 50%{box-shadow:0 0 0 16rpx rgba(255,169,64,0)} }
.status-icon-wrapper { width: 48rpx; height: 48rpx; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.status-emoji { font-size: 36rpx; color: #ffffff }
.loading-spinner { width: 40rpx; height: 40rpx; border: 4px solid rgba(255,169,64,.3); border-top-color: #FFA940; border-radius: 50%; animation: spin 1s linear infinite }
@keyframes spin { to { transform: rotate(360deg) } }
.status-content { flex: 1; display: flex; flex-direction: column; gap: 6rpx }
.status-title { font-size: 28rpx; font-weight: 600; color: #ffffff }
.status-detail { font-size: 22rpx; color: #8c8c8c }
.sync-progress-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 4rpx; background: rgba(255,255,255,.1) }
.progress-fill { height: 100%; background: linear-gradient(90deg, #FFA940 0%, #ffc069 100%); transition: width .3s ease }
</style>
