<template>
  <view class="intelligence-page" :class="{ 'night-mode': appStore.nightModeEnabled }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <view class="nav-title">
        <text class="title-text">情报研判中心</text>
        <text class="subtitle">Intelligence Center</text>
      </view>
      <view class="nav-actions">
        <view class="action-btn" @click="refreshIntelligence">
          <text class="icon">⟳</text>
        </view>
      </view>
    </view>

    <!-- 情报统计概览 -->
    <view class="stats-panel">
      <view class="stat-card critical" @click="switchTab('clues')">
        <view class="stat-value">{{ intelligenceStore.stats.totalClues }}</view>
        <view class="stat-label">情报总数</view>
        <view class="stat-sub">{{ intelligenceStore.stats.pendingClues }} 待处理</view>
      </view>
      <view class="stat-card warning" @click="switchTab('clusters')">
        <view class="stat-value">{{ intelligenceStore.stats.totalClusters }}</view>
        <view class="stat-label">案件串并</view>
        <view class="stat-sub">{{ intelligenceStore.stats.activeClusters }} 进行中</view>
      </view>
      <view class="stat-card success" @click="switchTab('tactics')">
        <view class="stat-value">{{ intelligenceStore.tacticModels.length }}</view>
        <view class="stat-label">战法模型</view>
        <view class="stat-sub">准确率{{ avgModelAccuracy }}%</view>
      </view>
    </view>

    <!-- Tab切换 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: currentTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <text class="tab-icon">{{ tab.icon }}</text>
        <text class="tab-label">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 线索池 -->
    <scroll-view v-if="currentTab === 'clues'" class="content-scroll" scroll-y>
      <!-- 筛选栏 -->
      <view class="filter-bar">
        <view class="filter-item" :class="{ active: clueFilter.type === 'all' }" @click="setFilter('type', 'all')">
          <text>全部</text>
        </view>
        <view class="filter-item" :class="{ active: clueFilter.type === 'wildlife' }" @click="setFilter('type', 'wildlife')">
          <text>野生</text>
        </view>
        <view class="filter-item" :class="{ active: clueFilter.type === 'environment' }" @click="setFilter('type', 'environment')">
          <text>环境</text>
        </view>
        <view class="filter-item" :class="{ active: clueFilter.type === 'food' }" @click="setFilter('type', 'food')">
          <text>食药</text>
        </view>
        <view class="filter-item confidence" :class="{ active: clueFilter.confidence !== 'all' }" @click="showConfidenceFilter = !showConfidenceFilter">
          <text>可信度 {{ clueFilter.confidence === 'all' ? '▼' : '▲' }}</text>
        </view>
      </view>

      <!-- 置信度筛选下拉 -->
      <view v-if="showConfidenceFilter" class="confidence-dropdown">
        <view
          v-for="level in confidenceLevels"
          :key="level.key"
          class="confidence-item"
          :class="{ active: clueFilter.confidence === level.key }"
          @click="setFilter('confidence', level.key); showConfidenceFilter = false"
        >
          <view class="confidence-dot" :style="{ background: level.color }"></view>
          <text>{{ level.label }}</text>
        </view>
      </view>

      <!-- 高优先级线索高亮 -->
      <view v-if="intelligenceStore.highPriorityClues.length > 0" class="high-priority-section">
        <view class="section-header">
          <view class="pulse-dot"></view>
          <text>高优先级线索 ({{ intelligenceStore.highPriorityClues.length }})</text>
        </view>
        <view
          v-for="clue in intelligenceStore.highPriorityClues.slice(0, 3)"
          :key="clue.id"
          class="clue-card high-priority"
          @click="selectClue(clue)"
        >
          <view class="clue-header">
            <view class="clue-type-tag" :style="{ background: getTypeConfig(clue.type).color }">
              {{ getTypeConfig(clue.type).label }}
            </view>
            <view class="confidence-badge" :style="{ color: getConfidenceConfig(clue.confidenceLevel).color }">
              {{ getConfidenceConfig(clue.confidenceLevel).label }}
            </view>
          </view>
          <view class="clue-content">{{ clue.description }}</view>
          <view class="clue-footer">
            <text class="clue-location">{{ clue.location }}</text>
            <text class="clue-time">{{ formatTime(clue.createdAt) }}</text>
          </view>
          <view class="recommended-action">
            <text class="action-icon">→</text>
            <text>{{ getRecommendedAction(clue) }}</text>
          </view>
        </view>
      </view>

      <!-- 全部线索列表 -->
      <view class="section-header">
        <text>全部线索 ({{ intelligenceStore.filteredClues.length }})</text>
      </view>
      <view
        v-for="clue in intelligenceStore.filteredClues"
        :key="clue.id"
        class="clue-card"
        @click="selectClue(clue)"
      >
        <view class="clue-header">
          <view class="clue-type-tag" :style="{ background: getTypeConfig(clue.type).color }">
            {{ getTypeConfig(clue.type).label }}
          </view>
          <view class="confidence-badge" :style="{ color: getConfidenceConfig(clue.confidenceLevel).color }">
            {{ getConfidenceConfig(clue.confidenceLevel).label }}
          </view>
          <view class="clue-status" :class="clue.status">{{ getStatusLabel(clue.status) }}</view>
        </view>
        <view class="clue-content">{{ clue.description }}</view>
        <view class="clue-footer">
          <text class="clue-location">📍 {{ clue.location }}</text>
          <text class="clue-time">{{ formatTime(clue.createdAt) }}</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="intelligenceStore.filteredClues.length === 0" class="empty-state">
        <text class="empty-icon">📡</text>
        <text class="empty-text">暂无线索数据</text>
        <text class="empty-sub">情报来源：传感器网络、群众举报、兄弟单位通报</text>
      </view>
    </scroll-view>

    <!-- 案件串并 -->
    <scroll-view v-if="currentTab === 'clusters'" class="content-scroll" scroll-y>
      <view class="cluster-grid">
        <view
          v-for="cluster in intelligenceStore.caseClusters"
          :key="cluster.id"
          class="cluster-card"
          :class="{ active: cluster.status === 'active' }"
          @click="selectCluster(cluster)"
        >
          <view class="cluster-header">
            <view class="cluster-id">#{{ cluster.id }}</view>
            <view class="cluster-status-badge" :class="cluster.status">
              {{ cluster.status === 'active' ? '进行中' : '已结案' }}
            </view>
          </view>
          <view class="cluster-title">{{ cluster.title }}</view>
          <view class="cluster-meta">
            <text>涉案{{ cluster.casesCount }}起</text>
            <text>涉及{{ cluster.involvedCount }}人</text>
          </view>
          <view class="cluster-tags">
            <view
              v-for="tag in cluster.tags"
              :key="tag"
              class="cluster-tag"
            >{{ tag }}</view>
          </view>
          <view class="cluster-connection">
            <text class="connection-icon">🔗</text>
            <text>{{ cluster.connectionCount }}个关联点</text>
          </view>
        </view>
      </view>

      <view v-if="intelligenceStore.caseClusters.length === 0" class="empty-state">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">暂无案件串并记录</text>
        <text class="empty-sub">系统将自动分析跨区域、跨时间的关联案件</text>
      </view>
    </scroll-view>

    <!-- 战法模型库 -->
    <scroll-view v-if="currentTab === 'tactics'" class="content-scroll" scroll-y>
      <view class="section-header">
        <text>战法模型库</text>
        <view class="add-btn" @click="showAddModel = true">+ 新增模型</view>
      </view>

      <view
        v-for="model in intelligenceStore.tacticModels"
        :key="model.id"
        class="tactic-card"
      >
        <view class="tactic-header">
          <view class="tactic-name">{{ model.name }}</view>
          <view class="tactic-type-tag" :class="model.type">{{ getModelTypeLabel(model.type) }}</view>
        </view>
        <view class="tactic-desc">{{ model.description }}</view>
        <view class="tactic-stats">
          <view class="tactic-stat">
            <text class="stat-label">准确率</text>
            <text class="stat-value accuracy" :class="getAccuracyClass(model.accuracy)">
              {{ Math.round(model.accuracy * 100) }}%
            </text>
          </view>
          <view class="tactic-stat">
            <text class="stat-label">使用次数</text>
            <text class="stat-value">{{ model.usageCount }}</text>
          </view>
          <view class="tactic-stat">
            <text class="stat-label">最近使用</text>
            <text class="stat-value">{{ formatTime(model.lastUsed) }}</text>
          </view>
        </view>
        <view class="tactic-actions">
          <view class="tactic-btn primary" @click="applyModel(model)">
            <text>应用模型</text>
          </view>
          <view class="tactic-btn" @click="viewModelDetail(model)">
            <text>详情</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 关系图谱 -->
    <scroll-view v-if="currentTab === 'graph'" class="content-scroll" scroll-y>
      <view class="graph-container">
        <view class="graph-placeholder">
          <text class="placeholder-icon">🕸️</text>
          <text class="placeholder-text">关系图谱</text>
          <text class="placeholder-sub">可视化人员/车辆/货物关联网络</text>
          <view class="legend">
            <view class="legend-item">
              <view class="legend-dot person"></view>
              <text>人员</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot vehicle"></view>
              <text>车辆</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot goods"></view>
              <text>货物</text>
            </view>
            <view class="legend-item">
              <view class="legend-dot location"></view>
              <text>地点</text>
            </view>
          </view>
        </view>

        <!-- 图例说明 -->
        <view class="graph-instructions">
          <text class="instruction-title">图谱说明</text>
          <view class="instruction-item">
            <text class="num">①</text>
            <text>节点代表实体（人员、车辆、货物、地点）</text>
          </view>
          <view class="instruction-item">
            <text class="num">②</text>
            <text>连线代表关系（运输、销售、联络）</text>
          </view>
          <view class="instruction-item">
            <text class="num">③</text>
            <text>节点颜色代表类型，大小代表重要程度</text>
          </view>
          <view class="instruction-item">
            <text class="num">④</text>
            <text>红色高亮为可疑关联，需重点关注</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部留白 -->
    <view class="bottom-space"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useIntelligenceStore } from '../../stores/intelligence.js';
