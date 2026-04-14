<template>
	<view class="device-page">
		<!-- 全局网格背景 -->
		<view class="page-bg-grid"></view>
		<view class="page-bg-glow"></view>
		<!-- 顶部状态栏 -->
		<view class="cv-status-bar">
			<view class="cv-gps-dot" :class="gpsStatus"></view>
			<text class="cv-gps-text">{{ gpsStatus === 'online' ? 'GPS定位正常' : 'GPS定位异常' }}</text>
			<view class="cv-divider-dot"></view>
			<view class="cv-battery-wrap">
				<image class="cv-battery-icon" :src="batteryIcon" mode="aspectFit"></image>
				<text class="cv-battery-text">{{ batteryLevel }}%</text>
			</view>
			<view class="cv-divider-dot"></view>
			<text class="cv-node-label">边境五区节点</text>
			<view class="cv-node-dot" :class="nodeStatus"></view>
			<text class="cv-time-text">{{ currentTime }}</text>
		</view>
		<view class="global-status-header">
			<view class="health-dashboard">
				<view class="dashboard-circle">
					<!-- 外圈呼吸光环 -->
					<view class="circle-breathe-ring"></view>
					<view class="circle-progress" :style="healthStyle">
						<text class="health-value">{{ healthScore }}%</text>
						<text class="health-label">系统健康</text>
					</view>
				</view>
			<view class="health-stats">
				<view class="stat-item online" @tap="handleStatFilter('online')"><text class="stat-value">{{ onlineCount }}</text><text class="stat-label">在线</text></view>
				<view class="stat-item warning" @tap="handleStatFilter('warning')"><text class="stat-value">{{ warningCount }}</text><text class="stat-label">预警</text></view>
				<view class="stat-item offline" @tap="handleStatFilter('offline')"><text class="stat-value">{{ offlineCount }}</text><text class="stat-label">离线</text></view>
			</view>
			</view>
			<SyncManager :syncStatus="syncStatus" :syncProgress="syncProgress" />
		</view>
		<scroll-view class="content-scroll" scroll-y>
			<view v-if="loading" class="loading-wrap">
				<view class="loading-spinner"></view>
				<text class="loading-text">正在加载设备数据...</text>
			</view>
			<view v-else>
				<view class="topology-section">
					<view class="section-header">
						<text class="section-title">广西边境防控设备网络</text>
						<view class="refresh-btn" @tap="refreshDevices">
							<image class="refresh-icon" src="/static/icons/device-action-refresh.png" mode="aspectFit"></image>
						</view>
					</view>
					<!-- 设备位置地图 -->
					<TopologyView :devices="filteredDevices" :edgeNodes="edgeNodes" @deviceTap="handleDeviceTap" />
				</view>
				<!-- 设备分类 Tab -->
				<view class="type-filter-section">
					<scroll-view class="type-filter-scroll" scroll-x>
						<view class="type-filter-wrap">
							<view class="type-filter-item" :class="{ active: activeTypeFilter === 'all' }" @tap="activeTypeFilter = 'all'">
								<image class="type-filter-icon" src="/static/icons/all-devices.png" mode="aspectFit"></image>
								<text class="type-filter-label">全部设备</text>
								<view class="type-filter-count">{{ devices.length }}</view>
							</view>
							<view class="type-filter-item" :class="{ active: activeTypeFilter === 'camera-infrared' }" @tap="activeTypeFilter = 'camera-infrared'">
								<image class="type-filter-icon" src="/static/icons/device-type-camera-infrared.png" mode="aspectFit"></image>
								<text class="type-filter-label">红外热成像</text>
								<view class="type-filter-count">{{ getTypeCount('camera-infrared') }}</view>
							</view>
							<view class="type-filter-item" :class="{ active: activeTypeFilter === 'drone' }" @tap="activeTypeFilter = 'drone'">
								<image class="type-filter-icon" src="/static/icons/device-type-drone.png" mode="aspectFit"></image>
								<text class="type-filter-label">边境无人机</text>
								<view class="type-filter-count">{{ getTypeCount('drone') }}</view>
							</view>
							<view class="type-filter-item" :class="{ active: activeTypeFilter === 'fiber' }" @tap="activeTypeFilter = 'fiber'">
								<image class="type-filter-icon" src="/static/icons/device-type-fiber.png" mode="aspectFit"></image>
								<text class="type-filter-label">震动光纤</text>
								<view class="type-filter-count">{{ getTypeCount('fiber') }}</view>
							</view>
							<view class="type-filter-item" :class="{ active: activeTypeFilter === 'camera-visible' }" @tap="activeTypeFilter = 'camera-visible'">
								<image class="type-filter-icon" src="/static/icons/device-type-camera-visible.png" mode="aspectFit"></image>
								<text class="type-filter-label">卡口摄像头</text>
								<view class="type-filter-count">{{ getTypeCount('camera-visible') }}</view>
							</view>
							<view class="type-filter-item" :class="{ active: activeTypeFilter === 'smell' }" @tap="activeTypeFilter = 'smell'">
								<image class="type-filter-icon" src="/static/icons/device-type-bio-radar.png" mode="aspectFit"></image>
								<text class="type-filter-label">活体雷达</text>
								<view class="type-filter-count">{{ getTypeCount('smell') }}</view>
							</view>
						</view>
					</scroll-view>
				</view>
				<view class="device-list-section">
					<view class="section-header">
						<text class="section-title">设备详情</text>
						<text class="device-count">{{ filteredDevices.length }} 台设备</text>
					</view>
					<view class="device-list">
						<DeviceStatCard v-for="d in sortedDevices" :key="d.id" :device="d" @tap="handleDeviceTap(d)" />
					</view>
				</view>
				<view class="offline-management-section">
					<view class="section-header">
						<text class="section-title">广西边境离线地图包</text>
						<view class="storage-info"><text class="storage-text">已用 {{ usedStorage }}MB / {{ totalStorage }}MB</text></view>
					</view>
					<view class="map-packages">
						<MapPackageItem v-for="pkg in mapPackages" :key="pkg.id" :pkg="pkg" @download="handleDownloadMap" @delete="handleDeleteMap" />
					</view>
					<view class="cleanup-section">
						<view class="cleanup-btn" @tap="handleCleanup">
							<image class="cleanup-icon" src="/static/icons/device-action-cleanup.png" mode="aspectFit"></image>
							<text class="cleanup-text">清理已上传缓存</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>
