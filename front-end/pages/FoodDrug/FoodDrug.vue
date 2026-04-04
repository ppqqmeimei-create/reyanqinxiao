<template>
	<view class="fooddrug-page">
		<!-- 顶部 Header -->
		<view class="fd-header">
			<view class="fd-header-top">
				<view class="fd-title-group">
					<text class="fd-title">🏥 食品药品安全工作台</text>
					<view class="fd-live-dot"></view>
				</view>
				<view class="fd-refresh-btn" @tap="onRefresh">
					<text class="fd-refresh-icon">🔄</text>
				</view>
			</view>
			<view class="fd-stats-row">
				<view class="fd-stat-item">
					<text class="fd-stat-num critical-num">{{ alertCounts.critical }}</text>
					<text class="fd-stat-label">严重风险</text>
				</view>
				<view class="fd-stat-divider"></view>
				<view class="fd-stat-item">
					<text class="fd-stat-num warning-num">{{ alertCounts.warning }}</text>
					<text class="fd-stat-label">高风险</text>
				</view>
				<view class="fd-stat-divider"></view>
				<view class="fd-stat-item">
					<text class="fd-stat-num">{{ alertCounts.all }}</text>
					<text class="fd-stat-label">全部</text>
				</view>
				<view class="fd-stat-divider"></view>
				<view class="fd-stat-item">
					<text class="fd-stat-num handled-num">{{ alertCounts.recalled }}</text>
					<text class="fd-stat-label">已召回</text>
				</view>
			</view>
		</view>

		<!-- 筛选栏 -->
		<FoodDrugFilter :activeFilter="activeFilter" :counts="alertCounts" @filterChange="handleFilterChange" />

		<!-- 预警列表 -->
		<scroll-view class="fooddrug-scroll" scroll-y @scrolltolower="loadMore" :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view v-if="filteredAlerts.length === 0" class="empty-state">
				<text class="empty-emoji">🏥</text>
				<text class="empty-text">暂无{{ getFilterText() }}食品药品预警</text>
				<text class="empty-hint">食品药品安全监测中...</text>
			</view>
			<view v-else class="fooddrug-list-wrap">
				<FoodDrugList :alerts="filteredAlerts" @alertClick="handleAlertClick" @handleAlert="handleAlertAction" />
			</view>
			<view v-if="hasMore" class="loading-more"><text class="loading-text">加载中...</text></view>
			<view class="list-bottom-pad"></view>
		</scroll-view>

		<!-- 预警详情弹窗 -->
		<FoodDrugDetail :visible="detailVisible" :alert="selectedAlert" @close="closeDetail" @handle="handleAlertAction" />

		<!-- 创建预警按钮 -->
		<view class="fab-button" @tap="showCreateDialog">
			<text class="fab-icon">➕</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import FoodDrugFilter from './components/FoodDrugFilter.vue'
import FoodDrugList from './components/FoodDrugList.vue'
import FoodDrugDetail from './components/FoodDrugDetail.vue'

const activeFilter = ref('all')
const alerts = ref([])
const alertCounts = ref({ all: 0, critical: 0, warning: 0, recalled: 0 })
const detailVisible = ref(false)
const selectedAlert = ref(null)
const hasMore = ref(true)
const refreshing = ref(false)
let updateTimer = null

const filteredAlerts = computed(() => {
	if (activeFilter.value === 'all') return alerts.value
	if (activeFilter.value === 'type') return alerts.value
	return alerts.value.filter(a => a.risk_level === activeFilter.value)
})

function getFilterText() {
	const filterMap = {
		all: '',
		critical: '严重风险',
		warning: '高风险',
		recalled: '已召回'
	}
	return filterMap[activeFilter.value] || ''
}

function generateMockAlerts() {
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
			risk_level: riskLevel,
			product_name: productName,
			product_batch: `20260${String(Math.floor(Math.random() * 31) + 1).padStart(2, '0')}`,
			manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
			risk_description: '检测到不合格成分',
			affected_consumers: Math.floor(Math.random() * 10000) + 100,
			recall_status: recallStatus[Math.floor(Math.random() * recallStatus.length)],
			status: Math.random() > 0.5 ? 'pending' : 'investigating',
			create_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
		})
	}
	return result
}

