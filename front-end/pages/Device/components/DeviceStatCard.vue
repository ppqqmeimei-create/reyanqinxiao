<template>
	<view class="device-stat-card" :class="'status-' + device.status" @tap="handleTap">
		<!-- 顶部状态条动效 -->
		<view class="card-status-bar" :class="device.status"></view>
		<view class="device-icon-wrapper" :class="device.type">
			<view class="icon-glow" :class="device.status"></view>
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
				<view class="battery-bar"><view class="battery-fill" :style="{ width: device.battery + '%', background: getBatteryColor(device.battery) }"></view></view>
			</view>
			<view class="stat-item">
				<image class="stat-icon" src="/static/icons/device-status-signal.png" mode="aspectFit"></image>
				<text class="stat-value" :style="{ color: getSignalColor(device.signal) }">{{ device.signal }}%</text>
				<view class="signal-bars">
					<view class="signal-bar" :class="{ active: device.signal > 0 }"></view>
					<view class="signal-bar" :class="{ active: device.signal > 25 }"></view>
					<view class="signal-bar" :class="{ active: device.signal > 50 }"></view>
					<view class="signal-bar" :class="{ active: device.signal > 75 }"></view>
				</view>
			</view>
		</view>
		<view v-if="device.battery < 20 || device.status === 'offline'" class="check-suggestion">
			<text class="suggestion-text">{{ device.status === 'offline' ? '设备已离线' : '电量不足' }}</text>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({ device: { type: Object, required: true } })
const emit = defineEmits(['tap'])
function getDeviceIcon(type) {
	return {
		'camera-visible':  '/static/icons/device-type-camera-visible.png',
		'camera-infrared': '/static/icons/device-type-camera-infrared.png',
		'fiber':           '/static/icons/device-type-fiber.png',
		'smell':           '/static/icons/device-type-bio-radar.png',
		'drone':           '/static/icons/device-type-drone.png',

	}[type] || '/static/icons/device-default.png'
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
/* ==========================================
   璁惧绫诲瀷娓愬彉鑹?   ========================================== */
@mixin typeGradient($c1, $c2, $glow) {
	background: linear-gradient(135deg, $c1 0%, $c2 100%);
	box-shadow: 0 4rpx 20rpx $glow;
}
.device-stat-card { position: relative; background: rgba(16,22,38,.95); border-radius: 20rpx; border: 1px solid rgba(255,255,255,.06); padding: 24rpx; display: flex; align-items: center; gap: 20rpx; margin-bottom: 16rpx; overflow: hidden; transition: all .25s ease;
	&:active { transform: scale(.98) }
	&.status-warning { border-color: rgba(255,169,64,.25); box-shadow: 0 0 20rpx rgba(255,169,64,.1) }
	&.status-offline { opacity: .55; filter: grayscale(.3) }
}
.card-status-bar {
	position: absolute; top: 0; left: 0; right: 0; height: 4rpx; border-radius: 20rpx 20rpx 0 0;
	&.online { background: linear-gradient(90deg, transparent, #73D13D, transparent); animation: barFlowGreen 2s linear infinite }
	&.warning { background: linear-gradient(90deg, transparent, #FFA940, transparent); animation: barFlowOrange 1.5s linear infinite }
	&.offline { background: rgba(89,89,89,.5) }
}
@keyframes barFlowGreen { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
@keyframes barFlowOrange { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
.device-icon-wrapper { position: relative; width: 80rpx; height: 80rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
	&.camera-visible  { @include typeGradient(#00A8D6, #007EA8, rgba(0,168,214,.4)) }
	&.camera-infrared { @include typeGradient(#f093fb, #f5576c, rgba(240,147,251,.4)) }
	&.fiber           { @include typeGradient(#4facfe, #00f2fe, rgba(79,172,254,.4)) }
	&.smell           { @include typeGradient(#43e97b, #38f9d7, rgba(67,233,123,.4)) }
	&.drone           { @include typeGradient(#667eea, #764ba2, rgba(102,126,234,.4)) }
}
.icon-glow { position: absolute; width: 100%; height: 100%; border-radius: 18rpx; opacity: 0;
	&.online  { animation: iconGlowGreen 2s ease-in-out infinite }
	&.warning { animation: iconGlowOrange 1.5s ease-in-out infinite }
	&.offline {}
}
@keyframes iconGlowGreen { 0%,100%{box-shadow:0 0 0 0 rgba(115,209,61,.5)} 50%{box-shadow:0 0 0 16rpx rgba(115,209,61,0)} }
@keyframes iconGlowOrange { 0%,100%{box-shadow:0 0 0 0 rgba(255,169,64,.5)} 50%{box-shadow:0 0 0 16rpx rgba(255,169,64,0)} }
.device-icon { width: 48rpx; height: 48rpx; }
.status-dot { position: absolute; top: -4rpx; right: -4rpx; width: 20rpx; height: 20rpx; border-radius: 50%; border: 2px solid var(--bg-root);
	&.online { background: #73D13D; box-shadow: 0 0 10rpx #73D13D; animation: dotBlink 2s ease-in-out infinite }
	&.warning { background: #FFA940; box-shadow: 0 0 10rpx #FFA940; animation: dotBlink 1s ease-in-out infinite }
	&.offline { background: #595959 }
}
@keyframes dotBlink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.85)} }
.device-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx }
.device-name { font-size: 28rpx; font-weight: 600; color: #ffffff }
.device-id { font-size: 22rpx; color: #8c8c8c; font-family: Courier New, monospace }
.last-active { font-size: 20rpx; color: #595959 }
.device-stats { display: flex; flex-direction: column; gap: 14rpx }
.stat-item { display: flex; align-items: center; gap: 8rpx }
.stat-icon { width: 24rpx; height: 24rpx }
.stat-value { font-size: 24rpx; font-weight: 700; font-family: Courier New, monospace; min-width: 56rpx }
.battery-bar { width: 60rpx; height: 6rpx; background: rgba(255,255,255,.1); border-radius: 3rpx; overflow: hidden }
.battery-fill { height: 100%; border-radius: 3rpx; transition: width .3s ease }
.signal-bars { display: flex; align-items: flex-end; gap: 3rpx; height: 20rpx }
.signal-bar { width: 6rpx; background: rgba(255,255,255,.12); border-radius: 2rpx; transition: background .3s ease;
	&:nth-child(1){height:25%} &:nth-child(2){height:50%} &:nth-child(3){height:75%} &:nth-child(4){height:100%}
	&.active { background: #73D13D }
}
.check-suggestion { position: absolute; top: -12rpx; right: 24rpx; padding: 8rpx 16rpx; background: linear-gradient(135deg, #FF4D4F 0%, #cf1322 100%); border-radius: 20rpx; box-shadow: 0 4rpx 16rpx rgba(255,77,79,.4) }
.suggestion-text { font-size: 20rpx; font-weight: 600; color: #ffffff; white-space: nowrap }
</style>