<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import TopologyView   from './components/TopologyView.vue'
import DeviceStatCard from './components/DeviceStatCard.vue'
import SyncManager    from './components/SyncManager.vue'
import MapPackageItem from './components/MapPackageItem.vue'
import { calculateHealthScore, sortDevicesByPriority } from './utils/diagnosticLogic.js'
import { deviceAPI } from '../../utils/request.js'

// ==================== 设备类型筛选 ====================
const activeTypeFilter = ref('all')
const filteredDevices = computed(() => {
	if (activeTypeFilter.value === 'all') return devices.value
	return devices.value.filter(d => d.type === activeTypeFilter.value)
})
function getTypeCount(type) {
	return devices.value.filter(d => d.type === type).length
}
function handleStatFilter(status) {
	activeTypeFilter.value = 'all'
	uni.showToast({ title: `已筛选${status === 'online' ? '在线' : status === 'warning' ? '预警' : '离线'}设备`, icon: 'none' })
}

// ==================== 顶部状态栏 ====================
const gpsStatus = ref('online')
const batteryLevel = ref(78)
const nodeStatus = ref('online')
const currentTime = ref('')
const batteryIcon = computed(() => {
	const level = batteryLevel.value
	if (level > 50) return '/static/icons/battery-3.png'
	if (level > 20) return '/static/icons/battery-2.png'
	return '/static/icons/battery-1.png'
})
function updateClock() {
	const now = new Date()
	currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}
let clockTimer = null
let batteryTimer = null
function initTopStatus() {
	updateClock()
	clockTimer = setInterval(updateClock, 1000)
	// 模拟电量缓慢下降
	batteryTimer = setInterval(() => {
		if (batteryLevel.value > 5) batteryLevel.value--
	}, 30000)
}

// ==================== 设备管理 ====================

const devices      = ref([])
const edgeNodes    = ref([])
const healthScore  = ref(0)
const syncStatus   = ref('syncing')
const syncProgress = ref(45)
const mapPackages  = ref([])
const usedStorage  = ref(0)
const totalStorage = ref(512)
const loading      = ref(true)
const deviceMapCenter = ref({ latitude: 22.3000, longitude: 107.1000 })
const deviceMapScale = ref(10)
const deviceMapMarkers = ref([])
let   refreshTimer = null

