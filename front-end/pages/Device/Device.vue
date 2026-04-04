<template>
	<view class="device-page">
		<view class="global-status-header">
			<view class="health-dashboard">
				<view class="dashboard-circle">
					<view class="circle-progress" :style="healthStyle">
						<text class="health-value">{{ healthScore }}%</text>
						<text class="health-label">系统健康</text>
					</view>
				</view>
				<view class="health-stats">
					<view class="stat-item online"><text class="stat-value">{{ onlineCount }}</text><text class="stat-label">在线</text></view>
					<view class="stat-item warning"><text class="stat-value">{{ warningCount }}</text><text class="stat-label">预警</text></view>
					<view class="stat-item offline"><text class="stat-value">{{ offlineCount }}</text><text class="stat-label">离线</text></view>
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
						<text class="section-title">🛡️ 广西边境防控设备网络</text>
						<view class="refresh-btn" @tap="refreshDevices">
							<image class="refresh-icon" src="/static/icons/layers.png" mode="aspectFit"></image>
						</view>
					</view>
					<!-- 设备位置地图（由 TopologyView 统一渲染） -->
					<TopologyView :devices="devices" :edgeNodes="edgeNodes" @deviceTap="handleDeviceTap" />
				</view>
				<view class="device-list-section">
					<view class="section-header">
						<text class="section-title">设备详情</text>
						<text class="device-count">{{ devices.length }} 台设备</text>
					</view>
					<view class="device-list">
						<DeviceStatCard v-for="d in sortedDevices" :key="d.id" :device="d" @tap="handleDeviceTap(d)" />
					</view>
				</view>
				<view class="offline-management-section">
					<view class="section-header">
						<text class="section-title">🗺️ 广西边境离线地图包</text>
						<view class="storage-info"><text class="storage-text">已用 {{ usedStorage }}MB / {{ totalStorage }}MB</text></view>
					</view>
					<view class="map-packages">
						<MapPackageItem v-for="pkg in mapPackages" :key="pkg.id" :pkg="pkg" @download="handleDownloadMap" @delete="handleDeleteMap" />
					</view>
					<view class="cleanup-section">
						<view class="cleanup-btn" @tap="handleCleanup">
							<image class="cleanup-icon" src="/static/icons-3/storage-box.png" mode="aspectFit"></image>
							<text class="cleanup-text">清理已上传采样</text>
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
	return { background: 'conic-gradient(' + c + ' ' + p + '%, rgba(255,255,255,0.1) ' + p + '%)' }
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
		// ── 置顶：红外热成像设备 ──
		{ id:'BD-IR-001', name:'东兴口岸红外热成像摄像头A',    type:'camera-infrared', status:'online',  battery:82, signal:90, location:{latitude:21.5450,longitude:107.9720}, lastActive:new Date(Date.now()-180000),  edgeNodeId:'EDGE-DONGXING-01' },
		{ id:'BD-IR-002', name:'友谊关口岸红外热成像摄像头',   type:'camera-infrared', status:'warning', battery:21, signal:64, location:{latitude:22.1128,longitude:106.7612}, lastActive:new Date(Date.now()-900000),  edgeNodeId:'EDGE-PINGXIANG-01' },
		{ id:'BD-IR-003', name:'龙州水口红外热成像监控哨',     type:'camera-infrared', status:'online',  battery:75, signal:85, location:{latitude:22.4920,longitude:106.6800}, lastActive:new Date(Date.now()-300000),  edgeNodeId:'EDGE-LONGZHOU-01' },
		{ id:'BD-IR-004', name:'那坡界碑红外热成像监控哨',     type:'camera-infrared', status:'warning', battery:38, signal:58, location:{latitude:23.4300,longitude:105.8400}, lastActive:new Date(Date.now()-600000),  edgeNodeId:'EDGE-NAPO-01' },
		// ── 置顶：无人机巡检 ──
		{ id:'BD-DR-001', name:'广西边境无人机巡检001',        type:'drone',           status:'offline', battery:0,  signal:0,  location:{latitude:22.8250,longitude:108.3650}, lastActive:new Date(Date.now()-7200000), edgeNodeId:'EDGE-GX-HQ' },
		{ id:'BD-DR-002', name:'广西边境无人机巡检002',        type:'drone',           status:'online',  battery:68, signal:72, location:{latitude:22.1128,longitude:106.7612}, lastActive:new Date(Date.now()-600000),  edgeNodeId:'EDGE-PINGXIANG-01' },
		// ── 置顶：边境震动光纤 ──
		{ id:'BD-FV-001', name:'那坡界碑震动光纤01',           type:'fiber',           status:'warning', battery:54, signal:61, location:{latitude:23.4245,longitude:105.8336}, lastActive:new Date(Date.now()-480000),  edgeNodeId:'EDGE-NAPO-01' },
		{ id:'BD-FV-002', name:'靖西岳圩震动光纤01',           type:'fiber',           status:'online',  battery:80, signal:76, location:{latitude:23.1400,longitude:106.4200}, lastActive:new Date(Date.now()-240000),  edgeNodeId:'EDGE-JINGXI-01' },
		// ── 卡口抓拍摄像头 ──
		{ id:'BD-CC-001', name:'万尾金滩卡口抓拍摄像头',       type:'camera-visible',  status:'warning', battery:46, signal:78, location:{latitude:21.5318,longitude:108.0325}, lastActive:new Date(Date.now()-220000),  edgeNodeId:'EDGE-DONGXING-01' },
		{ id:'BD-CC-002', name:'友谊关卡口抓拍摄像头',         type:'camera-visible',  status:'online',  battery:88, signal:86, location:{latitude:22.1080,longitude:106.7620}, lastActive:new Date(Date.now()-90000),   edgeNodeId:'EDGE-PINGXIANG-01' },
		// ── 活体探测雷达 ──
		{ id:'BD-LR-001', name:'凭祥活体探测雷达01',           type:'smell',           status:'online',  battery:76, signal:82, location:{latitude:22.0900,longitude:106.7700}, lastActive:new Date(Date.now()-300000),  edgeNodeId:'EDGE-PINGXIANG-01' },
		{ id:'BD-LR-002', name:'龙州水口口岸活体探测雷达01',  type:'smell',           status:'online',  battery:80, signal:79, location:{latitude:22.4868,longitude:106.6719}, lastActive:new Date(Date.now()-240000),  edgeNodeId:'EDGE-LONGZHOU-01' }
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
		const token   = uni.getStorageSync('token')
		const baseURL = uni.getStorageSync('baseURL') || 'http://localhost:5000'
		if (!token) throw new Error('未登录')
		const res = await new Promise((resolve, reject) => {
			uni.request({
				url: baseURL + '/api/devices/list?limit=50',
				header: { Authorization: 'Bearer ' + token },
				success: resolve, fail: reject, timeout: 8000
			})
		})
		if (res.statusCode === 200 && res.data?.data) {
			return res.data.data.map(normalizeDevice)
		}
		throw new Error('HTTP ' + res.statusCode)
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
		iconPath: d.status === 'online' ? '/static/icons/device-online.png' : d.status === 'warning' ? '/static/icons/device-warning.png' : '/static/icons/device-offline.png',
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
		// ── 广西边境离线地图包（置顶）──
		{ id:'MAP-GX-001', name:'🗺️ 广西全境边境综合离线地图包',           size:186, status:'downloading', progress:67,  updateTime:new Date() },
		{ id:'MAP-GX-002', name:'📍 凭祥友谊关精细边境图（含界碑坐标）',     size:38,  status:'downloaded',  progress:100, updateTime:new Date(Date.now()-86400000*3) },
		{ id:'MAP-GX-003', name:'📍 东兴万尾金滩精细边境图（含界碑坐标）',   size:45,  status:'downloaded',  progress:100, updateTime:new Date(Date.now()-86400000*7) },
		{ id:'MAP-GX-004', name:'📍 那坡平孟口岸精细边境图（含界碑坐标）',   size:32,  status:'available',   progress:0,   updateTime:new Date() },
		{ id:'MAP-GX-005', name:'📍 龙州水口口岸精细边境图（含界碑坐标）',   size:29,  status:'available',   progress:0,   updateTime:new Date() },
		{ id:'MAP-GX-006', name:'📍 靖西岳圩口岸精细边境图（含界碑坐标）',   size:27,  status:'downloading', progress:23,  updateTime:new Date() },
		{ id:'MAP-GX-007', name:'🛰️ 广西边境红外/震动设备离线拓扑图',         size:12,  status:'downloaded',  progress:100, updateTime:new Date(Date.now()-86400000*1) }
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
	const st   = { online:'在线 🟢', warning:'预警 🟠', offline:'离线 ⚫' }[device.status] || '未知'
	const warn = device.battery < 20 ? '\n⚠️ 电量不足，建议顺路检查充电！' : ''
	const typeMap = {
		'camera-visible':  '卡口抓拍摄像头',
		'camera-infrared': '红外热成像摄像头',
		'fiber':           '边境震动光纤传感器',
		'smell':           '活体探测雷达',
		'drone':           '无人机巡检系统',
		'water-monitor':   '水质监测仪',
		'air-monitor':     '空气探测仪',
		'soil-monitor':    '活体物种探测器'
	}
	const typeName = typeMap[device.type] || device.type
	const remoteCtrl = ['BD-IR-001','BD-CC-001','BD-IR-002','BD-DR-001'].includes(device.id)
	uni.showModal({
		title: device.name,
		content: '编号: ' + device.id + '\n类型: ' + typeName + '\n状态: ' + st + '\n电量: ' + device.battery + '%\n信号: ' + device.signal + '%' + warn + (remoteCtrl ? '\n\n支持远程控制（调整角度/抓拍/重启）' : ''),
		showCancel: true, cancelText:'关闭', confirmText: remoteCtrl ? '远程控制' : '创建检查任务',
		success: res => {
			if (res.confirm) {
				if (remoteCtrl) {
					uni.showActionSheet({
						itemList: ['远程抓拍', '调整摄像头角度', '远程重启'],
						success: (r) => {
							const actions = ['远程抓拍指令已下发', '角度调整指令已下发', '重启指令已下发']
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

function handleDownloadMap(pkg) {
	if (pkg.status === 'downloading') return
	pkg.status   = 'downloading'
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
		content: '确认删除"' + pkg.name + '"地图包？',
		success: res => { if (res.confirm) { pkg.status = 'available'; pkg.progress = 0; uni.showToast({ title:'已删除', icon:'success' }) } }
	})
}

function handleCleanup() {
	uni.vibrateShort()
	uni.showModal({
		title: '清理缓存',
		content: '确认清理已上传的采样缓存数据？',
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
onUnload(() => { if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null } })
</script>
<style lang="scss">
@import './device.scss';
.loading-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:120rpx 0; gap:24rpx; }
.loading-spinner { width:60rpx; height:60rpx; border:4px solid rgba(0,212,255,.3); border-top-color:#00d4ff; border-radius:50%; animation:spin 1s linear infinite; }
@keyframes spin { to{ transform:rotate(360deg) } }
.loading-text { font-size:26rpx; color:#8c8c8c; }
</style>
