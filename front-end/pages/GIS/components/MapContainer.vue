<template>
	<view class="map-container" :style="{ zIndex: zIndex.map }">
		<map 
			id="gisMap"
			class="map-canvas"
			:latitude="center.latitude"
			:longitude="center.longitude"
			:scale="scale"
			:markers="markers"
			:polyline="polylines"
			:circles="circles"
			:show-location="true"
			:enable-3D="false"
			:enable-overlooking="false"
			:enable-zoom="true"
			:enable-scroll="true"
			:enable-rotate="false"
			@markertap="onMarkerTap"
			@tap="onMapTap"
			@regionchange="onRegionChange"
		>
			<cover-view class="compass-overlay">
				<cover-image class="compass-icon" src="/static/icons/compass.png"></cover-image>
			</cover-view>
		</map>
		
		<view class="shadow-layer" :style="{ zIndex: zIndex.shadow }">
			<view 
				v-for="shadow in shadowPredictions" 
				:key="shadow.id"
				class="shadow-circle"
				:style="{ width: shadow.radius * 2 + 'rpx', height: shadow.radius * 2 + 'rpx', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }"
			>
				<view class="shadow-pulse"></view>
				<view class="shadow-label">{{ shadow.probability }}%</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'

const props = defineProps({
	center: { type: Object, default: () => ({ latitude: 39.9042, longitude: 116.4074 }) },
	markers: { type: Array, default: () => [] },
	polylines: { type: Array, default: () => [] },
	circles: { type: Array, default: () => [] },
	mapStyle: { type: String, default: 'dark-vector' }
})

const emit = defineEmits(['markerTap', 'mapTap', 'regionChange'])

const scale = ref(15)
const mapContext = ref(null)
const zIndex = ref({ map: 1, shadow: 10, markers: 20 })
const shadowPredictions = ref([
	{ id: 's1', latitude: 39.9062, longitude: 116.4094, radius: 150, probability: 85 }
])

onMounted(() => {
	const instance = getCurrentInstance()
	mapContext.value = uni.createMapContext('gisMap', instance.proxy)
})

function onMarkerTap(e) { emit('markerTap', e) }
function onMapTap(e) { emit('mapTap', e) }
function onRegionChange(e) { emit('regionChange', e) }

function moveToLocation(latitude, longitude) {
	mapContext.value.moveToLocation({ latitude, longitude })
}

function takeSnapshot() {
	return new Promise((resolve, reject) => {
		mapContext.value.takeSnapshot({
			success: (res) => resolve(res.tempImagePath),
			fail: reject
		})
	})
}
</script>

<style lang="scss" scoped>
.map-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.map-canvas { width: 100%; height: 100%; background: var(--bg-root); }
.compass-overlay { position: absolute; top: 200rpx; left: 40rpx; width: 80rpx; height: 80rpx; background: rgba(26,31,46,0.8); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.1); }
.compass-icon { width: 48rpx; height: 48rpx; }
.shadow-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
.shadow-circle { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(255,77,79,0.3) 0%, rgba(255,77,79,0.1) 50%, rgba(255,77,79,0) 100%); border: 2px dashed #FF4D4F; display: flex; align-items: center; justify-content: center; }
.shadow-pulse { position: absolute; width: 100%; height: 100%; border-radius: 50%; border: 2px solid #FF4D4F; animation: shadowPulse 2s ease-out infinite; }
@keyframes shadowPulse { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.2); opacity: 0; } }
.shadow-label { position: relative; z-index: 10; background: rgba(255,77,79,0.9); color: #ffffff; padding: 8rpx 16rpx; border-radius: 20rpx; font-size: 24rpx; font-weight: 600; }
</style>
