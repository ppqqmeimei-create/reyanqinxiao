<template>
  <view class="kg-page" :class="{ 'night-mode': appStore.nightModeEnabled }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="nav-back" @click="goBack">
        <text class="icon">←</text>
      </view>
      <view class="nav-title">
        <text class="title-text">关系图谱详情</text>
        <text class="subtitle">Knowledge Graph</text>
      </view>
      <view class="nav-actions">
        <view class="action-btn" @click="showFilter = !showFilter">
          <text class="icon">🔍</text>
        </view>
        <view class="action-btn" @click="showStats = !showStats">
          <text class="icon">📊</text>
        </view>
      </view>
    </view>

    <!-- 图谱统计概览 -->
    <view class="stats-strip">
      <view class="stat-item">
        <text class="stat-num">{{ graphNodes.length }}</text>
        <text class="stat-label">实体</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ graphEdges.length }}</text>
        <text class="stat-label">关系</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ suspiciousCount }}</text>
        <text class="stat-label">可疑</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ confirmedCount }}</text>
        <text class="stat-label">已证实</text>
      </view>
    </view>

    <!-- 节点类型筛选 -->
    <view v-if="showFilter" class="filter-panel">
      <view class="filter-row">
        <text class="filter-label">实体类型</text>
        <view class="filter-tags">
          <view
            v-for="type in nodeTypes"
            :key="type.key"
            class="filter-tag"
            :class="{ active: selectedNodeTypes.includes(type.key) }"
            :style="selectedNodeTypes.includes(type.key) ? { background: type.color, borderColor: type.color } : {}"
            @click="toggleNodeType(type.key)"
          >
            <text>{{ type.icon }}</text>
            <text>{{ type.label }}</text>
          </view>
        </view>
      </view>
      <view class="filter-row">
        <text class="filter-label">关系类型</text>
        <view class="filter-tags">
          <view
            v-for="edge in edgeTypes"
            :key="edge.key"
            class="filter-tag edge-tag"
            :class="{ active: selectedEdgeTypes.includes(edge.key) }"
            @click="toggleEdgeType(edge.key)"
          >
            <text>{{ edge.label }}</text>
          </view>
        </view>
      </view>
      <view class="filter-row risk-filter">
        <text class="filter-label">风险等级</text>
        <view class="risk-slider">
          <slider
            :min="0"
            :max="100"
            :value="riskThreshold"
            :show-value="true"
            active-color="#FF4D4F"
            background-color="#1A3350"
            block-size="20"
            @change="onRiskChange"
          />
        </view>
      </view>
    </view>

    <!-- 图谱画布 -->
    <view class="graph-canvas-wrapper">
      <canvas
        canvas-id="kgCanvas"
        class="kg-canvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      ></canvas>

      <!-- 节点层 -->
      <view
        v-for="node in visibleNodes"
        :key="node.id"
        class="graph-node"
        :class="[node.type, {
          selected: selectedNode?.id === node.id,
          suspicious: node.suspicious,
          fading: !selectedNodeTypes.includes(node.type)
        }]"
        :style="{
          left: node.x + 'px',
          top: node.y + 'px',
          '--node-color': getNodeColor(node.type),
          '--node-size': getNodeSize(node) + 'px',
        }"
        @click="selectNode(node)"
        @longpress="onNodeLongPress(node)"
      >
        <view class="node-circle">
          <text class="node-icon">{{ getNodeIcon(node.type) }}</text>
        </view>
        <view class="node-label">{{ node.name }}</view>
        <view v-if="node.suspicious" class="suspicious-badge">!</view>
        <view v-if="node.confidence" class="confidence-badge">
          {{ Math.round(node.confidence * 100) }}%
        </view>
      </view>

      <!-- 边层（SVG） -->
      <svg class="edges-svg" :width="canvasWidth" :height="canvasHeight">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="rgba(0,212,255,0.4)" />
          </marker>
          <marker id="arrowhead-sus" markerWidth="8" markerHeight="6" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="rgba(255,77,79,0.7)" />
          </marker>
        </defs>

        <line
          v-for="edge in visibleEdges"
          :key="edge.id"
          :x1="edge.x1"
          :y1="edge.y1"
          :x2="edge.x2"
          :y2="edge.y2"
          :stroke="edge.suspicious ? 'rgba(255,77,79,0.6)' : 'rgba(0,212,255,0.3)'"
          :stroke-width="edge.suspicious ? 2.5 : 1.5"
          :stroke-dasharray="edge.type === 'POSSIBLE' ? '6,4' : 'none'"
          :marker-end="edge.suspicious ? 'url(#arrowhead-sus)' : 'url(#arrowhead)'"
        />

        <text
          v-for="edge in visibleEdges"
          :key="'el-' + edge.id"
          :x="(edge.x1 + edge.x2) / 2"
          :y="(edge.y1 + edge.y2) / 2 - 6"
          class="edge-label"
          :fill="edge.suspicious ? '#FF6B6B' : '#7AA8CC'"
        >{{ getEdgeLabel(edge.type) }}</text>
      </svg>

      <!-- 控制工具 -->
      <view class="graph-tools">
        <view class="tool-btn" @click="zoomIn">
          <text>+</text>
        </view>
        <view class="tool-btn" @click="zoomOut">
          <text>−</text>
        </view>
        <view class="tool-btn" @click="resetView">
          <text>⟳</text>
        </view>
        <view class="tool-btn" @click="autoLayout">
          <text>🕸️</text>
        </view>
        <view class="tool-btn" :class="{ active: showLabels }" @click="showLabels = !showLabels">
          <text>🏷️</text>
        </view>
      </view>
    </view>

    <!-- 图例 -->
    <view class="graph-legend">
      <view class="legend-title">图例</view>
      <view class="legend-items">
        <view v-for="type in nodeTypes" :key="type.key" class="legend-item">
          <view class="legend-dot" :style="{ background: type.color }"></view>
          <text>{{ type.label }}</text>
        </view>
      </view>
      <view class="legend-edges">
        <view class="legend-edge-item">
          <view class="edge-line solid"></view>
          <text>已证实</text>
        </view>
        <view class="legend-edge-item">
          <view class="edge-line dashed"></view>
          <text>可疑</text>
        </view>
      </view>
    </view>

    <!-- 选中节点详情面板 -->
    <view v-if="selectedNode" class="node-detail-sheet">
      <view class="sheet-header">
        <view class="sheet-icon" :style="{ background: getNodeColor(selectedNode.type) }">
          {{ getNodeIcon(selectedNode.type) }}
        </view>
        <view class="sheet-info">
          <text class="sheet-name">{{ selectedNode.name }}</text>
          <text class="sheet-type">{{ getNodeTypeLabel(selectedNode.type) }}</text>
        </view>
        <view class="sheet-close" @click="selectedNode = null">×</view>
      </view>

      <view class="sheet-body">
        <view class="detail-grid">
          <view class="detail-item">
            <text class="detail-label">唯一标识</text>
            <text class="detail-value mono">{{ selectedNode.id }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">风险等级</text>
            <text class="detail-value" :class="selectedNode.suspicious ? 'risk' : 'safe'">
              {{ selectedNode.suspicious ? '⚠️ 可疑' : '✓ 正常' }}
            </text>
          </view>
          <view class="detail-item" v-if="selectedNode.metadata">
            <text class="detail-label">关联数量</text>
            <text class="detail-value">{{ getNodeConnections(selectedNode.id).length }} 个</text>
          </view>
          <view class="detail-item" v-if="selectedNode.metadata">
            <text class="detail-label">置信度</text>
            <text class="detail-value" :class="getConfidenceClass(selectedNode.confidence)">
              {{ Math.round(selectedNode.confidence * 100) }}%
            </text>
          </view>
        </view>

        <!-- 元数据 -->
        <view v-if="selectedNode.metadata" class="metadata-section">
          <text class="meta-title">详细信息</text>
          <view v-if="selectedNode.metadata.plateNumber" class="meta-row">
            <text class="meta-label">车牌号</text>
            <text class="meta-value mono">{{ selectedNode.metadata.plateNumber }}</text>
          </view>
          <view v-if="selectedNode.metadata.vehicleType" class="meta-row">
            <text class="meta-label">车辆类型</text>
            <text class="meta-value">{{ selectedNode.metadata.vehicleType }}</text>
          </view>
          <view v-if="selectedNode.metadata.location" class="meta-row">
            <text class="meta-label">位置</text>
            <text class="meta-value">{{ selectedNode.metadata.location }}</text>
          </view>
          <view v-if="selectedNode.metadata.speciesName" class="meta-row">
            <text class="meta-label">物种名称</text>
            <text class="meta-value">{{ selectedNode.metadata.speciesName }}</text>
          </view>
          <view v-if="selectedNode.metadata.protectionLevel" class="meta-row">
            <text class="meta-label">保护等级</text>
            <text class="meta-value" :style="{ color: getProtectionColor(selectedNode.metadata.protectionLevel) }">
              {{ selectedNode.metadata.protectionLevel }}
            </text>
          </view>
        </view>

        <!-- 关联关系列表 -->
        <view class="connections-section">
          <text class="conn-title">关联关系 ({{ getNodeConnections(selectedNode.id).length }})</text>
          <view
            v-for="conn in getNodeConnections(selectedNode.id).slice(0, 5)"
            :key="conn.edge.id"
            class="conn-item"
            @click="selectNodeById(conn.node.id)"
          >
            <view class="conn-icon" :style="{ background: getNodeColor(conn.node.type) }">
              {{ getNodeIcon(conn.node.type) }}
            </view>
            <view class="conn-info">
              <text class="conn-name">{{ conn.node.name }}</text>
              <text class="conn-relation">{{ getEdgeLabel(conn.edge.type) }}</text>
            </view>
            <text class="conn-arrow">→</text>
          </view>
        </view>
      </view>

      <view class="sheet-actions">
        <view class="sheet-btn" @click="trackTarget(selectedNode)">
          <text>🎯</text>
          <text>追踪目标</text>
        </view>
        <view class="sheet-btn primary" @click="dispatchInvestigation(selectedNode)">
          <text>📋</text>
          <text>立案侦查</text>
        </view>
      </view>
    </view>

    <!-- 统计面板弹窗 -->
    <view v-if="showStats" class="modal-overlay" @click="showStats = false">
      <view class="stats-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">图谱统计</text>
          <text class="modal-close" @click="showStats = false">×</text>
        </view>
        <view class="stats-content">
          <view class="stats-chart">
            <view class="chart-title">实体类型分布</view>
            <view
              v-for="type in nodeTypes"
              :key="type.key"
              class="chart-bar-row"
            >
              <text class="chart-label">{{ type.icon }} {{ type.label }}</text>
              <view class="chart-bar-bg">
                <view
                  class="chart-bar-fill"
                  :style="{
                    width: getNodeTypePercent(type.key) + '%',
                    background: type.color
                  }"
                ></view>
              </view>
              <text class="chart-count">{{ getNodeCountByType(type.key) }}</text>
            </view>
          </view>

          <view class="stats-summary">
            <view class="summary-item">
              <text class="summary-num">{{ graphNodes.length }}</text>
              <text class="summary-label">实体总数</text>
            </view>
            <view class="summary-item">
              <text class="summary-num suspicious">{{ suspiciousCount }}</text>
              <text class="summary-label">可疑实体</text>
            </view>
            <view class="summary-item">
              <text class="summary-num">{{ avgConnections }}</text>
              <text class="summary-label">平均关联</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../../stores/app.js';
