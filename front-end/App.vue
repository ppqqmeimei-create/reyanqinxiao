<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useRealtimeStore } from './stores/realtime'
import { useUserStore } from './stores/user'
import { initSyncEngine, startSync, getSyncStatus } from './utils/syncEngine'
import { getPendingCount } from './utils/evidenceStorage'
import { getOfflineQueueStats } from './utils/offlineQueue'

onLaunch(() => {
	console.log('[App] 热眼擒枭系统启动 v2.0.0')

	// 初始化取证同步引擎
	initSyncEngine()

	// 监听网络状态变化
	uni.onNetworkStatusChange(async (res) => {
		uni.setStorageSync('network_type', res.networkType)
		if (res.isConnected) {
			// 网络恢复时检查待同步数据
			const pendingEvidence = getPendingCount()
			const offlineQueues = getOfflineQueueStats()
			if (pendingEvidence > 0) {
				uni.showToast({ title: `发现${pendingEvidence}条待同步取证`, icon: 'none' })
				await startSync()
				uni.showToast({ title: `已补传证据`, icon: 'success' })
			}
			if (offlineQueues.total > 0) {
				uni.showToast({ title: `离线队列: ${offlineQueues.total}条`, icon: 'none' })
			}
		}
	})

	// 初始化网络状态
	uni.getNetworkType({
		success: async (res) => {
			uni.setStorageSync('network_type', res.networkType)
			if (res.networkType !== 'none' && getPendingCount() > 0) {
				await startSync()
			}
		}
	})

	// 监听同步进度事件
	uni.$on('sync-progress', (data) => {
		console.log('[App] 同步进度:', data)
		if (data.status === 'done') {
			uni.showToast({ title: '证据同步完成', icon: 'success' })
		} else if (data.status === 'error') {
			uni.showToast({ title: data.error || '同步失败', icon: 'none' })
		}
	})
})

onShow(() => {
	const userStore = useUserStore()
	const realtimeStore = useRealtimeStore()
	if (userStore.token) {
		realtimeStore.connectWs()
	}
})

onHide(() => {
	const realtimeStore = useRealtimeStore()
	realtimeStore.disconnectWs()
})
</script>

<style>
:root,
page {
	--bg-root: #060A14;
	--bg-card: #0C1B2A;
	--bg-card-soft: rgba(12, 27, 42, 0.82);
	--line-soft: rgba(0, 212, 255, 0.22);
	--line-strong: rgba(0, 212, 255, 0.36);
	--brand-primary: #00D4FF;
	--text-main: #EAF6FF;
	--text-sub: #8CA3B8;
	--shadow-card: 0 14rpx 34rpx rgba(0, 0, 0, 0.45);
	--radius-card: 24rpx;
	/* 预警等级颜色 */
	--alert-critical: #FF4D4F;
	--alert-warning: #FFA940;
	--alert-info: #722ED1;
	/* 任务状态颜色 */
	--task-pending: #8CA3B8;
	--task-progress: #00D4FF;
	--task-completed: #73D13D;
	--task-cancelled: #8CA3B8;
	/* 设备状态颜色 */
	--device-online: #73D13D;
	--device-warning: #FFA940;
	--device-offline: #8CA3B8;
}