import { useAppStore } from '../../stores/app.js';
import { BUSINESS_CONSTANTS } from '../../utils/systemConfig.js';

const intelligenceStore = useIntelligenceStore();
const appStore = useAppStore();

const currentTab = ref('clues');
const showConfidenceFilter = ref(false);
const showAddModel = ref(false);

const tabs = [
  { key: 'clues', label: '线索池', icon: '💡' },
  { key: 'clusters', label: '串并案', icon: '🔗' },
  { key: 'tactics', label: '战法库', icon: '🧠' },
  { key: 'graph', label: '关系图', icon: '🕸️' },
];

const confidenceLevels = [
  { key: 'all', label: '全部', color: '#00D4FF' },
  { key: 'VERY_HIGH', label: '高度可信', color: '#52C41A' },
  { key: 'HIGH', label: '较可信', color: '#73D13D' },
  { key: 'MEDIUM', label: '一般可信', color: '#FFA940' },
  { key: 'LOW', label: '较低可信', color: '#FF7A45' },
  { key: 'VERY_LOW', label: '存疑', color: '#FF4D4F' },
];

const clueFilter = ref({ type: 'all', confidence: 'all' });

const avgModelAccuracy = computed(() => {
  const models = intelligenceStore.tacticModels;
  if (models.length === 0) return 0;
  const sum = models.reduce((acc, m) => acc + m.accuracy, 0);
  return Math.round((sum / models.length) * 100);
});