import { useIntelligenceStore } from '../../stores/intelligence.js';
import { INTELLIGENCE_CONFIG } from '../Intelligence/utils/intelligenceConfig.js';

const appStore = useAppStore();
const intelligenceStore = useIntelligenceStore();

const canvasWidth = ref(750);
const canvasHeight = ref(600);
const showFilter = ref(false);
const showStats = ref(false);
const showLabels = ref(true);
const zoom = ref(1);
const selectedNode = ref(null);
const selectedNodeTypes = ref(['PERSON', 'VEHICLE', 'GOODS', 'LOCATION', 'SPECIES', 'CASE']);
const selectedEdgeTypes = ref(['CONFIRMED', 'SUSPECTED', 'POSSIBLE']);
const riskThreshold = ref(50);

// 节点类型配置
const nodeTypes = [
  { key: 'PERSON', label: '人员', icon: '👤', color: '#00D4FF' },
  { key: 'VEHICLE', label: '车辆', icon: '🚗', color: '#722ED1' },
  { key: 'GOODS', label: '货物', icon: '📦', color: '#FA8C16' },
  { key: 'LOCATION', label: '地点', icon: '📍', color: '#52C41A' },
  { key: 'SPECIES', label: '物种', icon: '🐾', color: '#EB2F96' },
  { key: 'CASE', label: '案件', icon: '📁', color: '#F5222D' },
];