const onlineCount   = computed(() => devices.value.filter(d => d.status === 'online').length)
const warningCount  = computed(() => devices.value.filter(d => d.status === 'warning').length)
const offlineCount  = computed(() => devices.value.filter(d => d.status === 'offline').length)
const sortedDevices = computed(() => sortDevicesByPriority(devices.value))
const healthStyle   = computed(() => {
	const p = healthScore.value
	const c = p < 50 ? '#FF4D4F' : p < 80 ? '#FFA940' : '#73D13D'
	return {
		background: 'conic-gradient(' + c + ' ' + p + '%, rgba(255,255,255,0.08) ' + p + '%)',
		boxShadow: '0 0 30rpx ' + c + '66, 0 0 60rpx ' + c + '33'
	}
})

// 字段归一化：抹平前后端字段差异
function normalizeDevice(d) {
	return {
		id:         d.device_id || String(d.id),
		name:       d.name,
		type:       d.type || d.device_type || 'camera-visible',
		status:     d.status || 'offline',
		battery:    d.battery    != null ? d.battery    : (d.battery_level    ?? 0),
		signal:     d.signal     != null ? d.signal     : (d.signal_strength  ?? 0),
		location:   { latitude: d.latitude || 0, longitude: d.longitude || 0 },
		lastActive: d.last_active    ? new Date(d.last_active)
			      : d.last_heartbeat ? new Date(d.last_heartbeat)
			      : new Date(),
		edgeNodeId: d.edge_node_id || 'EDGE-01'
	}
}

function getFallbackDevices() {
	return [
		// —— 置顶：红外热成像设备 ——
		{ id:'BD-IR-001', name:'东兴口岸红外热成像摄像头 A', type:'camera-infrared', status:'online',  battery:82, signal:90, location:{latitude:21.5450,longitude:107.9720}, lastActive:new Date(Date.now()-180000),  edgeNodeId:'EDGE-DONGXING-01' },
		{ id:'BD-IR-002', name:'友谊关口岸红外热成像摄像头', type:'camera-infrared', status:'warning', battery:21, signal:64, location:{latitude:22.1128,longitude:106.7612}, lastActive:new Date(Date.now()-900000),  edgeNodeId:'EDGE-PINGXIANG-01' },
		{ id:'BD-IR-003', name:'龙州水口红外热成像监控哨', type:'camera-infrared', status:'online',  battery:75, signal:85, location:{latitude:22.4920,longitude:106.6800}, lastActive:new Date(Date.now()-300000),  edgeNodeId:'EDGE-LONGZHOU-01' },
		{ id:'BD-IR-004', name:'那坡界碑红外热成像监控哨', type:'camera-infrared', status:'warning', battery:38, signal:58, location:{latitude:23.4300,longitude:105.8400}, lastActive:new Date(Date.now()-600000),  edgeNodeId:'EDGE-NAPO-01' },
		// —— 置顶：无人机巡检 ——
		{ id:'BD-DR-001', name:'广西边境无人机巡检 001', type:'drone', status:'offline', battery:0,  signal:0,  location:{latitude:22.8250,longitude:108.3650}, lastActive:new Date(Date.now()-7200000), edgeNodeId:'EDGE-GX-HQ' },
		{ id:'BD-DR-002', name:'广西边境无人机巡检 002', type:'drone', status:'online',  battery:68, signal:72, location:{latitude:22.1128,longitude:106.7612}, lastActive:new Date(Date.now()-600000),  edgeNodeId:'EDGE-PINGXIANG-01' },
		// —— 置顶：边境震动光纤 ——
		{ id:'BD-FV-001', name:'那坡界碑震动光纤 01', type:'fiber', status:'warning', battery:54, signal:61, location:{latitude:23.4245,longitude:105.8336}, lastActive:new Date(Date.now()-480000),  edgeNodeId:'EDGE-NAPO-01' },
		{ id:'BD-FV-002', name:'靖西岳圩震动光纤 01', type:'fiber', status:'online',  battery:80, signal:76, location:{latitude:23.1400,longitude:106.4200}, lastActive:new Date(Date.now()-240000),  edgeNodeId:'EDGE-JINGXI-01' },
		// —— 卡口抓拍摄像头 ——
		{ id:'BD-CC-001', name:'万尾金滩卡口抓拍摄像头', type:'camera-visible', status:'warning', battery:46, signal:78, location:{latitude:21.5318,longitude:108.0325}, lastActive:new Date(Date.now()-220000),  edgeNodeId:'EDGE-DONGXING-01' },
		{ id:'BD-CC-002', name:'友谊关卡口抓拍摄像头', type:'camera-visible', status:'online',  battery:88, signal:86, location:{latitude:22.1080,longitude:106.7620}, lastActive:new Date(Date.now()-90000),   edgeNodeId:'EDGE-PINGXIANG-01' },
		// —— 活体探测雷达 ——
		{ id:'BD-LR-001', name:'凭祥活体探测雷达 01', type:'smell', status:'online',  battery:76, signal:82, location:{latitude:22.0900,longitude:106.7700}, lastActive:new Date(Date.now()-300000),  edgeNodeId:'EDGE-PINGXIANG-01' },
		{ id:'BD-LR-002', name:'龙州水口口岸活体探测雷达 01', type:'smell', status:'online',  battery:80, signal:79, location:{latitude:22.4868,longitude:106.6719}, lastActive:new Date(Date.now()-240000),  edgeNodeId:'EDGE-LONGZHOU-01' }
	]
}

