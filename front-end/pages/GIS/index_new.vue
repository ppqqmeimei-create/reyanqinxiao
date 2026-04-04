<template>
	<view class="gis-page">
		<!-- 分类选项卡 -->
		<cover-view class="cv-category-tabs">
			<cover-view 
				v-for="tab in categoryTabs"
				:key="tab.value"
				class="cv-category-tab"
				:class="{ active: activeCategory === tab.value }"
				@tap="handleCategoryChange(tab.value)"
			>
				<cover-view class="cv-tab-icon">{{ tab.icon }}</cover-view>
				<cover-view class="cv-tab-text">{{ tab.label }}</cover-view>
				<cover-view class="cv-tab-count">{{ getCategoryCount(tab.value) }}</cover-view>
			</cover-view>
		</cover-view>

		<!-- 地图 -->
		<map
			id="gisMap"
			class="map-canvas"
			:latitude="mapCenter.latitude"
			:longitude="mapCenter.longitude"
			:scale="mapScale"
			:markers="displayMarkers"
			:polyline="polylines"
			:circles="circles"
			:show-location="true"
			:enable-zoom="true"
			:enable-scroll="true"
			:enable-rotate="false"
			@markertap="handleMarkerTap"
			@tap="handleMapTap"
		>
			<!-- 右侧控件 -->
			<cover-view class="cv-controls">
				<cover-view class="cv-btn cv-sos" @tap="handleSOS">
					<cover-image class="cv-btn-icon" src="/static/icons/sos.png"></cover-image>
					<cover-view class="cv-btn-text">上报</cover-view>
				</cover-view>
				<cover-view class="cv-btn" @tap="handleLayerChange">
					<cover-image class="cv-btn-icon" src="/static/icons/layers.png"></cover-image>
					<cover-view class="cv-btn-text">图层</cover-view>
				</cover-view>
				<cover-view class="cv-btn" @tap="handleLocation">
					<cover-image class="cv-btn-icon" src="/static/icons/location.png"></cover-image>
					<cover-view class="cv-btn-text">定位</cover-view>
				</cover-view>
				<cover-view class="cv-zoom">
					<cover-view class="cv-btn cv-zoom-btn" @tap="handleZoomIn">
						<cover-view class="cv-btn-text cv-zoom-text">+</cover-view>
					</cover-view>
					<cover-view class="cv-zoom-divider"></cover-view>
					<cover-view class="cv-btn cv-zoom-btn" @tap="handleZoomOut">
						<cover-view class="cv-btn-text cv-zoom-text">-</cover-view>
					</cover-view>
				</cover-view>
			</cover-view>

			<!-- 底部预警面板 -->
			<cover-view class="cv-alert-panel" v-if="latestAlert && !alertDismissed">
				<cover-view class="cv-alert-bar" :class="'cv-bar-' + latestAlert.level"></cover-view>
				<cover-view class="cv-alert-close" @tap="dismissAlert">
					<cover-view class="cv-close-icon">x</cover-view>
				</cover-view>
				<cover-view class="cv-alert-body">
					<cover-view class="cv-alert-msg">
						<cover-view class="cv-level-tag" :class="'cv-tag-' + latestAlert.level">
							<cover-view class="cv-tag-text">{{ latestAlert.level === 'critical' ? '紧急' : '预警' }}</cover-view>
						</cover-view>
						<cover-view class="cv-alert-text">{{ latestAlert.message }}</cover-view>
					</cover-view>
					<cover-view class="cv-task-btn" @tap="handleAlertTask">
						<cover-view class="cv-task-text">立即处理</cover-view>
					</cover-view>
				</cover-view>
			</cover-view>

			<!-- 左上角状态栏 -->
			<cover-view class="cv-status">
				<cover-view class="cv-status-text">GPS {{ gpsSignal }}星 | 电量 {{ Math.floor(battery) }}%</cover-view>
				<cover-view class="cv-status-dot" :class="isOffline ? 'cv-dot-off' : 'cv-dot-on'"></cover-view>
			</cover-view>
		</map>

		<!-- 监测点弹窗 -->
		<view v-if="sensorPopupVisible" class="sensor-popup-overlay" @tap="closeSensorPopup">
			<view class="sensor-popup-card" @tap.stop>
				<view class="spc-close" @tap="closeSensorPopup"><text class="spc-close-text">x</text></view>
				<view class="spc-header">
					<view class="spc-type-icon">
						<text class="spc-icon-emoji">{{ getSensorEmoji(selectedSensor && selectedSensor.type) }}</text>
					</view>
					<view class="spc-title-group">
						<text class="spc-name">{{ selectedSensor && (selectedSensor.name || selectedSensor.product_name) }}</text>
						<view class="spc-status-badge">
							<view class="spc-status-dot"></view>
							<text class="spc-status-text">{{ getStatusText(selectedSensor && selectedSensor.status) }}</text>
						</view>
					</view>
				</view>
				<view v-if="selectedSensor && selectedSensor.pH !== undefined" class="spc-data-grid">
					<view class="spc-data-item"><text class="spc-label">pH值</text><text class="spc-value">{{ selectedSensor.pH }}</text></view>
					<view class="spc-data-item"><text class="spc-label">温度</text><text class="spc-value">{{ selectedSensor.temperature }}°C</text></view>
					<view class="spc-data-item"><text class="spc-label">COD</text><text class="spc-value">{{ selectedSensor.COD }} mg/L</text></view>
				</view>
				<view v-if="selectedSensor && selectedSensor.manufacturer" class="spc-data-grid">
					<view class="spc-data-item"><text class="spc-label">厂家</text><text class="spc-value">{{ selectedSensor.manufacturer }}</text></view>
					<view class="spc-data-item"><text class="spc-label">风险等级</text><text class="spc-value">{{ selectedSensor.risk_level }}</text></view>
				</view>
				<view class="spc-actions">
					<view class="spc-btn spc-btn-secondary" @tap="handleViewHistory"><text class="spc-btn-text">查看历史</text></view>
					<view class="spc-btn spc-btn-primary" @tap="handleDiagnose"><text class="spc-btn-text">详情</text></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// ===== 地图核心状态 =====
