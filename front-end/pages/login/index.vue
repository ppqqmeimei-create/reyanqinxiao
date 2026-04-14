<template>
	<view class="login-page">
		<!-- 背景层 -->
		<view class="bg-grid"></view>
		<view class="bg-glow-top"></view>
		<view class="bg-glow-bottom"></view>
		
		<!-- 广西边境线地图剪影 -->
		<view class="bg-border-map">
			<svg viewBox="0 0 400 700" xmlns="http://www.w3.org/2000/svg" class="border-svg">
				<!-- 西侧沿边山路走势 -->
				<path d="M 20 680 Q 30 660 35 640 Q 25 620 20 600 Q 15 580 10 560 Q 20 540 30 520 Q 20 500 15 480 Q 25 460 40 440 Q 35 420 25 400 Q 20 380 15 360 Q 10 340 5 320 Q 15 300 30 280 Q 20 260 15 240 Q 10 220 5 200 Q 15 180 30 160 Q 20 140 10 120 Q 20 100 35 80 Q 25 60 20 40" stroke="rgba(0,212,255,0.12)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
				<!-- 中部边境走廊示意 -->
				<path d="M 40 440 Q 60 430 80 420 Q 100 415 120 400 Q 130 380 125 360 Q 110 340 95 320 Q 100 300 115 280 Q 130 260 145 240 Q 140 220 135 200 Q 120 180 100 160 Q 110 140 130 120 Q 120 100 115 80 Q 110 60 105 40" stroke="rgba(0,212,255,0.10)" stroke-width="1" fill="none" stroke-linecap="round" stroke-dasharray="6 4"/>
				<!-- 东侧沿海岸线 -->
				<path d="M 120 400 Q 150 395 180 390 Q 210 385 240 370 Q 260 355 280 335 Q 295 315 310 290 Q 325 265 340 240 Q 350 215 360 190 Q 365 165 370 140 Q 368 115 365 90 Q 358 65 350 45" stroke="rgba(0,212,255,0.08)" stroke-width="1" fill="none" stroke-linecap="round" stroke-dasharray="4 6"/>
				<!-- 节点示意 A -->
				<circle cx="90" cy="360" r="3" fill="rgba(0,212,255,0.35)"/>
				<circle cx="90" cy="360" r="6" fill="none" stroke="rgba(0,212,255,0.2)" stroke-width="1"/>
				<!-- 节点示意 B -->
				<circle cx="300" cy="250" r="3" fill="rgba(0,212,255,0.25)"/>
				<circle cx="300" cy="250" r="5" fill="none" stroke="rgba(0,212,255,0.15)" stroke-width="1"/>
				<!-- 西侧节点 -->
				<circle cx="35" cy="520" r="3" fill="rgba(0,212,255,0.2)"/>
				<!-- 北部湾海岸示意 -->
				<path d="M 280 400 Q 320 395 360 385 Q 390 375 395 355 Q 392 335 390 310" stroke="rgba(0,150,255,0.07)" stroke-width="2" fill="none" stroke-linecap="round"/>
			</svg>
		</view>

		<!-- 品牌区 -->
		<view class="brand-section">
			<!-- Logo区域 -->
			<view class="logo-wrap">
				<view class="logo-ring ring-1"></view>
				<view class="logo-ring ring-2"></view>
				<view class="logo-core">
					<image class="logo-img" :src="logoSrc" mode="aspectFit" />
				</view>
			</view>
			
			<!-- 产品名称 -->
			<text class="app-name">热眼擒枭</text>
			<text class="app-en">BORDER WILDLIFE ANTI-SMUGGLING SYSTEM</text>
			
			<!-- 产品定位标签 -->
			<view class="product-tag">
				<view class="tag-dot"></view>
				<text class="tag-text">边境活物走私智能防控平台</text>
			</view>
			
			<!-- 广西边境县（市、区）执法覆盖示意（试点口岸在业务模块中突出） -->
			<view class="zone-tags">
				<view class="zone-tag" v-for="zone in zones" :key="zone.name">
					<text class="zone-dot" :style="{background: zone.color}"></text>
					<text class="zone-name">{{ zone.name }}</text>
				</view>
			</view>
		</view>

		<!-- 表单区 -->
		<view class="form-section">
			<view class="form-card">
				
				<!-- 用户身份选择 -->
				<view class="section-header">
					<view class="section-accent"></view>
					<text class="section-title">选择身份</text>
				</view>
				<view class="cat-row">
					<view
						v-for="cat in userCategories"
						:key="cat.value"
						class="cat-tab"
						:class="{ active: selectedCategory === cat.value }"
						@tap="selectCategory(cat.value)"
					>
						<text class="cat-icon">{{ cat.icon }}</text>
						<text class="cat-name">{{ cat.label }}</text>
					</view>
				</view>

				<!-- 登录方式选择 -->
				<view class="section-header" style="margin-top: 24rpx">
					<view class="section-accent"></view>
					<text class="section-title">登录方式</text>
				</view>
				<view class="method-row">
					<view class="method-tab" :class="{ active: loginMethod === 'password' }" @tap="loginMethod = 'password'">
						<text class="method-icon">🔐</text>
						<text class="method-name">密码登录</text>
					</view>
					<view class="method-tab" :class="{ active: loginMethod === 'biometric' }" @tap="loginMethod = 'biometric'">
						<text class="method-icon">👆</text>
						<text class="method-name">生物识别</text>
					</view>
					<view class="method-tab" :class="{ active: loginMethod === 'offline' }" @tap="loginMethod = 'offline'">
						<text class="method-icon">📡</text>
						<text class="method-name">离线登录</text>
					</view>
				</view>

				<!-- 锁定提示 -->
				<view v-if="isLocked" class="lock-warning">
					<text class="lock-text">⚠ 账号已锁定，请 {{ lockCountdown }} 秒后重试</text>
				</view>

				<!-- 密码登录表单 -->
				<view v-if="loginMethod === 'password'" class="login-form">
					<view class="form-group">
						<text class="form-label">警号 / 用户名</text>
						<view class="input-row" :class="{ focused: badgeFocused, 'input-error': fieldError === 'badge' }">
							<text class="input-prefix">ID</text>
							<input
								class="form-input"
								v-model="badgeNumber"
								placeholder="请输入警号"
								placeholder-class="ph"
								:disabled="isLocked"
								@focus="badgeFocused=true;fieldError=''"
								@blur="badgeFocused=false"
							/>
						</view>
					</view>
					<view class="form-group">
						<text class="form-label">密码</text>
						<view class="input-row" :class="{ focused: passFocused, 'input-error': fieldError === 'pass' }">
							<text class="input-prefix">🔒</text>
							<input
								class="form-input"
								:type="showPass ? 'text' : 'password'"
								v-model="password"
								placeholder="请输入密码"
								placeholder-class="ph"
								:disabled="isLocked"
								@focus="passFocused=true;fieldError=''"
								@blur="passFocused=false"
								@confirm="handleLogin"
							/>
							<text class="eye-btn" @tap="showPass=!showPass">{{ showPass ? '🙈' : '👁' }}</text>
						</view>
					</view>
				</view>

				<!-- 生物识别 -->
				<view v-if="loginMethod === 'biometric'" class="bio-section">
					<text class="form-label">选择识别方式</text>
					<view class="method-row" style="margin-top: 16rpx">
						<view
							v-for="m in biometricMethods"
							:key="m.key"
							class="method-tab"
							:class="{ active: selectedBiometric === m.key }"
							@tap="selectedBiometric = m.key"
						>
							<text class="method-icon">{{ m.icon }}</text>
							<text class="method-name">{{ m.name }}</text>
						</view>
					</view>
					<view class="hint-box">
						<text class="hint-text">请将 {{ getBiometricName(selectedBiometric) }} 对准摄像头</text>
					</view>
				</view>

				<!-- 离线登录提示 -->
				<view v-if="loginMethod === 'offline'" class="hint-box offline-hint">
					<text class="hint-text">将使用本地缓存凭证登录，部分功能受限</text>
				</view>

				<!-- 错误提示 -->
				<view v-if="errorMsg" class="error-hint">
					<text class="error-text">⚠ {{ errorMsg }}</text>
					<text v-if="failCount > 0 && !isLocked" class="fail-count">剩余 {{ MAX_ATTEMPTS - failCount }} 次</text>
				</view>

				<!-- 登录按钮 -->
				<view 
					class="login-btn" 
					:class="{ 'btn-loading': isLoading, 'btn-disabled': isLocked }" 
					@tap="handleLogin"
				>
					<view v-if="isLoading" class="spinner"></view>
					<text v-else class="login-btn-text">登 录</text>
				</view>
			</view>

			<!-- 演示模式和离线入口 -->
			<view class="quick-btn demo-btn" @tap="handleDemoLogin">
				<view class="quick-left">
					<text class="quick-icon">🚀</text>
					<view class="quick-info">
						<text class="quick-title">演示模式</text>
						<text class="quick-sub">无需后端，直接体验全部功能</text>
					</view>
				</view>
				<text class="quick-arrow">›</text>
			</view>

			<view class="quick-btn offline-entry" @tap="handleOfflineLogin">
				<view class="quick-left">
					<text class="quick-icon">📡</text>
					<view class="quick-info">
						<text class="quick-title">离线凭证登录</text>
						<text class="quick-sub">无网络环境使用本地凭证</text>
					</view>
				</view>
				<text class="quick-arrow">›</text>
			</view>
		</view>

		<!-- 紧急案件快速入口 -->
		<view 
			class="emergency-entry"
			@touchstart="onEmergencyTouchStart"
			@touchend="onEmergencyTouchEnd"
		>
			<text class="emergency-icon">🚨</text>
			<text class="emergency-text">紧 急 上 报</text>
			<view class="emergency-progress" :style="{ width: emergencyHoldProgress + '%' }"></view>
		</view>

		<!-- 底部声明 -->
		<view class="login-footer">
			<view class="sys-status-bar">
				<view class="status-item">
					<view class="status-dot online"></view>
					<text class="status-label">广西边境执法终端就绪</text>
				</view>
				<text class="status-sep">·</text>
				<text class="status-version">v{{ APP_VERSION }}</text>
			</view>
			<text class="footer-warn">本系统仅限授权执法人员使用 · 未授权访问将被记录追责</text>
			<text class="footer-legal">© 热眼擒枭项目组 · 边境活物走私智能防控平台</text>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { saveLoginState, navigateAfterLogin } from '@/utils/auth.js'
