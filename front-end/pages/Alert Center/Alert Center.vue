<template>
	<view class="alert-center-page">
		<!-- 顶部 Header -->
		<view class="ac-header">
			<view class="ac-header-top">
				<view class="ac-title-cluster">
					<view class="ac-title-group">
						<view class="ac-live-dot"></view>
						<text class="ac-header-hint">热眼擒枭智能预警中枢</text>
						<view v-if="realtimeStore.badgeText" class="ac-badge">{{ realtimeStore.badgeText }}</view>
					</view>
					<text class="ac-project-title">热眼擒枭</text>
					<text class="ac-project-subtitle">边境活物走私智能防控引领者 · 多源感知预警中心</text>
				</view>
				<view class="ac-refresh-btn" @tap="onRefresh">
					<text class="ac-refresh-icon">🔄</text>
				</view>
			</view>

			<view class="ac-mission-banner">
				<text class="ac-mission-text">聚焦边境活体转运、便道潜行、可疑运载工具三类风险，联动红外、视频、卡口与轨迹智能识别。</text>
			</view>

			<!-- 分类选项卡 -->
			<view class="ac-category-tabs">
				<view
					v-for="tab in categoryTabs"
					:key="tab.value"
					class="ac-category-tab"
					:class="{ active: activeCategory === tab.value }"
					@tap="handleCategoryChange(tab.value)"
				>
					<text class="tab-icon">{{ tab.icon }}</text>
					<text class="tab-text">{{ tab.label }}</text>
					<text class="tab-count">{{ getCategoryCount(tab.value) }}</text>
				</view>
			</view>

			<view class="ac-stats-row">
				<view class="ac-stat-item">
					<text class="ac-stat-num critical-num">{{ alertCounts.critical }}</text>
					<text class="ac-stat-label">{{ getCriticalLabel() }}</text>
				</view>
				<view class="ac-stat-divider"></view>
				<view class="ac-stat-item">
					<text class="ac-stat-num warning-num">{{ alertCounts.warning }}</text>
					<text class="ac-stat-label">{{ getWarningLabel() }}</text>
				</view>
				<view class="ac-stat-divider"></view>
				<view class="ac-stat-item">
					<text class="ac-stat-num">{{ alertCounts.all }}</text>
					<text class="ac-stat-label">全部</text>
				</view>
				<view class="ac-stat-divider"></view>
				<view class="ac-stat-item">
					<text class="ac-stat-num handled-num">{{ alertCounts.handled }}</text>
					<text class="ac-stat-label">已处理</text>
				</view>
				<view class="ac-stat-divider"></view>
				<view class="ac-stat-item">
					<text class="ac-stat-num time-num">{{ processingStats.avgMin }}</text>
					<text class="ac-stat-label">平均响应(分钟)</text>
				</view>
			</view>
		</view>
		<FilterBar :activeFilter="activeFilter" :counts="alertCounts" @filterChange="handleFilterChange" />
		<scroll-view class="alert-scroll" scroll-y @scrolltolower="loadMore" :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view v-if="filteredAlerts.length === 0" class="empty-state">
				<text class="empty-emoji">{{ getEmptyEmoji() }}</text>
				<text class="empty-text">暂无{{ getEmptyText() }}</text>
				<text class="empty-hint">{{ getEmptyHint() }}</text>
			</view>
			<view v-else class="alert-list-wrap">
				<AlertList :alerts="filteredAlerts" :category="activeCategory"
				@alertClick="handleAlertClick"
				@ignoreAlert="handleIgnoreAlert"
				@createTask="handleCreateTask"
				@investigateAlert="handleInvestigate"
				@archiveAlert="handleArchive"
			/>
			</view>
			<view v-if="hasMore" class="loading-more"><text class="loading-text">加载中...</text></view>
			<view class="list-bottom-pad"></view>
		</scroll-view>
		<AlertDetail :visible="detailVisible" :alert="selectedAlert" @close="closeDetail" @ignore="handleIgnoreAlert" @createTask="handleCreateTask" />
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload, onPullDownRefresh } from '@dcloudio/uni-app'
import { useRealtimeStore } from '../../stores/realtime.js'
import FilterBar from './components/FilterBar.vue'
import AlertList from './components/AlertList.vue'
import AlertDetail from './components/AlertDetail.vue'
import { alertAPI } from '../../utils/alertAPI.js'

const realtimeStore = useRealtimeStore()

const activeCategory = ref('wildlife')  // 默认：野生动物走私预警
const activeFilter = ref('all')  // 筛选条件
const alerts = ref([])
const wildlifeAlerts = ref([])  // 野生动物走私预警
const alertCounts = ref({ all: 0, critical: 0, warning: 0, handled: 0 })
const detailVisible = ref(false)
const selectedAlert = ref(null)
const hasMore = ref(true)
const refreshing = ref(false)
let updateTimer = null

// 分类选项卡 - 边境活物走私防控方向
const categoryTabs = ref([
	{ value: 'wildlife', label: '活体走私', icon: '🦎' },
	{ value: 'border', label: '边境潜行', icon: '🚧' },
	{ value: 'vehicle', label: '运载工具', icon: '🚚' }
])

const filteredAlerts = computed(() => {
	let currentAlerts = []
	if (activeCategory.value === 'wildlife') {
		currentAlerts = wildlifeAlerts.value
	} else if (activeCategory.value === 'border') {
		currentAlerts = alerts.value
	} else if (activeCategory.value === 'vehicle') {
		currentAlerts = alerts.value
	}

	// 先筛选，再按最新时间倒序（30分钟内新增 critical 卡片将获红色脉冲）
	let result = currentAlerts
	if (activeFilter.value !== 'all' && activeFilter.value !== 'handled') {
		result = result.filter(a => a.level === activeFilter.value)
	}
	return result.slice().sort((a, b) => {
		const ta = new Date(a.timestamp || a.time || a.created_at || 0).getTime()
		const tb = new Date(b.timestamp || b.time || b.created_at || 0).getTime()
		return tb - ta  // 最新时间优先
	})
})

