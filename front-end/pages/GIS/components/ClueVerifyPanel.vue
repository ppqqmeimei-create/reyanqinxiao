<template>
  <!-- 全屏遮罩 -->
  <view v-if="visible" class="cvp-overlay" @tap="handleClose">
    <!-- 主面板（底部抽屉） -->
    <view class="cvp-panel" :class="{ open: animating }" @tap.stop>

      <!-- 拖拽指示条 -->
      <view class="cvp-drag-bar"></view>

      <!-- 头部 -->
      <view class="cvp-header">
        <view class="cvp-header-left">
          <view class="cvp-title-icon">
            <text class="cvp-title-emoji">🔍</text>
          </view>
          <view class="cvp-title-group">
            <text class="cvp-title">线索核验</text>
            <text class="cvp-subtitle">热眼擒枭 · {{ pendingClues.length }} 条待核线索</text>
          </view>
        </view>
        <view class="cvp-header-right">
          <view class="cvp-batch-toggle" :class="{ active: batchMode }" @tap="batchMode = !batchMode">
            <text class="cvp-batch-label">{{ batchMode ? '批量模式' : '单条模式' }}</text>
          </view>
          <view class="cvp-close-btn" @tap="handleClose">
            <text class="cvp-close-text">×</text>
          </view>
        </view>
      </view>

      <!-- 统计概览 -->
      <view class="cvp-stats-row">
        <view class="cvp-stat-chip cvp-stat-pending">
          <text class="cvp-stat-num">{{ pendingClues.length }}</text>
          <text class="cvp-stat-label">待核验</text>
        </view>
        <view class="cvp-stat-chip cvp-stat-investigating">
          <text class="cvp-stat-num">{{ investigatingCount }}</text>
          <text class="cvp-stat-label">调查中</text>
        </view>
        <view class="cvp-stat-chip cvp-stat-resolved">
          <text class="cvp-stat-num">{{ resolvedCount }}</text>
          <text class="cvp-stat-label">已处置</text>
        </view>
        <view class="cvp-stat-chip cvp-stat-high">
          <text class="cvp-stat-num">{{ highRiskCount }}</text>
          <text class="cvp-stat-label">高风险</text>
        </view>
      </view>

      <!-- 批量操作栏（仅批量模式下显示） -->
      <view v-if="batchMode && selectedClues.length > 0" class="cvp-batch-bar">
        <view class="cvp-batch-info">
          <text class="cvp-batch-count">已选 {{ selectedClues.length }} 条</text>
        </view>
        <view class="cvp-batch-actions">
          <view class="cvp-batch-btn cvp-batch-btn-pass" @tap="handleBatchVerify('pass')">
            <text class="cvp-batch-btn-text">批量通过</text>
          </view>
          <view class="cvp-batch-btn cvp-batch-btn-reject" @tap="handleBatchVerify('reject')">
            <text class="cvp-batch-btn-text">批量驳回</text>
          </view>
          <view class="cvp-batch-btn cvp-batch-btn-investigate" @tap="handleBatchVerify('investigate')">
            <text class="cvp-batch-btn-text">批量转调查</text>
          </view>
        </view>
      </view>

      <!-- 线索列表 -->
      <scroll-view class="cvp-list" scroll-y="true" enhanced="true" :show-scrollbar="false" enable-flex="true">
        <view v-if="pendingClues.length === 0" class="cvp-empty">
          <text class="cvp-empty-icon">🎉</text>
          <text class="cvp-empty-text">当前无待核线索</text>
          <text class="cvp-empty-hint">所有线索均已核验完毕</text>
        </view>

        <view
          v-for="clue in pendingClues"
          :key="clue.id"
          class="cvp-clue-card"
          :class="{ selected: selectedClues.includes(clue.id) }"
          @tap="handleClueTap(clue)"
        >
          <!-- 选择框（批量模式） -->
          <view v-if="batchMode" class="cvp-clue-checkbox" @tap.stop="toggleSelect(clue.id)">
            <view class="cvp-checkbox" :class="{ checked: selectedClues.includes(clue.id) }">
              <text v-if="selectedClues.includes(clue.id)" class="cvp-checkbox-check">✓</text>
            </view>
          </view>

          <!-- 卡片主体 -->
          <view class="cvp-clue-body">
            <!-- 卡片头部：类型标签 + 风险等级 -->
            <view class="cvp-clue-header">
              <view class="cvp-clue-type-tag" :class="'type-' + clue.type">
                <text class="cvp-clue-type-icon">{{ getTypeIcon(clue.type) }}</text>
                <text class="cvp-clue-type-text">{{ getTypeLabel(clue.type) }}</text>
              </view>
              <view class="cvp-clue-risk-badge" :class="'risk-' + getRiskClass(clue.risk_level)">
                <text class="cvp-clue-risk-dot"></text>
                <text class="cvp-clue-risk-text">{{ clue.risk_level || '中' }}风险</text>
              </view>
            </view>

            <!-- 线索名称 -->
            <text class="cvp-clue-name">{{ clue.name }}</text>

            <!-- 卡片底部：地点 + 时间 + 状态 -->
            <view class="cvp-clue-footer">
              <view class="cvp-clue-meta">
                <text class="cvp-clue-location">📍 {{ clue.border }}</text>
                <text class="cvp-clue-time">🕐 {{ clue.time }}</text>
              </view>
              <view class="cvp-clue-status" :class="'status-' + clue.status">
                <text class="cvp-clue-status-text">{{ getStatusText(clue.status) }}</text>
              </view>
            </view>

            <!-- 关联指标（展开后显示） -->
            <view v-if="expandedClueId === clue.id" class="cvp-clue-detail">
              <view class="cvp-detail-divider"></view>
              <view class="cvp-detail-grid">
                <view class="cvp-detail-item">
                  <text class="cvp-detail-label">线索类型</text>
                  <text class="cvp-detail-value">{{ clue.metricA || '-' }}</text>
                </view>
                <view class="cvp-detail-item">
                  <text class="cvp-detail-label">关联线索</text>
                  <text class="cvp-detail-value">{{ clue.metricB || '-' }}</text>
                </view>
              </view>
              <view class="cvp-detail-grid">
                <view class="cvp-detail-item">
                  <text class="cvp-detail-label">责任单位</text>
                  <text class="cvp-detail-value">{{ clue.unit || '-' }}</text>
                </view>
                <view class="cvp-detail-item">
                  <text class="cvp-detail-label">发现时间</text>
                  <text class="cvp-detail-value">{{ clue.time || '-' }}</text>
                </view>
              </view>

              <!-- 核验表单 -->
              <view class="cvp-verify-form">
                <text class="cvp-verify-form-title">核验结论</text>

                <view class="cvp-form-row">
                  <view class="cvp-form-label">核验结果</view>
                  <view class="cvp-form-radio-group">
                    <view
                      v-for="option in verifyOptions"
                      :key="option.value"
                      class="cvp-form-radio"
                      :class="{ selected: verifyForm[clue.id]?.result === option.value }"
                      @tap.stop="setVerifyResult(clue.id, option.value)"
                    >
                      <text class="cvp-form-radio-text">{{ option.label }}</text>
                    </view>
                  </view>
                </view>

                <view class="cvp-form-row">
                  <view class="cvp-form-label">风险研判</view>
                  <view class="cvp-form-radio-group">
                    <view
                      v-for="risk in riskLevels"
                      :key="risk.value"
                      class="cvp-form-radio cvp-form-radio-risk"
                      :class="['risk-' + risk.value, { selected: verifyForm[clue.id]?.riskLevel === risk.value }]"
                      @tap.stop="setVerifyRisk(clue.id, risk.value)"
                    >
                      <text class="cvp-form-radio-text">{{ risk.label }}</text>
                    </view>
                  </view>
                </view>

                <view class="cvp-form-row cvp-form-row-remark">
                  <view class="cvp-form-label">核验备注</view>
                  <textarea
                    class="cvp-form-textarea"
                    placeholder="请输入核验说明（选填）"
                    placeholder-class="cvp-form-placeholder"
                    :value="verifyForm[clue.id]?.remark || ''"
                    @input="(e) => setVerifyRemark(clue.id, e.detail.value)"
                    @tap.stop
                  ></textarea>
                </view>

                <view class="cvp-form-actions">
                  <view class="cvp-form-btn cvp-form-btn-secondary" @tap.stop="handleQuickAction(clue, 'pass')">
                    <text class="cvp-form-btn-text">快速通过</text>
                  </view>
                  <view class="cvp-form-btn cvp-form-btn-investigate" @tap.stop="handleQuickAction(clue, 'investigate')">
                    <text class="cvp-form-btn-text">转调查中</text>
                  </view>
                  <view class="cvp-form-btn cvp-form-btn-primary" @tap.stop="handleSubmitVerify(clue)">
                    <text class="cvp-form-btn-text">确认核验</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 展开/收起指示器 -->
            <view v-if="clue.status === 'pending'" class="cvp-clue-expand" @tap.stop="toggleExpand(clue.id)">
              <text class="cvp-clue-expand-text">{{ expandedClueId === clue.id ? '收起核验表 ∨' : '展开核验 ∨' }}</text>
            </view>
          </view>
        </view>

        <!-- 已核验线索（底部折叠区） -->
        <view v-if="resolvedClues.length > 0" class="cvp-resolved-section">
          <view class="cvp-resolved-header" @tap="showResolved = !showResolved">
            <text class="cvp-resolved-title">已核验线索 ({{ resolvedClues.length }})</text>
            <text class="cvp-resolved-arrow">{{ showResolved ? '▲' : '▼' }}</text>
          </view>
          <view v-if="showResolved" class="cvp-resolved-list">
            <view v-for="clue in resolvedClues" :key="clue.id" class="cvp-resolved-card">
              <view class="cvp-resolved-icon">
                <text class="cvp-resolved-icon-text">{{ getTypeIcon(clue.type) }}</text>
              </view>
              <view class="cvp-resolved-info">
                <text class="cvp-resolved-name">{{ clue.name }}</text>
                <text class="cvp-resolved-meta">{{ clue.border }} · {{ clue.unit }}</text>
              </view>
              <view class="cvp-resolved-badge" :class="'status-' + clue.status">
                <text class="cvp-resolved-badge-text">{{ getStatusText(clue.status) }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="cvp-list-bottom-space"></view>
      </scroll-view>

      <!-- 底部操作栏 -->
      <view class="cvp-footer">
        <view class="cvp-footer-info">
          <text class="cvp-footer-hint">提示：点击卡片展开核验表单，填写结论后提交</text>
        </view>
        <view class="cvp-footer-actions">
          <view class="cvp-footer-btn cvp-footer-btn-secondary" @tap="handleClose">
            <text class="cvp-footer-btn-text">关闭</text>
          </view>
          <view class="cvp-footer-btn cvp-footer-btn-primary" @tap="handleQuickDispatch">
            <text class="cvp-footer-btn-text">推送情报研判</text>
          </view>
        </view>
      </view>

    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  clues: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['close', 'verify', 'batch-verify', 'dispatch'])