function goBack() {
  uni.navigateBack();
}

function refreshIntelligence() {
  uni.vibrateShort && uni.vibrateShort();
  // 模拟刷新数据
  const mockClues = _generateMockClues();
  intelligenceStore.setClues(mockClues);
  const mockClusters = _generateMockClusters();
  intelligenceStore.setCaseClusters(mockClusters);
}

function switchTab(tab) {
  currentTab.value = tab;
  uni.vibrateShort && uni.vibrateShort();
}

function setFilter(key, value) {
  intelligenceStore.setClueFilter({ [key]: value });
  clueFilter.value[key] = value;
}

function selectClue(clue) {
  intelligenceStore.selectClue(clue);
  uni.navigateTo({ url: `/pages/Intelligence/clue-detail?id=${clue.id}` });
}

function selectCluster(cluster) {
  intelligenceStore.selectCluster(cluster);
  uni.navigateTo({ url: `/pages/Intelligence/cluster-detail?id=${cluster.id}` });
}

function applyModel(model) {
  uni.vibrateShort && uni.vibrateShort();
  uni.showModal({
    title: '应用战法模型',
    content: `确定应用「${model.name}」到当前情报分析？`,
    success: res => {
      if (res.confirm) {
        uni.showToast({ title: '模型已应用', icon: 'success' });
      }
    },
  });
}