function handleCategoryChange(category) {
	activeCategory.value = category
	activeFilter.value = 'all'  // 切换分类时重置筛选
	loadAlerts()  // 加载对应分类的预警
	updateAlertCounts()
}

function getCategoryCount(category) {
	if (category === 'wildlife') return wildlifeAlerts.value.length
	else if (category === 'border') return alerts.value.length
	else if (category === 'vehicle') return alerts.value.length
	return 0
}

const processingStats = computed(() => {
	const all = [...alerts.value, ...wildlifeAlerts.value]
	const pending = all.filter(a => !a.handled)
	const avgTime = pending.length > 0
		? Math.round(pending.reduce((sum, a) => sum + (Date.now() - new Date(a.timestamp || a.time || Date.now()).getTime()), 0) / pending.length / 60000)
		: 0
	return { pending: pending.length, avgMin: avgTime }
})

function getEmptyEmoji() {
	return { 'wildlife': '🦎', 'border': '🚧', 'vehicle': '🚗' }[activeCategory.value] || '📋'
}

function getEmptyText() {
	return { 'wildlife': '活体走私异常预警', 'border': '边境潜行异常预警', 'vehicle': '可疑运载工具预警' }[activeCategory.value] || '全部预警'
}

function getEmptyHint() {
	return { 'wildlife': '聚焦穿山甲、食蟹猴等活物非法转运线索...', 'border': '聚焦边境便道潜行、绕卡穿越等异常行为...', 'vehicle': '聚焦车辆、船只、低空载具等运载工具风险...' }[activeCategory.value] || '监测中...'
}

function getCriticalLabel() {
	return { 'wildlife': '高危走私', 'border': '紧急潜行', 'vehicle': '重点截查' }[activeCategory.value] || '紧急'
}

function getWarningLabel() {
	return { 'wildlife': '重点核查', 'border': '联动核查', 'vehicle': '布控研判' }[activeCategory.value] || '警告'
}

// 生成案件编号
function generateCaseNumber(id, level) {
	const prefix = level === 'critical' ? 'ECO-CRIT' : level === 'warning' ? 'ECO-WARN' : 'ECO-HAND'
	const year = new Date().getFullYear()
	const caseId = String(id).padStart(6, '0')
	return `${prefix}-${year}-${caseId}`
}

// 获取生态/环境预警法律依据
function getLegalBasis(type, riskScore) {
	const score = Number(riskScore) || 0
	const laws = {
		'wildlife-track':   score >= 80 ? '《野生动物保护法》第三十条' : '《野生动物保护法》第二十条',
		'habitat-damage':   score >= 80 ? '《森林法》第四十三条' : '《环境保护法》第六十三条',
		'water-quality':    score >= 80 ? '《水污染防治法》第八十三条' : '《水污染防治法》第七十四条',
		'border-anomaly':   score >= 80 ? '《海关法》第四十二条' : '《边境管理条例》第二十二条'
	}
	return laws[type] || '《野生动物保护法》'
}

function generateMockAlerts() {
	const levels = ['critical', 'warning', 'handled']
	const types = ['wildlife-track', 'habitat-damage', 'water-quality', 'border-anomaly']
	const sources = ['监测设备', '12345热线', '网络舆情', '群众举报', '企业自报']
	const ecologies = {
		'wildlife-track':   ['穿山甲活动', '食蟹猴出没', '野生动物通道异常', '珍稀物种痕迹'],
		'habitat-damage':   ['森林破坏', '湿地萎缩', '植被退化', '生态红线违规'],
		'water-quality':    ['跨境水质异常', '水源地监测', '养殖区异常', '跨境生态违法'],
		'border-anomaly':   ['可疑人员越境', '车辆绕卡', '夜间异常声响', '货物夹带活体']
	}

	const result = []
	for (let i = 1; i <= 15; i++) {
		const level = levels[Math.floor(Math.random() * levels.length)]
		const type = types[Math.floor(Math.random() * types.length)]
		const ecologyType = ecologies[type][Math.floor(Math.random() * ecologies[type].length)]
		const source = sources[Math.floor(Math.random() * sources.length)]
		const riskScore = Math.floor(Math.random() * 55) + 45

		result.push({
			id: 1000 + i,
			caseNo: generateCaseNumber(1000 + i, level),
			level,
			type,
			category: 'ecology',
			title: ecologyType,
			message: `【${ecologyType}】预警事件，请及时核查`,
			location: '监测点' + String.fromCharCode(65 + Math.floor(Math.random() * 5)),
			time: new Date(Date.now() - Math.random() * 3600000 * 24),
			riskScore,
			speciesType: ecologyType,
			source,
			affectedPopulation: Math.floor(Math.random() * 5000) + 100,
			urgency: riskScore >= 90 ? '立即出警' : riskScore >= 70 ? '2小时内响应' : riskScore >= 50 ? '24小时内响应' : '常规处理',
			legalBasis: getLegalBasis(type, riskScore),
			penaltySuggestion: riskScore >= 80 ? '立即拦截处置' : riskScore >= 60 ? '限期整改' : '批评教育',
			handled: level === 'handled'
		})
	}
	return result.sort((a, b) => {
		const ta = new Date(a.timestamp || a.time || 0).getTime()
		const tb = new Date(b.timestamp || b.time || 0).getTime()
		return tb - ta  // 最新时间优先
	})
}

function generateMockFoodDrugAlerts() { /* 已废弃，食药违法数据已移除 */ }