// 边类型配置
const edgeTypes = [
  { key: 'CONFIRMED', label: '已证实', color: '#52C41A' },
  { key: 'SUSPECTED', label: '可疑', color: '#FF4D4F' },
  { key: 'POSSIBLE', label: '疑似', color: '#FFA940' },
];

// 初始化图谱数据
const graphNodes = ref([
  { id: 'P001', type: 'PERSON', name: '陈某', x: 200, y: 150, suspicious: true, confidence: 0.92, metadata: { role: '主要嫌疑人', location: '凭祥市' } },
  { id: 'P002', type: 'PERSON', name: '李某', x: 450, y: 100, suspicious: true, confidence: 0.78, metadata: { role: '中间人', location: '东兴市' } },
  { id: 'P003', type: 'PERSON', name: '张某', x: 300, y: 300, suspicious: false, confidence: 0.95, metadata: { role: '货车司机', location: '龙州县' } },
  { id: 'V001', type: 'VEHICLE', name: '桂N-XXXXX', x: 550, y: 200, suspicious: true, confidence: 0.85, metadata: { plateNumber: '桂N-XXXXX', vehicleType: '轻型货车' } },
  { id: 'V002', type: 'VEHICLE', name: '桂F-YYYYY', x: 120, y: 350, suspicious: false, confidence: 0.99, metadata: { plateNumber: '桂F-YYYYY', vehicleType: '面包车' } },
  { id: 'G001', type: 'GOODS', name: '疑似穿山甲', x: 400, y: 350, suspicious: true, confidence: 0.73, metadata: { speciesName: '穿山甲', weight: '约50kg', protectionLevel: '一级保护' } },
  { id: 'G002', type: 'GOODS', name: '野生动物制品', x: 550, y: 400, suspicious: false, confidence: 0.60, metadata: { speciesName: '制品若干' } },
  { id: 'L001', type: 'LOCATION', name: '友谊关卡口', x: 180, y: 480, suspicious: false, confidence: 1.0, metadata: { location: '凭祥市友谊关' } },
  { id: 'L002', type: 'LOCATION', name: '平孟口岸', x: 480, y: 480, suspicious: false, confidence: 1.0, metadata: { location: '那坡县平孟' } },
  { id: 'C001', type: 'CASE', name: '穿山甲走私案-001', x: 350, y: 200, suspicious: false, confidence: 1.0, metadata: { caseId: 'CASE-2026-0041', status: '侦查中' } },
  { id: 'S001', type: 'SPECIES', name: '穿山甲', x: 280, y: 450, suspicious: false, confidence: 1.0, metadata: { speciesName: '穿山甲', latinName: 'Manis pentadactyla', protectionLevel: '国家一级保护' } },
]);

