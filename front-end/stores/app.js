/**
 * ==========================================
 * App Store - 全局应用状态
 * ==========================================
 * 夜间执法模式、手套触控、单手操作模式等全局配置
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SYSTEM_CONFIG, BUSINESS_CONSTANTS } from '../utils/systemConfig.js';

export const useAppStore = defineStore('app', () => {
  // ===== 夜间执法模式 =====
  const nightModeType = ref('DARK'); // 'DARK' | 'RED_LIGHT'
  const nightModeEnabled = ref(false);

  const currentNightPalette = computed(() => {
    if (!nightModeEnabled.value) {
      return {
        bg: '#060A14',
        surface: '#0C1B2A',
        border: '#1A3350',
        text: '#E8F4FF',
        textSecondary: '#7AA8CC',
        accent: '#00D4FF',
        highlight: '#00F5FF',
      };
    }
    const palette = BUSINESS_CONSTANTS.NIGHT_MODE[nightModeType.value];
    return palette || BUSINESS_CONSTANTS.NIGHT_MODE.DARK;
  });

  function toggleNightMode() {
    nightModeEnabled.value = !nightModeEnabled.value;
    _applyCSSVariables();
    uni.vibrateShort && uni.vibrateShort();
  }

  function setNightModeType(type) {
    if (BUSINESS_CONSTANTS.NIGHT_MODE[type]) {
      nightModeType.value = type;
      _applyCSSVariables();
    }
  }

  // ===== 手套触控模式 =====
  const gloveModeEnabled = ref(false);
  const gloveTouchScale = ref(1.5);
  const gloveTouchMode = ref(false);

  const touchTargetScale = computed(() => gloveModeEnabled.value ? gloveTouchScale.value : 1.0);

  function toggleGloveMode() {
    gloveModeEnabled.value = !gloveModeEnabled.value;
    uni.vibrateShort && uni.vibrateShort();
  }

  function setGloveTouchMode(enabled) {
    gloveTouchMode.value = enabled;
    uni.setStorageSync('glove_mode_enabled', enabled);
  }

  function setGloveTouchScale(scale) {
    gloveTouchScale.value = scale;
    uni.setStorageSync('glove_touch_scale', scale);
  }

  // ===== 单手操作模式 =====
  const singleHandMode = ref(false);
  const dominantHand = ref('right');
  const touchSensitivity = ref(2);
  const swipeGestures = ref(true);
  const layout = ref('bottom');
  const buttonSize = ref('medium');
  const autoOptimizeTouchZone = ref(true);
  const tactileFeedback = ref(true);

  function toggleSingleHand(side = 'right') {
    singleHandMode.value = singleHandMode.value === side ? 'none' : side;
    uni.vibrateShort && uni.vibrateShort();
  }

  function setSingleHandMode(enabled) {
    singleHandMode.value = enabled;
    uni.setStorageSync('single_hand_mode', enabled);
  }

  function setTouchSensitivity(val) {
    touchSensitivity.value = val;
    uni.setStorageSync('touch_sensitivity', val);
  }

  function setSwipeGestures(enabled) {
    swipeGestures.value = enabled;
    uni.setStorageSync('swipe_gestures', enabled);
  }

  function setAutoOptimizeTouchZone(enabled) {
    autoOptimizeTouchZone.value = enabled;
    uni.setStorageSync('auto_optimize_touch_zone', enabled);
  }

  function setTactileFeedback(enabled) {
    tactileFeedback.value = enabled;
    uni.setStorageSync('tactile_feedback', enabled);
  }

  function setDominantHand(hand) {
    dominantHand.value = hand;
    uni.setStorageSync('dominant_hand', hand);
  }

  function setLayout(layoutKey) {
    layout.value = layoutKey;
    uni.setStorageSync('layout', layoutKey);
  }

  function setButtonSize(size) {
    buttonSize.value = size;
    uni.setStorageSync('button_size', size);
  }

  function setGloveEnabled(enabled) {
    gloveModeEnabled.value = enabled;
    uni.setStorageSync('glove_mode_enabled', enabled);
  }

  // ===== 全屏任务导航模式 =====
  const fullscreenTaskMode = ref(false);

  function toggleFullscreenTask() {
    fullscreenTaskMode.value = !fullscreenTaskMode.value;
    if (fullscreenTaskMode.value) {
      uni.hideTabBar && uni.hideTabBar();
    } else {
      uni.showTabBar && uni.showTabBar();
    }
  }

  function setFullscreenTaskMode(enabled) {
    fullscreenTaskMode.value = enabled;
    if (enabled) {
      uni.hideTabBar && uni.hideTabBar();
    } else {
      uni.showTabBar && uni.showTabBar();
    }
  }

  // ===== AR实景识别模式 =====
  const arRecognitionMode = ref(false);

  function toggleARMode() {
    arRecognitionMode.value = !arRecognitionMode.value;
    uni.vibrateShort && uni.vibrateShort();
  }

  // ===== 应用就绪状态 =====
  const appReady = ref(false);
  const lastSyncTime = ref(null);
  const syncStatus = ref('idle'); // 'idle' | 'syncing' | 'error' | 'success'

  function setAppReady(ready) {
    appReady.value = ready;
  }

  function updateSyncStatus(status, time = null) {
    syncStatus.value = status;
    if (time) lastSyncTime.value = time;
  }

  // ===== 内部方法：应用CSS变量 =====
  function _applyCSSVariables() {
    const palette = currentNightPalette.value;
    uni.setStorageSync('night_mode_enabled', nightModeEnabled.value);
    uni.setStorageSync('night_mode_type', nightModeType.value);
  }

  // ===== 初始化 =====
  function init() {
    // 恢复夜间模式状态
    const savedNight = uni.getStorageSync('night_mode_enabled');
    const savedType = uni.getStorageSync('night_mode_type');
    if (typeof savedNight === 'boolean') {
      nightModeEnabled.value = savedNight;
    }
    if (savedType && BUSINESS_CONSTANTS.NIGHT_MODE[savedType]) {
      nightModeType.value = savedType;
    }

    // 恢复手套模式状态
    const savedGlove = uni.getStorageSync('glove_mode_enabled');
    if (typeof savedGlove === 'boolean') {
      gloveModeEnabled.value = savedGlove;
      gloveTouchMode.value = savedGlove;
    }
    const savedGloveScale = uni.getStorageSync('glove_touch_scale');
    if (savedGloveScale) {
      gloveTouchScale.value = savedGloveScale;
    }

    // 恢复单手模式状态
    const savedSingleHand = uni.getStorageSync('single_hand_mode');
    if (savedSingleHand) {
      singleHandMode.value = savedSingleHand;
    }
    const savedDominant = uni.getStorageSync('dominant_hand');
    if (savedDominant) dominantHand.value = savedDominant;
    const savedTouchSens = uni.getStorageSync('touch_sensitivity');
    if (savedTouchSens) touchSensitivity.value = savedTouchSens;
    const savedLayout = uni.getStorageSync('layout');
    if (savedLayout) layout.value = savedLayout;
    const savedBtnSize = uni.getStorageSync('button_size');
    if (savedBtnSize) buttonSize.value = savedBtnSize;
    const savedAutoOpt = uni.getStorageSync('auto_optimize_touch_zone');
    if (typeof savedAutoOpt === 'boolean') autoOptimizeTouchZone.value = savedAutoOpt;
    const savedTactile = uni.getStorageSync('tactile_feedback');
    if (typeof savedTactile === 'boolean') tactileFeedback.value = savedTactile;
    const savedSwipe = uni.getStorageSync('swipe_gestures');
    if (typeof savedSwipe === 'boolean') swipeGestures.value = savedSwipe;

    _applyCSSVariables();
    appReady.value = true;
  }

  return {
    // 夜间模式
    nightModeType,
    nightModeEnabled,
    currentNightPalette,
    toggleNightMode,
    setNightModeType,

    // 手套触控
    gloveModeEnabled,
    gloveTouchScale,
    gloveTouchMode,
    touchTargetScale,
    toggleGloveMode,
    setGloveTouchMode,
    setGloveTouchScale,
    setGloveEnabled,

    // 单手操作
    singleHandMode,
    dominantHand,
    touchSensitivity,
    swipeGestures,
    layout,
    buttonSize,
    autoOptimizeTouchZone,
    tactileFeedback,
    toggleSingleHand,
    setSingleHandMode,
    setTouchSensitivity,
    setSwipeGestures,
    setAutoOptimizeTouchZone,
    setTactileFeedback,
    setDominantHand,
    setLayout,
    setButtonSize,

    // 全屏任务导航
    fullscreenTaskMode,
    toggleFullscreenTask,
    setFullscreenTaskMode,

    // AR识别
    arRecognitionMode,
    toggleARMode,

    // 应用状态
    appReady,
    lastSyncTime,
    syncStatus,
    setAppReady,
    updateSyncStatus,

    // 初始化
    init,
  };
});
