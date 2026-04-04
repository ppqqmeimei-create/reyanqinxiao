<template>
	<view class="alert-center-page">
		<!-- 顶部 Header -->
		<view class="ac-header">
			<view class="ac-header-top">
				<view class="ac-title-group">
					<text class="ac-title">🌍 预警工作台</text>
					<view class="ac-live-dot"></view>
				</view>
				<view class="ac-refresh-btn" @tap="onRefresh">
					<text class="ac-refresh-icon">🔄</text>
				</view>
			</view>

			<!-- 分类选项卡 - 添加执法预警 -->
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
			</view>
		</view>

		<FilterBar :activeFilter="activeFilter" :counts="alertCounts" @filterChange="handleFilterChange" />

		<scroll-view class="alert-scroll" scroll-y @scrolltolower="loadMore" :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
			<view v-if="filteredAlerts.length === 0" class="empty-state">
				<text class="empty-emoji">{{ getEmptyEmoji() }}</text>
				<text class="empty-text">暂无{{ getFilterText() }}预警</text>
				<text class="empty-hint">{{ getEmptyHint() }}</text>
			</view>
			<view v-else class="alert-list-wrap">
				<AlertList :alerts="filteredAlerts" @alertClick="handleAlertClick" @ignoreAlert="handleIgnoreAlert" @createTask="handleCreateTask" />
			</view>
			<view v-if="hasMore" class="loading-more"><text class="loading-text">加载中...</text></view>
			<view class="list-bottom-pad"></view>
		</scroll-view>

		<AlertDetail :visible="detailVisible" :alert="selectedAlert" @close="closeDetail" @ignore="handleIgnoreAlert" @createTask="handleCreateTask" />
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import FilterBar from './components/FilterBar.vue'
import AlertList from './components/AlertList.vue'
import AlertDetail from './components/AlertDetail.vue'

const activeFilter = ref('all')
const activeCategory = ref('ecology')  // 'ecology', 'fooddrug', 'enforcement'
const alerts = ref([])
const fooddrugAlerts = ref([])
const enforcementAlerts = ref([])
const alertCounts = ref({ all: 0, critical: 0, warning: 0, handled: 0 })
const detailVisible = ref(false)
const selectedAlert = ref(null)
const hasMore = ref(true)
const refreshing = ref(false)
const loading = ref(false)
let updateTimer = null
let currentPage = 1

// API基础URL
const API_BASE_URL = 'http://localhost:5000/api/v1'

// 分类选项卡 - 添加执法预警
const categoryTabs = ref([
	{ value: 'ecology', label: '环保预警', icon: '🌍' },
	{ value: 'fooddrug', label: '食品药品', icon: '🏥' },
	{ value: 'enforcement', label: '生态警务', icon: '👮' }
])

const filteredAlerts = computed(() => {
	let currentAlerts = []
	if (activeCategory.value === 'ecology') {
		currentAlerts = alerts.value
	} else if (activeCategory.value === 'fooddrug') {
		currentAlerts = fooddrugAlerts.value
	} else if (activeCategory.value === 'enforcement') {
		currentAlerts = enforcementAlerts.value
	}
	
	if (activeFilter.value === 'all') return currentAlerts
	return currentAlerts.filter(a => a.level === activeFilter.value)
})

// 获取分类数量
function getCategoryCount(category) {
	if (category === 'ecology') {
		return alerts.value.length
	} else if (category === 'fooddrug') {
		return fooddrugAlerts.value.length
	} else if (category === 'enforcement') {
		return enforcementAlerts.value.length
	}
	return 0
}

// 获取严重标签
function getCriticalLabel() {
	if (activeCategory.value === 'ecology') return '严重污染'
	if (activeCategory.value === 'fooddrug') return '严重风险'
	if (activeCategory.value === 'enforcement') return '紧急案件'
	return '严重'
}

// 获取警告标签
function getWarningLabel() {
	if (activeCategory.value === 'ecology') return '高风险'
	if (activeCategory.value === 'fooddrug') return '高风险'
	if (activeCategory.value === 'enforcement') return '一般案件'
	return '警告'
}

// 获取空状态emoji
function getEmptyEmoji() {
	if (activeCategory.value === 'ecology') return '🌍'
	if (activeCategory.value === 'fooddrug') return '🏥'
	if (activeCategory.value === 'enforcement') return '👮'
	return '📋'
}

// 获取空状态提示
function getEmptyHint() {
	if (activeCategory.value === 'ecology') return '生态环境监测中...'
	if (activeCategory.value === 'fooddrug') return '食品药品监管中...'
	if (activeCategory.value === 'enforcement') return '执法行动进行中...'
	return '数据加载中...'
}

