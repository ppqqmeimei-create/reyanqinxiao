<template>
	<view class="dashboard-page">
		<!-- 页头 -->
		<view class="db-header">
			<view class="db-header-left">
				<text class="db-title">双轨数据指挥看板</text>
				<text class="db-subtitle">环境资源与食药侦查协同态势</text>
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
				<text class="metric-label">今日活物走私预警</text>
				<text class="metric-value mono critical-breath">{{ metrics.smugglingToday }}</text>
				<text class="metric-foot">较上日 +{{ metrics.smugglingDelta }}%</text>
			</view>
			<view class="metric-card metric-warning" @tap="loadMetrics">
				<view class="metric-glow-warn"></view>
				<text class="metric-label">生态环境异常告警</text>
				<text class="metric-value mono warn-val">{{ metrics.ecologyAbnormal }}</text>
				<text class="metric-foot">水 {{ metrics.water }} / 气 {{ metrics.air }} / 土 {{ metrics.soil }}</text>
			</view>
			<view class="metric-card" @tap="loadMetrics">
				<text class="metric-label">处理中闭环任务</text>
				<text class="metric-value mono">{{ metrics.closureInProgress }}</text>
				<text class="metric-foot">待审核 {{ metrics.pendingReview }} 项</text>
			</view>
			<view class="metric-card" @tap="loadMetrics">
				<text class="metric-label">重点感知设备在线率</text>
				<text class="metric-value mono">{{ metrics.deviceOnlineRate }}%</text>
				<text class="metric-foot">在线 {{ metrics.deviceOnline }}/{{ metrics.deviceTotal }}</text>
			</view>
		</view>

		<!-- 图表区域 -->
		<view class="panel-grid">
			<!-- 走私高发时段 + 物种分析 -->
			<view class="panel-card">
				<text class="panel-title">边境风险态势</text>
				<view class="chart-block">
					<!-- 时段柱状图 -->
					<view class="chart-section">
						<text class="chart-section-title">走私高发时段</text>
						<view class="bar-chart">
							<view class="bar-item" v-for="item in smugglingByTime" :key="item.slot">
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
							<view class="species-row" v-for="s in speciesAnalysis" :key="s.name">
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

			<!-- 生态异常7日趋势 -->
			<view class="panel-card">
				<text class="panel-title">生态异常7日趋势</text>
				<view class="trend-list">
					<view class="trend-row" v-for="d in ecologyTrend" :key="d.day">
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
				<text class="broadcast-title">实时事件播报</text>
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
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { dashboardAPI } from '@/utils/request.js'

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

// ── 指标卡片 ──
const metrics = ref({
	smugglingToday: 0,
	smugglingDelta: 0,
	ecologyAbnormal: 0,
	water: 0,
	air: 0,
	soil: 0,
	closureInProgress: 0,
	pendingReview: 0,
	deviceOnlineRate: 0,
	deviceOnline: 0,
	deviceTotal: 0
})

// ── 走私时段 ──
const smugglingByTime = ref([])

// ── 物种分析 ──
const speciesAnalysis = ref([])

// ── 生态趋势 ──
const ecologyTrend = ref([])

// ── 实时播报 ──
const heartbeatFeed = ref([])

// ── 加载状态 ──
const loading = ref(false)

async function loadMetrics() {
	try {
		const res = await dashboardAPI.getMetrics()
		if (res.success && res.data) {
			metrics.value = { ...metrics.value, ...res.data }
		}
	} catch (e) {
		console.warn('[Dashboard] loadMetrics failed:', e.message)
	}
}

async function loadSmugglingTrend() {
	try {
		const res = await dashboardAPI.getSmugglingTrend()
		if (res.success && res.data) {
			smugglingByTime.value = res.data
		}
	} catch (e) {
		console.warn('[Dashboard] loadSmugglingTrend failed:', e.message)
	}
}

async function loadEcologyTrend() {
	try {
		const res = await dashboardAPI.getEcologyTrend()
		if (res.success && res.data) {
			ecologyTrend.value = res.data
		}
	} catch (e) {
		console.warn('[Dashboard] loadEcologyTrend failed:', e.message)
	}
}

async function loadAggregation() {
	try {
		const res = await dashboardAPI.getAggregation()
		if (res.success && res.data) {
			speciesAnalysis.value = res.data
		}
	} catch (e) {
		console.warn('[Dashboard] loadAggregation failed:', e.message)
	}
}

async function loadHeartbeat() {
	try {
		const res = await dashboardAPI.getHeartbeatFeed(10)
		if (res.success && res.data) {
			heartbeatFeed.value = res.data
		}
	} catch (e) {
		console.warn('[Dashboard] loadHeartbeat failed:', e.message)
	}
}

async function loadAll() {
	loading.value = true
	await Promise.all([
		loadMetrics(),
		loadSmugglingTrend(),
		loadEcologyTrend(),
		loadAggregation(),
		loadHeartbeat()
	])
	loading.value = false
}

let heartbeatTimer = null

onMounted(() => {
	tickTime()
	timer = setInterval(tickTime, 1000)
	loadAll()
	// 每30秒刷新一次实时播报
	heartbeatTimer = setInterval(loadHeartbeat, 30000)
})

onUnmounted(() => {
	if (timer) clearInterval(timer)
	if (heartbeatTimer) clearInterval(heartbeatTimer)
})
</script>

<style lang="scss" scoped>
@import './dashboard.scss';
</style>
