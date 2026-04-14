<template>
  <view class="ar-page" :class="{ 'night-mode': appStore.nightModeEnabled }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <view class="nav-title">
        <text class="title-text">AR物种识别</text>
        <text class="subtitle">Wildlife Recognition</text>
      </view>
      <view class="nav-actions">
        <view class="action-btn" @click="toggleCameraFacing">
          <text class="icon">🔄</text>
        </view>
        <view class="action-btn" @click="toggleFlash">
          <text class="icon">{{ flashOn ? '💡' : '🔦' }}</text>
        </view>
      </view>
    </view>

    <!-- 摄像头区域 -->
    <view class="camera-section">
      <!-- 摄像头组件：置于最底层作为AR背景 -->
      <camera
        id="ar-species-camera"
        v-if="showCamera"
        class="camera-component"
        :device-position="cameraFacing"
        :flash="flashOn ? 'torch' : 'off'"
        :style="{ opacity: cameraActive ? 1 : 0 }"
        @initdone="onCameraReady"
        @error="onCameraError"
      />

      <!-- AR标注画布层（叠加在camera之上） -->
      <canvas
        canvas-id="arCanvas"
        class="ar-canvas"
        :style="{ opacity: cameraActive ? 1 : 0 }"
      />

      <!-- 未开启时遮罩 -->
      <view v-if="!cameraActive" class="camera-off-overlay">
        <text class="camera-icon">📷</text>
        <text class="camera-text">点击下方按钮开启摄像头</text>
        <text class="camera-sub">对准野生动物进行识别</text>
      </view>

      <!-- AR识别框 -->
      <view v-if="cameraActive && !recognitionResult && !isProcessing" class="ar-frame">
        <view class="frame-corner top-left"></view>
        <view class="frame-corner top-right"></view>
        <view class="frame-corner bottom-left"></view>
        <view class="frame-corner bottom-right"></view>
        <view class="scan-line"></view>
      </view>

      <!-- 识别中动画 -->
      <view v-if="isProcessing" class="processing-overlay">
        <view class="processing-ring">
          <view class="ring-arc"></view>
        </view>
        <text class="processing-text">AI识别中...</text>
      </view>

      <!-- 识别结果浮层 -->
      <view v-if="recognitionResult" class="result-overlay">
        <view class="result-card" :class="'level-' + recognitionResult.protectionLevel">
          <view class="result-header">
            <view class="species-badge" :style="{ background: getProtectionColor(recognitionResult.protectionLevel) }">
              <text class="badge-icon">🐾</text>
              <text class="badge-label">{{ getProtectionLabel(recognitionResult.protectionLevel) }}</text>
            </view>
            <view class="confidence-badge" :class="getConfidenceClass(recognitionResult.confidence)">
              <text>{{ Math.round(recognitionResult.confidence * 100) }}%</text>
            </view>
          </view>

          <view class="species-info">
            <text class="species-name">{{ recognitionResult.name }}</text>
            <text class="species-latin">{{ recognitionResult.latinName }}</text>
          </view>

          <view class="result-divider"></view>

          <view class="legal-section">
            <view class="legal-row">
              <text class="legal-icon">⚖️</text>
              <text class="legal-text">{{ recognitionResult.legalBasis }}</text>
            </view>
          </view>

          <view class="handling-section">
            <view class="handling-header">
              <text class="handling-icon">📋</text>
              <text class="handling-title">处置指引</text>
            </view>
            <text class="handling-text">{{ recognitionResult.handlingProcedure }}</text>
          </view>

          <view class="action-buttons">
            <view class="action-btn secondary" @click="saveResult">
              <text>📥</text>
              <text>保存记录</text>
            </view>
            <view class="action-btn primary" @click="reportAndAct">
              <text>📡</text>
              <text>上报处置</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部控制面板 -->
    <view class="control-panel">
      <!-- 状态栏 -->
      <view class="status-bar">
        <view class="status-item">
          <view class="status-dot" :class="{ active: cameraActive }"></view>
          <text class="status-label">{{ cameraActive ? '摄像头已开启' : '摄像头已关闭' }}</text>
        </view>
        <view class="status-item">
          <text class="status-label">已识别 {{ recognitionHistory.length }} 次</text>
        </view>
      </view>

      <!-- 主要操作按钮 -->
      <view class="primary-actions">
        <view class="action-group left">
          <view class="quick-btn" @click="openGallery">
            <text class="btn-icon">🖼️</text>
            <text class="btn-label">相册</text>
          </view>
        </view>

        <view class="action-group center">
          <view
            class="capture-btn"
            :class="{ active: cameraActive }"
            @click="toggleCamera"
            @longpress="startContinuousRecognition"
            @touchend="stopContinuousRecognition"
          >
            <view class="capture-ring">
              <view class="capture-core"></view>
            </view>
          </view>
          <text class="capture-hint">{{ cameraActive ? '点击拍照识别' : '开启摄像头' }}</text>
        </view>

        <view class="action-group right">
          <view class="quick-btn" @click="openHistory">
            <text class="btn-icon">📜</text>
            <text class="btn-label">历史</text>
          </view>
        </view>
      </view>

      <!-- 物种数据库快捷查询 -->
      <view class="species-shortcuts">
        <text class="shortcut-title">快速查询</text>
        <scroll-view scroll-x class="shortcut-scroll">
          <view class="shortcut-list">
            <view
              v-for="sp in quickSearchSpecies"
              :key="sp.id"
              class="shortcut-item"
              :class="{ critical: sp.protectionLevel === 'FIRST' }"
              @click="searchSpecies(sp)"
            >
              <text class="shortcut-icon">{{ sp.icon }}</text>
              <text class="shortcut-name">{{ sp.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 历史记录弹窗 -->
    <view v-if="showHistory" class="modal-overlay" @click="showHistory = false">
      <view class="history-panel" @click.stop>
        <view class="panel-header">
          <text class="panel-title">识别历史</text>
          <text class="panel-close" @click="showHistory = false">×</text>
        </view>
        <scroll-view class="history-scroll" scroll-y>
          <view
            v-for="record in recognitionHistory"
            :key="record.id"
            class="history-item"
            @click="viewRecord(record)"
          >
            <view class="history-info">
              <text class="history-name">{{ record.speciesName }}</text>
              <text class="history-time">{{ formatTime(record.timestamp) }}</text>
            </view>
            <view class="history-confidence" :class="getConfidenceClass(record.confidence)">
              {{ Math.round(record.confidence * 100) }}%
            </view>
          </view>
          <view v-if="recognitionHistory.length === 0" class="empty-history">
            <text>暂无识别记录</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 保护等级说明弹窗 -->
    <view v-if="showProtectionGuide" class="modal-overlay" @click="showProtectionGuide = false">
      <view class="guide-panel" @click.stop>
        <view class="panel-header">
          <text class="panel-title">保护等级说明</text>
          <text class="panel-close" @click="showProtectionGuide = false">×</text>
        </view>
        <view class="guide-content">
          <view v-for="(level, key) in protectionLevels" :key="key" class="guide-item">
            <view class="guide-badge" :style="{ background: level.color }">
              {{ level.label }}
            </view>
            <view class="guide-info">
              <text class="guide-desc">{{ level.description }}</text>
              <text class="guide-basis">{{ level.legalBasis }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useSensorStore } from '../../stores/sensor.js';
import { useAppStore } from '../../stores/app.js';
import { useEvidenceStore } from '../../stores/evidence.js';
import { useSecurityStore } from '../../stores/security.js';
import { BUSINESS_CONSTANTS } from '../../utils/systemConfig.js';

const sensorStore = useSensorStore();
const appStore = useAppStore();
const evidenceStore = useEvidenceStore();
const securityStore = useSecurityStore();

const cameraActive = ref(false);
const flashOn = ref(false);
const isProcessing = ref(false);
const recognitionResult = ref(null);
const showHistory = ref(false);
const showProtectionGuide = ref(false);
const continuousMode = ref(false);

// 摄像头相关状态
const showCamera = ref(false);       // 控制camera组件渲染
const cameraFacing = ref('back');     // 'back' | 'front'
let cameraCtx = null;                // 摄像头上下文实例（由 camera bindinitdone 回调注入）
let captureTimer = null;             // 截图定时器（连续识别）
let cameraReady = false;             // camera 组件是否已完成初始化

const protectionLevels = BUSINESS_CONSTANTS.PROTECTION_LEVELS;

const recognitionHistory = computed(() => sensorStore.recentRecognitions);

const quickSearchSpecies = [
  { id: 'SP001', name: '亚洲象', icon: '🐘', protectionLevel: 'FIRST' },
  { id: 'SP002', name: '穿山甲', icon: '🦎', protectionLevel: 'FIRST' },
  { id: 'SP003', name: '白颊长臂猿', icon: '🦧', protectionLevel: 'FIRST' },
  { id: 'SP006', name: '巴西龟', icon: '🐢', protectionLevel: 'INVASIVE' },
  { id: 'SP007', name: '福寿螺', icon: '🐌', protectionLevel: 'INVASIVE' },
  { id: 'SP005', name: '眼镜王蛇', icon: '🐍', protectionLevel: 'SECOND' },
];

// ===== 摄像头权限处理 =====
async function requestCameraPermission() {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    const permission = uni.getSystemInfoSync().platform === 'ios' ? 'camera' : 'CAMERA';
    uni.getPermissionForCamera ? uni.getPermissionForCamera({
      success: () => resolve(true),
      fail: () => resolve(false),
    }) :
    uni.requestSubscribeSystemMessage ? resolve(true) :
    // 旧版 fallback：直接尝试打开摄像头，由系统弹窗授权
    resolve(true);
    // #endif

    // #ifndef APP-PLUS
    resolve(true);
    // #endif
  });
}