// ==================== 状态 ====================
const batchMode = ref(false)
const selectedClues = ref([])
const expandedClueId = ref(null)
const showResolved = ref(false)
const animating = ref(false)

/** 每条线索的核验表单数据 */
const verifyForm = ref({})

// ==================== 计算属性 ====================
const pendingClues = computed(() =>
  props.clues.filter(d => d.status === 'pending')
)

const resolvedClues = computed(() =>
  props.clues.filter(d => d.status === 'investigating' || d.status === 'resolved')
)

const investigatingCount = computed(() =>
  props.clues.filter(d => d.status === 'investigating').length
)

const resolvedCount = computed(() =>
  props.clues.filter(d => d.status === 'resolved').length
)

const highRiskCount = computed(() =>
  props.clues.filter(d => d.risk_level === '高' || d.risk_level === '中高').length
)

// ==================== 核验选项配置 ====================
const verifyOptions = [
  { label: '属实', value: 'pass' },
  { label: '存疑', value: 'doubtful' },
  { label: '驳回', value: 'reject' }
]

const riskLevels = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]

// ==================== 方法 ====================

/** 关闭面板 */
const handleClose = () => {
  emit('close')
}

/** 线索卡片点击 */
const handleClueTap = (clue) => {
  if (batchMode.value) {
    toggleSelect(clue.id)
  } else {
    // 单条模式：切换展开
    toggleExpand(clue.id)
  }
}

