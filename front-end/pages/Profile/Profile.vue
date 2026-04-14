<template>
	<view class="profile-page">
		<!-- 全局网格背景 -->
		<view class="page-bg-grid"></view>
		<view class="profile-bg-glow"></view>
		<view class="profile-bg-glow-2"></view>
		<view class="profile-header">
			<text class="profile-header-title">个人中心</text>
			<view class="profile-header-badge" :class="{ 'badge--on-duty': onDuty }">
				<view class="badge-dot" :class="{ 'badge-dot--active': onDuty }"></view>
				<text class="badge-txt">{{ onDuty ? '执勤中' : '休整中' }}</text>
			</view>
		</view>
		<scroll-view class="content-scroll" scroll-y>
			<UserCard :userInfo="userInfo" :onDuty="onDuty" @dutyChange="handleDutyChange" />
			<AiModelManager :modelInfo="modelInfo" :updateAvailable="updateAvailable" @update="handleModelUpdate" />
			<SimilarityWeightPanel />

			<!-- 环境自适应模式开关 -->
			<view class="env-adaptive-section">
				<view class="eas-header">
					<view class="eas-title-row">
						<text class="eas-title">🌡️ 环境自适应</text>
						<text class="eas-title-en">Environment Adaptive</text>
					</view>
					<view class="eas-live-badge" :class="{ active: envAdaptiveEnabled }">
						<view class="eas-live-dot"></view>
						<text class="eas-live-text">{{ envAdaptiveEnabled ? '已启用' : '已禁用' }}</text>
					</view>
				</view>

				<view class="eas-desc">
					<text class="eas-desc-text">开启后，系统将根据光照强度自动切换白天/夜间模式，并根据温湿度、气压等环境参数动态调整传感器灵敏度，降低误报率。</text>
				</view>

				<view class="eas-toggle-row">
					<text class="eas-toggle-label">环境自适应模式</text>
					<switch class="eas-toggle" :checked="envAdaptiveEnabled" @change="toggleEnvAdaptive" color="#00D4FF" />
				</view>

				<view class="eas-items">
					<view class="eas-item" :class="{ enabled: envAdaptiveItems.nightMode }">
						<text class="eas-item-icon">🌙</text>
						<view class="eas-item-info">
							<text class="eas-item-name">夜间模式自适应</text>
							<text class="eas-item-desc">光照 &lt; 10 lux 时自动切换红外优先模式</text>
						</view>
						<view class="eas-item-status" :class="envAdaptiveItems.nightMode ? 'on' : 'off'">
							<text>{{ envAdaptiveItems.nightMode ? 'ON' : 'OFF' }}</text>
						</view>
					</view>

					<view class="eas-item" :class="{ enabled: envAdaptiveItems.weatherBoost }">
						<text class="eas-item-icon">🌧️</text>
						<view class="eas-item-info">
							<text class="eas-item-name">恶劣天气增强</text>
							<text class="eas-item-desc">风雨天气自动提升传感器灵敏度 50%</text>
						</view>
						<view class="eas-item-status" :class="envAdaptiveItems.weatherBoost ? 'on' : 'off'">
							<text>{{ envAdaptiveItems.weatherBoost ? 'ON' : 'OFF' }}</text>
						</view>
					</view>

					<view class="eas-item" :class="{ enabled: envAdaptiveItems.tempCompensation }">
						<text class="eas-item-icon">🌡️</text>
						<view class="eas-item-info">
							<text class="eas-item-name">红外温漂补偿</text>
							<text class="eas-item-desc">温湿度/气压修正红外热成像测量误差</text>
						</view>
						<view class="eas-item-status" :class="envAdaptiveItems.tempCompensation ? 'on' : 'off'">
							<text>{{ envAdaptiveItems.tempCompensation ? 'ON' : 'OFF' }}</text>
						</view>
					</view>

					<view class="eas-item" :class="{ enabled: envAdaptiveItems.visualProtection }">
						<text class="eas-item-icon">🛡️</text>
						<view class="eas-item-info">
							<text class="eas-item-name">夜间视觉保护</text>
							<text class="eas-item-desc">夜间自动降低屏幕蓝光，防止眩光</text>
						</view>
						<view class="eas-item-status" :class="envAdaptiveItems.visualProtection ? 'on' : 'off'">
							<text>{{ envAdaptiveItems.visualProtection ? 'ON' : 'OFF' }}</text>
						</view>
					</view>
				</view>

				<view class="eas-current-env" v-if="envAdaptiveEnabled">
					<text class="eas-current-title">当前环境状态</text>
					<view class="eas-env-grid">
						<view class="eas-env-item">
							<text class="eas-env-val">{{ currentEnvValues.temp }}°</text>
							<text class="eas-env-label">温度</text>
						</view>
						<view class="eas-env-item">
							<text class="eas-env-val">{{ currentEnvValues.humidity }}%</text>
							<text class="eas-env-label">湿度</text>
						</view>
						<view class="eas-env-item">
							<text class="eas-env-val">{{ currentEnvValues.modeText }}</text>
							<text class="eas-env-label">模式</text>
						</view>
						<view class="eas-env-item">
							<text class="eas-env-val" :class="currentEnvValues.weatherLevelClass">{{ currentEnvValues.weatherLevel }}</text>
							<text class="eas-env-label">天气</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 高级功能快捷入口（参考项目风格：2×3网格 + 脉冲动画） -->
			<view class="advanced-features-section">
				<view class="af-section-header">
					<view class="af-title-row">
						<text class="af-title">高级功能</text>
						<text class="af-title-en">Advanced Features</text>
					</view>
					<view class="af-live-badge">
						<view class="af-live-dot"></view>
						<text class="af-live-text">实时在线</text>
					</view>
				</view>
				<view class="af-grid">
					<view
						v-for="feat in filteredAdvancedFeatures"
						:key="feat.id"
						class="af-card"
						:style="{ background: feat.bgColor, borderColor: feat.color + '44' }"
						@tap="goAdvancedFeature(feat.path)"
					>
						<!-- 动态背景流光 -->
						<view class="af-card-flow" :style="{ background: feat.color }"></view>
						<view class="af-card-content">
							<view class="af-icon-shell" :style="{ background: feat.color + '22', boxShadow: '0 0 20rpx ' + feat.color + '33' }">
								<image class="af-icon-img" :src="feat.iconPng" mode="aspectFit" @error="onIconError($event, feat)"></image>
							</view>
							<view class="af-text-group">
								<text class="af-label" :style="{ color: feat.color }">{{ feat.label }}</text>
								<text class="af-sub">{{ feat.subLabel }}</text>
							</view>
							<view class="af-arrow-wrap" :style="{ color: feat.color }">
								<text class="af-arrow">›</text>
							</view>
						</view>
						<!-- 底部进度条 -->
						<view class="af-card-progress" :style="{ background: feat.color + '22' }">
							<view class="af-progress-fill" :style="{ width: feat.progress + '%', background: feat.color }"></view>
						</view>
					</view>
				</view>
			</view>

			<SecurityPanel :biometricEnabled="biometricEnabled" @biometricToggle="handleBiometricToggle" @emergencyDestroy="handleEmergencyDestroy" @logout="handleLogout" />
			<view class="profile-bottom-pad"></view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import UserCard      from './components/UserCard.vue'
