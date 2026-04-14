<template>
  <view class="operation-mode-page" :class="{ 'night-mode': appStore.nightModeEnabled }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <view class="nav-title">
        <text class="title-text">单手操作模式</text>
        <text class="subtitle">Single-Hand Operation</text>
      </view>
    </view>

    <scroll-view class="main-scroll" scroll-y>
      <!-- 模式总开关 -->
      <view class="mode-toggle-section">
        <view class="mode-card primary">
          <view class="mode-header">
            <view class="mode-icon">👋</view>
            <view class="mode-info">
              <text class="mode-title">单手操作模式</text>
              <text class="mode-desc">优化界面布局，单手即可完成所有操作</text>
            </view>
            <switch
              :checked="appStore.singleHandMode"
              color="#00D4FF"
              @change="onSingleHandToggle"
            />
          </view>
        </view>
      </view>

      <!-- 操作偏好 -->
      <view class="preference-section">
        <text class="section-label">操作偏好</text>

        <view class="pref-item">
          <view class="pref-info">
            <text class="pref-title">惯用手</text>
            <text class="pref-desc">选择主要使用的手</text>
          </view>
          <view class="pref-selector">
            <view
              class="selector-btn"
              :class="{ active: settings.dominantHand === 'left' }"
              @click="updateSetting('dominantHand', 'left')"
            >
              <text>🤚 左手</text>
            </view>
            <view
              class="selector-btn"
              :class="{ active: settings.dominantHand === 'right' }"
              @click="updateSetting('dominantHand', 'right')"
            >
              <text>🤝 右手</text>
            </view>
          </view>
        </view>

        <view class="pref-item">
          <view class="pref-info">
            <text class="pref-title">触控灵敏度</text>
            <text class="pref-desc">调整触控反馈强度</text>
          </view>
          <view class="sensitivity-slider">
            <text class="slider-label">低</text>
            <slider
              :min="1"
              :max="3"
              :value="settings.touchSensitivity"
              :show-value="false"
              active-color="#00D4FF"
              background-color="#1A3350"
              block-size="24"
              @change="onSensitivityChange"
            />
            <text class="slider-label">高</text>
          </view>
        </view>

        <view class="pref-item">
          <view class="pref-info">
            <text class="pref-title">滑动手势</text>
            <text class="pref-desc">单手滑动手势快捷操作</text>
          </view>
          <switch :checked="settings.swipeGestures" color="#00D4FF" @change="onSwipeToggle" />
        </view>
      </view>

      <!-- 界面布局 -->
      <view class="layout-section">
        <text class="section-label">界面布局</text>

        <view class="layout-options">
          <view
            v-for="layout in layoutOptions"
            :key="layout.key"
            class="layout-card"
            :class="{ active: settings.layout === layout.key }"
            @click="updateSetting('layout', layout.key)"
          >
            <view class="layout-preview">
              <view class="preview-header" :style="{ background: layout.headerColor }"></view>
              <view class="preview-body">
                <view class="preview-sidebar" v-if="layout.sidebar" :style="{ background: layout.sidebarColor }"></view>
                <view class="preview-content">
                  <view v-for="i in layout.items" :key="i" class="preview-item" :style="{ width: layout.itemWidth }"></view>
                </view>
              </view>
            </view>
            <text class="layout-name">{{ layout.name }}</text>
            <text class="layout-desc">{{ layout.desc }}</text>
            <view v-if="settings.layout === layout.key" class="layout-check">
              <text>✓</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 触控热区优化 -->
      <view class="touch-zone-section">
        <text class="section-label">触控热区优化</text>
        <text class="section-hint">将常用操作移至单手可达区域</text>

        <view class="touch-preview" :class="{ 'left-hand': settings.dominantHand === 'left' }">
          <view class="phone-outline">
            <view class="phone-notch"></view>
            <view class="phone-screen">
              <!-- 主要操作区 -->
              <view class="zone primary-zone">
                <text class="zone-label">主要操作区</text>
                <text class="zone-hint">拇指舒适区</text>
              </view>
              <!-- 次要操作区 -->
              <view class="zone secondary-zone">
                <text class="zone-label">次要操作区</text>
              </view>
              <!-- 困难区 -->
              <view class="zone danger-zone">
                <text class="zone-label">困难区</text>
                <text class="zone-hint">需伸展</text>
              </view>
            </view>
          </view>

          <view class="zone-legend">
            <view class="legend-item">
              <view class="legend-dot" style="background:#52C41A;"></view>
              <text>单手可达 (0-200px)</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot" style="background:#FFA940;"></view>
              <text>需轻微移动 (200-350px)</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot" style="background:#FF4D4F;"></view>
              <text>需伸展 (>350px)</text>
            </view>
          </view>
        </view>

        <!-- 自动优化开关 -->
        <view class="auto-opt-item">
          <view class="pref-info">
            <text class="pref-title">自动优化触控热区</text>
            <text class="pref-desc">根据惯用手自动调整界面元素位置</text>
          </view>
          <switch :checked="settings.autoOptimizeTouchZone" color="#00D4FF" @change="onAutoOptToggle" />
        </view>
      </view>

      <!-- 按钮尺寸 -->
      <view class="button-size-section">
        <text class="section-label">按钮与触控目标</text>

        <view class="size-preview">
          <view class="size-slider">
            <text class="size-label">按钮尺寸</text>
            <view class="size-options">
              <view
                v-for="size in buttonSizes"
                :key="size.key"
                class="size-btn"
                :class="{ active: settings.buttonSize === size.key }"
                @click="updateSetting('buttonSize', size.key)"
              >
                <view class="size-demo" :style="{ width: size.value + 'px', height: size.value * 0.6 + 'px' }"></view>
                <text>{{ size.label }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="pref-item">
          <view class="pref-info">
            <text class="pref-title">触控反馈震动</text>
            <text class="pref-desc">操作时提供触觉反馈</text>
          </view>
          <switch :checked="settings.tactileFeedback" color="#00D4FF" @change="onTactileToggle" />
        </view>
      </view>

      <!-- 手套模式 -->
      <view class="glove-section">
        <text class="section-label">手套触控模式</text>
        <text class="section-hint">佩戴手套时的触控优化（放大触控区域）</text>

        <view class="glove-card" :class="{ active: appStore.gloveTouchMode }">
          <view class="glove-header">
            <view class="glove-icon">🧤</view>
            <view class="glove-info">
              <text class="glove-title">手套触控模式</text>
              <text class="glove-desc">触控区域放大150%，适合冬季或防护手套</text>
            </view>
            <switch :checked="appStore.gloveTouchMode" color="#00D4FF" @change="onGloveToggle" />
          </view>

          <view v-if="appStore.gloveTouchMode" class="glove-settings">
            <view class="glove-slider-item">
              <text class="glove-slider-label">触控区域放大倍数</text>
              <view class="glove-slider">
                <slider
                  :min="100"
                  :max="200"
                  :value="appStore.gloveTouchScale * 100"
                  :show-value="true"
                  active-color="#00D4FF"
                  background-color="#1A3350"
                  block-size="20"
                  @change="onGloveScaleChange"
                />
                <text class="slider-unit">%</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 任务全屏导航 -->
      <view class="task-nav-section">
        <text class="section-label">任务全屏导航</text>
        <text class="section-hint">执法任务执行时的极简全屏模式</text>

        <view class="task-nav-card" :class="{ active: appStore.fullscreenTaskMode }">
          <view class="task-nav-header">
            <text class="task-nav-title">任务全屏模式</text>
            <switch :checked="appStore.fullscreenTaskMode" color="#00D4FF" @change="onFullscreenToggle" />
          </view>

          <view v-if="appStore.fullscreenTaskMode" class="task-nav-settings">
            <text class="task-nav-subtitle">显示元素</text>
            <view class="task-element-list">
              <view
                v-for="elem in taskElements"
                :key="elem.key"
                class="task-element-item"
                :class="{ enabled: settings.taskNavElements[elem.key] }"
                @click="toggleTaskElement(elem.key)"
              >
                <view class="elem-icon">{{ elem.icon }}</view>
                <text class="elem-name">{{ elem.name }}</text>
                <text class="elem-toggle">{{ settings.taskNavElements[elem.key] ? '显示' : '隐藏' }}</text>
              </view>
            </view>

            <view class="task-nav-actions">
              <view class="preview-btn" @click="previewFullscreen">
                <text>👁️</text>
                <text>预览效果</text>
              </view>
              <view class="enter-btn" @click="enterFullscreenTask">
                <text>🎯</text>
                <text>进入任务导航</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 保存按钮 -->
      <view class="save-section">
        <view class="save-btn" @click="saveSettings">
          <text>💾</text>
          <text>保存配置</text>
        </view>
        <view class="reset-btn" @click="resetSettings">
          <text>🔄</text>
          <text>恢复默认</text>
        </view>
      </view>
    </scroll-view>

    <!-- 全屏任务导航预览 -->
    <view v-if="showFullscreenPreview" class="fullscreen-preview-overlay" @click="showFullscreenPreview = false">
      <view class="preview-phone" @click.stop>
        <view class="preview-header-bar">
          <text class="preview-title">{{ settings.taskNavElements.alert ? '🚨 预警' : '' }}</text>
          <text class="preview-title">{{ settings.taskNavElements.location ? '📍 凭祥市' : '' }}</text>
        </view>

        <view class="preview-content-area">
          <view class="preview-task-info">
            <text class="preview-task-name">任务：野生动物走私拦截</text>
            <text class="preview-task-desc">目标位置：友谊关卡口东北2km</text>
          </view>

          <view class="preview-action-center">
            <view class="preview-main-btn">
              <text class="btn-icon">📡</text>
              <text>上报</text>
            </view>
          </view>
        </view>

        <view class="preview-footer-bar">
          <view class="preview-nav-btn">
            <text>📋</text>
            <text>{{ settings.taskNavElements.task ? '任务' : '' }}</text>
          </view>
          <view class="preview-nav-btn active">
            <text>🎯</text>
            <text>{{ settings.taskNavElements.map ? '地图' : '' }}</text>
          </view>
          <view class="preview-nav-btn">
            <text>🆘</text>
            <text>{{ settings.taskNavElements.sos ? 'SOS' : '' }}</text>
          </view>
        </view>

        <view class="preview-exit">
          <text @click="showFullscreenPreview = false">点击退出预览</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAppStore } from '../../stores/app.js';

