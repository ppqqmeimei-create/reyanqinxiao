<template>
	<view class="user-card frosted-card">
		<view class="user-info-section">
			<view class="avatar-container">
				<image v-if="!avatarError" class="avatar-image" :src="userInfo.avatar" mode="aspectFill" @error="avatarError=true"></image>
				<view v-else class="avatar-default"><text class="avatar-icon">👤</text></view>
				<view class="scan-ring" :class="{ 'duty-active': onDuty }"></view>
			</view>
			<view class="identity-info">
				<view class="name-row">
					<text class="user-name">{{ userInfo.name }}</text>
					<view class="rank-badge"><text class="rank-text">{{ userInfo.rank }}</text></view>
				</view>
				<view class="badge-row">
					<text class="badge-label">警号</text>
					<text class="badge-number">{{ userInfo.badgeNumber }}</text>
				</view>
				<view class="department-row">
					<text class="department-text">🛡️ {{ userInfo.department }}{{ onDuty ? ' · 执勤中' : '' }}</text>
				</view>
				<view v-if="userInfo.squad" class="department-row">
					<text class="department-text">👮 {{ userInfo.squad }}{{ userInfo.dutyZone ? ' · ' + userInfo.dutyZone : '' }}</text>
				</view>
			</view>
		</view>
		<view class="duty-status-section">
			<view class="status-label-group">
				<text class="status-label">执勤状态</text>
				<text class="status-text" :class="{ active: onDuty }">{{ onDuty ? '执勤中' : '休整中' }}</text>
			</view>
			<view class="physical-switch" :class="{ active: onDuty }" @tap="toggleDuty">
				<view class="switch-slider"></view>
			</view>
		</view>

		<!-- 执勤中动态提示 -->
		<view v-if="onDuty" class="duty-hint duty-active-hint">
			<view class="hint-icon-row">
				<text class="hint-icon">📍</text>
				<text class="hint-text">GPS定位已激活 · {{ currentTime }}</text>
			</view>
			<view class="hint-icon-row" v-if="currentTaskNo">
				<text class="hint-icon">📋</text>
				<text class="hint-text">当前任务：{{ currentTaskNo }}</text>
			</view>
			<view class="hint-icon-row">
				<text class="hint-icon">🔄</text>
				<text class="hint-text">位置实时上报指挥部</text>
			</view>
		</view>
		<view v-else class="duty-hint">
			<text class="hint-text">🌙 休整中，位置不上报</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const props = defineProps({
	userInfo: { type: Object, required: true },
	onDuty: { type: Boolean, default: false }
})
const emit = defineEmits(['dutyChange'])
const avatarError = ref(false)
const currentTime = ref('')
const currentTaskNo = ref('WL-2026-000102')

let timer = null
function updateTime() {
	const d = new Date()
	const pad = n => String(n).padStart(2, '0')
	currentTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(() => {
	updateTime()
	timer = setInterval(updateTime, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

function toggleDuty() { emit('dutyChange', !props.onDuty) }
</script>

<style lang="scss" scoped>
.user-card { margin: 32rpx; padding: 40rpx; position: relative; overflow: hidden; background: rgba(12,27,42,0.90); border-radius: 24rpx; border: 1px solid rgba(255,255,255,0.08); }
.user-info-section { display: flex; align-items: center; gap: 32rpx; margin-bottom: 40rpx; }
.avatar-container { position: relative; width: 160rpx; height: 160rpx; flex-shrink: 0; }
.avatar-image { width: 100%; height: 100%; border-radius: 50%; border: 4px solid rgba(0,212,255,0.5); box-shadow: 0 0 30rpx rgba(0,212,255,0.6); }
.avatar-default { width: 100%; height: 100%; border-radius: 50%; border: 4px solid rgba(0,212,255,0.5); background: linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(102,126,234,0.3) 100%); display: flex; align-items: center; justify-content: center; }
.avatar-icon { font-size: 80rpx; opacity: 0.8; }
.scan-ring { position: absolute; top: -8rpx; left: -8rpx; right: -8rpx; bottom: -8rpx; border-radius: 50%; border: 2px solid rgba(0,212,255,0.3); animation: scanPulse 3s ease-in-out infinite; }
.scan-ring.duty-active { border-color: rgba(115,209,61,0.5); animation: dutyPulse 1.8s ease-in-out infinite; }
@keyframes dutyPulse { 0%, 100% { opacity: 0.5; transform: scale(1); box-shadow: 0 0 0 0 rgba(115,209,61,0.4); } 50% { opacity: 1; transform: scale(1.06); box-shadow: 0 0 0 12rpx rgba(115,209,61,0); } }
@keyframes scanPulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
.identity-info { flex: 1; display: flex; flex-direction: column; gap: 16rpx; }
.name-row { display: flex; align-items: center; gap: 16rpx; }
.user-name { font-size: 48rpx; font-weight: 700; color: #ffffff; text-shadow: 0 0 20rpx rgba(0,212,255,0.4); }
.rank-badge { padding: 8rpx 16rpx; background: linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.1) 100%); border: 1px solid rgba(0,212,255,0.5); border-radius: 8rpx; }
.rank-text { font-size: 20rpx; color: #00d4ff; font-weight: 600; }
.badge-row { display: flex; align-items: center; gap: 16rpx; }
.badge-label { font-size: 24rpx; color: #8c8c8c; }
.badge-number { font-size: 32rpx; color: #00d4ff; font-weight: 700; font-family: Courier New, monospace; }
.department-row { display: flex; align-items: center; }
.department-text { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.duty-status-section { display: flex; align-items: center; justify-content: space-between; padding: 32rpx; background: rgba(255,255,255,0.05); border-radius: 16rpx; border: 1px solid var(--line-soft); }
.status-label-group { display: flex; flex-direction: column; gap: 8rpx; }
.status-label { font-size: 24rpx; color: #8c8c8c; }
.status-text { font-size: 32rpx; font-weight: 700; color: #ffffff; }
.status-text.active { color: #73D13D; }
.duty-hint { margin-top: 24rpx; padding: 20rpx 24rpx; background: rgba(115,209,61,0.1); border: 1px solid rgba(115,209,61,0.3); border-radius: 12rpx; }
.duty-active-hint { display: flex; flex-direction: column; gap: 10rpx; background: rgba(115,209,61,0.1); border-color: rgba(115,209,61,0.4); }
.hint-icon-row { display: flex; align-items: center; gap: 10rpx; }
.hint-icon { font-size: 24rpx; }
.hint-text { font-size: 24rpx; color: #73D13D; }
</style>
