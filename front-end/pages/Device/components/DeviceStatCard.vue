<template>
	<view class="device-stat-card" :class="'status-' + device.status" @tap="handleTap">
		<view class="device-icon-wrapper" :class="device.type">
			<image class="device-icon" :src="getDeviceIcon(device.type)" mode="aspectFit"></image>
			<view class="status-dot" :class="device.status"></view>
		</view>
		<view class="device-info">
			<text class="device-name">{{ device.name }}</text>
			<text class="device-id">{{ device.id }}</text>
			<text class="last-active">{{ formatTime(device.lastActive) }}</text>
		</view>
		<view class="device-stats">
			<view class="stat-item">
				<image class="stat-icon" src="/static/icons/battery-2.png" mode="aspectFit"></image>
				<text class="stat-value" :style="{ color: getBatteryColor(device.battery) }">{{ device.battery }}%</text>
			</view>
			<view class="stat-item">
				<image class="stat-icon" src="/static/icons/gps.png" mode="aspectFit"></image>
				<text class="stat-value" :style="{ color: getSignalColor(device.signal) }">{{ device.signal }}%</text>
			</view>
		</view>
		<view v-if="device.battery < 20 || device.status === 'offline'" class="check-suggestion">
			<text class="suggestion-text">建议顺路检查</text>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({ device: { type: Object, required: true } })
const emit = defineEmits(['tap'])
function getDeviceIcon(type) {
	return { 'camera-visible': '/static/icons/camera-visible.png', 'camera-infrared': '/static/icons/camera-infrared.png', 'fiber': '/static/icons/fiber.png', 'smell': '/static/icons/smell.png' }[type] || '/static/icons/camera-visible.png'
}
function getBatteryColor(b) { return b > 50 ? '#73D13D' : b > 20 ? '#FFA940' : '#FF4D4F' }
function getSignalColor(s) { return s > 70 ? '#73D13D' : s > 40 ? '#FFA940' : '#FF4D4F' }
function formatTime(time) {
	const diff = Math.floor((Date.now() - time) / 1000)
	if (diff < 60) return '刚刚'
	if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
	if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
	return Math.floor(diff / 86400) + '天前'
}
function handleTap() { emit('tap') }
</script>

<style lang="scss" scoped>
.device-stat-card { position: relative; background: rgba(26,31,46,0.95); border-radius: 20rpx; border: 1px solid rgba(255,255,255,0.05); padding: 24rpx; display: flex; align-items: center; gap: 20rpx; margin-bottom: 16rpx; }
.device-stat-card.status-warning { border-color: rgba(255,169,64,0.3); }
.device-stat-card.status-offline { opacity: 0.6; }
.device-icon-wrapper { position: relative; width: 80rpx; height: 80rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.device-icon-wrapper.camera-visible { background: linear-gradient(135deg, #00A8D6 0%, #007EA8 100%); }
.device-icon-wrapper.camera-infrared { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.device-icon-wrapper.fiber { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.device-icon-wrapper.smell { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.device-icon { width: 48rpx; height: 48rpx; }
.status-dot { position: absolute; top: -4rpx; right: -4rpx; width: 20rpx; height: 20rpx; border-radius: 50%; border: 2px solid var(--bg-root); }
.status-dot.online { background: #73D13D; box-shadow: 0 0 10rpx #73D13D; }
.status-dot.warning { background: #FFA940; box-shadow: 0 0 10rpx #FFA940; }
.status-dot.offline { background: #595959; }
.device-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.device-name { font-size: 28rpx; font-weight: 600; color: #ffffff; }
.device-id { font-size: 22rpx; color: #8c8c8c; font-family: Courier New, monospace; }
.last-active { font-size: 20rpx; color: #595959; }
.device-stats { display: flex; flex-direction: column; gap: 12rpx; }
.stat-item { display: flex; align-items: center; gap: 8rpx; }
.stat-icon { width: 24rpx; height: 24rpx; }
.stat-value { font-size: 24rpx; font-weight: 700; font-family: Courier New, monospace; }
.check-suggestion { position: absolute; top: -12rpx; right: 24rpx; padding: 8rpx 16rpx; background: linear-gradient(135deg, #FF4D4F 0%, #cf1322 100%); border-radius: 20rpx; }
.suggestion-text { font-size: 20rpx; font-weight: 600; color: #ffffff; white-space: nowrap; }
</style>
