	<template>
	<view class="alert-card" :class="cardClass" @tap="emit('click')" @longpress="onLongPress" @touchstart="onTouchStart" @touchend="onTouchEnd">
		<!-- 顶部渐变光条 -->
		<view class="card-top-bar" :class="'bar-' + alert.level"></view>

		<!-- 倒计时条（critical预警） -->
		<view v-if="alert.level === 'critical'" class="countdown-bar-wrap">
			<view class="countdown-bar" :style="{ width: countdownPercent + '%' }"></view>
		</view>

		<!-- 卡片内容 -->
		<view class="card-inner">
			<!-- 头部：案件编号 / 标题 / 风险评分环 -->
			<view class="card-header">
				<view class="header-left">
					<view v-if="batchMode" class="batch-checkbox" @tap.stop="toggleSelect(alert.id || alert._id)">
						<text class="checkbox-icon">{{ selectedAlerts.includes(alert.id || alert._id) ? '☑️' : '⬜' }}</text>
					</view>
					<text class="case-number">{{ headerId }}</text>
					<view class="header-subtitle">
						<text class="subtitle-icon">{{ categoryIcon }}</text>
						<text class="subtitle-text">{{ headerSubtitle }}</text>
					</view>
					<view v-if="headerBadge" class="type-badge" :class="'badge-' + alert.level">
						<text class="type-badge-text">{{ headerBadge }}</text>
					</view>
				</view>
				<view class="header-right">
					<view class="risk-score-ring" :class="riskScoreClass">
						<text class="risk-score-num">{{ alertView.riskScore }}</text>
						<text class="risk-score-label">分</text>
					</view>
					<view class="trend-indicator" :class="'trend-' + alertTrend">
						<text class="trend-arrow">{{ trendIcon }}</text>
					</view>
				</view>
			</view>

			<!-- 指标行1：分类专用字段 -->
			<view class="metrics-row">
				<view class="metric-item">
					<text class="metric-label">{{ m1Label }}</text>
					<text class="metric-value" :class="m1ValueClass">{{ m1Value }}</text>
				</view>
				<view v-if="m2Value" class="metric-divider"></view>
				<view v-if="m2Value" class="metric-item">
					<text class="metric-label">{{ m2Label }}</text>
					<text class="metric-value">{{ m2Value }}</text>
				</view>
				<view class="metric-divider"></view>
				<view class="metric-item">
					<text class="metric-label">风险等级</text>
					<text class="metric-value" :class="'level-' + alert.level">{{ alertView.displayRiskLevel }}</text>
				</view>
			</view>

			<!-- 指标行2：分类专用次要字段 -->
			<view v-if="hasRow2" class="metrics-row metrics-row-sub">
				<view class="metric-item">
					<text class="metric-label">{{ m3Label }}</text>
					<text class="metric-value">{{ m3Value }}</text>
				</view>
				<view v-if="m4Value" class="metric-divider"></view>
				<view v-if="m4Value" class="metric-item">
					<text class="metric-label">{{ m4Label }}</text>
					<text class="metric-value">{{ m4Value }}</text>
				</view>
			</view>

			<!-- 位置/来源 + 时间 -->
			<view class="location-time-row">
				<text class="location-text">📍 {{ locationText }}</text>
				<text class="time-text">🕐 {{ formatTime(alert.timestamp || alert.time || alert.created_at || alert.create_time) }}</text>
			</view>

			<!-- 法律依据（有实质内容才显示，否则轻提示引导点卡片） -->
			<view v-if="hasLegalDetail" class="legal-section">
				<view class="legal-item">
					<text class="legal-label">法律依据</text>
					<text class="legal-content">{{ legalLawText }}</text>
				</view>
				<view class="penalty-item">
					<text class="penalty-label">处罚建议</text>
					<text class="penalty-content">{{ legalPenaltyText }}</text>
				</view>
			</view>
			<view v-else class="legal-hint" @tap.stop="emit('click')">
				<text class="legal-hint-text">点卡片查看详情与法律依据</text>
			</view>

			<!-- 操作按钮 -->
			<view v-if="!alert.handled && alert.status !== 'resolved'" class="card-actions">
				<view class="action-btn act-btn-ghost" @tap="emit('ignore')">
					<text class="act-icon">🛑</text>
					<text class="act-text">忽略</text>
				</view>
				<view class="action-btn act-btn-danger" :class="{ 'pulse-danger': alert.level === 'critical' }" @tap="emit('createTask')">
					<text class="act-icon">⚡</text>
					<text class="act-text">{{ alert.level === 'critical' ? '立即处置' : '处置' }}</text>
				</view>
			</view>
			<view v-else class="handled-row">
				<text class="handled-text">✓ 已处理</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

