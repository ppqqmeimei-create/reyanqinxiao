<template>
	<view class="task-page">
		<!-- 页面背景网格（借鉴参考项目） -->
		<view class="page-bg-grid"></view>
		<view class="page-bg-glow"></view>

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
		<view class="task-header" :class="'priority-' + currentTask.priority">
			<!-- 顶部动态渐变光条（借鉴参考项目） -->
			<view class="header-top-bar" :class="'bar-' + currentTask.priority"></view>

			<!-- 案件编号 + 状态 + 脉冲指示灯 -->
			<view class="header-top">
				<view class="case-badge" :class="'priority-' + currentTask.priority">
					<text class="case-number">{{ currentTask.caseNumber }}</text>
				</view>
				<view class="status-badge" :class="'status-' + currentTask.status">
					<!-- 脉冲指示灯（借鉴参考项目） -->
					<view class="status-dot" :class="{ 'blink-critical': currentTask.priority === 'urgent', 'blink-high': currentTask.priority === 'high' }"></view>
					<text class="status-text">{{ getStatusText(currentTask.status) }}</text>
				</view>
			</view>
			
			<text class="task-title">{{ currentTask.title }}</text>

			<!-- 涉案物种 + 风险评分 + 设备来源（增强信息区） -->
			<view class="task-info-row" v-if="currentTask.species || currentTask.riskScore || currentTask.deviceNo">
				<view class="info-chip species" v-if="currentTask.species">
					<text class="chip-icon">🐾</text>
					<text class="chip-txt">{{ currentTask.species }}</text>
					<text class="chip-tag" :class="'level-' + (currentTask.protectionLevel || 'unknown')">{{ currentTask.protectionLevel || '待核实' }}</text>
				</view>
				<view class="info-chip risk" v-if="currentTask.riskScore">
					<text class="chip-icon">⚠️</text>
					<text class="chip-txt">风险评分</text>
					<text class="chip-score" :class="getRiskClass(currentTask.riskScore)">{{ currentTask.riskScore }}分</text>
				</view>
				<view class="info-chip device" v-if="currentTask.deviceNo">
					<text class="chip-icon">📡</text>
					<text class="chip-txt">{{ currentTask.deviceNo }}</text>
				</view>
			</view>
			
			<view class="task-meta">
				<view class="meta-item">
					<text class="meta-icon">📍</text>
					<text class="meta-text">{{ currentTask.location }}</text>
				</view>
				<view class="meta-item">
					<text class="meta-icon">⏰</text>
					<text class="meta-text deadline-countdown" :class="getDeadlineClass(currentTask.deadline)">{{ formatTime(currentTask.deadline) }}</text>
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
				<view class="joint-case-row">
					<text class="joint-case">联合案件号：{{ currentTask.jointCaseNo || '--' }}</text>
					<view class="joint-copy-btn" @tap="copyCaseNo" v-if="currentTask.jointCaseNo">
						<text class="copy-btn-txt">复制</text>
					</view>
				</view>
				<!-- 协同进度阶段 -->
				<view class="joint-stages" v-if="jointStages.length > 0">
					<view class="stage-item" v-for="(stage, idx) in jointStages" :key="idx" :class="{ active: stage.active, done: stage.done }">
						<text class="stage-dot"></text>
						<text class="stage-label">{{ stage.label }}</text>
						<text class="stage-time" v-if="stage.time">{{ stage.time }}</text>
					</view>
				</view>
				<view class="joint-dept-contacts" v-if="jointContacts.length > 0">
					<view class="contact-item" v-for="c in jointContacts" :key="c.dept" @tap="callContact(c.phone)">
						<text class="contact-dept">{{ c.dept }}</text>
						<text class="contact-phone">{{ c.name }} {{ c.phone }}</text>
					</view>
				</view>
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
		
		<!-- 功能标签页（借鉴参考项目 + 增强选中态） -->
		<view class="tabs-container">
			<scroll-view class="tabs-scroll" scroll-x>
				<view class="tabs">
					<view
						v-for="tab in tabs"
						:key="tab.key"
						class="tab"
						:class="{ active: activeTab === tab.key, ['tab-' + tab.key]: true }"
						@tap="switchTab(tab.key)"
					>
						<view class="tab-icon-wrap">
							<image class="tab-icon-img" :src="tab.iconPng" mode="aspectFit"></image>
							<!-- 数字角标（借鉴参考项目） -->
							<view v-if="tab.badge > 0" class="tab-badge">
								<text class="badge-num">{{ tab.badge }}</text>
							</view>
						</view>
						<text class="tab-label">{{ tab.label }}</text>
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
					@submitted="handleRecordSubmitted"
				/>
			</view>

			<!-- 底部操作区：改为随内容流动，不再固定遮挡主内容 -->
			<view class="footer-actions footer-actions-flow">
				<view class="footer-actions-panel">
					<view class="footer-panel-head">
						<view class="footer-panel-title-wrap">
							<text class="footer-panel-kicker">现场处置快捷区</text>
							<text class="footer-panel-title">快速联动与任务办结</text>
						</view>
						<view class="footer-status-pill" :class="'priority-' + currentTask.priority">
							<text class="footer-status-dot"></text>
							<text class="footer-status-text">{{ getStatusText(currentTask.status) }}</text>
						</view>
					</view>
					<view class="footer-quick-actions">
						<view class="quick-btn quick-btn-alert" @tap="handleSOS">
							<view class="quick-icon-wrap"><text class="quick-icon">🚨</text></view>
							<view class="quick-copy">
								<text class="quick-label">紧急上报</text>
								<text class="quick-desc">同步指挥中心</text>
							</view>
						</view>
						<view class="quick-btn quick-btn-call" @tap="handleCallBackup">
							<view class="quick-icon-wrap"><text class="quick-icon">📞</text></view>
							<view class="quick-copy">
								<text class="quick-label">呼叫增援</text>
								<text class="quick-desc">一键联系支援</text>
							</view>
						</view>
						<view class="quick-btn quick-btn-save" @tap="handleSaveOffline">
							<view class="quick-icon-wrap"><text class="quick-icon">💾</text></view>
							<view class="quick-copy">
								<text class="quick-label">离线保存</text>
								<text class="quick-desc">当前记录落盘</text>
							</view>
						</view>
					</view>
					<view class="complete-action-wrap">
						<view class="complete-action-head">
							<text class="complete-action-title">办结确认</text>
							<text class="complete-action-hint">向右滑动后完成任务</text>
						</view>
						<ActionSlider @complete="handleCompleteTask" />
					</view>
				</view>
			</view>
		</scroll-view>
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
import ActionSlider from './components/ActionSlider.vue'
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
	species: '疑似穿山甲',
	speciesCount: 3,
	protectionLevel: '国家一级',
	riskScore: 96,
	deviceNo: 'GX-IR-201（红外触发）',
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
	{ key: 'evidence',  label: '走私取证', iconPng: '/static/icons/task-tab-evidence.png', badge: 0 },
	{ key: 'checklist', label: '必查清单', iconPng: '/static/icons/task-tab-checklist.png', badge: 5 },
	{ key: 'sampling',  label: '生物样本', iconPng: '/static/icons/task-tab-sampling.png', badge: 0 },
	{ key: 'legal',     label: '执法依据', iconPng: '/static/icons/task-tab-legal.png', badge: 0 },
	{ key: 'record',    label: '执法记录', iconPng: '/static/icons/task-tab-record.png', badge: 0 }
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

