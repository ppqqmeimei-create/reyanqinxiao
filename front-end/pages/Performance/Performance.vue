<template>
  <view class="performance-page" :class="{ 'night-mode': appStore.nightModeEnabled }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <view class="nav-title">
        <text class="title-text">战果统计详情</text>
        <text class="subtitle">Performance Statistics</text>
      </view>
      <view class="nav-actions">
        <view class="action-btn" @click="showExportMenu">
          <text class="icon">📤</text>
        </view>
      </view>
    </view>

    <!-- 时间筛选 -->
    <view class="time-filter">
      <view class="time-tabs">
        <view
          v-for="period in timePeriods"
          :key="period.key"
          class="time-tab"
          :class="{ active: selectedPeriod === period.key }"
          @click="selectPeriod(period.key)"
        >
          <text>{{ period.label }}</text>
        </view>
      </view>
    </view>

    <scroll-view class="main-scroll" scroll-y>
      <!-- 核心战果数据 -->
      <view class="section core-stats">
        <view class="section-header">
          <text class="section-title">核心战果</text>
          <text class="section-sub">Performance Overview</text>
        </view>

        <view class="core-grid">
          <view class="core-card primary">
            <view class="core-icon">📦</view>
            <view class="core-value">{{ stats.casesSeized }}</view>
            <view class="core-label">案件查获</view>
            <view class="core-trend" :class="stats.casesTrend >= 0 ? 'up' : 'down'">
              {{ stats.casesTrend >= 0 ? '↑' : '↓' }}{{ Math.abs(stats.casesTrend) }}% vs上期
            </view>
          </view>

          <view class="core-card">
            <view class="core-icon">🐾</view>
            <view class="core-value">{{ stats.wildlifeSeized }}</view>
            <view class="core-label">野生动物(只)</view>
          </view>

          <view class="core-card">
            <view class="core-icon">🚫</view>
            <view class="core-value">{{ stats.productsSeized }}</view>
            <view class="core-label">涉案物品(件)</view>
          </view>

          <view class="core-card">
            <view class="core-icon">💰</view>
            <view class="core-value">{{ stats.amountSeized }}</view>
            <view class="core-label">涉案金额(万)</view>
          </view>
        </view>
      </view>

      <!-- 案件类型分布 -->
      <view class="section case-distribution">
        <view class="section-header">
          <text class="section-title">案件类型分布</text>
          <text class="section-sub">Case Type Distribution</text>
        </view>

        <view class="distribution-list">
          <view
            v-for="(item, idx) in caseDistribution"
            :key="item.type"
            class="dist-item"
          >
            <view class="dist-header">
              <view class="dist-rank">{{ idx + 1 }}</view>
              <text class="dist-name">{{ item.label }}</text>
              <text class="dist-count">{{ item.count }}起</text>
            </view>
            <view class="dist-bar">
              <view
                class="dist-fill"
                :style="{
                  width: getBarWidth(item.count) + '%',
                  background: item.color
                }"
              ></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 月度趋势 -->
      <view class="section trend-section">
        <view class="section-header">
          <text class="section-title">月度趋势</text>
          <text class="section-sub">Monthly Trend</text>
        </view>

        <view class="trend-chart">
          <view class="chart-y-axis">
            <text v-for="y in yAxisLabels" :key="y" class="y-label">{{ y }}</text>
          </view>
          <view class="chart-bars">
            <view
              v-for="month in monthlyTrend"
              :key="month.label"
              class="bar-group"
            >
              <view
                class="bar"
                :style="{ height: getBarHeight(month.value) + '%' }"
                :class="{ highlighted: month.highlighted }"
              >
                <view class="bar-value">{{ month.value }}</view>
              </view>
              <text class="bar-label">{{ month.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 区域战果排行 -->
      <view class="section region-section">
        <view class="section-header">
          <text class="section-title">区域战果排行</text>
          <text class="section-sub">Regional Ranking</text>
        </view>

        <view class="region-list">
          <view
            v-for="(region, idx) in regionRanking"
            :key="region.code"
            class="region-item"
            :class="'rank-' + (idx + 1)"
          >
            <view class="region-rank" :class="'rank-badge-' + (idx + 1)">
              {{ idx + 1 }}
            </view>
            <view class="region-info">
              <text class="region-name">{{ region.name }}</text>
              <view class="region-meta">
                <text>{{ region.cases }}起</text>
                <text>·</text>
                <text>{{ region.wildlife }}只</text>
              </view>
            </view>
            <view class="region-score">
              <text class="score-num">{{ region.score }}</text>
              <text class="score-label">分</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 个人绩效排行 -->
      <view class="section person-section">
        <view class="section-header">
          <text class="section-title">个人绩效排行</text>
          <text class="section-sub">Individual Performance</text>
          <view class="filter-badge" @click="showPersonFilter = !showPersonFilter">
            {{ personFilter === 'all' ? '全部' : personFilter === 'seized' ? '查获数' : '响应率' }}
          </view>
        </view>

        <view class="person-list">
          <view
            v-for="(person, idx) in personRanking"
            :key="person.id"
            class="person-item"
          >
            <view class="person-rank" :class="'rank-' + (idx + 1)">
              <text>{{ idx + 1 }}</text>
            </view>
            <view class="person-avatar" :style="{ background: getAvatarColor(idx) }">
              <text>{{ person.name.charAt(0) }}</text>
            </view>
            <view class="person-info">
              <view class="person-name-row">
                <text class="person-name">{{ person.name }}</text>
                <view class="person-role-badge" :class="person.role">{{ person.roleLabel }}</view>
              </view>
              <view class="person-stats">
                <text>出勤{{ person.dutyDays }}天</text>
                <text>·</text>
                <text>处置{{ person.dealt }}起</text>
                <text>·</text>
                <text>响应{{ person.responseRate }}%</text>
              </view>
            </view>
            <view class="person-score">
              <text class="score-value" :class="'score-' + getScoreClass(person.score)">
                {{ person.score }}
              </text>
              <text class="score-unit">分</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 生态健康指标 -->
      <view class="section eco-section">
        <view class="section-header">
          <text class="section-title">生态健康指标</text>
          <text class="section-sub">Ecological Health Index</text>
        </view>

        <view class="eco-grid">
          <view v-for="eco in ecoIndicators" :key="eco.name" class="eco-card">
            <view class="eco-icon">{{ eco.icon }}</view>
            <view class="eco-value" :class="eco.trend >= 0 ? 'up' : 'down'">
              {{ eco.value }}
              <text class="eco-unit">{{ eco.unit }}</text>
            </view>
            <view class="eco-name">{{ eco.name }}</view>
            <view class="eco-trend">
              <text>{{ eco.trend >= 0 ? '↑' : '↓' }}{{ Math.abs(eco.trend) }}%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 数据来源说明 -->
      <view class="data-source">
        <text class="source-label">数据更新</text>
        <text class="source-time">{{ formatTime(stats.updateTime) }}</text>
        <text class="source-note">数据来源：环境资源和食品药品犯罪侦查总队战果统计系统</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAppStore } from '../../stores/app.js';

const appStore = useAppStore();

const selectedPeriod = ref('month');
const showPersonFilter = ref(false);
const personFilter = ref('all');

const timePeriods = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
];

