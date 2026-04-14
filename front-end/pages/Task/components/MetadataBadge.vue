<template>
	<view class="metadata-badge">
		<view class="metadata-card">
			<view class="metadata-item">
				<image class="meta-icon" src="/static/icons/gps.png" mode="aspectFit"></image>
				<text class="meta-value">{{ formatTimestamp(timestamp) }}</text>
			</view>
			<view class="metadata-item">
				<image class="meta-icon" src="/static/icons/location.png" mode="aspectFit"></image>
				<text class="meta-value">{{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}</text>
			</view>
			<view class="metadata-item" v-if="sensorData.altitude">
				<image class="meta-icon" src="/static/icons/task-meta-altitude.png" mode="aspectFit"></image>
				<text class="meta-value">{{ sensorData.altitude }}m</text>
			</view>
			<view class="sensor-summary">
				<view class="summary-item" v-if="sensorData.smell">
					<text class="summary-label">气味</text>
					<text class="summary-value" :class="smellLevelClass">{{ sensorData.smell }}%</text>
				</view>
				<view class="summary-item" v-if="sensorData.vibration">
					<text class="summary-label">震动</text>
					<text class="summary-value" :class="vibrationLevelClass">{{ sensorData.vibration }}</text>
				</view>
				<view class="summary-item" v-if="sensorData.infrared">
					<text class="summary-label">红外</text>
					<text class="summary-value" :class="infraredLevelClass">{{ sensorData.infrared }}°C</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
	location: { type: Object, required: true },
	sensorData: { type: Object, required: true },
	timestamp: { type: Number, required: true }
})
const smellLevelClass = computed(() => {
	const v = props.sensorData.smell
	if (!v) return ''
	return v >= 80 ? 'critical' : v >= 50 ? 'warning' : 'normal'
})
const vibrationLevelClass = computed(() => {
	const v = props.sensorData.vibration
	if (!v) return ''
	return v >= 150 ? 'critical' : v >= 100 ? 'warning' : 'normal'
})
const infraredLevelClass = computed(() => {
	const v = props.sensorData.infrared
	if (!v) return ''
	return (v >= 35 && v <= 38) ? 'critical' : v >= 30 ? 'warning' : 'normal'
})
function formatTimestamp(ts) {
	const d = new Date(ts)
	return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0')
}
</script>

<style lang="scss" scoped>
.metadata-badge { position: fixed; top: calc(env(safe-area-inset-top) + 120rpx); left: 32rpx; z-index: 150; pointer-events: none; }
.metadata-card { background: rgba(0,0,0,0.85); border-radius: 20rpx; padding: 20rpx 24rpx; border: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 12rpx; max-width: 500rpx; }
.metadata-item { display: flex; align-items: center; gap: 12rpx; }
.meta-icon { width: 28rpx; height: 28rpx; flex-shrink: 0; }
.meta-value { font-size: 22rpx; font-family: Courier New, monospace; color: rgba(255,255,255,0.9); line-height: 1.4; }
.sensor-summary { display: flex; gap: 16rpx; margin-top: 8rpx; padding-top: 12rpx; border-top: 1px solid var(--line-soft); }
.summary-item { display: flex; flex-direction: column; gap: 4rpx; flex: 1; }
.summary-label { font-size: 18rpx; color: rgba(255,255,255,0.5); }
.summary-value { font-size: 24rpx; font-weight: 700; font-family: Courier New, monospace; }
.summary-value.critical { color: #FF4D4F; text-shadow: 0 0 10rpx #FF4D4F; }
.summary-value.warning { color: #FFA940; text-shadow: 0 0 10rpx #FFA940; }
.summary-value.normal { color: #73D13D; }
</style>