function getFallbackEdgeNodes() {
	return [
		{ id:'EDGE-DONGXING-01',  name:'东兴边缘节点（防城港）',  status:'online',  deviceCount:2 },
		{ id:'EDGE-PINGXIANG-01', name:'凭祥边缘节点（崇左）',    status:'online',  deviceCount:4 },
		{ id:'EDGE-LONGZHOU-01',  name:'龙州边缘节点（崇左）',    status:'online',  deviceCount:2 },
		{ id:'EDGE-NAPO-01',      name:'那坡边缘节点（百色）',    status:'online',  deviceCount:2 },
		{ id:'EDGE-JINGXI-01',    name:'靖西边缘节点（百色）',    status:'online',  deviceCount:1 },
		{ id:'EDGE-GX-HQ',        name:'广西区总指挥部节点',       status:'online',  deviceCount:1 }
	]
}

async function loadDevicesFromAPI() {
	try {
		const res = await deviceAPI.getList({ limit: 50 })
		if (res.success && res.data?.devices) {
			return res.data.devices.map(normalizeDevice)
		}
		return null
	} catch (e) {
		console.warn('[Device] API不可用，降级到本地数据:', e.message)
		return null
	}
}

async function initData() {
	loading.value = true
	const apiData = await loadDevicesFromAPI()
	devices.value   = apiData || getFallbackDevices()
	edgeNodes.value = getFallbackEdgeNodes()
	healthScore.value = calculateHealthScore(devices.value)
	syncStatus.value  = warningCount.value > 0 ? 'syncing' : 'synced'
	usedStorage.value = 156
	loadMapPackages()
	// 更新设备地图标记
	updateDeviceMapMarkers()
	loading.value = false
}

function updateDeviceMapMarkers() {
	deviceMapMarkers.value = devices.value.map(d => ({
		id: d.id,
		latitude: d.location.latitude,
		longitude: d.location.longitude,
		title: d.name,
		iconPath: d.status === 'online' ? '/static/icons/device-map-online.png' : d.status === 'warning' ? '/static/icons/device-map-warning.png' : '/static/icons/device-map-offline.png',
		width: 40,
		height: 40
	}))
}

function handleDeviceMapMarkerTap(e) {
	const deviceId = e.markerId
	const device = devices.value.find(d => d.id === deviceId)
	if (device) {
		handleDeviceTap(device)
	}
}

function loadMapPackages() {
	mapPackages.value = [
		{ id:'MAP-GX-001', name:'广西全域边境综合离线地图包', size:186, status:'downloading', progress:67, updateTime:new Date() },
		{ id:'MAP-GX-002', name:'凭祥友谊关精细边境图（含界碑坐标）', size:38, status:'downloaded', progress:100, updateTime:new Date(Date.now()-86400000*3) },
		{ id:'MAP-GX-003', name:'东兴万尾金滩精细边境图（含界碑坐标）', size:45, status:'downloaded', progress:100, updateTime:new Date(Date.now()-86400000*7) },
		{ id:'MAP-GX-004', name:'那坡平孟口岸精细边境图（含界碑坐标）', size:32, status:'available', progress:0, updateTime:new Date() },
		{ id:'MAP-GX-005', name:'龙州水口口岸精细边境图（含界碑坐标）', size:29, status:'available', progress:0, updateTime:new Date() },
		{ id:'MAP-GX-006', name:'靖西岳圩口岸精细边境图（含界碑坐标）', size:27, status:'downloading', progress:23, updateTime:new Date() },
		{ id:'MAP-GX-007', name:'广西边境红外/震动设备离线拓扑图', size:12, status:'downloaded', progress:100, updateTime:new Date(Date.now()-86400000*1) }
	]
}