// ===== 分类字段配置 =====
const LEVEL_CN = {
	critical: '紧急', high: '高危', medium: '预警',
	warning: '预警', low: '一般', handled: '已处理',
	resolved: '已处理', unknown: '—'
}

const CATEGORY_META = {
	enforcement: {
		icon: '🦎',
		subtitleFn: (a) => a.title || a.species_name || '生态预警',
		badgeFn: (a) => {
			if (a.protection_level) return a.protection_level
			if (a.cites) return a.cites
			return null
		},
		badgeClass: 'badge-species',
		m1: { label: '疑似物种',   get: (a) => a.species_name || a.speciesType || '--' },
		m2: { label: '目标数量',   get: (a) => a.animal_count ? String(a.animal_count) + '只' : null },
		m3: { label: '保护等级',   get: (a) => a.protection_level || null },
		m4: { label: '影响范围',   get: (a) => a.affectedPopulation ? formatPopulation(a.affectedPopulation) : null },
		locationField: (a) => a.border_section || a.location || ''
	},
	ecology: {
		icon: '🌿',
		subtitleFn: (a) => getEcologyTypeName(a.type || a.alert_type),
		badgeFn: (a) => getAlertLevelText(a.level),
		m1: { label: '预警类型',   get: (a) => a.speciesType || a.species_type || a.pollutantType || '--' },
		m2: { label: '风险评分',   get: (a) => a.riskScore != null ? String(a.riskScore) : null },
		m3: { label: '来源渠道',   get: (a) => a.source || null },
		m4: { label: '影响范围',   get: (a) => a.affectedPopulation ? formatPopulation(a.affectedPopulation) : null },
		locationField: (a) => a.location || ''
	},
	fooddrug: {
		icon: '🏥',
		subtitleFn: (a) => getFoodDrugTypeName(a.alert_type || a.alert_type),
		badgeFn: (a) => getRecallStatusText(a.recall_status),
		badgeClass: (a) => 'badge-recall badge-recall-' + (a.recall_status || 'unknown'),
		m1: { label: '涉及产品',   get: (a) => a.product_name || '--' },
		m2: { label: '涉事企业',   get: (a) => a.manufacturer || null },
		m3: { label: '产品批次',   get: (a) => a.product_batch ? '批:' + a.product_batch : null },
		m4: { label: '波及人数',   get: (a) => a.affected_consumers ? formatPopulation(a.affected_consumers) : null },
		locationField: () => ''
	}
}

function getEcologyTypeName(type) {
	return {
		'wildlife-track':   '野生动物活动预警',
		'habitat-damage':   '栖息地破坏预警',
		'water-quality':    '水质异常预警',
		'border-anomaly':   '边境走私异常预警'
	}[type] || '生态预警'
}

function getAlertLevelText(level) {
	return {
		critical: '紧急',
		high: '高危',
		warning: '预警',
		medium: '预警',
		low: '一般',
		handled: '已处理',
		resolved: '已处理'
	}[level] || null
}

function getFoodDrugTypeName(type) {
	return {
		food: '食品安全预警',
		drug: '药品安全预警',
		cosmetic: '化妆品预警'
	}[type] || '食品药品预警'
}

function getRecallStatusText(status) {
	return {
		'not-recalled': '未召回',
		'partial-recall': '部分召回',
		'full-recall': '全量召回',
		unknown: null
	}[status] || null
}

// ===== Props & Emits =====
const props = defineProps({
	alert: { type: Object, required: true },
	category: { type: String, default: 'enforcement' },
	batchMode: { type: Boolean, default: false }
})
const emit = defineEmits(['click', 'ignore', 'ignoreMany', 'createTask'])

// Expose for parent component control
defineExpose({ selectedAlerts, toggleSelect, batchIgnore })
const pressed = ref(false)

