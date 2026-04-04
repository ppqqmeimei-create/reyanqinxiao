<template>
	<view class="action-slider" :class="{ disabled: disabled }">
		<view class="slider-track" :class="{ active: isSliding }">
			<view class="slider-fill" :style="{ width: slideProgress + '%' }"></view>
			<text class="slider-hint" :class="{ hidden: slideProgress > 20 }">{{ disabled ? '请靠近目标后完成任务' : '向右滑动完成任务' }}</text>
			<text class="slider-complete" :class="{ visible: slideProgress > 80 }">松手完成</text>
		</view>
		<movable-area class="slider-area">
			<movable-view class="slider-button" direction="horizontal" :x="sliderX" :disabled="disabled" @change="handleSliderChange" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
				<view class="button-content">
					<image class="button-icon" src="/static/icons-3/arrow-right-double.png" mode="aspectFit"></image>
				</view>
			</movable-view>
		</movable-area>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps({ disabled: { type: Boolean, default: false } })
const emit = defineEmits(['complete'])
const sliderX = ref(0)
const slideProgress = ref(0)
const isSliding = ref(false)
const maxSlideDistance = ref(0)
onMounted(() => {
	uni.createSelectorQuery().select('.slider-area').boundingClientRect((rect) => {
		if (rect) maxSlideDistance.value = rect.width - 120
	}).exec()
})
function handleTouchStart() { if (props.disabled) return; isSliding.value = true; uni.vibrateShort() }
function handleSliderChange(e) {
	if (props.disabled) return
	const x = e.detail.x; sliderX.value = x
	if (maxSlideDistance.value > 0) slideProgress.value = Math.min((x / maxSlideDistance.value) * 100, 100)
}
function handleTouchEnd() {
	if (props.disabled) return
	isSliding.value = false
	if (slideProgress.value >= 90) { uni.vibrateLong(); emit('complete'); setTimeout(resetSlider, 500) }
	else resetSlider()
}
function resetSlider() { sliderX.value = 0; slideProgress.value = 0 }
</script>

<style lang="scss" scoped>
.action-slider { position: relative; width: 100%; height: 120rpx; }
.action-slider.disabled { opacity: 0.5; pointer-events: none; }
.slider-track { position: absolute; top: 0; left: 0; right: 0; height: 120rpx; background: rgba(89,89,89,0.3); border-radius: 60rpx; border: 2px solid rgba(255,255,255,0.1); overflow: hidden; }
.slider-track.active { border-color: rgba(115,209,61,0.5); }
.slider-fill { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, rgba(115,209,61,0.3) 0%, rgba(115,209,61,0.6) 100%); }
.slider-hint { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 28rpx; font-weight: 600; color: rgba(255,255,255,0.6); white-space: nowrap; pointer-events: none; }
.slider-hint.hidden { opacity: 0; }
.slider-complete { position: absolute; top: 50%; right: 80rpx; transform: translateY(-50%); font-size: 32rpx; font-weight: 700; color: #73D13D; opacity: 0; pointer-events: none; }
.slider-complete.visible { opacity: 1; }
.slider-area { position: absolute; top: 0; left: 0; width: 100%; height: 120rpx; }
.slider-button { width: 120rpx; height: 120rpx; display: flex; align-items: center; justify-content: center; }
.button-content { width: 104rpx; height: 104rpx; border-radius: 50%; background: linear-gradient(135deg, #73D13D 0%, #52c41a 100%); box-shadow: 0 8rpx 24rpx rgba(115,209,61,0.4); display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.3); }
.button-icon { width: 48rpx; height: 48rpx; }
</style>
