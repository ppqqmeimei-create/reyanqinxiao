<template>
	<view class="profile-page">
		<view class="profile-bg-glow"></view>
		<view class="profile-header">
			<text class="profile-header-title">个人中心</text>
			<view class="profile-header-badge">
				<view class="badge-dot" :class="{ 'badge-dot--active': onDuty }"></view>
				<text class="badge-txt">{{ onDuty ? '执勤中' : '休整中' }}</text>
			</view>
		</view>
		<UserCard :userInfo="userInfo" :onDuty="onDuty" @dutyChange="handleDutyChange" />
		<scroll-view class="content-scroll" scroll-y>
			<DutyStats :stats="dutyStats" :medals="medals" :coverageMap="coverageMap" />
			<AiModelManager :modelInfo="modelInfo" :updateAvailable="updateAvailable" @update="handleModelUpdate" />
			<SimilarityWeightPanel />
			<SecurityPanel :biometricEnabled="biometricEnabled" @biometricToggle="handleBiometricToggle" @emergencyDestroy="handleEmergencyDestroy" @logout="handleLogout" />
			<view class="profile-bottom-pad"></view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import UserCard      from './components/UserCard.vue'
import DutyStats     from './components/DutyStats.vue'
import AiModelManager from './components/AiModelManager.vue'
import SecurityPanel  from './components/SecurityPanel.vue'
import SimilarityWeightPanel from './components/SimilarityWeightPanel.vue'
import { useAuthLogic } from './hooks/useAuthLogic.js'

// 在组件顶层初始化 hook（修复：原代码在回调内部每次调用都新建实例）
const { handleLogout: authLogout } = useAuthLogic()

const userInfo = ref({
	avatar: '/static/avatar.png',
	name: '加载中...',
	badgeNumber: '------',
	department: '广西环食药侦查总队',
	rank: '生态警务执法员',
	squad: '',
	dutyZone: ''
})
const onDuty         = ref(false)
const biometricEnabled = ref(false)
const updateAvailable  = ref(true)

const dutyStats = ref({ interceptCount: 0, patrolDistance: 0, alertContribution: 0, workDays: 0 })
const medals    = ref([
	{ id: 1, name: '环食药缉私先锋',             earned: false },
	{ id: 2, name: '边境卫士',                   earned: false },
	{ id: 3, name: '野生动物守护者',             earned: false },
	{ id: 4, name: '优秀执法员',                 earned: false },
	{ id: 5, name: '生态守护者',                 earned: false },
	{ id: 6, name: '镇守边关·广西生态卫士',       earned: false }
])
const coverageMap = ref({ coverage: 0, hotspots: [] })
const modelInfo   = ref({ version: 'V3.1', name: '活体物种识别AI模型 + 走私车辆识别AI模型', size: 128 })

// 从API加载用户信息，失败时降级到本地缓存
async function loadUserInfo() {
	// 先从本地缓存恢复，快速显示
	const cached = uni.getStorageSync('user_info')
	if (cached) {
		userInfo.value  = { ...userInfo.value, ...cached }
		dutyStats.value = cached.dutyStats || dutyStats.value
		medals.value    = cached.medals    || medals.value
	}
	onDuty.value          = uni.getStorageSync('on_duty')         || false
	biometricEnabled.value = uni.getStorageSync('biometric_enabled') || false

	// 再从API获取最新数据
	try {
		const token   = uni.getStorageSync('token') || uni.getStorageSync('user_token')
		const baseURL = uni.getStorageSync('baseURL') || 'http://localhost:5000'
		if (!token) return
		const res = await new Promise((resolve, reject) =>
			uni.request({ url: baseURL + '/api/auth/me',
				header: { Authorization: 'Bearer ' + token },
				success: resolve, fail: reject, timeout: 8000 })
		)
		if (res.statusCode === 200 && res.data) {
			const u = res.data
			userInfo.value = {
				avatar:       u.avatar      || '/static/avatar.png',
				name:         u.name        || u.username,
				badgeNumber:  u.badge_number || u.badgeNumber || '------',
				department:   u.department  || '广西环食药侦查总队',
				rank:         u.rank        || '生态警务执法员',
				squad:        u.squad       || '',
				dutyZone:     u.duty_zone   || ''
			}
			if (u.duty_stats)  dutyStats.value = u.duty_stats
			if (u.medals)      medals.value    = u.medals
			if (u.coverage)    coverageMap.value.coverage = u.coverage
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
	try {
		const token   = uni.getStorageSync('token') || uni.getStorageSync('user_token')
		const baseURL = uni.getStorageSync('baseURL') || 'http://localhost:5000'
		if (token) {
			uni.request({ url: baseURL + '/api/auth/update-status',
				method: 'PUT',
				header: { Authorization: 'Bearer ' + token },
				data: { status: status ? 'busy' : 'online' },
				fail: () => {} })
		}
	} catch {}
}

function handleModelUpdate() {
	uni.showLoading({ title: '更新中...' })
	setTimeout(() => {
		modelInfo.value.version = 'V2.5'
		modelInfo.value.name    = '全天候目标识别版'
		updateAvailable.value   = false
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
			}
		}
	})
	uni.vibrateShort()
}

onLoad(() => { loadUserInfo() })
</script>

<style lang="scss">
@import './profile.scss';
</style>
