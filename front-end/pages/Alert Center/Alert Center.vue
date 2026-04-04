<template>
	<view class="alert-center-page">
		<!-- 顶部 Header -->
		<view class="ac-header">
			<view class="ac-header-top">
				<view class="ac-title-group">
					<view class="ac-live-dot"></view>
					<text class="ac-header-hint">实时接入</text>
					<view v-if="realtimeStore.badgeText" class="ac-badge">{{ realtimeStore.badgeText }}</view>
				</view>
				<view class="ac-refresh-btn" @tap="onRefresh">
					<text class="ac-refresh-icon">🔄</text>
				</view>
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
				<AlertList :alerts="filteredAlerts" :category="activeCategory" @alertClick="handleAlertClick" @ignoreAlert="handleIgnoreAlert" @createTask="handleCreateTask" />
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

const realtimeStore = useRealtimeStore()

const activeCategory = ref('enforcement')  // 默认：生态警务-走私预警
const activeFilter = ref('all')  // 筛选条件
const alerts = ref([])
const fooddrugAlerts = ref([])
const enforcementAlerts = ref([])  // 生态警务预警
const alertCounts = ref({ all: 0, critical: 0, warning: 0, handled: 0 })
const detailVisible = ref(false)
const selectedAlert = ref(null)
const hasMore = ref(true)
const refreshing = ref(false)
let updateTimer = null

// 分类选项卡
const categoryTabs = ref([
	{ value: 'enforcement', label: '走私预警', icon: '👮' },
	{ value: 'ecology', label: '环保预警', icon: '🌍' },
	{ value: 'fooddrug', label: '食品药品', icon: '🏥' },
	{ value: 'ignored', label: '回收站', icon: '🗑️' }
])

const filteredAlerts = computed(() => {
	let currentAlerts = []

	if (activeCategory.value === 'ecology') {
		currentAlerts = alerts.value
	} else if (activeCategory.value === 'fooddrug') {
		currentAlerts = fooddrugAlerts.value
	} else if (activeCategory.value === 'enforcement') {
		currentAlerts = enforcementAlerts.value
	} else if (activeCategory.value === 'ignored') {
		const all = [...alerts.value, ...enforcementAlerts.value, ...fooddrugAlerts.value]
		return all.filter(a => a.handled === true || a.status === 'resolved' || a.level === 'handled')
	}

	if (activeFilter.value === 'all') return currentAlerts
	if (activeFilter.value === 'handled') {
		return currentAlerts.filter(a => a.handled === true || a.status === 'resolved' || a.level === 'handled')
	}
	return currentAlerts.filter(a => a.level === activeFilter.value)
})

function handleCategoryChange(category) {
	activeCategory.value = category
	activeFilter.value = 'all'  // 切换分类时重置筛选
	loadAlerts()  // 加载对应分类的预警
	updateAlertCounts()
}

function getCategoryCount(category) {
	if (category === 'ecology') {
		return alerts.value.length
	} else if (category === 'fooddrug') {
		return fooddrugAlerts.value.length
	} else if (category === 'enforcement') {
		return enforcementAlerts.value.length
	} else if (category === 'ignored') {
		const all = [...alerts.value, ...enforcementAlerts.value, ...fooddrugAlerts.value]
		return all.filter(a => a.handled === true || a.status === 'resolved' || a.level === 'handled').length
	}
	return 0
}

const processingStats = computed(() => {
	const all = [...alerts.value, ...enforcementAlerts.value, ...fooddrugAlerts.value]
	const pending = all.filter(a => !a.handled)
	const avgTime = pending.length > 0
		? Math.round(pending.reduce((sum, a) => sum + (Date.now() - new Date(a.timestamp || a.time || Date.now()).getTime()), 0) / pending.length / 60000)
		: 0
	return { pending: pending.length, avgMin: avgTime }
})

function getEmptyEmoji() {
	const emojis = {
		'ecology': '🌍',
		'fooddrug': '🏥',
		'enforcement': '👮',
		'ignored': '🗑️'
	}
	return emojis[activeCategory.value] || '🌍'
}

function getEmptyText() {
	const texts = {
		'ecology': '全部生态预警',
		'fooddrug': '全部食品药品预警',
		'enforcement': '全部生态警务预警',
		'ignored': '已忽略预警'
	}
	return texts[activeCategory.value] || '全部预警'
}

function getEmptyHint() {
	const hints = {
		'ecology': '生态环境监测中...',
		'fooddrug': '食品药品检测中...',
		'enforcement': '执法行动追踪中...',
		'ignored': '暂无已忽略的预警'
	}
	return hints[activeCategory.value] || '监测中...'
}

function getCriticalLabel() {
	const labels = {
		'enforcement': '紧急走私',
		'ecology': '严重威胁',
		'fooddrug': '严重风险'
	}
	return labels[activeCategory.value] || '紧急走私'
}