/** 批量选择切换 */
const toggleSelect = (id) => {
  const idx = selectedClues.value.indexOf(id)
  if (idx === -1) {
    selectedClues.value.push(id)
  } else {
    selectedClues.value.splice(idx, 1)
  }
}

/** 展开/收起核验表单 */
const toggleExpand = (id) => {
  expandedClueId.value = expandedClueId.value === id ? null : id
  // 初始化表单数据
  if (!verifyForm.value[id]) {
    verifyForm.value[id] = {
      result: 'pass',
      riskLevel: 'medium',
      remark: ''
    }
  }
}

/** 设置核验结果 */
const setVerifyResult = (id, value) => {
  if (!verifyForm.value[id]) {
    verifyForm.value[id] = { result: 'pass', riskLevel: 'medium', remark: '' }
  }
  verifyForm.value[id].result = value
}

/** 设置风险等级 */
const setVerifyRisk = (id, value) => {
  if (!verifyForm.value[id]) {
    verifyForm.value[id] = { result: 'pass', riskLevel: 'medium', remark: '' }
  }
  verifyForm.value[id].riskLevel = value
}

/** 设置核验备注 */
const setVerifyRemark = (id, value) => {
  if (!verifyForm.value[id]) {
    verifyForm.value[id] = { result: 'pass', riskLevel: 'medium', remark: '' }
  }
  verifyForm.value[id].remark = value
}