// 联合执法联系人
const jointContacts = ref([
	{ dept: '友谊关海关', name: '张科长', phone: '0771-1234567' },
	{ dept: '凭祥市市场监管局', name: '李队长', phone: '0771-2345678' }
])

// 协同阶段进度
const jointStages = ref([
	{ label: '任务下发', done: true, active: false, time: '09:00' },
	{ label: '现场核查', done: true, active: false, time: '09:35' },
	{ label: '海关已介入', done: false, active: true, time: '' },
	{ label: '市监已介入', done: false, active: false, time: '' },
	{ label: '案件办结', done: false, active: false, time: '' }
])

// ===== 底部快速操作 =====
function handleSOS() {
	uni.vibrateLong()
	uni.showToast({ title: '紧急上报已发送', icon: 'success' })
	// TODO: 触发紧急上报流程
}

function handleCallBackup() {
	uni.vibrateShort()
	uni.makePhoneCall({
		phoneNumber: '110',
		fail: () => {
			uni.showToast({ title: '拨打电话失败', icon: 'none' })
		}
	})
}

function handleSaveOffline() {
	uni.vibrateShort()
	uni.showToast({ title: '任务已离线保存', icon: 'success' })
}

function handleCompleteTask() {
	uni.vibrateLong()
	uni.showModal({
		title: '完成任务',
		content: '确认完成此检查任务？',
		confirmText: '确认完成',
		confirmColor: '#10b981',
		success: (res) => {
			if (res.confirm) {
				currentTask.value.progress = 100
				currentTask.value.status = 'completed'
				uni.showToast({ title: '✅ 任务已完成', icon: 'success' })
				setTimeout(() => uni.switchTab({ url: '/pages/Alert Center/Alert Center' }), 1500)
			}
		}
	})
}

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