async function refreshDevices() {
	uni.showLoading({ title:'刷新中...' })
	uni.vibrateShort()
	const apiData = await loadDevicesFromAPI()
	devices.value   = apiData || getFallbackDevices()
	edgeNodes.value = getFallbackEdgeNodes()
	healthScore.value = calculateHealthScore(devices.value)
	syncStatus.value  = warningCount.value > 0 ? 'syncing' : 'synced'
	uni.hideLoading()
	uni.showToast({ title:'刷新成功', icon:'success' })
}

function handleDeviceTap(device) {
	uni.vibrateShort()
	const st = { online:'在线', warning:'预警', offline:'离线' }[device.status] || '未知'
	const warn = device.battery < 20 ? '\n警告：电量不足，建议及时检查充电。' : ''
	const typeMap = {
		'camera-visible': '可见光卡口摄像头',
		'camera-infrared': '红外热成像摄像头',
		'fiber': '震动光纤传感链路',
		'smell': '活体探测雷达',
		'drone': '边境巡检无人机'
	}
	const typeName = typeMap[device.type] || device.type
	const lastActiveStr = formatLastActive(device.lastActive)
	const deviceMeta = getDeviceMeta(device.type, device.id)
	const recentTrigger = getRecentTrigger(device.type)
	const remoteCtrl = ['BD-IR-001','BD-CC-001','BD-IR-002','BD-DR-001'].includes(device.id)
	uni.showModal({
		title: device.name,
		content:
			`设备概况\n` +
			`设备 ID：${device.id}\n` +
			`设备类别：${typeName}\n` +
			`设备型号：${deviceMeta.model}\n` +
			`生产厂家：${deviceMeta.vendor}\n` +
			`固件版本：${deviceMeta.firmware}\n\n` +
			`运行状态\n` +
			`状态：${st}\n` +
			`电量：${device.battery}%    信号：${device.signal}%\n` +
			`最近活跃：${lastActiveStr}\n` +
			`最近触发：${recentTrigger}\n` +
			`最近校准：${deviceMeta.calibration}\n` +
			`在线时长：${deviceMeta.uptime}` +
			(warn || '') +
			(remoteCtrl ? '\n\n可执行远程控制指令。' : ''),
		showCancel: true,
		cancelText:'取消',
		confirmText: remoteCtrl ? '远程控制' : '创建检查任务',
		success: res => {
			if (res.confirm) {
				if (remoteCtrl) {
					uni.showActionSheet({
						itemList: ['远程抓拍', '云台向前转向', '设备重启', 'OTA 固件升级'],
						success: (r) => {
							const actions = ['远程抓拍指令已下发', '云台转向指令已下发', '设备重启指令已下发', '固件升级包已推送至设备']
							uni.showToast({ title: actions[r.tapIndex], icon:'success' })
						}
					})
				} else {
					uni.showToast({ title:'检查任务已创建', icon:'success' })
					setTimeout(() => uni.switchTab({ url:'/pages/Task/Task' }), 1500)
				}
			}
		}
	})
}

function getDeviceMeta(type, id) {
	const metaMap = {
		'camera-infrared': { model: 'HX-IR3000-Pro', vendor: '海康威视', firmware: '2.4.1', calibration: '2026-01-15', uptime: '128小时' },
		'camera-visible': { model: 'DS-2CD1043', vendor: '大华股份', firmware: '1.8.0', calibration: '2026-02-20', uptime: '96小时' },
		'fiber': { model: 'FB-VIB-Dual-01', vendor: '长飞光纤', firmware: '3.1.2', calibration: '2026-03-01', uptime: '312小时' },
		'smell': { model: 'BIO-RADAR-500', vendor: '中科院光电所', firmware: '1.2.0', calibration: '2026-02-10', uptime: '64小时' },
		'drone': { model: 'DJI-Matrice-4T', vendor: '大疆创新', firmware: '4.1.8', calibration: '2026-01-28', uptime: '8小时' }
	}
	return metaMap[type] || { model: '未知型号', vendor: '未知厂商', firmware: '--', calibration: '--', uptime: '--' }
}

function getRecentTrigger(type) {
	const triggerMap = {
		'camera-infrared': '红外触发：疑似穿山甲 ×3（5分钟前）',
		'camera-visible': '卡口抓拍：车辆异常通行（2分钟前）',
		'fiber': '震动告警：边境异常闯入（2分钟前）',
		'smell': '活体探测：生物活动信号（8分钟前）',
		'drone': '巡检完成：发现 1 处可疑目标（1小时前）'
	}
	return triggerMap[type] || '暂无触发记录'
}

function formatLastActive(time) {
	const diff = Math.floor((Date.now() - time) / 1000)
	if (diff < 60)    return '刚刚'
	if (diff < 3600)  return Math.floor(diff / 60) + '分钟前'
	if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
	return Math.floor(diff / 86400) + '天前'
}

