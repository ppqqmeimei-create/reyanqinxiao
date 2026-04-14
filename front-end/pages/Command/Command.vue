<template>
  <view class="command-page" :class="{ 'night-mode': appStore.nightModeEnabled }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <view class="nav-title">
        <text class="title-text">联合指挥中心</text>
        <text class="subtitle">Joint Command Center</text>
      </view>
      <view class="nav-actions">
        <view class="action-btn alert-indicator" :class="{ active: hasActiveAlert }" @click="toggleAlertPanel">
          <text class="icon">🚨</text>
          <view v-if="activeAlertCount > 0" class="alert-badge">{{ activeAlertCount }}</view>
        </view>
      </view>
    </view>

    <!-- 战区选择 -->
    <view class="zone-selector">
      <scroll-view scroll-x>
        <view class="zone-tabs">
          <view
            v-for="zone in zones"
            :key="zone.code"
            class="zone-tab"
            :class="{ active: selectedZone === zone.code }"
            @click="selectZone(zone.code)"
          >
            <text class="zone-name">{{ zone.name }}</text>
            <text class="zone-stat">{{ zone.alertCount }}预警</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 主内容区 -->
    <scroll-view class="main-content" scroll-y>
      <!-- 领导驾驶舱 - 核心指标 -->
      <view class="cockpit-section">
        <view class="section-title">
          <text class="title">领导驾驶舱</text>
          <text class="subtitle">Command Cockpit</text>
        </view>

        <view class="metrics-grid">
          <!-- 今日预警 -->
          <view class="metric-card large">
            <view class="metric-header">
              <text class="metric-icon">🚨</text>
              <text class="metric-title">今日预警</text>
            </view>
            <view class="metric-value primary">{{ metrics.todayAlerts }}</view>
            <view class="metric-trend" :class="metrics.alertsTrend >= 0 ? 'up' : 'down'">
              <text>{{ metrics.alertsTrend >= 0 ? '↑' : '↓' }}</text>
              <text>{{ Math.abs(metrics.alertsTrend) }}% vs昨日</text>
            </view>
            <view class="metric-breakdown">
              <view class="breakdown-item critical">
                <text class="count">{{ metrics.criticalAlerts }}</text>
                <text class="label">紧急</text>
              </view>
              <view class="breakdown-item warning">
                <text class="count">{{ metrics.warningAlerts }}</text>
                <text class="label">警告</text>
              </view>
              <view class="breakdown-item info">
                <text class="count">{{ metrics.infoAlerts }}</text>
                <text class="label">提示</text>
              </view>
            </view>
          </view>

          <!-- 任务执行 -->
          <view class="metric-card">
            <view class="metric-header">
              <text class="metric-icon">📋</text>
              <text class="metric-title">任务执行</text>
            </view>
            <view class="metric-value success">{{ metrics.tasksCompleted }}</view>
            <view class="metric-sub">{{ metrics.tasksInProgress }}进行中</view>
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: metrics.taskCompletionRate + '%' }"></view>
            </view>
            <view class="progress-label">{{ metrics.taskCompletionRate }}%完成率</view>
          </view>

          <!-- 案件查获 -->
          <view class="metric-card">
            <view class="metric-header">
              <text class="metric-icon">🔒</text>
              <text class="metric-title">案件查获</text>
            </view>
            <view class="metric-value warning">{{ metrics.casesSeized }}</view>
            <view class="metric-sub">本月 {{ metrics.casesThisMonth }}起</view>
            <view class="case-tags">
              <view class="case-tag" v-for="t in metrics.caseTypeBreakdown.slice(0, 3)" :key="t.type">
                <text>{{ t.label }}</text>
                <text>{{ t.count }}</text>
              </view>
            </view>
          </view>

          <!-- 设备健康 -->
          <view class="metric-card">
            <view class="metric-header">
              <text class="metric-icon">📡</text>
              <text class="metric-title">设备健康</text>
            </view>
            <view class="metric-value" :class="getHealthClass(metrics.deviceHealth)">
              {{ metrics.deviceHealth }}%
            </view>
            <view class="health-rings">
              <view class="ring-item">
                <text class="ring-label">在线</text>
                <text class="ring-value online">{{ metrics.devicesOnline }}</text>
              </view>
              <view class="ring-item">
                <text class="ring-label">离线</text>
                <text class="ring-value offline">{{ metrics.devicesOffline }}</text>
              </view>
            </view>
          </view>

          <!-- 响应时效 -->
          <view class="metric-card">
            <view class="metric-header">
              <text class="metric-icon">⏱️</text>
              <text class="metric-title">平均响应</text>
            </view>
            <view class="metric-value primary">{{ metrics.avgResponseTime }}</view>
            <view class="metric-sub">分钟内到达</view>
            <view class="time-distribution">
              <view v-for="t in metrics.responseDistribution" :key="t.label" class="time-bar">
                <text class="time-label">{{ t.label }}</text>
                <view class="time-track">
                  <view class="time-fill" :style="{ width: t.percent + '%', background: t.color }"></view>
                </view>
                <text class="time-value">{{ t.count }}</text>
              </view>
            </view>
          </view>

          <!-- 生态健康 -->
          <view class="metric-card">
            <view class="metric-header">
              <text class="metric-icon">🌿</text>
              <text class="metric-title">生态指数</text>
            </view>
            <view class="metric-value" :class="getEcoHealthClass(metrics.ecoHealthIndex)">
              {{ metrics.ecoHealthIndex }}
            </view>
            <view class="metric-sub">综合生态健康评分</view>
            <view class="eco-indicators">
              <view class="eco-item" v-for="e in metrics.ecoIndicators" :key="e.name">
                <text>{{ e.name }}</text>
                <text :style="{ color: e.color }">{{ e.value }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 多部门力量态势 -->
      <view class="cockpit-section">
        <view class="section-title">
          <text class="title">多部门力量态势</text>
          <text class="subtitle">Multi-Department Force Status</text>
        </view>

        <view class="force-list">
          <view v-for="force in forceStatus" :key="force.dept" class="force-card">
            <view class="force-header">
              <view class="force-icon" :style="{ background: force.color }">
                {{ force.icon }}
              </view>
              <view class="force-info">
                <text class="force-name">{{ force.dept }}</text>
                <text class="force-stat">{{ force.persons }}人 · {{ force.vehicles }}车</text>
              </view>
              <view class="force-status-badge" :class="force.status">
                {{ force.status === 'active' ? '执勤中' : '待命' }}
              </view>
            </view>
            <view class="force-location">
              <text class="location-icon">📍</text>
              <text class="location-text">{{ force.location }}</text>
            </view>
            <view class="force-actions">
              <view class="force-btn" @click="communicate(force)">
                <text>📞</text>
                <text>通信</text>
              </view>
              <view class="force-btn" @click="dispatchForce(force)">
                <text>📍</text>
                <text>调度</text>
              </view>
              <view class="force-btn" @click="viewDetails(force)">
                <text>📋</text>
                <text>详情</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 风险热力图 -->
      <view class="cockpit-section">
        <view class="section-title">
          <text class="title">区域风险热力</text>
          <text class="subtitle">Regional Risk Heatmap</text>
        </view>

        <view class="heatmap-container">
          <view class="heatmap-grid">
            <view
              v-for="(cell, idx) in riskHeatmap"
              :key="idx"
              class="heatmap-cell"
              :style="{
                background: `rgba(${hexToRgb(cell.color)}, ${cell.intensity})`,
                height: cell.height + 'px'
              }"
              @click="selectRegion(cell)"
            >
              <text class="cell-label">{{ cell.name }}</text>
              <text class="cell-value">{{ cell.risk }}</text>
            </view>
          </view>
          <view class="heatmap-legend">
            <text class="legend-label">低</text>
            <view class="legend-gradient"></view>
            <text class="legend-label">高</text>
          </view>
        </view>
      </view>

      <!-- 联合行动 -->
      <view class="cockpit-section">
        <view class="section-title">
          <text class="title">联合行动</text>
          <text class="subtitle">Joint Operations</text>
          <view class="add-btn" @click="initiateJointOperation">+发起行动</view>
        </view>

        <view v-for="op in jointOperations" :key="op.id" class="operation-card" :class="op.status">
          <view class="op-header">
            <view class="op-badge" :class="op.status">{{ getOpStatusLabel(op.status) }}</view>
            <text class="op-code">{{ op.code }}</text>
          </view>
          <view class="op-title">{{ op.title }}</view>
          <view class="op-meta">
            <text>参与部门：{{ op.departments.join('、') }}</text>
            <text>参与人员：{{ op.persons }}人</text>
          </view>
          <view class="op-timeline">
            <view class="timeline-bar">
              <view class="timeline-progress" :style="{ width: op.progress + '%' }"></view>
            </view>
            <text class="timeline-label">{{ op.progress }}%</text>
          </view>
        </view>
      </view>

      <!-- 绩效评估 -->
      <view class="cockpit-section">
        <view class="section-title">
          <text class="title">绩效评估</text>
          <text class="subtitle">Performance Evaluation</text>
        </view>

        <view class="performance-grid">
          <view v-for="item in performanceData" :key="item.id" class="performance-card">
            <view class="perf-rank" :class="'rank-' + item.rank">{{ item.rank }}</view>
            <view class="perf-info">
              <text class="perf-name">{{ item.name }}</text>
              <text class="perf-role">{{ item.role }}</text>
            </view>
            <view class="perf-score">
              <text class="score-value" :class="'score-' + getScoreClass(item.score)">{{ item.score }}</text>
              <text class="score-label">分</text>
            </view>
            <view class="perf-metrics">
              <view class="perf-metric">
                <text class="metric-label">出勤</text>
                <text class="metric-val">{{ item.dutyDays }}天</text>
              </view>
              <view class="perf-metric">
                <text class="metric-label">处置</text>
                <text class="metric-val">{{ item.dealt }}起</text>
              </view>
              <view class="perf-metric">
                <text class="metric-label">响应</text>
                <text class="metric-val">{{ item.responseRate }}%</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 紧急告警横幅 -->
    <view v-if="hasActiveAlert" class="alert-banner" @click="toggleAlertPanel">
      <view class="banner-content">
        <text class="pulse-icon">🚨</text>
        <view class="banner-text">
          <text class="banner-title">紧急预警</text>
          <text class="banner-sub">{{ latestAlert.title || '收到新紧急预警' }}</text>
        </view>
        <text class="banner-action">查看 →</text>
      </view>
    </view>

    <!-- 联合行动发起弹窗 -->
    <view v-if="showJointOpModal" class="modal-overlay" @click="showJointOpModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">发起联合行动</text>
          <text class="modal-close" @click="showJointOpModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">行动名称</text>
            <input class="form-input" v-model="newOp.title" placeholder="请输入行动名称" />
          </view>
          <view class="form-item">
            <text class="form-label">参与部门</text>
            <view class="dept-checkboxes">
              <view
                v-for="d in availableDepts"
                :key="d.code"
                class="dept-checkbox"
                :class="{ selected: newOp.departments.includes(d.code) }"
                @click="toggleDept(d.code)"
              >
                <text>{{ d.name }}</text>
              </view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">行动类型</text>
            <picker :value="newOp.typeIndex" :range="opTypes" range-key="label" @change="onOpTypeChange">
              <view class="picker-value">{{ opTypes[newOp.typeIndex]?.label || '请选择' }}</view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">行动目的</text>
            <textarea class="form-textarea" v-model="newOp.purpose" placeholder="请描述行动目的" />
          </view>
        </view>
        <view class="modal-footer">
          <view class="modal-btn cancel" @click="showJointOpModal = false">取消</view>
          <view class="modal-btn confirm" @click="submitJointOperation">确认发起</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../../stores/app.js';
