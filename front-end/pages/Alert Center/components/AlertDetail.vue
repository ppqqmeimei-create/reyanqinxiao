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
			<scroll-view v-if="alert" class="detail-scroll" scroll-y>
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
				
				<!-- 法律依据和处罚建议 -->
				<view class="info-section" v-if="!alert.handled">
					<text class="section-title">⚖️ 法律依据与处罚</text>
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
								<text class="similar-tag">{{ item.level }}</text>
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
					:holdToConfirm="true"
					:holdMs="1000"
					holdHintText="按住 1.0s 忽略预警"
					@confirm="handleIgnore"
				/>
				<TacticalButton
					class="footer-cta"
					variant="danger"
					size="lg"
					text="创建任务"
					icon="⚡"
					:holdToConfirm="true"
					:holdMs="1000"
					holdHintText="按住 1.0s 创建处置任务"
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

const alertView = computed(() => {
	const a = props.alert || {}
	return {
		...a,
		speciesType: a.speciesType || a.species_type || '未知物种',
		targetType: a.targetType || a.target_type || 'unknown',
		riskScore: a.riskScore ?? a.risk_score ?? 0,
		sourceChannel: a.sourceChannel || a.source_channel || a.source || 'device',
		borderSection: a.borderSection || a.border_section || '未标注',
		riskLevel: a.riskLevel || a.risk_level || a.level || 'unknown',
		affectedPopulation: a.affectedPopulation || a.affected_population || 0
	}
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
	return { critical: '/static/icons-2/alert-critical.png', warning: '/static/icons-2/alert-warning.png', handled: '/static/icons-2/alert-handled.png' }[props.alert.level] || '/static/icons-2/alert-warning.png'
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
	uni.vibrateShort()
	console.log('证据已上传:', evidence)
	uni.showToast({ 
		title: '✅ 证据已保存到案件档案', 
		icon: 'success',
		duration: 2000
	})
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
.risk-badge.risk-high { background: rgba(255,77,79,0.2); border: 3px solid #FF4D4F; color: #FF4D4F; }
.risk-badge.risk-medium { background: rgba(255,169,64,0.2); border: 3px solid #FFA940; color: #FFA940; }
.risk-badge.risk-low { background: rgba(115,209,61,0.2); border: 3px solid #73D13D; color: #73D13D; }
.detail-scroll { flex: 1; overflow: hidden; }
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