import {
	userCategories,
	biometricMethods,
	loginZoneTags as zones,
	loginTheme
} from '@/pages/login/utils/loginConfig.js'
import { authAPI } from '@/utils/request.js'

// ===== 角色映射 =====
const C2R = {
	frontline:     'frontline',
	investigator:  'investigator',
	commander:     'commander'
}

const logoSrc = loginTheme.logoSrc

// ===== 状态变量 =====
const badgeNumber        = ref('')
const password           = ref('')
const showPass           = ref(false)
const isLoading          = ref(false)
const badgeFocused       = ref(false)
const passFocused        = ref(false)
const errorMsg           = ref('')
const fieldError         = ref('')
const failCount          = ref(0)
const isLocked           = ref(false)
const lockCountdown      = ref(0)
const MAX_ATTEMPTS       = 5
const APP_VERSION        = loginTheme.version
const selectedCategory   = ref('frontline')
const loginMethod        = ref('password')
const selectedBiometric = ref('fingerprint')
const emergencyHoldProgress = ref(0)
const HOLD_DURATION = 3000

let lockTimer = null
let emergencyTimer = null

// ===== 函数 =====
function getBiometricName(key) {
	return biometricMethods.find(m => m.key === key)?.name || '生物识别'
}

function selectCategory(val) {
	selectedCategory.value = val
	try { uni.vibrateShort() } catch (e) {}
}