/** 快速操作（直接通过/转调查） */
const handleQuickAction = (clue, action) => {
  const formData = verifyForm.value[clue.id] || { result: 'pass', riskLevel: 'medium', remark: '' }
  formData.result = action === 'pass' ? 'pass' : 'investigate'

  const newStatus = action === 'pass' ? 'resolved' : 'investigating'

  uni.showModal({
    title: '核验确认',
    content: action === 'pass'
      ? `确认核验通过「${clue.name}」？`
      : `确认将「${clue.name}」转交调查中？`,
    confirmText: '确认',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        emit('verify', {
          clue,
          status: newStatus,
          result: formData.result,
          riskLevel: formData.riskLevel,
          remark: formData.remark || (action === 'pass' ? '快速通过' : '转调查中')
        })
        expandedClueId.value = null
        uni.showToast({
          title: action === 'pass' ? '核验通过' : '已转调查中',
          icon: 'success'
        })
      }
    }
  })
}

/** 确认核验（完整表单） */
const handleSubmitVerify = (clue) => {
  const formData = verifyForm.value[clue.id]
  if (!formData) {
    uni.showToast({ title: '请选择核验结论', icon: 'none' })
    return
  }

  const resultMap = { pass: '通过', doubtful: '存疑', reject: '驳回' }
  const newStatus = formData.result === 'pass' ? 'resolved'
    : formData.result === 'reject' ? 'dismissed'
    : 'investigating'

  uni.showModal({
    title: '提交核验',
    content: `线索「${clue.name}」核验结论：${resultMap[formData.result]}，风险等级：${formData.riskLevel === 'high' ? '高' : formData.riskLevel === 'medium' ? '中' : '低'}。是否确认提交？`,
    confirmText: '确认提交',
    cancelText: '返回修改',
    success: (res) => {
      if (res.confirm) {
        emit('verify', {
          clue,
          status: newStatus,
          result: formData.result,
          riskLevel: formData.riskLevel,
          remark: formData.remark || ''
        })
        expandedClueId.value = null
        uni.showToast({ title: '核验已提交', icon: 'success' })
      }
    }
  })
}

/** 批量核验 */
const handleBatchVerify = (action) => {
  if (selectedClues.value.length === 0) return

  const actionText = { pass: '批量通过', reject: '批量驳回', investigate: '批量转调查' }
  const newStatus = action === 'pass' ? 'resolved' : action === 'reject' ? 'dismissed' : 'investigating'

  uni.showModal({
    title: actionText[action],
    content: `确认对选中的 ${selectedClues.value.length} 条线索执行「${actionText[action]}」操作？`,
    confirmText: '确认',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        const selectedClueData = props.clues.filter(c => selectedClues.value.includes(c.id))
        emit('batch-verify', {
          clues: selectedClueData,
          action,
          status: newStatus
        })
        selectedClues.value = []
        uni.showToast({ title: `${actionText[action]}成功`, icon: 'success' })
      }
    }
  })
}

