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

			<!-- 环境背景提示（AI辅助数据：夜间/高湿/恶劣天气等触发条件） -->
			<view v-if="envContextHint" class="env-context-hint">
				<text class="env-context-icon">{{ envContextIcon }}</text>
				<text class="env-context-text">{{ envContextHint }}</text>
				<view v-if="envConfidenceBoost > 0" class="env-boost-badge">
					<text>AI修正 +{{ envConfidenceBoost }}%</text>
				</view>
			</view>

			<!-- 位置/来源 + 时间 -->
			<view class="location-time-row">
				<text class="location-text">📍 {{ locationText }}</text>
				<text class="time-text">🕐 {{ formatTime(alert.timestamp || alert.time || alert.created_at || alert.create_time) }}</text>
			</view>

			<view v-if="displayFeatureTags.length" class="feature-tag-row">
				<text v-for="tag in displayFeatureTags" :key="tag" class="feature-tag-chip">{{ tag }}</text>
			</view>

			<view class="ai-brief-card">
				<view class="ai-brief-head">
					<text class="ai-brief-kicker">热眼擒枭 · AI判定</text>
					<text class="ai-brief-score">{{ alertView.riskScore }}分</text>
				</view>
				<text class="ai-brief-text">{{ aiBriefText }}</text>
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

			<!-- 响应等级与行动指引（新增） -->
			<view v-if="!alert.handled && alert.status !== 'resolved'" class="response-guidance">
				<view class="guidance-badge" :class="'guide-' + responseLevel.key">
					<text class="guide-icon">{{ responseLevel.icon }}</text>
					<text class="guide-label">{{ responseLevel.label }}</text>
				</view>
				<text class="guidance-text">{{ recommendedActionText }}</text>
				<view class="time-window">
					<text class="window-label">响应时限</text>
					<text class="window-value">{{ responseLevel.timeoutLabel }}</text>
				</view>
			</view>

			<!-- 操作按钮（四按钮：转派警 / 转核查 / 忽略 / 归档） -->
			<view v-if="!alert.handled && alert.status !== 'resolved'" class="card-actions">
				<view class="action-btn act-btn-red" :class="{ 'pulse-danger': alert.level === 'critical' }" @tap="emit('createTask')">
					<text class="act-icon">🚨</text>
					<text class="act-text">转派警</text>
				</view>
				<view class="action-btn act-btn-orange" @tap="emit('investigate')">
					<text class="act-icon">🔍</text>
					<text class="act-text">转核查</text>
				</view>
				<view class="action-btn act-btn-ghost" @tap="emit('ignore')">
					<text class="act-icon">🛑</text>
					<text class="act-text">忽略</text>
				</view>
				<view class="action-btn act-btn-gray" @tap="emit('archive')">
					<text class="act-icon">📁</text>
					<text class="act-text">归档</text>
				</view>
			</view>
			<view v-else class="handled-row">
				<text class="handled-text">✓ 已归档处理</text>
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
	wildlife: {
		icon: '🦎',
		subtitleFn: (a) => a.title || a.alert_type || '活物走私智能预警',
		badgeFn: (a) => a.protectionLevel || a.protection_level || a.risk_level || null,
		badgeClass: (a) => 'badge-risk badge-risk-' + (a.risk_level || 'unknown'),
		m1: { label: '涉案物种',   get: (a) => a.speciesType || a.species_name || a.species || '--' },
		m2: { label: '疑似数量',   get: (a) => a.animal_count ? String(a.animal_count) + '只' : a.species_count ? String(a.species_count) + '只' : null },
		m3: { label: '触发依据',   get: (a) => a.source || a.sourceChannel || null },
		m4: { label: '边境分段',   get: (a) => a.borderSection || a.border_section || null },
		locationField: (a) => a.border_section || a.location || ''
	},
	border: {
		icon: '🚧',
		subtitleFn: (a) => a.title || '边境潜行异常预警',
		badgeFn: (a) => (a.featureTags && a.featureTags[0]) || '潜行风险',
		m1: { label: '智能判定',   get: (a) => a.targetType || '疑似越境目标' },
		m2: { label: '触发源',     get: (a) => a.source || null },
		m3: { label: 'AI依据',     get: (a) => a.aiReason || null },
		m4: { label: '处置建议',   get: (a) => a.recommendAction || null },
		locationField: (a) => a.border_section || a.location || ''
	},
	vehicle: {
		icon: '🚚',
		subtitleFn: (a) => a.title || '运载工具异常预警',
		badgeFn: (a) => (a.featureTags && a.featureTags[0]) || '布控风险',
		m1: { label: '目标类型',   get: (a) => a.targetType || '可疑运载工具' },
		m2: { label: '触发源',     get: (a) => a.source || null },
		m3: { label: 'AI依据',     get: (a) => a.aiReason || null },
		m4: { label: '处置建议',   get: (a) => a.recommendAction || null },
		locationField: (a) => a.border_section || a.location || ''
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

// ===== Props & Emits =====
const props = defineProps({
	alert: { type: Object, required: true },
	category: { type: String, default: 'enforcement' },
	batchMode: { type: Boolean, default: false }
})
const emit = defineEmits(['click', 'ignore', 'ignoreMany', 'createTask', 'investigate', 'archive'])

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

// ===== Computed: 环境背景提示（AI辅助识别数据）=====
// 根据预警的环境上下文，告知触发原因，增强情报说服力
const envContextHint = computed(() => {
	const a = props.alert
	const hints = []

	// 夜间触发
	if (a.env_illuminance !== undefined && a.env_illuminance < 10) {
		hints.push('夜间触发')
	} else if (a.env_illuminance !== undefined && a.env_illuminance < 100) {
		hints.push('黄昏触发')
	}

	// 高湿环境
	if (a.env_humidity !== undefined && a.env_humidity >= 85) {
		hints.push('高湿' + a.env_humidity + '%')
	}

	// 恶劣天气
	if (a.weather_severity === 'severe') {
		hints.push('恶劣天气')
	} else if (a.weather_severity === 'warning') {
		hints.push('风雨天气')
	}

	// 红外温漂修正（经补偿后活体判定）
	if (a.infrared_corrected !== undefined && a.infrared_corrected !== null) {
		hints.push('红外修正' + a.infrared_corrected + '°C')
	}

	// 风速过高
	if (a.env_wind_speed !== undefined && a.env_wind_speed >= 10.7) {
		hints.push('强风' + a.env_wind_speed + 'm/s')
	}

	return hints.length > 0 ? hints.join(' · ') : null
})

const envContextIcon = computed(() => {
	const a = props.alert
	if (a.weather_severity === 'severe') return '🌪️'
	if (a.weather_severity === 'warning') return '🌧️'
	if (a.env_illuminance !== undefined && a.env_illuminance < 10) return '🌙'
	if (a.env_illuminance !== undefined && a.env_illuminance < 100) return '🌆'
	if (a.env_humidity !== undefined && a.env_humidity >= 85) return '💧'
	return '🤖'
})

// AI修正置信度提升值（用于展示环境参数修正效果）
const envConfidenceBoost = computed(() => {
	const a = props.alert
	let boost = 0
	if (a.weather_severity === 'severe') boost += 15
	else if (a.weather_severity === 'warning') boost += 8
	if (a.env_illuminance !== undefined && a.env_illuminance < 10) boost += 8
	if (a.env_humidity !== undefined && a.env_humidity >= 85) boost += 6
	return boost
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

// ===== Computed: 响应等级与行动指引（新增） =====
import { BUSINESS_CONSTANTS } from '../../../utils/systemConfig.js'

const RESPONSE_ACTIONS = {
  WILDLIFE_SMUGGLING: {
    IMMEDIATE: { icon: '🚨', text: '立即布控卡口并拦截疑似活体转运目标' },
    URGENT: { icon: '⚡', text: '联动巡防力量开展现场核验与轨迹追踪' },
    PRIORITY: { icon: '📋', text: '调取近时段卡口与热视频，研判转运链路' },
    ROUTINE: { icon: '👁', text: '纳入重点线索池，持续关注异常动态' },
  },
  ENVIRONMENT_POLLUTION: {
    IMMEDIATE: { icon: '🛑', text: '立即叫停排放，采样留证' },
    URGENT: { icon: '📋', text: '通知环保部门联合执法' },
    PRIORITY: { icon: '🔬', text: '安排现场采样调查' },
    ROUTINE: { icon: '📊', text: '纳入例行监测' },
  },
  FOOD_SAFETY: {
    IMMEDIATE: { icon: '🚨', text: '立即封存问题食品，通知食药监' },
    URGENT: { icon: '🔍', text: '扩大抽检范围，控制源头' },
    PRIORITY: { icon: '📋', text: '启动食品安全调查' },
    ROUTINE: { icon: '📝', text: '纳入常规抽检计划' },
  },
}

const responseLevel = computed(() => {
  const score = alertView.value.riskScore || 0
  if (score >= 85) return { ...BUSINESS_CONSTANTS.RESPONSE_LEVELS.IMMEDIATE, key: 'IMMEDIATE' }
  if (score >= 70) return { ...BUSINESS_CONSTANTS.RESPONSE_LEVELS.URGENT, key: 'URGENT' }
  if (score >= 50) return { ...BUSINESS_CONSTANTS.RESPONSE_LEVELS.PRIORITY, key: 'PRIORITY' }
  return { ...BUSINESS_CONSTANTS.RESPONSE_LEVELS.ROUTINE, key: 'ROUTINE' }
})

const recommendedActionText = computed(() => {
  if (props.category === 'border' || props.category === 'vehicle') {
    return props.alert?.recommendAction || RESPONSE_ACTIONS.WILDLIFE_SMUGGLING[responseLevel.value.key]?.text || '按常规流程处理'
  }
  return RESPONSE_ACTIONS.WILDLIFE_SMUGGLING[responseLevel.value.key]?.text || '按常规流程处理'
})

const displayFeatureTags = computed(() => {
	const tags = props.alert?.featureTags
	if (Array.isArray(tags) && tags.length) return tags.slice(0, 4)
	if (props.category === 'wildlife') {
		return [
			alertView.value.speciesType !== '未知物种' ? alertView.value.speciesType : null,
			props.alert?.protectionLevel || props.alert?.protection_level || null,
			props.alert?.source || null,
			alertView.value.borderSection !== '未标注' ? alertView.value.borderSection : null
		].filter(Boolean).slice(0, 4)
	}
	return []
})

const aiBriefText = computed(() => {
	if (props.alert?.aiReason) return props.alert.aiReason
	if (props.category === 'wildlife') {
		return `系统结合${props.alert?.source || '多源感知'}识别到「${alertView.value.speciesType}」相关异常活动，建议按${responseLevel.value.label}流程开展处置。`
	}
	return recommendedActionText.value
})

// ===== 30分钟内新增紧急预警 =====
const isUrgentNew = computed(() => {
	const a = props.alert
	if (!a || a.handled || a.status === 'resolved') return false
	if (a.level !== 'critical') return false
	const ts = new Date(a.timestamp || a.time || a.created_at || 0).getTime()
	const diff = Date.now() - ts
	return diff <= 30 * 60 * 1000  // 30 分钟内
})

// ===== Computed: 卡片样式 =====
const cardClass = computed(() => ([
	'cat-' + props.category,
	'level-' + props.alert.level,
	{ 'is-critical-pulse': !props.alert.handled && props.alert.level === 'critical', pressed: pressed.value },
	{ 'is-urgent-new': isUrgentNew.value }
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
		itemList: ['🚨 转派警', '🔍 转核查', '🛑 忽略', '📁 归档', '📋 查看详情', '📄 复制编号'],
		success: (res) => {
			if (res.tapIndex === 0) emit('createTask')
			else if (res.tapIndex === 1) emit('investigate')
			else if (res.tapIndex === 2) emit('ignore')
			else if (res.tapIndex === 3) emit('archive')
			else if (res.tapIndex === 4) emit('click')
			else if (res.tapIndex === 5) {
				uni.setClipboardData({ data: headerId.value, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
			}
		}
	})
}
</script>

<style lang="scss" scoped>
/* ====== 卡片脉冲呼吸动画（借鉴参考项目）====== */
.feature-tag-row { display:flex; flex-wrap:wrap; gap:10rpx; margin-top:16rpx; }
.feature-tag-chip { padding:8rpx 14rpx; border-radius:999rpx; background:rgba(64,196,255,0.1); border:1px solid rgba(64,196,255,0.16); color:#7fe7ff; font-size:20rpx; font-weight:700; }
.ai-brief-card { margin-top:16rpx; padding:18rpx; border-radius:18rpx; background:linear-gradient(180deg, rgba(10,24,38,0.94), rgba(8,16,28,0.94)); border:1px solid rgba(255,255,255,0.06); }
.ai-brief-head { display:flex; align-items:center; justify-content:space-between; gap:12rpx; margin-bottom:10rpx; }
.ai-brief-kicker { font-size:20rpx; font-weight:700; color:rgba(195,230,255,0.72); }
.ai-brief-score { font-size:20rpx; font-weight:800; color:#ffb454; }
.ai-brief-text { font-size:22rpx; line-height:1.6; color:#eef7ff; }
.alert-card {
	margin: 8rpx 16rpx;
	border-radius: 20rpx;
	background: rgba(20, 25, 40, 0.95);
	border: 1px solid rgba(255,255,255,0.06);
	overflow: hidden;
	transition: all 0.3s ease;
	/* 按等级差异化边框 + 阴影 */
	&.level-critical {
		border-color: rgba(255, 77, 79, 0.45);
		box-shadow: 0 4rpx 24rpx rgba(255, 77, 79, 0.28), inset 0 0 0 1px rgba(255, 77, 79, 0.12);
	}
	&.level-high {
		border-color: rgba(255, 77, 79, 0.35);
		box-shadow: 0 4rpx 20rpx rgba(255, 77, 79, 0.2);
	}
	&.level-warning {
		border-color: rgba(255, 169, 64, 0.35);
		box-shadow: 0 4rpx 20rpx rgba(255, 169, 64, 0.18);
	}
	&.level-medium {
		border-color: rgba(250, 173, 20, 0.28);
		box-shadow: 0 4rpx 16rpx rgba(250, 173, 20, 0.12);
	}
	&.level-low {
		border-color: rgba(115, 209, 61, 0.22);
		box-shadow: 0 4rpx 16rpx rgba(115, 209, 61, 0.08);
	}
	&.level-handled {
		opacity: 0.5;
		border-color: rgba(255, 255, 255, 0.04);
	}
	&:active {
		transform: scale(0.98);
		background: rgba(12, 27, 42, 0.90);
	}
	&.is-critical-pulse {
		animation: criticalPulse 2s ease-in-out infinite;
	}
	&.is-urgent-new {
		animation: urgentNewPulse 1.8s ease-in-out infinite;
		border-color: rgba(255, 77, 79, 0.5) !important;
		box-shadow: 0 4rpx 30rpx rgba(255, 77, 79, 0.35);
	}
}

/* 参考项目同款脉冲动画 */
@keyframes criticalPulse {
	0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7); }
	50%       { box-shadow: 0 0 0 10rpx rgba(255, 77, 79, 0); }
}

@keyframes urgentNewPulse {
	0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.8); background: rgba(255, 77, 79, 0.1); }
	50%       { box-shadow: 0 0 0 16rpx rgba(255, 77, 79, 0); background: rgba(255, 77, 79, 0.04); }
}

/* ====== 顶部动态渐变光条（借鉴参考项目滚动渐变）====== */
.card-top-bar {
	height: 4rpx;
	background: #2a2f3e;
	transition: background 0.3s ease;

	&.bar-critical {
		background: linear-gradient(90deg, #FF4D4F, #ff7875, #FF4D4F, #ff1238, #FF4D4F);
		background-size: 300% 100%;
		animation: barFlowCritical 2s linear infinite;
	}
	&.bar-high {
		background: linear-gradient(90deg, #FF4D4F, #ffa8a8, #FF4D4F, #FF7875, #FF4D4F);
		background-size: 300% 100%;
		animation: barFlowCritical 3s linear infinite;
	}
	&.bar-medium {
		background: linear-gradient(90deg, #FAAD14, #ffc53d, #FAAD14);
		background-size: 200% 100%;
		animation: barFlow 4s linear infinite;
	}
	&.bar-warning {
		background: linear-gradient(90deg, #FAAD14, #ffc53d, #FAAD14);
		background-size: 200% 100%;
		animation: barFlow 4s linear infinite;
	}
	&.bar-low {
		background: linear-gradient(90deg, #52C41A, #85ce61, #52C41A);
		background-size: 200% 100%;
		animation: barFlow 5s linear infinite;
	}
	&.bar-unknown { background: rgba(255, 255, 255, 0.1); }
}

@keyframes barFlow {
	0%   { background-position: 0% 0%; }
	100% { background-position: 200% 0%; }
}
@keyframes barFlowCritical {
	0%   { background-position: 0% 0%; }
	100% { background-position: 300% 0%; }
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
	width: 76rpx;
	height: 76rpx;
	border-radius: 50%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	transition: all 0.3s ease;

	&.risk-critical {
		background: linear-gradient(135deg, rgba(255, 77, 79, 0.35) 0%, rgba(255, 77, 79, 0.1) 100%);
		border: 2px solid #FF4D4F;
		box-shadow: 0 0 24rpx rgba(255, 77, 79, 0.55), 0 0 48rpx rgba(255, 77, 79, 0.2);
		animation: ringPulseCritical 2s ease-in-out infinite;
	}

	&.risk-high {
		background: linear-gradient(135deg, rgba(255, 77, 79, 0.3) 0%, rgba(255, 77, 79, 0.1) 100%);
		border: 2px solid rgba(255, 77, 79, 0.7);
		box-shadow: 0 0 20rpx rgba(255, 77, 79, 0.4);
	}

	&.risk-medium {
		background: linear-gradient(135deg, rgba(250, 173, 20, 0.3) 0%, rgba(250, 173, 20, 0.1) 100%);
		border: 2px solid rgba(250, 173, 20, 0.65);
		box-shadow: 0 0 18rpx rgba(250, 173, 20, 0.35);
	}

	&.risk-low {
		background: linear-gradient(135deg, rgba(82, 196, 26, 0.28) 0%, rgba(82, 196, 26, 0.08) 100%);
		border: 2px solid rgba(82, 196, 26, 0.55);
		box-shadow: 0 0 16rpx rgba(82, 196, 26, 0.28);
	}
}

@keyframes ringPulseCritical {
	0%, 100% { box-shadow: 0 0 24rpx rgba(255, 77, 79, 0.55), 0 0 48rpx rgba(255, 77, 79, 0.2); }
	50%       { box-shadow: 0 0 36rpx rgba(255, 77, 79, 0.75), 0 0 64rpx rgba(255, 77, 79, 0.35); }
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
	grid-template-columns: repeat(4, 1fr);
	gap: 6rpx;
	margin-top: 4rpx;
}

// 响应等级与行动指引
.response-guidance {
	display: flex;
	align-items: center;
	gap: 12rpx;
	background: rgba(255, 77, 79, 0.08);
	border: 1px solid rgba(255, 77, 79, 0.2);
	border-radius: 10rpx;
	padding: 12rpx 16rpx;
	margin-top: 8rpx;
	flex-wrap: wrap;

	.guidance-badge {
		display: flex;
		align-items: center;
		gap: 6rpx;
		padding: 4rpx 12rpx;
		border-radius: 6rpx;
		font-size: 20rpx;
		font-weight: 600;
		white-space: nowrap;
		min-width: 100rpx;
		justify-content: center;

		&.guide-IMMEDIATE {
			background: rgba(255, 77, 79, 0.2);
			color: #FF4D4F;
			border: 1px solid rgba(255, 77, 79, 0.4);
		}
		&.guide-URGENT {
			background: rgba(255, 122, 69, 0.2);
			color: #FF7A45;
			border: 1px solid rgba(255, 122, 69, 0.4);
		}
		&.guide-PRIORITY {
			background: rgba(255, 169, 64, 0.2);
			color: #FFA940;
			border: 1px solid rgba(255, 169, 64, 0.4);
		}
		&.guide-ROUTINE {
			background: rgba(82, 196, 26, 0.2);
			color: #52C41A;
			border: 1px solid rgba(82, 196, 26, 0.4);
		}

		.guide-icon { font-size: 22rpx; }
		.guide-label { font-size: 22rpx; }
	}

	.guidance-text {
		flex: 1;
		font-size: 22rpx;
		color: #FF9999;
		line-height: 1.4;
		min-width: 0;
	}

	.time-window {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		white-space: nowrap;
		.time-label { font-size: 18rpx; color: #4A6A8A; }
		.time-value { font-size: 20rpx; color: #7AA8CC; font-weight: 600; }
	}
}

.action-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 3rpx;
	min-height: 68rpx;
	border-radius: 10rpx;
	font-size: 20rpx;
	font-weight: 700;
	letter-spacing: 0.5rpx;
	transition: all 0.2s ease;

	&:active { transform: scale(0.95); opacity: 0.82; }
}

.act-btn-red {
	background: linear-gradient(135deg, rgba(255, 77, 79, 0.22) 0%, rgba(255, 77, 79, 0.14) 100%);
	border: 1px solid rgba(255, 77, 79, 0.55);
	color: #ffd7d7;
}
.act-btn-red.pulse-danger {
	animation: dangerPulse 1.8s ease-in-out infinite;
}

.act-btn-orange {
	background: rgba(255, 122, 69, 0.14);
	border: 1px solid rgba(255, 122, 69, 0.4);
	color: #ffd7c0;
}

.act-btn-ghost {
	background: rgba(12, 27, 42, 0.86);
	border: 1px solid rgba(0, 212, 255, 0.28);
	color: #DDEAFF;
}

.act-btn-gray {
	background: rgba(140, 140, 140, 0.1);
	border: 1px solid rgba(140, 140, 140, 0.25);
	color: #c0c0c0;
}

@keyframes dangerPulse {
	0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7); }
	50%       { box-shadow: 0 0 0 10rpx rgba(255, 77, 79, 0); }
}

.act-icon { font-size: 22rpx; flex-shrink: 0; }
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

/* 环境背景提示 */
.env-context-hint {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 14rpx;
	background: rgba(0, 212, 255, 0.06);
	border: 1px solid rgba(0, 212, 255, 0.18);
	border-radius: 10rpx;
	flex-wrap: wrap;
}
.env-context-icon { font-size: 20rpx; flex-shrink: 0; }
.env-context-text {
	font-size: 20rpx;
	color: rgba(0, 212, 255, 0.8);
	line-height: 1.4;
}
.env-boost-badge {
	margin-left: auto;
	padding: 2rpx 10rpx;
	background: rgba(0, 212, 255, 0.12);
	border: 1px solid rgba(0, 212, 255, 0.3);
	border-radius: 8rpx;
	font-size: 18rpx;
	color: #00D4FF;
	font-weight: 700;
	white-space: nowrap;
}
</style>