onLoad(() => {
	const t = uni.getStorageSync('token') || uni.getStorageSync('user_token')
	const expiry = uni.getStorageSync('token_expiry')
	if (t && (!expiry || Date.now() < expiry)) {
		const info = uni.getStorageSync('user_info') || {}
		navigateAfterLogin(info.role || 'investigator')
		return
	}
	if (t && expiry && Date.now() >= expiry) {
		uni.removeStorageSync('token')
		uni.removeStorageSync('user_token')
		uni.removeStorageSync('user_info')
		uni.removeStorageSync('token_expiry')
	}
	failCount.value = uni.getStorageSync('login_fail_count') || 0
	const lu = uni.getStorageSync('login_lock_until')
	if (lu && Date.now() < lu) startLockCountdown(Math.ceil((lu - Date.now()) / 1000))
})

onUnload(() => { 
	if (lockTimer) clearInterval(lockTimer)
	if (emergencyTimer) clearInterval(emergencyTimer)
})

function startLockCountdown(s) {
	isLocked.value = true
	lockCountdown.value = s
	if (lockTimer) clearInterval(lockTimer)
	lockTimer = setInterval(() => {
		lockCountdown.value--
		if (lockCountdown.value <= 0) {
			clearInterval(lockTimer)
			isLocked.value = false
			failCount.value = 0
			uni.removeStorageSync('login_lock_until')
			uni.removeStorageSync('login_fail_count')
		}
	}, 1000)
}

