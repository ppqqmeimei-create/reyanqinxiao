<template>
	<view v-if="visible" class="fooddrug-detail-overlay" @tap="$emit('close')">
		<view class="detail-modal" @tap.stop>
			<!-- 关闭按钮 -->
			<view class="modal-close" @tap="$emit('close')">
				<text class="close-icon">✕</text>
			</view>

			<!-- 滚动内容 -->
			<scroll-view scroll-y class="modal-content">
				<!-- 基本信息 -->
				<view class="detail-section">
					<text class="section-title">基本信息</text>
					<view class="info-grid">
						<view class="info-item">
							<text class="info-label">产品名称</text>
							<text class="info-value">{{ alert.product_name }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">产品类型</text>
							<text class="info-value">{{ getTypeLabel(alert.alert_type) }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">生产厂家</text>
							<text class="info-value">{{ alert.manufacturer }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">产品批次</text>
							<text class="info-value">{{ alert.product_batch }}</text>
						</view>
					</view>
				</view>

				<!-- 风险评估 -->
				<view class="detail-section">
					<text class="section-title">风险评估</text>
					<view class="risk-card" :class="`risk-${alert.risk_level}`">
						<view class="risk-header">
							<text class="risk-level">{{ getRiskLabel(alert.risk_level) }}</text>
							<text class="risk-code">{{ alert.alert_code }}</text>
						</view>
						<view class="risk-description">
							<text>{{ alert.risk_description }}</text>
						</view>
						<view class="risk-stats">
							<view class="risk-stat">
								<text class="stat-label">受影响消费者</text>
								<text class="stat-value">{{ alert.affected_consumers }}</text>
							</view>
							<view class="risk-stat">
								<text class="stat-label">风险等级</text>
								<text class="stat-value">{{ getRiskLabel(alert.risk_level) }}</text>
							</view>
						</view>
					</view>
				</view>

				<!-- 处理信息 -->
				<view class="detail-section">
					<text class="section-title">处理信息</text>
					<view class="info-grid">
						<view class="info-item">
							<text class="info-label">处理状态</text>
							<text class="info-value" :class="`status-${alert.status}`">
								{{ getStatusLabel(alert.status) }}
							</text>
						</view>
						<view class="info-item">
							<text class="info-label">召回状态</text>
							<text class="info-value" :class="`recall-${alert.recall_status}`">
								{{ getRecallLabel(alert.recall_status) }}
							</text>
						</view>
						<view class="info-item">
							<text class="info-label">创建时间</text>
							<text class="info-value">{{ formatDateTime(alert.create_time) }}</text>
						</view>
					</view>
				</view>

				<!-- 操作按钮 -->
				<view class="detail-actions">
					<view class="action-button primary" @tap="handleRecall">
						<text class="action-button-text">启动召回</text>
					</view>
					<view class="action-button secondary" @tap="handleHandle">
						<text class="action-button-text">标记处理</text>
					</view>
					<view class="action-button danger" @tap="handleIgnore">
						<text class="action-button-text">忽略</text>
					</view>
				</view>

				<view class="modal-bottom-pad"></view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup>
defineProps({
	visible: { type: Boolean, default: false },
	alert: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'handle'])

function getTypeLabel(type) {
	const map = { food: '食品', drug: '药品', cosmetic: '化妆品' }
	return map[type] || '未知'
}

function getRiskLabel(level) {
	const map = { critical: '严重风险', warning: '高风险', medium: '中风险', low: '低风险' }
	return map[level] || '未知'
}

function getRecallLabel(status) {
	const map = { 'not-recalled': '未召回', 'partial-recall': '部分召回', 'full-recall': '全部召回' }
	return map[status] || '未知'
}

function getStatusLabel(status) {
	const map = { pending: '待处理', investigating: '处理中', resolved: '已解决' }
	return map[status] || '未知'
}

function formatDateTime(time) {
	const date = new Date(time)
	return date.toLocaleString('zh-CN')
}

function handleRecall() {
	uni.showModal({
		title: '启动召回',
		content: `确认对产品"${alert.product_name}"启动召回流程？`,
		confirmText: '确认',
		cancelText: '取消',
		success: (res) => {
			if (res.confirm) {
				emit('handle', { type: 'recall', alert })
				uni.showToast({ title: '已启动召回流程', icon: 'success' })
				emit('close')
			}
		}
	})
}

function handleHandle() {
	uni.showModal({
		title: '标记处理',
		content: `确认标记产品"${alert.product_name}"为处理中？`,
		confirmText: '确认',
		cancelText: '取消',
		success: (res) => {
			if (res.confirm) {
				emit('handle', { type: 'handle', alert })
				uni.showToast({ title: '已标记为处理中', icon: 'success' })
				emit('close')
			}
		}
	})
}

function handleIgnore() {
	uni.showModal({
		title: '忽略预警',
		content: `确认忽略产品"${alert.product_name}"的预警？`,
		confirmText: '确认',
		cancelText: '取消',
		success: (res) => {
			if (res.confirm) {
				emit('handle', { type: 'ignore', alert })
				uni.showToast({ title: '已忽略预警', icon: 'success' })
				emit('close')
			}
		}
	})
}
</script>

<style lang="scss" scoped>
.fooddrug-detail-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: flex-end;
	z-index: 100;
	animation: slideUp 0.3s ease;
}

@keyframes slideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}

.detail-modal {
	width: 100%;
	max-height: 80vh;
	background: linear-gradient(135deg, var(--bg-root) 0%, var(--bg-card) 100%);
	border-radius: 24rpx 24rpx 0 0;
	border: 1px solid rgba(0, 212, 255, 0.1);
	display: flex;
	flex-direction: column;
	position: relative;
}

.modal-close {
	position: absolute;
	top: 16rpx;
	right: 16rpx;
	width: 40rpx;
	height: 40rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
}

.close-icon {
	font-size: 24rpx;
	color: #fff;
}

.modal-content {
	flex: 1;
	padding: 40rpx 24rpx 24rpx;
	overflow-y: auto;
}

.detail-section {
	margin-bottom: 32rpx;
}

.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #fff;
	margin-bottom: 16rpx;
	display: block;
	border-bottom: 2px solid rgba(0, 212, 255, 0.3);
	padding-bottom: 12rpx;
}

