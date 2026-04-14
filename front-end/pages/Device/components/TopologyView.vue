<template>
	<view class="topology-view">
		<map
			id="deviceMap"
			class="device-map"
			:latitude="mapCenter.latitude"
			:longitude="mapCenter.longitude"
			:scale="mapScale"
			:markers="allMarkers"
			:polyline="mapPolylines"
			:show-location="true"
			:enable-zoom="true"
			:enable-scroll="true"
			:enable-rotate="false"
			@markertap="handleMarkerTap"
		>
			<!-- 地图左上角图例 -->
			<cover-view class="device-map-legend">
				<cover-view class="legend-title">广西边境设备网络</cover-view>
				<cover-view class="legend-subtitle">防城港·崇左边境网络</cover-view>
				<cover-view class="legend-items">
					<cover-view class="legend-item" v-for="item in legendItems" :key="item.status">
						<cover-view class="legend-dot" :class="item.status"></cover-view>
						<cover-view class="legend-text">{{ item.label }}</cover-view>
					</cover-view>
				</cover-view>
				<cover-view class="legend-divider"></cover-view>
				<cover-view class="legend-type-title">设备类型统计</cover-view>
				<cover-view class="legend-types">
					<cover-view class="legend-type-item" v-for="s in deviceTypeStats" :key="s.name">
						<cover-view class="legend-type-dot"></cover-view>
						<cover-view class="legend-type-name">{{ s.name }}</cover-view>
						<cover-view class="legend-type-count">{{ s.count }}</cover-view>
					</cover-view>
				</cover-view>
				<!-- 态势数据标识 -->
				<cover-view class="legend-divider"></cover-view>
				<cover-view class="legend-gis-title">态势地图叠加</cover-view>
				<cover-view class="legend-gis-items">
					<cover-view class="legend-gis-item" v-for="g in gisLegendItems" :key="g.type">
						<cover-view class="legend-gis-dot" :style="{background: g.color}"></cover-view>
						<cover-view class="legend-gis-text">{{ g.label }} {{ g.count }}</cover-view>
					</cover-view>
				</cover-view>
			</cover-view>
		</map>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { borderControlData, smugglingData } from '../../../shared/mapData.js'

const props = defineProps({
	devices:   { type: Array, required: true },
	edgeNodes: { type: Array, required: true }
})
const emit = defineEmits(['deviceTap'])

// 地图中心（凭祥+东兴区域）
const mapCenter = ref({ latitude: 22.05, longitude: 106.85 })
const mapScale = ref(8)

const legendItems = [
	{ status: 'online',  label: '在线' },
	{ status: 'warning', label: '预警' },
	{ status: 'offline', label: '离线' }
]

// ==================== 真实设备标记 ====================
const deviceMarkers = computed(() => {
	return props.devices.map((d, idx) => ({
		id: idx,                          // 设备用纯数字ID（0起）
		latitude: d.location.latitude,
		longitude: d.location.longitude,
		title: d.name,
		iconPath: getDeviceStatusMarker(d.status),
		width: 40,
		height: 40,
		callout: {
			content: d.name,
			color: '#ffffff',
			fontSize: 11,
			borderRadius: 4,
			padding: 6,
			display: 'ALWAYS',
			bgColor: d.status === 'online' ? '#73D13Dcc' : d.status === 'warning' ? '#FFA940cc' : '#595959cc'
		}
	}))
})

function getDeviceStatusMarker(status) {
	return {
		online: '/static/icons/device-map-online.png',
		warning: '/static/icons/device-map-warning.png',
		offline: '/static/icons/device-map-offline.png'
	}[status] || '/static/icons/device-map-offline.png'
}

// ==================== 态势点位标记（来自 GIS 页面共享数据）====================
const GIS_TYPE_META = {
	checkpoint:       { icon: '/static/icons/checkpoint.png',      color: '#00D4FF', label: '联勤卡口' },
	patrol:           { icon: '/static/icons/device-gis-patrol.png', color: '#73D13D', label: '巡查巡组' },
	sentry:           { icon: '/static/icons/boundary-marker.png', color: '#FFA940', label: '边防哨点' },
	'live-transport': { icon: '/static/icons/device-gis-live-transport.png', color: '#FF4D4F', label: '走私活物' }
}

const gisLegendItems = computed(() => {
	return Object.entries(GIS_TYPE_META).map(([type, meta]) => ({
		type,
		label: meta.label,
		color: meta.color,
		count: getGisCount(type)
	}))
})

function getGisCount(type) {
	return borderControlData.filter(d => d.type === type).length
		 + smugglingData.filter(d => d.type === type).length
}

function getGisStatusColor(status) {
	return {
		active:       'rgba(115,209,61,0.90)',
		on_duty:      'rgba(0,212,255,0.90)',
		warning:      'rgba(255,169,64,0.90)',
		pending:      'rgba(255,77,79,0.90)',
		investigating:'rgba(250,173,20,0.90)'
	}[status] || 'rgba(89,89,89,0.88)'
}