const graphEdges = ref([
  { id: 'E001', source: 'P001', target: 'P002', type: 'CONTACTS', suspicious: false },
  { id: 'E002', source: 'P002', target: 'V001', type: 'OWNS', suspicious: false },
  { id: 'E003', source: 'P003', target: 'V002', type: 'DRIVES', suspicious: false },
  { id: 'E004', source: 'P001', target: 'V001', type: 'USES', suspicious: true },
  { id: 'E005', source: 'P002', target: 'G001', type: 'TRANSPORTS', suspicious: true },
  { id: 'E006', source: 'P003', target: 'G001', type: 'TRANSPORTS', suspicious: false },
  { id: 'E007', source: 'V001', target: 'L001', type: 'PASSES', suspicious: false },
  { id: 'E008', source: 'V001', target: 'L002', type: 'PASSES', suspicious: false },
  { id: 'E009', source: 'G001', target: 'C001', type: 'INVOLVED', suspicious: false },
  { id: 'E010', source: 'C001', target: 'P001', type: 'SUSPECT', suspicious: true },
  { id: 'E011', source: 'C001', target: 'P002', type: 'SUSPECT', suspicious: true },
  { id: 'E012', source: 'P001', target: 'S001', type: 'TRAFFICS', suspicious: true },
  { id: 'E013', source: 'G002', target: 'G001', type: 'RELATED', suspicious: true },
]);