function getWarningLabel() {
	const labels = {
		'enforcement': '高风险线索',
		'ecology': '高风险',
		'fooddrug': '高风险'
	}
	return labels[activeCategory.value] || '高风险线索'
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
	return result.sort((a, b) => b.riskScore - a.riskScore)
}

function generateMockFoodDrugAlerts() {
	const riskLevels = ['critical', 'warning', 'medium', 'low']
	const alertTypes = ['food', 'drug', 'cosmetic']
	const recallStatus = ['not-recalled', 'partial-recall', 'full-recall']
	const manufacturers = ['南宁某乳制品企业', '凭祥某制药企业', '东兴某食品企业', '北海某化妆品企业']
	const products = {
		food: ['牛奶', '酸奶', '奶酪', '面包', '饼干'],
		drug: ['感冒药', '消炎药', '维生素', '中成药'],
		cosmetic: ['面膜', '护肤霜', '口红', '洗面奶']
	}

	const result = []
	for (let i = 1; i <= 12; i++) {
		const type = alertTypes[Math.floor(Math.random() * alertTypes.length)]
		const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)]
		const productList = products[type]
		const productName = productList[Math.floor(Math.random() * productList.length)]

		result.push({
			id: 2000 + i,
			alert_code: `FD-${new Date().getFullYear()}-${String(i).padStart(6, '0')}`,
			alert_type: type,
			level: riskLevel,
			product_name: productName,
			product_batch: `20260${String(Math.floor(Math.random() * 31) + 1).padStart(2, '0')}`,
			manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
			risk_description: '检测到不合格成分',
			affected_consumers: Math.floor(Math.random() * 10000) + 100,
			recall_status: recallStatus[Math.floor(Math.random() * recallStatus.length)],
			status: Math.random() > 0.5 ? 'pending' : 'investigating',
			handled: false,
			create_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
		})
	}
	return result
}

function updateAlertCounts() {
	let currentAlerts = []
	if (activeCategory.value === 'ecology') {
		currentAlerts = alerts.value
	} else if (activeCategory.value === 'fooddrug') {
		currentAlerts = fooddrugAlerts.value
	} else if (activeCategory.value === 'enforcement') {
		currentAlerts = enforcementAlerts.value
	}
	
	alertCounts.value = {
		all: currentAlerts.length,
		critical: currentAlerts.filter(a => a.level === 'critical').length,
		warning: currentAlerts.filter(a => a.level === 'warning').length,
		handled: currentAlerts.filter(a => a.handled || a.status === 'resolved').length
	}
}

async function loadAlerts() {
	if (activeCategory.value === 'ecology') {
		await loadEcologyAlerts()
	} else if (activeCategory.value === 'fooddrug') {
		await loadFoodDrugAlerts()
	} else if (activeCategory.value === 'enforcement') {
		await loadEnforcementAlerts()
	}
	updateAlertCounts()
}

// 加载环保预警
async function loadEcologyAlerts() {
	try {
		uni.showLoading({ title: '加载中...' })
		const fusionResp = await uni.request({
			url: 'http://localhost:5000/api/v1/fusion/events?scene=ecology',
			method: 'GET',
			header: { 'Authorization': `Bearer ${getToken()}` }
		})

		const fusionEvents = fusionResp?.data?.data?.events || []
		if (fusionResp.statusCode === 200 && fusionResp.data?.success && Array.isArray(fusionEvents) && fusionEvents.length > 0) {
		alerts.value = fusionEvents.map((e) => ({
			id: e.id,
			caseNo: `ECO-${e.id}`,
			caseNumber: `ECO-${e.id}`,
			title: e.title || e.event_title || '生态预警',
			message: e.event_desc || e.title || '生态异常事件',
			type: e.type || 'wildlife-track',
			category: 'ecology',
			level: e.level || 'warning',
			status: e.status || 'pending',
			handled: (e.status || 'pending') === 'resolved',
			location: e.location,
			time: e.created_at || new Date(),
			riskScore: e.risk_score || 0,
			speciesType: e.species_name || e.pollutant_type || '生态异常',
			source: e.source || '监测设备',
			urgency: (e.risk_score || 0) >= 80 ? '立即处置' : '2小时内响应'
		}))
		} else {
			const response = await uni.request({
				url: 'http://localhost:5000/api/v1/alerts',
				method: 'GET',
				header: { 'Authorization': `Bearer ${getToken()}` }
			})

			if (response.statusCode === 200 && response.data.success) {
				alerts.value = response.data.data.alerts || []
			} else {
				alerts.value = generateMockAlerts()
			}
		}
		uni.hideLoading()
	} catch (error) {
		console.error('加载环保预警失败:', error)
		alerts.value = generateMockAlerts()
		uni.hideLoading()
	}
}