page {
	background-color: var(--bg-root);
	color: var(--text-main);
	font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

view,
text,
scroll-view,
button {
	box-sizing: border-box;
}

/* 通用卡片样式 */
.data-card {
	background: var(--bg-card-soft);
	backdrop-filter: blur(12px);
	border-radius: var(--radius-card);
	border: 1px solid var(--line-soft);
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: var(--shadow-card);
}

/* 卡片标题 */
.card-title {
	font-size: 30rpx;
	font-weight: 700;
	color: var(--brand-primary);
	letter-spacing: 1rpx;
	margin-bottom: 24rpx;
	display: flex;
	align-items: center;
	gap: 12rpx;
}

/* 危险按钮 */
.danger-button {
	width: 100%;
	height: 96rpx;
	background: rgba(255, 77, 79, 0.14);
	border: 1px solid rgba(255, 77, 79, 0.5);
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	font-size: 32rpx;
	font-weight: 600;
	color: var(--alert-critical);
}

/* 分割线 */
.inset-divider {
	height: 1px;
	background: var(--line-soft);
	margin: 24rpx 0;
}

/* 物理开关样式 */
.physical-switch {
	width: 100rpx;
	height: 56rpx;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 28rpx;
	padding: 6rpx;
	display: flex;
	align-items: center;
}

.physical-switch.active {
	background: var(--line-soft);
	border: 1px solid var(--line-strong);
}

.switch-slider {
	width: 44rpx;
	height: 44rpx;
	border-radius: 22rpx;
	background: #5A7288;
}

.physical-switch.active .switch-slider {
	transform: translateX(44rpx);
	background: var(--brand-primary);
}

/* 文本省略 */
.ellipsis {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.monospace-text {
	font-family: 'Consolas', 'Courier New', monospace;
}

/* 预警标签 */
.alert-tag {
	padding: 6rpx 16rpx;
	border-radius: 8rpx;
	font-size: 22rpx;
	font-weight: 600;
}

.alert-tag.critical {
	background: rgba(255, 77, 79, 0.2);
	color: var(--alert-critical);
	border: 1px solid rgba(255, 77, 79, 0.4);
}

.alert-tag.warning {
	background: rgba(255, 169, 64, 0.2);
	color: var(--alert-warning);
	border: 1px solid rgba(255, 169, 64, 0.4);
}

.alert-tag.info {
	background: rgba(114, 46, 209, 0.2);
	color: var(--alert-info);
	border: 1px solid rgba(114, 46, 209, 0.4);
}

/* 设备状态标签 */
.device-status {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 6rpx 16rpx;
	border-radius: 16rpx;
	font-size: 20rpx;
	font-weight: 600;
}

.device-status.online {
	background: rgba(115, 209, 61, 0.2);
	color: var(--device-online);
	border: 1px solid var(--device-online);
}

.device-status.warning {
	background: rgba(255, 169, 64, 0.2);
	color: var(--device-warning);
	border: 1px solid var(--device-warning);
}

.device-status.offline {
	background: rgba(140, 140, 140, 0.2);
	color: var(--device-offline);
	border: 1px solid var(--device-offline);
}

/* 任务状态标签 */
.task-status {
	display: inline-block;
	padding: 4rpx 12rpx;
	border-radius: 6rpx;
	font-size: 20rpx;
	font-weight: 600;
}

.task-status.pending {
	background: rgba(140, 163, 184, 0.2);
	color: var(--task-pending);
}

.task-status.in-progress, .task-status.progress {
	background: rgba(0, 212, 255, 0.2);
	color: var(--task-progress);
}

.task-status.completed {
	background: rgba(115, 209, 61, 0.2);
	color: var(--task-completed);
}

.task-status.cancelled {
	background: rgba(140, 163, 184, 0.2);
	color: var(--task-cancelled);
}

/* 按钮样式 */
.btn-primary {
	background: linear-gradient(135deg, #00D4FF, #0080B3);
	color: #060A14;
	font-weight: 700;
	border: none;
	border-radius: 52rpx;
}

.btn-danger {
	background: linear-gradient(135deg, #FF4D4F, #B91C1C);
	color: #fff;
	font-weight: 700;
	border: none;
	border-radius: 52rpx;
}

.btn-secondary {
	background: rgba(255, 255, 255, 0.08);
	color: var(--text-main);
	border: 1px solid rgba(255, 255, 255, 0.15);
	border-radius: 52rpx;
}

/* 加载动画 */
.spinner {
	width: 44rpx;
	height: 44rpx;
	border: 4rpx solid rgba(6, 10, 20, 0.2);
	border-top-color: var(--brand-primary);
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

/* 脉冲动画 */
.pulse-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: var(--brand-primary);
	animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
		box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.7);
	}
	50% {
		opacity: 0.8;
		box-shadow: 0 0 0 8rpx rgba(0, 212, 255, 0);
	}
}

/* 响应式 */
@media (min-width: 1024px) {
	page {
		max-width: 1680rpx;
		margin: 0 auto;
	}
}
</style>