/** 推送情报研判 */
const handleQuickDispatch = () => {
  const pending = pendingClues.value.length
  uni.showModal({
    title: '推送情报研判',
    content: `确认将当前 ${pending} 条待核线索推送至情报研判中心进行专题研判？`,
    confirmText: '确认推送',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        emit('dispatch', { clues: pendingClues.value })
        uni.showToast({ title: '已推送至情报研判中心', icon: 'success' })
      }
    }
  })
}

// ==================== 辅助方法 ====================
const getTypeIcon = (type) => {
  const map = {
    'live-transport': '📦'
  }
  return map[type] || '🔍'
}

const getTypeLabel = (type) => {
  const map = {
    'live-transport': '走私活物'
  }
  return map[type] || '其他线索'
}

const getRiskClass = (level) => {
  const map = { '高': 'high', '中高': 'medium', '中': 'medium', '低': 'low' }
  return map[level] || 'medium'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待核验',
    investigating: '调查中',
    resolved: '已处置',
    dismissed: '已驳回'
  }
  return texts[status] || status
}

// ==================== 动画控制 ====================
watch(() => props.visible, (val) => {
  if (val) {
    // 打开时重置状态
    setTimeout(() => { animating.value = true }, 10)
    selectedClues.value = []
    expandedClueId.value = null
  } else {
    animating.value = false
  }
})
</script>

<style lang="scss" scoped>
/* ==================== 变量 ==================== */
$primary: #00d4ff;
$primary-dark: #0090bb;
$danger: #ff4d4f;
$danger-light: rgba(255, 77, 79, 0.15);
$warning: #ffa940;
$warning-light: rgba(255, 169, 64, 0.15);
$success: #73d13d;
$success-light: rgba(115, 209, 61, 0.15);
$bg-panel: #0d1826;
$bg-card: #142436;
$bg-card-hover: #1a3048;
$bg-input: #0a1628;
$text-primary: #f3fbff;
$text-secondary: #8ca3b8;
$text-hint: #5a7a96;
$border-color: rgba(0, 212, 255, 0.2);
$border-radius: 28rpx;
$border-radius-sm: 18rpx;

/* ==================== 遮罩 ==================== */
.cvp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 18, 0.72);
  z-index: 10050;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ==================== 面板 ==================== */
.cvp-panel {
  width: 100%;
  max-width: 750rpx;
  height: 88vh;
  max-height: 88vh;
  background: $bg-panel;
  border-radius: 40rpx 40rpx 0 0;
  border: 1px solid $border-color;
  border-bottom: none;
  box-shadow: 0 -20rpx 60rpx rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(100%);
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);

  &.open {
    transform: translateY(0);
  }
}

/* ==================== 拖拽条 ==================== */
.cvp-drag-bar {
  width: 72rpx;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999rpx;
  margin: 18rpx auto 0;
  flex-shrink: 0;
}

/* ==================== 头部 ==================== */
.cvp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx 16rpx;
  flex-shrink: 0;
}

.cvp-header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.cvp-title-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cvp-title-emoji {
  font-size: 34rpx;
}

.cvp-title-group {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.cvp-title {
  font-size: 34rpx;
  font-weight: 800;
  color: $text-primary;
  letter-spacing: 1rpx;
}

.cvp-subtitle {
  font-size: 22rpx;
  color: rgba(0, 212, 255, 0.7);
  font-weight: 500;
}

.cvp-header-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.cvp-batch-toggle {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;

  &.active {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.4);
  }
}

.cvp-batch-label {
  font-size: 22rpx;
  font-weight: 600;
  color: $text-secondary;

  .cvp-batch-toggle.active & {
    color: $primary;
  }
}

.cvp-close-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;

  &:active {
    background: rgba(255, 255, 255, 0.12);
  }
}

.cvp-close-text {
  font-size: 32rpx;
  color: $text-secondary;
  font-weight: 400;
  line-height: 1;
}

