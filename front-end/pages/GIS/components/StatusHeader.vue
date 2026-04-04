<template>
	<view class="status-header" :style="{ zIndex: 999 }">
		<view class="status-left">
			<view class="status-item">
				<image class="status-icon" src="/static/icons/gps.png" mode="aspectFit"></image>
				<text class="status-text">{{ gpsSignal }}</text>
				<text class="status-unit">星</text>
			</view>
			<view class="status-item">
				<image class="status-icon" :src="batteryIcon" mode="aspectFit"></image>
				<text class="status-text" :style="{ color: batteryColor }">{{ battery }}%</text>
			</view>
		</view>
		<view class="status-center">
			<view v-if="isOffline" class="offline-badge">
				<view class="status-dot offline"></view>
				<text class="offline-text">离线地图 v2.0</text>
			</view>
			<view v-else class="online-badge">
				<view class="status-dot online"></view>
				<text class="online-text">实时同步</text>
			</view>
		</view>
		<view class="status-right">
			<view class="node-status" @tap="showNodeDetails">
				<view class="status-dot" :class="nodeStatus"></view>
				<text class="status-text">{{ nodeStatusText }}</text>
				<image class="arrow-icon" src="/static/icons/arrow-down.png" mode="aspectFit"></image>
			</view>
		</view>
		<view class="time-display">
			<text class="time-text">{{ currentTime }}</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
	gpsSignal: { type: Number, default: 0 },
	battery: { type: Number, default: 100 },
	nodeStatus: { type: String, default: 'online' },
	isOffline: { type: Boolean, default: false }
})

const emit = defineEmits(['nodeDetailsClick'])

const currentTime = ref('')
let timeTimer = null

const batteryIcon = computed(() => {
	if (props.battery > 80) return '/static/icons/battery-3.png'
	if (props.battery > 50) return '/static/icons/battery-2.png'
	if (props.battery > 20) return '/static/icons/battery-1.png'
	return '/static/icons/battery-0.png'
})

const batteryColor = computed(() => {
	if (props.battery > 50) return '#73D13D'
	if (props.battery > 20) return '#FFA940'
	return '#FF4D4F'
})

const nodeStatusText = computed(() => {
	const map = { online: '节点在线', warning: '节点异常', offline: '节点离线' }
	return map[props.nodeStatus] || '未知'
})

function updateTime() {
	const now = new Date()
	const h = String(now.getHours()).padStart(2, '0')
	const m = String(now.getMinutes()).padStart(2, '0')
	const s = String(now.getSeconds()).padStart(2, '0')
	currentTime.value = h + ':' + m + ':' + s
}

function showNodeDetails() {
	emit('nodeDetailsClick')
	uni.vibrateShort()
}

onMounted(() => {
	updateTime()
	timeTimer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
	if (timeTimer) clearInterval(timeTimer)
})
</script>

<style lang="scss" scoped>
.status-header { position: fixed; top: 0; left: 0; right: 0; height: 120rpx; padding: 20rpx 32rpx; padding-top: calc(20rpx + env(safe-area-inset-top)); display: flex; align-items: center; justify-content: space-between; background: rgba(10,14,26,0.95); border-bottom: 1px solid rgba(255,255,255,0.05); box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.3); }
.status-left, .status-right { display: flex; align-items: center; gap: 24rpx; }
.status-item { display: flex; align-items: center; gap: 8rpx; }
.status-icon { width: 32rpx; height: 32rpx; }
.status-text { font-size: 28rpx; font-weight: 600; color: #ffffff; }
.status-unit { font-size: 20rpx; color: #8c8c8c; }
.status-center { flex: 1; display: flex; justify-content: center; }
.offline-badge, .online-badge { display: flex; align-items: center; gap: 8rpx; padding: 8rpx 20rpx; border-radius: 20rpx; background: rgba(26,31,46,0.8); }
.offline-text, .online-text { font-size: 24rpx; font-weight: 500; color: #ffffff; }
.node-status { display: flex; align-items: center; gap: 8rpx; padding: 8rpx 16rpx; border-radius: 20rpx; background: rgba(26,31,46,0.6); }
.arrow-icon { width: 20rpx; height: 20rpx; margin-left: 4rpx; }
.time-display { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
.time-text { font-size: 32rpx; font-weight: 700; color: #ffffff; font-family: Courier New, monospace; }
.status-dot { width: 16rpx; height: 16rpx; border-radius: 50%; display: inline-block; }
.status-dot.online { background: #73D13D; box-shadow: 0 0 10rpx #73D13D; }
.status-dot.warning { background: #FFA940; box-shadow: 0 0 10rpx #FFA940; animation: breathe 2s ease-in-out infinite; }
.status-dot.offline { background: #595959; }
@keyframes breathe { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.2); } }
</style>