const mapCenter = ref({ latitude: 39.9042, longitude: 116.4074 })
const mapScale = ref(10)
const markers = ref([])
const polylines = ref([])
const circles = ref([])

// ===== 分类相关 =====
const categoryTabs = ref([
	{ value: 'ecology', label: '环保预警', icon: '🌍' },
	{ value: 'fooddrug', label: '食品药品', icon: '🏥' },
	{ value: 'enforcement', label: '执法', icon: '👮' }
])

const activeCategory = ref('ecology')

// 各分类的标记数据
const ecologyMarkers = ref([])
const fooddrugMarkers = ref([])
const enforcementMarkers = ref([])

// 根据分类显示不同的标记
const displayMarkers = computed(() => {
	switch (activeCategory.value) {
		case 'ecology':
			return ecologyMarkers.value
		case 'fooddrug':
			return fooddrugMarkers.value
		case 'enforcement':
			return enforcementMarkers.value
		default:
			return []
	}
})

// ===== 设备/系统状态 =====
const gpsSignal = ref(12)
const battery = ref(85)
const isOffline = ref(false)

// ===== 预警状态 =====
const latestAlert = ref(null)
const alertDismissed = ref(false)

// ===== 监测点弹窗状态 =====
const sensorPopupVisible = ref(false)
const selectedSensor = ref(null)

// ===== 方法 =====

function handleCategoryChange(category) {
	activeCategory.value = category
	loadCategoryData(category)
}