import AiModelManager from './components/AiModelManager.vue'
import SecurityPanel  from './components/SecurityPanel.vue'
import SimilarityWeightPanel from './components/SimilarityWeightPanel.vue'
import { useAuthLogic } from './hooks/useAuthLogic.js'
import { authAPI } from '../../utils/request.js'

// 在组件顶层初始化 hook（修复：原代码在回调内部每次调用都新建实例）
const { handleLogout: authLogout } = useAuthLogic()

// ── 高级功能快捷入口（保留用户指定的6个核心功能 + 参考项目风格优化）────
// 图标说明：PNG统一放在 /static/icons/，请按文件名制作对应图标
const advancedFeatures = [
  {
    id: 'intelligence',
    label: '情报研判',
    subLabel: 'Intelligence',
    iconPng: '/static/icons/profile-advanced-intelligenc.png',
    color: '#722ED1',
    bgColor: 'rgba(114,46,209,0.12)',
    path: '/pages/Intelligence/Intelligence',
    progress: 78,
  },
  {
    id: 'command',
    label: '联合指挥',
    subLabel: 'Command Center',
    iconPng: '/static/icons/profile-advanced-command.png',
    color: '#00D4FF',
    bgColor: 'rgba(0,212,255,0.10)',
    path: '/pages/Command/Command',
    progress: 45,
  },
  {
    id: 'species',
    label: 'AR物种识别',
    subLabel: 'Species Recognition',
    iconPng: '/static/icons/profile-advanced-species-recognition.png',
    color: '#52C41A',
    bgColor: 'rgba(82,196,26,0.10)',
    path: '/pages/SpeciesRecognition/SpeciesRecognition',
    progress: 92,
  },
  {
    id: 'rapidtest',
    label: '现场快检',
    subLabel: 'Rapid Test',
    iconPng: '/static/icons/profile-advanced-rapid-test.png',
    color: '#FA8C16',
    bgColor: 'rgba(250,140,22,0.10)',
    path: '/pages/RapidTest/RapidTest',
    progress: 60,
  },
  {
    id: 'performance',
    label: '战果统计',
    subLabel: 'Performance',
    iconPng: '/static/icons/profile-advanced-performance.png',
    color: '#FF4D4F',
    bgColor: 'rgba(255,77,79,0.10)',
    path: '/pages/Performance/Performance',
    progress: 83,
  },
  {
    id: 'sync',
    label: '数据同步',
    subLabel: 'Sync Center',
    iconPng: '/static/icons/profile-advanced-sync.png',
    color: '#1890FF',
    bgColor: 'rgba(24,144,255,0.10)',
    path: '/pages/SyncCenter/SyncCenter',
    progress: 100,
  },
]