function updateAlertCounts() {
	let currentAlerts = []
	if (activeCategory.value === 'wildlife') {
		currentAlerts = wildlifeAlerts.value
	} else if (activeCategory.value === 'border') {
		currentAlerts = alerts.value
	} else if (activeCategory.value === 'vehicle') {
		currentAlerts = alerts.value
	}
	
	alertCounts.value = {
		all: currentAlerts.length,
		critical: currentAlerts.filter(a => a.level === 'critical').length,
		warning: currentAlerts.filter(a => a.level === 'warning').length,
		handled: currentAlerts.filter(a => a.handled || a.status === 'resolved').length
	}
}

async function loadAlerts() {
	if (activeCategory.value === 'wildlife') {
		await loadWildlifeAlerts()
	} else if (activeCategory.value === 'border' || activeCategory.value === 'vehicle') {
		await loadBorderAlerts()
	}
	updateAlertCounts()
}

// 加载濒危物种走私预警
async function loadWildlifeAlerts() {
	try {
		uni.showLoading({ title: '加载中...' })

		const response = await alertAPI.getAlerts({ category: 'wildlife', limit: 50 })

		if (response.success) {
			const list = response.data?.alerts || []
			if (Array.isArray(list) && list.length > 0) {
				wildlifeAlerts.value = list.map(a => ({
					id: a.id,
					caseNumber: a.alert_code || a.case_number || a.caseNo || `WL-${a.id}`,
					caseNo: a.alert_code || a.case_number || a.caseNo || `WL-${a.id}`,
					type: a.type,
					category: a.category,
					level: a.level,
					status: a.status,
					handled: a.status === 'resolved',
					riskScore: a.riskScore ?? a.risk_score ?? 0,
					timestamp: a.created_at ?? a.timestamp ?? a.time ?? new Date(),
					location: a.location,
					speciesName: a.speciesType || a.species_type || '',
					protection_level: a.protectionLevel || a.protection_level || '',
					protectionLevel: a.protectionLevel || a.protection_level || '',
					border_section: a.borderSection || a.border_section || '',
					borderSection: a.borderSection || a.border_section || '',
					legalBasis: a.legal_basis || a.legalBasis || '',
					penaltySuggestion: a.penalty_suggestion || a.penaltySuggestion || '',
					source: a.source || '边境防控',
					urgency: (a.riskScore ?? a.risk_score ?? 0) >= 80 ? '立即出警' : '2小时内响应'
				}))
			} else {
				wildlifeAlerts.value = generateMockWildlifeAlerts()
			}
		} else {
			wildlifeAlerts.value = generateMockWildlifeAlerts()
		}
		uni.hideLoading()
	} catch (error) {
		console.error('加载濒危物种预警失败:', error)
		wildlifeAlerts.value = generateMockWildlifeAlerts()
		uni.hideLoading()
	}
}

// 加载边境/车辆预警
async function loadBorderAlerts() {
	try {
		uni.showLoading({ title: '加载中...' })

		const response = await alertAPI.getAlerts({ category: 'border', limit: 50 })

		if (response.success) {
			const list = response.data?.alerts || []
			alerts.value = list
		} else {
			alerts.value = generateMockBorderAlerts()
		}
		uni.hideLoading()
	} catch (error) {
		console.error('加载边境预警失败:', error)
		alerts.value = generateMockBorderAlerts()
		uni.hideLoading()
	}
}