const appStore = useAppStore();

const showFullscreenPreview = ref(false);

const settings = reactive({
  dominantHand: appStore.dominantHand || 'right',
  touchSensitivity: appStore.touchSensitivity || 2,
  swipeGestures: appStore.swipeGestures ?? true,
  layout: appStore.layout || 'bottom',
  buttonSize: appStore.buttonSize || 'medium',
  autoOptimizeTouchZone: appStore.autoOptimizeTouchZone ?? true,
  tactileFeedback: appStore.tactileFeedback ?? true,
  taskNavElements: {
    alert: true,
    location: true,
    map: true,
    task: true,
    sos: true,
  },
});

const layoutOptions = [
  {
    key: 'bottom',
    name: '底部布局',
    desc: '主要操作在底部',
    headerColor: '#1A3350',
    sidebar: false,
    items: 3,
    itemWidth: '100%',
  },
  {
    key: 'left',
    name: '左侧布局',
    desc: '常用功能在左侧',
    headerColor: '#1A3350',
    sidebar: true,
    sidebarColor: '#722ED1',
    items: 2,
    itemWidth: '45%',
  },
  {
    key: 'compact',
    name: '紧凑布局',
    desc: '缩小间距，更多内容',
    headerColor: '#1A3350',
    sidebar: false,
    items: 4,
    itemWidth: '100%',
  },
];