function goAdvancedFeature(path) {
  uni.navigateTo({ url: path })
  uni.vibrateShort && uni.vibrateShort()
}

// PNG加载失败时回退到emoji（占位符）
function onIconError(e, feat) {
	// 不做处理，图标不显示比崩溃好；生产环境可在这里设置fallback图标
}

const userInfo = ref({
	avatar: '/static/avatar.png',
	name: '加载中...',
	badgeNumber: '------',
	department: '热眼擒枭边境防控中心',
	rank: '生态警务执法员',
	squad: '',
	dutyZone: ''
})

// 根据用户角色过滤高级功能（管理后台仅对admin/commander可见）
const filteredAdvancedFeatures = computed(() => {
	const role = userInfo.value.role
	return advancedFeatures.filter(f => {
		if (!f.roles) return true
		return f.roles.includes(role)
	})
})
const onDuty         = ref(false)
const biometricEnabled = ref(false)
const updateAvailable  = ref(true)

const modelInfo   = ref({ version: 'V3.1', name: '活体物种识别AI模型 + 走私车辆识别AI模型', size: 128 })

// ===== 环境自适应模式 =====
const envAdaptiveEnabled = ref(false)
const envAdaptiveItems = ref({
	nightMode: false,        // 夜间模式自适应
	weatherBoost: false,      // 恶劣天气增强
	tempCompensation: false,  // 红外温漂补偿
	visualProtection: false   // 夜间视觉保护
})

// 当前环境参数（模拟数据，实际由传感器实时上报）
const currentEnvValues = ref({
	temp: '--',
	humidity: '--',
	mode: 'day',
	modeText: '白天',
	weatherLevel: '正常',
	weatherLevelClass: 'env-normal'
})

function toggleEnvAdaptive(e) {
	envAdaptiveEnabled.value = e.detail.value
	uni.setStorageSync('env_adaptive_enabled', envAdaptiveEnabled.value)

	if (envAdaptiveEnabled.value) {
		uni.showToast({ title: '环境自适应已开启', icon: 'none' })
		// 启动环境参数监听
		startEnvMonitor()
	} else {
		uni.showToast({ title: '环境自适应已关闭', icon: 'none' })
		stopEnvMonitor()
	}
	uni.vibrateShort()
}

let envMonitorTimer = null
function startEnvMonitor() {
	if (envMonitorTimer) clearInterval(envMonitorTimer)
	updateEnvValues()
	envMonitorTimer = setInterval(updateEnvValues, 10000)
}

function stopEnvMonitor() {
	if (envMonitorTimer) {
		clearInterval(envMonitorTimer)
		envMonitorTimer = null
	}
}