// 态势标记：从三个数据源提取，用ID前四位区分（前缀防冲突）
// 设备ID是0-N，态势ID是 10101,20101,30101 起始，完全不会冲突
const gisMarkers = computed(() => {
	const all = [
		...borderControlData.map(d => ({ ...d, source: 'border' })),
		...smugglingData.map(d => ({ ...d, source: 'smuggling' }))
	]
	return all.map(d => {
		const meta = GIS_TYPE_META[d.type] || {}
		return {
			id: d.id,                      // 态势数据原始ID（10101, 20101, 30101系），与设备不冲突
			latitude: d.latitude,
			longitude: d.longitude,
			title: d.name,
			iconPath: meta.icon || '/static/icons/default.png',
			width: 32,
			height: 32,
			callout: {
				content: d.name,
				color: '#EAF6FF',
				fontSize: 10,
				borderRadius: 4,
				padding: 4,
				display: 'ALWAYS',
				bgColor: getGisStatusColor(d.status)
			}
		}
	})
})

// ==================== 合并所有标记 ====================
const allMarkers = computed(() => [...deviceMarkers.value, ...gisMarkers.value])

// ==================== 连线（按边缘节点分组）====================
const mapPolylines = computed(() => {
	const groups = {}
	props.devices.forEach(d => {
		if (!groups[d.edgeNodeId]) groups[d.edgeNodeId] = []
		groups[d.edgeNodeId].push({ latitude: d.location.latitude, longitude: d.location.longitude })
	})
	const colors = {
		'EDGE-DONGXING-01':  '#00D4FF',
		'EDGE-PINGXIANG-01':'#73D13D',
		'EDGE-LONGZHOU-01': '#FFA940',
		'EDGE-NAPO-01':     '#FF4D4F',
		'EDGE-JINGXI-01':   '#D940F5',
		'EDGE-GX-HQ':        '#00A8D6'
	}
	return Object.entries(groups)
		.filter(([, pts]) => pts.length >= 2)
		.map(([nodeId, pts]) => ({
			points: pts,
			color: colors[nodeId] || '#00D4FF',
			width: 2,
			dottedLine: true
		}))
})

// ==================== 设备类型统计 ====================
const deviceTypeStats = computed(() => {
	const stats = {}
	props.devices.forEach(d => {
		const name = getDeviceTypeName(d.type)
		stats[name] = (stats[name] || 0) + 1
	})
	return Object.entries(stats).map(([name, count]) => ({ name, count }))
})

function getDeviceTypeName(type) {
	return {
		'camera-visible':  '卡口摄像头',
		'camera-infrared': '红外热成像',
		'fiber': '震动光纤',
		'smell': '活体雷达',
		'drone': '无人机'
	}[type] || '其他设备'
}

// ==================== 点击处理 ====================
function handleMarkerTap(e) {
	const markerId = e.detail?.markerId ?? e.markerId
	// 纯数字ID → 真实设备
	if (markerId < props.devices.length) {
		emit('deviceTap', props.devices[markerId])
	}
	// 态势ID：检查是否来自任意一个态势数据源
	else {
		const border = borderControlData.find(d => d.id === markerId)
		if (border) { emit('deviceTap', border); return }
		const smuggling = smugglingData.find(d => d.id === markerId)
		if (smuggling) { emit('deviceTap', smuggling); return }
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
	position: absolute;
	left: 16rpx;
	top: 16rpx;
	background: rgba(10, 14, 26, 0.93);
	border-radius: 16rpx;
	border: 1px solid rgba(0,212,255,0.22);
	padding: 16rpx 20rpx;
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	z-index: 100;
	pointer-events: none;
}

.legend-title {
	font-size: 22rpx;
	font-weight: 700;
	color: #00d4ff;
	margin-bottom: 4rpx;
}

.legend-subtitle {
	font-size: 16rpx;
	color: rgba(255,255,255,0.4);
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
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
	&.online  { background: #73D13D; box-shadow: 0 0 6rpx #73D13D; }
	&.warning { background: #FFA940; box-shadow: 0 0 6rpx #FFA940; }
	&.offline { background: #595959; }
}

.legend-text {
	font-size: 18rpx;
	color: #8c8c8c;
}

.legend-divider {
	height: 1rpx;
	background: rgba(0,212,255,.18);
	margin: 10rpx 0;
}

.legend-type-title {
	font-size: 18rpx;
	font-weight: 700;
	color: #00d4ff;
	margin-bottom: 6rpx;
}

.legend-types { display: flex; flex-direction: column; gap: 4rpx; }

.legend-type-item {
	display: flex;
	align-items: center;
	gap: 6rpx;
}

.legend-type-dot { width: 8rpx; height: 8rpx; border-radius: 50%; background: #00d4ff; flex-shrink: 0; }

.legend-type-name { font-size: 16rpx; color: rgba(255,255,255,.6); flex: 1; }

.legend-type-count { font-size: 16rpx; color: #00d4ff; font-weight: 700; }

.legend-gis-title {
	font-size: 18rpx;
	font-weight: 700;
	color: rgba(255,255,255,.6);
	margin-bottom: 6rpx;
}

.legend-gis-items { display: flex; flex-direction: column; gap: 4rpx; }

.legend-gis-item { display: flex; align-items: center; gap: 6rpx; }

.legend-gis-dot { width: 8rpx; height: 8rpx; border-radius: 50%; flex-shrink: 0; }

.legend-gis-text { font-size: 16rpx; color: rgba(255,255,255,.5); }
</style>