import { useIntelligenceStore } from '../../stores/intelligence.js';
import { BUSINESS_CONSTANTS } from '../../utils/systemConfig.js';

const appStore = useAppStore();
const intelligenceStore = useIntelligenceStore();

const selectedZone = ref('PINGXIANG');
const hasActiveAlert = ref(true);
const activeAlertCount = ref(3);
const latestAlert = ref({ title: '凭祥友谊关发现可疑车辆', id: 'ALT-001' });
const showJointOpModal = ref(false);

const zones = [
  { code: 'PINGXIANG', name: '凭祥友谊关', alertCount: 5 },
  { code: 'DONGXING', name: '东兴口岸', alertCount: 3 },
  { code: 'LONGZHOU', name: '龙州水口', alertCount: 2 },
  { code: 'JINGXI', name: '靖西岳圩', alertCount: 1 },
  { code: 'NAPO', name: '那坡平孟', alertCount: 4 },
];

const metrics = ref({
  todayAlerts: 47,
  alertsTrend: 12,
  criticalAlerts: 5,
  warningAlerts: 18,
  infoAlerts: 24,
  tasksCompleted: 38,
  tasksInProgress: 12,
  taskCompletionRate: 76,
  casesSeized: 23,
  casesThisMonth: 23,
  caseTypeBreakdown: [
    { type: 'WLS', label: '野生动物', count: 12 },
    { type: 'ENP', label: '环境犯罪', count: 6 },
    { type: 'FDS', label: '食品安全', count: 5 },
  ],
  deviceHealth: 94,
  devicesOnline: 156,
  devicesOffline: 10,
  avgResponseTime: 8.5,
  responseDistribution: [
    { label: '5分钟内', percent: 65, count: 28, color: '#52C41A' },
    { label: '10分钟内', percent: 25, count: 11, color: '#73D13D' },
    { label: '30分钟内', percent: 7, count: 3, color: '#FFA940' },
    { label: '超时', percent: 3, count: 1, color: '#FF4D4F' },
  ],
  ecoHealthIndex: 78,
  ecoIndicators: [
    { name: '物种多样性', value: '良好', color: '#52C41A' },
    { name: '水质指数', value: '合格', color: '#73D13D' },
    { name: '空气质量', value: '优良', color: '#00D4FF' },
  ],
});

