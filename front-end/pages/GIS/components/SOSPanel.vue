<template>
  <view class="sos-overlay" v-if="active" @click="handleOverlayClick">
    <!-- 紧急状态全屏遮罩 -->
    <view class="sos-fullscreen" :class="stage">
      <!-- 阶段1: 倒计时触发 -->
      <view v-if="stage === 'countdown'" class="countdown-stage">
        <view class="countdown-ring" :style="{ '--progress': countdownProgress + '%' }">
          <view class="ring-inner">
            <text class="countdown-num">{{ countdownSeconds }}</text>
            <text class="countdown-label">松开取消</text>
          </view>
        </view>
        <text class="countdown-tip">长按触发紧急求援</text>
        <text class="countdown-cancel">松手将取消</text>
      </view>

      <!-- 阶段2: 发送中 -->
      <view v-if="stage === 'sending'" class="sending-stage">
        <view class="sending-animation">
          <view class="pulse-ring"></view>
          <view class="pulse-ring delay-1"></view>
          <view class="pulse-ring delay-2"></view>
          <text class="sending-icon">📡</text>
        </view>
        <text class="sending-text">正在向指挥中心发送求援信号...</text>
        <text class="sending-sub">{{ sentProgress }}%</text>
      </view>

      <!-- 阶段3: 响应确认 -->
      <view v-if="stage === 'confirmed'" class="confirmed-stage">
        <view class="confirm-icon">✓</view>
        <text class="confirm-title">求援信号已送达</text>
        <text class="confirm-sub">指挥中心已接收，正在调度救援力量</text>

        <!-- 当前位置 -->
        <view class="location-card">
          <text class="loc-icon">📍</text>
          <view class="loc-info">
            <text class="loc-label">当前位置</text>
            <text class="loc-value">{{ location.address || location.latitude + ',' + location.longitude }}</text>
          </view>
        </view>

        <!-- 救援力量 -->
        <view class="rescue-forces">
          <text class="rescue-title">正在调度</text>
          <view class="force-list">
            <view v-for="force in dispatchingForces" :key="force.id" class="force-item">
              <view class="force-badge" :style="{ background: force.color }">{{ force.icon }}</view>
              <view class="force-info">
                <text class="force-name">{{ force.dept }}</text>
                <text class="force-status">距离{{ force.distance }}km · 预计{{ force.eta }}分钟</text>
              </view>
              <view class="force-status-indicator" :class="force.status">{{ force.status === 'dispatching' ? '调度中' : '已出发' }}</view>
            </view>
          </view>
        </view>

        <!-- 应急预案 -->
        <view class="emergency-plan">
          <text class="plan-title">应急处置预案</text>
          <view class="plan-steps">
            <view v-for="(step, idx) in emergencyPlan" :key="idx" class="plan-step">
              <view class="step-num">{{ idx + 1 }}</view>
              <text class="step-text">{{ step }}</text>
            </view>
          </view>
        </view>

        <!-- 取消按钮 -->
        <view class="cancel-btn" @click="cancelSOS">
          <text>取消求援</text>
        </view>
      </view>

      <!-- 阶段4: 取消 -->
      <view v-if="stage === 'cancelled'" class="cancelled-stage" @click="close">
        <text class="cancelled-icon">✕</text>
        <text class="cancelled-text">已取消</text>
        <text class="cancelled-sub">求援信号已终止</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'sos-triggered', 'sos-cancelled']);

const active = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// 阶段: countdown | sending | confirmed | cancelled
const stage = ref('countdown');
const countdownSeconds = ref(3);
const countdownProgress = ref(0);
const location = ref({ latitude: 0, longitude: 0, address: '' });
const sentProgress = ref(0);
const dispatchingForces = ref([]);
const emergencyPlan = [
  '保持冷静，在安全区域等待救援',
  '避免激怒嫌疑人，确保自身安全',
  '保持通信畅通，服从指挥调度',
  '如可能，记录周围环境特征',
];

let countdownTimer = null;
let sendingTimer = null;

function handleOverlayClick() {
  if (stage.value === 'cancelled') {
    close();
  }
}

function startCountdown() {
  stage.value = 'countdown';
  countdownSeconds.value = 3;
  countdownProgress.value = 0;

  uni.vibrateShort && uni.vibrateShort();

  const startTime = Date.now();
  const totalDuration = 3000; // 3秒

  countdownTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalDuration - elapsed);
    countdownSeconds.value = Math.ceil(remaining / 1000);
    countdownProgress.value = Math.min(100, (elapsed / totalDuration) * 100);

    // 每秒震动
    if (remaining % 1000 < 50) {
      uni.vibrateShort && uni.vibrateShort();
    }

    if (remaining <= 0) {
      clearInterval(countdownTimer);
      triggerSOS();
    }
  }, 50);
}

function cancelCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (stage.value === 'countdown') {
    stage.value = 'cancelled';
    uni.vibrateLong && uni.vibrateLong();
    setTimeout(close, 1500);
  }
}

async function triggerSOS() {
  stage.value = 'sending';
  sentProgress.value = 0;
  uni.vibrateLong && uni.vibrateLong();

  // 获取位置
  try {
    await getCurrentLocation();
  } catch (e) {
    location.value = { latitude: 21.619, longitude: 107.914, address: '凭祥市友谊关附近（定位失败，使用默认）' };
  }

  // 模拟发送进度
  return new Promise((resolve) => {
    let progress = 0;
    sendingTimer = setInterval(() => {
      progress += Math.random() * 15 + 5;
      sentProgress.value = Math.min(Math.round(progress), 100);

      if (progress >= 100) {
        clearInterval(sendingTimer);
        resolve();
      }
    }, 150);
  }).then(() => {
    // 模拟调度救援力量
    dispatchingForces.value = [
      { id: 1, dept: '边境管理支队', icon: '🚔', color: '#1890FF', distance: 1.2, eta: 8, status: 'dispatching' },
      { id: 2, dept: '森林警察大队', icon: '🌲', color: '#52C41A', distance: 2.5, eta: 12, status: 'dispatching' },
      { id: 3, dept: '地方公安边防', icon: '👮', color: '#FA8C16', distance: 3.8, eta: 18, status: 'standby' },
    ];

    stage.value = 'confirmed';
    emit('sos-triggered', {
      location: location.value,
      timestamp: new Date().toISOString(),
      forces: dispatchingForces.value,
    });

    uni.vibratePattern && uni.vibratePattern([200, 100, 200, 100, 400]);
  });
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        location.value = {
          latitude: res.latitude,
          longitude: res.longitude,
          address: '正在获取地址...',
        };
        // 逆地址解析（模拟）
        setTimeout(() => {
          location.value.address = '广西壮族自治区凭祥市友谊镇';
          resolve(res);
        }, 500);
      },
      fail: reject,
    });
  });
}

function cancelSOS() {
  uni.vibrateShort && uni.vibrateShort();
  uni.showModal({
    title: '确认取消求援',
    content: '确定要取消当前求援吗？',
    success: (res) => {
      if (res.confirm) {
        stage.value = 'cancelled';
        emit('sos-cancelled');
        uni.vibrateLong && uni.vibrateLong();
        setTimeout(close, 1500);
      }
    },
  });
}

function close() {
  active.value = false;
  if (countdownTimer) clearInterval(countdownTimer);
  if (sendingTimer) clearInterval(sendingTimer);
  stage.value = 'countdown';
  countdownSeconds.value = 3;
  countdownProgress.value = 0;
  sentProgress.value = 0;
  dispatchingForces.value = [];
}

// 暴露方法供外部调用
defineExpose({
  startCountdown,
  cancelCountdown,
  open: () => {
    active.value = true;
    startCountdown();
  },
});

// 监听取消
watch(active, (val) => {
  if (!val) {
    cancelCountdown();
  }
});
</script>

<style lang="scss" scoped>
.sos-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.sos-fullscreen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background 0.5s;

  &.countdown {
    background: rgba(255, 77, 79, 0.9);
  }

  &.sending {
    background: rgba(255, 122, 69, 0.9);
  }

  &.confirmed {
    background: linear-gradient(180deg, rgba(255, 77, 79, 0.95) 0%, rgba(12, 27, 42, 0.98) 40%);
  }

  &.cancelled {
    background: rgba(12, 27, 42, 0.98);
  }
}