.info-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16rpx;
}

.info-item {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	padding: 12rpx;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 8rpx;
	border: 1px solid var(--line-soft);
}

.info-label {
	font-size: 18rpx;
	color: #8c8c8c;
}

.info-value {
	font-size: 22rpx;
	color: #fff;
	font-weight: 500;

	&.status-pending { color: #ffa940; }
	&.status-investigating { color: #00d4ff; }
	&.status-resolved { color: #73d13d; }

	&.recall-full-recall { color: #ff4d4f; }
	&.recall-partial-recall { color: #ffa940; }
	&.recall-not-recalled { color: #8c8c8c; }
}

.risk-card {
	padding: 20rpx;
	border-radius: 12rpx;
	border: 2px solid;
	background: rgba(255, 255, 255, 0.05);

	&.risk-critical {
		border-color: rgba(255, 77, 79, 0.5);
		background: rgba(255, 77, 79, 0.1);
	}

	&.risk-warning {
		border-color: rgba(255, 165, 0, 0.5);
		background: rgba(255, 165, 0, 0.1);
	}

	&.risk-medium {
		border-color: rgba(255, 193, 7, 0.5);
		background: rgba(255, 193, 7, 0.1);
	}

	&.risk-low {
		border-color: rgba(76, 175, 80, 0.5);
		background: rgba(76, 175, 80, 0.1);
	}
}

.risk-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}

.risk-level {
	font-size: 24rpx;
	font-weight: 600;
	color: #fff;
}

.risk-code {
	font-size: 18rpx;
	color: #00d4ff;
	font-family: 'Courier New', monospace;
}

.risk-description {
	font-size: 20rpx;
	color: #fff;
	margin-bottom: 12rpx;
	line-height: 1.6;
}

.risk-stats {
	display: flex;
	gap: 16rpx;
}

.risk-stat {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.stat-label {
	font-size: 16rpx;
	color: #8c8c8c;
}

.stat-value {
	font-size: 20rpx;
	color: #fff;
	font-weight: 600;
}

.detail-actions {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	margin-top: 24rpx;
}

.action-button {
	padding: 16rpx;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&.primary {
		background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
	}

	&.secondary {
		background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
	}

	&.danger {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(0, 212, 255, 0.16);
	}

	&:active {
		transform: scale(0.98);
		opacity: 0.8;
	}
}

.action-button-text {
	font-size: 22rpx;
	font-weight: 600;
	color: #fff;
}

.modal-bottom-pad {
	height: 40rpx;
}
</style>