function handleDownloadMap(pkg) {
	if (pkg.status === 'downloading') return
	pkg.status = 'downloading'
	pkg.progress = 0
	uni.vibrateShort()
	const interval = setInterval(() => {
		pkg.progress = Math.min(pkg.progress + 10, 100)
		if (pkg.progress >= 100) {
			clearInterval(interval)
			pkg.status = 'downloaded'
			uni.showToast({ title: pkg.name + ' 下载完成', icon:'success' })
		}
	}, 200)
}

function handleDeleteMap(pkg) {
	uni.vibrateShort()
	uni.showModal({
		title: '确认删除',
		content: '确认删除“' + pkg.name + '”地图包吗？',
		success: res => {
			if (res.confirm) {
				pkg.status = 'available'
				pkg.progress = 0
				uni.showToast({ title:'已删除', icon:'success' })
			}
		}
	})
}

function handleCleanup() {
	uni.vibrateShort()
	uni.showModal({
		title: '清理缓存',
		content: '确认清理已上传的采样缓存数据吗？',
		confirmColor: '#FF4D4F',
		success: res => {
			if (res.confirm) {
				uni.showLoading({ title:'清理中...', mask:true })
				setTimeout(() => {
					usedStorage.value = Math.max(usedStorage.value - 50, 0)
					uni.hideLoading()
					uni.showToast({ title:'清理完成', icon:'success' })
				}, 1500)
			}
		}
	})
}

onLoad(async () => {
	initTopStatus()
	await initData()
	refreshTimer = setInterval(async () => {
		const apiData = await loadDevicesFromAPI()
		if (apiData) {
			devices.value     = apiData
			healthScore.value = calculateHealthScore(devices.value)
			syncStatus.value  = warningCount.value > 0 ? 'syncing' : 'synced'
		}
	}, 30000)
})
onUnload(() => {
	if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
	if (clockTimer) { clearInterval(clockTimer); clockTimer = null }
	if (batteryTimer) { clearInterval(batteryTimer); batteryTimer = null }
})
</script>
<style lang="scss">
/* ==========================================
   鍏ㄥ眬鏆楄壊鎴樻湳鑳屾櫙
   ========================================== */
.page-bg-grid {
	position: fixed; top: 0; left: 0; right: 0; bottom: 0;
	background-image:
		linear-gradient(rgba(0,212,255,.025) 1px, transparent 1px),
		linear-gradient(90deg, rgba(0,212,255,.025) 1px, transparent 1px);
	background-size: 60rpx 60rpx;
	pointer-events: none; z-index: 0;
}
.page-bg-glow {
	position: fixed; top: 0; left: 0; right: 0; height: 50vh;
	background: radial-gradient(ellipse at 50% -10%, rgba(0,212,255,.08) 0%, transparent 65%);
	pointer-events: none; z-index: 0;
}

/* ==========================================
   椤堕儴鐘舵€佹爮
   ========================================== */
