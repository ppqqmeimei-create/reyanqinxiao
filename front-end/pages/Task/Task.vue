<template>
	<view class="task-page">
		<!-- 严重预警高亮闪烁弹窗（余光可感知，视线不在正中也能察觉） -->
		<view v-if="showCriticalAlert" class="critical-flash-overlay" @tap="dismissCriticalFlash">
			<view class="critical-flash-card" :class="'critical-' + currentTask.priority">
				<view class="cf-icon">🚨</view>
				<view class="cf-title">⚠️ {{ currentTask.title }}</view>
				<view class="cf-body">
					<text class="cf-line">📍 {{ currentTask.location }}</text>
					<text class="cf-line">🔖 工单：{{ currentTask.caseNumber }}</text>
					<text class="cf-line">⏱️ {{ formatTime(currentTask.deadline) }}</text>
				</view>
				<view class="cf-hint">点击任意处关闭 · 按住SOS按钮求援</view>
			</view>
		</view>

		<!-- 顶部任务信息卡片 -->
		<view class="task-header">
			<view class="header-top">
				<view class="case-badge" :class="'priority-' + currentTask.priority">
					<text class="case-number">{{ currentTask.caseNumber }}</text>
				</view>
				<view class="status-badge" :class="'status-' + currentTask.status">
					<view class="status-dot"></view>
					<text class="status-text">{{ getStatusText(currentTask.status) }}</text>
				</view>
			</view>
			
			<text class="task-title">{{ currentTask.title }}</text>
			
			<view class="task-meta">
				<view class="meta-item">
					<text class="meta-icon">📍</text>
					<text class="meta-text">{{ currentTask.location }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">⏰</text>
					<text class="meta-text">{{ formatTime(currentTask.deadline) }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">👮</text>
					<text class="meta-text">{{ currentTask.inspectorName }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">🚨</text>
					<text class="meta-text">来源预警：{{ currentTask.warningId || currentTask.alertId || '--' }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">🤝</text>
					<text class="meta-text">协同状态：{{ getCollaborationStatusText(currentTask.collaborationStatus) }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">🏢</text>
					<text class="meta-text">联合单位：{{ (currentTask.jointDepartments || []).join(' / ') || '--' }}</text>
				</view>
			</view>
			
			<!-- 进度条 -->
			<view class="progress-section">
				<view class="progress-header">
					<text class="progress-label">任务进度</text>
					<text class="progress-value">{{ currentTask.progress }}%</text>
				</view>
				<view class="progress-bar">
					<view class="progress-fill" :style="{ width: currentTask.progress + '%' }"></view>
				</view>
			</view>

			<view class="joint-panel" v-if="currentTask.collaborationStatus && currentTask.collaborationStatus !== 'none'">
				<view class="joint-head">
					<text class="joint-title">🤝 联合执法流转</text>
					<text class="joint-state" :class="'state-' + currentTask.collaborationStatus">{{ getCollaborationStatusText(currentTask.collaborationStatus) }}</text>
				</view>
				<text class="joint-case">联合案件号：{{ currentTask.jointCaseNo || '--' }}</text>
				<text class="joint-depts">协同单位：{{ (currentTask.jointDepartments || []).join(' / ') || '待分配' }}</text>
				<text class="joint-notes" v-if="currentTask.collaborationNotes">流转说明：{{ currentTask.collaborationNotes }}</text>
				<view class="joint-timeline" v-if="collaborationFlows.length > 0">
					<view class="timeline-item" v-for="flow in collaborationFlows" :key="flow.id">
						<text class="timeline-dot"></text>
						<view class="timeline-main">
							<text class="timeline-status">{{ getCollaborationStatusText(flow.to_status || flow.toStatus) }}</text>
							<text class="timeline-time">{{ formatTimelineTime(flow.created_at || flow.createdAt) }}</text>
							<text class="timeline-action">{{ flow.actionLabel || flow.action || '状态流转' }}</text>
							<text class="timeline-notes" v-if="flow.notes">{{ flow.notes }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 实时定位卡片 -->
		<view class="location-card">
			<view class="card-header">
				<text class="card-title">📍 实时定位</text>
				<view class="location-status online">
					<view class="status-dot"></view>
					<text class="status-text">定位中</text>
				</view>
			</view>
			<view class="location-info">
				<view class="location-row">
					<text class="location-label">当前位置</text>
					<text class="location-value">{{ currentLocation.address }}</text>
				</view>
				<view class="location-row">
					<text class="location-label">坐标</text>
					<text class="location-coords">{{ currentLocation.latitude }}, {{ currentLocation.longitude }}</text>
				</view>
				<view class="location-row">
					<text class="location-label">精度</text>
					<text class="location-accuracy">{{ currentLocation.accuracy }}m</text>
				</view>
				<view class="location-row">
					<text class="location-label">更新时间</text>
					<text class="location-time">{{ formatTime(currentLocation.time) }}</text>
				</view>
			</view>
			<button class="location-btn" @tap="updateLocation">
				<text class="btn-icon">🔄</text>
				<text class="btn-text">更新位置</text>
			</button>
		</view>
		
		<!-- 功能标签页 -->
		<view class="tabs-container">
			<scroll-view class="tabs-scroll" scroll-x>
				<view class="tabs">
					<view 
						v-for="tab in tabs" 
						:key="tab.key"
						class="tab" 
						:class="{ active: activeTab === tab.key }" 
						@tap="switchTab(tab.key)"
					>
						<text class="tab-icon">{{ tab.icon }}</text>
						<text class="tab-label">{{ tab.label }}</text>
						<view v-if="tab.badge > 0" class="tab-badge">
							<text class="badge-num">{{ tab.badge }}</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 内容区域 -->
		<scroll-view class="content-scroll" scroll-y>
			<!-- 取证功能 -->
			<view v-if="activeTab === 'evidence'" class="content-section">
				<EvidenceCapture 
					:taskId="currentTask.id"
					:evidenceCount="evidenceStats"
					@upload="handleEvidenceUpload"
				/>
			</view>
			
			<!-- 检查清单 -->
			<view v-if="activeTab === 'checklist'" class="content-section">
				<ChecklistManager 
					:taskId="currentTask.id"
					:items="checklistItems"
					:progress="checklistProgress"
					@update="handleChecklistUpdate"
				/>
			</view>
			
			<!-- 采样功能 -->
			<view v-if="activeTab === 'sampling'" class="content-section">
				<SamplingManager 
					:taskId="currentTask.id"
					:samples="sampleList"
					@save="handleSampleSave"
					@submit="handleSampleSubmit"
				/>
			</view>
			
			<!-- 法律依据 -->
			<view v-if="activeTab === 'legal'" class="content-section">
				<LegalBasis 
					:caseNumber="currentTask.caseNumber"
					:legalBasis="currentTask.legalBasis"
					:penaltySuggestion="currentTask.penaltySuggestion"
				/>
			</view>
			
			<!-- 执法记录 -->
			<view v-if="activeTab === 'record'" class="content-section">
				<EnforcementRecord 
					:taskId="currentTask.id"
					:caseNumber="currentTask.caseNumber"
					@save="handleRecordSave"
				/>
			</view>
		</scroll-view>
		
		<!-- 底部操作栏 -->
		<view class="footer-actions">
			<TacticalButton
				v-if="currentTask.status === 'pending'"
				text="一键处置"
				icon="⚡"
				variant="primary"
				:holdToConfirm="true"
				:holdMs="1000"
				holdHintText="按住 1.0s 启动处置流程"
				@confirm="startTask"
			/>
			<TacticalButton
				v-if="currentTask.status === 'in-progress'"
				text="任务确认"
				icon="✅"
				variant="ghost"
				:holdToConfirm="true"
				:holdMs="1000"
				holdHintText="按住 1.0s 确认任务完成"
				@confirm="completeTask"
			/>
			<TacticalButton
				text="SOS"
				icon="🚨"
				variant="danger"
				:dangerPulse="true"
				:holdToConfirm="true"
				:holdMs="1500"
				holdHintText="按住 1.5s 发起紧急支援"
				@confirm="sendSOS"
			/>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import EvidenceCapture from './components/EvidenceCapture.vue'
import ChecklistManager from './components/ChecklistManager.vue'
import SamplingManager from './components/SamplingManager.vue'
import LegalBasis from './components/LegalBasis.vue'
import EnforcementRecord from './components/EnforcementRecord.vue'
import TacticalButton from '../../components/common/TacticalButton.vue'
import { taskAPI } from '../../utils/request'

// 当前任务数据
const currentTask = ref({
	id: 1,
	caseNumber: 'WL-2026-000102',
	title: '友谊关疑似穿山甲走私案现场执法',
	description: '红外相机抓拍：疑似穿山甲×3，走私风险评分96分，立即出警处置',
	status: 'in-progress',
	priority: 'urgent',
	category: 'enforcement',
	type: 'wildlife-case',
	location: '广西崇左市凭祥市友谊关口岸附近',
	latitude: 22.1128,
	longitude: 106.7612,
	deadline: new Date(Date.now() + 3600000 * 1),
	inspectorName: '广西环食药侦查总队凭祥边境支队-李强',
	inspectorBadge: 'GX-PX001',
	progress: 30,
	legalBasis: '《野生动物保护法》第二十四条、《刑法》第三百四十一条',
	penaltySuggestion: '立即现场取证 + 查获活体 + 移交公安机关 + 建议依法从严处罚',
	jointCaseNo: 'GX-JOINT-2026-001',
	jointDepartments: ['海关', '市场监管局'],
	collaborationStatus: 'in-progress',
	collaborationNotes: '海关负责卡口核查，市监负责流通环节追溯'
})

// 严重级别预警弹窗（余光可感知）
const showCriticalAlert = ref(false)

function dismissCriticalFlash() {
	showCriticalAlert.value = false
	uni.vibrateShort()
}

// 实时定位
const currentLocation = ref({
	latitude: 22.1128,
	longitude: 106.7612,
	address: '广西崇左市凭祥市友谊关口岸附近',
	accuracy: 8,
	time: new Date()
})

// 标签页
const activeTab = ref('evidence')
const tabs = ref([
	{ key: 'evidence',  label: '走私取证', icon: '📸', badge: 0 },
	{ key: 'checklist', label: '必查清单', icon: '📋', badge: 5 },
	{ key: 'sampling',  label: '生物样本', icon: '🧬', badge: 0 },
	{ key: 'legal',     label: '执法依据', icon: '⚖️', badge: 0 },
	{ key: 'record',    label: '执法记录', icon: '📝', badge: 0 }
])

// 证据统计
const evidenceStats = ref({
	photo: 0,
	video: 0,
	audio: 0,
	total: 0
})

// 走私案件必查清单
const checklistItems = ref([
	{ id: 1, name: '涉案人员身份核验（身份证/护照）', status: 'pending', required: true },
	{ id: 2, name: '运输工具检查（车牌/舱体/隐蔽空间）', status: 'pending', required: true },
	{ id: 3, name: '活体物种/数量确认（拍照+AI识别）', status: 'pending', required: true },
	{ id: 4, name: '走私路径核实（来源地/目的地）', status: 'pending', required: true },
	{ id: 5, name: '随行人员询问记录', status: 'pending', required: true },
	{ id: 6, name: '活体健康状态检查', status: 'pending', required: true },
	{ id: 7, name: '证据拍照（现场/活体/单据）', status: 'pending', required: true },
	{ id: 8, name: '通知林草局/海关协同处置', status: 'pending', required: false }
])

const checklistProgress = computed(() => {
	const total = checklistItems.value.length
	const completed = checklistItems.value.filter(item => item.status === 'completed').length
	return Math.floor((completed / total) * 100)
})

// 采样列表
const sampleList = ref([])
const collaborationFlows = ref([])

// 定位更新定时器
let locationTimer = null

// 函数
function switchTab(key) {
	activeTab.value = key
	uni.vibrateShort()
}

function getStatusText(status) {
	const statusMap = {
		'pending': '待开始',
		'in-progress': '进行中',
		'completed': '已完成',
		'cancelled': '已取消'
	}
	return statusMap[status] || '未知'
}

function getCollaborationStatusText(status) {
	const map = {
		none: '未协同',
		pending: '待协同',
		'in-progress': '协同中',
		done: '已协同'
	}
	return map[status] || '未知'
}

function formatTime(time) {
	if (!time) return '--'
	const d = new Date(time)
	const now = new Date()
	const diff = d - now
	
	if (diff < 0) return '已超时'
	
	const hours = Math.floor(diff / 3600000)
	const minutes = Math.floor((diff % 3600000) / 60000)
	
	if (hours > 0) return `${hours}小时${minutes}分钟后`
	return `${minutes}分钟后`
}

function formatTimelineTime(time) {
	if (!time) return '--'
	const d = new Date(time)
	return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function updateLocation() {
	uni.vibrateShort()
	uni.showLoading({ title: '定位中...', mask: true })
	
	uni.getLocation({
		type: 'gcj02',
		success: (res) => {
			currentLocation.value = {
				latitude: res.latitude,
				longitude: res.longitude,
				address: res.address || '获取地址中...',
				accuracy: res.accuracy,
				time: new Date()
			}
			
			uni.hideLoading()
			uni.showToast({ title: '✅ 位置已更新', icon: 'success' })
		},
		fail: () => {
			uni.hideLoading()
			uni.showToast({ title: '定位失败', icon: 'none' })
		}
	})
}

function handleEvidenceUpload(data) {
	evidenceStats.value.photo += data.photos?.length || 0
	evidenceStats.value.video += data.videos?.length || 0
	evidenceStats.value.audio += data.audios?.length || 0
	evidenceStats.value.total = evidenceStats.value.photo + evidenceStats.value.video + evidenceStats.value.audio
	
	tabs.value[0].badge = evidenceStats.value.total
	
	uni.showToast({ title: '✅ 证据已保存', icon: 'success' })
}

function handleChecklistUpdate(data) {
	const index = checklistItems.value.findIndex(item => item.id === data.id)
	if (index !== -1) {
		checklistItems.value[index] = { ...checklistItems.value[index], ...data }
	}
	
	// 更新任务进度
	currentTask.value.progress = checklistProgress.value
	
	// 更新标签徽章
	const pending = checklistItems.value.filter(item => item.status === 'pending').length
	tabs.value[1].badge = pending
}

function handleSampleSave(data) {
	sampleList.value.push(data)
	tabs.value[2].badge = sampleList.value.length
	uni.showToast({ title: '✅ 采样已保存', icon: 'success' })
}

function handleSampleSubmit(data) {
	uni.showToast({ title: '✅ 采样已提交到实验室', icon: 'success' })
}

function handleRecordSave(data) {
	uni.showToast({ title: '✅ 执法记录已保存', icon: 'success' })
}

function startTask() {
	uni.vibrateMedium?.()
	uni.showModal({
		title: '开始任务',
		content: '确认开始执行此走私案件任务？',
		confirmText: '开始',
		confirmColor: '#10b981',
		success: (res) => {
			if (res.confirm) {
				currentTask.value.status = 'in-progress'
				currentTask.value.startTime = new Date()

				uni.vibrateShort()
				uni.showToast({ title: '✅ 任务已开始', icon: 'success' })

				// 开始定位追踪
				startLocationTracking()
			}
		}
	})
}

function completeTask() {
	uni.vibrateMedium?.()

	// 检查是否完成所有必要项
	const pendingItems = checklistItems.value.filter(item => item.status === 'pending').length

	if (pendingItems > 0) {
		uni.showModal({
			title: '提示',
			content: `还有 ${pendingItems} 项检查未完成，确认完成任务？`,
			confirmText: '确认完成',
			confirmColor: '#10b981',
			success: (res) => {
				if (res.confirm) {
					finishTask()
				}
			}
		})
	} else {
		finishTask()
	}
}

function sendSOS() {
	uni.vibrateLong()
	uni.showModal({
		title: '🚨 SOS 紧急支援',
		content: '已长按确认，是否立即上报并请求支援？',
		confirmText: '发送SOS',
		confirmColor: '#FF4D4F',
		success: (res) => {
			if (!res.confirm) return
			uni.vibratePattern?.([200, 100, 200, 100, 400]) // 紧急三段式震动
			uni.showToast({ title: '🚨 SOS 已发送，支援已派出', icon: 'none', duration: 3000 })
		}
	})
}

function finishTask() {
	uni.showLoading({ title: '提交中...', mask: true })

	setTimeout(() => {
		currentTask.value.status = 'completed'
		currentTask.value.endTime = new Date()
		currentTask.value.progress = 100

		uni.hideLoading()
		uni.vibrateLong() // 任务完成确认震动
		uni.showToast({
			title: '✅ 任务已完成',
			icon: 'success',
			duration: 2000
		})

		// 停止定位追踪
		stopLocationTracking()

		// 2秒后返回
		setTimeout(() => {
			uni.navigateBack()
		}, 2000)
	}, 1500)
}

function startLocationTracking() {
	// 每30秒更新一次位置
	locationTimer = setInterval(() => {
		updateLocation()
	}, 30000)
}

function stopLocationTracking() {
	if (locationTimer) {
		clearInterval(locationTimer)
		locationTimer = null
	}
}


// ===== API 调用函数 =====

/**
 * 加载任务数据
 */
async function loadTaskData(taskId) {
	try {
		uni.showLoading({ title: '加载中...' })
		const response = await taskAPI.getDetail(taskId)
		
		if (response.success) {
			const task = response.data.task
			collaborationFlows.value = task.timeline || task.collaborationFlows || []
			if (collaborationFlows.value.length === 0 && taskId) {
				try {
					const timelineRes = await taskAPI.getCollaborationTimeline(taskId)
					collaborationFlows.value = timelineRes?.data?.timeline || timelineRes?.data?.flows || []
				} catch {}
			}
			currentTask.value = {
				...currentTask.value,
				...task,
				warningId: task.warningId || task.warning_id || task.alertId || task.alert_id || currentTask.value.warningId,
				alertId: task.alertId || task.alert_id || task.warningId || task.warning_id || currentTask.value.alertId,
				category: task.category || 'ecology',
				jointCaseNo: task.joint_case_no || task.jointCaseNo || currentTask.value.jointCaseNo,
				jointDepartments: task.joint_departments || task.jointDepartments || currentTask.value.jointDepartments,
				collaborationStatus: task.collaboration_status || task.collaborationStatus || currentTask.value.collaborationStatus,
				collaborationNotes: task.collaboration_notes || task.collaborationNotes || currentTask.value.collaborationNotes
			}
		}
		uni.hideLoading()
	} catch (error) {
		console.error('加载任务数据失败:', error)
		uni.hideLoading()
	}
}

/**
 * 获取Token
 */
function getToken() {
	const token = uni.getStorageSync('token')
	return token || ''
}

onLoad((options) => {
	// 获取任务ID
	const taskId = options.id

	// 加载任务数据
	loadTaskData(taskId)

	// 开始定位
	updateLocation()

	// 如果任务进行中，开始追踪
	if (currentTask.value.status === 'in-progress') {
		startLocationTracking()
	}

	// 严重预警：进入页面时立即弹出高亮闪烁弹窗，伴随长震动
	const urgentPriorities = ['urgent', 'high', 'critical']
	if (urgentPriorities.includes(currentTask.value.priority)) {
		setTimeout(() => {
			showCriticalAlert.value = true
			uni.vibrateLong()          // 严重预警触发长震动
			uni.vibratePattern?.([100, 100, 100, 100, 100, 300]) // 三短一长节奏
		}, 300)
	}
})

onUnload(() => {
	stopLocationTracking()
})
</script>

<style lang="scss" scoped>
@import './task.scss';

/* ── 严重预警高亮闪烁弹窗（余光可感知）── */
.critical-flash-overlay {
	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx;
	background: rgba(0, 0, 0, 0.5);
	animation: cfFadeIn 0.3s ease;
}

@keyframes cfFadeIn {
	from { opacity: 0; }
	to   { opacity: 1; }
}

.critical-flash-card {
	width: 100%;
	border-radius: 32rpx;
	padding: 40rpx 36rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	animation: cfFlash 1.4s ease-in-out infinite;
	cursor: pointer;
	box-shadow: 0 24rpx 80rpx rgba(0,0,0,0.6);
}

.critical-flash-card.critical-urgent {
	background: linear-gradient(135deg, rgba(255,77,79,0.28), rgba(200,30,30,0.18));
	border: 2rpx solid rgba(255,77,79,0.9);
	box-shadow: 0 24rpx 80rpx rgba(0,0,0,0.6), 0 0 60rpx rgba(255,77,79,0.45);
}

.critical-flash-card.critical-high {
	background: linear-gradient(135deg, rgba(255,169,64,0.28), rgba(200,120,20,0.18));
	border: 2rpx solid rgba(255,169,64,0.9);
	box-shadow: 0 24rpx 80rpx rgba(0,0,0,0.6), 0 0 60rpx rgba(255,169,64,0.4);
}

@keyframes cfFlash {
	0%, 100% {
		opacity: 1;
		box-shadow: 0 24rpx 80rpx rgba(0,0,0,0.6), 0 0 40rpx currentColor;
		transform: scale(1);
	}
	50% {
		opacity: 0.82;
		box-shadow: 0 24rpx 80rpx rgba(0,0,0,0.6), 0 0 80rpx currentColor;
		transform: scale(1.025);
	}
}

.cf-icon { font-size: 72rpx; animation: cfIconPulse 0.8s ease-in-out infinite; }

@keyframes cfIconPulse {
	0%, 100% { transform: scale(1); }
	50%       { transform: scale(1.18); }
}

.cf-title {
	font-size: 32rpx;
	font-weight: 800;
	color: #fff;
	text-align: center;
	line-height: 1.4;
}

.cf-body {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	width: 100%;
	padding: 20rpx;
	background: rgba(0,0,0,0.25);
	border-radius: 16rpx;
}

.cf-line {
	font-size: 26rpx;
	color: rgba(255,255,255,0.88);
	line-height: 1.5;
	font-family: 'Courier New', monospace;
}

.cf-hint {
	font-size: 20rpx;
	color: rgba(255,255,255,0.5);
	margin-top: 8rpx;
	animation: cfHintBlink 2s ease-in-out infinite;
}

@keyframes cfHintBlink {
	0%, 100% { opacity: 1; }
	50%       { opacity: 0.3; }
}
</style>

