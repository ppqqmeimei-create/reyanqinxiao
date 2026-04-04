<template>
	<view class="fooddrug-list">
		<view
			v-for="alert in alerts"
			:key="alert.id"
			class="fooddrug-card"
			@tap="$emit('alertClick', alert)"
		>
			<!-- 卡片头部 -->
			<view class="card-header">
				<view class="card-title-group">
					<text class="card-type-badge" :class="`type-${alert.alert_type}`">
						{{ getTypeLabel(alert.alert_type) }}
					</text>
					<text class="card-product-name">{{ alert.product_name }}</text>
				</view>
				<text class="card-risk-badge" :class="`risk-${alert.risk_level}`">
					{{ getRiskLabel(alert.risk_level) }}
				</text>
			</view>

			<!-- 卡片内容 -->
			<view class="card-content">
				<view class="content-row">
					<text class="content-label">生产厂家</text>
					<text class="content-value">{{ alert.manufacturer }}</text>
				</view>
				<view class="content-row">
					<text class="content-label">产品批次</text>
					<text class="content-value">{{ alert.product_batch }}</text>
				</view>
				<view class="content-row">
					<text class="content-label">受影响消费者</text>
					<text class="content-value">{{ alert.affected_consumers }}人</text>
				</view>
				<view class="content-row">
					<text class="content-label">召回状态</text>
					<text class="content-value" :class="`recall-${alert.recall_status}`">
						{{ getRecallLabel(alert.recall_status) }}
					</text>
				</view>
			</view>

			<!-- 卡片底部 -->
			<view class="card-footer">
				<view class="footer-left">
					<text class="alert-code">{{ alert.alert_code }}</text>
					<text class="alert-time">{{ formatTime(alert.create_time) }}</text>
				</view>
				<view class="footer-right">
					<view class="action-btn" @tap.stop="$emit('handleAlert', { type: 'view', alert })">
						<text class="action-icon">👁️</text>
						<text class="action-text">查看</text>
					</view>
					<view class="action-btn" @tap.stop="$emit('handleAlert', { type: 'handle', alert })">
						<text class="action-icon">✓</text>
						<text class="action-text">处理</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
defineProps({
	alerts: { type: Array, required: true }
})

defineEmits(['alertClick', 'handleAlert'])

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

function formatTime(time) {
	const date = new Date(time)
	const now = new Date()
	const diff = now - date
	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(diff / (1000 * 60 * 60 * 24))

	if (hours < 1) return '刚刚'
	if (hours < 24) return `${hours}小时前`
	if (days < 7) return `${days}天前`
	return date.toLocaleDateString()
}
</script>

<style lang="scss" scoped>
.fooddrug-list {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.fooddrug-card {
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid var(--line-soft);
	border-radius: 12rpx;
	padding: 16rpx;
	transition: all 0.3s ease;

	&:active {
		background: rgba(0, 212, 255, 0.1);
		border-color: rgba(0, 212, 255, 0.3);
		transform: scale(0.98);
	}
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}

.card-title-group {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex: 1;
}

.card-type-badge {
	font-size: 18rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	font-weight: 600;
	white-space: nowrap;

	&.type-food { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
	&.type-drug { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
	&.type-cosmetic { background: rgba(233, 30, 99, 0.2); color: #e91e63; }
}

.card-product-name {
	font-size: 24rpx;
	font-weight: 600;
	color: #fff;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.card-risk-badge {
	font-size: 18rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	font-weight: 600;
	white-space: nowrap;

	&.risk-critical { background: rgba(255, 77, 79, 0.2); color: #ff4d4f; }
	&.risk-warning { background: rgba(255, 165, 0, 0.2); color: #ffa500; }
	&.risk-medium { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
	&.risk-low { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
}

.card-content {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	margin-bottom: 12rpx;
	padding: 12rpx 0;
	border-top: 1px solid rgba(255, 255, 255, 0.05);
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.content-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 20rpx;
}

.content-label {
	color: #8c8c8c;
}

.content-value {
	color: #fff;
	font-weight: 500;

	&.recall-full-recall { color: #ff4d4f; }
	&.recall-partial-recall { color: #ffa940; }
	&.recall-not-recalled { color: #8c8c8c; }
}

.card-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.footer-left {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.alert-code {
	font-size: 18rpx;
	color: #00d4ff;
	font-family: 'Courier New', monospace;
	font-weight: 600;
}

.alert-time {
	font-size: 16rpx;
	color: #8c8c8c;
}

.footer-right {
	display: flex;
	gap: 8rpx;
}

.action-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
	padding: 8rpx 12rpx;
	background: rgba(0, 212, 255, 0.1);
	border: 1px solid rgba(0, 212, 255, 0.3);
	border-radius: 8rpx;
	transition: all 0.2s ease;

	&:active {
		background: rgba(0, 212, 255, 0.2);
		border-color: rgba(0, 212, 255, 0.5);
	}
}

.action-icon {
	font-size: 20rpx;
}

.action-text {
	font-size: 16rpx;
	color: #00d4ff;
}
</style>