async function openCamera() {
  // 1. 请求权限
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    uni.showToast({ title: '请授权摄像头权限', icon: 'none' });
    return false;
  }

  // 2. 重置状态后渲染 camera（须用 @initdone 绑定，勿用 bindinitdone 字符串，否则回调永不触发）
  cameraReady = false;
  cameraCtx = null;
  showCamera.value = true;

  await nextTick();

  // 3. 等待 initdone 注入 ctx（真机可能比 400ms 慢，轮询至就绪或超时）
  const deadline = Date.now() + 8000;
  while ((!cameraReady || !cameraCtx) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!cameraReady || !cameraCtx) {
    uni.showToast({ title: '摄像头初始化超时，请重试', icon: 'none' });
    showCamera.value = false;
    return false;
  }

  return true;
}

// 小程序端 camera 初始化完成：用与组件 id 一致的上下文，避免无 id 时绑定到错误实例
function onCameraReady() {
  try {
    const create = uni.createCameraContext;
    if (typeof create !== 'function') {
      cameraReady = false;
      cameraCtx = null;
      return;
    }
    // 微信/抖音等小程序支持传入 camera 的 id；失败时降级无参
    cameraCtx = create.call(uni, 'ar-species-camera') || create.call(uni);
    cameraReady = !!cameraCtx;
    console.log('[Camera] 初始化完成，ctx 已注入');
  } catch (e) {
    console.error('[Camera] createCameraContext 失败:', e);
    cameraReady = false;
    cameraCtx = null;
  }
}