function updateEnvValues() {
	const lux = Math.round(Math.random() * 1200)
	const temp = Math.round((24 + Math.random() * 10) * 10) / 10
	const humidity = Math.round(50 + Math.random() * 45)
	const windSpeed = Math.round(Math.random() * 20 * 10) / 10

	// 计算昼夜模式
	let mode = 'day'
	let modeText = '白天'
	if (lux < 10) { mode = 'night'; modeText = '夜间' }
	else if (lux < 100) { mode = 'dusk'; modeText = '黄昏' }

	// 计算天气等级
	let weatherLevel = '正常'
	let weatherLevelClass = 'env-normal'
	if (windSpeed >= 17.1) { weatherLevel = '恶劣'; weatherLevelClass = 'env-severe' }
	else if (windSpeed >= 10.7) { weatherLevel = '警告'; weatherLevelClass = 'env-warning' }
	else if (windSpeed >= 5.5) { weatherLevel = '注意'; weatherLevelClass = 'env-caution' }

	// 更新夜间模式开关状态
	if (mode === 'night') envAdaptiveItems.value.nightMode = true
	else if (mode === 'dusk') envAdaptiveItems.value.nightMode = false

	// 更新天气增强开关状态
	envAdaptiveItems.value.weatherBoost = weatherLevel !== '正常'

	currentEnvValues.value = {
		temp,
		humidity,
		mode,
		modeText,
		weatherLevel,
		weatherLevelClass
	}
}

// 从本地存储恢复环境自适应设置
function loadEnvAdaptiveSettings() {
	const saved = uni.getStorageSync('env_adaptive_enabled')
	if (saved !== '') {
		envAdaptiveEnabled.value = saved
		if (envAdaptiveEnabled.value) startEnvMonitor()
	}
}

// 从API加载用户信息，失败时降级到本地缓存
async function loadUserInfo() {
	// 先从本地缓存恢复，快速显示
	const cached = uni.getStorageSync('user_info')
	if (cached) {
		userInfo.value  = { ...userInfo.value, ...cached }
	}
	onDuty.value = uni.getStorageSync('on_duty') || false
	biometricEnabled.value = uni.getStorageSync('biometric_enabled') || false
	const cachedRole = uni.getStorageSync('user_role')
	if (cachedRole) userInfo.value.role = cachedRole

	// 再从API获取最新数据
	try {
		const res = await authAPI.getMe()
		if (res) {
			const u = res
			userInfo.value = {
				role:         u.role         || '',
				avatar:       u.avatar      || '/static/avatar.png',
				name:         u.name        || u.username,
				badgeNumber:  u.badge_number || u.badgeNumber || '------',
				department:   u.department  || '热眼擒枭边境防控中心',
				rank:         u.rank        || '生态警务执法员',
				squad:        u.squad       || '',
				dutyZone:     u.duty_zone   || ''
			}
			if (u.role)         uni.setStorageSync('user_role', u.role)
			uni.setStorageSync('user_info', userInfo.value)
		}
	} catch (e) {
		console.warn('[Profile] API不可用，使用本地缓存:', e.message)
	}
}

function handleDutyChange(status) {
	onDuty.value = status
	uni.setStorageSync('on_duty', status)
	uni.showToast({ title: status ? '已进入执勤模式' : '已切换至休整模式', icon: status ? 'success' : 'none' })
	uni.vibrateShort()
	// 同步状态到后端
	authAPI.updateStatus({ status: status ? 'busy' : 'online' }).catch(() => {})
}

function handleModelUpdate() {
	uni.showLoading({ title: '更新中...' })
	setTimeout(() => {
		modelInfo.value.version = 'V2.5'
		modelInfo.value.name    = '全天候目标识别版'
		updateAvailable.value   = false
		const d = new Date()
		const pad = n => String(n).padStart(2, '0')
		const ts = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
		uni.setStorageSync('model_last_update', ts)
		uni.hideLoading()
		uni.showToast({ title: '更新成功', icon: 'success' })
	}, 3000)
	uni.vibrateShort()
}

function handleBiometricToggle(enabled) {
	biometricEnabled.value = enabled
	uni.setStorageSync('biometric_enabled', enabled)
	uni.showToast({ title: enabled ? '生物识别已开启' : '生物识别已关闭', icon: 'none' })
	uni.vibrateShort()
}