// 计算属性
const visibleNodes = computed(() => {
  return graphNodes.value.filter(n => {
    if (!selectedNodeTypes.value.includes(n.type)) return false;
    if (n.suspicious && n.confidence * 100 < riskThreshold.value) return false;
    return true;
  });
});

const visibleEdges = computed(() => {
  const nodeIds = new Set(visibleNodes.value.map(n => n.id));
  return graphEdges.value
    .filter(e => {
      if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return false;
      if (!selectedEdgeTypes.value.includes(e.type)) return false;
      return true;
    })
    .map(e => {
      const sourceNode = graphNodes.value.find(n => n.id === e.source);
      const targetNode = graphNodes.value.find(n => n.id === e.target);
      const suspicious = sourceNode?.suspicious || targetNode?.suspicious || e.suspicious;
      return {
        ...e,
        x1: sourceNode?.x || 0,
        y1: sourceNode?.y || 0,
        x2: targetNode?.x || 0,
        y2: targetNode?.y || 0,
        suspicious,
      };
    });
});

const suspiciousCount = computed(() =>
  graphNodes.value.filter(n => n.suspicious).length
);

const confirmedCount = computed(() =>
  graphEdges.value.filter(e => !e.suspicious).length
);

const avgConnections = computed(() => {
  if (graphNodes.value.length === 0) return 0;
  const total = graphEdges.value.length * 2;
  return (total / graphNodes.value.length).toFixed(1);
});

function goBack() {
  uni.navigateBack();
}

function selectNode(node) {
  selectedNode.value = selectedNode.value?.id === node.id ? null : node;
  uni.vibrateShort && uni.vibrateShort();
}

function selectNodeById(id) {
  const node = graphNodes.value.find(n => n.id === id);
  if (node) selectNode(node);
}

function onNodeLongPress(node) {
  uni.vibrateLong && uni.vibrateLong();
  uni.showActionSheet({
    itemList: ['追踪目标', '立案侦查', '查看关联', '标记可疑', '导出节点'],
    success: (res) => {
      if (res.tapIndex === 0) trackTarget(node);
      else if (res.tapIndex === 1) dispatchInvestigation(node);
    },
  });
}

function getNodeConnections(nodeId) {
  return graphEdges.value
    .filter(e => e.source === nodeId || e.target === nodeId)
    .map(e => {
      const otherId = e.source === nodeId ? e.target : e.source;
      const node = graphNodes.value.find(n => n.id === otherId);
      return { edge: e, node };
    })
    .filter(c => c.node);
}

function toggleNodeType(key) {
  const idx = selectedNodeTypes.value.indexOf(key);
  if (idx === -1) selectedNodeTypes.value.push(key);
  else if (selectedNodeTypes.value.length > 1) selectedNodeTypes.value.splice(idx, 1);
}

function toggleEdgeType(key) {
  const idx = selectedEdgeTypes.value.indexOf(key);
  if (idx === -1) selectedEdgeTypes.value.push(key);
  else selectedEdgeTypes.value.splice(idx, 1);
}

function onRiskChange(e) {
  riskThreshold.value = e.detail.value;
}

function zoomIn() {
  zoom.value = Math.min(zoom.value + 0.2, 2);
}

function zoomOut() {
  zoom.value = Math.max(zoom.value - 0.2, 0.5);
}

function resetView() {
  zoom.value = 1;
  uni.vibrateShort && uni.vibrateShort();
}