// 加载食品药品预警
async function loadFoodDrugAlerts() {
	try {
		uni.showLoading({ title: '加载中...' })
		const response = await uni.request({
			url: 'http://localhost:5000/api/v1/fooddrug/alerts',
			method: 'GET',
			header: { 'Authorization': `Bearer ${getToken()}` }
		})
		
		if (response.statusCode === 200 && response.data.success) {
			fooddrugAlerts.value = response.data.data.alerts || []
		} else {
			// 如果API不可用，使用Mock数据
			fooddrugAlerts.value = generateMockFoodDrugAlerts()
		}
		uni.hideLoading()
	} catch (error) {
		console.error('加载食品药品预警失败:', error)
		// 使用Mock数据作为备选
		fooddrugAlerts.value = generateMockFoodDrugAlerts()
		uni.hideLoading()
	}
}

// 加载生态警务预警
async function loadEnforcementAlerts() {
	try {
		uni.showLoading({ title: '加载中...' })

		const fusionResp = await uni.request({
			url: 'http://localhost:5000/api/v1/fusion/events?scene=enforcement',
			method: 'GET',
			header: { 'Authorization': `Bearer ${getToken()}` }
		})
		const fusionEvents = fusionResp?.data?.data?.events || []

		if (fusionResp.statusCode === 200 && fusionResp.data?.success && Array.isArray(fusionEvents) && fusionEvents.length > 0) {
			enforcementAlerts.value = fusionEvents.map((a) => ({
				id: a.id,
				caseNumber: a.case_number || a.caseNo || `SA-${a.id}`,
				caseNo: a.case_number || a.caseNo || `SA-${a.id}`,
				type: a.type || a.target_type || 'intelligence',
				category: 'enforcement',
				level: a.level || 'warning',
				status: a.status || 'pending',
				handled: (a.status || 'pending') === 'resolved',
				riskScore: a.risk_score ?? 0,
				timestamp: a.created_at ?? new Date(),
				location: a.location,
				legalBasis: a.legal_basis || '',
				penaltySuggestion: a.penalty_suggestion || '',
				penaltyRecommendation: a.penalty_suggestion || '',
				pollutantType: a.species_type || '',
				affectedPopulation: a.animal_count ?? 0,
				source: a.source || '边境防控',
				urgency: (a.risk_score ?? 0) >= 80 ? '立即出警' : '2小时内响应'
			}))
			uni.hideLoading()
			return
		}

		const response = await uni.request({
			url: 'http://localhost:5000/api/v1/enforcement/alerts',
			method: 'GET',
			header: { 'Authorization': `Bearer ${getToken()}` }
		})
		
		if (response.statusCode === 200 && response.data.success) {
			const list = response.data.data.alerts || []
			if (Array.isArray(list) && list.length > 0) {
				enforcementAlerts.value = list
			} else {
				const wildlifeRes = await uni.request({
					url: 'http://localhost:5000/api/v1/wildlife/smuggling-alerts',
					method: 'GET',
					header: { 'Authorization': `Bearer ${getToken()}` }
				})
				const wfList = wildlifeRes?.data?.data?.alerts || wildlifeRes?.data?.alerts || []
				if (Array.isArray(wfList) && wfList.length > 0) {
					enforcementAlerts.value = wfList.map(a => ({
						id: a.id,
						caseNumber: a.alert_code || a.case_number || a.caseNo || `SA-${a.id}`,
						caseNo: a.alert_code || a.case_number || a.caseNo || `SA-${a.id}`,
						type: a.alert_type,
						category: 'enforcement',
						level: a.level,
						status: a.status,
						handled: a.status === 'resolved',
						riskScore: a.risk_score ?? a.riskScore ?? 0,
						timestamp: a.created_at ?? a.timestamp ?? a.time ?? new Date(),
						location: a.location,
						legalBasis: a.legal_basis || a.legalBasis || '',
						penaltySuggestion: a.penalty_suggestion || a.penaltySuggestion || '',
						penaltyRecommendation: a.penalty_suggestion || a.penaltySuggestion || '',
						pollutantType: a.species_name || a.pollutantType || '',
						affectedPopulation: a.animal_count ?? a.affectedPopulation ?? 0,
						source: a.source || '边境防控',
						urgency: (a.risk_score ?? a.riskScore ?? 0) >= 80 ? '立即出警' : '2小时内响应'
					}))
				} else {
					enforcementAlerts.value = generateMockEnforcementAlerts()
				}
			}
		} else {
			enforcementAlerts.value = generateMockEnforcementAlerts()
		}
		uni.hideLoading()
	} catch (error) {
		console.error('加载生态警务预警失败:', error)
		enforcementAlerts.value = generateMockEnforcementAlerts()
		uni.hideLoading()
	}
}