.cv-status-bar {
	position: relative; z-index: 10;
	display: flex; align-items: center; gap: 12rpx;
	padding: calc(env(safe-area-inset-top) + 12rpx) 32rpx 12rpx;
	background: rgba(10,14,26,.95);
	border-bottom: 1px solid rgba(0,212,255,.1);
}
.cv-gps-dot {
	width: 10rpx; height: 10rpx; border-radius: 50%;
	&.online { background: #73D13D; box-shadow: 0 0 8rpx #73D13D; animation: blinkDot 2s ease-in-out infinite; }
	&.offline { background: #FFA940; animation: blinkDot 1.5s ease-in-out infinite; }
}
@keyframes blinkDot { 0%,100%{opacity:1} 50%{opacity:.4} }
.cv-gps-text { font-size: 20rpx; color: rgba(255,255,255,.5); }
.cv-divider-dot { width: 6rpx; height: 6rpx; border-radius: 50%; background: rgba(255,255,255,.15); }
.cv-battery-wrap { display: flex; align-items: center; gap: 6rpx; }
.cv-battery-icon { width: 28rpx; height: 16rpx; }
.cv-battery-text { font-size: 20rpx; color: rgba(255,255,255,.5); font-family: 'Courier New',monospace; }
.cv-node-label { font-size: 20rpx; color: rgba(255,255,255,.4); }
.cv-node-dot {
	width: 10rpx; height: 10rpx; border-radius: 50%;
	&.online { background: #73D13D; box-shadow: 0 0 8rpx #73D13D; animation: blinkDot 3s ease-in-out infinite; }
	&.warning { background: #FFA940; animation: blinkDot 1s ease-in-out infinite; }
	&.offline { background: #595959; }
}
.cv-time-text { margin-left: auto; font-size: 20rpx; color: rgba(255,255,255,.35); font-family: 'Courier New',monospace; }

/* ==========================================
   椤甸潰涓诲鍣>   ========================================== */
.device-page { width: 100vw; height: 100vh; background: transparent; display: flex; flex-direction: column }
.global-status-header { position: relative; z-index: 5;
	background: linear-gradient(180deg,rgba(16,22,38,.98) 0%,rgba(10,14,26,.96) 100%);
	backdrop-filter: blur(30rpx);
	padding: 28rpx 32rpx 24rpx;
	border-bottom: 1px solid rgba(0,212,255,.08);
	box-shadow: 0 8rpx 40rpx rgba(0,0,0,.6), 0 1px 0 rgba(0,212,255,.06);
}

.health-dashboard { display: flex; align-items: center; gap: 28rpx; margin-bottom: 20rpx }
.dashboard-circle { position: relative; width: 148rpx; height: 148rpx; flex-shrink: 0 }
.circle-breathe-ring {
	position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
	width: 100%; height: 100%; border-radius: 50%;
	border: 2px solid rgba(0,212,255,.25);
	animation: breatheRing 3s ease-in-out infinite;
}
@keyframes breatheRing {
	0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .6 }
	50% { transform: translate(-50%,-50%) scale(1.1); opacity: 0 }
}
.circle-progress {
	width: 100%; height: 100%; border-radius: 50%;
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	position: relative;
	&::before { content: ''; position: absolute; top: 8rpx; left: 8rpx; right: 8rpx; bottom: 8rpx; background: #1a1f2e; border-radius: 50% }
}
.health-value {
	position: relative; z-index: 1;
	font-size: 44rpx; font-weight: 900; color: #fff;
	font-family: 'Courier New',monospace;
	text-shadow: 0 0 20rpx currentColor;
}
.health-label { position: relative; z-index: 1; font-size: 20rpx; color: #8c8c8c; margin-top: 4rpx }
.health-stats { flex: 1; display: flex; flex-direction: column; gap: 14rpx }
.stat-item { display: flex; align-items: center; justify-content: space-between; padding: 14rpx 22rpx; background: rgba(42,47,62,.6); border-radius: 14rpx; border-left: 4px solid; transition: transform .2s ease; cursor: pointer;
	&:active { transform: scale(.97) }
	&.online { border-left-color: #73D13D; box-shadow: inset 4rpx 0 20rpx rgba(115,209,61,.1) }
	&.warning { border-left-color: #FFA940; box-shadow: inset 4rpx 0 20rpx rgba(255,169,64,.1) }
	&.offline { border-left-color: #595959 }
}
.stat-value { font-size: 30rpx; font-weight: 700; color: #fff; font-family: 'Courier New',monospace; text-shadow: 0 0 16rpx currentColor }
.stat-item.online .stat-value { color: #73D13D !important }
.stat-item.warning .stat-value { color: #FFA940 !important }
.stat-item.offline .stat-value { color: #595959 !important }
.stat-label { font-size: 22rpx; color: #8c8c8c }

/* ==========================================
   鍐呭婊氬姩鍖>   ========================================== */
.content-scroll { position: relative; z-index: 5; flex: 1; overflow: hidden }
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 28rpx 28rpx 20rpx; flex-wrap: wrap; gap: 14rpx }
.section-title { position: relative; padding-left: 18rpx; font-size: 30rpx; font-weight: 700; color: #fff;
	&::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 5rpx; height: 28rpx; background: linear-gradient(180deg,#00d4ff 0%,#0080b3 100%); border-radius: 3rpx; box-shadow: 0 0 10rpx #00d4ff }
}
.device-count { font-size: 22rpx; color: #8c8c8c }
.refresh-btn { width: 60rpx; height: 60rpx; border-radius: 50%; background: rgba(255,255,255,.1); display: flex; align-items: center; justify-content: center; transition: all .3s ease; flex-shrink: 0;
	&:active { transform: scale(.9) rotate(180deg) }
}
.refresh-icon { width: 30rpx; height: 30rpx }

/* ==========================================
   璁惧绫诲瀷绛涢€>   ========================================== */
.type-filter-section { padding: 0 28rpx 20rpx; position: relative; z-index: 5 }
.type-filter-scroll { overflow-x: auto; &::-webkit-scrollbar { display: none } }
.type-filter-wrap { display: flex; gap: 14rpx; padding: 4rpx 0 }
.type-filter-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; padding: 16rpx 20rpx; background: rgba(42,47,62,.5); border: 1px solid rgba(255,255,255,.06); border-radius: 16rpx; min-width: 120rpx; transition: all .25s ease; position: relative;
	&.active { background: rgba(0,212,255,.12); border-color: rgba(0,212,255,.45);
		.type-filter-label { color: #00d4ff }
	}
	&:active { transform: scale(.95) }
}
.type-filter-icon { width: 36rpx; height: 36rpx }
.type-filter-label { font-size: 20rpx; color: rgba(255,255,255,.5); white-space: nowrap }
.type-filter-count { position: absolute; top: -8rpx; right: -8rpx; min-width: 32rpx; height: 32rpx; padding: 0 6rpx; background: #00d4ff; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; font-size: 18rpx; font-weight: 700; color: #0a0e1a; font-family: 'Courier New',monospace }

/* ==========================================
   鎷撴墤鍖哄煙
   ========================================== */
.topology-section { margin-bottom: 24rpx; position: relative; z-index: 5 }

/* ==========================================
   璁惧鍒楄〃
   ========================================== */
.device-list-section { margin-bottom: 28rpx; position: relative; z-index: 5 }
.device-list { padding: 0 28rpx; display: flex; flex-direction: column; gap: 14rpx }

/* ==========================================
   绂荤嚎璧勬簮绠＄悊
   ========================================== */
.offline-management-section { margin-bottom: 28rpx; padding-bottom: calc(28rpx + env(safe-area-inset-bottom)); position: relative; z-index: 5 }
.storage-info { padding: 8rpx 16rpx; background: rgba(255,169,64,.15); border: 1px solid rgba(255,169,64,.3); border-radius: 14rpx }
.storage-text { font-size: 22rpx; font-weight: 600; color: #FFA940; font-family: 'Courier New',monospace }
.map-packages { padding: 0 28rpx; display: flex; flex-direction: column; gap: 14rpx; margin-bottom: 20rpx }
.cleanup-section { padding: 0 28rpx }
.cleanup-btn { width: 100%; height: 80rpx; background: rgba(255,77,79,.15); border: 1px solid rgba(255,77,79,.3); border-radius: 18rpx; display: flex; align-items: center; justify-content: center; gap: 14rpx; transition: all .3s ease;
	&:active { transform: scale(.98); background: rgba(255,77,79,.25) }
}
.cleanup-icon { width: 36rpx; height: 36rpx }
.cleanup-text { font-size: 26rpx; font-weight: 600; color: #FF4D4F }

/* ==========================================
   鍔ㄧ敾
   ========================================== */
.node-online { animation: pulseGreen 2s ease-in-out infinite }
@keyframes pulseGreen { 0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(115,209,61,.7)} 50%{transform:scale(1.05);box-shadow:0 0 0 20rpx rgba(115,209,61,0)} }
.node-warning { animation: pulseOrange 2s ease-in-out infinite }
@keyframes pulseOrange { 0%,100%{transform:scale(.95);box-shadow:0 0 0 0 rgba(255,169,64,.7)} 70%{transform:scale(1);box-shadow:0 0 0 15rpx rgba(255,169,64,0)} }
.node-offline { opacity: .4; filter: grayscale(1) }
.topology-line { stroke-dasharray: 5,5; animation: lineFlow 1s linear infinite;
	&.online { stroke: #73D13D } &.warning { stroke: #FFA940 } &.offline { stroke: #595959; stroke-dasharray: 2,8 }
}
@keyframes lineFlow { to { stroke-dashoffset: -10 } }
.heartbeat-ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 100%; height: 100%; border-radius: 50%; border: 2px solid #73D13D; animation: heartbeatExpand 2s ease-out infinite }
@keyframes heartbeatExpand { 0%{transform:translate(-50%,-50%) scale(1);opacity:1} 100%{transform:translate(-50%,-50%) scale(2);opacity:0} }

/* ==========================================
   宸ュ叿绫>   ========================================== */
.loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120rpx 0; gap: 24rpx }
.loading-spinner { width: 56rpx; height: 56rpx; border: 4px solid rgba(0,212,255,.3); border-top-color: #00d4ff; border-radius: 50%; animation: spin 1s linear infinite }
@keyframes spin { to { transform: rotate(360deg) } }
.loading-text { font-size: 24rpx; color: #8c8c8c }
</style>