// 生成边境入侵预警Mock数据
function generateMockBorderAlerts() {
	const now = Date.now()
	return [
		{
			id: 5001,
			caseNo: 'BD-2026-000101',
			caseNumber: 'BD-2026-000101',
			type: 'border-intrusion',
			alert_type: 'border-intrusion',
			title: '边境便道夜间异常潜行',
			level: 'critical',
			status: 'pending',
			handled: false,
			category: 'border',
			location: '凭祥市友谊关便道 3 号段',
			border_section: '凭祥友谊关',
			latitude: 22.1128,
			longitude: 106.7612,
			riskScore: 92,
			timestamp: new Date(now - 15 * 60 * 1000),
			source: '震动光纤 + 红外热成像',
			urgency: '立即出警',
			aiReason: '边境便道 12 分钟内连续两次触发震动光纤，热成像识别到多目标低姿态移动，疑似绕卡潜行。',
			featureTags: ['夜间潜行', '便道绕卡', '多源一致', '重点边境段'],
			targetType: '疑似人员/夹带活体',
			recommendAction: '建议立即联动巡逻组封控便道并复核周边热视频。'
		},
		{
			id: 5002,
			caseNo: 'VH-2026-000101',
			caseNumber: 'VH-2026-000101',
			type: 'suspicious-vehicle',
			alert_type: 'suspicious-vehicle',
			title: '可疑运载车辆绕卡停留',
			level: 'warning',
			status: 'pending',
			handled: false,
			category: 'vehicle',
			location: '东兴口岸外围联络道',
			border_section: '东兴口岸',
			latitude: 21.5450,
			longitude: 107.9720,
			riskScore: 78,
			timestamp: new Date(now - 60 * 60 * 1000),
			source: '卡口摄像 + 轨迹分析',
			urgency: '2小时内响应',
			aiReason: '目标车辆 40 分钟内两次绕开卡口主通道，夜间短停靠近边境便道，轨迹与历史活体转运案件相似。',
			featureTags: ['绕卡通行', '短停换装', '历史相似', '运载工具异常'],
			targetType: '厢式货车',
			recommendAction: '建议调取近 2 小时过车记录并推送车辆布控组核查。'
		},
		{
			id: 5003,
			caseNo: 'BD-2026-000102',
			caseNumber: 'BD-2026-000102',
			type: 'river-crossing',
			alert_type: 'river-crossing',
			title: '北仑河夜航偷渡接驳异常',
			level: 'critical',
			status: 'pending',
			handled: false,
			category: 'border',
			location: '东兴市北仑河 2 号水域',
			border_section: '东兴北仑河段',
			latitude: 21.5258,
			longitude: 107.9925,
			riskScore: 90,
			timestamp: new Date(now - 32 * 60 * 1000),
			source: '水面雷达 + 夜视视频',
			urgency: '立即出警',
			aiReason: '夜航船只关闭识别灯后在河道弯道短暂停靠，疑似与岸边人员进行活体转运接驳。',
			featureTags: ['夜航接驳', '水域异常', '短停靠岸', '高危水线'],
			targetType: '无牌快艇',
			recommendAction: '建议同步通知水上巡逻组与岸线巡防组实施夹击拦截。'
		},
		{
			id: 5004,
			caseNo: 'VH-2026-000102',
			caseNumber: 'VH-2026-000102',
			type: 'cold-chain-transport',
			alert_type: 'cold-chain-transport',
			title: '冷链车异常温区疑似夹带活体',
			level: 'warning',
			status: 'investigating',
			handled: false,
			category: 'vehicle',
			location: '凭祥综合保税区货运通道',
			border_section: '凭祥保税区段',
			latitude: 22.0982,
			longitude: 106.7466,
			riskScore: 74,
			timestamp: new Date(now - 95 * 60 * 1000),
			source: '车厢温感 + AI 视频复核',
			urgency: '2小时内响应',
			aiReason: '冷链车厢内出现与报备货种不符的局部高热区，伴随不规则撞笼声特征。',
			featureTags: ['冷链夹带', '温区异常', '声纹异动', '重点货运'],
			targetType: '冷链货车',
			recommendAction: '建议引导车辆至二次查验区，核验箱体与运输单证。'
		},
		{
			id: 5005,
			caseNo: 'BD-2026-000103',
			caseNumber: 'BD-2026-000103',
			type: 'low-altitude-drop',
			alert_type: 'low-altitude-drop',
			title: '低空无人机疑似跨境投送',
			level: 'warning',
			status: 'pending',
			handled: false,
			category: 'border',
			location: '龙州县平而关边境山坳',
			border_section: '龙州平而关段',
			latitude: 22.3412,
			longitude: 106.4208,
			riskScore: 69,
			timestamp: new Date(now - 150 * 60 * 1000),
			source: '低空雷达 + 声学阵列',
			urgency: '2小时内响应',
			aiReason: '低空目标在边境线附近悬停 43 秒后快速返航，疑似进行小型笼箱投送。',
			featureTags: ['低空投送', '无人机入侵', '边境山坳', '返航异常'],
			targetType: '四旋翼无人机',
			recommendAction: '建议锁定返航方向并组织山地巡防组开展落点排查。'
		},
		{
			id: 5006,
			caseNo: 'VH-2026-000103',
			caseNumber: 'VH-2026-000103',
			type: 'motorbike-smuggling',
			alert_type: 'motorbike-smuggling',
			title: '摩托车便道高频往返异常',
			level: 'handled',
			status: 'resolved',
			handled: true,
			category: 'vehicle',
			location: '那坡县百省乡山林便道',
			border_section: '那坡百省段',
			latitude: 23.1885,
			longitude: 105.9262,
			riskScore: 66,
			timestamp: new Date(now - 4 * 60 * 60 * 1000),
			source: '卡点抓拍 + 山路轨迹比对',
			urgency: '已处置',
			aiReason: '目标摩托车在短时间内三次往返林间便道，已由属地力量拦停核查。',
			featureTags: ['山林便道', '短时往返', '已落地核查', '留痕完成'],
			targetType: '两轮摩托车',
			recommendAction: '已完成现场处置，建议归档并保留轨迹样本。'
		}
	]
}