function getCategoryCount(category) {
	switch (category) {
		case 'ecology':
			return ecologyMarkers.value.length
		case 'fooddrug':
			return fooddrugMarkers.value.length
		case 'enforcement':
			return enforcementMarkers.value.length
		default:
			return 0
	}
}

async function loadCategoryData(category) {
	try {
		if (category === 'ecology') {
			const response = await uni.request({
				url: '/api/v1/gis/pollution-sources',
				method: 'GET'
			})
			if (response.data.success) {
				ecologyMarkers.value = response.data.data.sources.map(s => ({
					id: s.device_id,
					latitude: s.latitude,
					longitude: s.longitude,
					title: s.name,
					type: s.type,
					status: s.status
				}))
			}
		} else if (category === 'fooddrug') {
			const response = await uni.request({
				url: '/api/v1/gis/food-drug-alerts',
				method: 'GET',
				data: { 
					latitude: mapCenter.value.latitude, 
					longitude: mapCenter.value.longitude 
				}
			})
			if (response.data.success) {
				fooddrugMarkers.value = response.data.data.alerts.map(a => ({
					id: a.id,
					latitude: a.latitude,
					longitude: a.longitude,
					title: a.product_name,
					type: a.alert_type,
					status: a.status,
					risk_level: a.risk_level
				}))
			}
		} else if (category === 'enforcement') {
			const response = await uni.request({
				url: '/api/v1/gis/enforcement-officers',
				method: 'GET'
			})
			if (response.data.success) {
				enforcementMarkers.value = response.data.data.officers.map(o => ({
					id: o.id,
					latitude: o.latitude,
					longitude: o.longitude,
					title: o.name,
					type: 'officer',
					status: o.status
				}))
			}
		}
	} catch (error) {
		console.error('加载数据失败:', error)
		uni.showToast({ title: '加载失败', icon: 'none' })
	}
}

function getSensorEmoji(type) {
	const emojiMap = {
		'water-monitor': '💧',
		'air-monitor': '💨',
		'soil-monitor': '🌱',
		'food': '🍎',
		'drug': '💊',
		'cosmetic': '💄',
		'officer': '👮'
	}
	return emojiMap[type] || '📍'
}

function getStatusText(status) {
	const statusMap = {
		'on_duty': '在线',
		'off_duty': '离线',
		'active': '活跃',
		'pending': '待处理',
		'investigating': '处理中'
	}
	return statusMap[status] || '未知'
}

function handleMarkerTap(event) {
	const marker = displayMarkers.value.find(m => m.id === event.detail.markerId)
	if (marker) {
		selectedSensor.value = marker
		sensorPopupVisible.value = true
	}
}

function closeSensorPopup() {
	sensorPopupVisible.value = false
	selectedSensor.value = null
}

function handleMapTap() {
	closeSensorPopup()
}

function handleSOS() {
	uni.showModal({
		title: '上报污染',
		content: '确认上报污染信息？',
		success: (res) => {
			if (res.confirm) {
				uni.showToast({ title: '上报成功', icon: 'success' })
			}
		}
	})
}

function handleLayerChange() {
	uni.showToast({ title: '图层切换', icon: 'none' })
}

function handleLocation() {
	uni.getLocation({
		type: 'gcj02',
		success: (res) => {
			mapCenter.value = {
				latitude: res.latitude,
				longitude: res.longitude
			}
		}
	})
}

function handleZoomIn() {
	mapScale.value = Math.max(mapScale.value - 1, 5)
}

function handleZoomOut() {
	mapScale.value = Math.min(mapScale.value + 1, 18)
}

function dismissAlert() {
	alertDismissed.value = true
}

function handleAlertTask() {
	uni.switchTab({ url: '/pages/Task/Task' })
}

function handleViewHistory() {
	uni.showToast({ title: '查看历史', icon: 'none' })
}

function handleDiagnose() {
	uni.showToast({ title: '查看详情', icon: 'none' })
}

onLoad(() => {
	loadCategoryData('ecology')
})
</script>
