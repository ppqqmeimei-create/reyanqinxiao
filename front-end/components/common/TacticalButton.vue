<template>
  <button
    class="tactical-btn"
    :class="[
      `variant-${variant}`,
      `size-${size}`,
      { disabled, pulse: dangerPulse, holding: isHolding, armed: holdToConfirm }
    ]"
    :disabled="disabled"
    @tap="onTap"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
  >
    <view class="hold-track" v-if="holdToConfirm">
      <view class="hold-fill" :style="{ width: holdProgress + '%' }"></view>
    </view>
    <text class="btn-icon" v-if="icon">{{ icon }}</text>
    <text class="btn-text">{{ displayText }}</text>
  </button>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  icon: { type: String, default: '' },
  variant: { type: String, default: 'primary' }, // primary | danger | ghost
  size: { type: String, default: 'xl' }, // xl | lg
  disabled: { type: Boolean, default: false },
  dangerPulse: { type: Boolean, default: false },
  haptic: { type: String, default: 'short' }, // short | long | none
  holdToConfirm: { type: Boolean, default: false },
  holdMs: { type: Number, default: 1000 },
  holdHintText: { type: String, default: '' }
})

const emit = defineEmits(['click', 'confirm', 'cancel'])

const isHolding = ref(false)
const holdProgress = ref(0)
let holdTimer = null
let progressTimer = null

const displayText = computed(() => {
  if (!props.holdToConfirm) return props.text

  const sec = (props.holdMs / 1000).toFixed(1)
  const defaultHint = `按住 ${sec}s 确认执行`
  const hint = props.holdHintText || defaultHint

  if (!isHolding.value) return `${hint} · ${props.text}`
  return `执法确认中 ${Math.min(100, Math.round(holdProgress.value))}%`
})

function triggerHaptic(type) {
  if (type === 'short') uni.vibrateShort()
  if (type === 'long') uni.vibrateLong()
}

function resetHold() {
  if (holdTimer) clearTimeout(holdTimer)
  if (progressTimer) clearInterval(progressTimer)
  holdTimer = null
  progressTimer = null
  isHolding.value = false
  holdProgress.value = 0
}

function confirmAction() {
  triggerHaptic('long')
  emit('confirm')
  emit('click')
  resetHold()
}

function onTouchStart() {
  if (props.disabled || !props.holdToConfirm) return
  isHolding.value = true
  holdProgress.value = 0

  const start = Date.now()
  progressTimer = setInterval(() => {
    holdProgress.value = ((Date.now() - start) / props.holdMs) * 100
  }, 16)

  holdTimer = setTimeout(() => {
    confirmAction()
  }, props.holdMs)
}

function onTouchEnd() {
  if (!props.holdToConfirm || props.disabled) return
  if (isHolding.value && holdProgress.value < 100) {
    emit('cancel')
    triggerHaptic('short')
  }
  resetHold()
}

function onTouchCancel() {
  if (!props.holdToConfirm || props.disabled) return
  emit('cancel')
  resetHold()
}

function onTap() {
  if (props.disabled) return
  if (props.holdToConfirm) return
  triggerHaptic(props.haptic)
  emit('click')
}
</script>

<style scoped lang="scss">
/* 战术按钮核心热区 — 满足加厚手套盲操需求
   - 高度 ≥ 56px (108rpx)，宽撑满留边距
   - touch-action 外扩区域通过 padding 实现 */
.tactical-btn {
  width: 100%;
  min-height: 88rpx;
  border-radius: 20rpx;
  border: 1rpx solid rgba(0, 212, 255, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 24rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.38);
  /* 触控热区外扩：只向左/上扩展，避免遮挡右侧 cv-controls */
  margin: 0;
  padding: 0 4rpx;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

/* 外扩触控区域（不改变视觉尺寸，向左/上扩展，避免遮挡右侧 cv-controls） */
.tactical-btn::before {
	content: '';
	position: absolute;
	top: -16rpx;
	bottom: 0;
	left: -16rpx;
	right: 0;
	z-index: 0;
}

.hold-track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 8rpx;
  background: rgba(0, 212, 255, 0.18);
  z-index: 3;
}

.hold-fill {
  height: 100%;
  background: rgba(0, 212, 255, 0.86);
  transition: width 0.04s linear;
}

/* danger 按住进度条变为红色 */
.variant-danger .hold-fill {
  background: rgba(255, 77, 79, 0.9);
}

.btn-icon { font-size: 26rpx; z-index: 4; position: relative; }
.btn-text { font-size: inherit; font-weight: inherit; z-index: 4; position: relative; }

.pulse {
  animation: dangerPulse 0.8s ease-in-out infinite;
}

@keyframes dangerPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7), 0 4rpx 12rpx rgba(0,0,0,0.3);
    border-color: rgba(255, 77, 79, 0.6);
  }
  50% {
    box-shadow: 0 0 0 12rpx rgba(255, 77, 79, 0), 0 4rpx 12rpx rgba(0,0,0,0.3);
    border-color: rgba(255, 77, 79, 1);
  }
}

.size-lg { min-height: 80rpx; font-size: 22rpx; }

.variant-primary {
  background: linear-gradient(135deg, var(--brand-primary) 0%, #00A8D6 100%);
  color: #031422;
}

.variant-danger {
  background: rgba(255, 77, 79, 0.18);
  border-color: rgba(255, 77, 79, 0.6);
  color: #ffd7d8;
}

.variant-ghost {
  background: rgba(12, 27, 42, 0.86);
  color: #DDEAFF;
  border-color: rgba(0, 212, 255, 0.28);
}

.disabled {
  opacity: 0.45;
}

.btn-icon { font-size: 26rpx; z-index: 4; position: relative; }
.btn-text { font-size: inherit; font-weight: inherit; z-index: 4; position: relative; }
</style>
