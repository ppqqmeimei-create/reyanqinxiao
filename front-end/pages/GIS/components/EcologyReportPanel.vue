<template>
  <!-- 全屏遮罩 -->
  <view v-if="visible" class="erp-overlay" @tap="handleClose">

    <!-- 主面板 -->
    <view class="erp-panel" :class="{ open: animating }" @tap.stop>

      <!-- 拖拽指示条 -->
      <view class="erp-drag-bar"></view>

      <!-- 头部 -->
      <view class="erp-header">
        <view class="erp-header-left">
          <view class="erp-title-icon">
            <text class="erp-title-emoji">🌿</text>
          </view>
          <view class="erp-title-group">
            <text class="erp-title">异常上报</text>
            <text class="erp-subtitle">生态警务 · 态势摘要上报</text>
          </view>
        </view>
        <view class="erp-header-right">
          <view class="erp-badge">
            <text class="erp-badge-text">实时监测</text>
          </view>
          <view class="erp-close-btn" @tap="handleClose">
            <text class="erp-close-text">×</text>
          </view>
        </view>
      </view>

      <!-- 监测态势摘要 -->
      <view class="erp-summary-section">
        <view class="erp-summary-title">
          <text class="erp-summary-title-text">📡 当前监测态势摘要</text>
        </view>
        <view class="erp-summary-grid">
          <view class="erp-summary-item erp-summary-normal">
            <text class="erp-summary-num">{{ ecologyStats.normal }}</text>
            <text class="erp-summary-label">正常站点</text>
          </view>
          <view class="erp-summary-item erp-summary-warning">
            <text class="erp-summary-num">{{ ecologyStats.warning }}</text>
            <text class="erp-summary-label">预警站点</text>
          </view>
          <view class="erp-summary-item erp-summary-offline">
            <text class="erp-summary-num">{{ ecologyStats.offline }}</text>
            <text class="erp-summary-label">离线站点</text>
          </view>
          <view class="erp-summary-item erp-summary-sensor">
            <text class="erp-summary-num">{{ ecologyStats.sensor }}</text>
            <text class="erp-summary-label">物联感知</text>
          </view>
        </view>

        <!-- 预警站点列表 -->
        <view v-if="warningStations.length > 0" class="erp-warning-list">
          <view class="erp-warning-header">
            <text class="erp-warning-title">⚠️ 当前预警站点</text>
          </view>
          <view
            v-for="station in warningStations"
            :key="station.id"
            class="erp-warning-card"
          >
            <view class="erp-warning-icon">
              <text class="erp-warning-icon-text">{{ getStationEmoji(station.type) }}</text>
            </view>
            <view class="erp-warning-info">
              <text class="erp-warning-name">{{ station.name }}</text>
              <text class="erp-warning-meta">{{ station.border }} · {{ station.unit }}</text>
            </view>
            <view class="erp-warning-metrics">
              <text class="erp-warning-metric-a">{{ station.metricA }}</text>
              <text class="erp-warning-metric-b">{{ station.metricB }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 上报信息填写 -->
      <view class="erp-form-section">
        <view class="erp-form-title">
          <text class="erp-form-title-text">📝 上报信息</text>
        </view>

        <view class="erp-form-body">
          <!-- 上报类型 -->
          <view class="erp-form-row">
            <text class="erp-form-label">上报类型</text>
            <view class="erp-form-radio-group">
              <view
                v-for="type in reportTypes"
                :key="type.value"
                class="erp-form-radio"
                :class="{ selected: selectedReportType === type.value }"
                @tap="selectedReportType = type.value"
              >
                <text class="erp-form-radio-text">{{ type.label }}</text>
              </view>
            </view>
          </view>

          <!-- 关联采样 -->
          <view class="erp-form-row">
            <view class="erp-form-label-row">
              <text class="erp-form-label">关联采样</text>
              <text class="erp-form-label-hint">（选填，选中后可同步生成采样单）</text>
            </view>
            <view class="erp-sample-grid">
              <view
                v-for="sample in sampleTypes"
                :key="sample.type"
                class="erp-sample-card"
                :class="{ selected: selectedSampleType === sample.type, disabled: sampleTypeDisabled(sample.type) }"
                @tap="toggleSampleType(sample.type)"
              >
                <text class="erp-sample-icon">{{ sample.icon }}</text>
                <text class="erp-sample-name">{{ sample.label }}</text>
                <text class="erp-sample-status">{{ selectedSampleType === sample.type ? '✓ 已选' : '选填' }}</text>
              </view>
            </view>
          </view>

          <!-- 紧急程度 -->
          <view class="erp-form-row">
            <text class="erp-form-label">紧急程度</text>
            <view class="erp-form-radio-group">
              <view
                v-for="level in urgencyLevels"
                :key="level.value"
                class="erp-form-radio erp-form-radio-urgency"
                :class="['urgency-' + level.value, { selected: selectedUrgency === level.value }]"
                @tap="selectedUrgency = level.value"
              >
                <text class="erp-form-radio-text">{{ level.label }}</text>
              </view>
            </view>
          </view>

          <!-- 上报说明 -->
          <view class="erp-form-row">
            <view class="erp-form-label-row">
              <text class="erp-form-label">上报说明</text>
              <text class="erp-form-label-hint">（选填）</text>
            </view>
            <textarea
              class="erp-form-textarea"
              placeholder="请输入异常情况说明，例如：监测数据异常原因、现场态势描述等"
              placeholder-class="erp-form-placeholder"
              v-model="reportRemark"
              :maxlength="200"
            ></textarea>
            <text class="erp-form-char-count">{{ reportRemark.length }}/200</text>
          </view>
        </view>
      </view>

      <!-- 上报确认预览 -->
      <view class="erp-preview-section">
        <view class="erp-preview-title">
          <text class="erp-preview-title-text">📋 上报预览</text>
        </view>
        <view class="erp-preview-card">
          <view class="erp-preview-row">
            <text class="erp-preview-label">上报类型</text>
            <text class="erp-preview-value">{{ getReportTypeLabel }}</text>
          </view>
          <view class="erp-preview-row">
            <text class="erp-preview-label">紧急程度</text>
            <text class="erp-preview-value" :class="'urgency-text-' + selectedUrgency">{{ getUrgencyLabel }}</text>
          </view>
          <view class="erp-preview-row">
            <text class="erp-preview-label">预警站点</text>
            <text class="erp-preview-value">{{ warningStations.length }} 个</text>
          </view>
          <view class="erp-preview-row">
            <text class="erp-preview-label">关联采样</text>
            <text class="erp-preview-value" :class="{ 'has-sample': selectedSampleType !== '' }">
              {{ selectedSampleType ? getSampleLabel(selectedSampleType) : '暂无' }}
            </text>
          </view>
          <view class="erp-preview-row">
            <text class="erp-preview-label">上报时间</text>
            <text class="erp-preview-value">{{ currentTime }}</text>
          </view>
          <view v-if="reportRemark" class="erp-preview-row erp-preview-row-remark">
            <text class="erp-preview-label">备注</text>
            <text class="erp-preview-value remark">{{ reportRemark }}</text>
          </view>
        </view>
      </view>

      <!-- 底部操作 -->
      <view class="erp-footer">
        <view class="erp-footer-actions">
          <view class="erp-footer-btn erp-footer-btn-secondary" @tap="handleClose">
            <text class="erp-footer-btn-text">取消</text>
          </view>
          <view class="erp-footer-btn erp-footer-btn-primary" @tap="handleSubmit">
            <text class="erp-footer-btn-icon">📤</text>
            <text class="erp-footer-btn-text">确认上报</text>
          </view>
        </view>
      </view>

    </view>

    <!-- 提交成功弹窗 -->
    <view v-if="submitSuccess" class="erp-success-overlay" @tap="submitSuccess = false">
      <view class="erp-success-card" @tap.stop>
        <view class="erp-success-icon">✅</view>
        <text class="erp-success-title">上报成功</text>
        <text class="erp-success-code">编号：{{ submitCode }}</text>
        <text class="erp-success-desc">异常态势摘要已同步至生态警务台账</text>

        <view v-if="submitWithSample" class="erp-success-sample">
          <text class="erp-success-sample-text">已同步生成关联采样单</text>
        </view>

        <view class="erp-success-actions">
          <view v-if="submitWithSample" class="erp-success-btn" @tap="handleViewSample">
            <text class="erp-success-btn-text">查看采样单</text>
          </view>
          <view class="erp-success-btn erp-success-btn-primary" @tap="submitSuccess = false">
            <text class="erp-success-btn-text-primary">返回地图</text>
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
  ecologyStats: {
    type: Object,
    default: () => ({ normal: 0, warning: 0, offline: 0, sensor: 0 })
  },
  warningStations: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['close', 'submit', 'view-sample'])

