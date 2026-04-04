<template>
	<view class="map-controls" :style="{ zIndex: 100 }">
		<view class="control-btn sos-btn pulse" @longpress="onSOSLongPress" @touchstart="onSOSTouchStart" @touchend="onSOSTouchEnd">
			<image class="btn-icon" src="/static/icons/sos.png" mode="aspectFit"></image>
			<text class="btn-label">SOS</text>
			<view v-if="sosPressed" class="progress-ring">
				<view class="progress-fill"></view>
			</view>
		</view>
		<view class="control-btn" @tap="onLayerChange">
			<image class="btn-icon" :src="currentLayer === 'dark-vector' ? '/static/icons/satellite.png' : '/static/icons/terrain.png'" mode="aspectFit"></image>
			<text class="btn-label">{{ currentLayer === 'dark-vector' ? '卫星' : '地形' }}</text>
		</view>
		<view class="control-btn" @tap="onLocationPress">
			<image class="btn-icon" src="/static/icons/location.png" mode="aspectFit"></image>
			<text class="btn-label">定位</text>
		</view>
		<view class="control-btn" @tap="onMeasurePress">
			<image class="btn-icon" src="/static/icons/ruler.png" mode="aspectFit"></image>
			<text class="btn-label">测距</text>
		</view>
		<view class="control-btn" @tap="onLayerManage">
			<image class="btn-icon" src="/static/icons/layers.png" mode="aspectFit"></image>
			<text class="btn-label">图层</text>
			<view class="badge">3</view>
		</view>
		<view class="zoom-controls">
			<view class="zoom-btn" @tap="onZoomIn"><text class="zoom-icon">+</text></view>
			<view class="zoom-divider"></view>
			<view class="zoom-btn" @tap="onZoomOut"><text class="zoom-icon">−</text></view>
		</view>
	</view>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
	currentLayer: { type: String, default: 'dark-vector' }
})

const emit = defineEmits(['sosPress', 'layerChange', 'locationPress', 'measurePress', 'zoomIn', 'zoomOut', 'layerToggle'])

const sosPressed = ref(false)

// 图层开关状态
const layerStates = reactive({
	sensors: true,
	patrol: true,
	alertZone: true,
	contour: false
})

const layerLabels = {
	sensors: '传感器',
	patrol: '巡逻路线',
	alertZone: '预警区域',
	contour: '地形等高线'
}

function onSOSTouchStart() { sosPressed.value = true; uni.vibrateShort() }
function onSOSTouchEnd() { sosPressed.value = false }
function onSOSLongPress() { sosPressed.value = false; uni.vibrateLong(); emit('sosPress') }
function onLayerChange() {
	const newLayer = props.currentLayer === 'dark-vector' ? 'satellite' : 'dark-vector'
	emit('layerChange', newLayer); uni.vibrateShort()
}
function onLocationPress() { emit('locationPress'); uni.vibrateShort() }
function onMeasurePress() { emit('measurePress'); uni.vibrateShort() }

function onLayerManage() {
	uni.vibrateShort()
	const keys = ['sensors', 'patrol', 'alertZone', 'contour']
	const itemList = keys.map(k => {
		const on = layerStates[k]
		return (on ? '✓ ' : '✗ ') + layerLabels[k] + (on ? '（点击关闭）' : '（点击开启）')
	})
	uni.showActionSheet({
		itemList,
		success: (res) => {
			const key = keys[res.tapIndex]
			layerStates[key] = !layerStates[key]
			const isOn = layerStates[key]
			uni.vibrateShort()
			uni.showToast({
				title: layerLabels[key] + (isOn ? ' 已开启' : ' 已关闭'),
				icon: 'none'
			})
			emit('layerToggle', { layer: key, visible: isOn })
		}
	})
}

function onZoomIn() { emit('zoomIn'); uni.vibrateShort() }
function onZoomOut() { emit('zoomOut'); uni.vibrateShort() }
</script>

<style lang="scss" scoped>
.map-controls { position: fixed; right: 32rpx; top: 200rpx; display: flex; flex-direction: column; gap: 24rpx; z-index: 9999; }
.control-btn { position: relative; width: 112rpx; height: 112rpx; background: rgba(12,27,42,0.90); border-radius: 24rpx; border: 1px solid var(--line-soft); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.4); }
.sos-btn { background: linear-gradient(135deg, #FF4D4F 0%, #cf1322 100%); border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 8rpx 32rpx rgba(255,77,79,0.6); }
.btn-icon { width: 48rpx; height: 48rpx; }
.btn-label { font-size: 20rpx; font-weight: 600; color: #ffffff; }
.progress-ring { position: absolute; top: -4rpx; left: -4rpx; right: -4rpx; bottom: -4rpx; border-radius: 24rpx; overflow: hidden; }
.progress-fill { position: absolute; top: 0; left: 0; width: 100%; height: 100%; animation: progressFill 3s linear forwards; }
@keyframes progressFill { 0% { background: conic-gradient(from 0deg, #ffffff 0%, transparent 0%); } 100% { background: conic-gradient(from 0deg, #ffffff 100%, transparent 100%); } }
.pulse { animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 8rpx 32rpx rgba(255,77,79,0.6); } 50% { box-shadow: 0 8rpx 32rpx rgba(255,77,79,0.9), 0 0 0 20rpx rgba(255,77,79,0); } 100% { box-shadow: 0 8rpx 32rpx rgba(255,77,79,0.6); } }
.badge { position: absolute; top: -8rpx; right: -8rpx; min-width: 32rpx; height: 32rpx; padding: 0 8rpx; background: #FF4D4F; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; font-size: 20rpx; font-weight: 700; color: #ffffff; border: 2px solid var(--bg-root); }
.zoom-controls { width: 112rpx; background: rgba(12,27,42,0.90); border-radius: 24rpx; border: 1px solid var(--line-soft); overflow: hidden; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.4); }
.zoom-btn { height: 88rpx; display: flex; align-items: center; justify-content: center; }
.zoom-icon { font-size: 48rpx; font-weight: 300; color: #ffffff; line-height: 1; }
.zoom-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0 16rpx; }
</style>