function autoLayout() {
  uni.vibrateShort && uni.vibrateShort();
  uni.showToast({ title: '正在重新布局...', icon: 'none' });
  // 简单的力导向布局算法
  const nodes = graphNodes.value;
  const cols = 3;
  nodes.forEach((node, idx) => {
    node.x = (idx % cols) * 200 + 100;
    node.y = Math.floor(idx / cols) * 150 + 100;
  });
}

function trackTarget(node) {
  uni.showModal({
    title: '追踪目标',
    content: `将对【${node.name}】启动追踪监控，实时推送位置信息`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '追踪已启动', icon: 'success' });
      }
    },
  });
}

function dispatchInvestigation(node) {
  uni.showModal({
    title: '立案侦查',
    content: `将为【${node.name}】创建侦查任务，分配给侦查部门`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '已创建侦查任务', icon: 'success' });
      }
    },
  });
}

function getNodeIcon(type) {
  return nodeTypes.find(t => t.key === type)?.icon || '⚫';
}

function getNodeTypeLabel(type) {
  return nodeTypes.find(t => t.key === type)?.label || type;
}

function getNodeColor(type) {
  return nodeTypes.find(t => t.key === type)?.color || '#00D4FF';
}

function getNodeSize(node) {
  const base = 60;
  const extra = node.suspicious ? 15 : 0;
  return base + extra;
}

function getEdgeLabel(type) {
  const map = {
    CONTACTS: '联络',
    OWNS: '拥有',
    DRIVES: '驾驶',
    USES: '使用',
    TRANSPORTS: '运输',
    PASSES: '途经',
    INVOLVED: '涉案',
    SUSPECT: '嫌疑人',
    TRAFFICS: '走私',
    RELATED: '关联',
  };
  return map[type] || type;
}

function getConfidenceClass(confidence) {
  if (confidence >= 0.9) return 'excellent';
  if (confidence >= 0.7) return 'good';
  if (confidence >= 0.5) return 'fair';
  return 'poor';
}

function getNodeCountByType(type) {
  return graphNodes.value.filter(n => n.type === type).length;
}

function getNodeTypePercent(type) {
  if (graphNodes.value.length === 0) return 0;
  return Math.round((getNodeCountByType(type) / graphNodes.value.length) * 100);
}

function getProtectionColor(level) {
  const map = { '一级保护': '#FF4D4F', '国家一级保护': '#FF4D4F', '国家二级保护': '#FF7A45', '二级保护': '#FF7A45', '一般': '#52C41A' };
  return map[level] || '#52C41A';
}

function onTouchStart(e) {
  // 触控开始
}

function onTouchMove(e) {
  // 触控移动
}

function onTouchEnd(e) {
  // 触控结束
}

onMounted(() => {
  intelligenceStore.setGraphData(graphNodes.value, graphEdges.value);
});
</script>

<style lang="scss" scoped>
@mixin night-mode-colors {
  --bg: #1A0000;
  --surface: #2D0000;
  --border: #4D0000;
  --text: #FF6B6B;
}