function recordFailure() {
	failCount.value++
	uni.setStorageSync('login_fail_count', failCount.value)
	if (failCount.value >= MAX_ATTEMPTS) {
		const s = 60
		uni.setStorageSync('login_lock_until', Date.now() + s * 1000)
		startLockCountdown(s)
		errorMsg.value = '账号已锁定60秒'
	}
}

function generateDeviceId() {
	return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

async function handleLogin() {
	if (isLocked.value || isLoading.value) return
	errorMsg.value = ''
	fieldError.value = ''

	if (loginMethod.value === 'password') {
		const badge = badgeNumber.value.trim()
		const pass  = password.value
		if (!badge) { fieldError.value = 'badge'; uni.showToast({ title: '请输入警号', icon: 'none' }); return }
		if (!pass)  { fieldError.value = 'pass';  uni.showToast({ title: '请输入密码', icon: 'none' }); return }
		if (pass.length < 6) { fieldError.value = 'pass'; errorMsg.value = '密码至少6位'; return }
		
		isLoading.value = true
		try { uni.vibrateShort() } catch (e) {}
		
		const selectedCat = userCategories.find(c => c.value === selectedCategory.value) || userCategories[0]
		const localRole = C2R[selectedCategory.value] || 'frontline'
		
		const fallback = () => {
			const info = {
				name: '警员' + badge,
				badgeNumber: badge,
				rank: '检查员',
				category: selectedCategory.value,
				role: localRole,
				department: selectedCat.department,
				avatar: '/static/avatar.png'
			}
			saveLoginState('local_' + badge, info, generateDeviceId())
			try { uni.vibrateLong() } catch (e) {}
			uni.showToast({ title: '网络不可用，已进入本地模式', icon: 'none' })
			setTimeout(() => navigateAfterLogin(localRole), 800)
		}
		
		try {
			const base = uni.getStorageSync('baseURL') || 'http://127.0.0.1:3000'
			const res = await new Promise((ok, fail) => uni.request({
				url: base + '/api/v1/auth/login',
				method: 'POST',
				data: { badge_number: badge, username: badge, password: pass, category: selectedCategory.value },
				header: { 'Content-Type': 'application/json' },
				timeout: 8000,
				success: ok,
				fail
			}))
			if (res.statusCode === 200 && (res.data?.token || res.data?.data?.token)) {
				const u = res.data.data?.user || res.data.user || {}
				const token = res.data.data?.token || res.data.token
				const role = u.role || C2R[u.category || selectedCategory.value] || localRole
				const info = {
					name: u.name || '警员' + badge,
					badgeNumber: u.badge_number || badge,
					rank: u.rank || '检查员',
					role,
					role_name: u.role_name || '',
					category: u.category || selectedCategory.value,
					department: u.department || selectedCat.department,
					avatar: u.avatar || '/static/avatar.png'
				}
				saveLoginState(token, info, generateDeviceId())
				try { uni.vibrateLong() } catch (e) {}
				uni.showToast({ title: '登录成功', icon: 'success' })
				setTimeout(() => navigateAfterLogin(role), 800)
			} else if (res.statusCode === 401) {
				recordFailure()
				if (!isLocked.value) errorMsg.value = res.data?.message || '警号或密码错误'
				fieldError.value = 'pass'
				try { uni.vibrateShort() } catch (e) {}
			} else if (res.statusCode === 403) {
				errorMsg.value = res.data?.message || '账号已被禁用，请联系管理员'
			} else {
				fallback()
			}
		} catch (e) { fallback() } finally { isLoading.value = false }

	} else if (loginMethod.value === 'biometric') {
		isLoading.value = true
		try { uni.vibrateShort() } catch (e) {}
		const selectedCat = userCategories.find(c => c.value === selectedCategory.value) || userCategories[0]
		const localRole = C2R[selectedCategory.value] || 'frontline'
		try {
			const base = uni.getStorageSync('baseURL') || 'http://127.0.0.1:3000'
			const res = await new Promise((ok, fail) => uni.request({
				url: base + '/api/v1/auth/biometric',
				method: 'POST',
				data: { biometric_type: selectedBiometric.value, biometric_data: 'mock_data', category: selectedCategory.value },
				header: { 'Content-Type': 'application/json' },
				timeout: 8000,
				success: ok,
				fail
			}))
			if (res.statusCode === 200 && (res.data?.token || res.data?.data?.token)) {
				const u = res.data.data?.user || res.data.user || {}
				const token = res.data.data?.token || res.data.token
				const role = u.role || localRole
				const info = {
					name: u.name || '执法员',
					badgeNumber: u.badge_number || 'BIO-001',
					rank: u.rank || '检查员',
					role,
					role_name: u.role_name || '',
					category: u.category || selectedCategory.value,
					department: u.department || selectedCat.department,
					avatar: u.avatar || '/static/avatar.png'
				}
				saveLoginState(token, info, generateDeviceId())
				try { uni.vibrateLong() } catch (e) {}
				uni.showToast({ title: '生物识别登录成功', icon: 'success' })
				setTimeout(() => navigateAfterLogin(role), 800)
			} else {
				errorMsg.value = res.data?.message || '生物识别失败，请重试'
				try { uni.vibrateShort() } catch (e) {}
			}
		} catch (e) {
			errorMsg.value = '生物识别服务不可用'
			try { uni.vibrateShort() } catch (e) {}
		} finally { isLoading.value = false }

	} else if (loginMethod.value === 'offline') {
		const cached = uni.getStorageSync('user_info')
		if (cached) {
			const role = cached.role || C2R[cached.category] || 'frontline'
			try { uni.vibrateLong() } catch (e) {}
			uni.showToast({ title: '离线登录成功', icon: 'success' })
			setTimeout(() => navigateAfterLogin(role), 800)
		} else {
			errorMsg.value = '无离线凭证，请先联网登录'
			try { uni.vibrateShort() } catch (e) {}
		}
	}
}

function handleDemoLogin() {
	const role = C2R[selectedCategory.value] || 'frontline'
	const selectedCat = userCategories.find(c => c.value === selectedCategory.value) || userCategories[0]
	saveLoginState('demo_token_12345', {
		name: '演示-边防执勤员',
		badgeNumber: 'BP-DEMO-001',
		rank: '高级执勤员',
		role,
		category: selectedCategory.value,
		department: selectedCat.department,
		avatar: '/static/avatar.png'
	}, generateDeviceId())
	try { uni.vibrateLong() } catch (e) {}
	uni.showToast({ title: '演示模式已启动', icon: 'success' })
	setTimeout(() => navigateAfterLogin(role), 800)
}

function handleOfflineLogin() {
	uni.showModal({
		title: '离线登录',
		content: '将使用本地缓存凭证，部分功能受限',
		confirmText: '确认使用',
		success: (r) => {
			if (r.confirm) {
				const cached = uni.getStorageSync('user_info')
				if (cached) { navigateAfterLogin(cached.role || C2R[cached.category] || 'frontline') }
				else { uni.showToast({ title: '无离线凭证，请先联网登录', icon: 'none' }) }
			}
		}
	})
}

// ===== 紧急案件上报（长按3秒）=====
function onEmergencyTouchStart() {
	emergencyHoldProgress.value = 0
	const step = 100 / (HOLD_DURATION / 50)
	const tick = setInterval(() => {
		emergencyHoldProgress.value = Math.min(emergencyHoldProgress.value + step, 100)
	}, 50)
	emergencyTimer = tick
}

function onEmergencyTouchEnd() {
	if (emergencyTimer) {
		clearInterval(emergencyTimer)
		emergencyTimer = null
	}
	if (emergencyHoldProgress.value >= 100) {
		try { uni.vibrateLong() } catch (e) {}
		uni.switchTab({ url: '/pages/Task/Task?mode=emergency' })
	} else {
		emergencyHoldProgress.value = 0
	}
}
</script>

<style lang="scss" scoped>
// ===== 变量定义 =====
.login-page {
	--accent: #00d4ff;
	--accent-soft: rgba(0, 212, 255, 0.12);
	--accent-glow: rgba(0, 212, 255, 0.35);
	--danger: #ff4d4f;
	--danger-soft: rgba(255, 77, 79, 0.12);
	--warning: #ffa940;
	--bg: #060a14;
	--surface: rgba(12, 20, 34, 0.95);
	--border: rgba(0, 212, 255, 0.2);
	--text: #f0f8ff;
	--muted: rgba(200, 220, 255, 0.6);
}

// ===== 页面布局 =====
.login-page {
	width: 100vw;
	min-height: 100vh;
	background: var(--bg);
	display: flex;
	flex-direction: column;
	align-items: center;
	box-sizing: border-box;
	padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
	padding-left: 32rpx;
	padding-right: 32rpx;
	padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
	position: relative;
	overflow-y: auto;
}

// ===== 背景层 =====
.bg-grid {
	position: fixed;
	inset: 0;
	background-image: 
		linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
		linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
	background-size: 60rpx 60rpx;
	pointer-events: none;
	z-index: 0;
}

.bg-glow-top {
	position: fixed;
	top: -200rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 800rpx;
	height: 800rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(0, 180, 200, 0.12) 0%, transparent 70%);
	pointer-events: none;
	z-index: 0;
}