// 生成濒危物种走私预警Mock数据
function generateMockWildlifeAlerts() {
	const now = Date.now()
	return [
		{
			id: 4001,
			caseNo: 'WL-2026-000101',
			caseNumber: 'WL-2026-000101',
			type: 'wildlife-smuggling',
			alert_type: 'wildlife-smuggling',
			title: '疑似非法运输穿山甲',
			level: 'critical',
			status: 'pending',
			handled: false,
			category: 'wildlife',
			location: '东兴市万尾金滩沿海便道',
			border_section: '东兴段',
			latitude: 21.5318,
			longitude: 108.0325,
			species_name: '穿山甲',
			speciesType: '穿山甲',
			animal_count: 12,
			species_count: 12,
			protection_level: '国家一级',
			protectionLevel: '国家一级',
			riskScore: 94,
			exceedRatio: 5,
			affectedPopulation: 12,
			timestamp: new Date(now - 20 * 60 * 1000),
			nearby_officers: 5,
			legal_basis: '《野生动物保护法》第二十三条；《刑法》第三百四十一条',
			legalBasis: '《野生动物保护法》第二十三条；《刑法》第三百四十一条',
			penalty_suggestion: '立即拦截车辆，固定证据后移送刑侦',
			penaltySuggestion: '立即拦截车辆，固定证据后移送刑侦',
			penaltyRecommendation: '立即拦截车辆，固定证据后移送刑侦',
			time: new Date(now - 20 * 60 * 1000),
			source: '卡口抓拍',
			urgency: '立即出警'
		},
		{
			id: 4002,
			caseNo: 'WL-2026-000102',
			caseNumber: 'WL-2026-000102',
			type: 'wildlife-smuggling',
			alert_type: 'wildlife-smuggling',
			title: '红外相机抓拍疑似穿山甲走私',
			level: 'critical',
			status: 'processing',
			handled: false,
			category: 'wildlife',
			location: '凭祥市友谊关口岸附近',
			border_section: '凭祥友谊关',
			latitude: 22.1128,
			longitude: 106.7612,
			species_name: '穿山甲',
			speciesType: '穿山甲',
			animal_count: 3,
			species_count: 3,
			protection_level: '国家一级',
			protectionLevel: '国家一级',
			riskScore: 96,
			exceedRatio: 5,
			affectedPopulation: 3,
			timestamp: new Date(now - 50 * 60 * 1000),
			nearby_officers: 4,
			legal_basis: '《野生动物保护法》第二十四条；《刑法》第三百四十一条',
			legalBasis: '《野生动物保护法》第二十四条；《刑法》第三百四十一条',
			penalty_suggestion: '立即布控友谊关及周边卡口并开展联合查缉',
			penaltySuggestion: '立即布控友谊关及周边卡口并开展联合查缉',
			penaltyRecommendation: '立即布控友谊关及周边卡口并开展联合查缉',
			time: new Date(now - 50 * 60 * 1000),
			source: '红外摄像头',
			urgency: '立即出警'
		},
		{
			id: 4003,
			caseNo: 'WL-2026-000103',
			caseNumber: 'WL-2026-000103',
			type: 'wildlife-smuggling',
			alert_type: 'wildlife-smuggling',
			title: '疑似象牙走私',
			level: 'warning',
			status: 'pending',
			handled: false,
			category: 'wildlife',
			location: '龙州县水口口岸',
			border_section: '龙州水口',
			latitude: 22.4868,
			longitude: 106.6719,
			species_name: '象牙',
			speciesType: '象牙',
			animal_count: 0,
			species_count: 0,
			protection_level: '国家一级',
			protectionLevel: '国家一级',
			riskScore: 85,
			exceedRatio: 4,
			affectedPopulation: 0,
			timestamp: new Date(now - 120 * 60 * 1000),
			nearby_officers: 3,
			legal_basis: '《野生动物保护法》第三十五条；《刑法》第三百四十一条',
			legalBasis: '《野生动物保护法》第三十五条；《刑法》第三百四十一条',
			penalty_suggestion: '扩大巡查半径并启用无人机热成像复核',
			penaltySuggestion: '扩大巡查半径并启用无人机热成像复核',
			penaltyRecommendation: '扩大巡查半径并启用无人机热成像复核',
			time: new Date(now - 120 * 60 * 1000),
			source: '卡口摄像',
			urgency: '2小时内响应'
		},
		{
			id: 4004,
			caseNo: 'WL-2026-000104',
			caseNumber: 'WL-2026-000104',
			type: 'wildlife-smuggling',
			alert_type: 'wildlife-smuggling',
			title: '可疑活体鸟类笼箱过检异常',
			level: 'warning',
			status: 'investigating',
			handled: false,
			category: 'wildlife',
			location: '东兴边民互市查验通道',
			border_section: '东兴互市段',
			latitude: 21.5428,
			longitude: 107.9798,
			species_name: '鹦鹉类活体',
			speciesType: '鹦鹉类活体',
			animal_count: 18,
			species_count: 18,
			protection_level: '待鉴定',
			protectionLevel: '待鉴定',
			riskScore: 76,
			exceedRatio: 3,
			affectedPopulation: 18,
			timestamp: new Date(now - 85 * 60 * 1000),
			nearby_officers: 4,
			legal_basis: '《野生动物保护法》第二十四条；《海关法》第八十二条',
			legalBasis: '《野生动物保护法》第二十四条；《海关法》第八十二条',
			penalty_suggestion: '建议暂扣笼箱并开展物种鉴定与票证核验',
			penaltySuggestion: '建议暂扣笼箱并开展物种鉴定与票证核验',
			penaltyRecommendation: '建议暂扣笼箱并开展物种鉴定与票证核验',
			time: new Date(now - 85 * 60 * 1000),
			source: 'X光机 + 视频复核',
			urgency: '2小时内响应'
		},
		{
			id: 4005,
			caseNo: 'WL-2026-000105',
			caseNumber: 'WL-2026-000105',
			type: 'wildlife-smuggling',
			alert_type: 'wildlife-smuggling',
			title: '疑似食蟹猴转运箱热成像异常',
			level: 'critical',
			status: 'pending',
			handled: false,
			category: 'wildlife',
			location: '凭祥浦寨货场 7 号库区',
			border_section: '凭祥浦寨段',
			latitude: 22.1062,
			longitude: 106.7448,
			species_name: '食蟹猴',
			speciesType: '食蟹猴',
			animal_count: 6,
			species_count: 6,
			protection_level: '国家二级',
			protectionLevel: '国家二级',
			riskScore: 91,
			exceedRatio: 5,
			affectedPopulation: 6,
			timestamp: new Date(now - 42 * 60 * 1000),
			nearby_officers: 5,
			legal_basis: '《野生动物保护法》第二十一条；《刑法》第三百四十一条',
			legalBasis: '《野生动物保护法》第二十一条；《刑法》第三百四十一条',
			penalty_suggestion: '立即封控库区并开展活体安全转移与取证',
			penaltySuggestion: '立即封控库区并开展活体安全转移与取证',
			penaltyRecommendation: '立即封控库区并开展活体安全转移与取证',
			time: new Date(now - 42 * 60 * 1000),
			source: '热成像 + 声纹识别',
			urgency: '立即出警'
		},
		{
			id: 4006,
			caseNo: 'WL-2026-000106',
			caseNumber: 'WL-2026-000106',
			type: 'wildlife-smuggling',
			alert_type: 'wildlife-smuggling',
			title: '海龟制品申报货样不符',
			level: 'handled',
			status: 'resolved',
			handled: true,
			category: 'wildlife',
			location: '防城港企沙报关查验点',
			border_section: '防城港企沙段',
			latitude: 21.6148,
			longitude: 108.3642,
			species_name: '海龟制品',
			speciesType: '海龟制品',
			animal_count: 0,
			species_count: 0,
			protection_level: '国家二级',
			protectionLevel: '国家二级',
			riskScore: 71,
			exceedRatio: 2,
			affectedPopulation: 0,
			timestamp: new Date(now - 6 * 60 * 60 * 1000),
			nearby_officers: 2,
			legal_basis: '《野生动物保护法》第三十条；《海关行政处罚实施条例》',
			legalBasis: '《野生动物保护法》第三十条；《海关行政处罚实施条例》',
			penalty_suggestion: '已完成查扣取证，建议归档并纳入样本库',
			penaltySuggestion: '已完成查扣取证，建议归档并纳入样本库',
			penaltyRecommendation: '已完成查扣取证，建议归档并纳入样本库',
			time: new Date(now - 6 * 60 * 60 * 1000),
			source: '报关单证 + 图像比对',
			urgency: '已处置'
		}
	]
}