const forceStatus = ref([
  { dept: '边境管理支队', icon: '🚔', color: '#1890FF', persons: 24, vehicles: 6, status: 'active', location: '凭祥市友谊关附近' },
  { dept: '森林警察大队', icon: '🌲', color: '#52C41A', persons: 18, vehicles: 4, status: 'active', location: '龙州县水口镇' },
  { dept: '海关缉私局', icon: '🚢', color: '#722ED1', persons: 12, vehicles: 3, status: 'standby', location: '东兴北仑河口' },
  { dept: '地方公安边防', icon: '👮', color: '#FA8C16', persons: 30, vehicles: 8, status: 'active', location: '靖西市岳圩镇' },
  { dept: '市场监管局', icon: '🏢', color: '#EB2F96', persons: 8, vehicles: 2, status: 'standby', location: '那坡县平孟镇' },
]);

const riskHeatmap = ref([
  { name: '友谊关', risk: 87, intensity: 0.9, color: '#FF4D4F' },
  { name: '水口关', risk: 72, intensity: 0.7, color: '#FF7A45' },
  { name: '北仑河', risk: 65, intensity: 0.6, color: '#FFA940' },
  { name: '岳圩', risk: 48, intensity: 0.4, color: '#FFA940' },
  { name: '平孟', risk: 55, intensity: 0.5, color: '#FFA940' },
]);

