<template>
  <!-- 全屏遮罩 -->
  <view v-if="visible" class="ssp-overlay" @tap="handleClose">

    <!-- 主面板 -->
    <view class="ssp-panel" :class="{ open: animating }" @tap.stop>

      <!-- 拖拽指示条 -->
      <view class="ssp-drag-bar"></view>

      <!-- 头部 -->
      <view class="ssp-header">
        <view class="ssp-header-left">
          <view class="ssp-title-icon">
            <text class="ssp-title-emoji">🧪</text>
          </view>
          <view class="ssp-title-group">
            <text class="ssp-title">联动采样</text>
            <text class="ssp-subtitle">选择采样类型</text>
          </view>
        </view>
        <view class="ssp-close-btn" @tap="handleClose">
          <text class="ssp-close-text">×</text>
        </view>
      </view>

      <!-- 当前态势摘要 -->
      <view class="ssp-status-bar">
        <view class="ssp-status-item">
          <text class="ssp-status-num">{{ warningCount }}</text>
          <text class="ssp-status-label">预警站点</text>
        </view>
        <view class="ssp-status-sep"></view>
        <view class="ssp-status-item">
          <text class="ssp-status-num">{{ normalCount }}</text>
          <text class="ssp-status-label">正常站点</text>
        </view>
        <view class="ssp-status-sep"></view>
        <view class="ssp-status-item">
          <text class="ssp-status-num">{{ totalCount }}</text>
          <text class="ssp-status-label">监测总量</text>
        </view>
      </view>

      <!-- 采样类型选择 -->
      <view class="ssp-section-title">
        <text class="ssp-section-title-text">请选择采样类型</text>
      </view>

      <view class="ssp-options">
        <view
          v-for="(option, idx) in sampleOptions"
          :key="option.type"
          class="ssp-option-card"
          :class="{ selected: selectedType === option.type }"
          @tap="selectedType = option.type"
        >
          <!-- 单选圆圈 -->
          <view class="ssp-radio">
            <view class="ssp-radio-outer" :class="{ selected: selectedType === option.type }">
              <view v-if="selectedType === option.type" class="ssp-radio-inner"></view>
            </view>
          </view>

          <!-- 选项内容 -->
          <view class="ssp-option-content">
            <view class="ssp-option-header">
              <text class="ssp-option-icon">{{ option.icon }}</text>
              <text class="ssp-option-name">{{ option.label }}</text>
              <view class="ssp-option-badge" :class="'badge-' + option.level">
                <text class="ssp-option-badge-text">{{ option.levelText }}</text>
              </view>
            </view>
            <text class="ssp-option-desc">{{ option.desc }}</text>
            <view class="ssp-option-metrics">
              <text class="ssp-option-metric">📍 {{ option.location }}</text>
              <text class="ssp-option-metric">🏢 {{ option.unit }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作 -->
      <view class="ssp-footer">
        <view class="ssp-footer-actions">
          <view class="ssp-footer-btn ssp-footer-btn-secondary" @tap="handleClose">
            <text class="ssp-footer-btn-text">取消</text>
          </view>
          <view
            class="ssp-footer-btn ssp-footer-btn-primary"
            :class="{ disabled: selectedType === '' }"
            @tap="selectedType !== '' && handleConfirm()"
          >
            <text class="ssp-footer-btn-icon">✓</text>
            <text class="ssp-footer-btn-text">确认并生成采样单</text>
          </view>
        </view>
      </view>

    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  warningCount: {
    type: Number,
    default: 0
  },
  normalCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['close', 'confirm'])

// ==================== 状态 ====================
const animating = ref(false)
const selectedType = ref('')

const sampleOptions = [
  {
    type: 'water',
    label: '地表水快检',
    icon: '💧',
    level: 'warning',
    levelText: '建议优先',
    desc: '对界河/互市断面进行水质采样，检测 pH、氨氮、COD、溶解氧等指标',
    location: '凭祥·友谊关界河水域',
    unit: '崇左生态监测组'
  },
  {
    type: 'soil',
    label: '土壤平行样',
    icon: '🌍',
    level: 'medium',
    levelText: '常规采样',
    desc: '对口岸周边土壤进行重金属和有机质检测，排查非法倾倒污染源',
    location: '凭祥·浦寨货运周边',
    unit: '国土环监'
  },
  {
    type: 'air',
    label: '空气微站复核',
    icon: '🌬️',
    level: 'normal',
    levelText: '常规采样',
    desc: '对口岸限定区域空气进行 PM2.5、PM10、O₃ 等污染物复核监测',
    location: '凭祥·铁路口岸微站',
    unit: '生态环境局'
  }
]

// ==================== 方法 ====================
const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  const option = sampleOptions.find(o => o.type === selectedType.value)
  if (!option) return

  const code = `LY-${String(Date.now()).slice(-6)}`
  emit('confirm', { type: option.type, code, label: option.label, location: option.location })
}