// 获取Token
function getToken() {
	// 从本地存储获取token
	const token = uni.getStorageSync('token')
	return token || ''
}

function handleFilterChange(filter) { activeFilter.value = filter; uni.vibrateShort() }
function getFilterText() { return { all: '全部', critical: '紧急', warning: '预警', handled: '已处理' }[activeFilter.value] || '' }
function handleAlertClick(alert) {
	selectedAlert.value = alert
	detailVisible.value = true
	realtimeStore.clearUnread()
	uni.vibrateShort()
}
function closeDetail() { detailVisible.value = false; selectedAlert.value = null }

function handleIgnoreAlert(alert) {
	// 根据当前分类定位要更新的列表，避免只改 ecology 导致 enforcement/fooddrug 不刷新
	const listRef = activeCategory.value === 'wildlife' ? wildlifeAlerts : alerts
	uni.showModal({
		title: '忽略预警',
		content: '确认忽略此预警？该操作将被记录',
		confirmText: '确认忽略',
		confirmColor: '#10b981',
		success: (res) => {
			if (res.confirm) {
				const idx = listRef.value.findIndex(a => a.id === alert.id)
				if (idx !== -1) {
					listRef.value[idx].level = 'handled'
					listRef.value[idx].handled = true
					if (listRef.value[idx].status !== undefined) listRef.value[idx].status = 'resolved'
				}
				updateAlertCounts(); closeDetail()
				uni.showToast({ title: '已忽略', icon: 'success' })
			}
		}
	})
	uni.vibrateShort()
}

function handleCreateTask(alert) {
	uni.vibrateShort()
	uni.showToast({ title: '正在跳转检查任务页...', icon: 'loading' })
	setTimeout(() => {
		uni.switchTab({
			url: '/pages/Task/Task',
			fail: (err) => { uni.showToast({ title: '跳转失败：' + err.errMsg, icon: 'none' }) }
		})
	}, 300)
}

// 转核查：将预警标记为研判中
function handleInvestigate(alert) {
	const listRef = activeCategory.value === 'wildlife' ? wildlifeAlerts : alerts
	uni.showModal({
		title: '转核查', content: `确认将此预警转交核查？`,
		confirmText: '确认', confirmColor: '#FFA940',
		success: (res) => {
			if (res.confirm) {
				const idx = listRef.value.findIndex(a => a.id === alert.id)
				if (idx !== -1) { listRef.value[idx].status = 'investigating'; listRef.value[idx].level = 'warning' }
				updateAlertCounts()
				uni.showToast({ title: '已转核查', icon: 'success' })
			}
		}
	})
	uni.vibrateShort()
}

// 归档：将预警标记为已处理
function handleArchive(alert) {
	const listRef = activeCategory.value === 'wildlife' ? wildlifeAlerts : alerts
	uni.showModal({
		title: '归档', content: `确认归档此预警？`,
		confirmText: '归档', confirmColor: '#8c8c8c',
		success: (res) => {
			if (res.confirm) {
				const idx = listRef.value.findIndex(a => a.id === alert.id)
				if (idx !== -1) { listRef.value[idx].level = 'handled'; listRef.value[idx].handled = true; listRef.value[idx].status = 'resolved' }
				updateAlertCounts()
				uni.showToast({ title: '已归档', icon: 'success' })
			}
		}
	})
	uni.vibrateShort()
}

async function onRefresh() {
	refreshing.value = true
	await loadAlerts()
	refreshing.value = false
	uni.stopPullDownRefresh()
	uni.showToast({ title: '刷新成功', icon: 'success' })
	uni.vibrateShort()
}

function loadMore() {}

onLoad((options) => {
	realtimeStore.connectWs()
	loadAlerts()
	updateTimer = setInterval(() => {
		if (Math.random() < 0.1) {
			const na = activeCategory.value === 'wildlife'
				? generateMockWildlifeAlerts()[0]
				: generateMockBorderAlerts()[0]
			if (activeCategory.value === 'wildlife') wildlifeAlerts.value.unshift(na)
			else alerts.value.unshift(na)
			updateAlertCounts()
			realtimeStore.pushWarning(na)
			if (na.level === 'critical') uni.vibrateLong(); else uni.vibrateShort()
		}
	}, 10000)
})

onPullDownRefresh(() => {
	onRefresh()
})

onUnload(() => {
	if (updateTimer) clearInterval(updateTimer)
	realtimeStore.disconnectWs()
})
</script>

<style lang="scss" scoped>
/* ==================== Alert Center 预警中心页面样式 ==================== */
/* 借鉴参考项目 + 融合走私防控业务 */

/* 整体页面 */
.alert-center-page {
	width: 100vw;
	min-height: 100vh;
	background: #060a14;
	display: flex;
	flex-direction: column;
	position: relative;
}