.kg-page {
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
  .nav-actions { display: flex; gap: 12rpx;
    .action-btn { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; background: rgba(0,212,255,0.1); border-radius: 50%; border: 1px solid rgba(0,212,255,0.2);
      .icon { font-size: 28rpx; color: #00D4FF; } } }
}

.stats-strip {
  display: flex;
  align-items: center;
  padding: 16rpx 30rpx;
  background: #0C1B2A;
  border-bottom: 1px solid #1A3350;

  .stat-item {
    flex: 1;
    text-align: center;
    .stat-num { font-size: 32rpx; font-weight: 800; color: #00D4FF; display: block; }
    .stat-label { font-size: 20rpx; color: #7AA8CC; }
  }

  .stat-divider { width: 1px; height: 40rpx; background: #1A3350; }
}

.filter-panel {
  background: #0C1B2A;
  border-bottom: 1px solid #1A3350;
  padding: 20rpx 30rpx;

  .filter-row {
    margin-bottom: 16rpx;
    &:last-child { margin-bottom: 0; }
    .filter-label { font-size: 22rpx; color: #7AA8CC; display: block; margin-bottom: 10rpx; }
  }

  .filter-tags { display: flex; flex-wrap: wrap; gap: 10rpx; }

  .filter-tag {
    display: flex;
    align-items: center;
    gap: 6rpx;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    background: #060A14;
    border: 1px solid #1A3350;
    font-size: 22rpx;
    color: #7AA8CC;
    transition: all 0.2s;

    &.active { color: #fff; }
    &.edge-tag { font-size: 20rpx; }
  }

  .risk-slider {
    slider { width: 100%; }
  }
}

.graph-canvas-wrapper {
  position: relative;
  height: 600rpx;
  overflow: hidden;
  background: linear-gradient(135deg, #0a1520 0%, #0f2030 100%);
}

.kg-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.edges-svg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  pointer-events: none;

  .edge-label {
    font-size: 18rpx;
    fill: #7AA8CC;
    text-anchor: middle;
  }
}

.graph-node {
  position: absolute;
  width: var(--node-size);
  height: var(--node-size);
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s, transform 0.2s;
  cursor: pointer;

  &.fading { opacity: 0.2; }

  &.selected {
    z-index: 20;
    .node-circle { transform: scale(1.3); box-shadow: 0 0 20rpx var(--node-color); }
  }

  &.suspicious {
    .node-circle { animation: suspicious-glow 1.5s infinite; }
  }

  .node-circle {
    width: calc(var(--node-size) * 0.8);
    height: calc(var(--node-size) * 0.8);
    border-radius: 50%;
    background: var(--node-color);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255, 255, 255, 0.3);
    transition: all 0.2s;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.4);

    .node-icon { font-size: calc(var(--node-size) * 0.4); }
  }

  .node-label {
    position: absolute;
    top: calc(100% + 6rpx);
    font-size: 20rpx;
    color: #E8F4FF;
    white-space: nowrap;
    text-align: center;
    background: rgba(12, 27, 42, 0.9);
    padding: 4rpx 10rpx;
    border-radius: 6rpx;
    max-width: 120rpx;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .suspicious-badge {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    width: 28rpx;
    height: 28rpx;
    background: #FF4D4F;
    border-radius: 50%;
    font-size: 18rpx;
    color: #fff;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .confidence-badge {
    position: absolute;
    bottom: calc(100% + 2rpx);
    background: rgba(0, 0, 0, 0.7);
    color: #52C41A;
    font-size: 16rpx;
    padding: 2rpx 8rpx;
    border-radius: 8rpx;
  }
}

@keyframes suspicious-glow {
  0%, 100% { box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.4); }
  50% { box-shadow: 0 0 30rpx rgba(255, 77, 79, 0.6); }
}

.graph-tools {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  z-index: 100;

  .tool-btn {
    width: 60rpx;
    height: 60rpx;
    background: rgba(12, 27, 42, 0.9);
    border: 1px solid #1A3350;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    color: #7AA8CC;
    &.active { background: rgba(0, 212, 255, 0.15); border-color: #00D4FF; color: #00D4FF; }
    &:active { transform: scale(0.95); }
  }
}

.graph-legend {
  position: absolute;
  bottom: 20rpx;
  left: 20rpx;
  background: rgba(12, 27, 42, 0.9);
  border: 1px solid #1A3350;
  border-radius: 12rpx;
  padding: 16rpx;
  z-index: 50;

  .legend-title { font-size: 20rpx; color: #4A6A8A; margin-bottom: 10rpx; }
  .legend-items { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 10rpx; }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6rpx;
    font-size: 20rpx;
    color: #7AA8CC;

    .legend-dot { width: 14rpx; height: 14rpx; border-radius: 50%; }
  }

  .legend-edges {
    display: flex;
    gap: 16rpx;
    border-top: 1px solid #1A3350;
    padding-top: 10rpx;
  }

  .legend-edge-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 20rpx;
    color: #7AA8CC;

    .edge-line {
      width: 30rpx;
      height: 3rpx;
      background: #00D4FF;
      &.dashed { background: repeating-linear-gradient(90deg, #FF4D4F, #FF4D4F 4rpx, transparent 4rpx, transparent 8rpx); }
    }
  }
}

// 详情面板
.node-detail-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(12, 27, 42, 0.98);
  border-radius: 24rpx 24rpx 0 0;
  padding: 30rpx;
  max-height: 60vh;
  z-index: 200;
  border-top: 1px solid #1A3350;

  .sheet-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;

    .sheet-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
    }

    .sheet-info {
      flex: 1;
      .sheet-name { font-size: 30rpx; font-weight: 700; color: #E8F4FF; display: block; }
      .sheet-type { font-size: 22rpx; color: #7AA8CC; }
    }

    .sheet-close { font-size: 48rpx; color: #7AA8CC; }
  }

  .sheet-body {
    max-height: calc(60vh - 200rpx);
    overflow-y: auto;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16rpx;
    margin-bottom: 20rpx;

    .detail-item {
      background: #060A14;
      border-radius: 12rpx;
      padding: 16rpx;
      .detail-label { font-size: 20rpx; color: #4A6A8A; display: block; margin-bottom: 4rpx; }
      .detail-value { font-size: 24rpx; color: #E8F4FF; &.mono { font-family: monospace; } &.risk { color: #FF4D4F; } &.safe { color: #52C41A; } &.excellent { color: #52C41A; } &.good { color: #73D13D; } &.fair { color: #FFA940; } &.poor { color: #FF7A45; } }
    }
  }

  .metadata-section, .connections-section {
    background: #060A14;
    border-radius: 12rpx;
    padding: 16rpx;
    margin-bottom: 16rpx;

    .meta-title, .conn-title { font-size: 24rpx; color: #00D4FF; font-weight: 600; display: block; margin-bottom: 12rpx; }
    .meta-row { display: flex; justify-content: space-between; padding: 8rpx 0; border-bottom: 1px solid #1A3350; &:last-child { border: none; } .meta-label { font-size: 22rpx; color: #7AA8CC; } .meta-value { font-size: 22rpx; color: #E8F4FF; } }
  }

  .conn-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 12rpx 0;
    border-bottom: 1px solid #1A3350;
    &:last-child { border: none; }

    .conn-icon { width: 48rpx; height: 48rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24rpx; flex-shrink: 0; }
    .conn-info { flex: 1; .conn-name { font-size: 24rpx; font-weight: 600; color: #E8F4FF; display: block; } .conn-relation { font-size: 20rpx; color: #7AA8CC; } }
    .conn-arrow { font-size: 24rpx; color: #00D4FF; }
  }

  .sheet-actions {
    display: flex;
    gap: 16rpx;
    margin-top: 20rpx;

    .sheet-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      padding: 18rpx 0;
      background: #1A3350;
      border-radius: 14rpx;
      font-size: 26rpx;
      color: #7AA8CC;

      &.primary { background: linear-gradient(135deg, #FF4D4F, #FF7A45); color: #fff; font-weight: 600; }
    }
  }
}

// 统计弹窗
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-modal {
  width: 90%;
  max-width: 700rpx;
  background: #0C1B2A;
  border-radius: 24rpx;
  padding: 30rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  .modal-title { font-size: 30rpx; font-weight: 700; color: #E8F4FF; }
  .modal-close { font-size: 48rpx; color: #7AA8CC; }
}

.stats-content {
  .chart-title { font-size: 24rpx; color: #7AA8CC; margin-bottom: 16rpx; }
}

.chart-bar-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;

  .chart-label { font-size: 22rpx; color: #E8F4FF; width: 100rpx; flex-shrink: 0; }
  .chart-bar-bg { flex: 1; height: 20rpx; background: #1A3350; border-radius: 10rpx; overflow: hidden; }
  .chart-bar-fill { height: 100%; border-radius: 10rpx; }
  .chart-count { font-size: 22rpx; color: #7AA8CC; width: 40rpx; text-align: right; }
}

.stats-summary {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
  border-top: 1px solid #1A3350;
  padding-top: 20rpx;

  .summary-item { flex: 1; text-align: center; .summary-num { font-size: 40rpx; font-weight: 900; color: #00D4FF; display: block; &.suspicious { color: #FF4D4F; } } .summary-label { font-size: 20rpx; color: #7AA8CC; } }
}
</style>