// ===== Countdown timer for critical alerts =====
const countdownPercent = ref(100)
function startCountdown() {
	const endTime = Date.now() + 30 * 60 * 1000 // 30 min
	const interval = setInterval(() => {
		const remaining = endTime - Date.now()
		if (remaining <= 0) {
			countdownPercent.value = 0
			clearInterval(interval)
		} else {
			countdownPercent.value = Math.max(0, Math.round((remaining / (30 * 60 * 1000)) * 100))
		}
	}, 1000)
}
onMounted(() => {
	if (props.alert.level === 'critical') {
		startCountdown()
	}
})

// ===== Batch selection for alerts =====
const selectedAlerts = ref([])

function toggleSelect(alertId) {
	const idx = selectedAlerts.value.indexOf(alertId)
	if (idx >= 0) {
		selectedAlerts.value.splice(idx, 1)
	} else {
		selectedAlerts.value.push(alertId)
	}
}

function batchIgnore() {
	if (selectedAlerts.value.length === 0) return
	uni.showModal({
		title: '批量忽略',
		content: `确认忽略选中的 ${selectedAlerts.value.length} 条预警？`,
		confirmText: '确认忽略',
		confirmColor: '#10b981',
		success: (res) => {
			if (res.confirm) {
				selectedAlerts.value.forEach(id => {
					emit('ignore', { id })
				})
				selectedAlerts.value = []
			}
		}
	})
}

// ===== 辅助函数 =====
function formatExceed(v) {
	if (v === null || v === undefined || v === '' || v === '--') return '--'
	return String(v).replace(/x$/i, '') + 'x'
}

function formatPopulation(pop) {
	if (!pop) return '--'
	if (pop >= 10000) return (pop / 10000).toFixed(1) + '万'
	if (pop >= 1000) return (pop / 1000).toFixed(1) + '千'
	return String(pop)
}

// ===== Computed: alertView =====
const alertView = computed(() => {
	const a = props.alert || {}
	const rawLevel = String(a.riskLevel || a.risk_level || a.level || 'unknown').toLowerCase()
	return {
		...a,
		riskScore: a.riskScore ?? a.risk_score ?? 0,
		displayRiskLevel: LEVEL_CN[rawLevel] || (a.riskLevel || a.level || '—'),
		exceedDisplay: formatExceed(a.exceedRatio ?? a.exceed_ratio)
	}
})

// ===== Computed: header =====
const meta = computed(() => CATEGORY_META[props.category] || CATEGORY_META.enforcement)

const headerId = computed(() => {
	const a = props.alert
	return a.caseNumber || a.caseNo || a.alert_code || a.alertId || String(a.id || '—')
})

const categoryIcon = computed(() => meta.value.icon)
const headerSubtitle = computed(() => meta.value.subtitleFn(props.alert))
const headerBadge = computed(() => meta.value.badgeFn(props.alert))

// ===== Computed: 指标行1 =====
const m1Label = computed(() => meta.value.m1.label)
const m1Value = computed(() => meta.value.m1.get(props.alert))
const m1ValueClass = computed(() => {
	if (!m1Value.value || m1Value.value === '--') return 'val-empty'
	const v = m1Value.value
	if (v.includes('穿山甲') || v.includes('食蟹猴') || v.includes('野生动物')) return 'val-species'
	return ''
})

const m2Label = computed(() => meta.value.m2.label)
const m2Value = computed(() => meta.value.m2.get(props.alert))

// ===== Computed: 指标行2 =====
const m3Label = computed(() => meta.value.m3.label)
const m3Value = computed(() => meta.value.m3.get(props.alert))
const m4Label = computed(() => meta.value.m4.label)
const m4Value = computed(() => meta.value.m4.get(props.alert))
const hasRow2 = computed(() => !!(m3Value.value || m4Value.value))

// ===== Computed: 位置 =====
const locationText = computed(() => {
	const t = meta.value.locationField(props.alert)
	return t || '—'
})

// ===== Computed: 法律依据 =====
const legalLawText = computed(() => {
	const a = props.alert
	return a.legalBasis?.law || a.legalBasis || a.legal_basis || ''
})
const legalPenaltyText = computed(() => {
	const a = props.alert
	return a.penaltyRecommendation || a.penaltySuggestion || a.penalty_suggestion || ''
})
const hasLegalDetail = computed(() => {
	const law = String(legalLawText.value || '').trim()
	const pen = String(legalPenaltyText.value || '').trim()
	return !!(law && !['相关法律法规'].includes(law)) || !!(pen && !['根据违规程度处罚'].includes(pen))
})