// 生成生态警务走私Mock数据
function generateMockEnforcementAlerts() {
	const now = Date.now()
	return [
		{
			id: 3001,
			caseNo: 'SA-2026-000101',
			caseNumber: 'SA-2026-000101',
			type: 'checkpoint-anomaly',
			alert_type: 'checkpoint-anomaly',
			title: '疑似非法运输食蟹猴',
			level: 'critical',
			status: 'pending',
			handled: false,
			category: 'enforcement',
			location: '东兴市万尾金滩沿海便道',
			border_section: '东兴段',
			latitude: 21.5318,
			longitude: 108.0325,
			species_name: '食蟹猴',
			animal_count: 12,
			protection_level: 'CITES附录II',
			riskScore: 94,
			exceedRatio: 5,
			affectedPopulation: 12,
			timestamp: new Date(now - 20 * 60 * 1000),
			nearby_officers: 5,
			legal_basis: '《野生动物保护法》第二十三条；《濒危野生动植物种国际贸易公约》',
			legalBasis: '《野生动物保护法》第二十三条；《濒危野生动植物种国际贸易公约》',
			penalty_suggestion: '立即拦截车辆，固定证据后移送刑侦',
			penaltySuggestion: '立即拦截车辆，固定证据后移送刑侦',
			penaltyRecommendation: '立即拦截车辆，固定证据后移送刑侦',
			time: new Date(now - 20 * 60 * 1000),
			source: '卡口抓拍',
			urgency: '立即出警'
		},
		{
			id: 3002,
			caseNo: 'SA-2026-000102',
			caseNumber: 'SA-2026-000102',
			type: 'infrared-trigger',
			alert_type: 'infrared-trigger',
			title: '红外相机抓拍疑似穿山甲走私',
			level: 'critical',
			status: 'processing',
			handled: false,
			category: 'enforcement',
			location: '凭祥市友谊关口岸附近',
			border_section: '凭祥段',
			latitude: 22.1128,
			longitude: 106.7612,
			species_name: '疑似穿山甲',
			animal_count: 3,
			protection_level: '国家一级',
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
			id: 3003,
			caseNo: 'SA-2026-000103',
			caseNumber: 'SA-2026-000103',
			type: 'intelligence',
			alert_type: 'intelligence',
			title: '中越边境某界碑处发现异常震动',
			level: 'warning',
			status: 'pending',
			handled: false,
			category: 'enforcement',
			location: '那坡县中越边境某界碑',
			border_section: '那坡段',
			latitude: 23.4245,
			longitude: 105.8336,
			species_name: '未知活体',
			animal_count: 0,
			protection_level: '未知',
			riskScore: 82,
			exceedRatio: 4,
			affectedPopulation: 0,
			timestamp: new Date(now - 120 * 60 * 1000),
			nearby_officers: 3,
			legal_basis: '《边境管理条例》；《野生动物保护法》',
			legalBasis: '《边境管理条例》；《野生动物保护法》',
			penalty_suggestion: '扩大巡查半径并启用无人机热成像复核',
			penaltySuggestion: '扩大巡查半径并启用无人机热成像复核',
			penaltyRecommendation: '扩大巡查半径并启用无人机热成像复核',
			time: new Date(now - 120 * 60 * 1000),
			source: '震动光纤',
			urgency: '2小时内响应'
		}
	].sort((a, b) => b.riskScore - a.riskScore)
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
	const listRef = activeCategory.value === 'ecology' ? alerts : activeCategory.value === 'fooddrug' ? fooddrugAlerts : enforcementAlerts
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
	uni.showToast({ title: '正在跳转到检查任务页...', icon: 'loading' })
	setTimeout(() => {
		// 使用 switchTab 而不是 navigateTo，因为 Task 是 tabbar 页面
		uni.switchTab({
			url: '/pages/Task/Task',
			success: () => {
				uni.hideToast()
				uni.showToast({ title: '已进入生态检查页', icon: 'success' })
			},
			fail: (err) => {
				uni.hideToast()
				uni.showToast({ title: '跳转失败：' + err.errMsg, icon: 'none' })
			}
		})
	}, 300)
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
			const na = activeCategory.value === 'ecology'
				? generateMockAlerts()[0]
				: activeCategory.value === 'fooddrug'
					? generateMockFoodDrugAlerts()[0]
					: generateMockEnforcementAlerts()[0]
			if (activeCategory.value === 'ecology') alerts.value.unshift(na)
			else if (activeCategory.value === 'fooddrug') fooddrugAlerts.value.unshift(na)
			else enforcementAlerts.value.unshift(na)
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

<style lang="scss">
@import './alertCenter.scss';
</style>