function handleEmergencyDestroy() {
	uni.showModal({
		title: '紧急数据销毁',
		content: '此操作将清除所有本地缓存证据，且不可恢复。确认执行？',
		confirmText: '确认销毁', confirmColor: '#FF4D4F',
		success: (res) => {
			if (res.confirm) {
				uni.showLoading({ title: '销毁中...', mask: true })
				;['temp_evidence_cache','offline_evidence','pending_uploads',
				  'captured_images','voice_records'].forEach(k => uni.removeStorageSync(k))
				setTimeout(() => { uni.hideLoading(); uni.showToast({ title: '数据已销毁', icon: 'success' }) }, 1500)
			}
		}
	})
	uni.vibrateShort()
}

async function handleLogout() {
	uni.showModal({
		title: '退出登录', content: '确认退出当前账号？',
		success: async (res) => {
			if (res.confirm) {
				uni.showLoading({ title: '退出中...' })
				try {
					await authLogout()  // 使用顶层初始化的实例
				} catch {
					uni.hideLoading()
					uni.showToast({ title: '退出失败', icon: 'none' })
				}
				// 无论成功还是失败都强制跳转登录页
				uni.reLaunch({ url: '/pages/login/index' })
			}
		}
	})
	uni.vibrateShort()
}

onLoad(() => {
	loadUserInfo()
	loadEnvAdaptiveSettings()
})
</script>

<style lang="scss" scoped>
/* ==========================================
   全局暗色战术背景
   ========================================== */
.page-bg-grid {
	position: fixed; top: 0; left: 0; right: 0; bottom: 0;
	background-image:
		linear-gradient(rgba(0,212,255,.02) 1px, transparent 1px),
		linear-gradient(90deg, rgba(0,212,255,.02) 1px, transparent 1px);
	background-size: 60rpx 60rpx;
	pointer-events: none; z-index: 0;
}
.profile-bg-glow {
	position: fixed; top: -200rpx; right: -100rpx; width: 600rpx; height: 600rpx;
	background: radial-gradient(circle, rgba(0,212,255,.07) 0%, transparent 65%);
	pointer-events: none; z-index: 0;
}
.profile-bg-glow-2 {
	position: fixed; bottom: 0; left: -200rpx; width: 800rpx; height: 800rpx;
	background: radial-gradient(circle, rgba(114,46,209,.05) 0%, transparent 60%);
	pointer-events: none; z-index: 0;
}

/* ==========================================
   页面主容器 & 滚动区
   ========================================== */
.profile-page { width: 100vw; height: 100vh; background: transparent; display: flex; flex-direction: column }
.content-scroll { position: relative; z-index: 5; flex: 1; overflow: hidden }

/* ==========================================
   顶部Header
   ========================================== */