function closeCamera() {
  // 停止连续识别
  stopContinuousRecognition();

  // 停止预览
  if (cameraCtx) {
    try {
      cameraCtx.stopPreview && cameraCtx.stopPreview();
    } catch (e) {
      // ignore
    }
    cameraCtx = null;
  }
  cameraReady = false;
  showCamera.value = false;
}

// ===== 摄像头错误处理 =====
function onCameraError(e) {
  console.error('[Camera] 摄像头异常:', e);
  const errMsg = e?.detail?.errMsg || '';
  if (errMsg.includes('permission') || errMsg.includes('auth')) {
    uni.showModal({
      title: '权限不足',
      content: '摄像头权限被拒绝，请在系统设置中开启摄像头权限后重试',
      showCancel: false,
    });
  } else if (errMsg.includes('not found') || errMsg.includes('unavailable')) {
    uni.showToast({ title: '未检测到摄像头设备', icon: 'none' });
  } else {
    uni.showToast({ title: '摄像头异常，请重启应用', icon: 'none' });
  }
  // 关闭摄像头状态
  cameraActive.value = false;
  cameraReady = false;
  cameraCtx = null;
  showCamera.value = false;
}

function goBack() {
  stopCamera();
  uni.navigateBack();
}

async function toggleCamera() {
  if (cameraActive.value) {
    // 已开启 → 关闭
    stopCamera();
  } else {
    // 未开启 → 打开并自动拍照识别
    const opened = await openCamera();
    if (opened) {
      cameraActive.value = true;
      uni.vibrateShort && uni.vibrateShort();
      // 自动触发一次识别
      setTimeout(() => performCaptureAndRecognize(), 300);
    }
  }
}