function viewModelDetail(model) {
  uni.showModal({
    title: model.name,
    content: `${model.description}\n\n准确率: ${Math.round(model.accuracy * 100)}%\n使用次数: ${model.usageCount}\n法律依据: ${model.legalBasis || '暂无'}`,
    showCancel: false,
  });
}

function getTypeConfig(type) {
  const map = {
    wildlife: { label: '野生动物走私', color: '#722ED1' },
    environment: { label: '边境走私', color: '#13C2C2' },
  };
  return map[type] || { label: '其他', color: '#00D4FF' };
}

function getConfidenceConfig(level) {
  return BUSINESS_CONSTANTS.INTELLIGENCE_CONFIDENCE[level] || { label: '未知', color: '#999' };
}

function getStatusLabel(status) {
  const map = { pending: '待处理', processing: '核查中', verified: '已核实', dismissed: '已排除' };
  return map[status] || status;
}

function getModelTypeLabel(type) {
  const map = { pattern: '模式识别', anomaly: '异常检测', recognition: '目标识别', tracing: '溯源分析' };
  return map[type] || type;
}

function getAccuracyClass(accuracy) {
  if (accuracy >= 0.9) return 'excellent';
  if (accuracy >= 0.8) return 'good';
  if (accuracy >= 0.7) return 'fair';
  return 'poor';
}

function getRecommendedAction(clue) {
  if (clue.confidenceLevel === 'VERY_HIGH') return '立即部署核查力量';
  if (clue.confidenceLevel === 'HIGH') return '优先安排实地核查';
  return '纳入监控观察名单';
}

function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function _generateMockClues() {
  const types = ['wildlife', 'environment'];
  const locations = ['凭祥市友谊关', '东兴市北仑河口', '靖西市岳圩镇', '龙州县水口关', '那坡县平孟镇'];
  const descriptions = [
    '夜间卡口监控发现可疑货车，行李箱内疑似装有活体动物',
    '红外热成像检测到山区异常热源，疑似人员聚集',
    '水质监测传感器数据异常，氨氮含量超标300%',
    '群众举报某养殖场非法出售国家保护动物',
    '边境巡逻发现可疑车辆多次往返于同一路线',
    '化学传感器检测到不明粉末，疑似毒品或走私品',
    '可见光摄像头识别到受保护物种——穿山甲',
    '生态环境监测显示某区域生物多样性指数骤降',
  ];

  return Array.from({ length: 12 }, (_, i) => ({
    id: `CLUE-${i + 1}`,
    type: types[i % types.length],
    description: descriptions[i % descriptions.length],
    location: locations[i % locations.length],
    createdAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    confidenceLevel: ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW'][Math.floor(Math.random() * 5)],
    status: ['pending', 'processing', 'verified', 'dismissed'][Math.floor(Math.random() * 4)],
  }));
}