.profile-header {
	position: sticky; top: 0; z-index: 20;
	display: flex; align-items: center; justify-content: space-between;
	padding: calc(env(safe-area-inset-top) + 24rpx) calc(40rpx + env(safe-area-inset-left)) 24rpx calc(40rpx + env(safe-area-inset-right));
	background: linear-gradient(180deg, rgba(10,14,26,.98) 0%, transparent 100%);
}
.profile-header-title { font-size: 40rpx; font-weight: 800; color: #fff; letter-spacing: 2rpx }
.profile-header-badge {
	display: flex; align-items: center; gap: 10rpx;
	padding: 10rpx 20rpx; border-radius: 100rpx;
	background: rgba(12,27,42,.94);
	border: 1px solid rgba(0,212,255,.2);
	transition: all .3s ease;
	&.badge--on-duty { border-color: rgba(115,209,61,.4); background: rgba(115,209,61,.08) }
}
.badge-dot { width: 14rpx; height: 14rpx; border-radius: 50%; background: #595959; transition: background .3s ease, box-shadow .3s ease }
.badge-dot--active { background: #73D13D !important; box-shadow: 0 0 8rpx #73D13D; animation: dot-pulse 1.5s ease-in-out infinite }
@keyframes dot-pulse { 0%,100%{box-shadow:0 0 4rpx #73D13D} 50%{box-shadow:0 0 16rpx #73D13D} }
.badge-txt { font-size: 22rpx; color: rgba(255,255,255,.7); font-weight: 600 }

/* ==========================================
   底部占位
   ========================================== */
.profile-bottom-pad { height: calc(40rpx + env(safe-area-inset-bottom)) }

/* ==========================================
   通用工具类
   ========================================== */
.frosted-card { background: rgba(12,27,42,.88); backdrop-filter: blur(40rpx) saturate(180%); border-radius: 24rpx; border: 1px solid var(--line-soft); box-shadow: 0 8rpx 32rpx rgba(0,0,0,.6) }
.holographic-border { position: relative; border: 2px solid var(--brand-primary); box-shadow: 0 0 20rpx rgba(0,212,255,.4), inset 0 0 20rpx rgba(0,212,255,.1);
	&::before { content: ''; position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(45deg, transparent 0%, rgba(0,212,255,.3) 50%, transparent 100%); border-radius: inherit; animation: borderFlow 3s linear infinite; pointer-events: none }
}
@keyframes borderFlow { 0%{background-position:0% 0%} 100%{background-position:200% 200%} }
.scan-ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 100%; height: 100%; border-radius: 50%; border: 2px solid var(--brand-primary); animation: scanPulse 2s ease-out infinite }
@keyframes scanPulse { 0%{transform:translate(-50%,-50%) scale(1);opacity:1} 100%{transform:translate(-50%,-50%) scale(1.5);opacity:0} }
.monospace-text { font-family: 'Courier New','Consolas',monospace; letter-spacing: 2rpx }
.glow-text { text-shadow: 0 0 20rpx currentColor;
	&.primary { color: var(--brand-primary); text-shadow: 0 0 20rpx var(--brand-primary) }
	&.success { color: #73D13D; text-shadow: 0 0 20rpx #73D13D }
	&.warning { color: #FFA940; text-shadow: 0 0 20rpx #FFA940 }
	&.danger  { color: #FF4D4F; text-shadow: 0 0 20rpx #FF4D4F }
}
.inset-divider { height: 1px; background: transparent; box-shadow: inset 0 1px 2px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.05); margin: 32rpx 0 }
.physical-switch { position: relative; width: 120rpx; height: 64rpx; background: rgba(89,89,89,.5); border-radius: 32rpx; border: 2px solid rgba(255,255,255,.1); box-shadow: inset 0 4rpx 8rpx rgba(0,0,0,.5); transition: all .3s ease;
	&.active { background: linear-gradient(135deg,#73D13D 0%,#52c41a 100%); border-color: #73D13D; box-shadow: inset 0 4rpx 8rpx rgba(0,0,0,.3), 0 0 20rpx rgba(115,209,61,.6) }
}
.switch-slider { position: absolute; top: 4rpx; left: 4rpx; width: 52rpx; height: 52rpx; background: linear-gradient(135deg,#fff 0%,#e0e0e0 100%); border-radius: 50%; box-shadow: 0 4rpx 8rpx rgba(0,0,0,.3); transition: all .3s ease;
	.active & { left: 60rpx }
}
.medal-icon { position: relative; width: 80rpx; height: 80rpx;
	&.earned { animation: medalShine 2s ease-in-out infinite }
	&.locked { opacity: .3; filter: grayscale(1) }
}
@keyframes medalShine { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.05);filter:brightness(1.2)} }
.progress-bar { width: 100%; height: 12rpx; background: rgba(255,255,255,.1); border-radius: 6rpx; overflow: hidden; box-shadow: inset 0 2rpx 4rpx rgba(0,0,0,.3) }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--brand-primary) 0%, #00f2fe 100%); border-radius: 6rpx; box-shadow: 0 0 10rpx var(--brand-primary); transition: width .3s ease;
	position: relative;
	&::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.3) 50%, transparent 100%); animation: progressShine 2s linear infinite }
}
@keyframes progressShine { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
.danger-button { width: 100%; height: 96rpx; background: rgba(255,77,79,.1); border: 2px solid #FF4D4F; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: 700; color: #FF4D4F; box-shadow: 0 0 20rpx rgba(255,77,79,.3), inset 0 0 20rpx rgba(255,77,79,.1); transition: all .3s ease;
	&:active { transform: scale(.98); background: rgba(255,77,79,.2); box-shadow: 0 0 30rpx rgba(255,77,79,.6), inset 0 0 30rpx rgba(255,77,79,.2) }
}
.data-card { padding: 32rpx; margin: 0 32rpx 24rpx; background: rgba(12,27,42,.88); border-radius: 24rpx; border: 1px solid var(--line-soft); box-shadow: 0 8rpx 32rpx rgba(0,0,0,.6) }
.card-title { font-size: 32rpx; font-weight: 700; color: #EAF6FF; margin-bottom: 24rpx; display: flex; align-items: center; gap: 12rpx;
	&::before { content: ''; width: 6rpx; height: 32rpx; background: linear-gradient(180deg, var(--brand-primary) 0%, #00f2fe 100%); border-radius: 3rpx; box-shadow: 0 0 10rpx var(--brand-primary) }
}
.flex-center { display: flex; align-items: center; justify-content: center }
.flex-between { display: flex; align-items: center; justify-content: space-between }
.flex-column { display: flex; flex-direction: column }
.text-xs { font-size: 20rpx } .text-sm { font-size: 24rpx } .text-base { font-size: 28rpx } .text-lg { font-size: 32rpx } .text-xl { font-size: 48rpx } .text-2xl { font-size: 64rpx }
.mt-xs { margin-top: 8rpx } .mt-sm { margin-top: 16rpx } .mt-md { margin-top: 24rpx } .mt-lg { margin-top: 32rpx }
.mb-xs { margin-bottom: 8rpx } .mb-sm { margin-bottom: 16rpx } .mb-md { margin-bottom: 24rpx } .mb-lg { margin-bottom: 32rpx }
.p-xs { padding: 8rpx } .p-sm { padding: 16rpx } .p-md { padding: 24rpx } .p-lg { padding: 32rpx }

/* ==========================================
   高级功能入口
   ========================================== */
.advanced-features-section { margin: 0 32rpx 24rpx; position: relative; z-index: 5 }
.af-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; padding-top: 8rpx }
.af-title-row { display: flex; flex-direction: column; gap: 4rpx }
.af-title { font-size: 28rpx; font-weight: 700; color: #EAF6FF }
.af-title-en { font-size: 18rpx; color: #4A6A8A; letter-spacing: 1rpx }
.af-live-badge { display: flex; align-items: center; gap: 8rpx; padding: 6rpx 16rpx; background: rgba(115,209,61,.1); border: 1px solid rgba(115,209,61,.3); border-radius: 20rpx }
.af-live-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background: #73D13D; animation: dot-pulse 2s ease-in-out infinite }
.af-live-text { font-size: 18rpx; color: #73D13D; font-weight: 600 }
.af-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx }
.af-card { position: relative; display: flex; flex-direction: column; padding: 24rpx 20rpx 16rpx; border-radius: 20rpx; border: 1px solid rgba(255,255,255,.08); overflow: hidden; transition: transform .15s ease, opacity .15s ease;
	&:active { transform: scale(.97); opacity: .88 }
}
.af-card-flow { position: absolute; top: 0; left: 0; width: 100%; height: 4rpx; opacity: .6; animation: flowBar 3s linear infinite infinite }
@keyframes flowBar { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
.af-card-content { display: flex; align-items: center; gap: 16rpx; margin-bottom: 12rpx }
.af-icon-shell { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: box-shadow .25s ease;
	&:active { transform: scale(.9) }
}
.af-icon-img { width: 40rpx; height: 40rpx }
.af-text-group { flex: 1; display: flex; flex-direction: column; gap: 4rpx }
.af-label { font-size: 26rpx; font-weight: 700 }
.af-sub { font-size: 18rpx; color: #4A6A8A }
.af-arrow-wrap { display: flex; align-items: center; justify-content: center; width: 40rpx; height: 40rpx }
.af-arrow { font-size: 40rpx; font-weight: 300; opacity: .6 }
.af-card-progress { height: 4rpx; background: rgba(255,255,255,.06); border-radius: 2rpx; overflow: hidden }
.af-progress-fill { height: 100%; border-radius: 2rpx; transition: width .4s ease }
.af-device-badges { display: flex; gap: 8rpx; margin-left: auto; margin-right: 8rpx }
.device-badge { padding: 4rpx 12rpx; border-radius: 20rpx; font-size: 20rpx; font-weight: 700; font-family: 'Courier New',monospace;
	.online { background: rgba(115,209,61,.15); color: #73D13D; border: 1rpx solid rgba(115,209,61,.3) }
	.offline { background: rgba(255,77,79,.1); color: #FF4D4F }
}

/* ==========================================
   响应式
   ========================================== */
@media (orientation: landscape) {
	.profile-header { padding-top: calc(env(safe-area-inset-top) + 12rpx); padding-bottom: 12rpx }
	.profile-header-title { font-size: 32rpx }
	.profile-header-badge { padding: 8rpx 14rpx }
}
@media (min-width: 768px) {
	.profile-page { max-width: 1200rpx; margin: 0 auto }
	.profile-header-title { font-size: 44rpx }
	.content-scroll { padding: 0 12rpx }
}
@media (max-width: 375px) {
	.profile-header { padding-left: calc(20rpx + env(safe-area-inset-left)); padding-right: calc(20rpx + env(safe-area-inset-right)) }
	.profile-header-title { font-size: 34rpx }
}

/* ===== 环境自适应模式样式 ===== */
.env-adaptive-section {
	margin: 0 30rpx 30rpx;
	padding: 24rpx;
	background: #0C1B2A;
	border-radius: 24rpx;
	border: 1px solid #1A3350;
}

.eas-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 16rpx;
}
.eas-title-row {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}
.eas-title { font-size: 30rpx; font-weight: 700; color: #E8F4FF; }
.eas-title-en { font-size: 18rpx; color: #7AA8CC; }
.eas-live-badge {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 6rpx 14rpx;
	border-radius: 20rpx;
	background: rgba(255, 77, 79, 0.1);
	border: 1px solid rgba(255, 77, 79, 0.2);
	.eas-live-dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: #595959;
	}
	&.active {
		background: rgba(0, 212, 255, 0.1);
		border-color: rgba(0, 212, 255, 0.3);
		.eas-live-dot { background: #00D4FF; box-shadow: 0 0 8rpx rgba(0, 212, 255, 0.6); }
	}
}
.eas-live-text { font-size: 20rpx; font-weight: 600; color: #595959; }
.eas-live-badge.active .eas-live-text { color: #00D4FF; }

.eas-desc {
	margin-bottom: 18rpx;
	padding: 14rpx 16rpx;
	background: rgba(0, 212, 255, 0.05);
	border-radius: 12rpx;
	border: 1px solid rgba(0, 212, 255, 0.12);
	.eas-desc-text { font-size: 22rpx; color: #7AA8CC; line-height: 1.5; }
}

.eas-toggle-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16rpx 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	margin-bottom: 16rpx;
}
.eas-toggle-label { font-size: 26rpx; font-weight: 700; color: #E8F4FF; }

.eas-items {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	margin-bottom: 20rpx;
}

.eas-item {
	display: flex;
	align-items: center;
	gap: 14rpx;
	padding: 16rpx 18rpx;
	background: rgba(255, 255, 255, 0.03);
	border-radius: 14rpx;
	border: 1px solid rgba(255, 255, 255, 0.06);
	&.enabled {
		background: rgba(0, 212, 255, 0.06);
		border-color: rgba(0, 212, 255, 0.2);
	}
}
.eas-item-icon { font-size: 32rpx; flex-shrink: 0; width: 48rpx; text-align: center; }
.eas-item-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.eas-item-name { font-size: 24rpx; font-weight: 600; color: #E8F4FF; }
.eas-item-desc { font-size: 20rpx; color: #4A6A8A; }
.eas-item-status {
	padding: 4rpx 14rpx;
	border-radius: 8rpx;
	font-size: 20rpx;
	font-weight: 700;
	flex-shrink: 0;
	&.on { background: rgba(0, 212, 255, 0.15); color: #00D4FF; }
	&.off { background: rgba(255, 255, 255, 0.06); color: #4A6A8A; }
}

.eas-current-env {
	padding: 18rpx;
	background: rgba(0, 212, 255, 0.05);
	border-radius: 14rpx;
	border: 1px solid rgba(0, 212, 255, 0.15);
}
.eas-current-title { font-size: 22rpx; font-weight: 700; color: #7fe7ff; display: block; margin-bottom: 14rpx; }
.eas-env-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12rpx;
}
.eas-env-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6rpx;
	padding: 12rpx 8rpx;
	background: rgba(255, 255, 255, 0.04);
	border-radius: 10rpx;
	.eas-env-val {
		font-size: 28rpx;
		font-weight: 800;
		color: #E8F4FF;
		font-family: 'Courier New', monospace;
	}
	.eas-env-label { font-size: 18rpx; color: #4A6A8A; }
}
.eas-env-val.env-normal { color: #52C41A; }
.eas-env-val.env-caution { color: #FFA940; }
.eas-env-val.env-warning { color: #FF7A45; }
.eas-env-val.env-severe { color: #FF4D4F; }
</style>
