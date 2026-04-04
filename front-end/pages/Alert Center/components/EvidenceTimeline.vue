<template>
	<view class="evidence-timeline">
		<view 
			v-for="(sensor, index) in sensors" 
			:key="index"
			class="timeline-item"
		>
			<!-- 时间轴节点 -->
			<view class="timeline-node">
				<view class="node-dot"></view>
				<view v-if="index < sensors.length - 1" class="node-line"></view>
			</view>
			
			<!-- 证据内容 -->
			<view class="evidence-content">
				<view class="evidence-header">
					<image 
						class="sensor-icon" 
						:src="sensor.icon" 
						mode="aspectFit"
					></image>
					<text class="sensor-name">{{ sensor.name }}</text>
					<text class="sensor-time">{{ formatTime(sensor.time) }}</text>
				</view>
				
				<view class="evidence-body">
					<text class="sensor-value">{{ sensor.value }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'EvidenceTimeline',
	
	props: {
		sensors: {
			type: Array,
			default: () => []
		}
	},
	
	methods: {
		formatTime(time) {
			const date = new Date(time)
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			const seconds = String(date.getSeconds()).padStart(2, '0')
			return `${hours}:${minutes}:${seconds}`
		}
	}
}
</script>

<style lang="scss" scoped>
.evidence-timeline {
	display: flex;
	flex-direction: column;
}

.timeline-item {
	display: flex;
	gap: 24rpx;
	
	&:not(:last-child) {
		margin-bottom: 32rpx;
	}
}

/* 时间轴节点 */
.timeline-node {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 8rpx;
}

.node-dot {
	width: 24rpx;
	height: 24rpx;
	background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
	border-radius: 50%;
	border: 4rpx solid rgba(0, 212, 255, 0.3);
	box-shadow: 0 0 20rpx rgba(0, 212, 255, 0.6);
	z-index: 1;
}

.node-line {
	width: 2rpx;
	flex: 1;
	background: linear-gradient(180deg, 
		rgba(0, 212, 255, 0.5) 0%, 
		rgba(0, 212, 255, 0.1) 100%);
	margin-top: 8rpx;
}

/* 证据内容 */
.evidence-content {
	flex: 1;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid var(--line-soft);
	border-radius: 16rpx;
	padding: 24rpx;
}

.evidence-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.sensor-icon {
	width: 40rpx;
	height: 40rpx;
}

.sensor-name {
	flex: 1;
	font-size: 28rpx;
	font-weight: 600;
	color: #ffffff;
}

.sensor-time {
	font-size: 24rpx;
	color: #8c8c8c;
	font-family: 'Courier New', monospace;
}

.evidence-body {
	padding-left: 52rpx;
}

.sensor-value {
	font-size: 26rpx;
	color: #00d4ff;
	font-weight: 600;
}
</style>
