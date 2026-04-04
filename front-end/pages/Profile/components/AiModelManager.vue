<template>
	<view class="ai-model-manager data-card">
		<view class="card-title"><text>AI 装备维护舱</text></view>
		<view class="model-header">
			<view class="model-icon">🤖</view>
			<view class="model-details">
				<text class="model-name">{{ modelInfo.name }}</text>
				<text class="model-version">版本 {{ modelInfo.version }}</text>
			</view>
			<view class="model-status" :class="updateAvailable ? 'update' : 'latest'">
				<text class="status-text">{{ updateAvailable ? '有更新' : '最新' }}</text>
			</view>
		</view>
		<view class="model-meta">
			<view class="meta-item"><text class="meta-label">模型大小</text><text class="meta-value">{{ modelInfo.size }} MB</text></view>
		</view>
		<view v-if="updateAvailable" class="update-section">
			<view class="inset-divider"></view>
			<view class="update-info">
				<view class="update-header">
					<text class="update-title">🎯 新版本可用</text>
					<text class="update-version">V2.5</text>
				</view>
				<view class="update-btn" :class="{ updating: isUpdating }" @tap="handleUpdate">
					<view v-if="isUpdating" class="spinner"></view>
					<text class="btn-text">{{ isUpdating ? '安装中 ' + updateProgress + '%' : '一键安装' }}</text>
				</view>
			</view>
		</view>
		<view class="inset-divider"></view>
		<view class="performance-section">
			<text class="section-title">性能指标（活体物种识别 + 走私车辆识别）</text>
			<view class="perf-item"><text class="perf-label">物种识别准确率</text><view class="perf-bar"><view class="perf-fill success" style="width:96%"></view></view><text class="perf-val">96%</text></view>
			<view class="perf-item"><text class="perf-label">车辆识别准确率</text><view class="perf-bar"><view class="perf-fill success" style="width:91%"></view></view><text class="perf-val">91%</text></view>
			<view class="perf-item"><text class="perf-label">推理速度</text><view class="perf-bar"><view class="perf-fill primary" style="width:88%"></view></view><text class="perf-val">88ms</text></view>
			<view class="perf-item"><text class="perf-label">内存占用</text><view class="perf-bar"><view class="perf-fill warning" style="width:68%"></view></view><text class="perf-val">68%</text></view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
	modelInfo: { type: Object, required: true },
	updateAvailable: { type: Boolean, default: false }
})
const emit = defineEmits(['update'])
const isUpdating = ref(false)
const updateProgress = ref(0)
function handleUpdate() {
	if (isUpdating.value) return
	isUpdating.value = true; updateProgress.value = 0
	const t = setInterval(() => {
		updateProgress.value += 5
		if (updateProgress.value >= 100) { clearInterval(t); setTimeout(() => { isUpdating.value = false; emit('update') }, 500) }
	}, 100)
}
</script>

<style lang="scss" scoped>
.model-header { display: flex; align-items: center; gap: 24rpx; margin-bottom: 24rpx; }
.model-icon { font-size: 64rpx; width: 120rpx; height: 120rpx; display: flex; align-items: center; justify-content: center; background: rgba(0,212,255,0.1); border: 2px solid rgba(0,212,255,0.3); border-radius: 24rpx; }
.model-details { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.model-name { font-size: 32rpx; font-weight: 700; color: #ffffff; }
.model-version { font-size: 24rpx; color: #8c8c8c; font-family: Courier New, monospace; }
.model-status { padding: 12rpx 20rpx; border-radius: 20rpx; }
.model-status.latest { background: rgba(115,209,61,0.1); border: 1px solid rgba(115,209,61,0.3); }
.model-status.update { background: rgba(255,169,64,0.1); border: 1px solid rgba(255,169,64,0.3); }
.model-status.latest .status-text { color: #73D13D; }
.model-status.update .status-text { color: #FFA940; }
.status-text { font-size: 20rpx; font-weight: 600; }
.model-meta { display: flex; gap: 32rpx; margin-bottom: 24rpx; }
.meta-item { flex: 1; display: flex; flex-direction: column; gap: 8rpx; padding: 20rpx; background: rgba(255,255,255,0.05); border-radius: 12rpx; border: 1px solid var(--line-soft); }
.meta-label { font-size: 20rpx; color: #8c8c8c; }
.meta-value { font-size: 24rpx; color: #ffffff; font-weight: 600; font-family: Courier New, monospace; }
.update-section { margin-bottom: 24rpx; }
.update-info { padding: 32rpx; background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.2); border-radius: 16rpx; }
.update-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; }
.update-title { font-size: 28rpx; font-weight: 700; color: #ffffff; }
.update-version { font-size: 32rpx; font-weight: 700; color: #00d4ff; font-family: Courier New, monospace; }
.update-btn { width: 100%; height: 88rpx; background: linear-gradient(135deg, #00d4ff 0%, #00f2fe 100%); border-radius: 16rpx; display: flex; align-items: center; justify-content: center; gap: 16rpx; }
.update-btn.updating { background: rgba(0,212,255,0.3); }
.btn-text { font-size: 32rpx; font-weight: 700; color: var(--bg-root); }
.update-btn.updating .btn-text { color: #00d4ff; }
.spinner { width: 32rpx; height: 32rpx; border: 3px solid rgba(0,212,255,0.3); border-top-color: #00d4ff; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.performance-section { display: flex; flex-direction: column; gap: 20rpx; }
.section-title { font-size: 28rpx; font-weight: 600; color: #ffffff; margin-bottom: 8rpx; display: block; }
.perf-item { display: flex; align-items: center; gap: 16rpx; }
.perf-label { width: 140rpx; font-size: 24rpx; color: #8c8c8c; }
.perf-bar { flex: 1; height: 16rpx; background: rgba(255,255,255,0.1); border-radius: 8rpx; overflow: hidden; }
.perf-fill { height: 100%; border-radius: 8rpx; }
.perf-fill.success { background: linear-gradient(90deg, #73D13D 0%, #95de64 100%); }
.perf-fill.primary { background: linear-gradient(90deg, #00d4ff 0%, #00f2fe 100%); }
.perf-fill.warning { background: linear-gradient(90deg, #FFA940 0%, #ffc069 100%); }
.perf-val { font-size: 24rpx; color: #ffffff; font-weight: 600; font-family: Courier New, monospace; min-width: 80rpx; text-align: right; }
</style>
