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

		<!-- 地图容器 -->
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
					<cover-view class="cv-btn-text">上报预警</cover-view>
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
						<text class="spc-icon-emoji">{{ getMarkerEmoji(selectedMarker) }}</text>
					</view>
					<view class="spc-title-group">
						<text class="spc-name">{{ selectedMarker && selectedMarker.name }}</text>
						<view class="spc-status-badge">
							<text class="spc-status-text">{{ selectedMarker && selectedMarker.status }}</text>
						</view>
					</view>
				</view>
				<view class="spc-data-grid">
					<view class="spc-data-item">
						<text class="spc-label">类型</text>
						<text class="spc-value">{{ getMarkerType(selectedMarker) }}</text>
					</view>
					<view class="spc-data-item">
						<text class="spc-label">风险等级</text>
						<text class="spc-value">{{ selectedMarker && selectedMarker.risk_level }}</text>
					</view>
					<view class="spc-data-item">
						<text class="spc-label">位置</text>
						<text class="spc-value">{{ selectedMarker && selectedMarker.latitude.toFixed(4) }}, {{ selectedMarker && selectedMarker.longitude.toFixed(4) }}</text>
					</view>
				</view>
				<view class="spc-actions">
					<view class="spc-btn spc-btn-secondary" @tap="handleViewDetails"><text class="spc-btn-text">查看详情</text></view>
					<view class="spc-btn spc-btn-primary" @tap="handleTakeAction"><text class="spc-btn-text">采取行动</text></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onLoad, onUnload } from 'vue'

// ===== 地图核心状态 =====
const mapCenter = ref({ latitude: 39.9042, longitude: 116.4074 })
const mapScale = ref(10)
const markers = ref([])
const polylines = ref([])
const circles = ref([])

// ===== 分类状态 =====
const categoryTabs = ref([
	{ value: 'ecology', label: '环保预警', icon: '🌍' },
	{ value: 'fooddrug', label: '食品药品', icon: '🏥' },
	{ value: 'enforcement', label: '执法', icon: '👮' }
])
const activeCategory = ref('ecology')

// ===== 各分类的标记数据 =====
const ecologyMarkers = ref([])
const fooddrugMarkers = ref([])
const enforcementMarkers = ref([])

// ===== 设备/系统状态 =====
const gpsSignal = ref(12)
const battery = ref(85)
const isOffline = ref(false)

// ===== 预警状态 =====
const latestAlert = ref(null)
const alertDismissed = ref(false)

// ===== 弹窗状态 =====
const sensorPopupVisible = ref(false)
const selectedMarker = ref(null)

// ===== 根据分类显示不同的标记 =====
const displayMarkers = computed(() => {
	switch (activeCategory.value) {
		case 'ecology':
			return ecologyMarkers.value.map(m => ({
				id: m.id,
				latitude: m.latitude,
				longitude: m.longitude,
				title: m.name || m.title,
				iconPath: '/static/icons/ecology-marker.png',
				width: 32,
				height: 32
			}))
		case 'fooddrug':
			return fooddrugMarkers.value.map(m => ({
				id: m.id,
				latitude: m.latitude,
				longitude: m.longitude,
				title: m.product_name || m.name,
				iconPath: '/static/icons/fooddrug-marker.png',
				width: 32,
				height: 32
			}))
		case 'enforcement':
			return enforcementMarkers.value.map(m => ({
				id: m.id,
				latitude: m.latitude,
				longitude: m.longitude,
				title: m.name,
				iconPath: '/static/icons/enforcement-marker.png',
				width: 32,
				height: 32
			}))
		default:
			return []
	}
})

// ===== 获取分类数量 =====
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

// ===== 获取标记emoji =====
function getMarkerEmoji(marker) {
	if (!marker) return '📍'
	if (marker.alert_type === 'food') return '🍎'
	if (marker.alert_type === 'drug') return '💊'
	if (marker.alert_type === 'cosmetic') return '💄'
	if (marker.type === 'water-monitor') return '💧'
	if (marker.type === 'air-monitor') return '💨'
	if (marker.type === 'soil-monitor') return '🌱'
	if (marker.badge_number) return '👮'
	return '📍'
}

// ===== 获取标记类型 =====
function getMarkerType(marker) {
	if (!marker) return '未知'
	if (marker.alert_type) {
		const typeMap = { food: '食品', drug: '药品', cosmetic: '化妆品' }
		return typeMap[marker.alert_type] || '未知'
	}
	if (marker.type) {
		const typeMap = { 'water-monitor': '走私线索监测', 'air-monitor': '红外触发监测', 'soil-monitor': '活体物种监测' }
		return typeMap[marker.type] || '未知'
	}
	if (marker.badge_number) return '执法人员'
	return '未知'
}

