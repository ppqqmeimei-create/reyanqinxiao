<template>
	<view 
		class="alert-mini-panel"
		:class="{ 'panel-expanded': isExpanded }"
		:style="{ zIndex: 100 }"
		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
	>
		<view class="slide-indicator"><view class="indicator-bar"></view></view>
		<view v-if="!latestAlert" class="empty-state">
			<text class="empty-text">当前无预警信息</text>
			<text class="empty-subtext">系统正常运行中</text>
		</view>
		<view v-else class="alert-content">
			<view class="alert-level" :class="'level-' + latestAlert.level">
				<view class="level-dot breathing"></view>
				<text class="level-text">{{ getLevelText(latestAlert.level) }}</text>
			</view>
			<view class="alert-info">
				<view class="alert-header">
					<text class="alert-title">{{ latestAlert.message }}</text>
				</view>
				<view class="alert-meta">
					<view class="meta-item"><text class="meta-text">{{ latestAlert.location }}</text></view>
					<view class="meta-item"><text class="meta-text">{{ formatTime(latestAlert.time) }}</text></view>
				</view>
			</view>
			<view class="quick-actions">
				<view class="action-btn primary" @tap="handleTask">
					<text class="action-text">立即处理</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
	latestAlert: { type: Object, default: null }
})

const emit = defineEmits(['slideUp'])

const isExpanded = ref(false)
const touchStartY = ref(0)
const touchMoveY = ref(0)

function onTouchStart(e) { touchStartY.value = e.touches[0].clientY }
function onTouchMove(e) { touchMoveY.value = e.touches[0].clientY }
function onTouchEnd() {
	const deltaY = touchStartY.value - touchMoveY.value
	if (deltaY > 50) slideUp()
	touchStartY.value = 0
	touchMoveY.value = 0
}
function slideUp() { uni.vibrateShort(); emit('slideUp') }
function handleTask() {
	uni.vibrateShort()
	if (props.latestAlert) {
		uni.navigateTo({ url: '/pages/Task/Task?alertId=' + props.latestAlert.id + '&type=intercept' })
	} else {
		emit('slideUp')
	}
}
function getLevelText(level) {
	return { critical: '严重', warning: '预警', info: '提示' }[level] || '未知'
}
function formatTime(time) {
	const diff = Math.floor((Date.now() - new Date(time)) / 1000)
	if (diff < 60) return '刚刚'
	if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
	if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
	return Math.floor(diff / 86400) + '天前'
}
</script>

<style lang="scss" scoped>
.alert-mini-panel { position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; background: rgba(12,27,42,0.96); border-top-left-radius: 48rpx; border-top-right-radius: 48rpx; border: 1px solid var(--line-soft); border-bottom: none; padding: 24rpx 32rpx; padding-bottom: calc(24rpx + env(safe-area-inset-bottom)); box-shadow: 0 -8rpx 32rpx rgba(0,0,0,0.5); }
.slide-indicator { display: flex; justify-content: center; margin-bottom: 24rpx; }
.indicator-bar { width: 80rpx; height: 8rpx; background: rgba(255,255,255,0.2); border-radius: 4rpx; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 40rpx 0; }
.empty-text { font-size: 28rpx; font-weight: 500; color: #ffffff; margin-bottom: 8rpx; }
.empty-subtext { font-size: 24rpx; color: #8c8c8c; }
.alert-content { display: flex; flex-direction: column; gap: 24rpx; }
.alert-level { display: inline-flex; align-items: center; gap: 12rpx; padding: 12rpx 24rpx; border-radius: 24rpx; align-self: flex-start; }
.alert-level.level-critical { background: rgba(255,77,79,0.2); border: 1px solid #FF4D4F; }
.alert-level.level-critical .level-dot { background: #FF4D4F; box-shadow: 0 0 16rpx #FF4D4F; }
.alert-level.level-critical .level-text { color: #FF4D4F; }
.alert-level.level-warning { background: rgba(255,169,64,0.2); border: 1px solid #FFA940; }
.alert-level.level-warning .level-dot { background: #FFA940; box-shadow: 0 0 16rpx #FFA940; }
.alert-level.level-warning .level-text { color: #FFA940; }
.level-dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.level-text { font-size: 24rpx; font-weight: 600; }
.alert-info { display: flex; flex-direction: column; gap: 16rpx; }
.alert-header { display: flex; align-items: flex-start; gap: 16rpx; }
.alert-title { flex: 1; font-size: 30rpx; font-weight: 600; color: #ffffff; line-height: 1.5; }
.alert-meta { display: flex; flex-direction: column; gap: 12rpx; }
.meta-item { display: flex; align-items: center; gap: 12rpx; }
.meta-text { font-size: 24rpx; color: #8c8c8c; }
.quick-actions { display: flex; gap: 16rpx; margin-top: 8rpx; }
.action-btn { flex: 1; height: 88rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx; font-weight: 600; }
.action-btn.primary { background: linear-gradient(135deg, #00A8D6 0%, #007EA8 100%); box-shadow: 0 8rpx 24rpx rgba(102,126,234,0.4); }
.action-text { font-size: 28rpx; color: #ffffff; }
.breathing { animation: breathe 2s ease-in-out infinite; }
@keyframes breathe { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.2); } }
</style>