.bg-glow-bottom {
	position: fixed;
	bottom: -300rpx;
	right: -150rpx;
	width: 600rpx;
	height: 600rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(0, 80, 120, 0.08) 0%, transparent 65%);
	pointer-events: none;
	z-index: 0;
}

.bg-border-map {
	position: fixed;
	inset: 0;
	z-index: 0;
	pointer-events: none;
	overflow: hidden;
}

.border-svg {
	width: 100%;
	height: 100%;
	opacity: 0.8;
}

// ===== 品牌区 =====
.brand-section {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	padding: 20rpx 0 16rpx;
	position: relative;
	z-index: 1;
}

.logo-wrap {
	position: relative;
	width: 320rpx;
	height: 220rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.logo-ring {
	position: absolute;
	border-radius: 50%;
	border: 2rpx solid var(--accent);
	animation: ringPulse 3s ease-in-out infinite;
}

.ring-1 {
	width: 220rpx;
	height: 220rpx;
	opacity: 0.28;
}

.ring-2 {
	width: 188rpx;
	height: 188rpx;
	border-color: var(--accent);
	opacity: 0.45;
	animation-delay: 0.5s;
}

@keyframes ringPulse {
	0%, 100% { opacity: 0.3; transform: scale(1); }
	50% { opacity: 0.7; transform: scale(1.05); }
}

.logo-core {
	position: relative;
	z-index: 1;
	width: 300rpx;
	height: 170rpx;
	border-radius: 20rpx;
	/* 与 static/logo.png 黑底一致，避免灰底衬色发灰 */
	background: #000000;
	border: 2rpx solid rgba(0, 212, 255, 0.4);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 0 36rpx var(--accent-glow);
	padding: 10rpx 14rpx;
	box-sizing: border-box;
}

.logo-img {
	width: 100%;
	height: 100%;
}

.app-name {
	font-size: 58rpx;
	font-weight: 900;
	color: var(--text);
	letter-spacing: 10rpx;
	text-shadow: 0 0 30rpx var(--accent-glow);
}

.app-en {
	font-size: 17rpx;
	color: var(--accent);
	letter-spacing: 4rpx;
	opacity: 0.7;
}

.product-tag {
	display: flex;
	align-items: center;
	gap: 10rpx;
	margin-top: 4rpx;
	padding: 10rpx 20rpx;
	background: var(--accent-soft);
	border: 1rpx solid var(--border);
	border-radius: 20rpx;
}

.tag-dot {
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	background: var(--accent);
	box-shadow: 0 0 8rpx var(--accent);
}

.tag-text {
	font-size: 22rpx;
	color: var(--accent);
	font-weight: 600;
}

// ===== 边境覆盖标签（与 loginConfig.loginZoneTags 一致） =====
.zone-tags {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8rpx;
	margin-top: 8rpx;
}

.zone-tag {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 6rpx 12rpx;
	background: rgba(0, 0, 0, 0.3);
	border: 1rpx solid rgba(255, 255, 255, 0.1);
	border-radius: 12rpx;
}

.zone-dot {
	width: 6rpx;
	height: 6rpx;
	border-radius: 50%;
}

.zone-name {
	font-size: 18rpx;
	color: var(--muted);
}

// ===== 表单区 =====
.form-section {
	width: 100%;
	max-width: 680rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	position: relative;
	z-index: 1;
	flex: 1;
}

.form-card {
	width: 100%;
	box-sizing: border-box;
	background: var(--surface);
	border: 1rpx solid var(--border);
	border-radius: 28rpx;
	padding: 32rpx 28rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(20px);
}

// ===== 区块标题 =====
.section-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.section-accent {
	width: 6rpx;
	height: 30rpx;
	border-radius: 4rpx;
	background: linear-gradient(180deg, var(--accent), rgba(0, 212, 255, 0.4));
}

.section-title {
	font-size: 26rpx;
	font-weight: 700;
	color: var(--text);
	letter-spacing: 2rpx;
}

// ===== 用户身份选择 =====
.cat-row {
	display: flex;
	flex-direction: row;
	gap: 12rpx;
}

.cat-tab {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 20rpx 8rpx;
	background: rgba(255, 255, 255, 0.03);
	border: 2rpx solid rgba(255, 255, 255, 0.08);
	border-radius: 16rpx;
	transition: all 0.2s ease;
}

.cat-tab.active {
	border-color: var(--accent);
	background: var(--accent-soft);
	box-shadow: 0 0 20rpx var(--accent-glow), inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
}

.cat-icon {
	font-size: 32rpx;
}

.cat-name {
	font-size: 20rpx;
	color: var(--muted);
	font-weight: 600;
}

.cat-tab.active .cat-name {
	color: var(--accent);
}

// ===== 登录方式选择 =====
.method-row {
	display: flex;
	flex-direction: row;
	gap: 12rpx;
}

.method-tab {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6rpx;
	padding: 16rpx 4rpx;
	background: rgba(255, 255, 255, 0.03);
	border: 2rpx solid rgba(255, 255, 255, 0.08);
	border-radius: 14rpx;
	transition: all 0.2s ease;
}

.method-tab.active {
	border-color: var(--accent);
	background: var(--accent-soft);
}

.method-icon {
	font-size: 26rpx;
}

.method-name {
	font-size: 18rpx;
	color: var(--muted);
}

.method-tab.active .method-name {
	color: var(--accent);
	font-weight: 600;
}

// ===== 锁定警告 =====
.lock-warning {
	padding: 16rpx 20rpx;
	background: var(--danger-soft);
	border: 1rpx solid rgba(255, 77, 79, 0.4);
	border-radius: 12rpx;
}

.lock-text {
	font-size: 22rpx;
	color: var(--danger);
}

// ===== 登录表单 =====
.login-form {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.form-label {
	font-size: 22rpx;
	color: var(--muted);
}

.input-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 14rpx;
	background: rgba(255, 255, 255, 0.04);
	border: 2rpx solid rgba(255, 255, 255, 0.1);
	border-radius: 14rpx;
	padding: 0 24rpx;
	height: 96rpx;
	transition: all 0.2s ease;
}

.input-row.focused {
	border-color: var(--accent);
	box-shadow: 0 0 0 4rpx var(--accent-soft);
}

.input-row.input-error {
	border-color: var(--danger);
}

.input-prefix {
	font-size: 24rpx;
	color: var(--accent);
	font-weight: 800;
	min-width: 48rpx;
	flex-shrink: 0;
}

.form-input {
	flex: 1;
	font-size: 30rpx;
	color: var(--text);
	background: transparent;
	border: none;
}

.ph {
	color: rgba(150, 170, 200, 0.5);
}

.eye-btn {
	font-size: 32rpx;
	padding: 8rpx;
	flex-shrink: 0;
}

// ===== 生物识别 =====
.bio-section {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	padding: 24rpx;
	background: var(--accent-soft);
	border: 1rpx solid var(--border);
	border-radius: 16rpx;
}

.hint-box {
	padding: 16rpx 18rpx;
	background: var(--accent-soft);
	border: 1rpx solid var(--border);
	border-radius: 12rpx;
}

.offline-hint {
	background: rgba(255, 169, 64, 0.08);
	border-color: rgba(255, 169, 64, 0.3);
}

.hint-text {
	font-size: 22rpx;
	color: var(--accent);
	line-height: 1.5;
}

// ===== 错误提示 =====
.error-hint {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 12rpx;
	padding: 14rpx 18rpx;
	background: var(--danger-soft);
	border: 1rpx solid rgba(255, 77, 79, 0.3);
	border-radius: 12rpx;
}

.error-text {
	font-size: 22rpx;
	color: var(--danger);
	flex: 1;
}

.fail-count {
	font-size: 20rpx;
	color: var(--warning);
	flex-shrink: 0;
}

// ===== 登录按钮 =====
.login-btn {
	width: 100%;
	height: 100rpx;
	background: linear-gradient(135deg, var(--accent) 0%, #0099cc 100%);
	border-radius: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 10rpx 40rpx var(--accent-glow);
	transition: all 0.2s ease;
	margin-top: 8rpx;
}

.login-btn:active {
	transform: scale(0.98);
}

.login-btn.btn-loading,
.login-btn.btn-disabled {
	opacity: 0.6;
	pointer-events: none;
}

.login-btn-text {
	font-size: 34rpx;
	font-weight: 800;
	color: var(--bg);
	letter-spacing: 8rpx;
}

.spinner {
	width: 44rpx;
	height: 44rpx;
	border: 4rpx solid rgba(6, 10, 20, 0.2);
	border-top-color: var(--bg);
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

// ===== 快捷按钮 =====
.quick-btn {
	width: 100%;
	box-sizing: border-box;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 22rpx 24rpx;
	border-radius: 18rpx;
	background: rgba(255, 255, 255, 0.02);
	border: 1rpx solid rgba(255, 255, 255, 0.08);
	transition: all 0.2s ease;
}

.quick-btn:active {
	background: rgba(255, 255, 255, 0.05);
}

.demo-btn {
	border-color: var(--border);
}

.offline-entry {
	border-color: rgba(255, 255, 255, 0.05);
}

.quick-left {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 16rpx;
	flex: 1;
}

.quick-icon {
	font-size: 36rpx;
	flex-shrink: 0;
}

.quick-info {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
	flex: 1;
}

.quick-title {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--text);
}

.quick-sub {
	font-size: 20rpx;
	color: var(--muted);
}

.quick-arrow {
	font-size: 40rpx;
	color: var(--muted);
	font-weight: 300;
	flex-shrink: 0;
}

// ===== 紧急入口 =====
.emergency-entry {
	position: relative;
	width: 100%;
	max-width: 680rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	padding: 18rpx 20rpx;
	margin: 12rpx 0 0;
	overflow: hidden;
	border-radius: 14rpx;
	border: 1rpx solid rgba(255, 77, 79, 0.3);
	background: rgba(255, 77, 79, 0.05);
}

.emergency-icon {
	font-size: 24rpx;
	flex-shrink: 0;
}

.emergency-text {
	font-size: 22rpx;
	color: var(--danger);
	letter-spacing: 4rpx;
	font-weight: 600;
	z-index: 1;
}

.emergency-progress {
	position: absolute;
	left: 0;
	top: 0;
	height: 100%;
	background: rgba(255, 77, 79, 0.1);
	transition: width 0.05s linear;
	pointer-events: none;
	z-index: 0;
}

// ===== 底部 =====
.login-footer {
	width: 100%;
	max-width: 680rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	padding-top: 24rpx;
	position: relative;
	z-index: 1;
}

.sys-status-bar {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 8rpx 16rpx;
	padding: 14rpx 20rpx;
	background: rgba(0, 0, 0, 0.3);
	border: 1rpx solid rgba(255, 255, 255, 0.05);
	border-radius: 14rpx;
}

.status-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8rpx;
}

.status-dot {
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.status-dot.online {
	background: #52c41a;
	box-shadow: 0 0 8rpx #52c41a;
	animation: dotBlink 2s ease-in-out infinite;
}

@keyframes dotBlink {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.4; }
}

.status-label {
	font-size: 20rpx;
	color: var(--muted);
}

.status-sep {
	font-size: 18rpx;
	color: rgba(255, 255, 255, 0.2);
}

.status-version {
	font-size: 20rpx;
	color: rgba(200, 220, 255, 0.4);
	font-family: 'Courier New', monospace;
}

.footer-warn {
	font-size: 18rpx;
	color: rgba(200, 220, 255, 0.4);
	text-align: center;
	line-height: 1.6;
}

.footer-legal {
	font-size: 17rpx;
	color: rgba(200, 220, 255, 0.3);
	text-align: center;
}
</style>
