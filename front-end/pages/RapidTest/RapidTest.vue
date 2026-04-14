<template>
  <view class="rapid-test-page" :class="{ 'night-mode': appStore.nightModeEnabled }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <view class="nav-title">
        <text class="title-text">现场快速检测</text>
        <text class="subtitle">Rapid Field Testing</text>
      </view>
      <view class="nav-actions">
        <view class="action-btn" @click="showGuide = true">
          <text class="icon">❓</text>
        </view>
      </view>
    </view>

    <!-- 检测类型选择 -->
    <view class="test-type-section">
      <text class="section-label">选择检测类型</text>
      <view class="test-type-grid">
        <view
          v-for="type in testTypes"
          :key="type.key"
          class="test-type-card"
          :class="{ active: selectedType === type.key, disabled: isTesting }"
          @click="selectType(type.key)"
        >
          <view class="type-icon">{{ type.icon }}</view>
          <text class="type-name">{{ type.name }}</text>
          <text class="type-desc">{{ type.description }}</text>
          <view class="type-badge" v-if="type.key === 'wildlife'">
            <text>瘦肉精</text>
          </view>
          <view class="type-badge" v-if="type.key === 'food'">
            <text>农残/重金属</text>
          </view>
          <view class="type-badge" v-if="type.key === 'environmental'">
            <text>水质/土壤</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 设备连接状态 -->
    <view class="device-status-section">
      <view class="device-card">
        <view class="device-icon" :class="{ connected: deviceConnected }">
          {{ deviceConnected ? '🔗' : '📡' }}
        </view>
        <view class="device-info">
          <text class="device-name">{{ deviceConnected ? '检测设备已连接' : '未连接检测设备' }}</text>
          <text class="device-hint">{{ deviceConnected ? '设备型号：RT-200 便携式检测仪' : '点击连接或使用手动输入模式' }}</text>
        </view>
        <view class="device-action" @click="toggleDevice">
          <text>{{ deviceConnected ? '断开' : '连接设备' }}</text>
        </view>
      </view>
    </view>

    <!-- 检测操作区 -->
    <view class="test-operation-section">
      <text class="section-label">检测操作</text>

      <!-- 未开始 -->
      <view v-if="!isTesting && !testResult" class="operation-ready">
        <view class="operation-animation">
          <view class="anim-icon" :class="'anim-' + selectedType">
            {{ getTypeIcon(selectedType) }}
          </view>
          <view class="anim-ring"></view>
          <view class="anim-ring delay"></view>
        </view>
        <text class="operation-hint">{{ getTypeHint(selectedType) }}</text>

        <view class="start-btn" :class="{ disabled: !selectedType }" @click="startTest">
          <text class="btn-icon">🧪</text>
          <text class="btn-text">开始检测</text>
        </view>

        <view class="manual-entry">
          <text class="manual-label">无设备？</text>
          <text class="manual-link" @click="showManualEntry = true">手动录入检测结果</text>
        </view>
      </view>

      <!-- 检测中 -->
      <view v-if="isTesting" class="operation-testing">
        <view class="test-progress-ring">
          <view class="progress-bg"></view>
          <view class="progress-fill" :style="{ '--fill': progress + '%' }"></view>
          <view class="progress-text">
            <text class="progress-num">{{ progress }}</text>
            <text class="progress-unit">%</text>
          </view>
        </view>

        <view class="test-stages">
          <view
            v-for="(stage, idx) in testStages"
            :key="idx"
            class="stage-item"
            :class="{
              active: currentStage === idx,
              completed: currentStage > idx
            }"
          >
            <view class="stage-icon">
              <text v-if="currentStage > idx">✓</text>
              <text v-else-if="currentStage === idx">{{ stage.icon }}</text>
              <text v-else>○</text>
            </view>
            <text class="stage-name">{{ stage.name }}</text>
          </view>
        </view>

        <text class="testing-hint">{{ testStages[currentStage]?.description }}</text>
      </view>

      <!-- 检测完成 -->
      <view v-if="testResult && !isTesting" class="operation-result">
        <view class="result-header">
          <view class="result-status-badge" :class="testResult.overallStatus">
            <text class="badge-icon">{{ getResultIcon(testResult.overallStatus) }}</text>
            <text class="badge-text">{{ getResultLabel(testResult.overallStatus) }}</text>
          </view>
        </view>

        <view class="result-items">
          <view
            v-for="item in testResult.items"
            :key="item.name"
            class="result-item"
            :class="'status-' + item.status"
          >
            <view class="item-header">
              <text class="item-name">{{ item.name }}</text>
              <view class="item-status-badge" :class="item.status">
                <text>{{ getItemStatusLabel(item.status) }}</text>
              </view>
            </view>
            <view class="item-values">
              <view class="value-row">
                <text class="value-label">检测值</text>
                <text class="value-num" :class="item.status">{{ item.value }}</text>
              </view>
              <view class="value-row">
                <text class="value-label">限值</text>
                <text class="value-limit">{{ item.limit }}</text>
              </view>
            </view>
            <view class="item-bar">
              <view class="bar-bg">
                <view class="bar-fill" :style="{
                  width: getBarWidth(item) + '%',
                  background: getBarColor(item.status)
                }"></view>
              </view>
              <view class="bar-limit" :style="{ left: '80%' }"></view>
            </view>
          </view>
        </view>

        <view class="result-actions">
          <view class="action-btn secondary" @click="saveResult">
            <text>💾</text>
            <text>保存记录</text>
          </view>
          <view class="action-btn primary" @click="reportResult">
            <text>📡</text>
            <text>上报食药监局</text>
          </view>
          <view class="action-btn" @click="resetTest">
            <text>🔄</text>
            <text>重新检测</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 检测历史 -->
    <view class="history-section">
      <view class="history-header">
        <text class="section-label">检测记录</text>
        <text class="history-count">共 {{ testHistory.length }} 条</text>
      </view>

      <view class="history-list">
        <view
          v-for="record in testHistory"
          :key="record.id"
          class="history-card"
          :class="'overall-' + record.overallStatus"
          @click="viewHistoryRecord(record)"
        >
          <view class="history-left">
            <text class="history-type">{{ getTypeName(record.testType) }}</text>
            <text class="history-time">{{ formatTime(record.timestamp) }}</text>
          </view>
          <view class="history-right">
            <view class="history-badge" :class="record.overallStatus">
              {{ getResultLabel(record.overallStatus) }}
            </view>
            <text class="history-items">{{ record.items.length }}项</text>
          </view>
        </view>

        <view v-if="testHistory.length === 0" class="empty-history">
          <text>暂无检测记录</text>
        </view>
      </view>
    </view>

    <!-- 使用指南弹窗 -->
    <view v-if="showGuide" class="modal-overlay" @click="showGuide = false">
      <view class="guide-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">快速检测使用指南</text>
          <text class="modal-close" @click="showGuide = false">×</text>
        </view>
        <scroll-view class="guide-scroll" scroll-y>
          <view class="guide-section">
            <text class="guide-subtitle">操作步骤</text>
            <view class="guide-steps">
              <view v-for="(step, idx) in guideSteps" :key="idx" class="guide-step">
                <view class="step-num">{{ idx + 1 }}</view>
                <view class="step-content">
                  <text class="step-title">{{ step.title }}</text>
                  <text class="step-desc">{{ step.desc }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="guide-section">
            <text class="guide-subtitle">检测类型说明</text>
            <view class="guide-type-list">
              <view v-for="type in testTypes" :key="type.key" class="guide-type-item">
                <text class="guide-type-icon">{{ type.icon }}</text>
                <view class="guide-type-info">
                  <text class="guide-type-name">{{ type.name }}</text>
                  <text class="guide-type-desc">{{ type.description }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="guide-section">
            <text class="guide-subtitle">结果判读</text>
            <view class="guide-result-list">
              <view class="guide-result-item negative">
                <text class="result-tag">阴性 (NEGATIVE)</text>
                <text class="result-desc">未检出该物质或含量在安全范围内</text>
              </view>
              <view class="guide-result-item warning">
                <text class="result-tag">警戒 (WARNING)</text>
                <text class="result-desc">检出量接近限值，需关注</text>
              </view>
              <view class="guide-result-item positive">
                <text class="result-tag">阳性 (POSITIVE)</text>
                <text class="result-desc">检出量超过限值，需立即处置并上报</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 手动录入弹窗 -->
    <view v-if="showManualEntry" class="modal-overlay" @click="showManualEntry = false">
      <view class="manual-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">手动录入检测结果</text>
          <text class="modal-close" @click="showManualEntry = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">检测物质名称</text>
            <input class="form-input" v-model="manualEntry.name" placeholder="请输入检测物质名称" />
          </view>
          <view class="form-item">
            <text class="form-label">检测值</text>
            <input class="form-input" v-model="manualEntry.value" placeholder="请输入检测数值" type="digit" />
          </view>
          <view class="form-item">
            <text class="form-label">单位</text>
            <input class="form-input" v-model="manualEntry.unit" placeholder="如: μg/kg, mg/L" />
          </view>
          <view class="form-item">
            <text class="form-label">限值</text>
            <input class="form-input" v-model="manualEntry.limit" placeholder="请输入国家标准限值" type="digit" />
          </view>
          <view class="form-item">
            <text class="form-label">判定结果</text>
            <view class="status-selector">
              <view
                v-for="s in ['NEGATIVE', 'WARNING', 'POSITIVE']"
                :key="s"
                class="status-option"
                :class="{ active: manualEntry.status === s, [s.toLowerCase()]: true }"
                @click="manualEntry.status = s"
              >
                <text>{{ getItemStatusLabel(s) }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <view class="modal-btn cancel" @click="showManualEntry = false">取消</view>
          <view class="modal-btn confirm" @click="submitManualEntry">确认录入</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSensorStore } from '../../stores/sensor.js';
import { useAppStore } from '../../stores/app.js';
import { useEvidenceStore } from '../../stores/evidence.js';
import { useSecurityStore } from '../../stores/security.js';

const sensorStore = useSensorStore();
const appStore = useAppStore();
const evidenceStore = useEvidenceStore();
const securityStore = useSecurityStore();

const selectedType = ref('wildlife');
const isTesting = ref(false);
const progress = ref(0);
const currentStage = ref(0);
const testResult = ref(null);
const deviceConnected = ref(false);
const showGuide = ref(false);
const showManualEntry = ref(false);

const manualEntry = ref({
  name: '',
  value: '',
  unit: '',
  limit: '',
  status: 'NEGATIVE',
});

const testTypes = [
  {
    key: 'wildlife',
    name: '食药安全检测',
    icon: '💊',
    description: '瘦肉精、抗生素、非法添加物',
  },
  {
    key: 'food',
    name: '食品质量检测',
    icon: '🍖',
    description: '农药残留、重金属、亚硝酸盐',
  },
  {
    key: 'environmental',
    name: '环境指标检测',
    icon: '🌍',
    description: 'COD、氨氮、重金属（水/土）',
  },
];

const testStages = [
  { name: '采样', icon: '💉', description: '正在采集样本...' },
  { name: '预处理', icon: '⚗️', description: '样本前处理中...' },
  { name: '反应', icon: '⚡', description: '生化反应进行中...' },
  { name: '检测', icon: '📊', description: '数据读取中...' },
  { name: '分析', icon: '🧠', description: '结果分析中...' },
];

const guideSteps = [
  { title: '选择检测类型', desc: '根据待检样品选择对应的检测类型' },
  { title: '连接检测设备', desc: '通过蓝牙或USB连接便携式检测仪' },
  { title: '放置样品', desc: '将待检测样品放入检测卡或试管中' },
  { title: '开始检测', desc: '点击开始检测，等待设备自动完成' },
  { title: '判读结果', desc: '根据检测结果对照国家标准进行判读' },
  { title: '上报存档', desc: '阳性结果立即上报，阴性结果存档备查' },
];

const testHistory = computed(() => sensorStore.rapidTestHistory.slice(0, 10));

function goBack() {
  uni.navigateBack();
}

function selectType(type) {
  if (isTesting.value) return;
  selectedType.value = type;
  uni.vibrateShort && uni.vibrateShort();
}

function toggleDevice() {
  deviceConnected.value = !deviceConnected.value;
  uni.vibrateShort && uni.vibrateShort();
  uni.showToast({
    title: deviceConnected.value ? '设备已连接' : '设备已断开',
    icon: 'none',
  });
}

async function startTest() {
  if (!selectedType.value) return;

  isTesting.value = true;
  progress.value = 0;
  currentStage.value = 0;
  testResult.value = null;

  uni.vibrateShort && uni.vibrateShort();

  // 模拟检测进度
  const totalStages = testStages.length;
  const progressPerStage = 100 / totalStages;

  for (let i = 0; i < totalStages; i++) {
    currentStage.value = i;
    const stageStart = i * progressPerStage;
    const stageEnd = (i + 1) * progressPerStage;

    // 每阶段内的进度动画
    const stageDuration = 800 + Math.random() * 400;
    const steps = 20;
    const stepDuration = stageDuration / steps;

    for (let j = 0; j <= steps; j++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      progress.value = Math.round(stageStart + (stageEnd - stageStart) * (j / steps));
    }
  }

  // 完成检测
  progress.value = 100;

  // 获取检测结果
  const result = await sensorStore.startRapidTest(selectedType.value);
  testResult.value = result;
  isTesting.value = false;

  // 阳性/警戒震动
  if (result.overallStatus === 'POSITIVE') {
    uni.vibrateLong && uni.vibrateLong();
  } else if (result.overallStatus === 'WARNING') {
    uni.vibrateShort && uni.vibrateShort();
  }

  // 审计记录
  securityStore.recordSensitiveOperation({
    type: 'RAPID_TEST',
    description: `执行${getTypeName(selectedType.value)}检测，结果: ${getResultLabel(result.overallStatus)}`,
    metadata: {
      testType: selectedType.value,
      result: result.overallStatus,
      itemCount: result.items.length,
    },
  });
}

function saveResult() {
  if (!testResult.value) return;

  evidenceStore.addEvidence({
    fileName: `test_${testResult.value.id}_${Date.now()}.jpg`,
    type: 'RAPID_TEST',
    securityLevel: testResult.value.overallStatus === 'POSITIVE'
      ? 1  // CRITICAL
      : 2, // IMPORTANT
    testInfo: testResult.value,
    classification: testResult.value.overallStatus === 'POSITIVE' ? 4 : 3,
  });

  uni.showToast({ title: '已保存记录', icon: 'success' });
}

function reportResult() {
  if (!testResult.value) return;

  const status = testResult.value.overallStatus;

  evidenceStore.addEvidence({
    fileName: `test_${testResult.value.id}_${Date.now()}.jpg`,
    type: 'RAPID_TEST',
    securityLevel: 1,
    testInfo: testResult.value,
    classification: 4,
  });

  const evidenceId = evidenceStore.addEvidence({
    fileName: `test_${testResult.value.id}_report.jpg`,
    type: 'TEST_REPORT',
    securityLevel: 1,
    testInfo: testResult.value,
    classification: 4,
  });

  evidenceStore.submitToBlockchain(evidenceId);

  uni.showToast({ title: '已上报食药监局', icon: 'success' });
}

function resetTest() {
  testResult.value = null;
  selectedType.value = '';
  progress.value = 0;
  currentStage.value = 0;
}

function viewHistoryRecord(record) {
  testResult.value = record;
  selectedType.value = record.testType;
}

function submitManualEntry() {
  if (!manualEntry.value.name || !manualEntry.value.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }

  const item = {
    name: manualEntry.value.name,
    value: `${manualEntry.value.value}${manualEntry.value.unit}`,
    limit: `${manualEntry.value.limit}${manualEntry.value.unit}`,
    status: manualEntry.value.status,
  };

  testResult.value = {
    id: `TEST-MANUAL-${Date.now()}`,
    testType: selectedType.value || 'wildlife',
    timestamp: new Date().toISOString(),
    overallStatus: manualEntry.value.status,
    items: [item],
  };

  showManualEntry.value = false;
  uni.showToast({ title: '录入成功', icon: 'success' });
}

function getTypeIcon(type) {
  const map = { wildlife: '🦎', food: '🍖', environmental: '🌍' };
  return map[type] || '🧪';
}

function getTypeHint(type) {
  const map = {
    drug: '将样品放入检测卡，开始快速筛查',
    food: '采集食品样本，进行安全检测',
    environmental: '采集环境样本（水/土）',
  };
  return map[type] || '请选择检测类型';
}

function getTypeName(type) {
  const map = { wildlife: '野生动物走私', food: '食品质量', environmental: '环境指标' };
  return map[type] || type;
}

function getResultIcon(status) {
  const map = { POSITIVE: '🚨', WARNING: '⚠️', NEGATIVE: '✓' };
  return map[status] || '?';
}

function getResultLabel(status) {
  const map = { POSITIVE: '阳性', WARNING: '警戒', NEGATIVE: '阴性' };
  return map[status] || status;
}

function getItemStatusLabel(status) {
  const map = { POSITIVE: '阳性', WARNING: '警戒', NEGATIVE: '阴性' };
  return map[status] || status;
}

function getBarWidth(item) {
  if (!item.limit || !item.value) return 0;
  const val = parseFloat(item.value);
  const limit = parseFloat(item.limit);
  if (isNaN(val) || isNaN(limit) || limit === 0) return 0;
  return Math.min(Math.round((val / limit) * 100), 120);
}

function getBarColor(status) {
  const map = { POSITIVE: '#FF4D4F', WARNING: '#FFA940', NEGATIVE: '#52C41A' };
  return map[status] || '#52C41A';
}

function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
</script>

<style lang="scss" scoped>
@mixin night-mode-colors {
  --bg: #1A0000;
  --surface: #2D0000;
  --border: #4D0000;
  --text: #FF6B6B;
}

.rapid-test-page {
  min-height: 100vh;
  background: #060A14;
  color: #E8F4FF;
  padding-bottom: 40rpx;

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
  .nav-actions {
    .action-btn {
      width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center;
      background: rgba(0, 212, 255, 0.1); border-radius: 50%; border: 1px solid rgba(0, 212, 255, 0.2);
      .icon { font-size: 28rpx; color: #00D4FF; }
    }
  }
}

.section-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #7AA8CC;
  display: block;
  margin-bottom: 16rpx;
  padding: 0 30rpx;
}

.test-type-section {
  padding: 30rpx 0 20rpx;
}

.test-type-grid {
  display: flex;
  gap: 20rpx;
  padding: 0 30rpx;
}

.test-type-card {
  flex: 1;
  background: #0C1B2A;
  border-radius: 20rpx;
  padding: 24rpx 16rpx;
  border: 2px solid #1A3350;
  text-align: center;
  transition: all 0.2s;
  position: relative;

  &:active { transform: scale(0.97); }

  &.active {
    border-color: #00D4FF;
    background: rgba(0, 212, 255, 0.05);
    .type-icon { transform: scale(1.1); }
  }

  &.disabled { opacity: 0.5; }

  .type-icon { font-size: 48rpx; display: block; margin-bottom: 12rpx; transition: transform 0.2s; }
  .type-name { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; margin-bottom: 6rpx; }
  .type-desc { font-size: 20rpx; color: #7AA8CC; display: block; line-height: 1.3; }

  .type-badge {
    position: absolute;
    top: -10rpx;
    right: -10rpx;
    background: #FF4D4F;
    border-radius: 20rpx;
    padding: 4rpx 12rpx;
    font-size: 18rpx;
    color: #fff;
  }
}

.device-status-section {
  padding: 0 30rpx 20rpx;
}

.device-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #1A3350;

  .device-icon {
    width: 72rpx;
    height: 72rpx;
    background: rgba(255, 77, 79, 0.15);
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    &.connected { background: rgba(82, 196, 26, 0.15); }
  }

  .device-info {
    flex: 1;
    .device-name { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; }
    .device-hint { font-size: 22rpx; color: #7AA8CC; display: block; margin-top: 4rpx; }
  }

  .device-action {
    padding: 10rpx 20rpx;
    background: rgba(0, 212, 255, 0.15);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 10rpx;
    font-size: 22rpx;
    color: #00D4FF;
  }
}

.test-operation-section {
  padding: 0 30rpx 20rpx;

  .operation-ready, .operation-testing, .operation-result {
    background: #0C1B2A;
    border-radius: 20rpx;
    padding: 40rpx 30rpx;
    border: 1px solid #1A3350;
    min-height: 400rpx;
  }
}

.operation-ready {
  text-align: center;

  .operation-animation {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    margin: 0 auto 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .anim-icon { font-size: 80rpx; z-index: 1; }
    .anim-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid rgba(0, 212, 255, 0.3);
      animation: expand 2s infinite;
      &.delay { animation-delay: 1s; }
    }
  }

  .operation-hint { font-size: 24rpx; color: #7AA8CC; display: block; margin-bottom: 30rpx; }

  .start-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    padding: 20rpx 60rpx;
    background: linear-gradient(135deg, #00D4FF, #007AFF);
    border-radius: 50rpx;
    font-size: 30rpx;
    font-weight: 700;
    color: #fff;
    box-shadow: 0 8rpx 30rpx rgba(0, 212, 255, 0.4);
    transition: all 0.2s;
    margin-bottom: 24rpx;

    &:active { transform: scale(0.96); }
    &.disabled { opacity: 0.4; }
    .btn-icon { font-size: 36rpx; }
  }

  .manual-entry {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    .manual-label { font-size: 22rpx; color: #4A6A8A; }
    .manual-link { font-size: 22rpx; color: #00D4FF; text-decoration: underline; }
  }
}

@keyframes expand {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}

.operation-testing {
  text-align: center;

  .test-progress-ring {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    margin: 0 auto 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .progress-bg {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #1A3350;
    }

    .progress-fill {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: conic-gradient(
        #00D4FF calc(var(--fill) * 1%),
        transparent calc(var(--fill) * 1%)
      );
    }

    .progress-text {
      position: relative;
      z-index: 1;
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      background: #0C1B2A;
      display: flex;
      align-items: center;
      justify-content: center;
      .progress-num { font-size: 48rpx; font-weight: 900; color: #00D4FF; }
      .progress-unit { font-size: 24rpx; color: #7AA8CC; }
    }
  }

  .test-stages {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20rpx;

    .stage-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
      opacity: 0.4;
      transition: opacity 0.3s;

      &.active { opacity: 1; }
      &.completed { opacity: 0.8; }

      .stage-icon {
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        background: #1A3350;
        border: 2px solid #1A3350;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24rpx;
        color: #7AA8CC;
      }

      &.active .stage-icon {
        border-color: #00D4FF;
        background: rgba(0, 212, 255, 0.15);
        color: #00D4FF;
      }

      &.completed .stage-icon {
        border-color: #52C41A;
        background: rgba(82, 196, 26, 0.15);
        color: #52C41A;
      }

      .stage-name { font-size: 20rpx; color: #7AA8CC; }
      &.active .stage-name { color: #00D4FF; }
    }
  }

  .testing-hint { font-size: 24rpx; color: #7AA8CC; }
}

.operation-result {
  .result-header {
    text-align: center;
    margin-bottom: 24rpx;

    .result-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 10rpx;
      padding: 12rpx 32rpx;
      border-radius: 50rpx;
      font-size: 28rpx;
      font-weight: 700;

      &.POSITIVE { background: rgba(255, 77, 79, 0.15); border: 2px solid #FF4D4F; color: #FF4D4F; }
      &.WARNING { background: rgba(255, 169, 64, 0.15); border: 2px solid #FFA940; color: #FFA940; }
      &.NEGATIVE { background: rgba(82, 196, 26, 0.15); border: 2px solid #52C41A; color: #52C41A; }
      .badge-icon { font-size: 28rpx; }
    }
  }

  .result-items {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-bottom: 24rpx;
  }

  .result-item {
    background: #060A14;
    border-radius: 16rpx;
    padding: 20rpx;
    border: 1px solid #1A3350;

    &.status-POSITIVE { border-color: rgba(255, 77, 79, 0.4); }
    &.status-WARNING { border-color: rgba(255, 169, 64, 0.4); }
    &.status-NEGATIVE { border-color: rgba(82, 196, 26, 0.3); }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;

      .item-name { font-size: 26rpx; font-weight: 600; color: #E8F4FF; }

      .item-status-badge {
        padding: 4rpx 14rpx;
        border-radius: 10rpx;
        font-size: 20rpx;
        font-weight: 600;
        &.POSITIVE { background: rgba(255, 77, 79, 0.2); color: #FF4D4F; }
        &.WARNING { background: rgba(255, 169, 64, 0.2); color: #FFA940; }
        &.NEGATIVE { background: rgba(82, 196, 26, 0.2); color: #52C41A; }
      }
    }

    .item-values {
      display: flex;
      gap: 30rpx;
      margin-bottom: 12rpx;

      .value-row { display: flex; gap: 8rpx; align-items: baseline; }
      .value-label { font-size: 22rpx; color: #4A6A8A; }
      .value-num { font-size: 26rpx; font-weight: 700;
        &.POSITIVE { color: #FF4D4F; }
        &.WARNING { color: #FFA940; }
        &.NEGATIVE { color: #52C41A; }
      }
      .value-limit { font-size: 22rpx; color: #7AA8CC; }
    }

    .item-bar {
      position: relative;

      .bar-bg {
        height: 8rpx;
        background: #1A3350;
        border-radius: 4rpx;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        border-radius: 4rpx;
        transition: width 0.5s;
      }

      .bar-limit {
        position: absolute;
        top: -2rpx;
        width: 2rpx;
        height: 12rpx;
        background: #FF4D4F;
      }
    }
  }

  .result-actions {
    display: flex;
    gap: 12rpx;

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      padding: 16rpx 0;
      border-radius: 14rpx;
      font-size: 24rpx;
      font-weight: 600;
      background: #1A3350;
      color: #7AA8CC;
      transition: all 0.2s;

      &:active { transform: scale(0.97); }
      &.primary { background: linear-gradient(135deg, #FF4D4F, #FF7A45); color: #fff; }
      &.secondary { background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); color: #00D4FF; }
    }
  }
}

.history-section {
  padding: 0 30rpx;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .history-count { font-size: 22rpx; color: #4A6A8A; }
  }

  .history-list { display: flex; flex-direction: column; gap: 12rpx; }

  .history-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 20rpx;
    border: 1px solid #1A3350;
    transition: all 0.2s;

    &:active { transform: scale(0.98); }

    &.overall-POSITIVE { border-color: rgba(255, 77, 79, 0.3); }
    &.overall-WARNING { border-color: rgba(255, 169, 64, 0.3); }

    .history-left {
      .history-type { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; }
      .history-time { font-size: 22rpx; color: #4A6A8A; }
    }

    .history-right {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .history-badge {
        padding: 6rpx 16rpx;
        border-radius: 10rpx;
        font-size: 22rpx;
        font-weight: 600;
        &.POSITIVE { background: rgba(255, 77, 79, 0.15); color: #FF4D4F; }
        &.WARNING { background: rgba(255, 169, 64, 0.15); color: #FFA940; }
        &.NEGATIVE { background: rgba(82, 196, 26, 0.15); color: #52C41A; }
      }
      .history-items { font-size: 22rpx; color: #7AA8CC; }
    }
  }

  .empty-history {
    text-align: center;
    padding: 60rpx 0;
    color: #4A6A8A;
    font-size: 24rpx;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}

.guide-modal, .manual-modal {
  width: 100%;
  background: #0C1B2A;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 85vh;
  padding: 30rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  .modal-title { font-size: 30rpx; font-weight: 700; color: #E8F4FF; }
  .modal-close { font-size: 48rpx; color: #7AA8CC; }
}

.guide-scroll { max-height: calc(85vh - 100rpx); }

.guide-section {
  margin-bottom: 30rpx;
  .guide-subtitle { font-size: 26rpx; font-weight: 600; color: #00D4FF; display: block; margin-bottom: 16rpx; }
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .guide-step {
    display: flex;
    gap: 16rpx;
    align-items: flex-start;

    .step-num {
      width: 40rpx;
      height: 40rpx;
      border-radius: 50%;
      background: rgba(0, 212, 255, 0.15);
      border: 1px solid #00D4FF;
      color: #00D4FF;
      font-size: 22rpx;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
      .step-title { font-size: 24rpx; font-weight: 600; color: #E8F4FF; display: block; }
      .step-desc { font-size: 22rpx; color: #7AA8CC; display: block; margin-top: 4rpx; }
    }
  }
}

.guide-type-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  .guide-type-item {
    display: flex;
    gap: 16rpx;
    align-items: flex-start;
    padding: 16rpx;
    background: #060A14;
    border-radius: 12rpx;

    .guide-type-icon { font-size: 36rpx; }
    .guide-type-info { flex: 1; }
    .guide-type-name { font-size: 24rpx; font-weight: 600; color: #E8F4FF; display: block; }
    .guide-type-desc { font-size: 22rpx; color: #7AA8CC; display: block; margin-top: 4rpx; }
  }
}

.guide-result-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  .guide-result-item {
    padding: 16rpx;
    border-radius: 12rpx;
    border-left: 4rpx solid;
    background: #060A14;

    &.negative { border-color: #52C41A; }
    &.warning { border-color: #FFA940; }
    &.positive { border-color: #FF4D4F; }

    .result-tag { font-size: 22rpx; font-weight: 600; color: #E8F4FF; display: block; margin-bottom: 4rpx; }
    .result-desc { font-size: 22rpx; color: #7AA8CC; display: block; }
  }
}

.modal-body {
  .form-item {
    margin-bottom: 20rpx;
    .form-label { font-size: 24rpx; color: #7AA8CC; display: block; margin-bottom: 8rpx; }
    .form-input {
      width: 100%;
      background: #060A14;
      border: 1px solid #1A3350;
      border-radius: 12rpx;
      padding: 16rpx 20rpx;
      font-size: 28rpx;
      color: #E8F4FF;
    }
  }

  .status-selector {
    display: flex;
    gap: 12rpx;

    .status-option {
      flex: 1;
      text-align: center;
      padding: 14rpx 0;
      border-radius: 12rpx;
      background: #060A14;
      border: 1px solid #1A3350;
      font-size: 22rpx;
      color: #7AA8CC;

      &.active {
        border-width: 2rpx;
        &.negative { border-color: #52C41A; color: #52C41A; background: rgba(82, 196, 26, 0.1); }
        &.warning { border-color: #FFA940; color: #FFA940; background: rgba(255, 169, 64, 0.1); }
        &.positive { border-color: #FF4D4F; color: #FF4D4F; background: rgba(255, 77, 79, 0.1); }
      }
    }
  }
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;

  .modal-btn {
    flex: 1;
    text-align: center;
    padding: 18rpx 0;
    border-radius: 12rpx;
    font-size: 28rpx;
    font-weight: 600;
    &.cancel { background: #1A3350; color: #7AA8CC; }
    &.confirm { background: linear-gradient(135deg, #00D4FF, #007AFF); color: #fff; }
  }
}
</style>