// ==================== 状态 ====================
const animating = ref(false)
const selectedReportType = ref('daily')
const selectedSampleType = ref('')
const selectedUrgency = ref('medium')
const reportRemark = ref('')
const submitSuccess = ref(false)
const submitCode = ref('')
const submitWithSample = ref(false)

// 报告类型
const reportTypes = [
  { label: '日报', value: 'daily' },
  { label: '专报', value: 'special' },
  { label: '预警', value: 'alert' }
]

// 采样类型
const sampleTypes = [
  { label: '地表水', type: 'water', icon: '💧' },
  { label: '土壤样', type: 'soil', icon: '🌍' },
  { label: '空气站', type: 'air', icon: '🌬️' }
]

// 紧急程度
const urgencyLevels = [
  { label: '紧急', value: 'critical' },
  { label: '重要', value: 'high' },
  { label: '一般', value: 'medium' }
]

// 当前时间
const currentTime = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
})

// 标签文字
const getReportTypeLabel = computed(() => {
  const map = { daily: '日常上报', special: '专题专报', alert: '预警上报' }
  return map[selectedReportType.value]
})

const getUrgencyLabel = computed(() => {
  const map = { critical: '紧急', high: '重要', medium: '一般' }
  return map[selectedUrgency.value]
})

const getSampleLabel = (type) => {
  const map = { water: '地表水快检', soil: '土壤平行样', air: '空气微站复核' }
  return map[type] || ''
}