/* 页面背景网格（借鉴参考项目 GIS 风格）*/
.alert-center-page::before {
	content: '';
	position: fixed;
	inset: 0;
	pointer-events: none;
	background:
		linear-gradient(to right, rgba(0, 212, 255, 0.03) 1px, transparent 1px),
		linear-gradient(to bottom, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
	background-size: 100rpx 100rpx;
	opacity: 0.5;
	z-index: 0;
}

/* Header 整体 */
.ac-header {
	position: sticky;
	top: 0;
	z-index: 30;
	padding: calc(env(safe-area-inset-top) + 12rpx) calc(24rpx + env(safe-area-inset-left)) 0 calc(24rpx + env(safe-area-inset-right));
	background: linear-gradient(180deg, rgba(10, 14, 26, 0.99) 0%, rgba(10, 14, 26, 0.97) 100%);
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.ac-header-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 12rpx;
	gap: 16rpx;
}
.ac-title-cluster {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	min-width: 0;
}
.ac-title-group {
	display: flex;
	align-items: center;
	gap: 12rpx;
	position: relative;
	min-height: 40rpx;
	flex-wrap: wrap;
}
.ac-project-title {
	font-size: 40rpx;
	line-height: 1.1;
	font-weight: 900;
	letter-spacing: 2rpx;
	color: #f4fbff;
	text-shadow: 0 0 18rpx rgba(64, 196, 255, 0.18);
}
.ac-project-subtitle {
	font-size: 22rpx;
	line-height: 1.5;
	color: rgba(190, 228, 255, 0.76);
}
.ac-mission-banner {
	margin: 6rpx 0 14rpx;
	padding: 16rpx 18rpx;
	border-radius: 18rpx;
	background: linear-gradient(135deg, rgba(255, 169, 64, 0.12), rgba(0, 212, 255, 0.08));
	border: 1px solid rgba(255, 255, 255, 0.08);
	box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.05);
}
.ac-mission-text {
	font-size: 22rpx;
	line-height: 1.6;
	color: rgba(234, 246, 255, 0.84);
}

/* 分类选项卡（融入配色） */
.ac-category-tabs {
	display: flex;
	gap: 10rpx;
	padding: 12rpx 0;
	margin: 0 -24rpx;
	padding-left: 24rpx;
	padding-right: 24rpx;
	overflow-x: auto;
	scroll-behavior: smooth;
	border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.ac-category-tab {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 10rpx 16rpx;
	background: rgba(12, 27, 42, 0.88);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 20rpx;
	white-space: nowrap;
	transition: all 0.3s ease;

	&.active {
		background: rgba(0, 212, 255, 0.2);
		border-color: rgba(0, 212, 255, 0.55);
		box-shadow: 0 0 14rpx rgba(0, 212, 255, 0.35), inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
	}
	&:active { transform: scale(0.95); }
}

.tab-icon { font-size: 24rpx; }
.tab-text { font-size: 24rpx; color: rgba(255, 255, 255, 0.7); font-weight: 500; }
.tab-count {
	font-size: 20rpx;
	color: rgba(200, 220, 255, 0.6);
	background: rgba(255, 255, 255, 0.06);
	padding: 2rpx 8rpx;
	border-radius: 10rpx;
	font-weight: 600;
	transition: all 0.2s ease;
}
.ac-category-tab.active .tab-count {
	color: #00d4ff;
	background: rgba(0, 212, 255, 0.15);
}

/* Header 顶栏 */
.ac-header-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12rpx;
}

.ac-title-group {
	display: flex;
	align-items: center;
	gap: 12rpx;
	position: relative;
	min-height: 64rpx;
}

/* 实时脉冲点（借鉴参考项目 + 增强发光） */
.ac-live-dot {
	width: 18rpx;
	height: 18rpx;
	border-radius: 50%;
	background: #FF4D4F;
	box-shadow: 0 0 12rpx #FF4D4F, 0 0 24rpx rgba(255, 77, 79, 0.5);
	flex-shrink: 0;
	animation: acLiveBlink 1.5s ease-in-out infinite;
}

@keyframes acLiveBlink {
	0%, 100% {
		opacity: 1;
		box-shadow: 0 0 12rpx #FF4D4F, 0 0 24rpx rgba(255, 77, 79, 0.5);
		transform: scale(1);
	}
	50% {
		opacity: 0.4;
		box-shadow: 0 0 4rpx #FF4D4F, 0 0 8rpx rgba(255, 77, 79, 0.2);
		transform: scale(0.85);
	}
}

.ac-header-hint {
	font-size: 26rpx;
	font-weight: 700;
	color: #FF4D4F;
	letter-spacing: 2rpx;
	text-shadow: 0 0 20rpx rgba(255, 77, 79, 0.4);
}

.ac-badge {
	min-width: 38rpx;
	height: 38rpx;
	padding: 0 10rpx;
	border-radius: 999rpx;
	background: #FF4D4F;
	color: #fff;
	font-size: 20rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 0 16rpx rgba(255, 77, 79, 0.6);
	animation: acBadgePulse 2s ease-in-out infinite;
}

@keyframes acBadgePulse {
	0%, 100% { box-shadow: 0 0 16rpx rgba(255, 77, 79, 0.6); }
	50%       { box-shadow: 0 0 24rpx rgba(255, 77, 79, 0.85); }
}

.ac-title {
	font-size: 34rpx;
	font-weight: 800;
	color: #fff;
	letter-spacing: 1rpx;
}

/* 刷新按钮（增强旋转 + 颜色反馈） */
.ac-refresh-btn {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(0, 212, 255, 0.25);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.4s ease;

	&:active {
		transform: rotate(360deg);
		background: rgba(0, 212, 255, 0.15);
		border-color: rgba(0, 212, 255, 0.5);
	}
}

.ac-refresh-icon {
	font-size: 30rpx;
}

/* 统计数字行 */
.ac-stats-row {
	display: flex;
	align-items: center;
	padding: 16rpx 4rpx 14rpx;
	gap: 0;
}

.ac-stat-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
}

