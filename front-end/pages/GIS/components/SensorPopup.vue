<template>
	<view v-if="visible" class="sensor-popup-mask" :style="{ zIndex: 500 }" @tap="handleClose">
		<view class="sensor-popup-content" @tap.stop>
			<view class="close-btn" @tap="handleClose"><text class="close-text">✕</text></view>
			<view class="sensor-header">
				<view class="sensor-icon-wrapper" :class="'type-' + sensorData.type">
					<image class="sensor-icon-large" :src="getSensorIcon(sensorData.type)" mode="aspectFit"></image>
				</view>
				<view class="sensor-title-group">
					<text class="sensor-name">{{ getSensorName(sensorData.type) }}</text>
					<view class="sensor-status-badge" :class="sensorData.status">
						<view class="status-dot" :class="sensorData.status"></view>
						<text class="status-text">{{ getStatusText(sensorData.status) }}</text>
					</view>
				</view>
			</view>
			<view class="data-grid">
				<view class="data-card">
					<view class="card-content">
						<text class="card-label">电量</text>
						<text class="card-value" :style="{ color: getBatteryColor(sensorData.battery) }">{{ sensorData.battery }}%</text>
					</view>
					<view class="card-progress">
						<view class="progress-bar" :style="{ width: sensorData.battery + '%', background: getBatteryColor(sensorData.battery) }"></view>
					</view>
				</view>
				<view class="data-card">
					<view class="card-content">
						<text class="card-label">信号</text>
						<text class="card-value">{{ sensorData.signalStrength }}%</text>
					</view>
				</view>
			</view>
			<view class="environment-section">
				<text class="section-title">环境数据</text>
				<view class="env-grid">
					<view class="env-item"><text class="env-label">温度</text><text class="env-value">{{ sensorData.temperature }}°C</text></view>
					<view class="env-item"><text class="env-label">湿度</text><text class="env-value">{{ sensorData.humidity }}%</text></view>
				</view>
			</view>
			<view class="action-buttons">
				<view class="action-btn secondary" @tap="handleViewHistory"><text class="btn-text">查看历史</text></view>
				<view class="action-btn primary" @tap="handleDiagnose"><text class="btn-text">设备诊断</text></view>
			</view>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({
	visible: { type: Boolean, default: false },
	sensorData: {
		type: Object,
		default: () => ({ type: 'camera-visible', status: 'online', battery: 85, signalStrength: 92, temperature: 25, humidity: 65 })
	}
})
const emit = defineEmits(['close'])
function handleClose() { emit('close') }
function getSensorIcon(type) {
	const m = { 'camera-visible': '/static/icons/camera-visible.png', 'camera-infrared': '/static/icons/camera-infrared.png', 'fiber': '/static/icons/fiber.png', 'smell': '/static/icons/smell.png' }
	return m[type] || '/static/icons/camera-visible.png'
}
function getSensorName(type) {
	const m = { 'camera-visible': '可见光摄像头', 'camera-infrared': '红外热像仪', 'fiber': '震动光纤传感器', 'smell': '气味探测器' }
	return m[type] || '未知传感器'
}
function getStatusText(status) {
	return { online: '在线', warning: '异常', offline: '离线' }[status] || '未知'
}
function getBatteryColor(battery) {
	if (battery > 50) return '#73D13D'
	if (battery > 20) return '#FFA940'
	return '#FF4D4F'
}
function handleViewHistory() { uni.showToast({ title: '查看历史记录', icon: 'none' }); uni.vibrateShort() }
function handleDiagnose() { uni.showToast({ title: '启动设备诊断', icon: 'none' }); uni.vibrateShort() }
</script>

<style lang="scss" scoped>
.sensor-popup-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; padding: 48rpx; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.sensor-popup-content { width: 100%; max-width: 640rpx; background: rgba(12,27,42,0.96); border-radius: 32rpx; border: 1px solid var(--line-soft); padding: 48rpx; box-shadow: 0 24rpx 64rpx rgba(0,0,0,0.6); animation: slideUp 0.3s ease; position: relative; }
@keyframes slideUp { from { transform: translateY(100rpx); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.close-btn { position: absolute; top: 24rpx; right: 24rpx; width: 56rpx; height: 56rpx; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
.close-text { font-size: 28rpx; color: #ffffff; }
.sensor-header { display: flex; align-items: center; gap: 24rpx; margin-bottom: 40rpx; }
.sensor-icon-wrapper { width: 120rpx; height: 120rpx; border-radius: 24rpx; display: flex; align-items: center; justify-content: center; }
.sensor-icon-wrapper.type-camera-visible { background: linear-gradient(135deg, #00A8D6 0%, #007EA8 100%); }
.sensor-icon-wrapper.type-camera-infrared { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.sensor-icon-wrapper.type-fiber { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.sensor-icon-wrapper.type-smell { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.sensor-icon-large { width: 72rpx; height: 72rpx; }
.sensor-title-group { flex: 1; display: flex; flex-direction: column; gap: 12rpx; }
.sensor-name { font-size: 36rpx; font-weight: 700; color: #ffffff; }
.sensor-status-badge { display: inline-flex; align-items: center; gap: 8rpx; padding: 8rpx 16rpx; border-radius: 16rpx; align-self: flex-start; }
.sensor-status-badge.online { background: rgba(115,209,61,0.2); border: 1px solid #73D13D; }
.sensor-status-badge.warning { background: rgba(255,169,64,0.2); border: 1px solid #FFA940; }
.sensor-status-badge.offline { background: rgba(89,89,89,0.2); border: 1px solid #595959; }
.sensor-status-badge.online .status-text { color: #73D13D; }
.sensor-status-badge.warning .status-text { color: #FFA940; }
.sensor-status-badge.offline .status-text { color: #8c8c8c; }
.status-dot { width: 12rpx; height: 12rpx; border-radius: 50%; }
.status-dot.online { background: #73D13D; box-shadow: 0 0 10rpx #73D13D; }
.status-dot.warning { background: #FFA940; box-shadow: 0 0 10rpx #FFA940; }
.status-dot.offline { background: #595959; }
.status-text { font-size: 22rpx; font-weight: 600; }
.data-grid { display: flex; flex-direction: column; gap: 20rpx; margin-bottom: 32rpx; }
.data-card { background: rgba(42,47,62,0.6); border-radius: 20rpx; padding: 24rpx; border: 1px solid rgba(255,255,255,0.05); }
.card-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.card-label { font-size: 24rpx; color: #8c8c8c; }
.card-value { font-size: 40rpx; font-weight: 700; color: #ffffff; }
.card-progress { width: 100%; height: 8rpx; background: rgba(255,255,255,0.1); border-radius: 4rpx; overflow: hidden; }
.progress-bar { height: 100%; border-radius: 4rpx; }
.environment-section { margin-bottom: 32rpx; }
.section-title { font-size: 28rpx; font-weight: 600; color: #ffffff; margin-bottom: 20rpx; display: block; }
.env-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; }
.env-item { background: rgba(42,47,62,0.6); border-radius: 16rpx; padding: 24rpx; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.env-label { font-size: 22rpx; color: #8c8c8c; }
.env-value { font-size: 32rpx; font-weight: 700; color: #ffffff; }
.action-buttons { display: flex; gap: 16rpx; }
.action-btn { flex: 1; height: 88rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx; }
.action-btn.secondary { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); }
.action-btn.primary { background: linear-gradient(135deg, var(--brand-primary) 0%, #00A8D6 100%); box-shadow: 0 8rpx 24rpx rgba(0,212,255,0.3); }
.btn-text { font-size: 28rpx; font-weight: 600; color: #ffffff; }
</style>