const buttonSizes = [
  { key: 'small', label: '标准', value: 44 },
  { key: 'medium', label: '中', value: 56 },
  { key: 'large', label: '大', value: 72 },
];

const taskElements = [
  { key: 'alert', name: '预警提示', icon: '🚨' },
  { key: 'location', name: '位置信息', icon: '📍' },
  { key: 'map', name: '地图视图', icon: '🗺️' },
  { key: 'task', name: '任务信息', icon: '📋' },
  { key: 'sos', name: 'SOS按钮', icon: '🆘' },
];

function goBack() {
  uni.navigateBack();
}

function onSingleHandToggle(e) {
  appStore.setSingleHandMode(e.detail.value);
  uni.vibrateShort && uni.vibrateShort();
}

function updateSetting(key, value) {
  settings[key] = value;

  // 使用 appStore 的 setter 方法同步持久化（key → setter 映射）
  const setters = {
    dominantHand:         appStore.setDominantHand,
    touchSensitivity:     appStore.setTouchSensitivity,
    swipeGestures:        appStore.setSwipeGestures,
    layout:               appStore.setLayout,
    buttonSize:           appStore.setButtonSize,
    autoOptimizeTouchZone: appStore.setAutoOptimizeTouchZone,
    tactileFeedback:      appStore.setTactileFeedback,
  }
  const setter = setters[key]
  if (setter) {
    setter(value)
  } else {
    // 兜底：直接赋值
    appStore[key] = value
  }

  uni.vibrateShort && uni.vibrateShort()
}