// 判断采样类型是否不可选
const sampleTypeDisabled = (type) => {
  // 预警站点类型和采样类型匹配时可选，否则禁用
  const warningTypes = new Set(props.warningStations.map(s => s.type))
  if (warningTypes.size === 0) return false // 无预警站点时全部可选
  // 只要有一个预警站点就可以选对应类型
  return false
}

// 切换采样类型
const toggleSampleType = (type) => {
  if (selectedSampleType.value === type) {
    selectedSampleType.value = ''
  } else {
    selectedSampleType.value = type
  }
}

// 站点图标
const getStationEmoji = (type) => {
  const map = { water: '💧', soil: '🌍', air: '🌬️', sensor: '📡', species: '🦎' }
  return map[type] || '📍'
}

// 关闭
const handleClose = () => {
  emit('close')
}

// 提交上报
const handleSubmit = () => {
  const code = `EB-${String(Date.now()).slice(-6)}`
  submitCode.value = code
  submitWithSample.value = selectedSampleType.value !== ''

  emit('submit', {
    code,
    reportType: selectedReportType.value,
    sampleType: selectedSampleType.value,
    urgency: selectedUrgency.value,
    remark: reportRemark.value,
    warningCount: props.warningStations.length,
    stationStats: props.ecologyStats
  })

  submitSuccess.value = true
}

// 查看采样单
const handleViewSample = () => {
  submitSuccess.value = false
  emit('view-sample', {
    type: selectedSampleType.value,
    code: `LY-${String(Date.now()).slice(-6)}`
  })
}