/* ==================== 统计行 ==================== */
.cvp-stats-row {
  display: flex;
  gap: 10rpx;
  padding: 0 28rpx 16rpx;
  flex-shrink: 0;
}

.cvp-stat-chip {
  flex: 1;
  padding: 14rpx 8rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  border: 1px solid transparent;

  &.cvp-stat-pending {
    background: $danger-light;
    border-color: rgba(255, 77, 79, 0.25);
  }
  &.cvp-stat-investigating {
    background: $warning-light;
    border-color: rgba(255, 169, 64, 0.25);
  }
  &.cvp-stat-resolved {
    background: $success-light;
    border-color: rgba(115, 209, 61, 0.25);
  }
  &.cvp-stat-high {
    background: rgba(255, 77, 79, 0.1);
    border-color: rgba(255, 77, 79, 0.2);
  }
}

.cvp-stat-num {
  font-size: 32rpx;
  font-weight: 800;
  color: $text-primary;
}

.cvp-stat-label {
  font-size: 18rpx;
  color: $text-secondary;
  font-weight: 500;
}

.cvp-stat-pending .cvp-stat-num { color: $danger; }
.cvp-stat-investigating .cvp-stat-num { color: $warning; }
.cvp-stat-resolved .cvp-stat-num { color: $success; }
.cvp-stat-high .cvp-stat-num { color: $danger; }

/* ==================== 批量操作栏 ==================== */
.cvp-batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 28rpx;
  margin: 0 28rpx 12rpx;
  border-radius: 18rpx;
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.2);
  flex-shrink: 0;
}

.cvp-batch-info {
  display: flex;
  align-items: center;
}

.cvp-batch-count {
  font-size: 24rpx;
  font-weight: 700;
  color: $primary;
}

.cvp-batch-actions {
  display: flex;
  gap: 10rpx;
}

.cvp-batch-btn {
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 700;

  &.cvp-batch-btn-pass {
    background: $success-light;
    border: 1px solid rgba(115, 209, 61, 0.3);
    .cvp-batch-btn-text { color: $success; }
  }
  &.cvp-batch-btn-reject {
    background: $danger-light;
    border: 1px solid rgba(255, 77, 79, 0.3);
    .cvp-batch-btn-text { color: $danger; }
  }
  &.cvp-batch-btn-investigate {
    background: $warning-light;
    border: 1px solid rgba(255, 169, 64, 0.3);
    .cvp-batch-btn-text { color: $warning; }
  }
}

.cvp-batch-btn-text {
  font-size: 22rpx;
  font-weight: 700;
}

/* ==================== 列表 ==================== */
.cvp-list {
  flex: 1;
  min-height: 0;
  padding: 0 28rpx;
}

.cvp-list-bottom-space {
  height: 24rpx;
}

/* ==================== 空状态 ==================== */
.cvp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  gap: 12rpx;
}

.cvp-empty-icon {
  font-size: 72rpx;
  margin-bottom: 8rpx;
}

.cvp-empty-text {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-secondary;
}

.cvp-empty-hint {
  font-size: 22rpx;
  color: $text-hint;
}

/* ==================== 线索卡片 ==================== */
.cvp-clue-card {
  display: flex;
  gap: 14rpx;
  padding: 20rpx;
  margin-bottom: 14rpx;
  border-radius: $border-radius;
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;

  &.selected {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.35);
  }

  &:active {
    background: $bg-card-hover;
    transform: scale(0.99);
  }
}

/* ==================== 复选框 ==================== */
.cvp-clue-checkbox {
  display: flex;
  align-items: flex-start;
  padding-top: 4rpx;
}

.cvp-checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &.checked {
    background: $primary;
    border-color: $primary;
  }
}

.cvp-checkbox-check {
  font-size: 22rpx;
  color: #fff;
  font-weight: 800;
  line-height: 1;
}

/* ==================== 卡片主体 ==================== */
.cvp-clue-body {
  flex: 1;
  min-width: 0;
}

/* 卡片头部 */
.cvp-clue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.cvp-clue-type-tag {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 5rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);

  &.type-live-transport {
    background: rgba(255, 77, 79, 0.1);
    border-color: rgba(255, 77, 79, 0.25);
    .cvp-clue-type-text { color: #ff7b7f; }
  }
}