const jointOperations = ref([
  { id: 'OP-001', code: '行动-2026-015', title: '边境野生动物走私专项打击行动', status: 'active', departments: ['边境管理', '森林警察', '海关缉私'], persons: 68, progress: 65 },
  { id: 'OP-002', code: '行动-2026-014', title: '龙州水污染事件溯源调查', status: 'active', departments: ['生态环境', '市场监管'], persons: 24, progress: 40 },
  { id: 'OP-003', code: '行动-2026-013', title: '清明期间生态资源保护专项行动', status: 'completed', departments: ['森林警察', '地方公安'], persons: 45, progress: 100 },
]);

const performanceData = ref([
  { id: 1, rank: 1, name: '李志明', role: '指挥调度', score: 98, dutyDays: 28, dealt: 45, responseRate: 98 },
  { id: 2, rank: 2, name: '王海涛', role: '侦查研判', score: 95, dutyDays: 27, dealt: 38, responseRate: 95 },
  { id: 3, rank: 3, name: '张晓峰', role: '一线执勤', score: 92, dutyDays: 30, dealt: 52, responseRate: 92 },
  { id: 4, rank: 4, name: '陈伟强', role: '技术保障', score: 89, dutyDays: 26, dealt: 30, responseRate: 96 },
]);

const availableDepts = [
  { code: 'BORDER', name: '边境管理' },
  { code: 'FOREST', name: '森林警察' },
  { code: 'CUSTOMS', name: '海关缉私' },
  { code: 'POLICE', name: '地方公安' },
  { code: 'MARKET', name: '市场监管' },
  { code: 'ECO', name: '生态环境' },
  { code: 'HEALTH', name: '卫生健康' },
];