// 动画控制
watch(() => props.visible, (val) => {
  if (val) {
    // 初始化
    selectedReportType.value = 'daily'
    selectedSampleType.value = ''
    selectedUrgency.value = 'medium'
    reportRemark.value = ''
    submitSuccess.value = false
    setTimeout(() => { animating.value = true }, 10)
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
$danger-light: rgba(255, 77, 79, 0.12);
$warning: #ffa940;
$warning-light: rgba(255, 169, 64, 0.12);
$success: #73d13d;
$success-light: rgba(115, 209, 61, 0.12);
$critical: #ff4d4f;
$bg-panel: #0d1826;
$bg-card: #142436;
$bg-section: #0f1e2e;
$text-primary: #f3fbff;
$text-secondary: #8ca3b8;
$text-hint: #5a7a96;
$border-color: rgba(0, 212, 255, 0.15);

/* ==================== 遮罩 ==================== */
.erp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 18, 0.8);
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
.erp-panel {
  width: 100%;
  max-width: 750rpx;
  height: 92vh;
  background: $bg-panel;
  border-radius: 40rpx 40rpx 0 0;
  border: 1px solid $border-color;
  border-bottom: none;
  box-shadow: 0 -20rpx 60rpx rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);

  &.open {
    transform: translateY(0);
  }
}

/* ==================== 拖拽条 ==================== */
.erp-drag-bar {
  width: 72rpx;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999rpx;
  margin: 18rpx auto 0;
  flex-shrink: 0;
}

/* ==================== 头部 ==================== */
.erp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx 16rpx;
  flex-shrink: 0;
}

.erp-header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.erp-title-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.erp-title-emoji {
  font-size: 34rpx;
}