const stats = ref({
  casesSeized: 47,
  casesTrend: 18,
  wildlifeSeized: 312,
  productsSeized: 856,
  amountSeized: 1280,
  updateTime: new Date().toISOString(),
});

const caseDistribution = [
  { type: 'WLS', label: '野生动物走私', count: 18, color: '#722ED1' },
  { type: 'ENP', label: '环境污染', count: 12, color: '#13C2C2' },
  { type: 'FDS', label: '食品安全', count: 9, color: '#FA8C16' },
  { type: 'ILH', label: '非法狩猎', count: 5, color: '#F5222D' },
  { type: 'IAS', label: '外来入侵物种', count: 3, color: '#A0D911' },
];

const monthlyTrend = [
  { label: '1月', value: 28, highlighted: false },
  { label: '2月', value: 35, highlighted: false },
  { label: '3月', value: 41, highlighted: false },
  { label: '4月', value: 47, highlighted: true },
];

const regionRanking = [
  { code: 'PX', name: '凭祥市', cases: 15, wildlife: 98, score: 95 },
  { code: 'DX', name: '东兴市', cases: 12, wildlife: 76, score: 88 },
  { code: 'LZ', name: '龙州县', cases: 9, wildlife: 62, score: 82 },
  { code: 'JX', name: '靖西市', cases: 7, wildlife: 48, score: 75 },
  { code: 'NP', name: '那坡县', cases: 4, wildlife: 28, score: 68 },
];

