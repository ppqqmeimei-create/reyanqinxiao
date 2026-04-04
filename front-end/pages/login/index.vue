<template>
	<view class="login-page">
		<view class="bg-grid"></view>
		<view class="bg-glow-top"></view>
		<view class="bg-glow-bottom"></view>

		<!-- 品牌区 -->
		<view class="brand-section">
			<view class="logo-wrap">
				<view class="logo-ring ring-1"></view>
				<view class="logo-ring ring-2"></view>
				<view class="logo-core">
					<image class="logo-img" src="/static/logo.png" mode="aspectFit"></image>
				</view>
			</view>
			<text class="app-name">热眼擒枭</text>
			<text class="app-en">BORDER WILDLIFE ANTI-SMUGGLING SYSTEM</text>
			<view class="app-tag">
				<view class="tag-dot"></view>
				<text class="tag-text">热眼擒枭 · 边境活物走私智能防控系统 v2.0.0</text>
			</view>
		</view>

		<!-- 表单区 -->
		<view class="form-section">
			<view class="form-card">

				<!-- 用户身份 -->
				<view class="block-title">用户身份</view>
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

				<!-- 登录方式 -->
				<view class="block-title" style="margin-top:28rpx">登录方式</view>
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
					<text class="lock-text">账号已锁定，请 {{ lockCountdown }} 秒后重试</text>
				</view>

				<!-- 密码登录 -->
				<view v-if="loginMethod === 'password'">
					<view class="form-group">
						<text class="form-label">警号 / 用户名</text>
						<view class="input-row" :class="{ focused: badgeFocused, 'input-error': fieldError === 'badge' }">
							<text class="input-prefix">ID</text>
							<input
								class="form-input"
								v-model="badgeNumber"
								placeholder="请输入警号或用户名"
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
					<view class="method-row" style="margin-top:16rpx">
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

				<!-- 离线登录 -->
				<view v-if="loginMethod === 'offline'" class="hint-box offline-hint">
					<text class="hint-text">将使用本地缓存凭证登录，部分功能受限</text>
				</view>

				<!-- 错误提示 -->
				<view v-if="errorMsg" class="error-hint">
					<text class="error-text">⚠ {{ errorMsg }}</text>
					<text v-if="failCount > 0 && !isLocked" class="fail-count">剩余 {{ MAX_ATTEMPTS - failCount }} 次</text>
				</view>

				<!-- 登录按钮 -->
				<view class="login-btn" :class="{ 'btn-loading': isLoading, 'btn-disabled': isLocked }" @tap="handleLogin">
					<view v-if="isLoading" class="spinner"></view>
					<text v-else class="login-btn-text">进 入 系 统</text>
				</view>
			</view>

			<!-- 演示模式 -->
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

			<!-- 离线凭证登录 -->
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

		<!-- 底部声明 -->
		<view class="login-footer">
			<text class="footer-warn">本系统仅限授权执法人员使用 · 未授权访问将被记录追责</text>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { saveLoginState, navigateAfterLogin } from '@/utils/auth.js'

// ===== 角色映射（全局共用）=====
const C2R = {
	patrol:       'frontline',
	inspector:    'frontline',
	investigator: 'investigator',
	manager:      'commander',
	commander:    'commander',
	admin:        'commander'
}

const userCategories = [
	{ value: 'patrol',       label: '一线执勤', icon: '🛂', department: '边境反走私支队' },
	{ value: 'investigator', label: '侦查研判', icon: '🕵️', department: '边境反走私支队' },
	{ value: 'commander',    label: '指挥调度', icon: '📡', department: '边境反走私指挥中心' }
]

const biometricMethods = [
	{ key: 'fingerprint', name: '指纹识别', icon: '👆' },
	{ key: 'face',        name: '人脸识别', icon: '😊' },
	{ key: 'iris',        name: '虹膜识别', icon: '👁️' }
]

const badgeNumber       = ref('')
const password          = ref('')
const showPass          = ref(false)
const isLoading         = ref(false)
const badgeFocused      = ref(false)
const passFocused       = ref(false)
const errorMsg          = ref('')
const fieldError        = ref('')
const failCount         = ref(0)
const isLocked          = ref(false)
const lockCountdown     = ref(0)
const MAX_ATTEMPTS      = 5
const selectedCategory  = ref('patrol')
const loginMethod       = ref('password')
const selectedBiometric = ref('fingerprint')
let lockTimer = null

function getBiometricName(key) {
	return biometricMethods.find(m => m.key === key)?.name || '生物识别'
}

function selectCategory(val) {
	selectedCategory.value = val
	try { uni.vibrateShort() } catch (e) {}
}