// 风险评分颜色等级
function getRiskClass(score) {
	if (score >= 80) return 'risk-critical'
	if (score >= 60) return 'risk-high'
	if (score >= 40) return 'risk-medium'
	return 'risk-low'
}

// 截止时间倒计时变色
function getDeadlineClass(deadline) {
	if (!deadline) return ''
	const diff = new Date(deadline) - new Date()
	if (diff < 0)   return 'deadline-overdue'
	if (diff < 600000)  return 'deadline-critical'   // < 10min
	if (diff < 1800000) return 'deadline-warning'     // < 30min
	return ''
}

// 复制联合案件号
function copyCaseNo() {
	if (!currentTask.value.jointCaseNo) return
	uni.setClipboardData({
		data: currentTask.value.jointCaseNo,
		success: () => {
			uni.showToast({ title: '已复制案件号', icon: 'success' })
			uni.vibrateShort()
		}
	})
}

// 一键拨打协同联系人
function callContact(phone) {
	if (!phone) return
	uni.makePhoneCall({ phoneNumber: phone })
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
	uni.vibrateShort()
}

function handleRecordSubmitted(data) {
	uni.showToast({ title: '✅ 执法记录已提交指挥部', icon: 'success', duration: 2000 })
	uni.vibrateLong()
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

// 快速上报：自动填充当前坐标+时间+任务编号，一键生成上报模板
function openQuickReport() {
	const task = currentTask.value
	const loc = currentLocation.value
	const now = new Date()
	const pad = (n) => String(n).padStart(2, '0')
	const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
	const report = `【生态警务快速上报】
工单编号：${task.caseNumber || '--'}
上报时间：${ts}
当前位置：${loc.latitude}, ${loc.longitude}
任务标题：${task.title || '--'}
案件状态：${getStatusText(task.status) || '--'}
风险评分：${task.riskScore ? task.riskScore + '分' : '--'}
涉案物种：${task.species || '--'}${task.speciesCount ? ' ×' + task.speciesCount : ''}
联合单位：${(task.jointDepartments || []).join(' / ') || '--'}
情况说明：（请在此填写）
─────────────────────
上报人：${task.inspectorName || '--'}
所属单位：热眼擒枭边境防控中心`

	uni.showModal({
		title: '📤 快速上报',
		content: report,
		confirmText: '复制上报内容',
		confirmColor: '#00D4FF',
		success: (res) => {
			if (res.confirm) {
				uni.setClipboardData({
					data: report,
					success: () => {
						uni.showToast({ title: '已复制，请发送给指挥部', icon: 'success', duration: 2500 })
						uni.vibrateMedium?.()
					}
				})
			}
		}
	})
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
/* ==========================================
   任务页面 - 全局样式
   生态警务专业设计
   ========================================== */

/* ==========================================
   页面容器
   ========================================== */
.task-page {
	width: 100vw;
	min-height: 100vh;
	background: var(--bg-root);
	padding: calc(env(safe-area-inset-top) + 24rpx) calc(24rpx + env(safe-area-inset-left)) calc(env(safe-area-inset-bottom) + 36rpx) calc(24rpx + env(safe-area-inset-right));
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

/* ==========================================
   任务头部卡片
   ========================================== */
.task-header {
	background: rgba(12, 27, 42, 0.88);
	backdrop-filter: blur(16rpx);
	border-radius: 24rpx;
	padding: 32rpx;
	border: 1px solid var(--line-soft);
	box-shadow: 0 14rpx 34rpx rgba(0, 0, 0, 0.42);
}

.header-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.case-badge {
	padding: 12rpx 24rpx;
	border-radius: 100rpx;
	border: 2rpx solid;
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.case-badge.priority-urgent {
	background: rgba(255, 77, 79, 0.2);
	border-color: #FF4D4F;
}

.case-badge.priority-high {
	background: rgba(255, 169, 64, 0.2);
	border-color: #FFA940;
}

.case-badge.priority-medium {
	background: rgba(0, 212, 255, 0.2);
	border-color: #00d4ff;
}

.case-number {
	font-size: 24rpx;
	font-weight: 700;
	font-family: 'Courier New', monospace;
	letter-spacing: 1rpx;
}

.priority-urgent .case-number { color: #FF4D4F; }
.priority-high .case-number   { color: #FFA940; }
.priority-medium .case-number { color: #00d4ff; }

.status-badge {
	padding: 8rpx 20rpx;
	border-radius: 100rpx;
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.status-badge.status-pending    { background: rgba(140,140,140,.2); border: 1rpx solid #8c8c8c; }
.status-badge.status-in-progress { background: rgba(16,185,129,.2); border: 1rpx solid #10b981; }
.status-badge.status-completed  { background: rgba(115,209,61,.2); border: 1rpx solid #73D13D; }

.status-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: currentColor;
	animation: statusBlink 2s ease-in-out infinite;
}

@keyframes statusBlink {
	0%, 100% { opacity: 1; }
	50%       { opacity: 0.3; }
}

.status-text { font-size: 22rpx; font-weight: 600; color: #fff; }

.task-title {
	font-size: 36rpx;
	font-weight: 800;
	color: #fff;
	line-height: 1.4;
	margin-bottom: 20rpx;
	display: block;
}

.task-meta { display: flex; flex-direction: column; gap: 12rpx; margin-bottom: 24rpx; }
.meta-item { display: flex; align-items: center; gap: 12rpx; }
.meta-icon { font-size: 24rpx; }
.meta-text { font-size: 24rpx; color: rgba(255,255,255,.8); line-height: 1.5; }

/* 截止时间倒计时变色 */
.deadline-countdown.deadline-overdue   { color: #FF4D4F !important; }
.deadline-countdown.deadline-critical { color: #FF4D4F; animation: deadlineBlink .8s ease-in-out infinite; }
.deadline-countdown.deadline-warning   { color: #FFA940; }

@keyframes deadlineBlink {
	0%, 100% { opacity: 1; }
	50%       { opacity: .4; }
}

/* 任务增强信息行：物种/风险/设备 */
.task-info-row { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 20rpx; }

.info-chip {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 16rpx;
	border-radius: 100rpx;
	border: 1.5rpx solid;
	font-size: 22rpx;
	&.species { background: rgba(255,77,79,.12); border-color: rgba(255,77,79,.4); }
	&.risk     { background: rgba(255,169,64,.12); border-color: rgba(255,169,64,.4); }
	&.device   { background: rgba(0,212,255,.1); border-color: rgba(0,212,255,.3); }
}

.chip-icon { font-size: 22rpx; }
.chip-txt  { color: #fff; font-weight: 600; }
.chip-tag {
	font-size: 18rpx;
	padding: 2rpx 10rpx;
	border-radius: 8rpx;
	font-weight: 700;
	&.level-1    { background: rgba(255,77,79,.2); color: #FF4D4F; }
	&.level-2    { background: rgba(255,169,64,.2); color: #FFA940; }
	&.level-3    { background: rgba(156,39,176,.2); color: #CE93D8; }
	&.level-none { background: rgba(140,140,140,.15); color: #8c8c8c; }
}
.chip-score {
	font-family: 'Courier New', monospace;
	font-weight: 800;
	&.risk-critical { color: #FF4D4F; }
	&.risk-high     { color: #FFA940; }
	&.risk-medium   { color: #00D4FF; }
	&.risk-low      { color: #73D13D; }
}

/* 进度条 */
.progress-section { margin-top: 8rpx; }

/* 联合面板 */
.joint-panel {
	margin-top: 18rpx;
	padding: 18rpx;
	border-radius: 16rpx;
	background: rgba(0,212,255,.08);
	border: 1px solid rgba(0,212,255,.25);
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}
.joint-head     { display: flex; justify-content: space-between; align-items: center; }
.joint-title    { font-size: 24rpx; font-weight: 700; color: #dff8ff; }
.joint-state {
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(255,255,255,.12);
	color: #fff;
	&.state-pending    { background: rgba(255,169,64,.2); color: #FFA940; }
	&.state-in-progress { background: rgba(0,212,255,.2); color: var(--brand-primary); }
	&.state-done      { background: rgba(115,209,61,.2); color: #73D13D; }
}
.joint-case, .joint-depts, .joint-notes { font-size: 22rpx; color: rgba(255,255,255,.82); }
.joint-case-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 8rpx; }
.joint-copy-btn {
	padding: 4rpx 16rpx;
	background: rgba(0,212,255,.12);
	border: 1rpx solid rgba(0,212,255,.3);
	border-radius: 10rpx;
	&:active { opacity: .7; }
}
.copy-btn-txt { font-size: 20rpx; color: #00D4FF; font-weight: 600; }

.joint-stages { display: flex; gap: 8rpx; margin: 12rpx 0; flex-wrap: wrap; }
.stage-item {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
	padding: 6rpx 14rpx;
	border-radius: 100rpx;
	font-size: 20rpx;
	background: rgba(255,255,255,.06);
	border: 1rpx solid rgba(255,255,255,.1);
	color: rgba(255,255,255,.5);
	&.done   { background: rgba(115,209,61,.15); border-color: rgba(115,209,61,.4); color: #73D13D; }
	&.active { background: rgba(0,212,255,.15); border-color: rgba(0,212,255,.5); color: #00D4FF; animation: stagePulse 2s ease-in-out infinite; }
}
.stage-dot   { width: 10rpx; height: 10rpx; border-radius: 50%; background: currentColor; }
.stage-label { font-size: 20rpx; font-weight: 600; }
.stage-time  { font-size: 18rpx; opacity: .7; }
@keyframes stagePulse {
	0%, 100% { box-shadow: 0 0 0 0 rgba(0,212,255,.4); }
	50%       { box-shadow: 0 0 0 6rpx rgba(0,212,255,0); }
}

.joint-dept-contacts { display: flex; flex-direction: column; gap: 10rpx; margin-bottom: 10rpx; }
.contact-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10rpx 16rpx;
	background: rgba(255,255,255,.05);
	border-radius: 10rpx;
	border: 1rpx solid rgba(0,212,255,.2);
	&:active { background: rgba(0,212,255,.1); }
}
.contact-dept  { font-size: 22rpx; color: #00D4FF; font-weight: 600; }
.contact-phone { font-size: 20rpx; color: rgba(255,255,255,.7); }

.joint-timeline { margin-top: 8rpx; display: flex; flex-direction: column; gap: 10rpx; }
.timeline-item   { display: flex; gap: 10rpx; }
.timeline-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	margin-top: 10rpx;
	background: var(--brand-primary);
	flex-shrink: 0;
}
.timeline-main   { display: flex; flex-direction: column; gap: 4rpx; }
.timeline-status { font-size: 22rpx; font-weight: 600; color: #fff; }
.timeline-time, .timeline-notes { font-size: 20rpx; color: rgba(255,255,255,.65); }
.timeline-action { font-size: 20rpx; color: #9be8ff; }

.progress-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.progress-label  { font-size: 24rpx; color: rgba(255,255,255,.7); }
.progress-value   { font-size: 28rpx; font-weight: 700; color: #10b981; font-family: 'Courier New', monospace; }
.progress-bar     { height: 12rpx; background: rgba(255,255,255,.1); border-radius: 6rpx; overflow: hidden; }
.progress-fill    { height: 100%; background: linear-gradient(90deg,#10b981 0%,#059669 100%); border-radius: 6rpx; transition: width .5s cubic-bezier(.4,0,.2,1); }

/* 实时定位卡片 */
.location-card {
	background: rgba(12,27,42,.90);
	backdrop-filter: blur(30rpx) saturate(180%);
	border-radius: 24rpx;
	padding: 28rpx;
	border: 1px solid var(--line-soft);
	box-shadow: 0 4rpx 24rpx rgba(0,0,0,.3);
}
.card-header    { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.card-title    { font-size: 28rpx; font-weight: 700; color: #fff; }
.location-status {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 6rpx 16rpx;
	border-radius: 100rpx;
	&.online { background: rgba(16,185,129,.2); border: 1rpx solid #10b981; }
	.status-dot  { width: 10rpx; height: 10rpx; border-radius: 50%; background: #10b981; box-shadow: 0 0 8rpx #10b981; }
	.status-text { font-size: 20rpx; color: #10b981; font-weight: 600; }
}
.location-info    { display: flex; flex-direction: column; gap: 16rpx; margin-bottom: 20rpx; }
.location-row     { display: flex; align-items: center; justify-content: space-between; }
.location-label   { font-size: 24rpx; color: #8c8c8c; }
.location-value   { font-size: 24rpx; color: #fff; font-weight: 600; max-width: 400rpx; text-align: right; }
.location-coords  { font-size: 22rpx; color: #00d4ff; font-family: 'Courier New', monospace; font-weight: 600; }
.location-accuracy { font-size: 22rpx; color: #10b981; font-weight: 600; }
.location-time     { font-size: 20rpx; color: #8c8c8c; }
.location-btn {
	width: 100%;
	height: 72rpx;
	background: rgba(255,255,255,.05);
	border: 1rpx solid rgba(255,255,255,.1);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	transition: all .3s;
	&:active { background: rgba(255,255,255,.1); transform: scale(.98); }
	.btn-icon { font-size: 28rpx; }
	.btn-text { font-size: 26rpx; color: #fff; font-weight: 600; }
}

/* 标签页 */
.tabs-container { margin: 0 -24rpx; padding: 0 calc(24rpx + env(safe-area-inset-left)) 0 calc(24rpx + env(safe-area-inset-right)); }
.tabs-scroll    { white-space: nowrap; }
.tabs           { display: inline-flex; gap: 12rpx; padding-bottom: 8rpx; }
.tab {
	position: relative;
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
	padding: 18rpx 24rpx 16rpx;
	background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03));
	border-radius: 18rpx;
	border: 1rpx solid rgba(255,255,255,.08);
	transition: all .28s ease;
	min-width: 128rpx;
	box-shadow: inset 0 1rpx 0 rgba(255,255,255,.03);
	&.active {
		background: linear-gradient(180deg, rgba(0,212,255,.18), rgba(0,116,182,.12));
		border-color: rgba(0,212,255,.58);
		box-shadow: 0 8rpx 24rpx rgba(0,212,255,.18), inset 0 1rpx 0 rgba(255,255,255,.08);
	}
	&:active  { transform: scale(.96); }
}
.tab::after {
	content: '';
	position: absolute;
	left: 18rpx;
	right: 18rpx;
	bottom: 0;
	height: 4rpx;
	border-radius: 999rpx;
	background: transparent;
	transition: all .28s ease;
}
.tab.active::after {
	background: linear-gradient(90deg, rgba(0,212,255,.18), rgba(0,212,255,.92), rgba(115,231,255,.18));
	box-shadow: 0 0 12rpx rgba(0,212,255,.38);
}
.tab-icon-wrap {
	width: 58rpx;
	height: 58rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255,255,255,.05);
	border: 1rpx solid rgba(255,255,255,.06);
	position: relative;
}
.tab.active .tab-icon-wrap {
	background: rgba(255,255,255,.1);
	border-color: rgba(255,255,255,.1);
}
.tab-icon-img  { width: 34rpx; height: 34rpx; }
.tab-label     { font-size: 22rpx; color: rgba(255,255,255,.64); font-weight: 700; line-height: 1.2; }
.tab.active .tab-label { color: #e9fbff; }
.tab-badge {
	position: absolute;
	top: -8rpx;
	right: -8rpx;
	min-width: 34rpx;
	height: 34rpx;
	padding: 0 8rpx;
	background: #FF4D4F;
	border-radius: 17rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2rpx 10rpx rgba(255,77,79,.52);
	border: 2rpx solid rgba(6,10,20,.92);
}
.badge-num { font-size: 18rpx; color: #fff; font-weight: 800; }

/* 内容滚动区域 */
.content-scroll  { flex: 1; overflow: hidden; }
.content-section { padding: 24rpx 0; }

/* 底部操作区：跟随内容流动，避免遮挡主页面 */
.footer-actions {
	margin-top: 8rpx;
	padding: 8rpx 0 calc(20rpx + env(safe-area-inset-bottom));
	background: transparent;
	backdrop-filter: none;
	z-index: 1;
}
.footer-actions-flow {
	position: relative;
	left: auto;
	right: auto;
	bottom: auto;
	transform: none;
}
.footer-actions-panel {
	background: linear-gradient(180deg, rgba(11,24,40,0.96), rgba(8,18,30,0.98));
	border: 1px solid rgba(64,196,255,0.16);
	border-radius: 28rpx;
	box-shadow: 0 -10rpx 36rpx rgba(0,0,0,0.28), inset 0 1rpx 0 rgba(255,255,255,0.04);
	padding: 18rpx;
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}
.footer-panel-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
}
.footer-panel-title-wrap {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	min-width: 0;
}
.footer-panel-kicker {
	font-size: 18rpx;
	line-height: 1.2;
	color: rgba(144, 201, 255, 0.6);
	letter-spacing: 2rpx;
}
.footer-panel-title {
	font-size: 28rpx;
	font-weight: 800;
	color: #f3fbff;
	line-height: 1.35;
}
.footer-status-pill {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.08);
}
.footer-status-pill.priority-urgent {
	background: rgba(255,77,79,0.14);
	border-color: rgba(255,77,79,0.35);
}
.footer-status-pill.priority-high {
	background: rgba(255,169,64,0.14);
	border-color: rgba(255,169,64,0.35);
}
.footer-status-pill.priority-medium {
	background: rgba(0,212,255,0.14);
	border-color: rgba(0,212,255,0.35);
}
.footer-status-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: #73D13D;
	box-shadow: 0 0 10rpx rgba(115,209,61,0.55);
}
.footer-status-pill.priority-urgent .footer-status-dot {
	background: #FF4D4F;
	box-shadow: 0 0 10rpx rgba(255,77,79,0.55);
}
.footer-status-pill.priority-high .footer-status-dot {
	background: #FFA940;
	box-shadow: 0 0 10rpx rgba(255,169,64,0.55);
}
.footer-status-pill.priority-medium .footer-status-dot {
	background: #00D4FF;
	box-shadow: 0 0 10rpx rgba(0,212,255,0.55);
}
.footer-status-text {
	font-size: 20rpx;
	font-weight: 700;
	color: #eef9ff;
}
.footer-quick-actions {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 14rpx;
}
.quick-btn {
	min-height: 110rpx;
	padding: 18rpx 16rpx;
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	gap: 14rpx;
	border: 1px solid rgba(255,255,255,0.08);
	background: rgba(255,255,255,0.04);
	box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.03);
}
.quick-btn:active {
	transform: scale(0.98);
}
.quick-btn-alert {
	background: linear-gradient(135deg, rgba(255,77,79,0.16), rgba(255,77,79,0.08));
	border-color: rgba(255,77,79,0.26);
}
.quick-btn-call {
	background: linear-gradient(135deg, rgba(255,169,64,0.16), rgba(255,169,64,0.08));
	border-color: rgba(255,169,64,0.26);
}
.quick-btn-save {
	background: linear-gradient(135deg, rgba(64,196,255,0.16), rgba(64,196,255,0.08));
	border-color: rgba(64,196,255,0.26);
}
.quick-icon-wrap {
	width: 56rpx;
	height: 56rpx;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255,255,255,0.08);
	flex-shrink: 0;
}
.quick-icon {
	font-size: 30rpx;
	line-height: 1;
}
.quick-copy {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}
.quick-label {
	font-size: 24rpx;
	font-weight: 700;
	color: #f3fbff;
	line-height: 1.2;
}
.quick-desc {
	font-size: 18rpx;
	line-height: 1.3;
	color: rgba(216,236,255,0.64);
}
.complete-action-wrap {
	padding: 18rpx;
	border-radius: 24rpx;
	background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
	border: 1px solid rgba(255,255,255,0.08);
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}
.complete-action-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
}
.complete-action-title {
	font-size: 24rpx;
	font-weight: 800;
	color: #f3fbff;
}
.complete-action-hint {
	font-size: 18rpx;
	color: rgba(180, 214, 242, 0.68);
	text-align: right;
}

/* 横屏适配 */
@media (orientation: landscape) {
	.task-page { padding: calc(env(safe-area-inset-top) + 14rpx) calc(20rpx + env(safe-area-inset-left)) calc(env(safe-area-inset-bottom) + 20rpx) calc(20rpx + env(safe-area-inset-right)); gap: 14rpx; }
	.task-header, .location-card { padding: 20rpx; }
	.task-title { font-size: 30rpx; }
	.tabs { flex-direction: row; }
	.content-section { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18rpx; }
	.footer-actions { padding-left: 0; padding-right: 0; }
	.footer-actions-panel { gap: 14rpx; }
	.footer-quick-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

/* 平板适配 */
@media (min-width: 768px) {
	.task-page { max-width: 1200rpx; margin: 0 auto; padding: calc(env(safe-area-inset-top) + 32rpx) calc(48rpx + env(safe-area-inset-left)) calc(env(safe-area-inset-bottom) + 36rpx) calc(48rpx + env(safe-area-inset-right)); }
	.task-header { padding: 40rpx; }
	.location-card { padding: 32rpx; }
	.footer-actions { max-width: none; left: auto; }
}

/* 小屏适配 */
@media (max-width: 375px) {
	.task-page { padding-left: calc(14rpx + env(safe-area-inset-left)); padding-right: calc(14rpx + env(safe-area-inset-right)); }
	.task-header, .location-card { border-radius: 18rpx; padding: 20rpx; }
	.task-title { font-size: 30rpx; }
	.footer-panel-head,
	.complete-action-head {
		flex-direction: column;
		align-items: flex-start;
	}
	.footer-quick-actions { grid-template-columns: 1fr; }
	.quick-btn { min-height: 96rpx; }
}

/* 响应式工具类 */
.flex-center   { display: flex; align-items: center; justify-content: center; }
.flex-between  { display: flex; align-items: center; justify-content: space-between; }
.flex-column   { display: flex; flex-direction: column; }

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

