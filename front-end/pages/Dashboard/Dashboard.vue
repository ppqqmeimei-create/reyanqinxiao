<template>
	<view class="dashboard-page">
		<!-- 页头 -->
		<view class="db-header">
			<view class="db-header-left">
				<text class="db-title">边境活物走私态势大屏</text>
				<text class="db-subtitle">广西边境五大战区实时监控</text>
			</view>
			<view class="db-header-right">
				<text class="db-time mono">{{ nowText }}</text>
				<view class="live-dot"></view>
			</view>
		</view>

		<!-- 四大核心指标卡片 -->
		<view class="metrics-grid">
			<view class="metric-card metric-critical" @tap="loadMetrics">
				<view class="metric-glow"></view>
				<text class="metric-label">今日走私预警</text>
				<text class="metric-value mono critical-breath">{{ metrics.smugglingToday }}</text>
				<text class="metric-foot">较上日 +{{ metrics.smugglingDelta }}%</text>
			</view>
			<view class="metric-card metric-warning" @tap="loadMetrics">
				<view class="metric-glow-warn"></view>
				<text class="metric-label">濒危物种涉案</text>
				<text class="metric-value mono warn-val">{{ metrics.speciesInvolved }}</text>
				<text class="metric-foot">穿山甲 {{ metrics.pangolinCount }} / 象牙 {{ metrics.ivoryCount }} / 食蟹猴 {{ metrics.crabMonkeyCount }}</text>
			</view>
			<view class="metric-card" @tap="loadMetrics">
				<text class="metric-label">处置中任务</text>
				<text class="metric-value mono">{{ metrics.closureInProgress }}</text>
				<text class="metric-foot">待审核 {{ metrics.pendingReview }} 项</text>
			</view>
			<view class="metric-card" @tap="loadMetrics">
				<text class="metric-label">传感器在线率</text>
				<text class="metric-value mono">{{ metrics.deviceOnlineRate }}%</text>
				<text class="metric-foot">在线 {{ metrics.deviceOnline }}/{{ metrics.deviceTotal }}</text>
			</view>
		</view>

		<!-- 图表区域 -->
		<view class="panel-grid">
			<!-- 走私高发时段 + 物种分析 -->
			<view class="panel-card">
				<text class="panel-title">边境走私态势</text>
				<view class="chart-block">
					<!-- 时段柱状图 -->
					<view class="chart-section">
						<text class="chart-section-title">走私高发时段</text>
						<view class="bar-chart">
							<view class="bar-item" v-for="item in smugglingByTimeWithPercent" :key="item.slot">
								<view class="bar-track">
									<view class="bar-fill" :class="item.level" :style="{ height: item.percent + '%' }"></view>
								</view>
								<text class="bar-slot">{{ item.slot }}</text>
								<text class="bar-num mono">{{ item.count }}</text>
							</view>
						</view>
					</view>
					<!-- 物种进度条 -->
					<view class="chart-section">
						<text class="chart-section-title">涉案物种排名</text>
						<view class="species-list">
							<view class="species-row" v-for="s in speciesAnalysisWithPercent" :key="s.name">
								<text class="species-name">{{ s.name }}</text>
								<view class="species-track">
									<view class="species-fill" :style="{ width: s.percent + '%' }"></view>
								</view>
								<text class="species-val mono">{{ s.count }}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="legend-row">
					<text class="lg critical-dot">● 紧急 #FF4D4F</text>
					<text class="lg warning-dot">● 警告 #FFA940</text>
					<text class="lg normal-dot">● 正常 #00D4FF</text>
				</view>
			</view>

			<!-- 走私预警7日趋势 -->
			<view class="panel-card">
				<text class="panel-title">走私预警7日趋势</text>
				<view class="trend-list">
					<view class="trend-row" v-for="d in smugglingTrendWithPercent" :key="d.day">
						<text class="trend-day">{{ d.day }}</text>
						<view class="trend-track">
							<view class="trend-fill" :class="d.level" :style="{ width: d.percent + '%' }"></view>
						</view>
						<text class="trend-val mono">{{ d.freq }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 实时事件滚动播报 -->
		<view class="broadcast-card">
			<view class="broadcast-head">
				<text class="broadcast-title">实时走私预警播报</text>
				<text class="broadcast-tag">LIVE</text>
			</view>
			<swiper class="broadcast-swiper" vertical autoplay circular :interval="3000" :duration="500">
				<swiper-item v-for="(item, idx) in heartbeatFeed" :key="idx">
					<view class="broadcast-item" :class="item.level">
						<text class="b-time mono">{{ item.time }}</text>
						<text class="b-type">{{ item.type }}</text>
						<text class="b-msg">{{ item.message }}</text>
					</view>
				</swiper-item>
			</swiper>
		</view>

		<!-- 加载提示 -->
		<view v-if="loading" class="loading-tip">
			<text class="loading-text">数据加载中...</text>
		</view>

		<!-- 快捷功能入口 -->
		<view class="quick-nav-section">
			<view class="qn-title">快捷功能</view>
			<view class="qn-grid">
				<view class="qn-card" style="background:rgba(114,46,209,0.10);border-color:rgba(114,46,209,0.3);" @tap="goPage('/pages/Intelligence/Intelligence')">
					<text class="qn-icon">🧠</text>
					<text class="qn-label" style="color:#722ED1">情报研判</text>
				</view>
				<view class="qn-card" style="background:rgba(0,212,255,0.08);border-color:rgba(0,212,255,0.25);" @tap="goPage('/pages/Command/Command')">
					<text class="qn-icon">🚁</text>
					<text class="qn-label" style="color:#00D4FF">联合指挥</text>
				</view>
				<view class="qn-card" style="background:rgba(82,196,26,0.10);border-color:rgba(82,196,26,0.3);" @tap="goPage('/pages/SpeciesRecognition/SpeciesRecognition')">
					<text class="qn-icon">🦎</text>
					<text class="qn-label" style="color:#52C41A">AR物种识别</text>
				</view>
				<view class="qn-card" style="background:rgba(250,140,22,0.10);border-color:rgba(250,140,22,0.3);" @tap="goPage('/pages/RapidTest/RapidTest')">
					<text class="qn-icon">🧪</text>
					<text class="qn-label" style="color:#FA8C16">现场快检</text>
				</view>
				<view class="qn-card" style="background:rgba(255,77,79,0.08);border-color:rgba(255,77,79,0.25);" @tap="goPage('/pages/Performance/Performance')">
					<text class="qn-icon">📊</text>
					<text class="qn-label" style="color:#FF4D4F">战果统计</text>
				</view>
				<view class="qn-card" style="background:rgba(24,144,255,0.08);border-color:rgba(24,144,255,0.25);" @tap="goPage('/pages/SyncCenter/SyncCenter')">
					<text class="qn-icon">🔄</text>
					<text class="qn-label" style="color:#1890FF">数据同步</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ── 模拟数据（API不可用时兜底展示）──
const MOCK_METRICS = {
	smugglingToday: 8,
	smugglingDelta: 15,
	speciesInvolved: 156,
	pangolinCount: 89,
	ivoryCount: 34,
	crabMonkeyCount: 33,
	closureInProgress: 12,
	pendingReview: 3,
	deviceOnlineRate: 91,
	deviceOnline: 10,
	deviceTotal: 11
}
const MOCK_SMUGGLING_BY_TIME = [
	{ slot: '02', count: 2,  level: 'normal' },
	{ slot: '04', count: 5,  level: 'warning' },
	{ slot: '06', count: 18, level: 'critical' },
	{ slot: '08', count: 24, level: 'critical' },
	{ slot: '10', count: 15, level: 'warning' },
	{ slot: '12', count: 8,  level: 'normal' },
	{ slot: '14', count: 12, level: 'warning' },
	{ slot: '16', count: 20, level: 'critical' },
	{ slot: '18', count: 14, level: 'warning' },
	{ slot: '20', count: 10, level: 'normal' }
]
const MOCK_SPECIES_ANALYSIS = [
	{ name: '穿山甲', count: 23, level: 'critical' },
	{ name: '食蟹猴', count: 18, level: 'warning' },
	{ name: '海龟',   count: 15, level: 'critical' },
	{ name: '象牙',   count: 11, level: 'warning' },
	{ name: '巨蜥',   count: 9,  level: 'normal' }
]
const MOCK_SMUGGLING_TREND = [
	{ day: '周一', freq: 5,  level: 'normal' },
	{ day: '周二', freq: 12, level: 'warning' },
	{ day: '周三', freq: 8,  level: 'normal' },
	{ day: '周四', freq: 15, level: 'critical' },
	{ day: '周五', freq: 22, level: 'critical' },
	{ day: '周六', freq: 18, level: 'warning' },
	{ day: '周日', freq: 10, level: 'normal' }
]
const MOCK_HEARTBEAT_FEED = [
	{ level: 'critical', time: '08:27', type: '走私预警', message: '东兴口岸·红外触发疑似穿山甲活体（置信度92%）' },
	{ level: 'critical', time: '08:15', type: '走私预警', message: '友谊关·情报确认走私通道活跃（风险值88）' },
	{ level: 'warning',  time: '08:01', type: '边境告警', message: '龙州水口·震动光纤检测到异常活动' },
	{ level: 'critical', time: '07:48', type: '走私预警', message: '凭祥·卡口抓拍疑似象牙走私车辆' },
	{ level: 'warning',  time: '07:35', type: '空气质量', message: '凭祥AQI=118μg/m³，建议排查' },
	{ level: 'critical', time: '07:22', type: '走私预警', message: '浦寨互市区·异常活体箱（7号柜）' },
	{ level: 'warning',  time: '07:10', type: '土壤监测', message: '凭祥土壤重金属0.35mg/kg，超生态红线' },
	{ level: 'info',     time: '06:58', type: '红外哨兵', message: '友谊关红外A今日触发7次，请重点关注' }
]

// ── 时钟 ──
const nowText = ref('')
let timer = null

function tickTime() {
	const d = new Date()
	const h = String(d.getHours()).padStart(2, '0')
	const mi = String(d.getMinutes()).padStart(2, '0')
	const s = String(d.getSeconds()).padStart(2, '0')
	nowText.value = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${h}:${mi}:${s}`
}

// ── 数据状态 ──
const metrics = ref({ ...MOCK_METRICS })
const smugglingByTime = ref([...MOCK_SMUGGLING_BY_TIME])
const speciesAnalysis = ref([...MOCK_SPECIES_ANALYSIS])
const smugglingTrend = ref([...MOCK_SMUGGLING_TREND])
const heartbeatFeed = ref([...MOCK_HEARTBEAT_FEED])
const loading = ref(false)

// ── computed：自动计算 percent 供模板渲染 ──

const smugglingByTimeWithPercent = computed(() => {
	const max = Math.max(...smugglingByTime.value.map(i => i.count), 1)
	return smugglingByTime.value.map(i => ({ ...i, percent: Math.round((i.count / max) * 100) }))
})
const speciesAnalysisWithPercent = computed(() => {
	const max = Math.max(...speciesAnalysis.value.map(s => s.count), 1)
	return speciesAnalysis.value.map(s => ({ ...s, percent: Math.round((s.count / max) * 100) }))
})
const smugglingTrendWithPercent = computed(() => {
	const max = Math.max(...smugglingTrend.value.map(d => d.freq), 1)
	return smugglingTrend.value.map(d => ({ ...d, percent: Math.round((d.freq / max) * 100) }))
})

// ── 加载函数：优先调 API，失败则用本地模拟数据 ──
async function loadMetrics() {
	try {
		const res = await dashboardAPI.getMetrics()
		if (res.success && res.data) {
			metrics.value = { ...MOCK_METRICS, ...res.data }
			return
		}
	} catch (e) { /* ignore, use mock */ }
	metrics.value = { ...MOCK_METRICS }
}

async function loadSmugglingTrend() {
	try {
		const res = await dashboardAPI.getSmugglingTrend()
		if (res.success && res.data) { smugglingByTime.value = res.data; return }
	} catch (e) { /* ignore */ }
	smugglingByTime.value = [...MOCK_SMUGGLING_BY_TIME]
}

async function loadSmugglingTrendData() {
	try {
		const res = await dashboardAPI.getSmugglingTrend()
		if (res.success && res.data) { smugglingTrend.value = res.data; return }
	} catch (e) { /* ignore */ }
	smugglingTrend.value = [...MOCK_SMUGGLING_TREND]
}

async function loadAggregation() {
	try {
		const res = await dashboardAPI.getAggregation()
		if (res.success && res.data) { speciesAnalysis.value = res.data; return }
	} catch (e) { /* ignore */ }
	speciesAnalysis.value = [...MOCK_SPECIES_ANALYSIS]
}

async function loadHeartbeat() {
	try {
		const res = await dashboardAPI.getHeartbeatFeed(10)
		if (res.success && res.data) { heartbeatFeed.value = res.data; return }
	} catch (e) { /* ignore */ }
	heartbeatFeed.value = [...MOCK_HEARTBEAT_FEED]
}

async function loadAll() {
	loading.value = true
	await Promise.all([
		loadMetrics(),
		loadSmugglingTrend(),
		loadSmugglingTrendData(),
		loadAggregation(),
		loadHeartbeat()
	])
	loading.value = false
}

function goPage(url) {
	uni.navigateTo({ url })
}

let heartbeatTimer = null

onMounted(() => {
	tickTime()
	timer = setInterval(tickTime, 1000)
	loadAll()
	heartbeatTimer = setInterval(loadHeartbeat, 30000)
})

onUnmounted(() => {
	if (timer) clearInterval(timer)
	if (heartbeatTimer) clearInterval(heartbeatTimer)
})
</script>

<style lang="scss" scoped>
.dashboard-page{padding:24rpx;background:var(--bg-root);min-height:100vh;color:#eaf6ff;display:flex;flex-direction:column;gap:18rpx}.db-header{background:rgba(12,27,42,.9);border:1px solid var(--line-soft);border-radius:24rpx;padding:20rpx 24rpx;display:flex;justify-content:space-between;align-items:center}.db-header-left{display:flex;flex-direction:column;gap:4rpx}.db-title{font-size:34rpx;font-weight:700;color:var(--brand-primary);display:block;letter-spacing:1rpx}.db-subtitle{font-size:22rpx;color:#8ca3b8;display:block}.db-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:6rpx}.db-time{font-size:24rpx;color:#d3ebff}.live-dot{width:10rpx;height:10rpx;border-radius:50%;background:#00FF87;box-shadow:0 0 8rpx #00FF87;animation:livePulse 1.5s ease-in-out infinite;align-self:flex-end}@keyframes livePulse{0%,100%{opacity:1;box-shadow:0 0 6rpx #00FF87}50%{opacity:.5;box-shadow:0 0 14rpx #00FF87}}.metrics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14rpx}.metric-card{position:relative;background:rgba(12,27,42,.9);border-radius:22rpx;border:1px solid var(--line-soft);padding:20rpx;overflow:hidden;cursor:pointer;transition:transform .2s;&:active{transform:scale(.97)}}.metric-critical{border-color:#FF4D4F;box-shadow:0 0 18rpx rgba(255,77,79,.35);.metric-glow{position:absolute;inset:-20rpx;background:radial-gradient(circle at center,rgba(255,77,79,.18) 0%,transparent 70%);pointer-events:none}}.metric-warning{border-color:#FFA940;box-shadow:0 0 14rpx rgba(255,169,64,.3);.metric-glow-warn{position:absolute;inset:-20rpx;background:radial-gradient(circle at center,rgba(255,169,64,.15) 0%,transparent 70%);pointer-events:none}}.metric-label{font-size:22rpx;color:#b6ccdd;display:block;margin-bottom:8rpx}.metric-value{font-size:58rpx;font-weight:800;line-height:1.05;display:block}.warn-val{color:#FFA940}.metric-foot{font-size:20rpx;color:#8ca3b8}.mono{font-family:'Consolas','Courier New',monospace;font-variant-numeric:tabular-nums}.critical-breath{color:#FF4D4F;animation:alertBreath 1.6s ease-in-out infinite}@keyframes alertBreath{0%,100%{text-shadow:0 0 8rpx rgba(255,77,79,.5)}50%{text-shadow:0 0 24rpx rgba(255,77,79,1)}}.panel-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:14rpx}.panel-card{background:rgba(12,27,42,.9);border:1px solid var(--line-soft);border-radius:24rpx;padding:18rpx}.broadcast-card{background:rgba(12,27,42,.9);border:1px solid var(--line-soft);border-radius:24rpx;padding:18rpx}.panel-title{font-size:24rpx;font-weight:700;color:#d9f3ff;display:block;margin-bottom:14rpx}.chart-block{display:grid;grid-template-columns:1fr 1fr;gap:14rpx}.chart-section{display:flex;flex-direction:column;gap:8rpx}.chart-section-title{font-size:20rpx;color:#8ca3b8;margin-bottom:4rpx}.bar-chart{display:flex;align-items:flex-end;gap:8rpx;height:160rpx;padding-top:8rpx}.bar-item{flex:1;text-align:center}.bar-track{height:110rpx;display:flex;align-items:flex-end;justify-content:center}.bar-fill{width:22rpx;border-radius:8rpx 8rpx 0 0;background:#3f556b;transition:height .4s ease;&.critical{background:#FF4D4F;box-shadow:0 0 14rpx rgba(255,77,79,.5);animation:barGlow 2s ease-in-out infinite}&.warning{background:#FFA940}&.normal{background:var(--brand-primary)}}@keyframes barGlow{0%,100%{box-shadow:0 0 8rpx rgba(255,77,79,.4)}50%{box-shadow:0 0 18rpx rgba(255,77,79,.8)}}.bar-slot,.bar-num{display:block;font-size:18rpx;color:#9db3c6}.bar-num{margin-top:2rpx}.species-list{display:flex;flex-direction:column;gap:10rpx;padding-top:8rpx}.species-row{display:grid;grid-template-columns:90rpx 1fr 40rpx;align-items:center;gap:10rpx}.species-name{font-size:20rpx;color:#cbe4f7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.species-track{height:10rpx;background:rgba(255,255,255,.08);border-radius:99rpx;overflow:hidden}.species-fill{height:100%;background:linear-gradient(90deg,var(--brand-primary),#00A8D6);border-radius:99rpx;transition:width .4s ease}.species-val{font-size:20rpx;color:#eaf6ff;text-align:right}.legend-row{margin-top:12rpx;display:flex;gap:16rpx;flex-wrap:wrap}.lg{font-size:20rpx}.critical-dot{color:#FF4D4F}.warning-dot{color:#FFA940}.normal-dot{color:var(--brand-primary)}.trend-list{display:flex;flex-direction:column;gap:14rpx}.trend-row{display:grid;grid-template-columns:70rpx 1fr 50rpx;align-items:center;gap:10rpx}.trend-day{font-size:22rpx;color:#aac2d4}.trend-track{height:12rpx;background:rgba(255,255,255,.08);border-radius:99rpx;overflow:hidden}.trend-fill{height:100%;border-radius:99rpx;transition:width .4s ease;&.critical{background:#FF4D4F;box-shadow:0 0 10rpx rgba(255,77,79,.4)}&.warning{background:#FFA940}&.normal{background:var(--brand-primary)}}.trend-val{font-size:20rpx;color:#eaf6ff;text-align:right}.broadcast-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10rpx}.broadcast-title{font-size:24rpx;font-weight:700;color:#d9f3ff}.broadcast-tag{font-size:18rpx;color:#FF4D4F;font-weight:700;animation:alertBreath 1.2s ease-in-out infinite}.broadcast-swiper{height:140rpx}.broadcast-item{height:128rpx;border-radius:16rpx;padding:14rpx;display:grid;grid-template-columns:120rpx 130rpx 1fr;align-items:center;gap:10rpx;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);&.critical{border-color:#FF4D4F;box-shadow:0 0 14rpx rgba(255,77,79,.3);background:rgba(255,77,79,.06)}&.warning{border-color:#FFA940;box-shadow:0 0 10rpx rgba(255,169,64,.2)}}.b-time{font-size:20rpx;color:#9eb8cc}.b-type{font-size:20rpx;color:var(--brand-primary)}.b-msg{font-size:22rpx;color:#eaf6ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.loading-tip{text-align:center;padding:8rpx 0}.loading-text{font-size:22rpx;color:#8ca3b8}@media(max-width:900rpx){.metrics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.panel-grid{grid-template-columns:1fr}.chart-block{grid-template-columns:1fr}.broadcast-item{grid-template-columns:100rpx 110rpx 1fr}}.quick-nav-section{margin-top:4rpx;padding:20rpx 24rpx;background:rgba(12,27,42,.9);border:1px solid var(--line-soft);border-radius:24rpx}.qn-title{font-size:24rpx;font-weight:700;color:#d9f3ff;margin-bottom:16rpx;display:block}.qn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14rpx}.qn-card{display:flex;flex-direction:column;align-items:center;gap:8rpx;padding:24rpx 16rpx;border-radius:18rpx;border:1px solid rgba(255,255,255,.08);transition:transform .15s ease;&:active{transform:scale(.95)}; .qn-icon{font-size:48rpx;line-height:1} .qn-label{font-size:22rpx;font-weight:600;white-space:nowrap}}
</style>