.erp-title-group {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.erp-title {
  font-size: 34rpx;
  font-weight: 800;
  color: $text-primary;
  letter-spacing: 1rpx;
}

.erp-subtitle {
  font-size: 22rpx;
  color: rgba(0, 212, 255, 0.7);
  font-weight: 500;
}

.erp-header-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.erp-badge {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.erp-badge-text {
  font-size: 20rpx;
  color: $primary;
  font-weight: 600;
}

.erp-close-btn {
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

.erp-close-text {
  font-size: 32rpx;
  color: $text-secondary;
  line-height: 1;
}

/* ==================== 监测摘要 ==================== */
.erp-summary-section {
  padding: 0 28rpx 16rpx;
  flex-shrink: 0;
}

.erp-summary-title {
  margin-bottom: 12rpx;
}

.erp-summary-title-text {
  font-size: 22rpx;
  font-weight: 700;
  color: $text-secondary;
  letter-spacing: 0.5rpx;
}

.erp-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10rpx;
  margin-bottom: 14rpx;
}

.erp-summary-item {
  padding: 14rpx 8rpx;
  border-radius: 14rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  border: 1px solid transparent;

  &.erp-summary-normal {
    background: $success-light;
    border-color: rgba(115, 209, 61, 0.2);
    .erp-summary-num { color: $success; }
  }
  &.erp-summary-warning {
    background: $warning-light;
    border-color: rgba(255, 169, 64, 0.2);
    .erp-summary-num { color: $warning; }
  }
  &.erp-summary-offline {
    background: rgba(140, 140, 140, 0.1);
    border-color: rgba(140, 140, 140, 0.2);
    .erp-summary-num { color: #8c8c8c; }
  }
  &.erp-summary-sensor {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.15);
    .erp-summary-num { color: $primary; }
  }
}

.erp-summary-num {
  font-size: 32rpx;
  font-weight: 800;
}

.erp-summary-label {
  font-size: 18rpx;
  color: $text-secondary;
  font-weight: 500;
  text-align: center;
}

/* 预警站点 */
.erp-warning-list {
  margin-top: 10rpx;
}

.erp-warning-header {
  margin-bottom: 8rpx;
}

.erp-warning-title {
  font-size: 22rpx;
  font-weight: 700;
  color: $warning;
}

.erp-warning-card {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 16rpx;
  border-radius: 14rpx;
  background: $warning-light;
  border: 1px solid rgba(255, 169, 64, 0.2);
  margin-bottom: 8rpx;
}

.erp-warning-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: rgba(255, 169, 64, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.erp-warning-icon-text {
  font-size: 24rpx;
}

.erp-warning-info {
  flex: 1;
  min-width: 0;
}

.erp-warning-name {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: $text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.erp-warning-meta {
  display: block;
  font-size: 18rpx;
  color: $text-hint;
  margin-top: 2rpx;
}

.erp-warning-metrics {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2rpx;
}

.erp-warning-metric-a,
.erp-warning-metric-b {
  font-size: 18rpx;
  color: $warning;
  font-weight: 600;
}

/* ==================== 表单区 ==================== */
.erp-form-section {
  padding: 0 28rpx 16rpx;
  flex-shrink: 0;
}

.erp-form-title {
  margin-bottom: 12rpx;
}

.erp-form-title-text {
  font-size: 24rpx;
  font-weight: 800;
  color: $text-primary;
}

.erp-form-body {
  padding: 18rpx 20rpx;
  border-radius: 20rpx;
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.erp-form-row {
  margin-bottom: 18rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.erp-form-label-row {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  margin-bottom: 10rpx;
}

.erp-form-label {
  font-size: 20rpx;
  color: $text-secondary;
  font-weight: 600;
  margin-bottom: 10rpx;
  display: block;
}

.erp-form-label-hint {
  font-size: 18rpx;
  color: $text-hint;
  font-weight: 400;
}

.erp-form-radio-group {
  display: flex;
  gap: 10rpx;
}

.erp-form-radio {
  flex: 1;
  padding: 10rpx 0;
  border-radius: 12rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &.selected {
    background: rgba(0, 212, 255, 0.12);
    border-color: rgba(0, 212, 255, 0.4);
    .erp-form-radio-text { color: $primary; font-weight: 700; }
  }

  &:active { transform: scale(0.97); }

  &.erp-form-radio-urgency {
    &.urgency-critical.selected {
      background: $danger-light;
      border-color: rgba(255, 77, 79, 0.4);
      .erp-form-radio-text { color: $danger; }
    }
    &.urgency-high.selected {
      background: $warning-light;
      border-color: rgba(255, 169, 64, 0.4);
      .erp-form-radio-text { color: $warning; }
    }
    &.urgency-medium.selected {
      background: rgba(0, 212, 255, 0.1);
      border-color: rgba(0, 212, 255, 0.3);
      .erp-form-radio-text { color: $primary; }
    }
  }
}

.erp-form-radio-text {
  font-size: 22rpx;
  color: $text-secondary;
  font-weight: 600;
}

/* 采样类型选择 */
.erp-sample-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
}

.erp-sample-card {
  padding: 14rpx 10rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  transition: all 0.15s ease;

  &.selected {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.4);
    .erp-sample-icon { transform: scale(1.15); }
    .erp-sample-name { color: $primary; }
    .erp-sample-status { color: $primary; }
  }

  &.disabled {
    opacity: 0.4;
  }

  &:active:not(.disabled) {
    transform: scale(0.97);
  }
}

.erp-sample-icon {
  font-size: 32rpx;
  transition: transform 0.15s ease;
}

.erp-sample-name {
  font-size: 22rpx;
  font-weight: 700;
  color: $text-primary;
}

.erp-sample-status {
  font-size: 18rpx;
  color: $text-hint;
  font-weight: 500;
}

/* 文本域 */
.erp-form-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 14rpx 16rpx;
  border-radius: 14rpx;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 24rpx;
  color: $text-primary;
  line-height: 1.5;
  box-sizing: border-box;
}

.erp-form-placeholder {
  color: $text-hint;
  font-size: 22rpx;
}

.erp-form-char-count {
  display: block;
  text-align: right;
  font-size: 18rpx;
  color: $text-hint;
  margin-top: 6rpx;
}

/* ==================== 预览区 ==================== */
.erp-preview-section {
  padding: 0 28rpx 16rpx;
  flex-shrink: 0;
}

.erp-preview-title {
  margin-bottom: 12rpx;
}

.erp-preview-title-text {
  font-size: 24rpx;
  font-weight: 800;
  color: $text-primary;
}

.erp-preview-card {
  padding: 18rpx 20rpx;
  border-radius: 18rpx;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.12);
}

.erp-preview-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10rpx 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }

  &.erp-preview-row-remark {
    flex-direction: column;
    gap: 6rpx;
  }
}