const opTypes = [
  { label: '走私防控', value: 'anti_smuggling' },
  { label: '边境执法', value: 'border_patrol' },
  { label: '综合整治', value: 'comprehensive' },
];

const newOp = ref({
  title: '',
  departments: ['BORDER'],
  typeIndex: 0,
  purpose: '',
});

function goBack() { uni.navigateBack(); }

function toggleAlertPanel() {
  uni.vibrateShort && uni.vibrateShort();
  uni.navigateTo({ url: '/pages/Alert Center/Alert Center' });
}

function selectZone(code) {
  selectedZone.value = code;
  uni.vibrateShort && uni.vibrateShort();
}

function communicate(force) {
  uni.showModal({
    title: '通信调度',
    content: `确认与 ${force.dept} 建立通信连接？`,
    success: res => {
      if (res.confirm) {
        uni.showToast({ title: '连接已建立', icon: 'success' });
      }
    },
  });
}

function dispatchForce(force) {
  uni.vibrateShort && uni.vibrateShort();
  uni.showModal({
    title: '力量调度',
    content: `将 ${force.dept} 调度至当前位置？\n调度人员：${force.persons}人\n交通工具：${force.vehicles}辆`,
    success: res => {
      if (res.confirm) {
        uni.showToast({ title: '调度指令已下发', icon: 'success' });
      }
    },
  });
}

function viewDetails(force) {
  uni.showModal({
    title: force.dept,
    content: `执勤人员：${force.persons}人\n执勤车辆：${force.vehicles}辆\n当前位置：${force.location}\n执勤状态：${force.status === 'active' ? '执勤中' : '待命'}`,
    showCancel: false,
  });
}

function selectRegion(cell) {
  uni.vibrateShort && uni.vibrateShort();
  uni.showModal({
    title: `${cell.name} 风险评估`,
    content: `风险等级：${cell.risk}\n建议：${cell.risk >= 70 ? '需重点关注' : cell.risk >= 50 ? '持续监控' : '常规巡逻'}`,
    showCancel: false,
  });
}

function getOpStatusLabel(status) {
  const map = { active: '进行中', planned: '计划中', completed: '已结束', cancelled: '已取消' };
  return map[status] || status;
}

function initiateJointOperation() {
  showJointOpModal.value = true;
  uni.vibrateShort && uni.vibrateShort();
}

function toggleDept(code) {
  const idx = newOp.value.departments.indexOf(code);
  if (idx === -1) {
    newOp.value.departments.push(code);
  } else if (newOp.value.departments.length > 1) {
    newOp.value.departments.splice(idx, 1);
  }
}

function onOpTypeChange(e) {
  newOp.value.typeIndex = e.detail.value;
}

function submitJointOperation() {
  if (!newOp.value.title.trim()) {
    uni.showToast({ title: '请输入行动名称', icon: 'none' });
    return;
  }
  uni.vibrateShort && uni.vibrateShort();
  showJointOpModal.value = false;
  uni.showToast({ title: '联合行动已发起', icon: 'success' });
  jointOperations.value.unshift({
    id: `OP-${Date.now()}`,
    code: `行动-2026-${String(jointOperations.value.length + 16).padStart(3, '0')}`,
    title: newOp.value.title,
    status: 'planned',
    departments: newOp.value.departments.map(c => {
      const found = availableDepts.find(d => d.code === c);
      return found ? found.name : c;
    }),
    persons: 0,
    progress: 0,
  });
  newOp.value = { title: '', departments: ['BORDER'], typeIndex: 0, purpose: '' };
}

function getHealthClass(value) {
  if (value >= 90) return 'excellent';
  if (value >= 75) return 'good';
  if (value >= 60) return 'warning';
  return 'danger';
}

function getEcoHealthClass(value) {
  if (value >= 80) return 'excellent';
  if (value >= 60) return 'good';
  return 'warning';
}

