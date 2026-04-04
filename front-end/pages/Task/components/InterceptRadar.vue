<template>
	<view class="intercept-radar">
		<view class="radar-circles">
			<view class="radar-circle" v-for="i in 4" :key="i"></view>
		</view>
		<view class="radar-scanner"></view>
		<view class="radar-center">
			<view class="center-dot"></view>
			<text class="center-label">我</text>
		</view>
		<view class="radar-target" :style="targetPositionStyle">
			<view class="target-pulse"></view>
			<view class="target-dot"></view>
			<text class="target-label">目标</text>
		</view>
		<view class="compass-indicators">
			<text class="compass-label north">N</text>
			<text class="compass-label east">E</text>
			<text class="compass-label south">S</text>
			<text class="compass-label west">W</text>
		</view>
		<view class="radar-info">
			<view class="info-item">
				<text class="info-label">距离</text>
				<text class="info-value">{{ targetDistance }}m</text>
			</view>
			<view class="info-item">
				<text class="info-label">方位</text>
				<text class="info-value">{{ directionText }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	targetDistance: { type: Number, required: true },
	targetBearing: { type: Number, required: true },
	currentLocation: { type: Object, required: true },
	targetLocation: { type: Object, required: true }
})

const targetPositionStyle = computed(() => {
	const radarRadius = 280
	const maxDistance = 1000
	const distanceRatio = Math.min(props.targetDistance / maxDistance, 1)
	const targetRadius = radarRadius * distanceRatio
	const angleRad = (props.targetBearing - 90) * Math.PI / 180
	const x = targetRadius * Math.cos(angleRad)
	const y = targetRadius * Math.sin(angleRad)
	return { transform: 'translate(' + x + 'rpx, ' + y + 'rpx)' }
})

const directionText = computed(() => {
	const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
	const index = Math.round(props.targetBearing / 45) % 8
	return directions[index] + ' ' + props.targetBearing + '°'
})
</script>

<style lang="scss" scoped>
.intercept-radar { position: relative; width: 600rpx; height: 600rpx; display: flex; align-items: center; justify-content: center; }
.radar-circles { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.radar-circle { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 1px solid rgba(115,209,61,0.2); border-radius: 50%; }
.radar-circle:nth-child(1) { width: 140rpx; height: 140rpx; }
.radar-circle:nth-child(2) { width: 280rpx; height: 280rpx; }
.radar-circle:nth-child(3) { width: 420rpx; height: 420rpx; }
.radar-circle:nth-child(4) { width: 560rpx; height: 560rpx; }
.radar-scanner { position: absolute; top: 50%; left: 50%; width: 280rpx; height: 2rpx; background: linear-gradient(90deg, rgba(115,209,61,0) 0%, rgba(115,209,61,0.8) 100%); transform-origin: left center; animation: radarScan 4s linear infinite; }
@keyframes radarScan { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
.radar-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 8rpx; z-index: 10; }
.center-dot { width: 32rpx; height: 32rpx; border-radius: 50%; background: #73D13D; box-shadow: 0 0 20rpx #73D13D; animation: centerPulse 2s ease-in-out infinite; }
@keyframes centerPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.8; } }
.center-label { font-size: 20rpx; font-weight: 600; color: #73D13D; }
.radar-target { position: absolute; top: 50%; left: 50%; display: flex; flex-direction: column; align-items: center; gap: 8rpx; z-index: 10; transition: transform 0.5s ease; }
.target-pulse { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 48rpx; height: 48rpx; border-radius: 50%; border: 2px solid #FF4D4F; animation: targetPulse 1.5s ease-out infinite; }
@keyframes targetPulse { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; } }
.target-dot { width: 32rpx; height: 32rpx; border-radius: 50%; background: #FF4D4F; box-shadow: 0 0 20rpx #FF4D4F; animation: targetBlink 1s ease-in-out infinite; }
@keyframes targetBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.target-label { font-size: 20rpx; font-weight: 600; color: #FF4D4F; white-space: nowrap; }
.compass-indicators { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
.compass-label { position: absolute; font-size: 28rpx; font-weight: 700; color: rgba(255,255,255,0.6); }
.compass-label.north { top: 0; left: 50%; transform: translateX(-50%); }
.compass-label.east { top: 50%; right: 0; transform: translateY(-50%); }
.compass-label.south { bottom: 0; left: 50%; transform: translateX(-50%); }
.compass-label.west { top: 50%; left: 0; transform: translateY(-50%); }
.radar-info { position: absolute; bottom: -80rpx; left: 50%; transform: translateX(-50%); display: flex; gap: 48rpx; }
.info-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.info-label { font-size: 22rpx; color: #8c8c8c; }
.info-value { font-size: 28rpx; font-weight: 700; color: #ffffff; font-family: Courier New, monospace; }
</style>