// ===== Computed: 风险评分环 =====
const riskScoreClass = computed(() => {
	const score = alertView.value.riskScore || 0
	if (score >= 80) return 'risk-critical'
	if (score >= 60) return 'risk-high'
	if (score >= 40) return 'risk-medium'
	return 'risk-low'
})

// ===== Computed: 预警趋势指示 =====
const alertTrend = computed(() => {
	const score = alertView.value.riskScore || 0
	if (score >= 85) return 'new'      // 新增
	if (score >= 70) return 'persistent' // 持续
	return 'decreasing'                   // 减退
})
const trendIcon = computed(() => ({
	new: '⬆',
	persistent: '➡',
	decreasing: '⬇'
}[alertTrend.value] || '➡'))

// ===== Computed: 卡片样式 =====
const cardClass = computed(() => ([
	'cat-' + props.category,
	'level-' + props.alert.level,
	{ 'is-critical-pulse': !props.alert.handled && props.alert.level === 'critical', pressed: pressed.value }
]))

// ===== 时间格式化 =====
function formatTime(ts) {
	if (!ts) return '未知时间'
	const diff = Date.now() - new Date(ts).getTime()
	if (diff < 60000) return '刚刚'
	if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
	if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
	return new Date(ts).toLocaleDateString('zh-CN')
}

// ===== 触控反馈 =====
function onTouchStart() { pressed.value = true }
function onTouchEnd() { pressed.value = false }
function onLongPress() {
	uni.vibrateShort()
	uni.showActionSheet({
		itemList: ['忽略预警', '创建任务', '查看详情', '复制编号'],
		success: (res) => {
			if (res.tapIndex === 0) emit('ignore')
			else if (res.tapIndex === 1) emit('createTask')
			else if (res.tapIndex === 2) emit('click')
			else if (res.tapIndex === 3) {
				uni.setClipboardData({ data: headerId.value, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
			}
		}
	})
}
</script>

<style lang="scss" scoped>
.alert-card {
	margin: 8rpx 16rpx;
	border-radius: 14rpx;
	background: rgba(26, 31, 46, 0.8);
	border: 1px solid var(--line-soft);
	overflow: hidden;
	transition: all 0.3s ease;
	
	&:active {
		transform: scale(0.98);
		background: rgba(12, 27, 42, 0.90);
	}
	
	&.is-critical-pulse {
		animation: criticalPulse 2s ease-in-out infinite;
	}
}

@keyframes criticalPulse {
	0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7); }
	50% { box-shadow: 0 0 0 8rpx rgba(255, 77, 79, 0); }
}