function stopCamera() {
  cameraActive.value = false;
  recognitionResult.value = null;
  closeCamera();
  sensorStore.stopARRecognition();
}

function toggleFlash() {
  flashOn.value = !flashOn.value;
  // 切换闪光灯（通过修改camera组件的flash属性自动生效）
  uni.vibrateShort && uni.vibrateShort();
}

function toggleCameraFacing() {
  if (!cameraActive.value) {
    cameraFacing.value = cameraFacing.value === 'back' ? 'front' : 'back';
    uni.vibrateShort && uni.vibrateShort();
    return;
  }
  // 切换前后摄会重建 camera，需等下一次 initdone 再 takePhoto
  cameraReady = false;
  cameraCtx = null;
  cameraFacing.value = cameraFacing.value === 'back' ? 'front' : 'back';
  uni.vibrateShort && uni.vibrateShort();
  nextTick().then(async () => {
    const deadline = Date.now() + 8000;
    while ((!cameraReady || !cameraCtx) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!cameraReady) {
      uni.showToast({ title: '切换摄像头后请稍候再拍', icon: 'none' });
    }
  });
}

function startContinuousRecognition() {
  continuousMode.value = true;
  uni.vibrateLong && uni.vibrateLong();
  performCaptureAndRecognize();
}

function stopContinuousRecognition() {
  continuousMode.value = false;
  if (captureTimer) {
    clearTimeout(captureTimer);
    captureTimer = null;
  }
}

// ===== 拍照并识别 =====
async function performCaptureAndRecognize() {
  if (isProcessing.value || !cameraReady) return;

  isProcessing.value = true;
  recognitionResult.value = null;

  try {
    await captureFrame();
  } catch (e) {
    console.error('[Camera] 截图失败:', e);
  }

  try {
    await performRecognition(null);
  } finally {
    isProcessing.value = false;
  }
}

