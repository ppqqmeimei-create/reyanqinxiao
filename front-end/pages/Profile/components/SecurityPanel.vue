<template>
	<view class="security-panel data-card">
		<view class="card-title"><text>安全与退出中心</text></view>
		<view class="security-item">
			<view class="item-left">
				<view class="item-icon"><text class="item-icon-text">🔐</text></view>
				<view class="item-info"><text class="item-title">生物识别锁</text><text class="item-desc">切换应用时需要验证</text></view>
			</view>
			<view class="physical-switch" :class="{ active: biometricEnabled }" @tap="toggleBiometric">
				<view class="switch-slider"></view>
			</view>
		</view>
		<view class="inset-divider"></view>
		<!-- 危险区域（增强：动态红光呼吸动画） -->
		<view class="security-item danger-zone" :class="{ 'danger-pulse': true }">
			<view class="danger-glow-bar"></view>
			<view class="item-left">
				<view class="item-icon danger"><text class="item-icon-text">⚠️</text></view>
				<view class="item-info"><text class="item-title danger-text">紧急数据销毁</text><text class="item-desc">清除所有本地缓存证据</text></view>
			</view>
			<view class="action-btn-outline" @tap="emit('emergencyDestroy')"><text class="action-btn-text">执行</text></view>
		</view>
		<view class="inset-divider"></view>
		<view class="security-options">
			<view class="option-item" @tap="handleCaseEncrypt"><text class="option-icon-text">🔒</text><text class="option-text">案件数据加密</text><text class="option-arrow">›</text></view>
			<view class="option-item" @tap="handleClearCache"><text class="option-icon-text">🗑️</text><text class="option-text">清理缓存</text><text class="option-arrow">›</text></view>
			<view class="option-item" @tap="handleChangePassword"><text class="option-icon-text">🔑</text><text class="option-text">修改密码</text><text class="option-arrow">›</text></view>
		</view>

		<!-- 操作日志折叠区 -->
		<view class="audit-log-section">
			<view class="audit-header" @tap="toggleLog">
				<text class="audit-title">📋 操作日志</text>
				<text class="audit-toggle">{{ showLog ? '收起' : '展开' }}</text>
			</view>
			<view v-if="showLog" class="audit-body">
				<view v-for="(log, i) in auditLogs" :key="i" class="log-item" :class="'log-' + log.level">
					<view class="log-head">
						<text class="log-action">{{ log.action }}</text>
						<text class="log-time">{{ log.time }}</text>
					</view>
					<text class="log-detail">{{ log.detail }}</text>
				</view>
				<view v-if="auditLogs.length === 0" class="log-empty">
					<text class="log-empty-text">暂无操作记录</text>
				</view>
			</view>
		</view>

		<view class="logout-section">
			<view class="danger-button" @tap="emit('logout')"><text>🚪 退出登录</text></view>
		</view>

		<!-- 增强版本信息 -->
		<view class="version-info">
			<text class="version-text">热眼擒枭 v2.0.0</text>
			<view class="version-meta-row">
				<view class="version-chip" :class="accountType === '正式警员' ? 'chip-primary' : 'chip-secondary'">
					<text class="chip-text">{{ accountType }}</text>
				</view>
				<text class="version-sep">|</text>
				<text class="version-sync">同步 {{ lastSyncTime }}</text>
				<text class="version-sep">|</text>
				<text class="version-cache">缓存 {{ cacheSize }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
const props = defineProps({ biometricEnabled: { type: Boolean, default: false } })
const emit = defineEmits(['biometricToggle', 'emergencyDestroy', 'logout'])

const showLog = ref(false)
const accountType = ref('正式警员')
const lastSyncTime = ref('--')
const cacheSize = ref('--')

const auditLogs = ref([
	{ action: '生物识别',   detail: '开启生物识别锁',    level: 'info',  time: '2026-04-07 08:30' },
	{ action: '案件加密',   detail: 'AES-256加密已开启', level: 'info',  time: '2026-04-07 08:32' },
	{ action: '数据同步',   detail: '同步证据12条',     level: 'info',  time: '2026-04-07 09:15' },
	{ action: '执勤切换',   detail: '切换至执勤模式',   level: 'warn',  time: '2026-04-07 09:00' },
])

function toggleBiometric() {
	const newVal = !props.biometricEnabled
	emit('biometricToggle', newVal)
	addLog(newVal ? 'info' : 'info', '生物识别', newVal ? '开启生物识别锁' : '关闭生物识别锁')
}
function handleClearCache() {
	uni.showModal({
		title: '清理缓存', content: '确认清理所有缓存数据？',
		success: (res) => { if (res.confirm) {
			uni.showLoading({ title: '清理中...' })
			setTimeout(() => {
				cacheSize.value = '0 MB'
				uni.hideLoading()
				uni.showToast({ title: '清理完成', icon: 'success' })
				addLog('warn', '缓存清理', '已清理本地缓存数据')
			}, 1000)
		} }
	})
	uni.vibrateShort()
}
function handleChangePassword() { uni.showToast({ title: '功能开发中', icon: 'none' }); uni.vibrateShort() }
function handleCaseEncrypt() {
	uni.showModal({
		title: '案件数据加密',
		content: '走私案件敏感数据将进行AES-256加密存储，防止数据泄露。确认开启？',
		confirmText: '开启加密', confirmColor: '#00d4ff',
		success: (res) => { if (res.confirm) {
			addLog('info', '案件加密', 'AES-256加密已开启')
			uni.showToast({ title: '案件数据加密已开启', icon: 'success' })
		} }
	})
	uni.vibrateShort()
}
function toggleLog() { showLog.value = !showLog.value }
function addLog(level, action, detail) {
	const d = new Date()
	const pad = n => String(n).padStart(2, '0')
	auditLogs.value.unshift({
		level, action, detail,
		time: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
	})
}
onMounted(() => {
	const d = new Date()
	const pad = n => String(n).padStart(2, '0')
	lastSyncTime.value = `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
	cacheSize.value = '156 MB'
	const info = uni.getStorageSync('user_info') || {}
	if (info.role === 'assistant' || info.rank === '协勤') accountType.value = '协勤'
})

</script>

<style lang="scss" scoped>
.security-item { display: flex; align-items: center; justify-content: space-between; padding: 32rpx; background: rgba(255,255,255,.05); border-radius: 16rpx; border: 1px solid var(--line-soft); margin-bottom: 32rpx; position: relative; overflow: hidden }
.security-item.danger-zone { background: rgba(255,77,79,.05); border-color: rgba(255,77,79,.2) }
.danger-glow-bar { position: absolute; top: 0; left: 0; right: 0; height: 3rpx; background: linear-gradient(90deg, transparent, #FF4D4F, transparent); animation: dangerFlow 2s linear infinite }
@keyframes dangerFlow { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
.item-left { display: flex; align-items: center; gap: 24rpx; flex: 1 }
.item-icon { width: 80rpx; height: 80rpx; display: flex; align-items: center; justify-content: center; background: rgba(0,212,255,.1); border: 2px solid rgba(0,212,255,.3); border-radius: 16rpx; transition: all .25s ease }
.item-icon.danger { background: rgba(255,77,79,.1); border-color: rgba(255,77,79,.3); animation: dangerIconPulse 2s ease-in-out infinite }
@keyframes dangerIconPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,77,79,.4)} 50%{box-shadow:0 0 0 12rpx rgba(255,77,79,0)} }
.item-icon-text { font-size: 48rpx }
.item-info { display: flex; flex-direction: column; gap: 8rpx }
.item-title { font-size: 28rpx; font-weight: 600; color: #ffffff }
.item-title.danger-text { color: #FF4D4F }
.item-desc { font-size: 20rpx; color: #8c8c8c }
.action-btn-outline { padding: 14rpx 28rpx; border-radius: 12rpx; background: transparent; border: 2px solid #FF4D4F; transition: all .25s ease;
	&:active { background: rgba(255,77,79,.1); transform: scale(.95) }
}
.action-btn-text { font-size: 24rpx; font-weight: 600; color: #FF4D4F }
.security-options { display: flex; flex-direction: column; gap: 16rpx; margin-bottom: 32rpx }
.option-item { display: flex; align-items: center; gap: 24rpx; padding: 28rpx 32rpx; background: rgba(255,255,255,.05); border-radius: 16rpx; border: 1px solid var(--line-soft); transition: all .2s ease;
	&:active { background: rgba(255,255,255,.08); transform: scale(.98) }
}
.option-icon-text { font-size: 40rpx; width: 64rpx; text-align: center }
.option-text { flex: 1; font-size: 28rpx; color: #ffffff; font-weight: 500 }
.option-arrow { font-size: 48rpx; color: #595959 }

/* ── 操作日志 ── */
.audit-log-section { margin-bottom: 32rpx }
.audit-header { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 0 }
.audit-title { font-size: 26rpx; font-weight: 600; color: #fff }
.audit-toggle { font-size: 24rpx; color: #00D4FF }
.audit-body { display: flex; flex-direction: column; gap: 12rpx }
.log-item { padding: 16rpx 20rpx; border-radius: 12rpx; border-left: 4rpx solid; background: rgba(255,255,255,.04) }
.log-item.log-info { border-color: #00D4FF }
.log-item.log-warn { border-color: #FFA940 }
.log-item.log-danger { border-color: #FF4D4F }
.log-head { display: flex; justify-content: space-between; margin-bottom: 6rpx }
.log-action { font-size: 24rpx; font-weight: 600; color: #fff }
.log-time { font-size: 20rpx; color: #595959; font-family: 'Courier New', monospace }
.log-detail { font-size: 22rpx; color: rgba(255,255,255,.7) }
.log-empty { padding: 24rpx; text-align: center }
.log-empty-text { font-size: 24rpx; color: #595959 }

/* ── 增强版本信息 ── */
.version-info { display: flex; flex-direction: column; align-items: center; gap: 10rpx; padding: 32rpx 0; border-top: 1rpx solid rgba(255,255,255,.06) }
.version-text { font-size: 24rpx; color: rgba(255,255,255,.5); font-family: Courier New, monospace }
.version-meta-row { display: flex; align-items: center; gap: 10rpx }
.version-chip { padding: 4rpx 14rpx; border-radius: 20rpx; border: 1rpx solid; font-size: 20rpx; font-weight: 600 }
.chip-primary { background: rgba(0,212,255,.1); border-color: rgba(0,212,255,.3); color: #00D4FF }
.chip-secondary { background: rgba(115,209,61,.1); border-color: rgba(115,209,61,.3); color: #73D13D }
.version-sep { font-size: 20rpx; color: rgba(255,255,255,.2) }
.version-sync, .version-cache { font-size: 20rpx; color: #8c8c8c }
.copyright-text { font-size: 18rpx; color: #595959 }

.logout-section { margin-bottom: 32rpx }
</style>