const personRanking = [
  { id: 1, name: '李志明', role: 'commander', roleLabel: '指挥调度', score: 98, dutyDays: 28, dealt: 45, responseRate: 98 },
  { id: 2, name: '王海涛', role: 'investigator', roleLabel: '侦查研判', score: 95, dutyDays: 27, dealt: 38, responseRate: 95 },
  { id: 3, name: '张晓峰', role: 'frontline', roleLabel: '一线执勤', score: 92, dutyDays: 30, dealt: 52, responseRate: 92 },
  { id: 4, name: '陈伟强', role: 'technical', roleLabel: '技术保障', score: 89, dutyDays: 26, dealt: 30, responseRate: 96 },
  { id: 5, name: '周建平', role: 'frontline', roleLabel: '一线执勤', score: 87, dutyDays: 29, dealt: 41, responseRate: 88 },
];

const ecoIndicators = [
  { name: '物种多样性指数', value: 78, unit: '', trend: 3, icon: '🐾' },
  { name: '野生动物种群', value: 156, unit: '种', trend: 5, icon: '🦁' },
  { name: '生境质量指数', value: 82, unit: '', trend: 2, icon: '🌿' },
  { name: '水质达标率', value: 94, unit: '%', trend: 1, icon: '💧' },
  { name: '空气质量优良率', value: 96, unit: '%', trend: 0, icon: '🌬️' },
  { name: '涉案野生动物救治', value: 89, unit: '%', trend: 8, icon: '🏥' },
];

const yAxisLabels = ['50', '40', '30', '20', '10', '0'];

const maxCount = computed(() => Math.max(...caseDistribution.map(c => c.count)));

function goBack() { uni.navigateBack(); }

function selectPeriod(key) {
  selectedPeriod.value = key;
  uni.vibrateShort && uni.vibrateShort();
}

function getBarWidth(count) {
  if (maxCount.value === 0) return 0;
  return Math.round((count / maxCount.value) * 100);
}

function getBarHeight(value) {
  return Math.round((value / 50) * 100);
}

function getScoreClass(score) {
  if (score >= 95) return 'excellent';
  if (score >= 85) return 'good';
  if (score >= 75) return 'fair';
  return 'normal';
}

function getAvatarColor(idx) {
  const colors = ['#00D4FF', '#722ED1', '#FA8C16', '#52C41A', '#EB2F96'];
  return colors[idx % colors.length];
}