function onSensitivityChange(e) {
  settings.touchSensitivity = e.detail.value;
  appStore.setTouchSensitivity(e.detail.value);
}

function onSwipeToggle(e) {
  settings.swipeGestures = e.detail.value;
  appStore.setSwipeGestures(e.detail.value);
}

function onAutoOptToggle(e) {
  settings.autoOptimizeTouchZone = e.detail.value;
  appStore.setAutoOptimizeTouchZone(e.detail.value);
}

function onTactileToggle(e) {
  settings.tactileFeedback = e.detail.value;
  appStore.setTactileFeedback(e.detail.value);
}

function onGloveToggle(e) {
  appStore.setGloveTouchMode(e.detail.value);
  uni.vibrateShort && uni.vibrateShort();
}

function onGloveScaleChange(e) {
  appStore.setGloveTouchScale(e.detail.value / 100);
}

function onFullscreenToggle(e) {
  appStore.setFullscreenTaskMode(e.detail.value);
}

function toggleTaskElement(key) {
  settings.taskNavElements[key] = !settings.taskNavElements[key];
  uni.vibrateShort && uni.vibrateShort();
}

function previewFullscreen() {
  showFullscreenPreview.value = true;
}

function enterFullscreenTask() {
  appStore.setFullscreenTaskMode(true);
  uni.showToast({ title: '进入任务导航模式', icon: 'success' });
  setTimeout(() => {
    uni.navigateTo({ url: '/pages/Task/Task?mode=fullscreen' });
  }, 500);
}

function saveSettings() {
  uni.setStorageSync('single_hand_settings', JSON.stringify(settings));
  uni.showToast({ title: '配置已保存', icon: 'success' });
  uni.vibrateShort && uni.vibrateShort();
}

function resetSettings() {
  uni.showModal({
    title: '恢复默认',
    content: '确定要恢复所有设置为默认值吗？',
    success: (res) => {
      if (res.confirm) {
        settings.dominantHand = 'right';
        settings.touchSensitivity = 2;
        settings.swipeGestures = true;
        settings.layout = 'bottom';
        settings.buttonSize = 'medium';
        settings.autoOptimizeTouchZone = true;
        settings.tactileFeedback = true;
        settings.taskNavElements = {
          alert: true, location: true, map: true, task: true, sos: true,
        };
        // 同步到全局 store 与本地存储，避免「界面改了但实际未生效」
        appStore.setDominantHand('right');
        appStore.setTouchSensitivity(2);
        appStore.setSwipeGestures(true);
        appStore.setLayout('bottom');
        appStore.setButtonSize('medium');
        appStore.setAutoOptimizeTouchZone(true);
        appStore.setTactileFeedback(true);
        uni.removeStorageSync('single_hand_settings');
        uni.showToast({ title: '已恢复默认', icon: 'success' });
      }
    },
  });
}
</script>