// ==================== 动画控制 ====================
watch(() => props.visible, (val) => {
  if (val) {
    selectedType.value = ''
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
$warning: #ffa940;
$warning-light: rgba(255, 169, 64, 0.12);
$success: #73d13d;
$success-light: rgba(115, 209, 61, 0.12);
$danger: #ff4d4f;
$danger-light: rgba(255, 77, 79, 0.12);
$bg-panel: #0d1826;
$bg-card: #142436;
$text-primary: #f3fbff;
$text-secondary: #8ca3b8;
$text-hint: #5a7a96;
$border-color: rgba(0, 212, 255, 0.15);

/* ==================== 遮罩 ==================== */
.ssp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 18, 0.8);
  /* 高于原生 tabBar，避免被底部导航遮挡 */
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
.ssp-panel {
  width: 100%;
  max-width: 750rpx;
  height: 78vh;
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
.ssp-drag-bar {
  width: 72rpx;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999rpx;
  margin: 18rpx auto 0;
  flex-shrink: 0;
}

/* ==================== 头部 ==================== */
.ssp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx 16rpx;
  flex-shrink: 0;
}

.ssp-header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.ssp-title-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ssp-title-emoji {
  font-size: 34rpx;
}

.ssp-title-group {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.ssp-title {
  font-size: 34rpx;
  font-weight: 800;
  color: $text-primary;
  letter-spacing: 1rpx;
}

.ssp-subtitle {
  font-size: 22rpx;
  color: rgba(0, 212, 255, 0.7);
  font-weight: 500;
}

.ssp-close-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    background: rgba(255, 255, 255, 0.12);
  }
}

.ssp-close-text {
  font-size: 32rpx;
  color: $text-secondary;
}

/* ==================== 态势栏 ==================== */
.ssp-status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  padding: 12rpx 32rpx;
  margin: 0 28rpx 16rpx;
  border-radius: 16rpx;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.12);
  flex-shrink: 0;
}

.ssp-status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
}

.ssp-status-num {
  font-size: 30rpx;
  font-weight: 800;
  color: $primary;
}

.ssp-status-label {
  font-size: 18rpx;
  color: $text-secondary;
}

.ssp-status-sep {
  width: 1px;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.1);
}

/* ==================== 选项区 ==================== */
.ssp-section-title {
  padding: 0 32rpx 14rpx;
  flex-shrink: 0;
}

.ssp-section-title-text {
  font-size: 24rpx;
  font-weight: 700;
  color: $text-secondary;
}

.ssp-options {
  flex: 1;
  overflow-y: auto;
  padding: 0 28rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.ssp-option-card {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;

  &.selected {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.4);
    box-shadow: 0 0 0 2rpx rgba(0, 212, 255, 0.15);
  }

  &:active {
    transform: scale(0.99);
  }
}

/* 单选按钮 */
.ssp-radio {
  padding-top: 6rpx;
  flex-shrink: 0;
}

.ssp-radio-outer {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &.selected {
    border-color: $primary;
    background: rgba(0, 212, 255, 0.15);
  }
}

.ssp-radio-inner {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: $primary;
  box-shadow: 0 0 8rpx rgba(0, 212, 255, 0.6);
}

/* 选项内容 */
.ssp-option-content {
  flex: 1;
  min-width: 0;
}

.ssp-option-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.ssp-option-icon {
  font-size: 28rpx;
}

.ssp-option-name {
  font-size: 28rpx;
  font-weight: 800;
  color: $text-primary;
  flex: 1;
}

.ssp-option-badge {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
  font-weight: 700;

  &.badge-warning {
    background: $danger-light;
    border: 1px solid rgba(255, 77, 79, 0.25);
    .ssp-option-badge-text { color: $danger; }
  }
  &.badge-medium {
    background: $warning-light;
    border: 1px solid rgba(255, 169, 64, 0.25);
    .ssp-option-badge-text { color: $warning; }
  }
  &.badge-normal {
    background: $success-light;
    border: 1px solid rgba(115, 209, 61, 0.25);
    .ssp-option-badge-text { color: $success; }
  }
}

.ssp-option-badge-text {
  font-size: 18rpx;
  font-weight: 700;
}

.ssp-option-desc {
  display: block;
  font-size: 22rpx;
  color: $text-secondary;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.ssp-option-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.ssp-option-metric {
  font-size: 20rpx;
  color: $text-hint;
  font-weight: 500;
}

/* ==================== 底部栏 ==================== */
.ssp-footer {
  padding: 16rpx 28rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
  background: rgba(8, 14, 24, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.ssp-footer-actions {
  display: flex;
  gap: 14rpx;
}

.ssp-footer-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  transition: all 0.15s ease;

  &:active:not(.disabled) {
    transform: scale(0.97);
    opacity: 0.88;
  }

  &.ssp-footer-btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    .ssp-footer-btn-text { color: $text-secondary; }
  }

  &.ssp-footer-btn-primary {
    background: linear-gradient(135deg, #0090bb, #007aaa);
    border: 1px solid rgba(0, 212, 255, 0.4);

    .ssp-footer-btn-icon { font-size: 24rpx; color: #fff; }
    .ssp-footer-btn-text { color: #fff; font-size: 26rpx; font-weight: 800; }
  }

  &.disabled {
    opacity: 0.5;
    background: rgba(0, 150, 180, 0.3);
  }
}

.ssp-footer-btn-text {
  font-size: 26rpx;
  font-weight: 800;
}
</style>