// 获取筛选文本
function getFilterText() {
	if (activeFilter.value === 'critical') return '严重'
	if (activeFilter.value === 'warning') return '警告'
	if (activeFilter.value === 'info') return '信息'
	return ''
}

// 切换分类
async function handleCategoryChange(category) {
	activeCategory.value = category
	activeFilter.value = 'all'
	currentPage = 1
	await loadAlerts()
}

// 加载预警数据
async function loadAlerts() {
	if (loading.value) return
	loading.value = true

	try {
		let url = ''
		if (activeCategory.value === 'ecology') {
			url = `${API_BASE_URL}/alerts?page=${currentPage}&limit=10`
		} else if (activeCategory.value === 'fooddrug') {
			url = `${API_BASE_URL}/alerts/fooddrug?page=${currentPage}&limit=10`
		} else if (activeCategory.value === 'enforcement') {
			url = `${API_BASE_URL}/alerts/enforcement?page=${currentPage}&limit=10`
		}

		const response = await uni.request({
			url: url,
			method: 'GET',
			header: {
				'Authorization': `Bearer ${uni.getStorageSync('token') || ''}`
			}
		})

		if (response.statusCode === 200 && response.data.success) {
			const newAlerts = response.data.data.alerts || []
			
			if (activeCategory.value === 'ecology') {
				if (currentPage === 1) {
					alerts.value = newAlerts
				} else {
					alerts.value.push(...newAlerts)
				}
			} else if (activeCategory.value === 'fooddrug') {
				if (currentPage === 1) {
					fooddrugAlerts.value = newAlerts
				} else {
					fooddrugAlerts.value.push(...newAlerts)
				}
			} else if (activeCategory.value === 'enforcement') {
				if (currentPage === 1) {
					enforcementAlerts.value = newAlerts
				} else {
					enforcementAlerts.value.push(...newAlerts)
				}
			}

			hasMore.value = newAlerts.length === 10
			updateCounts()
		}
	} catch (error) {
		console.error('加载预警失败:', error)
		uni.showToast({
			title: '加载失败',
			icon: 'error'
		})
	} finally {
		loading.value = false
		refreshing.value = false
	}
}

// 更新统计数据
function updateCounts() {
	const currentAlerts = activeCategory.value === 'ecology' ? alerts.value : 
	                      activeCategory.value === 'fooddrug' ? fooddrugAlerts.value :
	                      enforcementAlerts.value

	alertCounts.value = {
		all: currentAlerts.length,
		critical: currentAlerts.filter(a => a.level === 'critical').length,
		warning: currentAlerts.filter(a => a.level === 'warning').length,
		handled: currentAlerts.filter(a => a.status === 'resolved').length
	}
}

// 筛选变化
function handleFilterChange(filter) {
	activeFilter.value = filter
}

// 加载更多
function loadMore() {
	if (hasMore.value && !loading.value) {
		currentPage++
		loadAlerts()
	}
}

// 刷新
async function onRefresh() {
	refreshing.value = true
	currentPage = 1
	await loadAlerts()
}

// 点击预警
function handleAlertClick(alert) {
	selectedAlert.value = alert
	detailVisible.value = true
}

// 关闭详情
function closeDetail() {
	detailVisible.value = false
	selectedAlert.value = null
}

// 忽略预警
async function handleIgnoreAlert(alert) {
	try {
		const url = `${API_BASE_URL}/alerts/${alert.id}`
		await uni.request({
			url: url,
			method: 'PUT',
			data: { status: 'ignored' },
			header: {
				'Authorization': `Bearer ${uni.getStorageSync('token') || ''}`
			}
		})
		
		uni.showToast({
			title: '已忽略',
			icon: 'success'
		})
		
		await loadAlerts()
	} catch (error) {
		console.error('忽略预警失败:', error)
	}
}

// 创建任务
function handleCreateTask(alert) {
	uni.navigateTo({
		url: `/pages/Task/Task?alertId=${alert.id}`
	})
}

// 页面加载
onLoad(() => {
	loadAlerts()
	
	// 定时刷新
	updateTimer = setInterval(() => {
		loadAlerts()
	}, 30000)
})

// 页面卸载
onUnload(() => {
	if (updateTimer) {
		clearInterval(updateTimer)
	}
})
</script>

<style scoped lang="scss">
@import './alertCenter.scss';

// 响应式布局优化
@media (max-width: 768px) {
	.ac-header {
		padding: 12px;
	}
	
	.ac-category-tabs {
		flex-wrap: wrap;
	}
	
	.ac-stats-row {
		flex-direction: column;
	}
}

@media (max-width: 480px) {
	.ac-title {
		font-size: 16px;
	}
	
	.ac-stat-item {
		flex: 1;
	}
	
	.ac-category-tab {
		flex: 1;
		min-width: 80px;
	}
}
</style>
