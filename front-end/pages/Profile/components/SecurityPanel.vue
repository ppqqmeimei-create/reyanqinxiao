<template>
	<view class="security-panel data-card">
		<view class="card-title"><text>安全与退出中心</text></view>
		<view class="security-item">
			<view class="item-left">
				<view class="item-icon">🔐</view>
				<view class="item-info"><text class="item-title">生物识别锁</text><text class="item-desc">切换应用时需要验证</text></view>
			</view>
			<view class="physical-switch" :class="{ active: biometricEnabled }" @tap="toggleBiometric">
				<view class="switch-slider"></view>
			</view>
		</view>
		<view class="inset-divider"></view>
		<view class="security-item danger-zone">
			<view class="item-left">
				<view class="item-icon danger">⚠️</view>
				<view class="item-info"><text class="item-title danger-text">紧急数据销毁</text><text class="item-desc">清除所有本地缓存证据</text></view>
			</view>
			<view class="action-btn-outline" @tap="emit('emergencyDestroy')"><text class="action-btn-text">执行</text></view>
		</view>
		<view class="inset-divider"></view>
		<view class="security-options">
			<view class="option-item" @tap="handleCaseEncrypt"><text class="option-icon">🔒</text><text class="option-text">案件数据加密</text><text class="option-arrow">›</text></view>
			<view class="option-item" @tap="handleClearCache"><text class="option-icon">🗑️</text><text class="option-text">清理缓存</text><text class="option-arrow">›</text></view>
			<view class="option-item" @tap="handleChangePassword"><text class="option-icon">🔑</text><text class="option-text">修改密码</text><text class="option-arrow">›</text></view>
		</view>
		<view class="logout-section">
			<view class="danger-button" @tap="emit('logout')"><text>🚪 退出登录</text></view>
		</view>
		<view class="version-info">
			<text class="version-text">热眼擒枭——边境活物走私智能防控系统 v2.0.0</text>
			<text class="copyright-text">© 广西环食药侦查总队 版权所有</text>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({ biometricEnabled: { type: Boolean, default: false } })
const emit = defineEmits(['biometricToggle', 'emergencyDestroy', 'logout'])
function toggleBiometric() { emit('biometricToggle', !props.biometricEnabled) }
function handleClearCache() {
	uni.showModal({
		title: '清理缓存', content: '确认清理所有缓存数据？',
		success: (res) => { if (res.confirm) { uni.showLoading({ title: '清理中...' }); setTimeout(() => { uni.hideLoading(); uni.showToast({ title: '清理完成', icon: 'success' }) }, 1000) } }
	})
	uni.vibrateShort()
}
function handleChangePassword() { uni.showToast({ title: '功能开发中', icon: 'none' }); uni.vibrateShort() }
function handleCaseEncrypt() {
	uni.showModal({
		title: '案件数据加密',
		content: '走私案件敏感数据将进行AES-256加密存储，防止数据泄露。确认开启？',
		confirmText: '开启加密', confirmColor: '#00d4ff',
		success: (res) => { if (res.confirm) uni.showToast({ title: '案件数据加密已开启', icon: 'success' }) }
	})
	uni.vibrateShort()
}
</script>

<style lang="scss" scoped>
.security-item { display: flex; align-items: center; justify-content: space-between; padding: 32rpx; background: rgba(255,255,255,0.05); border-radius: 16rpx; border: 1px solid var(--line-soft); margin-bottom: 32rpx; }
.security-item.danger-zone { background: rgba(255,77,79,0.05); border-color: rgba(255,77,79,0.2); }
.item-left { display: flex; align-items: center; gap: 24rpx; flex: 1; }
.item-icon { width: 80rpx; height: 80rpx; display: flex; align-items: center; justify-content: center; font-size: 48rpx; background: rgba(0,212,255,0.1); border: 2px solid rgba(0,212,255,0.3); border-radius: 16rpx; }
.item-icon.danger { background: rgba(255,77,79,0.1); border-color: rgba(255,77,79,0.3); }
.item-info { display: flex; flex-direction: column; gap: 8rpx; }
.item-title { font-size: 28rpx; font-weight: 600; color: #ffffff; }
.item-title.danger-text { color: #FF4D4F; }
.item-desc { font-size: 20rpx; color: #8c8c8c; }
.action-btn-outline { padding: 16rpx 32rpx; border-radius: 12rpx; background: transparent; border: 2px solid #FF4D4F; }
.action-btn-text { font-size: 24rpx; font-weight: 600; color: #FF4D4F; }
.security-options { display: flex; flex-direction: column; gap: 16rpx; margin-bottom: 32rpx; }
.option-item { display: flex; align-items: center; gap: 24rpx; padding: 28rpx 32rpx; background: rgba(255,255,255,0.05); border-radius: 16rpx; border: 1px solid var(--line-soft); }
.option-icon { font-size: 40rpx; width: 64rpx; text-align: center; }
.option-text { flex: 1; font-size: 28rpx; color: #ffffff; font-weight: 500; }
.option-arrow { font-size: 48rpx; color: #595959; }
.logout-section { margin-bottom: 32rpx; }
.version-info { display: flex; flex-direction: column; align-items: center; gap: 8rpx; padding: 32rpx 0; opacity: 0.5; }
.version-text { font-size: 20rpx; color: #8c8c8c; font-family: Courier New, monospace; }
.copyright-text { font-size: 18rpx; color: #595959; }
</style>