onLoad(() => {
	const t = uni.getStorageSync('token') || uni.getStorageSync('user_token')
	if (t) {
		const info = uni.getStorageSync('user_info') || {}
		navigateAfterLogin(info.role || 'investigator')
		return
	}
	failCount.value = uni.getStorageSync('login_fail_count') || 0
	const lu = uni.getStorageSync('login_lock_until')
	if (lu && Date.now() < lu) startLockCountdown(Math.ceil((lu - Date.now()) / 1000))
})

onUnload(() => { if (lockTimer) clearInterval(lockTimer) })

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
</script>

<style lang="scss" scoped>
.login-page { width:100vw; min-height:100vh; background:#060a14; display:flex; flex-direction:column; align-items:center; box-sizing:border-box; padding-top:var(--status-bar-height,44px); padding-left:32rpx; padding-right:32rpx; padding-bottom:60rpx; position:relative; overflow-y:auto; }
.bg-grid { position:fixed; top:0; left:0; right:0; bottom:0; background-image:linear-gradient(rgba(0,212,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.035) 1px,transparent 1px); background-size:60rpx 60rpx; pointer-events:none; z-index:0; }
.bg-glow-top { position:fixed; top:-200rpx; left:50%; transform:translateX(-50%); width:800rpx; height:800rpx; border-radius:50%; background:radial-gradient(circle,rgba(0,180,200,.12) 0%,transparent 70%); pointer-events:none; z-index:0; }
.bg-glow-bottom { position:fixed; bottom:-300rpx; right:-150rpx; width:600rpx; height:600rpx; border-radius:50%; background:radial-gradient(circle,rgba(20,80,40,.09) 0%,transparent 65%); pointer-events:none; z-index:0; }
.brand-section { width:100%; display:flex; flex-direction:column; align-items:center; gap:12rpx; padding-top:20rpx; padding-bottom:16rpx; position:relative; z-index:1; }
.logo-wrap { position:relative; width:160rpx; height:160rpx; display:flex; align-items:center; justify-content:center; }
.logo-ring { position:absolute; border-radius:50%; border:1px solid rgba(0,212,255,.3); animation:ringPulse 3s ease-in-out infinite; }
.ring-1 { width:160rpx; height:160rpx; }
.ring-2 { width:124rpx; height:124rpx; border-color:rgba(0,212,255,.5); animation-delay:.5s; }
@keyframes ringPulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
.logo-core { width:100rpx; height:100rpx; border-radius:24rpx; background:rgba(0,212,255,.12); border:2rpx solid rgba(0,212,255,.55); display:flex; align-items:center; justify-content:center; box-shadow:0 0 30rpx rgba(0,212,255,.3); }
.logo-img { width:64rpx; height:64rpx; }
.app-name { font-size:60rpx; font-weight:900; color:#f4fbff; letter-spacing:6rpx; }
.app-en { font-size:18rpx; color:rgba(136,196,255,.7); letter-spacing:2rpx; }
.app-tag { display:flex; align-items:center; gap:8rpx; }
.tag-dot { width:10rpx; height:10rpx; border-radius:50%; background:#00d4ff; box-shadow:0 0 8rpx #00d4ff; }
.tag-text { font-size:20rpx; color:rgba(220,235,255,.55); }
.form-section { width:100%; max-width:680rpx; display:flex; flex-direction:column; gap:20rpx; position:relative; z-index:1; }
.form-card { width:100%; box-sizing:border-box; background:rgba(14,20,36,.96); border:1rpx solid rgba(120,164,255,.2); border-radius:24rpx; padding:32rpx; display:flex; flex-direction:column; gap:24rpx; box-shadow:0 16rpx 48rpx rgba(0,0,0,.4); }
.block-title { font-size:22rpx; color:rgba(200,220,255,.6); letter-spacing:2rpx; }
.cat-row { display:flex; flex-direction:row; gap:12rpx; }
.cat-tab { flex:1; display:flex; flex-direction:column; align-items:center; gap:8rpx; padding:18rpx 6rpx; background:rgba(255,255,255,.04); border:2rpx solid rgba(255,255,255,.12); border-radius:14rpx; }
.cat-tab.active { border-color:#00d4ff; background:rgba(0,212,255,.12); box-shadow:0 0 10px #00d4ff; }
.cat-icon { font-size:28rpx; }
.cat-name { font-size:18rpx; color:rgba(230,240,255,.8); text-align:center; }
.cat-tab.active .cat-name { color:#fff; font-weight:700; }
.method-row { display:flex; flex-direction:row; gap:12rpx; }
.method-tab { flex:1; display:flex; flex-direction:column; align-items:center; gap:6rpx; padding:16rpx 4rpx; background:rgba(255,255,255,.04); border:2rpx solid rgba(255,255,255,.12); border-radius:14rpx; }
.method-tab.active { border-color:rgba(0,212,255,.8); background:rgba(0,212,255,.1); }
.method-icon { font-size:26rpx; }
.method-name { font-size:18rpx; color:rgba(220,235,255,.75); text-align:center; }
.method-tab.active .method-name { color:#fff; font-weight:700; }
.lock-warning { padding:16rpx 20rpx; background:rgba(255,77,79,.12); border:1rpx solid rgba(255,77,79,.35); border-radius:12rpx; }
.lock-text { font-size:22rpx; color:#ff6b6b; }
.form-group { display:flex; flex-direction:column; gap:12rpx; margin-top:4rpx; }
.form-label { font-size:22rpx; color:rgba(200,220,255,.65); }
.input-row { display:flex; flex-direction:row; align-items:center; gap:14rpx; background:rgba(255,255,255,.04); border:1rpx solid rgba(255,255,255,.14); border-radius:14rpx; padding:0 24rpx; height:96rpx; }
.input-row.focused { border-color:rgba(0,212,255,.75); }
.input-row.input-error { border-color:rgba(255,77,79,.75); }
.input-prefix { font-size:24rpx; color:rgba(0,212,255,.85); font-weight:800; min-width:48rpx; flex-shrink:0; }
.form-input { flex:1; font-size:30rpx; color:#f0f8ff; background:transparent; border:none; min-height:60rpx; }
.ph { color:rgba(150,170,200,.55); }
.eye-btn { font-size:32rpx; padding:8rpx; flex-shrink:0; }
.bio-section { display:flex; flex-direction:column; gap:16rpx; padding:20rpx; background:rgba(0,212,255,.05); border:1rpx solid rgba(0,212,255,.2); border-radius:14rpx; }
.hint-box { padding:16rpx 18rpx; background:rgba(0,212,255,.08); border:1rpx solid rgba(0,212,255,.2); border-radius:12rpx; }
.offline-hint { background:rgba(245,158,11,.08); border-color:rgba(245,158,11,.25); }
.hint-text { font-size:22rpx; color:rgba(200,230,255,.85); }
.error-hint { display:flex; flex-direction:row; align-items:center; gap:10rpx; padding:14rpx 18rpx; background:rgba(255,77,79,.08); border:1rpx solid rgba(255,77,79,.25); border-radius:12rpx; }
.error-text { font-size:22rpx; color:#ff6b6b; flex:1; }
.fail-count { font-size:20rpx; color:#ffa94d; flex-shrink:0; }
.login-btn { width:100%; height:104rpx; background:linear-gradient(135deg,#00d4ff 0%,#0080b3 100%); border-radius:52rpx; display:flex; align-items:center; justify-content:center; box-shadow:0 8rpx 32rpx rgba(0,212,255,.4); margin-top:4rpx; }
.login-btn.btn-loading, .login-btn.btn-disabled { opacity:.6; pointer-events:none; }
.login-btn-text { font-size:34rpx; font-weight:800; color:#060a14; letter-spacing:6rpx; }
.spinner { width:44rpx; height:44rpx; border:4rpx solid rgba(6,10,20,.2); border-top-color:#060a14; border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.quick-btn { width:100%; box-sizing:border-box; display:flex; flex-direction:row; align-items:center; justify-content:space-between; padding:22rpx 24rpx; border-radius:18rpx; background:rgba(255,255,255,.03); border:1rpx solid rgba(255,255,255,.1); }
.demo-btn { border-color:rgba(0,212,255,.25); }
.offline-entry { border-color:rgba(255,255,255,.08); }
.quick-left { display:flex; flex-direction:row; align-items:center; gap:16rpx; flex:1; }
.quick-icon { font-size:36rpx; flex-shrink:0; }
.quick-info { display:flex; flex-direction:column; gap:4rpx; flex:1; }
.quick-title { font-size:28rpx; font-weight:600; color:rgba(240,248,255,.9); }
.quick-sub { font-size:20rpx; color:rgba(160,180,210,.65); }
.quick-arrow { font-size:44rpx; color:rgba(160,180,210,.5); font-weight:300; flex-shrink:0; }
.login-footer { width:100%; display:flex; justify-content:center; padding-top:8rpx; padding-bottom:8rpx; position:relative; z-index:1; }
.footer-warn { font-size:18rpx; color:rgba(180,200,230,.45); text-align:center; line-height:1.6; }
</style>