.erp-preview-label {
  font-size: 20rpx;
  color: $text-secondary;
  font-weight: 500;
  flex-shrink: 0;
}

.erp-preview-value {
  font-size: 22rpx;
  color: $text-primary;
  font-weight: 600;
  text-align: right;

  &.remark {
    font-size: 20rpx;
    color: $text-secondary;
    font-weight: 400;
    text-align: left;
    line-height: 1.5;
  }

  &.urgency-text-critical { color: $danger; }
  &.urgency-text-high { color: $warning; }
  &.urgency-text-medium { color: $primary; }

  &.has-sample { color: $primary; }
}

/* ==================== 底部栏 ==================== */
.erp-footer {
  padding: 16rpx 28rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
  background: rgba(8, 14, 24, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.erp-footer-actions {
  display: flex;
  gap: 14rpx;
}

.erp-footer-btn {
  flex: 1;
  height: 84rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  transition: all 0.15s ease;

  &:active {
    transform: scale(0.97);
    opacity: 0.88;
  }

  &.erp-footer-btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    .erp-footer-btn-text { color: $text-secondary; }
  }
  &.erp-footer-btn-primary {
    background: linear-gradient(135deg, #0090bb, #007aaa);
    border: 1px solid rgba(0, 212, 255, 0.4);
    .erp-footer-btn-icon { font-size: 26rpx; }
    .erp-footer-btn-text { color: #fff; }
  }
}

.erp-footer-btn-icon {
  font-size: 26rpx;
}

.erp-footer-btn-text {
  font-size: 26rpx;
  font-weight: 800;
}

/* ==================== 成功弹窗 ==================== */
.erp-success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 18, 0.85);
  z-index: 10060;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.erp-success-card {
  width: 580rpx;
  padding: 40rpx 36rpx;
  border-radius: 30rpx;
  background: linear-gradient(160deg, #0f1e30, #0c1826);
  border: 1px solid rgba(0, 212, 255, 0.25);
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.erp-success-icon {
  font-size: 72rpx;
  margin-bottom: 8rpx;
}

.erp-success-title {
  font-size: 36rpx;
  font-weight: 800;
  color: $text-primary;
}

.erp-success-code {
  font-size: 24rpx;
  color: $primary;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.erp-success-desc {
  font-size: 22rpx;
  color: $text-secondary;
  text-align: center;
  margin-bottom: 8rpx;
}

.erp-success-sample {
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.25);
}

.erp-success-sample-text {
  font-size: 22rpx;
  color: $primary;
  font-weight: 600;
}

.erp-success-actions {
  display: flex;
  gap: 14rpx;
  width: 100%;
  margin-top: 12rpx;
}

.erp-success-btn {
  flex: 1;
  height: 76rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.15s ease;

  &:active {
    transform: scale(0.97);
  }

  &.erp-success-btn-primary {
    background: linear-gradient(135deg, #0090bb, #007aaa);
    border-color: rgba(0, 212, 255, 0.4);
    .erp-success-btn-text-primary { color: #fff; font-size: 26rpx; font-weight: 800; }
  }
}

.erp-success-btn-text {
  font-size: 26rpx;
  font-weight: 700;
  color: $text-secondary;
}
</style>