function loadAlerts() {
	alerts.value = generateMockAlerts()
	updateCounts()
}

function updateCounts() {
	alertCounts.value = {
		all: alerts.value.length,
		critical: alerts.value.filter(a => a.risk_level === 'critical').length,
		warning: alerts.value.filter(a => a.risk_level === 'warning').length,
		recalled: alerts.value.filter(a => a.recall_status === 'full-recall').length
	}
}

function handleFilterChange(filter) {
	activeFilter.value = filter
}

function handleAlertClick(alert) {
	selectedAlert.value = alert
	detailVisible.value = true
}

function closeDetail() {
	detailVisible.value = false
	selectedAlert.value = null
}

function handleAlertAction(action) {
	if (action.type === 'recall') {
		uni.showToast({ title: '已启动召回流程', icon: 'success' })
	} else if (action.type === 'handle') {
		uni.showToast({ title: '已标记为处理中', icon: 'success' })
	}
	closeDetail()
	loadAlerts()
}

function onRefresh() {
	refreshing.value = true
	setTimeout(() => {
		loadAlerts()
		refreshing.value = false
	}, 1000)
}

function loadMore() {
	if (hasMore.value) {
		hasMore.value = false
	}
}

function showCreateDialog() {
	uni.showToast({ title: '创建预警功能开发中', icon: 'none' })
}

onLoad(() => {
	loadAlerts()
	updateTimer = setInterval(() => {
		updateCounts()
	}, 30000)
})

onUnload(() => {
	if (updateTimer) clearInterval(updateTimer)
})
</script>

<style lang="scss" scoped>
.fooddrug-page {
	background: linear-gradient(135deg, var(--bg-root) 0%, var(--bg-card) 100%);
	min-height: 100vh;
	padding-bottom: 120rpx;
}

.fd-header {
	padding: 20rpx 24rpx;
	background: rgba(0, 212, 255, 0.05);
	border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.fd-header-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.fd-title-group {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.fd-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #fff;
}

.fd-live-dot {
	width: 12rpx;
	height: 12rpx;
	background: #00ff00;
	border-radius: 50%;
	animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
}

.fd-refresh-btn {
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 212, 255, 0.1);
	border-radius: 50%;
	border: 1px solid rgba(0, 212, 255, 0.3);
}

.fd-refresh-icon {
	font-size: 28rpx;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.fd-stats-row {
	display: flex;
	justify-content: space-around;
	align-items: center;
}

.fd-stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.fd-stat-num {
	font-size: 36rpx;
	font-weight: 700;
	font-family: 'Courier New', monospace;

	&.critical-num { color: #ff4d4f; text-shadow: 0 0 12rpx #ff4d4f; }
	&.warning-num { color: #ffa940; text-shadow: 0 0 12rpx #ffa940; }
	&.handled-num { color: #73d13d; text-shadow: 0 0 12rpx #73d13d; }
}

.fd-stat-label {
	font-size: 20rpx;
	color: #8c8c8c;
}

.fd-stat-divider {
	width: 1px;
	height: 40rpx;
	background: rgba(255, 255, 255, 0.1);
}

.fooddrug-scroll {
	height: calc(100vh - 300rpx);
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 40rpx;
	text-align: center;
}

.empty-emoji {
	font-size: 80rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #fff;
	margin-bottom: 12rpx;
}

.empty-hint {
	font-size: 20rpx;
	color: #8c8c8c;
}

.fooddrug-list-wrap {
	padding: 16rpx 16rpx;
}

.loading-more {
	display: flex;
	justify-content: center;
	padding: 20rpx;
}

.loading-text {
	color: #8c8c8c;
	font-size: 20rpx;
}

.list-bottom-pad {
	height: 40rpx;
}

.fab-button {
	position: fixed;
	bottom: 120rpx;
	right: 24rpx;
	width: 64rpx;
	height: 64rpx;
	background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 16px rgba(0, 212, 255, 0.4);
	z-index: 10;
}

.fab-icon {
	font-size: 36rpx;
	color: #fff;
}
</style>