.card-top-bar {
	height: 4rpx;
	background: #666;
	
	&.bar-critical { background: linear-gradient(90deg, #FF4D4F 0%, #FF7875 100%); }
	&.bar-high { background: linear-gradient(90deg, #FFA940 0%, #FFB85C 100%); }
	&.bar-medium { background: linear-gradient(90deg, #FAAD14 0%, #FFC53D 100%); }
	&.bar-low { background: linear-gradient(90deg, #52C41A 0%, #85CE61 100%); }
}

.countdown-bar-wrap {
	height: 4rpx;
	background: rgba(255, 77, 79, 0.15);
	width: 100%;
}
.countdown-bar {
	height: 4rpx;
	background: linear-gradient(90deg, #FF4D4F, #FF7875);
	transition: width 1s linear;
}

.card-inner {
	padding: 16rpx 20rpx;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16rpx;
}

.header-left {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.case-number {
	font-size: 20rpx;
	color: rgba(0, 212, 255, 0.8);
	font-family: 'Courier New', monospace;
	font-weight: 600;
}

.batch-checkbox {
	margin-right: 8rpx;
}
.checkbox-icon { font-size: 28rpx; }

.header-subtitle {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 5rpx 10rpx;
	background: rgba(0, 212, 255, 0.08);
	border-radius: 8rpx;
	width: fit-content;
}

.subtitle-icon { font-size: 22rpx; }
.subtitle-text { font-size: 20rpx; color: rgba(255,255,255,0.72); white-space: nowrap; max-width: 280rpx; overflow: hidden; text-overflow: ellipsis; }

/* 分类徽章 */
.type-badge {
	padding: 4rpx 10rpx;
	border-radius: 8rpx;
	font-size: 18rpx;
	font-weight: 700;
}
.badge-species { background: rgba(255,165,0,0.18); color: #FFA940; border: 1px solid rgba(255,165,0,0.35); }
.badge-cites { background: rgba(255, 77, 79, 0.18); color: #FF4D4F; border: 1px solid rgba(255, 77, 79, 0.35); }
.badge-critical { background: rgba(255,77,79,0.18); color: #FF4D4F; border: 1px solid rgba(255,77,79,0.35); }
.badge-high { background: rgba(255,165,0,0.18); color: #FFA940; border: 1px solid rgba(255,165,0,0.35); }
.badge-warning { background: rgba(250,173,20,0.18); color: #FAAD14; border: 1px solid rgba(250,173,20,0.35); }
.badge-medium { background: rgba(250,173,20,0.14); color: #FAAD14; border: 1px solid rgba(250,173,20,0.28); }
.badge-low { background: rgba(82,196,26,0.14); color: #52C41A; border: 1px solid rgba(82,196,26,0.28); }
.badge-handled { background: rgba(140,140,140,0.14); color: #8c8c8c; border: 1px solid rgba(140,140,140,0.28); }
.type-badge-text { font-size: 18rpx; font-weight: 700; white-space: nowrap; }

/* 召回状态 */
.badge-recall { background: rgba(255,77,79,0.22); color: #FF4D4F; border: 1px solid rgba(255,77,79,0.4); }
.badge-recall-partial-recall { background: rgba(250,173,20,0.18); color: #FAAD14; border: 1px solid rgba(250,173,20,0.35); }
.badge-recall-full-recall { background: rgba(255,77,79,0.22); color: #FF4D4F; border: 1px solid rgba(255,77,79,0.4); }
.badge-recall-not-recalled { background: rgba(140,140,140,0.14); color: #8c8c8c; border: 1px solid rgba(140,140,140,0.28); }

.header-right {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.risk-score-ring {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	box-shadow: 0 0 16rpx rgba(0, 0, 0, 0.3);
	
	&.risk-critical {
		background: linear-gradient(135deg, rgba(255, 77, 79, 0.3) 0%, rgba(255, 77, 79, 0.1) 100%);
		border: 2px solid rgba(255, 77, 79, 0.6);
		box-shadow: 0 0 20rpx rgba(255, 77, 79, 0.4);
	}
	
	&.risk-high {
		background: linear-gradient(135deg, rgba(255, 165, 0, 0.3) 0%, rgba(255, 165, 0, 0.1) 100%);
		border: 2px solid rgba(255, 165, 0, 0.6);
		box-shadow: 0 0 20rpx rgba(255, 165, 0, 0.3);
	}
	
	&.risk-medium {
		background: linear-gradient(135deg, rgba(250, 173, 20, 0.3) 0%, rgba(250, 173, 20, 0.1) 100%);
		border: 2px solid rgba(250, 173, 20, 0.6);
		box-shadow: 0 0 20rpx rgba(250, 173, 20, 0.3);
	}
	
	&.risk-low {
		background: linear-gradient(135deg, rgba(82, 196, 26, 0.3) 0%, rgba(82, 196, 26, 0.1) 100%);
		border: 2px solid rgba(82, 196, 26, 0.6);
		box-shadow: 0 0 20rpx rgba(82, 196, 26, 0.3);
	}
}

.risk-score-num {
	font-size: 28rpx;
	color: #fff;
	line-height: 1;
}

.risk-score-label {
	font-size: 16rpx;
	color: rgba(255, 255, 255, 0.6);
	margin-top: 4rpx;
}

.trend-indicator {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 22rpx;
}
.trend-new .trend-arrow { color: #FF4D4F; }
.trend-persistent .trend-arrow { color: #FAAD14; }
.trend-decreasing .trend-arrow { color: #52C41A; }

.metrics-row {
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 12rpx 10rpx;
	background: rgba(0, 212, 255, 0.05);
	border-radius: 12rpx;
	border: 1px solid rgba(0, 212, 255, 0.1);
}

.metrics-row-sub {
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid rgba(255, 255, 255, 0.08);
}

.metric-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
	flex: 1;
}

.metric-label {
	font-size: 16rpx;
	color: rgba(255, 255, 255, 0.5);
}

.metric-value {
	font-size: 22rpx;
	color: #fff;
	font-weight: 600;
	font-family: 'Courier New', monospace;
	
	&.level-critical { color: #FF4D4F; }
	&.level-high { color: #FFA940; }
	&.level-medium { color: #FAAD14; }
	&.level-low { color: #52C41A; }
	&.level-handled { color: #8c8c8c; }
}

.val-empty { color: rgba(255,255,255,0.3) !important; }
.val-species { color: #FFA940 !important; }

.metric-divider {
	width: 1px;
	height: 40rpx;
	background: rgba(255, 255, 255, 0.1);
}

.location-time-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 16rpx;
	color: rgba(255, 255, 255, 0.55);
	padding: 4rpx 0;
}

.location-text, .time-text {
	flex: 1;
}

.legal-section {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	padding: 12rpx 14rpx;
	background: rgba(255, 165, 0, 0.05);
	border-radius: 12rpx;
	border-left: 3px solid rgba(255, 165, 0, 0.5);
}

.legal-item, .penalty-item {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.legal-label, .penalty-label {
	font-size: 18rpx;
	color: rgba(255, 165, 0, 0.8);
	font-weight: 600;
}

.legal-content, .penalty-content {
	font-size: 16rpx;
	color: rgba(255, 255, 255, 0.7);
	line-height: 1.35;
}

.legal-hint {
	padding: 10rpx 14rpx;
	border-radius: 10rpx;
	background: rgba(255, 255, 255, 0.04);
	border: 1px dashed rgba(0, 212, 255, 0.22);
}

.legal-hint-text {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.42);
}

.card-actions {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8rpx;
	margin-top: 4rpx;
}

.action-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	min-height: 72rpx;
	border-radius: 12rpx;
	font-size: 24rpx;
	font-weight: 700;
	letter-spacing: 1rpx;
	transition: all 0.2s ease;

	&:active {
		transform: scale(0.95);
		opacity: 0.82;
	}
}

.act-btn-ghost {
	background: rgba(12, 27, 42, 0.86);
	border: 1px solid rgba(0, 212, 255, 0.28);
	color: #DDEAFF;
}

.act-btn-danger {
	background: linear-gradient(135deg, rgba(255, 77, 79, 0.18) 0%, rgba(255, 77, 79, 0.12) 100%);
	border: 1px solid rgba(255, 77, 79, 0.6);
	color: #ffd7d8;
}

.act-btn-danger.pulse-danger {
	animation: dangerPulse 2s ease-in-out infinite;
}

@keyframes dangerPulse {
	0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7); }
	50%       { box-shadow: 0 0 0 10rpx rgba(255, 77, 79, 0); }
}

.act-icon { font-size: 26rpx; flex-shrink: 0; }
.act-text { font-size: inherit; font-weight: inherit; white-space: nowrap; }

.act-btn-wrap {
	flex: 1;
	min-width: 0;
}

.act-btn {
	flex: 1;
	padding: 14rpx 16rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&.ignore {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(0, 212, 255, 0.16);

		&:active {
			background: rgba(255, 255, 255, 0.15);
		}
	}

	&.task {
		background: linear-gradient(135deg, #00d4ff 0%, #0080b3 100%);
		box-shadow: 0 4rpx 12rpx rgba(0, 212, 255, 0.3);

		&:active {
			transform: scale(0.98);
		}
	}
}

.act-text {
	font-size: 20rpx;
	font-weight: 600;
	color: #fff;
}

.handled-row {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 12rpx;
	background: rgba(82, 196, 26, 0.1);
	border-radius: 12rpx;
	border: 1px solid rgba(82, 196, 26, 0.3);
}

.handled-text {
	font-size: 20rpx;
	color: #52C41A;
	font-weight: 600;
}

@media (min-width: 768px) {
	.alert-card {
		margin: 12rpx 0;
	}

	.case-number {
		font-size: 22rpx;
	}

	.risk-score-ring {
		width: 76rpx;
		height: 76rpx;
	}
}

@media (max-width: 375px) {
	.alert-card {
		margin: 10rpx 12rpx;
	}

	.card-inner {
		padding: 16rpx;
		gap: 12rpx;
	}

	.location-time-row {
		flex-direction: column;
		align-items: flex-start;
		gap: 6rpx;
	}
}
</style>