.cvp-clue-type-icon {
  font-size: 22rpx;
}

.cvp-clue-type-text {
  font-size: 20rpx;
  font-weight: 700;
  color: $primary;
}

/* 风险等级徽章 */
.cvp-clue-risk-badge {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 5rpx 12rpx;
  border-radius: 999rpx;

  &.risk-high {
    background: $danger-light;
    border: 1px solid rgba(255, 77, 79, 0.3);
    .cvp-clue-risk-dot { background: $danger; box-shadow: 0 0 6rpx rgba(255, 77, 79, 0.8); }
    .cvp-clue-risk-text { color: $danger; }
  }
  &.risk-medium {
    background: $warning-light;
    border: 1px solid rgba(255, 169, 64, 0.3);
    .cvp-clue-risk-dot { background: $warning; }
    .cvp-clue-risk-text { color: $warning; }
  }
  &.risk-low {
    background: $success-light;
    border: 1px solid rgba(115, 209, 61, 0.3);
    .cvp-clue-risk-dot { background: $success; }
    .cvp-clue-risk-text { color: $success; }
  }
}

.cvp-clue-risk-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.cvp-clue-risk-text {
  font-size: 20rpx;
  font-weight: 700;
}

/* 线索名称 */
.cvp-clue-name {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 14rpx;
  line-height: 1.4;
}

/* 卡片底部 */
.cvp-clue-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cvp-clue-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.cvp-clue-location,
.cvp-clue-time {
  font-size: 20rpx;
  color: $text-secondary;
  font-weight: 500;
}

