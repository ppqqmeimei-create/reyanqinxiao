<template>
	<view class="topology-view">
		<!-- 地图容器 -->
		<map
			id="deviceMap"
			class="device-map"
			:latitude="mapCenter.latitude"
			:longitude="mapCenter.longitude"
			:scale="mapScale"
			:markers="mapMarkers"
			:polyline="mapPolylines"
			:show-location="true"
			:enable-zoom="true"
			:enable-scroll="true"
			:enable-rotate="false"
			@markertap="handleMarkerTap"
		>
			<!-- 设备标记浮层 -->
			<cover-view class="device-map-legend">
				<cover-view class="legend-title">广西边境设备网络</cover-view>
				<cover-view class="legend-subtitle">防城港·崇左边境网络</cover-view>
				<cover-view class="legend-items">
					<cover-view class="legend-item" v-for="item in legendItems" :key="item.status">
						<cover-view class="legend-dot" :class="item.status"></cover-view>
						<cover-view class="legend-text">{{ item.label }}</cover-view>
					</cover-view>
				</cover-view>
			</cover-view>
		</map>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
	devices:   { type: Array, required: true },
	edgeNodes: { type: Array, required: true }
})
const emit = defineEmits(['deviceTap'])

// 地图中心（广西边境中心：东兴与凭祥之间）
const mapCenter = ref({ latitude: 21.8200, longitude: 107.3900 })
const mapScale = ref(9)

const legendItems = [
	{ status: 'online',  label: '在线' },
	{ status: 'warning', label: '预警' },
	{ status: 'offline', label: '离线' }
]

// 转换设备为地图标记
const mapMarkers = computed(() => {
	return props.devices.map((d, idx) => ({
		id: idx,
		latitude: d.location.latitude,
		longitude: d.location.longitude,
		title: d.name,
		iconPath: getDeviceIcon(d.type),
		width: 44,
		height: 44,
		customCallout: {
			content: d.name,
			color: '#ffffff',
			fontSize: 14,
			borderRadius: 4,
			bgColor: d.status === 'online' ? '#73D13D' : d.status === 'warning' ? '#FFA940' : '#595959',
			padding: '10,10,10,10',
			display: 'ALWAYS'
		}
	}))
})

// 设备间连接线（按边缘节点分组连线）
const mapPolylines = computed(() => {
	const groups = {}
	props.devices.forEach(d => {
		if (!groups[d.edgeNodeId]) groups[d.edgeNodeId] = []
		groups[d.edgeNodeId].push({ latitude: d.location.latitude, longitude: d.location.longitude })
	})
	const colors = { 'EDGE-DONGXING-01': 'var(--brand-primary)', 'EDGE-PINGXIANG-01': '#73D13D', 'EDGE-LONGZHOU-01': '#FFA940', 'EDGE-GX-HQ': '#00A8D6' }
	return Object.entries(groups)
		.filter(([, pts]) => pts.length >= 2)
		.map(([nodeId, pts]) => ({
			points: pts,
			color: colors[nodeId] || 'var(--brand-primary)',
			width: 3,
			dottedLine: false
		}))
})

function getDeviceIcon(type) {
	const iconMap = {
		'camera-visible':  '/static/icons/camera-visible.png',
		'camera-infrared': '/static/icons/camera-infrared.png',
		'fiber':           '/static/icons/fiber.png',
		'smell':           '/static/icons/smell.png',
		'water-monitor':   '/static/icons/water-monitor.png',
		'air-monitor':     '/static/icons/air-monitor.png',
		'soil-monitor':    '/static/icons/soil-monitor.png'
	}
	return iconMap[type] || '/static/icons/device-default.png'
}

function handleMarkerTap(e) {
	const deviceIdx = e.markerId
	if (deviceIdx < props.devices.length) {
		emit('deviceTap', props.devices[deviceIdx])
	}
}
</script>

<style lang="scss" scoped>
.topology-view {
	width: 100%;
	height: 680rpx;
	border-radius: 24rpx;
	overflow: hidden;
	border: 1px solid rgba(0,212,255,0.08);
}

.device-map {
	width: 100%;
	height: 100%;
}

.device-map-legend {
	position: fixed;
	left: 24rpx;
	top: 24rpx;
	background: rgba(10, 14, 26, 0.92);
	border-radius: 16rpx;
	border: 1px solid rgba(0,212,255,0.2);
	padding: 16rpx 20rpx;
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	z-index: 100;
}

.legend-title {
	font-size: 24rpx;
	font-weight: 700;
	color: #00d4ff;
	margin-bottom: 4rpx;
	text-align: center;
}

.legend-subtitle {
	font-size: 18rpx;
	color: rgba(255,255,255,0.45);
	text-align: center;
	margin-bottom: 12rpx;
}

.legend-items {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.legend-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.legend-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	&.online  { background: #73D13D; box-shadow: 0 0 8rpx #73D13D; }
	&.warning { background: #FFA940; box-shadow: 0 0 8rpx #FFA940; }
	&.offline { background: #595959; }
}

.legend-text {
	font-size: 20rpx;
	color: #8c8c8c;
}
</style>