.ac-stat-num {
	font-size: 36rpx;
	font-weight: 800;
	color: #fff;
	font-family: 'Courier New', monospace;
	line-height: 1;
}

.critical-num {
	color: #FF4D4F;
	text-shadow: 0 0 20rpx rgba(255, 77, 79, 0.55);
}
.warning-num {
	color: #FFA940;
	text-shadow: 0 0 20rpx rgba(255, 169, 64, 0.5);
}
.handled-num {
	color: #595959;
}
.time-num {
	color: #00D4FF;
	text-shadow: 0 0 16rpx rgba(0, 212, 255, 0.5);
}

.ac-stat-label {
	font-size: 18rpx;
	color: #6b7280;
	font-weight: 500;
	text-align: center;
	line-height: 1.2;
}

.ac-stat-divider {
	width: 1px;
	height: 40rpx;
	background: rgba(255, 255, 255, 0.07);
}

/* 列表区域 */
.alert-list-wrap {
	padding: 8rpx 16rpx 16rpx;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	position: relative;
	z-index: 1;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 200rpx 64rpx;
	position: relative;
	z-index: 1;
}
.empty-icon {
	width: 200rpx;
	height: 200rpx;
	opacity: 0.3;
	margin-bottom: 32rpx;
}
.empty-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #8CA3B8;
	margin-bottom: 16rpx;
}
.empty-hint {
	font-size: 24rpx;
	color: #595959;
}

.loading-more {
	padding: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.loading-text {
	font-size: 24rpx;
	color: #8CA3B8;
}
.list-bottom-pad { height: 60rpx; }

/* 快捷操作按钮 */
.quick-actions {
	position: fixed;
	right: 32rpx;
	bottom: 120rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	z-index: 100;
}
.action-btn {
	width: 112rpx;
	height: 112rpx;
	background: rgba(12, 27, 42, 0.90);
	backdrop-filter: blur(30rpx) saturate(180%);
	border-radius: 56rpx;
	border: 1px solid rgba(255, 255, 255, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.4);
	transition: all 0.3s ease;
	&:active {
		transform: scale(0.92);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
	}
}
.action-icon { font-size: 48rpx; }

/* 等级颜色（增强发光） */
.level-critical {
	color: #FF4D4F;
	border-color: #FF4D4F;
	background: rgba(255, 77, 79, 0.12);
}
.level-warning {
	color: #FFA940;
	border-color: #FFA940;
	background: rgba(255, 169, 64, 0.12);
}
.level-caution {
	color: #FAAD14;
	border-color: #FAAD14;
	background: rgba(250, 173, 20, 0.1);
}
.level-low {
	color: #73D13D;
	border-color: #73D13D;
	background: rgba(115, 209, 61, 0.08);
}
.level-handled {
	color: #595959;
	border-color: #595959;
	background: rgba(89, 89, 89, 0.08);
}

.glow-critical {
	text-shadow: 0 0 20rpx #FF4D4F;
	box-shadow: 0 0 24rpx rgba(255, 77, 79, 0.65);
}
.glow-warning {
	text-shadow: 0 0 20rpx #FFA940;
	box-shadow: 0 0 20rpx rgba(255, 169, 64, 0.6);
}

/* 紧急新增脉冲 */
.ac-urgent-new {
	animation: pulse-critical 1.8s ease-in-out infinite;
	border-color: rgba(255, 77, 79, 0.55) !important;
	background: rgba(255, 77, 79, 0.08) !important;
}

@keyframes pulse-critical {
	0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7); }
	50%       { box-shadow: 0 0 0 14rpx rgba(255, 77, 79, 0); }
}

/* 工具类 */
.flex-center  { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-column   { display: flex; flex-direction: column; }
.text-xs   { font-size: 20rpx; }
.text-sm   { font-size: 24rpx; }
.text-base { font-size: 28rpx; }
.text-lg   { font-size: 32rpx; }
.text-xl   { font-size: 48rpx; }
.mt-xs { margin-top: 8rpx; }  .mt-sm { margin-top: 16rpx; }
.mt-md { margin-top: 24rpx; } .mt-lg { margin-top: 32rpx; }
.mb-xs { margin-bottom: 8rpx; }  .mb-sm { margin-bottom: 16rpx; }
.mb-md { margin-bottom: 24rpx; } .mb-lg { margin-bottom: 32rpx; }
.p-xs  { padding: 8rpx; }   .p-sm  { padding: 16rpx; }
.p-md  { padding: 24rpx; }  .p-lg  { padding: 32rpx; }

/* ==================== 响应式适配 ==================== */
@media (min-width: 768px) {
	.alert-list-wrap {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24rpx;
		padding: 24rpx 48rpx;
	}
	.ac-header { padding: calc(env(safe-area-inset-top) + 32rpx) 48rpx 0; }
	.filter-bar { padding: 16rpx 48rpx 0; }
}

@media (min-width: 1024px) {
	.alert-list-wrap {
		grid-template-columns: repeat(3, 1fr);
		max-width: 1400rpx;
		margin: 0 auto;
	}
}

@media (orientation: landscape) {
	.ac-header { padding-top: calc(env(safe-area-inset-top) + 12rpx); }
	.ac-title { font-size: 32rpx; }
	.ac-stats-row { padding: 14rpx 8rpx; }
	.alert-list-wrap {
		padding: 12rpx 20rpx;
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 375px) {
	.ac-header {
		padding-left: calc(20rpx + env(safe-area-inset-left));
		padding-right: calc(20rpx + env(safe-area-inset-right));
	}
	.ac-title { font-size: 32rpx; }
	.ac-refresh-btn { width: 64rpx; height: 64rpx; }
	.ac-category-tab { padding: 10rpx 14rpx; }
	.alert-list-wrap { padding: 10rpx 14rpx; gap: 12rpx; }
}
</style>