function getScoreClass(score) {
  if (score >= 95) return 'excellent';
  if (score >= 85) return 'good';
  if (score >= 75) return 'fair';
  return 'normal';
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

onMounted(() => {
  uni.setNavigationBarTitle({ title: '联合指挥中心' });
});
</script>

<style lang="scss" scoped>
@mixin night-mode {
  --bg-color: #1A0000;
  --surface-color: #2D0000;
  --border-color: #4D0000;
  --text-color: #FF6B6B;
  --accent: #CC3333;
}

.command-page {
  min-height: 100vh;
  background: #060A14;
  color: #E8F4FF;
  padding-bottom: 120rpx;

  &.night-mode { @include night-mode; }
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
    .subtitle { font-size: 20rpx; color: #7AA8CC; letter-spacing: 1px; } }
  .nav-actions { width: 60rpx; }
  .action-btn { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; position: relative;
    .icon { font-size: 36rpx; }
    .alert-badge {
      position: absolute; top: 4rpx; right: 4rpx;
      background: #FF4D4F; color: #fff; font-size: 18rpx; font-weight: 700;
      border-radius: 50%; width: 28rpx; height: 28rpx;
      display: flex; align-items: center; justify-content: center;
    }
    &.active .icon { animation: alert-flash 1s infinite; }
  }
}

@keyframes alert-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.zone-selector {
  background: #0C1B2A;
  padding: 20rpx 0;
  border-bottom: 1px solid #1A3350;

  .zone-tabs {
    display: flex;
    gap: 16rpx;
    padding: 0 30rpx;
    width: max-content;
  }

  .zone-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16rpx 28rpx;
    border-radius: 12rpx;
    background: #060A14;
    border: 1px solid #1A3350;
    min-width: 140rpx;
    transition: all 0.2s;

    .zone-name { font-size: 26rpx; font-weight: 600; color: #7AA8CC; }
    .zone-stat { font-size: 20rpx; color: #4A6A8A; margin-top: 4rpx; }

    &.active {
      background: rgba(0, 212, 255, 0.1);
      border-color: #00D4FF;
      .zone-name { color: #00D4FF; }
    }
  }
}

.main-content {
  height: calc(100vh - 280rpx);
  padding: 0 30rpx;
}

.cockpit-section {
  margin-bottom: 40rpx;

  .section-title {
    display: flex;
    align-items: baseline;
    gap: 12rpx;
    margin-bottom: 20rpx;
    padding-top: 30rpx;

    .title { font-size: 30rpx; font-weight: 700; color: #E8F4FF; }
    .subtitle { font-size: 20rpx; color: #4A6A8A; letter-spacing: 1px; }
    .add-btn { margin-left: auto; font-size: 24rpx; color: #00D4FF; }
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;

  .metric-card {
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 20rpx;
    border: 1px solid #1A3350;

    &.large {
      grid-column: span 2;
      .metric-breakdown {
        display: flex;
        justify-content: space-around;
        margin-top: 16rpx;
        padding-top: 16rpx;
        border-top: 1px solid #1A3350;

        .breakdown-item {
          text-align: center;
          .count { font-size: 36rpx; font-weight: 800; display: block; }
          .label { font-size: 20rpx; color: #7AA8CC; }
          &.critical .count { color: #FF4D4F; }
          &.warning .count { color: #FFA940; }
          &.info .count { color: #00D4FF; }
        }
      }
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 8rpx;
      .metric-icon { font-size: 24rpx; }
      .metric-title { font-size: 22rpx; color: #7AA8CC; }
    }

    .metric-value {
      font-size: 44rpx;
      font-weight: 800;
      color: #E8F4FF;
      line-height: 1.2;

      &.primary { color: #00D4FF; }
      &.success { color: #52C41A; }
      &.warning { color: #FFA940; }
      &.excellent { color: #52C41A; }
      &.good { color: #73D13D; }
      &.danger { color: #FF4D4F; }
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: 4rpx;
      font-size: 20rpx;
      margin-top: 4rpx;
      &.up { color: #FF4D4F; }
      &.down { color: #52C41A; }
    }

    .metric-sub { font-size: 22rpx; color: #7AA8CC; margin-top: 4rpx; }

    .progress-bar {
      height: 8rpx;
      background: #1A3350;
      border-radius: 4rpx;
      margin-top: 12rpx;
      overflow: hidden;
      .progress-fill { height: 100%; background: linear-gradient(90deg, #00D4FF, #007AFF); border-radius: 4rpx; }
    }

    .progress-label { font-size: 20rpx; color: #7AA8CC; margin-top: 6rpx; }

    .case-tags {
      display: flex;
      gap: 8rpx;
      margin-top: 10rpx;
      flex-wrap: wrap;
      .case-tag {
        display: flex;
        gap: 6rpx;
        padding: 4rpx 10rpx;
        background: rgba(114, 46, 209, 0.15);
        border-radius: 6rpx;
        font-size: 20rpx;
        color: #722ED1;
      }
    }

    .health-rings {
      display: flex;
      gap: 20rpx;
      margin-top: 10rpx;
      .ring-item { text-align: center; }
      .ring-label { font-size: 20rpx; color: #4A6A8A; display: block; }
      .ring-value { font-size: 26rpx; font-weight: 600; display: block;
        &.online { color: #52C41A; }
        &.offline { color: #FF4D4F; }
      }
    }

    .time-distribution {
      margin-top: 12rpx;
      .time-bar {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-bottom: 6rpx;
        .time-label { font-size: 20rpx; color: #7AA8CC; width: 80rpx; }
        .time-track { flex: 1; height: 8rpx; background: #1A3350; border-radius: 4rpx; overflow: hidden; }
        .time-fill { height: 100%; border-radius: 4rpx; }
        .time-value { font-size: 20rpx; color: #7AA8CC; width: 40rpx; text-align: right; }
      }
    }

    .eco-indicators {
      margin-top: 10rpx;
      .eco-item {
        display: flex;
        justify-content: space-between;
        font-size: 22rpx;
        color: #7AA8CC;
        padding: 4rpx 0;
      }
    }
  }
}

.force-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .force-card {
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 20rpx;
    border: 1px solid #1A3350;

    .force-header {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 12rpx;
      .force-icon { width: 72rpx; height: 72rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; font-size: 36rpx; }
      .force-info { flex: 1; .force-name { font-size: 28rpx; font-weight: 600; color: #E8F4FF; display: block; } .force-stat { font-size: 22rpx; color: #7AA8CC; } }
      .force-status-badge {
        padding: 6rpx 16rpx;
        border-radius: 8rpx;
        font-size: 22rpx;
        &.active { background: rgba(82, 196, 26, 0.15); color: #52C41A; }
        &.standby { background: rgba(255, 169, 64, 0.15); color: #FFA940; }
      }
    }

    .force-location {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 12rpx;
      font-size: 22rpx;
      color: #4A6A8A;
      .location-icon { font-size: 24rpx; }
    }

    .force-actions {
      display: flex;
      gap: 16rpx;
      .force-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6rpx;
        padding: 12rpx 0;
        background: #1A3350;
        border-radius: 10rpx;
        font-size: 22rpx;
        color: #7AA8CC;
        &:active { background: rgba(0, 212, 255, 0.1); color: #00D4FF; }
      }
    }
  }
}

.heatmap-container {
  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8rpx;
    margin-bottom: 16rpx;

    .heatmap-cell {
      border-radius: 12rpx;
      padding: 16rpx 8rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;

      &:active { transform: scale(0.95); }

      .cell-label { font-size: 20rpx; color: rgba(255, 255, 255, 0.9); font-weight: 600; }
      .cell-value { font-size: 24rpx; font-weight: 800; color: #fff; margin-top: 4rpx; }
    }
  }

  .heatmap-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;

    .legend-label { font-size: 20rpx; color: #4A6A8A; }
    .legend-gradient {
      width: 200rpx;
      height: 16rpx;
      border-radius: 8rpx;
      background: linear-gradient(90deg, #52C41A, #FFA940, #FF7A45, #FF4D4F);
    }
  }
}

.operation-card {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  border: 1px solid #1A3350;

  &.active { border-color: rgba(255, 169, 64, 0.4); }
  &.completed { opacity: 0.7; }

  .op-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 10rpx;
    .op-badge {
      padding: 4rpx 12rpx;
      border-radius: 6rpx;
      font-size: 20rpx;
      &.active { background: rgba(255, 169, 64, 0.15); color: #FFA940; }
      &.completed { background: rgba(82, 196, 26, 0.15); color: #52C41A; }
    }
    .op-code { font-size: 20rpx; color: #4A6A8A; font-family: monospace; }
  }

  .op-title { font-size: 26rpx; font-weight: 600; color: #E8F4FF; margin-bottom: 8rpx; }
  .op-meta {
    display: flex;
    gap: 16rpx;
    font-size: 22rpx;
    color: #7AA8CC;
    margin-bottom: 12rpx;
  }

  .op-timeline {
    display: flex;
    align-items: center;
    gap: 12rpx;
    .timeline-bar { flex: 1; height: 8rpx; background: #1A3350; border-radius: 4rpx; overflow: hidden; }
    .timeline-progress { height: 100%; background: linear-gradient(90deg, #FFA940, #FF4D4F); border-radius: 4rpx; }
    .timeline-label { font-size: 22rpx; color: #7AA8CC; width: 60rpx; text-align: right; }
  }
}

.performance-grid {
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  .performance-card {
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 16rpx 20rpx;
    border: 1px solid #1A3350;

    .perf-rank {
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26rpx;
      font-weight: 800;
      &.rank-1 { background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; }
      &.rank-2 { background: linear-gradient(135deg, #C0C0C0, #A0A0A0); color: #000; }
      &.rank-3 { background: linear-gradient(135deg, #CD7F32, #8B4513); color: #fff; }
      &.rank-4, &.rank-5 { background: #1A3350; color: #7AA8CC; }
    }

    .perf-info {
      flex: 1;
      .perf-name { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; }
      .perf-role { font-size: 20rpx; color: #7AA8CC; }
    }

    .perf-score {
      display: flex;
      align-items: baseline;
      gap: 4rpx;
      .score-value { font-size: 36rpx; font-weight: 800;
        &.score-excellent { color: #52C41A; }
        &.score-good { color: #73D13D; }
        &.score-fair { color: #FFA940; }
        &.score-normal { color: #7AA8CC; }
      }
      .score-label { font-size: 22rpx; color: #7AA8CC; }
    }

    .perf-metrics {
      display: flex;
      gap: 16rpx;
      .perf-metric {
        text-align: center;
        .metric-label { font-size: 18rpx; color: #4A6A8A; display: block; }
        .metric-val { font-size: 22rpx; color: #E8F4FF; font-weight: 600; }
      }
    }
  }
}

.alert-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 77, 79, 0.95);
  backdrop-filter: blur(10px);
  z-index: 999;
  padding: 24rpx 30rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  animation: banner-pulse 2s infinite;

  &:active { transform: scale(0.99); }

  .banner-content {
    display: flex;
    align-items: center;
    gap: 16rpx;
    .pulse-icon { font-size: 40rpx; animation: pulse 1s infinite; }
    .banner-text { flex: 1; .banner-title { font-size: 26rpx; font-weight: 700; color: #fff; display: block; } .banner-sub { font-size: 22rpx; color: rgba(255, 255, 255, 0.8); } }
    .banner-action { font-size: 26rpx; color: #fff; font-weight: 600; }
  }
}

@keyframes banner-pulse {
  0%, 100% { box-shadow: 0 -4rpx 20rpx rgba(255, 77, 79, 0.3); }
  50% { box-shadow: 0 -4rpx 40rpx rgba(255, 77, 79, 0.6); }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: flex-end;

  .modal-content {
    width: 100%;
    background: #0C1B2A;
    border-radius: 24rpx 24rpx 0 0;
    padding: 30rpx;
    max-height: 85vh;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    .modal-title { font-size: 30rpx; font-weight: 700; color: #E8F4FF; }
    .modal-close { font-size: 48rpx; color: #7AA8CC; }
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
      .form-textarea {
        width: 100%;
        height: 120rpx;
        background: #060A14;
        border: 1px solid #1A3350;
        border-radius: 12rpx;
        padding: 16rpx 20rpx;
        font-size: 28rpx;
        color: #E8F4FF;
      }
    }
    .dept-checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      .dept-checkbox {
        padding: 10rpx 20rpx;
        border-radius: 20rpx;
        background: #060A14;
        border: 1px solid #1A3350;
        font-size: 24rpx;
        color: #7AA8CC;
        &.selected { background: rgba(0, 212, 255, 0.15); border-color: #00D4FF; color: #00D4FF; }
      }
    }
    .picker-value {
      background: #060A14;
      border: 1px solid #1A3350;
      border-radius: 12rpx;
      padding: 16rpx 20rpx;
      font-size: 28rpx;
      color: #E8F4FF;
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
}
</style>