function captureFrame() {
  return new Promise((resolve) => {
    if (!cameraCtx) {
      console.warn('[Camera] ctx 未就绪，跳过截图');
      resolve();
      return;
    }

    const api = cameraCtx.takePhoto;
    if (api) {
      cameraCtx.takePhoto({
        quality: 'high',
        success: (res) => {
          console.log('[Camera] 截图成功:', res.tempImagePath);
          sensorStore.setLastCapturedImage(res.tempImagePath);
          resolve(res.tempImagePath);
        },
        fail: (err) => {
          console.error('[Camera] 截图失败:', err);
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

async function performRecognition(imageData) {
  try {
    // 传入图片路径或null（null时sensorStore使用模拟数据）
    const result = await sensorStore.recognizeSpecies(imageData);
    recognitionResult.value = result;

    // 高保护等级震动提醒
    if (result?.protectionLevel === 'FIRST') {
      uni.vibrateLong && uni.vibrateLong();
    }

    // 自动上报一级保护动物
    if (result?.protectionLevel === 'FIRST') {
      setTimeout(() => {
        autoReportCriticalSpecies(result);
      }, 1500);
    }

    // 审计记录
    if (result) {
      securityStore.recordSensitiveOperation({
        type: 'SPECIES_RECOGNITION',
        description: `识别物种: ${result.name}, 保护等级: ${result.protectionLevel}`,
        metadata: {
          speciesId: result.id,
          speciesName: result.name,
          protectionLevel: result.protectionLevel,
          confidence: result.confidence,
        },
      });
    }
  } finally {
    // 连续识别模式：2秒后继续
    if (continuousMode.value) {
      captureTimer = setTimeout(() => {
        if (cameraActive.value && continuousMode.value) {
          isProcessing.value = true;
          performCaptureAndRecognize();
        }
      }, 2000);
    }
  }
}

function autoReportCriticalSpecies(species) {
  uni.showModal({
    title: '🚨 一级保护动物已识别',
    content: `检测到【${species.name}】(${species.latinName})，保护等级：一级\n\n系统将自动上报至指挥中心，是否确认？`,
    confirmText: '确认上报',
    cancelText: '稍后处理',
    success: (res) => {
      if (res.confirm) {
        reportAndAct();
      }
    },
  });
}

function saveResult() {
  if (!recognitionResult.value) return;

  const result = recognitionResult.value;
  evidenceStore.addEvidence({
    fileName: `species_${result.id}_${Date.now()}.jpg`,
    type: 'SPECIES_RECOGNITION',
    securityLevel: result.protectionLevel === 'FIRST'
      ? BUSINESS_CONSTANTS.EVIDENCE_LEVELS.CRITICAL.level
      : BUSINESS_CONSTANTS.EVIDENCE_LEVELS.IMPORTANT.level,
    speciesInfo: {
      id: result.id,
      name: result.name,
      latinName: result.latinName,
      protectionLevel: result.protectionLevel,
    },
    confidence: result.confidence,
    location: uni.getStorageSync('current_location'),
    classification: result.protectionLevel === 'FIRST'
      ? BUSINESS_CONSTANTS.DATA_CLASSIFICATION.SECRET.level
      : BUSINESS_CONSTANTS.DATA_CLASSIFICATION.CONFIDENTIAL.level,
  });

  uni.showToast({ title: '已保存记录', icon: 'success' });
  recognitionResult.value = null;
}

function reportAndAct() {
  if (!recognitionResult.value) return;

  const result = recognitionResult.value;

  // 生成取证记录
  const evidenceId = evidenceStore.addEvidence({
    fileName: `species_${result.id}_${Date.now()}.jpg`,
    type: 'SPECIES_RECOGNITION',
    securityLevel: BUSINESS_CONSTANTS.EVIDENCE_LEVELS.CRITICAL.level,
    speciesInfo: {
      id: result.id,
      name: result.name,
      latinName: result.latinName,
      protectionLevel: result.protectionLevel,
    },
    confidence: result.confidence,
    location: uni.getStorageSync('current_location'),
    classification: BUSINESS_CONSTANTS.DATA_CLASSIFICATION.SECRET.level,
  });

  // 区块链存证
  evidenceStore.submitToBlockchain(evidenceId);

  uni.showToast({ title: '已上报指挥中心', icon: 'success' });

  // 导航到处置页面（Task 是 tabbar 页面，必须用 switchTab）
  setTimeout(() => {
    uni.switchTab({
      url: `/pages/Task/Task?action=emergency&species=${encodeURIComponent(result.name)}&level=${result.protectionLevel}`,
    });
  }, 1000);
}

function openGallery() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: async (res) => {
      if (res.tempFilePaths && res.tempFilePaths[0]) {
        isProcessing.value = true;
        recognitionResult.value = null;
        await performRecognition(res.tempFilePaths[0]);
        isProcessing.value = false;
      }
    },
    fail: () => {
      uni.showToast({ title: '请选择图片', icon: 'none' });
    },
  });
}

function openHistory() {
  showHistory.value = true;
  uni.vibrateShort && uni.vibrateShort();
}

function viewRecord(record) {
  showHistory.value = false;
  const species = sensorStore.speciesDatabase.find(s => s.id === record.speciesId);
  if (species) {
    recognitionResult.value = species;
  }
}

function searchSpecies(species) {
  // 模拟识别（不调用摄像头）
  isProcessing.value = true;
  recognitionResult.value = null;
  setTimeout(() => {
    recognitionResult.value = species;
    isProcessing.value = false;
    uni.vibrateShort && uni.vibrateShort();
  }, 1500);
}

function getProtectionColor(level) {
  return protectionLevels[level]?.color || '#52C41A';
}

function getProtectionLabel(level) {
  return protectionLevels[level]?.label || level;
}

function getConfidenceClass(confidence) {
  if (confidence >= 0.9) return 'excellent';
  if (confidence >= 0.75) return 'good';
  if (confidence >= 0.6) return 'fair';
  return 'poor';
}

function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

onMounted(() => {
  sensorStore.init();
});

onUnmounted(() => {
  stopCamera();
});
</script>

<style lang="scss" scoped>
@mixin night-mode-colors {
  --bg-color: #1A0000;
  --surface-color: #2D0000;
  --border-color: #4D0000;
  --text-color: #FF6B6B;
  --accent: #CC3333;
}

.ar-page {
  min-height: 100vh;
  background: #000;
  color: #E8F4FF;
  display: flex;
  flex-direction: column;

  &.night-mode { @include night-mode-colors; }
}

.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 60rpx 30rpx 20rpx;
  background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);

  .nav-back { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center;
    .icon { font-size: 36rpx; color: #fff; } }
  .nav-title { flex: 1; text-align: center;
    .title-text { font-size: 32rpx; font-weight: 700; color: #fff; display: block; }
    .subtitle { font-size: 20rpx; color: rgba(255,255,255,0.6); } }
  .nav-actions {
    .action-btn {
      width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.15); border-radius: 50%;
      .icon { font-size: 28rpx; }
    }
  }
}

.camera-section {
  flex: 1;
  position: relative;
  min-height: 60vh;
}

.camera-component {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transition: opacity 0.3s;
}

.ar-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.camera-off-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;

  .camera-icon { font-size: 100rpx; opacity: 0.5; }
  .camera-text { font-size: 28rpx; color: rgba(255,255,255,0.7); }
  .camera-sub { font-size: 22rpx; color: rgba(255,255,255,0.4); }
}

// AR取景框
.ar-frame {
  position: absolute;
  inset: 20%;
  z-index: 2;
  pointer-events: none;

  .frame-corner {
    position: absolute;
    width: 40rpx;
    height: 40rpx;
    border-color: #00D4FF;
    border-style: solid;
    border-width: 0;

    &.top-left { top: 0; left: 0; border-top-width: 4rpx; border-left-width: 4rpx; border-radius: 4rpx 0 0 0; }
    &.top-right { top: 0; right: 0; border-top-width: 4rpx; border-right-width: 4rpx; border-radius: 0 4rpx 0 0; }
    &.bottom-left { bottom: 0; left: 0; border-bottom-width: 4rpx; border-left-width: 4rpx; border-radius: 0 0 0 4rpx; }
    &.bottom-right { bottom: 0; right: 0; border-bottom-width: 4rpx; border-right-width: 4rpx; border-radius: 0 0 4rpx 0; }
  }

  .scan-line {
    position: absolute;
    left: 0; right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, #00D4FF, transparent);
    animation: scan 2s linear infinite;
  }
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.processing-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);

  .processing-ring {
    width: 120rpx;
    height: 120rpx;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;

    .ring-arc {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 6rpx solid rgba(0, 212, 255, 0.2);
      border-top-color: #00D4FF;
      animation: spin 1s linear infinite;
    }
  }

  .processing-text { font-size: 28rpx; color: #00D4FF; font-weight: 600; }
}

@keyframes spin { to { transform: rotate(360deg); } }

// 识别结果
.result-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 24rpx 40rpx;
}

.result-card {
  background: rgba(12, 27, 42, 0.97);
  border-radius: 24rpx;
  padding: 28rpx;
  border: 1px solid #1A3350;

  &.level-FIRST { border-color: rgba(255, 77, 79, 0.5); animation: card-pulse-red 2s infinite; }
  &.level-SECOND { border-color: rgba(255, 122, 69, 0.5); }
  &.level-INVASIVE { border-color: rgba(235, 45, 150, 0.5); }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;

    .species-badge {
      display: flex;
      align-items: center;
      gap: 8rpx;
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      .badge-icon { font-size: 24rpx; }
      .badge-label { font-size: 22rpx; color: #fff; font-weight: 600; }
    }

    .confidence-badge {
      font-size: 32rpx;
      font-weight: 800;
      &.excellent { color: #52C41A; }
      &.good { color: #73D13D; }
      &.fair { color: #FFA940; }
      &.poor { color: #FF7A45; }
    }
  }

  .species-info {
    margin-bottom: 16rpx;
    .species-name { font-size: 36rpx; font-weight: 800; color: #fff; display: block; }
    .species-latin { font-size: 24rpx; color: #7AA8CC; font-style: italic; display: block; margin-top: 4rpx; }
  }

  .result-divider { height: 1px; background: #1A3350; margin: 16rpx 0; }

  .legal-section {
    .legal-row {
      display: flex;
      align-items: center;
      gap: 10rpx;
      .legal-icon { font-size: 24rpx; }
      .legal-text { font-size: 24rpx; color: #7AA8CC; }
    }
  }

  .handling-section {
    margin-top: 16rpx;
    background: rgba(0, 212, 255, 0.05);
    border-radius: 12rpx;
    padding: 16rpx;

    .handling-header {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 8rpx;
      .handling-icon { font-size: 24rpx; }
      .handling-title { font-size: 24rpx; color: #00D4FF; font-weight: 600; }
    }
    .handling-text { font-size: 24rpx; color: #E8F4FF; line-height: 1.5; }
  }

  .action-buttons {
    display: flex;
    gap: 16rpx;
    margin-top: 20rpx;

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      padding: 18rpx 0;
      border-radius: 16rpx;
      font-size: 26rpx;
      font-weight: 600;

      &.secondary { background: #1A3350; color: #7AA8CC; }
      &.primary {
        background: linear-gradient(135deg, #FF4D4F, #FF7A45);
        color: #fff;
      }
    }
  }
}

@keyframes card-pulse-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4); }
  50% { box-shadow: 0 0 20rpx 10rpx rgba(255, 77, 79, 0.2); }
}

// 底部控制面板
.control-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(12, 27, 42, 0.98);
  backdrop-filter: blur(20px);
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1px solid #1A3350;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;

  .status-item {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .status-dot {
      width: 12rpx;
      height: 12rpx;
      border-radius: 50%;
      background: #4A6A8A;
      &.active { background: #52C41A; animation: dot-pulse 2s infinite; }
    }
    .status-label { font-size: 22rpx; color: #7AA8CC; }
  }
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.primary-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .action-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    &.left, &.right {
      .quick-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6rpx;
        padding: 16rpx 20rpx;
        background: rgba(26, 51, 80, 0.6);
        border-radius: 16rpx;
        border: 1px solid #1A3350;

        .btn-icon { font-size: 36rpx; }
        .btn-label { font-size: 20rpx; color: #7AA8CC; }
      }
    }

    &.center {
      .capture-btn {
        width: 140rpx;
        height: 140rpx;
        display: flex;
        align-items: center;
        justify-content: center;

        .capture-ring {
          width: 120rpx;
          height: 120rpx;
          border-radius: 50%;
          border: 4rpx solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;

          .capture-core {
            width: 90rpx;
            height: 90rpx;
            border-radius: 50%;
            background: #fff;
            transition: all 0.2s;
          }
        }

        &.active .capture-ring {
          border-color: #00D4FF;
          .capture-core { background: #00D4FF; }
        }
      }

      .capture-hint { font-size: 20rpx; color: #4A6A8A; margin-top: 8rpx; }
    }
  }
}

.species-shortcuts {
  .shortcut-title { font-size: 22rpx; color: #4A6A8A; display: block; margin-bottom: 12rpx; }

  .shortcut-scroll { white-space: nowrap; }

  .shortcut-list {
    display: inline-flex;
    gap: 16rpx;
  }

  .shortcut-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    padding: 16rpx 20rpx;
    background: rgba(26, 51, 80, 0.6);
    border-radius: 16rpx;
    border: 1px solid #1A3350;
    min-width: 120rpx;
    transition: all 0.2s;

    &:active { transform: scale(0.95); }

    &.critical {
      border-color: rgba(255, 77, 79, 0.4);
      background: rgba(255, 77, 79, 0.08);
    }

    .shortcut-icon { font-size: 36rpx; }
    .shortcut-name { font-size: 22rpx; color: #E8F4FF; white-space: nowrap; }
  }
}

// 历史弹窗
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}

.history-panel, .guide-panel {
  width: 100%;
  background: #0C1B2A;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 70vh;
  padding: 30rpx;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .panel-title { font-size: 30rpx; font-weight: 700; color: #E8F4FF; }
    .panel-close { font-size: 48rpx; color: #7AA8CC; }
  }
}

.history-scroll { max-height: calc(70vh - 100rpx); }

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1px solid #1A3350;

  .history-info {
    .history-name { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; }
    .history-time { font-size: 22rpx; color: #4A6A8A; }
  }

  .history-confidence {
    font-size: 28rpx;
    font-weight: 700;
    &.excellent { color: #52C41A; }
    &.good { color: #73D13D; }
    &.fair { color: #FFA940; }
    &.poor { color: #FF7A45; }
  }
}

.empty-history {
  text-align: center;
  padding: 60rpx 0;
  color: #4A6A8A;
  font-size: 26rpx;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.guide-item {
  display: flex;
  gap: 16rpx;

  .guide-badge {
    padding: 8rpx 16rpx;
    border-radius: 8rpx;
    font-size: 22rpx;
    color: #fff;
    font-weight: 600;
    white-space: nowrap;
    height: fit-content;
  }

  .guide-info {
    flex: 1;
    .guide-desc { font-size: 24rpx; color: #E8F4FF; display: block; margin-bottom: 4rpx; }
    .guide-basis { font-size: 22rpx; color: #7AA8CC; display: block; }
  }
}
</style>