function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function showExportMenu() {
  uni.showActionSheet({
    itemList: ['导出PDF报告', '导出Excel', '分享数据卡片', '发送到邮箱'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showToast({ title: '正在生成PDF...', icon: 'none' });
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

.performance-page {
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
    .action-btn { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center;
      background: rgba(0,212,255,0.1); border-radius: 50%; border: 1px solid rgba(0,212,255,0.2);
      .icon { font-size: 28rpx; color: #00D4FF; } } }
}

.time-filter {
  padding: 16rpx 30rpx;
  background: #0C1B2A;
  border-bottom: 1px solid #1A3350;

  .time-tabs {
    display: flex;
    gap: 16rpx;

    .time-tab {
      padding: 8rpx 24rpx;
      border-radius: 20rpx;
      background: #060A14;
      border: 1px solid #1A3350;
      font-size: 24rpx;
      color: #7AA8CC;
      transition: all 0.2s;

      &.active {
        background: rgba(0, 212, 255, 0.15);
        border-color: #00D4FF;
        color: #00D4FF;
      }
    }
  }
}

.main-scroll {
  height: calc(100vh - 220rpx);
  padding: 0 30rpx;
}

.section {
  margin-top: 30rpx;

  .section-header {
    display: flex;
    align-items: baseline;
    gap: 12rpx;
    margin-bottom: 20rpx;

    .section-title { font-size: 28rpx; font-weight: 700; color: #E8F4FF; }
    .section-sub { font-size: 20rpx; color: #4A6A8A; }
    .filter-badge {
      margin-left: auto;
      padding: 4rpx 14rpx;
      background: rgba(0,212,255,0.1);
      border: 1px solid rgba(0,212,255,0.3);
      border-radius: 10rpx;
      font-size: 20rpx;
      color: #00D4FF;
    }
  }
}

// 核心战果
.core-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;

  .core-card {
    background: #0C1B2A;
    border-radius: 20rpx;
    padding: 24rpx;
    text-align: center;
    border: 1px solid #1A3350;

    &.primary {
      grid-column: span 2;
      display: flex;
      align-items: center;
      gap: 20rpx;
      text-align: left;
      border-color: rgba(0,212,255,0.3);

      .core-icon { font-size: 60rpx; }
      .core-value { font-size: 64rpx; font-weight: 900; color: #00D4FF; line-height: 1; }
      .core-label { font-size: 24rpx; color: #7AA8CC; }
      .core-trend { font-size: 22rpx; margin-left: auto; &.up { color: #52C41A; } &.down { color: #FF4D4F; } }
    }

    .core-icon { font-size: 36rpx; margin-bottom: 8rpx; }
    .core-value { font-size: 40rpx; font-weight: 800; color: #E8F4FF; line-height: 1; }
    .core-label { font-size: 22rpx; color: #7AA8CC; margin-top: 4rpx; }
  }
}

// 案件分布
.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.dist-item {
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #1A3350;

  .dist-header {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;

    .dist-rank { width: 40rpx; height: 40rpx; border-radius: 8rpx; background: rgba(0,212,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 700; color: #00D4FF; }
    .dist-name { flex: 1; font-size: 26rpx; font-weight: 600; color: #E8F4FF; }
    .dist-count { font-size: 24rpx; color: #7AA8CC; }
  }

  .dist-bar {
    height: 12rpx;
    background: #1A3350;
    border-radius: 6rpx;
    overflow: hidden;

    .dist-fill {
      height: 100%;
      border-radius: 6rpx;
      transition: width 0.5s;
    }
  }
}

// 月度趋势
.trend-chart {
  display: flex;
  gap: 16rpx;
  background: #0C1B2A;
  border-radius: 20rpx;
  padding: 24rpx;
  border: 1px solid #1A3350;

  .chart-y-axis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20rpx 0;
    .y-label { font-size: 20rpx; color: #4A6A8A; }
  }

  .chart-bars {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    height: 200rpx;
    border-bottom: 1px solid #1A3350;

    .bar-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8rpx;
      flex: 1;

      .bar {
        width: 48rpx;
        background: linear-gradient(180deg, #00D4FF 0%, #007AFF 100%);
        border-radius: 6rpx 6rpx 0 0;
        min-height: 8rpx;
        position: relative;
        transition: height 0.5s;

        &.highlighted { background: linear-gradient(180deg, #FF4D4F 0%, #FF7A45 100%); }

        .bar-value { position: absolute; top: -28rpx; left: 50%; transform: translateX(-50%); font-size: 20rpx; font-weight: 700; color: #E8F4FF; }
      }

      .bar-label { font-size: 20rpx; color: #7AA8CC; }
    }
  }
}

// 区域排行
.region-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  .region-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 20rpx;
    border: 1px solid #1A3350;

    .region-rank {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26rpx;
      font-weight: 800;

      &.rank-badge-1 { background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; }
      &.rank-badge-2 { background: linear-gradient(135deg, #C0C0C0, #A0A0A0); color: #000; }
      &.rank-badge-3 { background: linear-gradient(135deg, #CD7F32, #8B4513); color: #fff; }
    }

    .region-info {
      flex: 1;
      .region-name { font-size: 26rpx; font-weight: 600; color: #E8F4FF; display: block; }
      .region-meta { display: flex; gap: 8rpx; font-size: 22rpx; color: #7AA8CC; margin-top: 4rpx; }
    }

    .region-score {
      text-align: right;
      .score-num { font-size: 36rpx; font-weight: 900; color: #00D4FF; }
      .score-label { font-size: 22rpx; color: #7AA8CC; }
    }
  }
}

// 人员排行
.person-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.person-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #0C1B2A;
  border-radius: 16rpx;
  padding: 20rpx;
  border: 1px solid #1A3350;

  .person-rank {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: 800;

    &.rank-1 { background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; }
    &.rank-2 { background: linear-gradient(135deg, #C0C0C0, #A0A0A0); color: #000; }
    &.rank-3 { background: linear-gradient(135deg, #CD7F32, #8B4513); color: #fff; }
    &.rank-4, &.rank-5 { background: #1A3350; color: #7AA8CC; }
  }

  .person-avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 700;
    color: #fff;
  }

  .person-info {
    flex: 1;
    .person-name-row { display: flex; align-items: center; gap: 10rpx; margin-bottom: 4rpx; }
    .person-name { font-size: 26rpx; font-weight: 600; color: #E8F4FF; }
    .person-role-badge {
      padding: 2rpx 10rpx;
      border-radius: 6rpx;
      font-size: 18rpx;
      &.commander { background: rgba(255,77,79,0.15); color: #FF4D4F; }
      &.investigator { background: rgba(114,46,209,0.15); color: #722ED1; }
      &.frontline { background: rgba(0,212,255,0.15); color: #00D4FF; }
      &.technical { background: rgba(82,196,26,0.15); color: #52C41A; }
    }
    .person-stats { display: flex; gap: 8rpx; font-size: 22rpx; color: #7AA8CC; }
  }

  .person-score {
    text-align: right;
    .score-value { font-size: 36rpx; font-weight: 900; &.score-excellent { color: #52C41A; } &.score-good { color: #73D13D; } &.score-fair { color: #FFA940; } &.score-normal { color: #7AA8CC; } }
    .score-unit { font-size: 22rpx; color: #7AA8CC; }
  }
}

// 生态指标
.eco-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;

  .eco-card {
    background: #0C1B2A;
    border-radius: 16rpx;
    padding: 20rpx;
    text-align: center;
    border: 1px solid #1A3350;

    .eco-icon { font-size: 32rpx; margin-bottom: 8rpx; }
    .eco-value { font-size: 32rpx; font-weight: 800; color: #E8F4FF; .eco-unit { font-size: 20rpx; color: #7AA8CC; } &.up { color: #52C41A; } &.down { color: #FF4D4F; } }
    .eco-name { font-size: 20rpx; color: #7AA8CC; margin: 6rpx 0; }
    .eco-trend { font-size: 20rpx; color: #52C41A; }
  }
}

// 数据来源
.data-source {
  text-align: center;
  padding: 30rpx 0;
  .source-label { font-size: 22rpx; color: #4A6A8A; }
  .source-time { font-size: 22rpx; color: #7AA8CC; margin-left: 8rpx; }
  .source-note { display: block; font-size: 20rpx; color: #4A6A8A; margin-top: 8rpx; }
}
</style>