function _generateMockClusters() {
  return [
    {
      id: 'CLS-2026-001',
      title: '凭祥边境穿山甲走私团伙',
      status: 'active',
      casesCount: 5,
      involvedCount: 8,
      tags: ['穿山甲', '跨境', '有组织'],
      connectionCount: 12,
    },
    {
      id: 'CLS-2026-002',
      title: '东兴非法候鸟交易网络',
      status: 'active',
      casesCount: 3,
      involvedCount: 6,
      tags: ['候鸟', '野生动物', '市场交易'],
      connectionCount: 7,
    },
    {
      id: 'CLS-2026-003',
      title: '龙州水污染事件串并案',
      status: 'resolved',
      casesCount: 2,
      involvedCount: 3,
      tags: ['水污染', '化工', '企业'],
      connectionCount: 5,
    },
  ];
}

onMounted(() => {
  refreshIntelligence();
});
</script>

<style lang="scss" scoped>
@mixin night-mode-colors {
  --bg-color: #1A0000;
  --surface-color: #2D0000;
  --border-color: #4D0000;
  --text-color: #FF6B6B;
  --text-secondary: #993333;
  --accent: #CC3333;
}

.intelligence-page {
  min-height: 100vh;
  background: #060A14;
  color: #E8F4FF;
  padding-bottom: 40rpx;

  &.night-mode {
    @include night-mode-colors;
  }
}

