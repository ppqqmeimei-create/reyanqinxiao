<template>
	<view class="alert-detail-modal" v-if="visible" @tap="handleClose">
		<view class="modal-content" @tap.stop>
			<view class="close-btn" @tap="handleClose"><text class="close-icon">✕</text></view>
			<view v-if="alert" class="detail-header" :class="'level-' + alert.level">
				<image class="header-icon" :src="getAlertIcon()" mode="aspectFit"></image>
				<view class="header-info">
					<text class="header-title">{{ alert.title }}</text>
					<text class="header-time">{{ formatFullTime(alert.time || alert.createdAt || alert.created_at) }}</text>
				</view>
				<view class="risk-badge" :class="riskBadgeClass"><text class="risk-text">{{ alertView.riskScore }}</text></view>
			</view>
			<scroll-view v-if="alert" class="detail-scroll" scroll-y enable-flex>
				<view class="warning-scene-hero">
					<view class="warning-scene-top">
						<text class="warning-scene-kicker">热眼擒枭 · 智能预警解读</text>
						<view class="warning-scene-score">风险热度 {{ alertView.riskScore }}</view>
					</view>
					<text class="warning-scene-title">{{ alert.title }}</text>
					<text class="warning-scene-desc">{{ alert.aiReason || '系统已结合红外热成像、视频识别、卡口记录与轨迹分析，对边境活物走私风险进行综合研判。' }}</text>
					<view v-if="detailFeatureTags.length" class="warning-scene-tags">
						<text v-for="tag in detailFeatureTags" :key="tag" class="warning-scene-tag">{{ tag }}</text>
					</view>
				</view>

				<view class="info-section command-section">
					<text class="section-title">🛰️ 指挥处置概览</text>
					<view class="command-grid">
						<view class="command-card">
							<text class="command-label">当前目标</text>
							<text class="command-value">{{ alertView.targetType }}</text>
						</view>
						<view class="command-card">
							<text class="command-label">重点片区</text>
							<text class="command-value">{{ alertView.borderSection }}</text>
						</view>
						<view class="command-card">
							<text class="command-label">处置等级</text>
							<text class="command-value">{{ alertView.riskLevel }}</text>
						</view>
						<view class="command-card">
							<text class="command-label">建议动作</text>
							<text class="command-value">{{ commandSuggestions[0] }}</text>
						</view>
					</view>
				</view>

				<view class="info-section timeline-section">
					<text class="section-title">🧭 处置流程时间轴</text>
					<view class="timeline-list">
						<view v-for="item in commandTimeline" :key="item.label" class="timeline-item" :class="{ done: item.done }">
							<view class="timeline-dot"></view>
							<view class="timeline-content">
								<text class="timeline-title">{{ item.label }}</text>
								<text class="timeline-desc">{{ item.desc }}</text>
							</view>
						</view>
					</view>
				</view>

				<view class="info-section suggestion-section">
					<text class="section-title">📌 联动建议</text>
					<view class="suggestion-list">
						<view v-for="(item, index) in commandSuggestions" :key="index" class="suggestion-item">
							<text class="suggestion-index">0{{ index + 1 }}</text>
							<text class="suggestion-text">{{ item }}</text>
						</view>
					</view>
				</view>

				<view class="info-section evidence-chain-section">
					<text class="section-title">🔗 证据链总览</text>
					<view class="evidence-chain-list">
						<view v-for="item in evidenceChain" :key="item.label" class="evidence-chain-item" :class="'status-' + item.status">
							<view class="evidence-chain-head">
								<text class="evidence-chain-label">{{ item.label }}</text>
								<text class="evidence-chain-value">{{ item.value }}</text>
							</view>
							<text class="evidence-chain-desc">{{ item.desc }}</text>
						</view>
					</view>
				</view>

				<view class="info-section map-link-section">
					<text class="section-title">🗺️ 地图联动感知</text>
					<view class="map-link-panel">
						<view class="map-link-grid">
							<view v-for="item in mapLinkedPoints" :key="item.label" class="map-link-card">
								<text class="map-link-label">{{ item.label }}</text>
								<text class="map-link-value">{{ item.value }}</text>
								<text class="map-link-meta">{{ item.meta }}</text>
							</view>
						</view>
						<view class="map-radar-box">
							<view class="map-radar-core"></view>
							<view class="map-radar-ring ring-1"></view>
							<view class="map-radar-ring ring-2"></view>
							<view class="map-radar-ring ring-3"></view>
							<view class="map-radar-point point-main"></view>
							<view class="map-radar-point point-assist point-a"></view>
							<view class="map-radar-point point-assist point-b"></view>
						</view>
						<view class="quick-link-actions">
							<view v-for="item in quickLinkActions" :key="item.key" class="quick-link-btn" @tap="handleQuickLink(item.key)">
								<text class="quick-link-icon">{{ item.icon }}</text>
								<view class="quick-link-copy">
									<text class="quick-link-label">{{ item.label }}</text>
									<text class="quick-link-hint">{{ item.hint }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<view class="info-section">
					<text class="section-title">🦎 核心线索（活物走私）</text>
					<view class="info-grid">
						<view class="info-item">
							<text class="info-label">疑似物种</text>
							<text class="info-value">{{ alertView.speciesType }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">目标类型</text>
							<text class="info-value">{{ alertView.targetType }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">风险评分</text>
							<text class="info-value">{{ alertView.riskScore }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">风险等级</text>
							<text class="info-value">{{ alertView.riskLevel }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">边境分段</text>
							<text class="info-value">{{ alertView.borderSection }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">来源渠道</text>
							<text class="info-value">{{ alertView.sourceChannel }}</text>
						</view>
					</view>
				</view>

				<view class="info-section">
					<text class="section-title">🌿 生态协同监测</text>
					<view class="info-grid">
						<view class="info-item">
							<text class="info-label">预警类型</text>
							<text class="info-value">{{ getEcologyTypeName(alert.type) }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">来源渠道</text>
							<text class="info-value">{{ alertView.sourceChannel }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">位置</text>
							<text class="info-value">{{ alert.location }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">边境分段</text>
							<text class="info-value">{{ alertView.borderSection }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">风险评分</text>
							<text class="info-value">{{ alertView.riskScore }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">风险等级</text>
							<text class="info-value">{{ alertView.riskLevel }}</text>
						</view>
					</view>
				</view>
				
				<view class="info-section">
					<text class="section-title">🧠 智能判定依据</text>
					<view class="legal-info warning-analysis-box">
						<view class="legal-item full-width">
							<text class="legal-label">AI识别结论</text>
							<text class="legal-value penalty-text">{{ alert.aiReason || '已完成多源感知交叉比对，存在边境活物走私风险。' }}</text>
						</view>
						<view class="legal-item">
							<text class="legal-label">目标特征</text>
							<text class="legal-value">{{ alertView.targetType }}</text>
						</view>
						<view class="legal-item">
							<text class="legal-label">系统建议</text>
							<text class="legal-value">{{ alert.recommendAction || '建议联动边境巡防力量开展核查。' }}</text>
						</view>
					</view>
				</view>

				<!-- 法律依据和处罚建议 -->
				<view class="info-section" v-if="!alert.handled">
					<text class="section-title">⚖️ 法律依据与处置建议</text>
					<view class="legal-info">
						<view class="legal-item">
							<text class="legal-label">案件编号</text>
							<text class="legal-value case-no">{{ displayCaseNo }}</text>
						</view>
						<view class="legal-item">
							<text class="legal-label">适用法律</text>
							<text class="legal-value">{{ alert.legalBasis }}</text>
						</view>
						<view class="legal-item full-width">
							<text class="legal-label">处罚建议</text>
							<text class="legal-value penalty-text">{{ alert.penaltySuggestion }}</text>
						</view>
					</view>
				</view>

				<view class="info-section" v-if="!alert.handled">
					<text class="section-title">🧠 相似案件（含相似度）</text>
					<view class="similar-summary-card">
						<text class="similar-summary-title">{{ similarCaseSummary.title }}</text>
						<text class="similar-summary-desc">{{ similarCaseSummary.desc }}</text>
						<view class="similar-summary-tags">
							<text v-for="tag in similarCaseSummary.tags" :key="tag" class="similar-summary-tag">{{ tag }}</text>
						</view>
					</view>
					<view v-if="loadingSimilar" class="inspector-loading">相似案件匹配中...</view>
					<view v-else-if="similarCases.length === 0" class="inspector-loading">暂无相似案件</view>
					<view v-else class="similar-list">
						<view class="similar-weight-bar" v-if="similarityWeights">
							<text class="weight-item">类型 {{ similarityWeights.type }}</text>
							<text class="weight-item">等级 {{ similarityWeights.level }}</text>
							<text class="weight-item">类别 {{ similarityWeights.category }}</text>
							<text class="weight-item">位置 {{ similarityWeights.location }}</text>
							<text class="weight-item">风险 {{ similarityWeights.risk }}</text>
						</view>
						<view class="similar-item" v-for="item in similarCases" :key="item.id">
							<view class="similar-progress">
								<view class="similar-progress-bar" :style="{ width: (item.similarityScore || 0) + '%' }"></view>
							</view>
							<text class="similar-title">{{ item.title }}</text>
							<view class="similar-meta">
								<text class="similar-tag">{{ formatRiskLevel(item.level) }}</text>
								<text class="similar-tag">{{ item.type }}</text>
								<text class="similar-tag score">相似度 {{ item.similarityScore }}</text>
							</view>
							<view class="similar-explain" v-if="item.similarityExplain">
								<text class="explain-line">命中维度：{{ (item.similarityExplain.matchedDimensions || []).join(' / ') || '无' }}</text>
								<text class="explain-line">分项：类{{ item.similarityExplain.scoreBreakdown?.type || 0 }} / 级{{ item.similarityExplain.scoreBreakdown?.level || 0 }} / 别{{ item.similarityExplain.scoreBreakdown?.category || 0 }} / 位{{ item.similarityExplain.scoreBreakdown?.location || 0 }} / 风{{ item.similarityExplain.scoreBreakdown?.risk || 0 }}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 派警推荐 -->
				<view class="info-section" v-if="!alert.handled">
					<text class="section-title">👥 派警推荐</text>
					<view v-if="loadingInspectors" class="inspector-loading">推荐计算中...</view>
					<view class="inspector-list" v-else>
						<view 
							v-for="inspector in nearbyInspectors" 
							:key="inspector.id"
							class="inspector-card"
							:class="{ 'inspector-selected': selectedInspector === inspector.id }"
							@tap="selectInspector(inspector.id)"
						>
							<view class="inspector-avatar">{{ inspector.avatar || '👮' }}</view>
							<view class="inspector-info">
								<text class="inspector-name">{{ inspector.name }}</text>
								<text class="inspector-dept">{{ inspector.department }}</text>
								<view class="inspector-stats">
									<text class="stat-item">📍 {{ inspector.distance }}km</text>
									<text class="stat-item">⏱️ {{ inspector.eta }}分钟</text>
									<text class="stat-item">✅ {{ inspector.completedTasks }}次</text>
								</view>
							</view>
							<view class="inspector-status" :class="'status-' + inspector.status">
								<text class="status-text">{{ inspector.status === 'online' ? '在线' : '忙碌' }}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 证据采集 -->
				<view class="info-section" v-if="!alert.handled">
					<text class="section-title">📷 证据采集</text>
					<EvidenceUpload @upload="handleEvidenceUpload" :taskId="alert.taskId || alert.task_id" :warningId="alert.id" />
					<view class="evidence-indicator">
						<text class="evidence-label">证据完整度</text>
						<view class="evidence-lights">
							<text :class="['elight', evidenceCompleteness >= 50 ? 'elight-on' : evidenceLevel === 'partial' ? 'elight-partial' : 'elight-off']">●</text>
							<text :class="['elight', evidenceCompleteness >= 75 ? 'elight-on' : evidenceLevel === 'partial' ? 'elight-partial' : 'elight-off']">●</text>
							<text :class="['elight', evidenceCompleteness >= 100 ? 'elight-on' : evidenceLevel === 'partial' ? 'elight-partial' : 'elight-off']">●</text>
						</view>
						<text class="evidence-pct">{{ evidenceCompleteness }}%</text>
					</view>
				</view>
				
				<view class="info-section" v-if="alert.handled">
					<text class="section-title">✅ 处理记录</text>
					<view class="handled-info">
						<view class="handled-row"><text class="handled-label">处理人</text><text class="handled-value">{{ alert.handledBy || '张三' }}</text></view>
						<view class="handled-row"><text class="handled-label">处理时间</text><text class="handled-value">{{ formatFullTime(alert.handledTime || alert.time) }}</text></view>
					</view>
				</view>
			</scroll-view>
			<view class="detail-footer" v-if="alert && !alert.handled">
				<TacticalButton
					class="footer-cta"
					variant="ghost"
					size="lg"
					text="忽略预警"
					icon="🛑"
					@confirm="handleIgnore"
				/>
				<TacticalButton
					class="footer-cta"
					variant="danger"
					size="lg"
					text="创建任务"
					icon="⚡"
					:dangerPulse="alert.level === 'critical'"
					@confirm="handleCreateTask"
				/>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import EvidenceUpload from './EvidenceUpload.vue'
import TacticalButton from '../../../components/common/TacticalButton.vue'
import { alertAPI, enforcementAPI } from '../../../utils/request'

const props = defineProps({
	visible: { type: Boolean, default: false },
	alert: { type: Object, default: null }
})
const emit = defineEmits(['close', 'ignore', 'createTask'])

function formatRiskLevel(level) {
	const map = {
		critical: '紧急',
		warning: '预警',
		handled: '已处理',
		resolved: '已处置',
		processing: '处理中',
		investigating: '核查中',
		high: '高风险',
		medium: '中风险',
		low: '低风险',
		unknown: '待研判'
	}
	return map[level] || level || '待研判'
}

function formatTargetType(type) {
	const map = {
		unknown: '待识别目标',
		device: '感知设备目标',
		human: '疑似人员',
		vehicle: '疑似车辆',
		boat: '疑似船只',
		drone: '疑似无人机'
	}
	return map[type] || type || '待识别目标'
}

function formatSourceChannel(source) {
	const map = {
		device: '设备感知',
		camera: '视频识别',
		infrared: '红外感知',
		radar: '雷达识别',
		unknown: '待确认来源'
	}
	return map[source] || source || '待确认来源'
}

const alertView = computed(() => {
	const a = props.alert || {}
	return {
		...a,
		speciesType: a.speciesType || a.species_type || '未知物种',
		targetType: formatTargetType(a.targetType || a.target_type || 'unknown'),
		riskScore: a.riskScore ?? a.risk_score ?? 0,
		sourceChannel: formatSourceChannel(a.sourceChannel || a.source_channel || a.source || 'device'),
		borderSection: a.borderSection || a.border_section || '未标注',
		riskLevel: formatRiskLevel(a.riskLevel || a.risk_level || a.level || 'unknown'),
		affectedPopulation: a.affectedPopulation || a.affected_population || 0
	}
})

const detailFeatureTags = computed(() => {
	const tags = props.alert?.featureTags
	if (Array.isArray(tags) && tags.length) return tags
	return [
		alertView.value.speciesType !== '未知物种' ? alertView.value.speciesType : null,
		props.alert?.protectionLevel || props.alert?.protection_level || null,
		alertView.value.sourceChannel !== 'device' ? alertView.value.sourceChannel : null,
		alertView.value.borderSection !== '未标注' ? alertView.value.borderSection : null
	].filter(Boolean)
})

const commandSuggestions = computed(() => {
	const base = props.alert?.recommendAction || '建议联动边境巡防力量开展现场核验。'
	return [
		base,
		'调取近 2 小时周边卡口、热成像与轨迹记录进行交叉复核。',
		(props.alert?.category === 'vehicle' ? '将目标运载工具同步至车辆布控列表并持续追踪。' : '将目标片区纳入重点盯防范围，防止转移或二次接应。')
	]
})

const commandTimeline = computed(() => {
	const riskHigh = (alertView.value.riskScore || 0) >= 85
	return [
		{ label: '预警触发', desc: '多源感知模型完成异常识别', done: true },
		{ label: '智能研判', desc: '热眼擒枭引擎生成风险结论', done: true },
		{ label: '联动处置', desc: riskHigh ? '建议立即派发巡防力量到场核查' : '建议推送属地力量开展复核', done: riskHigh },
		{ label: '结果回传', desc: '等待现场反馈与证据补录', done: false }
	]
})

const similarCaseSummary = computed(() => {
	if (!similarCases.value.length) {
		return {
			title: '暂无已命中相似案件',
			desc: '当前可先基于现场证据链、卡口记录与轨迹回放开展人工复核。',
			tags: ['待补充样本']
		}
	}
	const top = similarCases.value[0]
	const dims = top.similarityExplain?.matchedDimensions || []
	return {
		title: `命中历史案件：${top.title || '历史走私案件'}`,
		desc: `最高相似度 ${top.similarityScore || 0}%，重点命中${dims.length ? dims.join('、') : '类型、位置与风险等级'}维度。`,
		tags: dims.length ? dims.slice(0, 3) : ['类型接近', '位置接近', '风险接近']
	}
})

const quickLinkActions = computed(() => ([
	{ key: 'gis', label: '联动GIS', icon: '🛰️', hint: '查看周边卡口与便道态势' },
	{ key: 'trace', label: '轨迹核查', icon: '🧭', hint: '调取目标轨迹与卡口记录' },
	{ key: 'dispatch', label: '快速派发', icon: '⚡', hint: '将处置任务推送至联动力量' }
]))

const evidenceChain = computed(() => {
	const source = alertView.value.sourceChannel || '多源感知'
	const location = props.alert?.location || alertView.value.borderSection
	const hasMedia = Boolean(props.alert?.hasPhoto || props.alert?.hasVideo)
	return [
		{ label: '感知触发', value: source, desc: `在「${location || '目标片区'}」捕获首个异常信号`, status: 'strong' },
		{ label: '图像/热成像', value: hasMedia ? '已有回传' : '待补充', desc: hasMedia ? '现场已有图片或视频证据可供复核' : '建议补录热视频或红外截图', status: hasMedia ? 'strong' : 'pending' },
		{ label: '轨迹/卡口', value: props.alert?.category === 'vehicle' ? '车辆轨迹已关联' : '周边轨迹待复核', desc: props.alert?.category === 'vehicle' ? '系统已关联运载工具轨迹与卡口记录' : '建议联动周边卡口与便道轨迹交叉分析', status: props.alert?.category === 'vehicle' ? 'strong' : 'active' },
		{ label: '处置留痕', value: evidenceCompleteness.value + '%', desc: '证据链完整度将随现场补录实时刷新', status: evidenceCompleteness.value >= 75 ? 'strong' : 'active' }
	]
})

const mapLinkedPoints = computed(() => {
	const lat = Number(props.alert?.latitude || 22.1128)
	const lng = Number(props.alert?.longitude || 106.7612)
	return [
		{ label: '预警点位', value: props.alert?.location || alertView.value.borderSection, meta: `${lat.toFixed(4)}, ${lng.toFixed(4)}` },
		{ label: '最近卡口', value: props.alert?.category === 'vehicle' ? '口岸联检卡口' : '边境联防卡口', meta: '约 1.8km · 可联动过车/过人记录' },
		{ label: '联动力量', value: nearbyInspectors.value[0]?.name || '巡防待命组', meta: nearbyInspectors.value[0] ? `预计 ${nearbyInspectors.value[0].eta} 分钟到场` : '可一键派发处置任务' }
	]
})

const selectedInspector = ref(null)
const evidenceData = ref(null)
const loadingInspectors = ref(false)
const loadingSimilar = ref(false)
const similarCases = ref([])
const similarityWeights = ref(null)
const similarityMeta = ref(null)

const nearbyInspectors = ref([])

async function loadSimilarCases() {
	if (!props.alert?.id) {
		similarCases.value = []
		similarityWeights.value = null
		similarityMeta.value = null
		return
	}
	loadingSimilar.value = true
	try {
		const res = await alertAPI.getSimilarCases(props.alert.id, { limit: 5 })
		similarCases.value = res?.data?.similar || []
		similarityWeights.value = res?.data?.weights || null
		similarityMeta.value = res?.data?.similarityMeta || null
	} catch (error) {
		similarCases.value = []
		similarityWeights.value = null
		similarityMeta.value = null
	} finally {
		loadingSimilar.value = false
	}
}

async function loadRecommendedInspectors() {
	if (!props.alert) {
		nearbyInspectors.value = []
		return
	}

	const latitude = Number(props.alert.latitude || 22.1128)
	const longitude = Number(props.alert.longitude || 106.7612)
	loadingInspectors.value = true

	try {
		const res = await enforcementAPI.recommendInspectors({ latitude, longitude, limit: 5 })
		nearbyInspectors.value = res?.data?.inspectors || []
	} catch (error) {
		nearbyInspectors.value = [
			{ id: 1, name: '张三', avatar: '👨‍🔬', department: '生态检查一队', distance: 1.2, eta: 5, completedTasks: 28, status: 'online' },
			{ id: 2, name: '李四', avatar: '👩‍🔬', department: '生态检查二队', distance: 2.5, eta: 10, completedTasks: 35, status: 'online' },
			{ id: 3, name: '王五', avatar: '👨‍💼', department: '生态检查一队', distance: 3.8, eta: 15, completedTasks: 22, status: 'busy' }
		]
	} finally {
		loadingInspectors.value = false
	}
}

watch(() => props.alert, () => {
	selectedInspector.value = null
	if (props.visible) {
		loadRecommendedInspectors()
		loadSimilarCases()
	}
}, { immediate: true })

watch(() => props.visible, (v) => {
	if (v) {
		loadRecommendedInspectors()
		loadSimilarCases()
	}
})

const riskBadgeClass = computed(() => {
	if (!props.alert) return ''
	const s = alertView.value.riskScore
	if (s >= 80) return 'risk-high'
	if (s >= 60) return 'risk-medium'
	return 'risk-low'
})

const evidenceCompleteness = computed(() => {
	const a = props.alert || {}
	let score = 0
	if (a.hasPhoto) score += 25
	if (a.hasVideo) score += 25
	if (a.hasLocation) score += 25
	if (a.hasWitness) score += 25
	return score
})

const evidenceLevel = computed(() => {
	if (evidenceCompleteness.value >= 75) return 'complete'
	if (evidenceCompleteness.value >= 50) return 'partial'
	return 'insufficient'
})

const displayCaseNo = computed(() => {
	if (props.alert?.caseNo) return props.alert.caseNo
	if (props.alert?.caseNumber) return props.alert.caseNumber
	// Auto-generate
	const prefix = props.alert?.level === 'critical' ? 'ECO-CRIT' : props.alert?.level === 'warning' ? 'ECO-WARN' : 'ECO-INFO'
	const year = new Date().getFullYear()
	const id = props.alert?.id || Date.now()
	return `${prefix}-${year}-${String(id).padStart(6, '0')}`
})

function getAlertIcon() {
	if (!props.alert) return ''
	return { critical: '/static/icons/alert-critical.png', warning: '/static/icons/alert-warning.png', handled: '/static/icons/alert-handled.png' }[props.alert.level] || '/static/icons/alert-warning.png'
}

function getEcologyTypeName(type) {
	return {
		'wildlife-track':   '野生动物活动预警',
		'habitat-damage':   '栖息地破坏预警',
		'water-quality':    '水质异常预警',
		'border-anomaly':   '边境走私异常预警'
	}[type] || '生态预警'
}

function selectInspector(id) {
	selectedInspector.value = id
	uni.vibrateShort()
}

function formatFullTime(time) {
	if (!time) return ''
	const d = new Date(time)
	return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0')
}

function handleClose() { 
	selectedInspector.value = null
	emit('close') 
}

function handleEvidenceUpload(evidence) {
	evidenceData.value = evidence
	uni.vibrateShort()
	console.log('证据已上传:', evidence)
	uni.showToast({ 
		title: '✅ 证据已保存到案件档案', 
		icon: 'success',
		duration: 2000
	})
}

function handleQuickLink(action) {
	const actionMap = {
		gis: '已联动 GIS 态势图',
		trace: '已发起轨迹核查',
		dispatch: '已推送快速派发'
	}
	uni.vibrateShort()
	uni.showToast({ title: actionMap[action] || '联动成功', icon: 'none' })
}

function handleIgnore() { emit('ignore', props.alert) }

function handleCreateTask() { 
	if (!selectedInspector.value) {
		uni.showModal({
			title: '提示',
			content: '请先选择检查员',
			showCancel: false
		})
		return
	}
	
	const inspector = nearbyInspectors.value.find(i => i.id === selectedInspector.value)
	
	uni.showModal({
		title: '确认派警',
		content: `派遣 ${inspector.name} 前往处理？\n预计 ${inspector.eta} 分钟到达`,
		confirmText: '确认派警',
		confirmColor: '#10b981',
		success: (res) => {
			if (res.confirm) {
				uni.showLoading({ title: '派警中...', mask: true })
				
				setTimeout(() => {
					uni.hideLoading()
					uni.showToast({ 
						title: `✅ 已派遣 ${inspector.name}`, 
						icon: 'success',
						duration: 2000
					})
					
					emit('createTask', { ...props.alert, assignedTo: inspector.name })
					handleClose()
				}, 1000)
			}
		}
	})
}
</script>

<style lang="scss" scoped>
.alert-detail-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: flex-end; z-index: 1000; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-content { width: 100%; max-height: 90vh; background: rgba(26,31,46,0.98); border-radius: 48rpx 48rpx 0 0; display: flex; flex-direction: column; animation: slideUp 0.3s ease; position: relative; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

/* 横屏模式适配 */
@media (orientation: landscape) {
	.alert-detail-modal {
		align-items: center;
		justify-content: center;
	}
	
	.modal-content {
		max-height: 85vh;
		max-width: 90vw;
		border-radius: 24rpx;
	}

	.detail-footer {
		padding-top: 20rpx;
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	}
}

/* 平板适配 */
@media (min-width: 768px) {
	.modal-content {
		max-width: 800rpx;
		margin: 0 auto;
	}

	.info-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}

@media (max-width: 375px) {
	.close-btn {
		top: 20rpx;
		right: 20rpx;
	}

	.detail-header {
		padding: 40rpx 22rpx 24rpx;
	}

	.info-section {
		padding: 22rpx;
	}

	.info-grid {
		grid-template-columns: 1fr;
	}
}
.close-btn { position: absolute; top: 32rpx; right: 32rpx; width: 64rpx; height: 64rpx; background: rgba(255,255,255,0.1); border-radius: 32rpx; display: flex; align-items: center; justify-content: center; z-index: 10; }
.close-icon { font-size: 40rpx; color: #ffffff; font-weight: 300; }
.detail-header { padding: 48rpx 32rpx 32rpx; display: flex; align-items: center; gap: 24rpx; border-bottom: 1px solid rgba(255,255,255,0.05); }
.detail-header.level-critical { background: linear-gradient(180deg, rgba(255,77,79,0.1) 0%, transparent 100%); }
.detail-header.level-warning { background: linear-gradient(180deg, rgba(255,169,64,0.1) 0%, transparent 100%); }
.header-icon { width: 80rpx; height: 80rpx; }
.header-info { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.header-title { font-size: 36rpx; font-weight: 700; color: #ffffff; }
.header-time { font-size: 24rpx; color: #8c8c8c; font-family: Courier New, monospace; }
.risk-badge { width: 96rpx; height: 96rpx; border-radius: 48rpx; display: flex; align-items: center; justify-content: center; font-size: 40rpx; font-weight: 700; font-family: Courier New, monospace; }
.warning-scene-hero { margin: 24rpx 24rpx 8rpx; padding: 24rpx; border-radius: 24rpx; background: linear-gradient(180deg, rgba(15, 33, 54, 0.96), rgba(11, 24, 40, 0.92)); border: 1px solid rgba(64, 196, 255, 0.16); box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.04); }
.warning-scene-top { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 14rpx; }
.warning-scene-kicker { font-size: 20rpx; color: rgba(190, 228, 255, 0.64); font-weight: 700; letter-spacing: 1rpx; }
.warning-scene-score { padding: 8rpx 16rpx; border-radius: 999rpx; background: rgba(255, 169, 64, 0.14); border: 1px solid rgba(255, 169, 64, 0.22); color: #ffb454; font-size: 20rpx; font-weight: 800; }
.warning-scene-title { font-size: 34rpx; line-height: 1.35; color: #ffffff; font-weight: 800; margin-bottom: 12rpx; display: block; }
.warning-scene-desc { font-size: 24rpx; line-height: 1.7; color: rgba(226, 242, 255, 0.82); display: block; }
.warning-scene-tags { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 18rpx; }
.warning-scene-tag { padding: 8rpx 14rpx; border-radius: 999rpx; background: rgba(64, 196, 255, 0.12); border: 1px solid rgba(64, 196, 255, 0.18); color: #86e4ff; font-size: 20rpx; font-weight: 700; }
.warning-analysis-box { background: rgba(64, 196, 255, 0.04); border: 1px solid rgba(64, 196, 255, 0.1); border-radius: 20rpx; }
.command-section, .timeline-section, .suggestion-section { margin-top: 8rpx; }
.evidence-chain-section, .map-link-section { margin-top: 8rpx; }
.command-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.command-card { padding: 18rpx; border-radius: 18rpx; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 10rpx; }
.command-label { font-size: 20rpx; color: rgba(190, 228, 255, 0.62); }
.command-value { font-size: 24rpx; line-height: 1.5; color: #f4fbff; font-weight: 700; }
.evidence-chain-list { display:flex; flex-direction:column; gap:14rpx; }
.evidence-chain-item { padding:18rpx; border-radius:18rpx; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); }
.evidence-chain-item.status-strong { border-color: rgba(64, 196, 255, 0.24); box-shadow: inset 0 0 0 1rpx rgba(64, 196, 255, 0.08); }
.evidence-chain-item.status-pending { border-color: rgba(255, 169, 64, 0.2); }
.evidence-chain-head { display:flex; align-items:center; justify-content:space-between; gap:16rpx; margin-bottom:10rpx; }
.evidence-chain-label { font-size:22rpx; color:#cfeaff; font-weight:700; }
.evidence-chain-value { font-size:22rpx; color:#ffb454; font-weight:800; }
.evidence-chain-desc { font-size:22rpx; line-height:1.65; color:rgba(221, 238, 255, 0.72); }
.map-link-panel { padding:20rpx; border-radius:20rpx; background:linear-gradient(180deg, rgba(10, 22, 38, 0.95), rgba(8, 16, 29, 0.95)); border:1px solid rgba(64, 196, 255, 0.12); }
.map-link-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14rpx; margin-bottom:20rpx; }
.quick-link-actions { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12rpx; margin-top:18rpx; }
.quick-link-btn { padding:16rpx 14rpx; border-radius:18rpx; background:rgba(255,255,255,0.04); border:1px solid rgba(64,196,255,0.14); display:flex; flex-direction:column; align-items:flex-start; gap:8rpx; }
.quick-link-icon { font-size:28rpx; line-height:1; }
.quick-link-copy { display:flex; flex-direction:column; gap:4rpx; }
.quick-link-label { font-size:22rpx; color:#f2fbff; font-weight:800; }
.quick-link-hint { font-size:19rpx; line-height:1.45; color:rgba(208,232,255,0.66); }
.map-link-card { padding:16rpx; border-radius:16rpx; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); display:flex; flex-direction:column; gap:8rpx; }
.map-link-label { font-size:20rpx; color:rgba(190, 228, 255, 0.62); }
.map-link-value { font-size:24rpx; line-height:1.45; color:#ffffff; font-weight:700; }
.map-link-meta { font-size:20rpx; line-height:1.5; color:rgba(219, 237, 255, 0.66); }
.map-radar-box { position:relative; height:240rpx; border-radius:24rpx; overflow:hidden; background:radial-gradient(circle at center, rgba(64,196,255,0.16), rgba(64,196,255,0.02) 45%, rgba(255,255,255,0.02) 100%); border:1px solid rgba(64,196,255,0.1); }
.map-radar-core { position:absolute; left:50%; top:50%; width:22rpx; height:22rpx; margin-left:-11rpx; margin-top:-11rpx; border-radius:50%; background:#40c4ff; box-shadow:0 0 18rpx rgba(64,196,255,0.8); z-index:2; }
.map-radar-ring { position:absolute; left:50%; top:50%; border-radius:50%; border:1px solid rgba(64,196,255,0.22); transform:translate(-50%, -50%); }
.map-radar-ring.ring-1 { width:96rpx; height:96rpx; }
.map-radar-ring.ring-2 { width:156rpx; height:156rpx; }
.map-radar-ring.ring-3 { width:216rpx; height:216rpx; }
.map-radar-point { position:absolute; width:16rpx; height:16rpx; border-radius:50%; z-index:2; }
.map-radar-point.point-main { left:50%; top:50%; margin-left:34rpx; margin-top:-56rpx; background:#ffb454; box-shadow:0 0 16rpx rgba(255,180,84,0.8); }
.map-radar-point.point-assist { background:#73e7ff; box-shadow:0 0 14rpx rgba(115,231,255,0.7); }
.map-radar-point.point-a { left:50%; top:50%; margin-left:-82rpx; margin-top:34rpx; }
.map-radar-point.point-b { left:50%; top:50%; margin-left:68rpx; margin-top:54rpx; }
.timeline-list { display: flex; flex-direction: column; gap: 18rpx; }
.timeline-item { display: flex; gap: 16rpx; align-items: flex-start; }
.timeline-dot { width: 18rpx; height: 18rpx; border-radius: 50%; background: rgba(64, 196, 255, 0.24); border: 2rpx solid rgba(64, 196, 255, 0.6); margin-top: 8rpx; flex-shrink: 0; }
.timeline-item.done .timeline-dot { background: #40c4ff; box-shadow: 0 0 14rpx rgba(64, 196, 255, 0.45); }
.timeline-content { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.timeline-title { font-size: 24rpx; font-weight: 700; color: #ffffff; }
.timeline-desc { font-size: 22rpx; line-height: 1.6; color: rgba(214, 235, 255, 0.72); }
.similar-summary-card { margin-bottom: 16rpx; padding: 20rpx; border-radius: 20rpx; background: linear-gradient(180deg, rgba(15, 31, 51, 0.96), rgba(10, 21, 35, 0.94)); border: 1px solid rgba(255,255,255,0.08); }
.similar-summary-title { font-size: 26rpx; line-height: 1.45; color: #ffffff; font-weight: 800; display:block; margin-bottom: 10rpx; }
.similar-summary-desc { font-size: 22rpx; line-height: 1.65; color: rgba(221, 238, 255, 0.76); display:block; }
.similar-summary-tags { display:flex; flex-wrap:wrap; gap:10rpx; margin-top: 14rpx; }
.similar-summary-tag { padding: 8rpx 14rpx; border-radius: 999rpx; background: rgba(255, 169, 64, 0.12); border: 1px solid rgba(255, 169, 64, 0.18); color: #ffb454; font-size: 20rpx; font-weight: 700; }
.suggestion-list { display: flex; flex-direction: column; gap: 14rpx; }
.suggestion-item { display: flex; gap: 14rpx; align-items: flex-start; padding: 18rpx; border-radius: 18rpx; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); }
.suggestion-index { min-width: 44rpx; height: 44rpx; border-radius: 50%; background: rgba(255, 169, 64, 0.14); color: #ffb454; display: flex; align-items: center; justify-content: center; font-size: 20rpx; font-weight: 800; }
.suggestion-text { flex: 1; font-size: 23rpx; line-height: 1.65; color: #eef7ff; }
.risk-badge.risk-high { background: rgba(255,77,79,0.2); border: 3px solid #FF4D4F; color: #FF4D4F; }
.risk-badge.risk-medium { background: rgba(255,169,64,0.2); border: 3px solid #FFA940; color: #FFA940; }
.risk-badge.risk-low { background: rgba(115,209,61,0.2); border: 3px solid #73D13D; color: #73D13D; }
.detail-scroll { flex: 1; height: 0; min-height: 0; box-sizing: border-box; }
.info-section { padding: 32rpx; border-bottom: 1px solid rgba(255,255,255,0.05); }
.section-title { font-size: 28rpx; font-weight: 700; color: #ffffff; margin-bottom: 24rpx; display: block; }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24rpx; }
.info-item { display: flex; flex-direction: column; gap: 12rpx; }
.info-label { font-size: 24rpx; color: #8c8c8c; }
.info-value { font-size: 28rpx; color: #ffffff; font-weight: 600; }
.info-value.exceed-critical { color: #FF4D4F; }
.info-value.exceed-high { color: #FFA940; }
.info-value.exceed-medium { color: #FFC53D; }
.urgency-text { color: #FF4D4F; font-weight: 700; }

/* 法律依据样式 */
.legal-info { 
	display: flex; 
	flex-direction: column; 
	gap: 20rpx; 
	background: rgba(255,255,255,0.03);
	padding: 24rpx;
	border-radius: 16rpx;
	border: 1px solid rgba(255,255,255,0.08);
}

.legal-item { 
	display: flex; 
	flex-direction: column; 
	gap: 12rpx; 
}

.legal-item.full-width {
	grid-column: 1 / -1;
}

.legal-label { 
	font-size: 24rpx; 
	color: #8c8c8c; 
	font-weight: 500;
}

.legal-value { 
	font-size: 28rpx; 
	color: #ffffff; 
	font-weight: 600; 
	line-height: 1.6;
}

.case-no {
	font-family: 'Courier New', monospace;
	color: #00d4ff;
	font-weight: 700;
	letter-spacing: 1rpx;
}

.penalty-text {
	color: #FF4D4F;
	font-weight: 700;
	line-height: 1.8;
}

.inspector-list { display: flex; flex-direction: column; gap: 16rpx; }
.similar-list {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}
.similar-weight-bar {
	display: flex;
	gap: 8rpx;
	flex-wrap: wrap;
}
.weight-item {
	padding: 4rpx 10rpx;
	border-radius: 10rpx;
	font-size: 20rpx;
	background: rgba(0, 212, 255, 0.1);
	color: #bcefff;
}
.similar-item {
	padding: 16rpx;
	border-radius: 12rpx;
	background: rgba(255,255,255,0.04);
	border: 1px solid rgba(255,255,255,0.08);
}
.similar-progress {
	height: 6rpx;
	background: rgba(255,255,255,0.1);
	border-radius: 3rpx;
	margin-bottom: 8rpx;
	overflow: hidden;
}
.similar-progress-bar {
	height: 6rpx;
	background: linear-gradient(90deg, #FFA940, #FF4D4F);
	border-radius: 3rpx;
	transition: width 0.3s ease;
}
.similar-explain {
	margin-top: 8rpx;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}
.explain-line {
	font-size: 20rpx;
	color: rgba(255,255,255,0.72);
}
.similar-title {
	font-size: 24rpx;
	color: #fff;
	font-weight: 600;
}
.similar-meta {
	margin-top: 10rpx;
	display: flex;
	gap: 8rpx;
	flex-wrap: wrap;
}
.similar-tag {
	padding: 4rpx 10rpx;
	border-radius: 10rpx;
	font-size: 20rpx;
	background: rgba(0,212,255,0.14);
	color: #9be8ff;
}
.similar-tag.score {
	background: rgba(255,169,64,0.14);
	color: #ffd59a;
}
.inspector-loading {
	padding: 24rpx;
	text-align: center;
	font-size: 24rpx;
	color: #8c8c8c;
}
.inspector-card { 
	background: rgba(255,255,255,0.05); 
	border-radius: 16rpx; 
	padding: 20rpx; 
	display: flex; 
	align-items: center; 
	gap: 16rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s;
}
.inspector-card.inspector-selected {
	background: rgba(16,185,129,0.2);
	border-color: #10b981;
}
.inspector-avatar { 
	width: 80rpx; 
	height: 80rpx; 
	border-radius: 40rpx; 
	background: linear-gradient(135deg, #00A8D6 0%, #007EA8 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
}
.inspector-info { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.inspector-name { font-size: 28rpx; color: #ffffff; font-weight: 600; }
.inspector-dept { font-size: 22rpx; color: #8c8c8c; }
.inspector-stats { display: flex; gap: 16rpx; margin-top: 4rpx; }
.stat-item { font-size: 20rpx; color: #8c8c8c; }
.inspector-status { 
	padding: 8rpx 16rpx; 
	border-radius: 12rpx; 
	background: rgba(115,209,61,0.2);
}
.inspector-status.status-online {
	background: rgba(115,209,61,0.2);
}
.inspector-status.status-busy {
	background: rgba(255,169,64,0.2);
}
.status-text { font-size: 22rpx; color: #73D13D; font-weight: 600; }
.inspector-status.status-busy .status-text { color: #FFA940; }
.handled-info { display: flex; flex-direction: column; gap: 16rpx; }
.handled-row { display: flex; justify-content: space-between; align-items: center; }
.handled-label { font-size: 24rpx; color: #8c8c8c; }
.handled-value { font-size: 28rpx; color: #ffffff; font-weight: 600; }
.detail-footer { 
	padding: 32rpx calc(32rpx + env(safe-area-inset-left)) calc(32rpx + env(safe-area-inset-bottom)) calc(32rpx + env(safe-area-inset-right)); 
	display: flex; 
	gap: 16rpx; 
	border-top: 1px solid rgba(255,255,255,0.05); 
}
.evidence-indicator {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-top: 16rpx;
	padding: 12rpx 16rpx;
	background: rgba(255,255,255,0.04);
	border-radius: 12rpx;
}
.evidence-label { font-size: 20rpx; color: rgba(255,255,255,0.6); }
.evidence-lights { display: flex; gap: 8rpx; }
.elight { font-size: 24rpx; }
.elight-on { color: #52C41A; }
.elight-partial { color: #FAAD14; }
.elight-off { color: rgba(255,255,255,0.2); }
.evidence-pct { font-size: 20rpx; color: #fff; font-weight: 700; margin-left: auto; }
.footer-btn { flex: 1; height: 96rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx; border-radius: 20rpx; }
.ignore-btn { background: rgba(89,89,89,0.2); border: 2px solid rgba(89,89,89,0.5); }
.task-btn { background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); border: 2px solid rgba(0,212,255,0.5); box-shadow: 0 8rpx 24rpx rgba(0,212,255,0.4); }
.btn-icon { width: 40rpx; height: 40rpx; }
.btn-text { font-size: 32rpx; font-weight: 700; color: #ffffff; }
</style>