// ===== 切换分类 =====
function handleCategoryChange(category) {
	activeCategory.value = category
	loadCategoryData(category)
}

// ===== 加载分类数据 =====
async function loadCategoryData(category) {
	try {
		if (category === 'ecology') {
			// 加载环保预警
			const response = await uni.request({
				url: '/api/v1/gis/pollution-sources',
				method: 'GET'
			})
			if (response.statusCode === 200) {
				ecologyMarkers.value = response.data.data.sources || []
			}
		} else if (category === 'fooddrug') {
			// 加载食品药品预警
			const response = await uni.request({
				url: `/api/v1/gis/food-drug-alerts?latitude=${mapCenter.value.latitude}&longitude=${mapCenter.value.longitude}`,
				method: 'GET'
			})
			if (response.statusCode === 200) {
				fooddrugMarkers.value = response.data.data.alerts || []
			}
		} else if (category === 'enforcement') {
			// 加载执法人员
			const response = await uni.request({
				url: '/api/v1/gis/enforcement-officers',
				method: 'GET'
			})
			if (response.statusCode === 200) {
				enforcementMarkers.value = response.data.data.officers || []
			}
		}
	} catch (error) {
		console.error('加载数据失败:', error)
		uni.showToast({ title: '加载失败', icon: 'none' })
	}
}

// ===== 标记点击 =====
function handleMarkerTap(event) {
	const markerId = event.detail.markerId
	const allMarkers = displayMarkers.value
	selectedMarker.value = allMarkers.find(m => m.id === markerId)
	sensorPopupVisible.value = true
}

// ===== 关闭弹窗 =====
function closeSensorPopup() {
	sensorPopupVisible.value = false
	selectedMarker.value = null
}

// ===== 查看详情 =====
function handleViewDetails() {
	uni.showToast({ title: '查看详情', icon: 'none' })
	closeSensorPopup()
}

// ===== 采取行动 =====
function handleTakeAction() {
	uni.showToast({ title: '采取行动', icon: 'none' })
	closeSensorPopup()
}

// ===== 上报走私/生态预警 =====
function handleSOS() {
	uni.showToast({ title: '上报走私/生态预警', icon: 'none' })
}

// ===== 图层管理 =====
function handleLayerChange() {
	uni.showToast({ title: '图层管理', icon: 'none' })
}

// ===== 定位 =====
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

// ===== 缩放 =====
function handleZoomIn() {
	if (mapScale.value < 20) mapScale.value++
}

function handleZoomOut() {
	if (mapScale.value > 1) mapScale.value--
}

// ===== 地图点击 =====
function handleMapTap() {
	closeSensorPopup()
}

// ===== 关闭预警 =====
function dismissAlert() {
	alertDismissed.value = true
}

// ===== 处理预警 =====
function handleAlertTask() {
	uni.showToast({ title: '处理预警', icon: 'none' })
}

// ===== 页面加载 =====
onLoad(() => {
	loadCategoryData('ecology')
})

// ===== 页面卸载 =====
onUnload(() => {
	// 清理资源
})
</script>

<style lang="scss" scoped>
@import './gis.scss';

// ===== 分类选项卡样式 =====
.cv-category-tabs {
	position: absolute;
	top: 20px;
	left: 20px;
	display: flex;
	gap: 12px;
	background: rgba(0, 0, 0, 0.7);
	padding: 12px;
	border-radius: 12px;
	z-index: 10;
	flex-wrap: wrap;
}

.cv-category-tab {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 8px;
	color: #fff;
	font-size: 14px;
	transition: all 0.3s ease;
	white-space: nowrap;
	
	&.active {
		background: rgba(0, 212, 255, 0.3);
		border-color: rgba(0, 212, 255, 0.5);
		box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
	}
}

.cv-tab-icon {
	font-size: 18px;
}

.cv-tab-text {
	font-weight: 500;
}

.cv-tab-count {
	background: rgba(255, 255, 255, 0.2);
	padding: 2px 8px;
	border-radius: 10px;
	font-size: 12px;
	font-weight: 600;
}

// ===== 响应式设计 =====
@media (max-width: 480px) {
	.cv-category-tabs {
		left: 12px;
		top: 12px;
		flex-direction: column;
		width: calc(100% - 24px);
	}
	
	.cv-category-tab {
		flex: 1;
		justify-content: center;
	}
}

@media (min-width: 480px) and (max-width: 768px) {
	.cv-category-tabs {
		left: 20px;
		top: 20px;
		flex-direction: row;
	}
}

@media (min-width: 768px) {
	.cv-category-tabs {
		left: 40px;
		top: 40px;
		flex-direction: row;
	}
}
</style>
