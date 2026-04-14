<template>
  <!-- 全屏遮罩 -->
  <view v-if="visible" class="rpp-overlay" @tap="handleClose">

    <!-- 主面板 -->
    <view class="rpp-panel" :class="{ open: animating }" @tap.stop>

      <!-- 拖拽指示条 -->
      <view class="rpp-drag-bar"></view>

      <!-- 头部 -->
      <view class="rpp-header">
        <view class="rpp-header-left">
          <view class="rpp-title-icon">
            <text class="rpp-title-emoji">📊</text>
          </view>
          <view class="rpp-title-group">
            <text class="rpp-title">风险画像</text>
            <text class="rpp-subtitle">热眼擒枭 · 边境活物走私多维研判</text>
          </view>
        </view>
        <view class="rpp-header-right">
          <view class="rpp-badge-new">
            <text class="rpp-badge-text">实时分析</text>
          </view>
          <view class="rpp-close-btn" @tap="handleClose">
            <text class="rpp-close-text">×</text>
          </view>
        </view>
      </view>

      <!-- 概览统计 -->
      <scroll-view class="rpp-scroll" scroll-y="true" enhanced="true" show-scrollbar="true" enable-flex="true" :scroll-with-animation="true">
        <view class="rpp-overview-row">
          <view class="rpp-overview-card rpp-overview-high">
            <text class="rpp-overview-num">{{ profileData.highRisk }}</text>
            <text class="rpp-overview-label">高风险线索</text>
            <view class="rpp-overview-bar">
              <view class="rpp-overview-bar-fill" :style="{ width: highPercent + '%' }"></view>
            </view>
          </view>
          <view class="rpp-overview-card rpp-overview-medium">
            <text class="rpp-overview-num">{{ profileData.mediumRisk }}</text>
            <text class="rpp-overview-label">中风险线索</text>
            <view class="rpp-overview-bar">
              <view class="rpp-overview-bar-fill medium" :style="{ width: mediumPercent + '%' }"></view>
            </view>
          </view>
          <view class="rpp-overview-card rpp-overview-low">
            <text class="rpp-overview-num">{{ profileData.lowRisk }}</text>
            <text class="rpp-overview-label">低风险线索</text>
            <view class="rpp-overview-bar">
              <view class="rpp-overview-bar-fill low" :style="{ width: lowPercent + '%' }"></view>
            </view>
          </view>
          <view class="rpp-overview-card rpp-overview-total">
            <text class="rpp-overview-num">{{ profileData.total }}</text>
            <text class="rpp-overview-label">线索总数</text>
            <text class="rpp-overview-trend" :class="trendClass">{{ trendText }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 核心指数 -->
      <view class="rpp-core-index">
        <view class="rpp-core-title">
          <text class="rpp-core-title-text">综合风险指数</text>
        </view>
        <view class="rpp-core-body">
          <view class="rpp-gauge-wrap">
            <view class="rpp-risk-score-card">
              <text class="rpp-gauge-score">{{ gaugeScore }}</text>
              <text class="rpp-gauge-unit">分</text>
            </view>
            <view class="rpp-risk-band">
              <view class="rpp-risk-band-segment low">
                <text class="rpp-risk-band-text">低风险 0-40</text>
              </view>
              <view class="rpp-risk-band-segment medium">
                <text class="rpp-risk-band-text">中风险 41-65</text>
              </view>
              <view class="rpp-risk-band-segment high">
                <text class="rpp-risk-band-text">高风险 66-100</text>
              </view>
            </view>
            <view class="rpp-risk-pointer-row">
              <view class="rpp-risk-pointer" :style="{ left: gaugePointerLeft }"></view>
            </view>
          </view>
          <view class="rpp-gauge-legend">
            <view class="rpp-legend-item">
              <view class="rpp-legend-dot" style="background:#73d13d"></view>
              <text class="rpp-legend-label">低风险关注区间</text>
            </view>
            <view class="rpp-legend-item">
              <view class="rpp-legend-dot" style="background:#ffa940"></view>
              <text class="rpp-legend-label">中风险核查区间</text>
            </view>
            <view class="rpp-legend-item">
              <view class="rpp-legend-dot" style="background:#ff4d4f"></view>
              <text class="rpp-legend-label">高风险布控区间</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 区域风险分布 -->
      <view class="rpp-section">
        <view class="rpp-section-title">
          <text class="rpp-section-title-text">区域风险分布</text>
          <text class="rpp-section-title-sub">按县市区风险等级排序</text>
        </view>
        <view class="rpp-area-list">
          <view
            v-for="(area, idx) in areaRanking"
            :key="area.name"
            class="rpp-area-item"
            :class="{ 'rpp-area-top3': idx < 3 }"
            @tap="handleAreaTap(area)"
          >
            <view class="rpp-area-rank">
              <text class="rpp-area-rank-num" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</text>
            </view>
            <view class="rpp-area-info">
              <view class="rpp-area-name-row">
                <text class="rpp-area-name">{{ area.name }}</text>
                <view class="rpp-area-tag" :class="'tag-' + area.level">
                  <text class="rpp-area-tag-text">{{ area.levelText }}</text>
                </view>
              </view>
              <view class="rpp-area-bar-wrap">
                <view class="rpp-area-bar-bg">
                  <view
                    class="rpp-area-bar-fill"
                    :class="'fill-' + area.level"
                    :style="{ width: area.percent + '%' }"
                  ></view>
                </view>
                <text class="rpp-area-count">{{ area.count }}条</text>
              </view>
            </view>
            <view class="rpp-area-arrow">
              <text class="rpp-area-arrow-text">›</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 线索类型分布 -->
      <view class="rpp-section">
        <view class="rpp-section-title">
          <text class="rpp-section-title-text">线索类型分布</text>
          <text class="rpp-section-title-sub">按活物走私线索类型统计</text>
        </view>
        <view class="rpp-type-grid">
          <view
            v-for="type in typeDistribution"
            :key="type.key"
            class="rpp-type-card"
            :class="'border-' + type.level"
          >
            <view class="rpp-type-header">
              <text class="rpp-type-icon">{{ type.icon }}</text>
              <text class="rpp-type-name">{{ type.name }}</text>
            </view>
            <view class="rpp-type-stats">
              <view class="rpp-type-count-wrap">
                <text class="rpp-type-count">{{ type.count }}</text>
                <text class="rpp-type-unit">条</text>
              </view>
              <view class="rpp-type-pct-wrap">
                <text class="rpp-type-pct">{{ type.percent }}%</text>
                <text class="rpp-type-pct-label">占比</text>
              </view>
            </view>
            <view class="rpp-type-bar">
              <view class="rpp-type-bar-fill" :class="'fill-' + type.level" :style="{ width: type.percent + '%' }"></view>
            </view>
            <view class="rpp-type-high-ratio">
              <text class="rpp-type-high-text">高风险 {{ type.highRatio }}%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 关键发现 -->
      <view class="rpp-section">
        <view class="rpp-section-title">
          <text class="rpp-section-title-text">关键发现</text>
          <text class="rpp-section-title-sub">AI 辅助研判 · 仅供参考</text>
        </view>
        <view class="rpp-finding-list">
          <view
            v-for="finding in keyFindings"
            :key="finding.id"
            class="rpp-finding-card"
            :class="'finding-' + finding.level"
          >
            <view class="rpp-finding-icon">
              <text class="rpp-finding-icon-text">{{ finding.icon }}</text>
            </view>
            <view class="rpp-finding-content">
              <text class="rpp-finding-title">{{ finding.title }}</text>
              <text class="rpp-finding-desc">{{ finding.desc }}</text>
            </view>
            <view class="rpp-finding-action" @tap="handleFindingAction(finding)">
              <text class="rpp-finding-action-text">查看</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 研判建议 -->
      <view class="rpp-section">
        <view class="rpp-section-title">
          <text class="rpp-section-title-text">研判建议</text>
        </view>
        <view class="rpp-advice-list">
          <view v-for="(advice, idx) in advices" :key="idx" class="rpp-advice-item">
            <view class="rpp-advice-num">
              <text class="rpp-advice-num-text">{{ idx + 1 }}</text>
            </view>
            <view class="rpp-advice-content">
              <text class="rpp-advice-title">{{ advice.title }}</text>
              <text class="rpp-advice-desc">{{ advice.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 报告生成 -->
      <view class="rpp-section rpp-section-report">
        <view class="rpp-section-title">
          <text class="rpp-section-title-text">生成研判报告</text>
        </view>
        <view class="rpp-report-form">
          <view class="rpp-form-row">
            <text class="rpp-form-label">报告标题</text>
            <input
              class="rpp-form-input"
              placeholder="请输入报告标题（选填）"
              placeholder-class="rpp-form-placeholder"
              v-model="reportTitle"
            />
          </view>
          <view class="rpp-form-row">
            <text class="rpp-form-label">报告类型</text>
            <view class="rpp-form-radio-group">
              <view
                v-for="rt in reportTypes"
                :key="rt.value"
                class="rpp-form-radio"
                :class="{ selected: selectedReportType === rt.value }"
                @tap="selectedReportType = rt.value"
              >
                <text class="rpp-form-radio-text">{{ rt.label }}</text>
              </view>
            </view>
          </view>
          <view class="rpp-form-row">
            <text class="rpp-form-label">包含内容</text>
            <view class="rpp-form-check-group">
              <view
                v-for="section in reportSections"
                :key="section.key"
                class="rpp-form-checkbox"
                :class="{ checked: selectedSections.includes(section.key) }"
                @tap="toggleSection(section.key)"
              >
                <view class="rpp-checkbox-box" :class="{ checked: selectedSections.includes(section.key) }">
                  <text v-if="selectedSections.includes(section.key)" class="rpp-checkbox-check">✓</text>
                </view>
                <text class="rpp-form-checkbox-text">{{ section.label }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作 -->
      <view class="rpp-footer">
        <view class="rpp-footer-actions">
          <view class="rpp-footer-btn rpp-footer-btn-secondary" @tap="handleExport">
            <text class="rpp-footer-btn-icon">📤</text>
            <text class="rpp-footer-btn-text">导出图表</text>
          </view>
          <view class="rpp-footer-btn rpp-footer-btn-primary" @tap="handleGenerateReport">
            <text class="rpp-footer-btn-icon">📝</text>
            <text class="rpp-footer-btn-text">生成研判报告</text>
          </view>
        </view>
      </view>

    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  clues: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['close', 'generate-report', 'export', 'area-tap'])

// ==================== 状态 ====================
const animating = ref(false)

// 报告表单
const reportTitle = ref('')
const selectedReportType = ref('daily')
const selectedSections = ref(['area', 'type', 'finding', 'advice'])
const reportTypes = [
  { label: '日报', value: 'daily' },
  { label: '专报', value: 'special' },
  { label: '要报', value: 'alert' }
]
const reportSections = [
  { key: 'area', label: '区域分析' },
  { key: 'type', label: '类型分析' },
  { key: 'finding', label: '关键发现' },
  { key: 'advice', label: '研判建议' }
]

// ==================== 计算属性：画像数据 ====================
const profileData = computed(() => {
  const high = props.clues.filter(d => d.risk_level === '高').length
  const medium = props.clues.filter(d => d.risk_level === '中高' || d.risk_level === '中').length
  const low = props.clues.filter(d => d.risk_level === '低').length
  const total = props.clues.length
  return { highRisk: high, mediumRisk: medium, lowRisk: low, total }
})

const totalClues = computed(() => profileData.value.total)

const highPercent = computed(() =>
  totalClues.value ? Math.round(profileData.value.highRisk / totalClues.value * 100) : 0
)
const mediumPercent = computed(() =>
  totalClues.value ? Math.round(profileData.value.mediumRisk / totalClues.value * 100) : 0
)
const lowPercent = computed(() =>
  totalClues.value ? Math.round(profileData.value.lowRisk / totalClues.value * 100) : 0
)

// 趋势（模拟）
const trendClass = computed(() => 'trend-up')
const trendText = computed(() => '↑ 较昨日')

// 仪表盘得分
const gaugeScore = computed(() => {
  const { highRisk, mediumRisk, total } = profileData.value
  if (total === 0) return 0
  const score = Math.round((highRisk * 80 + mediumRisk * 50) / total)
  return Math.min(100, score)
})

const gaugePointerLeft = computed(() => `${Math.max(6, Math.min(94, gaugeScore.value))}%`)

// 区域排名
const areaRanking = computed(() => {
  const areaMap = {}
  const borderMap = {
    '凭祥市': '凭祥', '东兴市': '东兴', '宁明县': '宁明',
    '大新县': '大新', '靖西市': '靖西', '那坡县': '那坡',
    '龙州县': '龙州', '防城区': '防城'
  }
  props.clues.forEach(c => {
    const key = borderMap[c.border] || c.border
    if (!areaMap[key]) {
      areaMap[key] = { name: key, count: 0, high: 0 }
    }
    areaMap[key].count++
    if (c.risk_level === '高') areaMap[key].high++
  })
  const list = Object.values(areaMap).sort((a, b) => b.high - a.high)
  const maxCount = Math.max(...list.map(l => l.count), 1)
  return list.map(l => {
    const ratio = l.count > 0 ? l.high / l.count : 0
    let level = 'low'
    let levelText = '低风险'
    if (ratio >= 0.6) { level = 'high'; levelText = '高风险' }
    else if (ratio >= 0.3) { level = 'medium'; levelText = '中风险' }
    return {
      ...l,
      percent: Math.round(l.count / maxCount * 100),
      level,
      levelText
    }
  })
})

// 类型分布
const typeDistribution = computed(() => {
  const types = [
    { key: 'live-transport', name: '走私活物', icon: '📦', level: 'high' }
  ]
  const total = props.clues.length || 1
  return types.map(t => {
    const count = props.clues.filter(c => c.type === t.key).length
    const high = props.clues.filter(c => c.type === t.key && c.risk_level === '高').length
    const percent = Math.round(count / total * 100)
    const highRatio = count > 0 ? Math.round(high / count * 100) : 0
    return { ...t, count, percent, highRatio }
  })
})

// 关键发现（动态生成）
const keyFindings = computed(() => {
  const findings = []
  const highAreas = areaRanking.value.filter(a => a.level === 'high').slice(0, 2)
  if (highAreas.length > 0) {
    findings.push({
      id: 1,
      icon: '🚨',
      title: `${highAreas[0].name}片区风险突出`,
      desc: `${highAreas[0].name}高风险线索占比最高，建议重点布控`,
      level: 'high',
      action: 'focus-area'
    })
  }
  const highType = typeDistribution.value.filter(t => t.level === 'high').slice(0, 1)
  if (highType.length > 0) {
    findings.push({
      id: 2,
      icon: '💊',
      title: `${highType[0].name}类违法活动频繁`,
      desc: `${highType[0].name}类线索 ${highType[0].count} 条，高风险占比 ${highType[0].highRatio}%`,
      level: 'high',
      action: 'focus-type'
    })
  }
  const pending = props.clues.filter(c => c.status === 'pending').length
  if (pending > 5) {
    findings.push({
      id: 3,
      icon: '⏰',
      title: '待核线索积压较多',
      desc: `当前有 ${pending} 条待核验线索，建议加快核验节奏`,
      level: 'warning',
      action: 'clue-verify'
    })
  }
  findings.push({
    id: 4,
    icon: '🕐',
    title: '早夜间为高发时段',
    desc: '05:30、03:40 等夜间时段发现多条高风险线索，需加强夜巡',
    level: 'info',
    action: 'time-analysis'
  })
  return findings
})

// 研判建议
const advices = computed(() => {
  const list = []
  const topAreas = areaRanking.value.slice(0, 2)
  if (topAreas.length > 0) {
    list.push({
      title: `优先布控${topAreas.map(a => a.name).join('、')}片区`,
      desc: `该片区高风险线索集中，建议协调联勤力量加强口岸与互市通道巡查`
    })
  }
  list.push({
    title: '强化夜间热成像监控',
    desc: '多条高风险线索发现于凌晨03-05时，建议在宁明爱店、大新硕龙等片区增设夜视设备'
  })
  list.push({
    title: '联动口岸与市场监管同步核查',
    desc: '针对冷链、互市通道和报关单异常线索，建议联合口岸查验、市场监管与边境执勤力量同步复核'
  })
  list.push({
    title: '加快线索核验闭环',
    desc: `当前 ${props.clues.filter(c => c.status === 'pending').length} 条待核，建议 24 小时内完成初步核验`
  })
  return list
})

// ==================== 方法 ====================
const handleClose = () => {
  emit('close')
}

const handleAreaTap = (area) => {
  uni.showModal({
    title: `${area.name}片区详情`,
    content: `高风险线索 ${area.high} 条，合计 ${area.count} 条。是否跳转至地图聚焦该区域？`,
    confirmText: '跳转地图',
    cancelText: '返回',
    success: (res) => {
      if (res.confirm) {
        emit('area-tap', area)
        emit('close')
      }
    }
  })
}

const handleFindingAction = (finding) => {
  const actionMap = {
    'focus-area': '已切换至区域聚焦模式',
    'focus-type': '已筛选该类型线索',
    'clue-verify': '已跳转至线索核验面板',
    'time-analysis': '已显示时段分布分析'
  }
  uni.showToast({ title: actionMap[finding.action] || finding.title, icon: 'none' })
}

const toggleSection = (key) => {
  const idx = selectedSections.value.indexOf(key)
  if (idx === -1) {
    selectedSections.value.push(key)
  } else {
    selectedSections.value.splice(idx, 1)
  }
}

const handleExport = () => {
  uni.showToast({ title: '图表已导出（演示）', icon: 'success' })
  emit('export', { profileData: profileData.value, areas: areaRanking.value, types: typeDistribution.value })
}

const handleGenerateReport = () => {
  const title = reportTitle.value || `${new Date().toLocaleDateString('zh-CN')}热眼擒枭风险研判报告`
  const typeMap = { daily: '日报', special: '专报', alert: '要报' }
  uni.showModal({
    title: '生成研判报告',
    content: `报告标题：${title}\n报告类型：${typeMap[selectedReportType.value]}\n包含 ${selectedSections.value.length} 个分析模块，是否确认生成？`,
    confirmText: '确认生成',
    cancelText: '返回修改',
    success: (res) => {
      if (res.confirm) {
        emit('generate-report', {
          title,
          type: selectedReportType.value,
          sections: selectedSections.value,
          data: {
            profile: profileData.value,
            areas: areaRanking.value,
            types: typeDistribution.value,
            findings: keyFindings.value,
            advices: advices.value
          }
        })
        uni.showToast({ title: '研判报告已生成', icon: 'success' })
      }
    }
  })
}

// ==================== 动画控制 ====================
watch(() => props.visible, (val) => {
  if (val) {
    // 初始化默认值
    reportTitle.value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} 热眼擒枭风险研判`
    selectedSections.value = ['area', 'type', 'finding', 'advice']
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
$danger: #ff4d4f;
$danger-light: rgba(255, 77, 79, 0.15);
$warning: #ffa940;
$warning-light: rgba(255, 169, 64, 0.15);
$success: #73d13d;
$success-light: rgba(115, 209, 61, 0.15);
$info: #00d4ff;
$info-light: rgba(0, 212, 255, 0.1);
$bg-panel: #0d1826;
$bg-card: #142436;
$bg-section: #0f1e2e;
$text-primary: #f3fbff;
$text-secondary: #8ca3b8;
$text-hint: #5a7a96;
$border-color: rgba(0, 212, 255, 0.18);

/* ==================== 遮罩 ==================== */
.rpp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 18, 0.8);
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
.rpp-panel {
  width: 100%;
  max-width: 750rpx;
  height: 92vh;
  max-height: 92vh;
  background: $bg-panel;
  border-radius: 40rpx 40rpx 0 0;
  border: 1px solid $border-color;
  border-bottom: none;
  box-shadow: 0 -20rpx 60rpx rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);

  &.open {
    transform: translateY(0);
  }
}

/* ==================== 拖拽条 ==================== */
.rpp-drag-bar {
  width: 72rpx;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999rpx;
  margin: 18rpx auto 0;
  flex-shrink: 0;
}

/* ==================== 头部 ==================== */
.rpp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx 16rpx;
  flex-shrink: 0;
}

.rpp-header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.rpp-title-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rpp-title-emoji {
  font-size: 34rpx;
}

.rpp-title-group {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.rpp-title {
  font-size: 34rpx;
  font-weight: 800;
  color: $text-primary;
  letter-spacing: 1rpx;
}

.rpp-subtitle {
  font-size: 22rpx;
  color: rgba(0, 212, 255, 0.7);
  font-weight: 500;
}

.rpp-header-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.rpp-badge-new {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.25);
}

.rpp-badge-text {
  font-size: 20rpx;
  color: $primary;
  font-weight: 600;
}

.rpp-close-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;

  &:active {
    background: rgba(255, 255, 255, 0.12);
  }
}

.rpp-close-text {
  font-size: 32rpx;
  color: $text-secondary;
  line-height: 1;
}

/* ==================== 概览统计 ==================== */
.rpp-scroll {
  flex: 1;
  min-height: 0;
}

.rpp-overview-row {
  display: flex;
  gap: 10rpx;
  padding: 0 28rpx 16rpx;
  flex-shrink: 0;
}

.rpp-overview-card {
  flex: 1;
  padding: 14rpx 10rpx;
  border-radius: 18rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  border: 1px solid transparent;

  &.rpp-overview-high {
    background: $danger-light;
    border-color: rgba(255, 77, 79, 0.25);
    .rpp-overview-num { color: $danger; }
  }
  &.rpp-overview-medium {
    background: $warning-light;
    border-color: rgba(255, 169, 64, 0.25);
    .rpp-overview-num { color: $warning; }
  }
  &.rpp-overview-low {
    background: $success-light;
    border-color: rgba(115, 209, 61, 0.25);
    .rpp-overview-num { color: $success; }
  }
  &.rpp-overview-total {
    background: $info-light;
    border-color: rgba(0, 212, 255, 0.2);
    .rpp-overview-num { color: $primary; }
  }
}

.rpp-overview-num {
  font-size: 32rpx;
  font-weight: 800;
}

.rpp-overview-label {
  font-size: 18rpx;
  color: $text-secondary;
  font-weight: 500;
  text-align: center;
}

.rpp-overview-bar {
  width: 100%;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999rpx;
  overflow: hidden;
  margin-top: 4rpx;
}

.rpp-overview-bar-fill {
  height: 100%;
  background: $danger;
  border-radius: 999rpx;
  transition: width 0.8s cubic-bezier(0.32, 0.72, 0, 1);

  &.medium { background: $warning; }
  &.low { background: $success; }
}

.rpp-overview-trend {
  font-size: 18rpx;
  font-weight: 700;

  &.trend-up { color: $danger; }
  &.trend-down { color: $success; }
}

/* ==================== 核心指数 ==================== */
.rpp-core-index {
  margin: 0 28rpx 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  background: $bg-section;
  border: 1px solid rgba(0, 212, 255, 0.12);
  flex-shrink: 0;
}

.rpp-core-title {
  margin-bottom: 16rpx;
}

.rpp-core-title-text {
  font-size: 22rpx;
  font-weight: 700;
  color: $text-secondary;
  letter-spacing: 1rpx;
}

.rpp-core-body {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.rpp-gauge-wrap {
  width: 200rpx;
  flex-shrink: 0;
}

.rpp-risk-score-card {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4rpx;
  margin-bottom: 14rpx;
}

.rpp-risk-band {
  display: flex;
  overflow: hidden;
  border-radius: 999rpx;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.rpp-risk-band-segment {
  flex: 1;
  padding: 14rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &.low { background: rgba(115, 209, 61, 0.16); }
  &.medium { background: rgba(255, 169, 64, 0.16); }
  &.high { background: rgba(255, 77, 79, 0.16); }
}

.rpp-risk-band-text {
  font-size: 18rpx;
  font-weight: 700;
  color: $text-primary;
}

.rpp-risk-pointer-row {
  position: relative;
  height: 28rpx;
  margin-top: 8rpx;
}

.rpp-risk-pointer {
  position: absolute;
  top: 2rpx;
  width: 0;
  height: 0;
  border-left: 10rpx solid transparent;
  border-right: 10rpx solid transparent;
  border-top: 16rpx solid #ffffff;
  transform: translateX(-50%);
  filter: drop-shadow(0 4rpx 8rpx rgba(255,255,255,0.3));
  transition: left 0.35s ease;
}

.rpp-gauge-score {
  font-size: 42rpx;
  font-weight: 800;
  color: $text-primary;
}

.rpp-gauge-unit {
  font-size: 20rpx;
  color: $text-secondary;
}

.rpp-gauge-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.rpp-legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.rpp-legend-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.rpp-legend-label {
  font-size: 20rpx;
  color: $text-secondary;
}

/* ==================== 通用区块 ==================== */
.rpp-section {
  padding: 0 28rpx 20rpx;
  flex-shrink: 0;
}

.rpp-section-title {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.rpp-section-title-text {
  font-size: 26rpx;
  font-weight: 800;
  color: $text-primary;
}

.rpp-section-title-sub {
  font-size: 20rpx;
  color: $text-hint;
  font-weight: 400;
}

/* ==================== 区域风险列表 ==================== */
.rpp-area-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.rpp-area-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 16rpx 18rpx;
  border-radius: 18rpx;
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.15s ease;

  &:active {
    background: rgba(0, 212, 255, 0.06);
    transform: scale(0.99);
  }

  &.rpp-area-top3 {
    border-color: rgba(255, 77, 79, 0.2);
    background: rgba(255, 77, 79, 0.04);
  }
}

.rpp-area-rank {
  width: 44rpx;
  flex-shrink: 0;
}

.rpp-area-rank-num {
  font-size: 28rpx;
  font-weight: 800;
  color: $text-hint;

  &.rank-1 { color: #ffd700; font-size: 30rpx; }
  &.rank-2 { color: #c0c0c0; font-size: 28rpx; }
  &.rank-3 { color: #cd7f32; font-size: 28rpx; }
}

.rpp-area-info {
  flex: 1;
  min-width: 0;
}

.rpp-area-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.rpp-area-name {
  font-size: 26rpx;
  font-weight: 700;
  color: $text-primary;
}

.rpp-area-tag {
  padding: 3rpx 12rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
  font-weight: 700;

  &.tag-high { background: $danger-light; .rpp-area-tag-text { color: $danger; } }
  &.tag-medium { background: $warning-light; .rpp-area-tag-text { color: $warning; } }
  &.tag-low { background: $success-light; .rpp-area-tag-text { color: $success; } }
}

.rpp-area-tag-text {
  font-size: 18rpx;
  font-weight: 700;
}

.rpp-area-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.rpp-area-bar-bg {
  flex: 1;
  height: 6rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999rpx;
  overflow: hidden;
}

.rpp-area-bar-fill {
  height: 100%;
  border-radius: 999rpx;
  transition: width 0.8s cubic-bezier(0.32, 0.72, 0, 1);

  &.fill-high { background: $danger; }
  &.fill-medium { background: $warning; }
  &.fill-low { background: $success; }
}

.rpp-area-count {
  font-size: 20rpx;
  color: $text-secondary;
  font-weight: 600;
  flex-shrink: 0;
}

.rpp-area-arrow {
  flex-shrink: 0;
}

.rpp-area-arrow-text {
  font-size: 28rpx;
  color: $text-hint;
}

/* ==================== 类型分布 ==================== */
.rpp-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
}

.rpp-type-card {
  padding: 16rpx 14rpx;
  border-radius: 18rpx;
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10rpx;

  &.border-high { border-color: rgba(255, 77, 79, 0.25); }
  &.border-medium { border-color: rgba(255, 169, 64, 0.25); }
  &.border-low { border-color: rgba(115, 209, 61, 0.2); }
}

.rpp-type-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.rpp-type-icon {
  font-size: 24rpx;
}

.rpp-type-name {
  font-size: 22rpx;
  font-weight: 700;
  color: $text-primary;
}

.rpp-type-stats {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.rpp-type-count-wrap {
  display: flex;
  align-items: baseline;
  gap: 2rpx;
}

.rpp-type-count {
  font-size: 34rpx;
  font-weight: 800;
  color: $text-primary;
}

.rpp-type-unit {
  font-size: 20rpx;
  color: $text-secondary;
}

.rpp-type-pct-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.rpp-type-pct {
  font-size: 22rpx;
  font-weight: 700;
  color: $text-secondary;
}

.rpp-type-pct-label {
  font-size: 16rpx;
  color: $text-hint;
}

.rpp-type-bar {
  height: 5rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999rpx;
  overflow: hidden;
}

.rpp-type-bar-fill {
  height: 100%;
  border-radius: 999rpx;
  transition: width 0.8s cubic-bezier(0.32, 0.72, 0, 1);

  &.fill-high { background: $danger; }
  &.fill-medium { background: $warning; }
  &.fill-low { background: $success; }
}

.rpp-type-high-ratio {
  text-align: right;
}

.rpp-type-high-text {
  font-size: 18rpx;
  color: $danger;
  font-weight: 600;
}

/* ==================== 关键发现 ==================== */
.rpp-finding-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.rpp-finding-card {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);

  &.finding-high {
    background: rgba(255, 77, 79, 0.06);
    border-color: rgba(255, 77, 79, 0.2);
  }
  &.finding-warning {
    background: rgba(255, 169, 64, 0.06);
    border-color: rgba(255, 169, 64, 0.2);
  }
  &.finding-info {
    background: rgba(0, 212, 255, 0.04);
    border-color: rgba(0, 212, 255, 0.15);
  }
}

.rpp-finding-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rpp-finding-icon-text {
  font-size: 24rpx;
}

.rpp-finding-content {
  flex: 1;
  min-width: 0;
}

.rpp-finding-title {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 6rpx;
}

.rpp-finding-desc {
  display: block;
  font-size: 20rpx;
  color: $text-secondary;
  line-height: 1.4;
}

.rpp-finding-action {
  padding: 6rpx 14rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.rpp-finding-action-text {
  font-size: 20rpx;
  color: $primary;
  font-weight: 600;
}

/* ==================== 研判建议 ==================== */
.rpp-advice-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.rpp-advice-item {
  display: flex;
  gap: 14rpx;
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background: $bg-card;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.rpp-advice-num {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rpp-advice-num-text {
  font-size: 22rpx;
  font-weight: 800;
  color: $primary;
}

.rpp-advice-content {
  flex: 1;
  min-width: 0;
}

.rpp-advice-title {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 6rpx;
}

.rpp-advice-desc {
  display: block;
  font-size: 20rpx;
  color: $text-secondary;
  line-height: 1.5;
}

/* ==================== 报告生成 ==================== */
.rpp-section-report {
  margin-top: 4rpx;
  padding-top: 16rpx;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.rpp-report-form {
  padding: 20rpx;
  border-radius: 20rpx;
  background: rgba(0, 212, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.12);
}

.rpp-form-row {
  margin-bottom: 18rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.rpp-form-label {
  display: block;
  font-size: 20rpx;
  color: $text-secondary;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.rpp-form-input {
  width: 100%;
  height: 72rpx;
  padding: 0 16rpx;
  border-radius: 14rpx;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 24rpx;
  color: $text-primary;
  box-sizing: border-box;
}

.rpp-form-placeholder {
  color: $text-hint;
  font-size: 22rpx;
}

.rpp-form-radio-group {
  display: flex;
  gap: 10rpx;
}

.rpp-form-radio {
  padding: 10rpx 20rpx;
  border-radius: 12rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.15s ease;

  &.selected {
    background: rgba(0, 212, 255, 0.12);
    border-color: rgba(0, 212, 255, 0.4);
    .rpp-form-radio-text { color: $primary; font-weight: 700; }
  }

  &:active { transform: scale(0.96); }
}

.rpp-form-radio-text {
  font-size: 22rpx;
  color: $text-secondary;
  font-weight: 600;
}

.rpp-form-check-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.rpp-form-checkbox {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  border-radius: 10rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.15s ease;

  &.checked {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    .rpp-form-checkbox-text { color: $primary; }
  }
}

.rpp-checkbox-box {
  width: 28rpx;
  height: 28rpx;
  border-radius: 7rpx;
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &.checked {
    background: $primary;
    border-color: $primary;
  }
}

.rpp-checkbox-check {
  font-size: 16rpx;
  color: #fff;
  font-weight: 800;
  line-height: 1;
}

.rpp-form-checkbox-text {
  font-size: 22rpx;
  color: $text-secondary;
  font-weight: 500;
}

/* ==================== 底部栏 ==================== */
.rpp-footer {
  padding: 16rpx 28rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
  background: rgba(8, 14, 24, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.rpp-footer-actions {
  display: flex;
  gap: 14rpx;
}

.rpp-footer-btn {
  flex: 1;
  height: 84rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  transition: all 0.15s ease;

  &:active {
    transform: scale(0.97);
    opacity: 0.88;
  }

  &.rpp-footer-btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    .rpp-footer-btn-icon { font-size: 26rpx; }
    .rpp-footer-btn-text { color: $text-secondary; }
  }
  &.rpp-footer-btn-primary {
    background: linear-gradient(135deg, #0090bb, #007aaa);
    border: 1px solid rgba(0, 212, 255, 0.4);
    .rpp-footer-btn-icon { font-size: 26rpx; }
    .rpp-footer-btn-text { color: #fff; }
  }
}

.rpp-footer-btn-icon {
  font-size: 26rpx;
}

.rpp-footer-btn-text {
  font-size: 26rpx;
  font-weight: 800;
}
</style>