// 倒计时阶段
.countdown-stage {
  text-align: center;
  color: #fff;

  .countdown-ring {
    width: 320rpx;
    height: 320rpx;
    border-radius: 50%;
    background: conic-gradient(
      rgba(255, 255, 255, 0.3) var(--progress),
      rgba(255, 255, 255, 0.1) var(--progress)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 60rpx;
    animation: ring-pulse 1s infinite;

    .ring-inner {
      width: 260rpx;
      height: 260rpx;
      background: rgba(255, 77, 79, 0.9);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .countdown-num { font-size: 120rpx; font-weight: 900; line-height: 1; }
    .countdown-label { font-size: 26rpx; color: rgba(255, 255, 255, 0.8); margin-top: 8rpx; }
  }

  .countdown-tip { font-size: 36rpx; font-weight: 700; color: #fff; display: block; margin-bottom: 16rpx; }
  .countdown-cancel { font-size: 26rpx; color: rgba(255, 255, 255, 0.7); display: block; }
}

@keyframes ring-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
  50% { box-shadow: 0 0 0 30rpx rgba(255, 255, 255, 0); }
}

// 发送阶段
.sending-stage {
  text-align: center;
  color: #fff;

  .sending-animation {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 60rpx;

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 4rpx solid rgba(255, 255, 255, 0.4);
      animation: pulse-out 2s infinite;

      &.delay-1 { animation-delay: 0.5s; }
      &.delay-2 { animation-delay: 1s; }
    }

    .sending-icon { font-size: 80rpx; z-index: 1; }
  }

  .sending-text { font-size: 32rpx; font-weight: 600; display: block; margin-bottom: 20rpx; }
  .sending-sub { font-size: 72rpx; font-weight: 900; }
}

@keyframes pulse-out {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

// 确认阶段
.confirmed-stage {
  width: 100%;
  padding: 60rpx 40rpx;
  text-align: center;
  color: #fff;

  .confirm-icon {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: rgba(82, 196, 26, 0.3);
    border: 4rpx solid #52C41A;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    color: #52C41A;
    margin: 0 auto 24rpx;
  }

  .confirm-title { font-size: 36rpx; font-weight: 700; color: #fff; display: block; margin-bottom: 12rpx; }
  .confirm-sub { font-size: 26rpx; color: rgba(255, 255, 255, 0.7); display: block; margin-bottom: 40rpx; }
}

.location-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 40rpx;
  text-align: left;

  .loc-icon { font-size: 40rpx; }
  .loc-info { flex: 1; }
  .loc-label { font-size: 22rpx; color: rgba(255, 255, 255, 0.6); display: block; margin-bottom: 4rpx; }
  .loc-value { font-size: 26rpx; color: #fff; font-weight: 500; }
}

.rescue-forces {
  text-align: left;
  margin-bottom: 30rpx;

  .rescue-title { font-size: 26rpx; color: rgba(255, 255, 255, 0.6); display: block; margin-bottom: 16rpx; }

  .force-list { display: flex; flex-direction: column; gap: 12rpx; }

  .force-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12rpx;
    padding: 16rpx 20rpx;

    .force-badge { width: 60rpx; height: 60rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 32rpx; }
    .force-info { flex: 1; text-align: left; }
    .force-name { font-size: 26rpx; font-weight: 600; color: #fff; display: block; }
    .force-status { font-size: 22rpx; color: rgba(255, 255, 255, 0.6); }
    .force-status-indicator {
      font-size: 20rpx;
      padding: 4rpx 12rpx;
      border-radius: 8rpx;
      &.dispatching { background: rgba(255, 169, 64, 0.2); color: #FFA940; }
    }
  }
}

.emergency-plan {
  background: rgba(12, 27, 42, 0.8);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 40rpx;
  text-align: left;

  .plan-title { font-size: 26rpx; color: #FFA940; font-weight: 600; display: block; margin-bottom: 16rpx; }

  .plan-steps { display: flex; flex-direction: column; gap: 12rpx; }

  .plan-step {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;

    .step-num {
      width: 36rpx;
      height: 36rpx;
      border-radius: 50%;
      background: rgba(255, 169, 64, 0.2);
      border: 1px solid #FFA940;
      color: #FFA940;
      font-size: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2rpx;
    }

    .step-text { font-size: 24rpx; color: rgba(255, 255, 255, 0.85); line-height: 1.5; }
  }
}

.cancel-btn {
  width: 300rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.15);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);

  &:active { background: rgba(255, 255, 255, 0.25); }
}

// 取消阶段
.cancelled-stage {
  text-align: center;
  color: #fff;

  .cancelled-icon { font-size: 120rpx; display: block; margin-bottom: 24rpx; }
  .cancelled-text { font-size: 40rpx; font-weight: 700; display: block; margin-bottom: 12rpx; }
  .cancelled-sub { font-size: 26rpx; color: rgba(255, 255, 255, 0.6); display: block; }
}
</style>