// 顶部导航
.nav-header {
  display: flex;
  align-items: center;
  padding: 60rpx 30rpx 20rpx;
  background: linear-gradient(180deg, #0C1B2A 0%, #060A14 100%);
  border-bottom: 1px solid #1A3350;

  .nav-back {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    .icon { font-size: 36rpx; color: #00D4FF; }
  }

  .nav-title {
    flex: 1;
    text-align: center;
    .title-text { font-size: 36rpx; font-weight: 700; color: #E8F4FF; display: block; }
    .subtitle { font-size: 22rpx; color: #7AA8CC; letter-spacing: 2rpx; }
  }

  .nav-actions {
    width: 60rpx;
    .action-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      .icon { font-size: 36rpx; color: #00D4FF; }
    }
  }
}

// 统计面板
.stats-panel {
  display: flex;
  padding: 30rpx;
  gap: 20rpx;

  .stat-card {
    flex: 1;
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 24rpx 16rpx;
    text-align: center;
    border: 1px solid #1A3350;
    transition: all 0.2s;

    &:active { transform: scale(0.96); }

    &.critical { border-color: rgba(255, 77, 79, 0.3); }
    &.warning { border-color: rgba(255, 169, 64, 0.3); }
    &.success { border-color: rgba(82, 196, 26, 0.3); }

    .stat-value { font-size: 48rpx; font-weight: 800; color: #00D4FF; line-height: 1.2; }
    .stat-label { font-size: 22rpx; color: #7AA8CC; margin-top: 4rpx; }
    .stat-sub { font-size: 20rpx; color: #4A6A8A; margin-top: 4rpx; }

    &.critical .stat-value { color: #FF4D4F; }
    &.warning .stat-value { color: #FFA940; }
    &.success .stat-value { color: #52C41A; }
  }
}

// Tab栏
.tab-bar {
  display: flex;
  padding: 0 30rpx;
  gap: 12rpx;
  margin-bottom: 20rpx;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16rpx 0;
    border-radius: 12rpx;
    background: #0C1B2A;
    border: 1px solid #1A3350;
    transition: all 0.2s;

    .tab-icon { font-size: 32rpx; margin-bottom: 4rpx; }
    .tab-label { font-size: 22rpx; color: #7AA8CC; }

    &.active {
      background: rgba(0, 212, 255, 0.1);
      border-color: #00D4FF;
      .tab-label { color: #00D4FF; font-weight: 600; }
    }
  }
}

// 内容区
.content-scroll {
  height: calc(100vh - 420rpx);
  padding: 0 30rpx;
}

// 筛选栏
.filter-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;

  .filter-item {
    padding: 10rpx 20rpx;
    border-radius: 20rpx;
    background: #0C1B2A;
    border: 1px solid #1A3350;
    font-size: 24rpx;
    color: #7AA8CC;

    &.active {
      background: rgba(0, 212, 255, 0.15);
      border-color: #00D4FF;
      color: #00D4FF;
    }

    &.confidence {
      margin-left: auto;
      font-size: 22rpx;
    }
  }
}

.confidence-dropdown {
  background: #0C1B2A;
  border: 1px solid #1A3350;
  border-radius: 12rpx;
  padding: 12rpx 16rpx;
  margin-bottom: 20rpx;

  .confidence-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 16rpx;
    border-radius: 8rpx;
    font-size: 24rpx;
    color: #E8F4FF;

    &.active { background: rgba(0, 212, 255, 0.1); }
    .confidence-dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
  }
}

// 高优先级区域
.high-priority-section {
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 26rpx;
  color: #7AA8CC;
  margin-bottom: 16rpx;
  padding: 0 4rpx;

  .pulse-dot {
    width: 12rpx;
    height: 12rpx;
    background: #FF4D4F;
    border-radius: 50%;
    margin-right: 10rpx;
    animation: pulse 1.5s infinite;
  }

  .add-btn {
    color: #00D4FF;
    font-size: 24rpx;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

// 线索卡片
.clue-card {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  border: 1px solid #1A3350;
  transition: all 0.2s;

  &:active { transform: scale(0.98); }

  &.high-priority {
    border-color: rgba(255, 77, 79, 0.4);
    background: linear-gradient(135deg, rgba(255, 77, 79, 0.05) 0%, #0C1B2A 100%);
  }

  .clue-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;

    .clue-type-tag {
      padding: 4rpx 14rpx;
      border-radius: 6rpx;
      font-size: 20rpx;
      color: #fff;
    }

    .confidence-badge {
      font-size: 20rpx;
      font-weight: 600;
    }

    .clue-status {
      margin-left: auto;
      font-size: 20rpx;
      padding: 4rpx 12rpx;
      border-radius: 10rpx;
      &.pending { background: rgba(255, 169, 64, 0.15); color: #FFA940; }
      &.processing { background: rgba(0, 212, 255, 0.15); color: #00D4FF; }
      &.verified { background: rgba(82, 196, 26, 0.15); color: #52C41A; }
      &.dismissed { background: rgba(153, 153, 153, 0.15); color: #999; }
    }
  }

  .clue-content {
    font-size: 26rpx;
    color: #E8F4FF;
    line-height: 1.5;
    margin-bottom: 12rpx;
  }

  .clue-footer {
    display: flex;
    justify-content: space-between;
    font-size: 22rpx;
    color: #4A6A8A;
    .clue-location { color: #7AA8CC; }
  }

  .recommended-action {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-top: 12rpx;
    padding-top: 12rpx;
    border-top: 1px solid #1A3350;
    font-size: 22rpx;
    color: #00D4FF;

    .action-icon { color: #FF4D4F; }
  }
}

// 案件串并网格
.cluster-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.cluster-card {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 1px solid #1A3350;
  transition: all 0.2s;

  &:active { transform: scale(0.97); }

  &.active { border-color: rgba(255, 169, 64, 0.4); }

  .cluster-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;

    .cluster-id { font-size: 22rpx; color: #7AA8CC; font-family: monospace; }
    .cluster-status-badge {
      font-size: 20rpx;
      padding: 4rpx 10rpx;
      border-radius: 8rpx;
      &.active { background: rgba(255, 169, 64, 0.15); color: #FFA940; }
      &.resolved { background: rgba(82, 196, 26, 0.15); color: #52C41A; }
    }
  }

  .cluster-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #E8F4FF;
    margin-bottom: 10rpx;
  }

  .cluster-meta {
    display: flex;
    gap: 16rpx;
    font-size: 22rpx;
    color: #7AA8CC;
    margin-bottom: 12rpx;
  }

  .cluster-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
    margin-bottom: 12rpx;

    .cluster-tag {
      padding: 4rpx 12rpx;
      border-radius: 6rpx;
      background: rgba(114, 46, 209, 0.15);
      color: #722ED1;
      font-size: 20rpx;
    }
  }

  .cluster-connection {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 22rpx;
    color: #4A6A8A;
    .connection-icon { font-size: 24rpx; }
  }
}

// 战法模型卡片
.tactic-card {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1px solid #1A3350;

  .tactic-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10rpx;

    .tactic-name { font-size: 28rpx; font-weight: 600; color: #E8F4FF; }
    .tactic-type-tag {
      font-size: 20rpx;
      padding: 4rpx 12rpx;
      border-radius: 6rpx;
      &.pattern { background: rgba(114, 46, 209, 0.15); color: #722ED1; }
      &.anomaly { background: rgba(19, 194, 194, 0.15); color: #13C2C2; }
      &.recognition { background: rgba(0, 212, 255, 0.15); color: #00D4FF; }
      &.tracing { background: rgba(250, 140, 22, 0.15); color: #FA8C16; }
    }
  }

  .tactic-desc {
    font-size: 24rpx;
    color: #7AA8CC;
    margin-bottom: 16rpx;
    line-height: 1.5;
  }

  .tactic-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16rpx;
    padding: 12rpx 0;
    border-top: 1px solid #1A3350;
    border-bottom: 1px solid #1A3350;

    .tactic-stat {
      text-align: center;
      flex: 1;
      .stat-label { display: block; font-size: 20rpx; color: #4A6A8A; margin-bottom: 4rpx; }
      .stat-value { font-size: 26rpx; font-weight: 600; color: #E8F4FF;
        &.accuracy.excellent { color: #52C41A; }
        &.accuracy.good { color: #73D13D; }
        &.accuracy.fair { color: #FFA940; }
        &.accuracy.poor { color: #FF7A45; }
      }
    }
  }

  .tactic-actions {
    display: flex;
    gap: 16rpx;

    .tactic-btn {
      flex: 1;
      text-align: center;
      padding: 14rpx 0;
      border-radius: 10rpx;
      background: #1A3350;
      font-size: 24rpx;
      color: #7AA8CC;

      &.primary {
        background: linear-gradient(135deg, #00D4FF 0%, #007AFF 100%);
        color: #fff;
        font-weight: 600;
      }
    }
  }
}

// 关系图谱
.graph-container {
  .graph-placeholder {
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 60rpx 30rpx;
    text-align: center;
    border: 1px dashed #1A3350;
    margin-bottom: 30rpx;

    .placeholder-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
    .placeholder-text { font-size: 30rpx; color: #E8F4FF; font-weight: 600; display: block; margin-bottom: 8rpx; }
    .placeholder-sub { font-size: 22rpx; color: #7AA8CC; display: block; margin-bottom: 30rpx; }

    .legend {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 24rpx;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: #7AA8CC;

        .legend-dot {
          width: 20rpx;
          height: 20rpx;
          border-radius: 50%;
          &.person { background: #00D4FF; }
          &.vehicle { background: #722ED1; }
          &.goods { background: #FA8C16; }
          &.location { background: #52C41A; }
        }
      }
    }
  }

  .graph-instructions {
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 24rpx;
    border: 1px solid #1A3350;

    .instruction-title { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; margin-bottom: 16rpx; }

    .instruction-item {
      display: flex;
      gap: 12rpx;
      margin-bottom: 12rpx;
      font-size: 24rpx;
      color: #7AA8CC;
      line-height: 1.5;

      .num { color: #00D4FF; font-weight: 600; }
    }
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 80rpx 30rpx;

  .empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
  .empty-text { font-size: 28rpx; color: #7AA8CC; display: block; margin-bottom: 8rpx; }
  .empty-sub { font-size: 22rpx; color: #4A6A8A; display: block; }
}

.bottom-space { height: 40rpx; }
</style>