.cvp-clue-status {
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
  font-weight: 700;

  &.status-pending {
    background: $danger-light;
    .cvp-clue-status-text { color: $danger; }
  }
  &.status-investigating {
    background: $warning-light;
    .cvp-clue-status-text { color: $warning; }
  }
  &.status-resolved {
    background: $success-light;
    .cvp-clue-status-text { color: $success; }
  }
  &.status-dismissed {
    background: rgba(140, 140, 140, 0.12);
    .cvp-clue-status-text { color: #8c8c8c; }
  }
}

.cvp-clue-status-text {
  font-size: 18rpx;
  font-weight: 700;
}

/* 展开指示器 */
.cvp-clue-expand {
  margin-top: 12rpx;
  padding-top: 10rpx;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.cvp-clue-expand-text {
  font-size: 20rpx;
  color: $primary;
  font-weight: 600;
  opacity: 0.8;
}

/* ==================== 详情与核验表单 ==================== */
.cvp-clue-detail {
  margin-top: 16rpx;
}

.cvp-detail-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin-bottom: 16rpx;
}

.cvp-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.cvp-detail-item {
  padding: 14rpx 16rpx;
  border-radius: 14rpx;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.cvp-detail-label {
  font-size: 18rpx;
  color: $text-hint;
  font-weight: 500;
}

.cvp-detail-value {
  font-size: 22rpx;
  color: $text-primary;
  font-weight: 600;
}

/* ==================== 核验表单 ==================== */
.cvp-verify-form {
  margin-top: 20rpx;
  padding: 20rpx;
  border-radius: $border-radius;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.15);
}

.cvp-verify-form-title {
  display: block;
  font-size: 24rpx;
  font-weight: 800;
  color: $primary;
  margin-bottom: 18rpx;
  letter-spacing: 1rpx;
}

.cvp-form-row {
  margin-bottom: 18rpx;

  &.cvp-form-row-remark {
    margin-bottom: 20rpx;
  }
}

.cvp-form-label {
  font-size: 20rpx;
  color: $text-secondary;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.cvp-form-radio-group {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.cvp-form-radio {
  padding: 10rpx 20rpx;
  border-radius: 12rpx;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.15s ease;

  &.selected {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.5);
    .cvp-form-radio-text { color: $primary; font-weight: 700; }
  }

  &:active {
    transform: scale(0.96);
  }

  &.cvp-form-radio-risk.selected.risk-high {
    background: $danger-light;
    border-color: rgba(255, 77, 79, 0.5);
    .cvp-form-radio-text { color: $danger; }
  }
  &.cvp-form-radio-risk.selected.risk-medium {
    background: $warning-light;
    border-color: rgba(255, 169, 64, 0.5);
    .cvp-form-radio-text { color: $warning; }
  }
  &.cvp-form-radio-risk.selected.risk-low {
    background: $success-light;
    border-color: rgba(115, 209, 61, 0.5);
    .cvp-form-radio-text { color: $success; }
  }
}

.cvp-form-radio-text {
  font-size: 22rpx;
  color: $text-secondary;
  font-weight: 600;
}

.cvp-form-textarea {
  width: 100%;
  min-height: 100rpx;
  padding: 14rpx 16rpx;
  border-radius: 14rpx;
  background: $bg-input;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 24rpx;
  color: $text-primary;
  line-height: 1.5;
  box-sizing: border-box;
}

.cvp-form-placeholder {
  color: $text-hint;
  font-size: 22rpx;
}

.cvp-form-actions {
  display: flex;
  gap: 10rpx;
}

.cvp-form-btn {
  flex: 1;
  min-height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  transition: all 0.15s ease;

  &:active {
    transform: scale(0.97);
    opacity: 0.88;
  }

  &.cvp-form-btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
    .cvp-form-btn-text { color: $text-secondary; }
  }
  &.cvp-form-btn-investigate {
    background: $warning-light;
    border-color: rgba(255, 169, 64, 0.3);
    .cvp-form-btn-text { color: $warning; }
  }
  &.cvp-form-btn-primary {
    background: linear-gradient(135deg, #0090bb, #007aaa);
    border-color: rgba(0, 212, 255, 0.4);
    .cvp-form-btn-text { color: #fff; }
  }
}

.cvp-form-btn-text {
  font-size: 24rpx;
  font-weight: 800;
}

/* ==================== 已核验区 ==================== */
.cvp-resolved-section {
  margin-top: 24rpx;
  margin-bottom: 14rpx;
}

.cvp-resolved-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.cvp-resolved-title {
  font-size: 24rpx;
  font-weight: 700;
  color: $text-secondary;
}

.cvp-resolved-arrow {
  font-size: 20rpx;
  color: $text-hint;
}

.cvp-resolved-list {
  margin-top: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.cvp-resolved-card {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.cvp-resolved-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 14rpx;
  background: rgba(115, 209, 61, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cvp-resolved-icon-text {
  font-size: 26rpx;
}

.cvp-resolved-info {
  flex: 1;
  min-width: 0;
}

.cvp-resolved-name {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cvp-resolved-meta {
  display: block;
  font-size: 18rpx;
  color: $text-hint;
  margin-top: 4rpx;
}

.cvp-resolved-badge {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
  font-weight: 700;
  flex-shrink: 0;

  &.status-investigating {
    background: $warning-light;
    .cvp-resolved-badge-text { color: $warning; }
  }
  &.status-resolved {
    background: $success-light;
    .cvp-resolved-badge-text { color: $success; }
  }
  &.status-dismissed {
    background: rgba(140, 140, 140, 0.12);
    .cvp-resolved-badge-text { color: #8c8c8c; }
  }
}

.cvp-resolved-badge-text {
  font-size: 18rpx;
  font-weight: 700;
}

/* ==================== 底部栏 ==================== */
.cvp-footer {
  padding: 16rpx 28rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
  background: rgba(8, 14, 24, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.cvp-footer-info {
  margin-bottom: 12rpx;
}

.cvp-footer-hint {
  font-size: 20rpx;
  color: $text-hint;
  text-align: center;
  display: block;
}

.cvp-footer-actions {
  display: flex;
  gap: 14rpx;
}

.cvp-footer-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:active {
    transform: scale(0.97);
    opacity: 0.88;
  }

  &.cvp-footer-btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    .cvp-footer-btn-text { color: $text-secondary; }
  }
  &.cvp-footer-btn-primary {
    background: linear-gradient(135deg, #0090bb, #007aaa);
    border: 1px solid rgba(0, 212, 255, 0.4);
    .cvp-footer-btn-text { color: #fff; }
  }
}

.cvp-footer-btn-text {
  font-size: 26rpx;
  font-weight: 800;
}
</style>