<style lang="scss" scoped>
@mixin night-mode-colors {
  --bg: #1A0000;
  --surface: #2D0000;
  --border: #4D0000;
}

.operation-mode-page {
  min-height: 100vh;
  background: #060A14;
  color: #E8F4FF;
  padding-bottom: 60rpx;

  &.night-mode { @include night-mode-colors; }
}

.nav-header {
  display: flex;
  align-items: center;
  padding: 60rpx 30rpx 20rpx;
  background: linear-gradient(180deg, #0C1B2A 0%, #060A14 100%);
  border-bottom: 1px solid #1A3350;

  .nav-back { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center;
    .icon { font-size: 36rpx; color: #00D4FF; } }
  .nav-title { flex: 1; text-align: center;
    .title-text { font-size: 34rpx; font-weight: 700; color: #E8F4FF; display: block; }
    .subtitle { font-size: 20rpx; color: #7AA8CC; } }
}

.main-scroll {
  height: calc(100vh - 160rpx);
  padding: 0 30rpx;
}

.mode-toggle-section {
  margin-bottom: 30rpx;

  .mode-card {
    background: #0C1B2A;
    border-radius: 20rpx;
    padding: 24rpx;
    border: 1px solid #1A3350;

    &.primary {
      border-color: rgba(0, 212, 255, 0.3);
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(0, 122, 255, 0.05) 100%);
    }

    .mode-header { display: flex; align-items: center; gap: 16rpx; }
    .mode-icon { font-size: 60rpx; }
    .mode-info { flex: 1; .mode-title { font-size: 30rpx; font-weight: 700; color: #E8F4FF; display: block; } .mode-desc { font-size: 22rpx; color: #7AA8CC; display: block; margin-top: 4rpx; } }
  }
}

.section-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #7AA8CC;
  display: block;
  margin-bottom: 16rpx;
  margin-top: 30rpx;
}

.section-hint {
  font-size: 22rpx;
  color: #4A6A8A;
  display: block;
  margin-bottom: 16rpx;
  margin-top: -10rpx;
}

// 操作偏好
.preference-section {
  .pref-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 20rpx;
    border: 1px solid #1A3350;
    margin-bottom: 12rpx;

    .pref-info {
      flex: 1;
      .pref-title { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; }
      .pref-desc { font-size: 22rpx; color: #7AA8CC; display: block; margin-top: 4rpx; }
    }

    .pref-selector {
      display: flex;
      gap: 10rpx;
      .selector-btn {
        padding: 10rpx 20rpx;
        border-radius: 10rpx;
        background: #060A14;
        border: 1px solid #1A3350;
        font-size: 24rpx;
        color: #7AA8CC;
        transition: all 0.2s;
        &.active { border-color: #00D4FF; background: rgba(0, 212, 255, 0.1); color: #00D4FF; }
      }
    }

    .sensitivity-slider {
      display: flex;
      align-items: center;
      gap: 12rpx;
      width: 280rpx;
      .slider-label { font-size: 20rpx; color: #7AA8CC; }
    }
  }
}

// 布局选项
.layout-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.layout-card {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 16rpx;
  border: 2px solid #1A3350;
  text-align: center;
  position: relative;
  transition: all 0.2s;

  &:active { transform: scale(0.97); }

  &.active { border-color: #00D4FF; }

  .layout-preview {
    height: 120rpx;
    border-radius: 8rpx;
    overflow: hidden;
    margin-bottom: 10rpx;

    .preview-header { height: 24rpx; }
    .preview-body { display: flex; height: 96rpx; }
    .preview-sidebar { width: 20%; height: 100%; }
    .preview-content { flex: 1; padding: 8rpx; display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
    .preview-item { height: 20rpx; border-radius: 4rpx; background: rgba(0, 212, 255, 0.4); }
  }

  .layout-name { font-size: 22rpx; font-weight: 600; color: #E8F4FF; display: block; }
  .layout-desc { font-size: 18rpx; color: #7AA8CC; display: block; margin-top: 4rpx; }

  .layout-check {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 36rpx;
    height: 36rpx;
    background: #00D4FF;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
    color: #fff;
  }
}

// 触控热区
.touch-preview {
  background: #0C1B2A;
  border-radius: 20rpx;
  padding: 24rpx;
  border: 1px solid #1A3350;
  margin-bottom: 16rpx;

  .phone-outline {
    width: 160px;
    height: 300px;
    border: 3px solid #1A3350;
    border-radius: 20px;
    margin: 0 auto 20rpx;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;

    .phone-notch {
      height: 20px;
      background: #1A3350;
    }

    .phone-screen {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
    }
  }

  .zone {
    position: absolute;
    bottom: 0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4px;

    .zone-label { font-size: 8px; color: #fff; font-weight: 600; }
    .zone-hint { font-size: 6px; color: rgba(255,255,255,0.7); }
  }

  &:not(.left-hand) {
    .phone-screen .zone {
      &.primary-zone { left: 0; width: 60%; height: 35%; background: rgba(82, 196, 26, 0.3); border: 1px solid rgba(82, 196, 26, 0.6); }
      &.secondary-zone { right: 0; width: 40%; height: 30%; background: rgba(255, 169, 64, 0.3); border: 1px solid rgba(255, 169, 64, 0.6); }
      &.danger-zone { right: 0; top: 0; width: 40%; height: 30%; background: rgba(255, 77, 79, 0.3); border: 1px solid rgba(255, 77, 79, 0.6); }
    }
  }

  &.left-hand .phone-screen .zone {
    &.primary-zone { right: 0; width: 60%; height: 35%; background: rgba(82, 196, 26, 0.3); border: 1px solid rgba(82, 196, 26, 0.6); }
    &.secondary-zone { left: 0; width: 40%; height: 30%; background: rgba(255, 169, 64, 0.3); border: 1px solid rgba(255, 169, 64, 0.6); }
    &.danger-zone { left: 0; top: 0; width: 40%; height: 30%; background: rgba(255, 77, 79, 0.3); border: 1px solid rgba(255, 77, 79, 0.6); }
  }

  .zone-legend {
    display: flex;
    justify-content: center;
    gap: 20rpx;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 18rpx;
      color: #7AA8CC;
      .legend-dot { width: 14rpx; height: 14rpx; border-radius: 50%; }
    }
  }
}

.auto-opt-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #1A3350;

  .pref-info { flex: 1; .pref-title { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; } .pref-desc { font-size: 22rpx; color: #7AA8CC; display: block; margin-top: 4rpx; } }
}

// 按钮尺寸
.size-slider {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #1A3350;

  .size-label { font-size: 24rpx; color: #7AA8CC; display: block; margin-bottom: 16rpx; }
  .size-options { display: flex; justify-content: space-around; }
  .size-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    padding: 16rpx 24rpx;
    border-radius: 12rpx;
    background: #060A14;
    border: 1px solid #1A3350;
    font-size: 20rpx;
    color: #7AA8CC;
    transition: all 0.2s;
    &.active { border-color: #00D4FF; background: rgba(0, 212, 255, 0.1); color: #00D4FF; }
    .size-demo { border-radius: 6rpx; background: #00D4FF; min-width: 44rpx; max-width: 72rpx; min-height: 26rpx; }
  }
}

// 手套模式
.glove-card {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #1A3350;

  &.active { border-color: rgba(255, 169, 64, 0.5); background: rgba(255, 169, 64, 0.05); }

  .glove-header { display: flex; align-items: center; gap: 16rpx; }
  .glove-icon { font-size: 48rpx; }
  .glove-info { flex: 1; .glove-title { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; } .glove-desc { font-size: 22rpx; color: #7AA8CC; display: block; margin-top: 4rpx; } }

  .glove-settings {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1px solid #1A3350;
    .glove-slider-item { .glove-slider-label { font-size: 22rpx; color: #7AA8CC; display: block; margin-bottom: 8rpx; } }
    .glove-slider {
      display: flex;
      align-items: center;
      gap: 12rpx;
      .slider-unit { font-size: 22rpx; color: #7AA8CC; }
    }
  }
}

// 任务全屏导航
.task-nav-card {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #1A3350;

  &.active { border-color: rgba(82, 196, 26, 0.5); }

  .task-nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .task-nav-title { font-size: 26rpx; font-weight: 600; color: #E8F4FF; }
  }

  .task-nav-settings {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1px solid #1A3350;

    .task-nav-subtitle { font-size: 22rpx; color: #7AA8CC; display: block; margin-bottom: 12rpx; }
  }

  .task-element-list {
    display: flex;
    flex-direction: column;
    gap: 10rpx;
    margin-bottom: 20rpx;
  }

  .task-element-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 14rpx 16rpx;
    background: #060A14;
    border-radius: 12rpx;
    border: 1px solid #1A3350;
    transition: all 0.2s;

    &.enabled { border-color: rgba(82, 196, 26, 0.3); background: rgba(82, 196, 26, 0.05); }

    .elem-icon { font-size: 28rpx; }
    .elem-name { flex: 1; font-size: 24rpx; color: #E8F4FF; }
    .elem-toggle { font-size: 22rpx; color: #7AA8CC; }
    &.enabled .elem-toggle { color: #52C41A; }
  }

  .task-nav-actions {
    display: flex;
    gap: 16rpx;

    .preview-btn, .enter-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      padding: 16rpx 0;
      border-radius: 12rpx;
      font-size: 26rpx;
      font-weight: 600;
      transition: all 0.2s;
      &:active { transform: scale(0.97); }
    }

    .preview-btn { background: #1A3350; color: #7AA8CC; }
    .enter-btn { background: linear-gradient(135deg, #52C41A, #73D13D); color: #fff; }
  }
}

// 保存
.save-section {
  display: flex;
  gap: 16rpx;
  margin: 30rpx 0;

  .save-btn, .reset-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    padding: 20rpx 0;
    border-radius: 16rpx;
    font-size: 28rpx;
    font-weight: 700;
    transition: all 0.2s;
    &:active { transform: scale(0.97); }
  }

  .save-btn { background: linear-gradient(135deg, #00D4FF, #007AFF); color: #fff; }
  .reset-btn { background: #1A3350; color: #7AA8CC; }
}

// 全屏预览
.fullscreen-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-phone {
  width: 320px;
  height: 580px;
  background: #060A14;
  border-radius: 36px;
  border: 3px solid #1A3350;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;

  .preview-header-bar {
    height: 60px;
    background: rgba(12, 27, 42, 0.95);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    .preview-title { font-size: 14px; color: #E8F4FF; }
  }

  .preview-content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;

    .preview-task-info {
      text-align: center;
      .preview-task-name { font-size: 14px; color: #E8F4FF; display: block; margin-bottom: 8px; }
      .preview-task-desc { font-size: 12px; color: #7AA8CC; display: block; }
    }

    .preview-action-center {
      .preview-main-btn {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, #FF4D4F, #FF7A45);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        .btn-icon { font-size: 36px; }
        text { font-size: 12px; color: #fff; font-weight: 600; }
      }
    }
  }

  .preview-footer-bar {
    height: 80px;
    background: rgba(12, 27, 42, 0.95);
    display: flex;
    justify-content: space-around;
    align-items: center;

    .preview-nav-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: #4A6A8A;
      &.active { color: #00D4FF; }
    }
  }

  .preview-exit {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>
