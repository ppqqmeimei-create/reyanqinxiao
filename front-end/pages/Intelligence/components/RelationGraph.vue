<template>
  <view class="relation-graph">
    <!-- 工具栏 -->
    <view class="graph-toolbar">
      <view class="tool-item" @click="zoomIn">
        <text class="icon">🔍+</text>
      </view>
      <view class="tool-item" @click="zoomOut">
        <text class="icon">🔍-</text>
      </view>
      <view class="tool-item" @click="resetView">
        <text class="icon">⟳</text>
      </view>
      <view class="tool-separator"></view>
      <view class="tool-item" :class="{ active: showLabels }" @click="showLabels = !showLabels">
        <text class="icon">🏷️</text>
      </view>
      <view class="tool-item" :class="{ active: highlightSuspicious }" @click="highlightSuspicious = !highlightSuspicious">
        <text class="icon">🚨</text>
      </view>
    </view>

    <!-- 节点图 -->
    <view class="graph-canvas" :style="{ transform: `scale(${zoom})` }">
      <!-- 边 -->
      <svg class="edges-layer" :width="canvasWidth" :height="canvasHeight">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(0,212,255,0.5)" />
          </marker>
          <marker id="arrowhead-suspicious" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,77,79,0.8)" />
          </marker>
        </defs>

        <line
          v-for="edge in visibleEdges"
          :key="edge.id"
          :x1="edge.x1"
          :y1="edge.y1"
          :x2="edge.x2"
          :y2="edge.y2"
          :stroke="edge.suspicious ? GRAPH_COLORS.EDGE_SUSPICIOUS : GRAPH_COLORS.EDGE_NORMAL"
          :stroke-width="edge.suspicious ? 3 : 1.5"
          :marker-end="edge.suspicious ? 'url(#arrowhead-suspicious)' : 'url(#arrowhead)'"
        />

        <!-- 关系标签 -->
        <text
          v-for="edge in visibleEdges"
          :key="'label-' + edge.id"
          :x="(edge.x1 + edge.x2) / 2"
          :y="(edge.y1 + edge.y2) / 2 - 8"
          class="edge-label"
          :fill="edge.suspicious ? '#FF4D4F' : '#7AA8CC'"
          text-anchor="middle"
        >{{ edge.label }}</text>
      </svg>

      <!-- 节点层 -->
      <view
        v-for="node in nodes"
        :key="node.id"
        class="graph-node"
        :class="[node.type, { suspicious: node.suspicious, selected: selectedNode?.id === node.id }]"
        :style="{
          left: node.x + 'px',
          top: node.y + 'px',
          background: GRAPH_COLORS[`NODE_${node.type.toUpperCase()}`] || '#00D4FF',
        }"
        @click="selectNode(node)"
      >
        <text class="node-icon">{{ getNodeIcon(node.type) }}</text>
        <text v-if="showLabels" class="node-label">{{ node.name }}</text>
        <view v-if="node.suspicious" class="suspicious-badge">!</view>
      </view>
    </view>

    <!-- 节点详情面板 -->
    <view v-if="selectedNode" class="node-detail-panel">
      <view class="panel-header">
        <view class="node-type-icon" :style="{ background: GRAPH_COLORS[`NODE_${selectedNode.type.toUpperCase()}`] }">
          {{ getNodeIcon(selectedNode.type) }}
        </view>
        <view class="node-info">
          <text class="node-name">{{ selectedNode.name }}</text>
          <text class="node-type-label">{{ getNodeTypeLabel(selectedNode.type) }}</text>
        </view>
        <view class="close-btn" @click="selectedNode = null">×</view>
      </view>

      <view class="panel-body">
        <view class="detail-row">
          <text class="row-label">唯一标识</text>
          <text class="row-value mono">{{ selectedNode.id }}</text>
        </view>
        <view class="detail-row">
          <text class="row-label">关联边数</text>
          <text class="row-value">{{ getConnectedEdges(selectedNode.id).length }}</text>
        </view>
        <view class="detail-row">
          <text class="row-label">风险等级</text>
          <text class="row-value" :style="{ color: selectedNode.suspicious ? '#FF4D4F' : '#52C41A' }">
            {{ selectedNode.suspicious ? '可疑' : '正常' }}
          </text>
        </view>
        <view v-if="selectedNode.metadata" class="detail-row">
          <text class="row-label">元数据</text>
          <text class="row-value">{{ JSON.stringify(selectedNode.metadata) }}</text>
        </view>
      </view>

      <view class="panel-actions">
        <view class="action-btn" @click="viewConnections(selectedNode)">
          <text>查看关联</text>
        </view>
        <view class="action-btn primary" @click="trackTarget(selectedNode)">
          <text>追踪目标</text>
        </view>
      </view>
    </view>

    <!-- 底部图例 -->
    <view class="graph-legend">
      <view class="legend-title">图例说明</view>
      <view class="legend-items">
        <view v-for="item in legendItems" :key="item.type" class="legend-item">
          <view class="legend-dot" :style="{ background: GRAPH_COLORS[`NODE_${item.type}`] }"></view>
          <text>{{ item.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { INTELLIGENCE_CONFIG } from '../utils/intelligenceConfig.js';

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  edges: { type: Array, default: () => [] },
});

const emit = defineEmits(['select', 'track', 'view-connections']);

const GRAPH_COLORS = INTELLIGENCE_CONFIG.GRAPH_COLORS;

const zoom = ref(1);
const showLabels = ref(true);
const highlightSuspicious = ref(true);
const selectedNode = ref(null);
const canvasWidth = 700;
const canvasHeight = 500;

const legendItems = [
  { type: 'PERSON', label: '人员' },
  { type: 'VEHICLE', label: '车辆' },
  { type: 'GOODS', label: '货物' },
  { type: 'LOCATION', label: '地点' },
  { type: 'SPECIES', label: '物种' },
  { type: 'CASE', label: '案件' },
];

const visibleEdges = computed(() => {
  const nodeIds = new Set(props.nodes.map(n => n.id));
  return props.edges
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map(e => {
      const sourceNode = props.nodes.find(n => n.id === e.source);
      const targetNode = props.nodes.find(n => n.id === e.target);
      const suspicious = highlightSuspicious.value && (sourceNode?.suspicious || targetNode?.suspicious);
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

function zoomIn() { zoom.value = Math.min(zoom.value + 0.2, 2); }
function zoomOut() { zoom.value = Math.max(zoom.value - 0.2, 0.5); }
function resetView() { zoom.value = 1; }

function selectNode(node) {
  selectedNode.value = selectedNode.value?.id === node.id ? null : node;
  emit('select', node);
}

function getNodeIcon(type) {
  const map = { PERSON: '👤', VEHICLE: '🚗', GOODS: '📦', LOCATION: '📍', SPECIES: '🐾', CASE: '📁' };
  return map[type] || '⚫';
}

function getNodeTypeLabel(type) {
  const map = { PERSON: '人员', VEHICLE: '车辆', GOODS: '货物/动物', LOCATION: '地点', SPECIES: '物种', CASE: '案件' };
  return map[type] || type;
}

function getConnectedEdges(nodeId) {
  return props.edges.filter(e => e.source === nodeId || e.target === nodeId);
}

function viewConnections(node) {
  emit('view-connections', node);
}

function trackTarget(node) {
  emit('track', node);
}
</script>

<style lang="scss" scoped>
.relation-graph {
  position: relative;
  width: 100%;
  height: 600rpx;
  background: #0C1B2A;
  border-radius: 16rpx;
  overflow: hidden;
}

.graph-toolbar {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  z-index: 100;
  display: flex;
  gap: 8rpx;
  background: rgba(12, 27, 42, 0.9);
  border-radius: 12rpx;
  padding: 8rpx;
  border: 1px solid #1A3350;

  .tool-item {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8rpx;
    .icon { font-size: 24rpx; }
    &.active { background: rgba(0, 212, 255, 0.15); }
    &:active { background: rgba(0, 212, 255, 0.2); transform: scale(0.95); }
  }

  .tool-separator {
    width: 1px;
    background: #1A3350;
    margin: 4rpx 4rpx;
  }
}

.graph-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: center center;
  transition: transform 0.3s;
}

.edges-layer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.edge-label {
  font-size: 18rpx;
  pointer-events: none;
}

.graph-node {
  position: absolute;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  z-index: 10;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.5);

  &.selected {
    border-color: #fff;
    box-shadow: 0 0 20rpx rgba(0, 212, 255, 0.8);
    transform: translate(-50%, -50%) scale(1.2);
  }

  &.suspicious {
    animation: suspicious-pulse 1.5s infinite;
  }

  .node-icon { font-size: 28rpx; }
  .node-label {
    position: absolute;
    top: 100%;
    margin-top: 4rpx;
    font-size: 16rpx;
    color: #E8F4FF;
    white-space: nowrap;
    text-align: center;
  }

  .suspicious-badge {
    position: absolute;
    top: -6rpx;
    right: -6rpx;
    width: 24rpx;
    height: 24rpx;
    background: #FF4D4F;
    border-radius: 50%;
    font-size: 16rpx;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
}

@keyframes suspicious-pulse {
  0%, 100% { box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(255, 77, 79, 0.4); }
  50% { box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.5), 0 0 0 10rpx rgba(255, 77, 79, 0); }
}

.node-detail-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(12, 27, 42, 0.97);
  border-top: 1px solid #1A3350;
  border-radius: 16rpx 16rpx 0 0;
  padding: 24rpx;
  z-index: 200;

  .panel-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 20rpx;

    .node-type-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
    }

    .node-info {
      flex: 1;
      .node-name { font-size: 28rpx; font-weight: 600; color: #E8F4FF; display: block; }
      .node-type-label { font-size: 22rpx; color: #7AA8CC; }
    }

    .close-btn {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
      color: #7AA8CC;
    }
  }

  .panel-body {
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10rpx 0;
      border-bottom: 1px solid #1A3350;
      .row-label { font-size: 24rpx; color: #7AA8CC; }
      .row-value { font-size: 24rpx; color: #E8F4FF; &.mono { font-family: monospace; } }
    }
  }

  .panel-actions {
    display: flex;
    gap: 16rpx;
    margin-top: 16rpx;

    .action-btn {
      flex: 1;
      text-align: center;
      padding: 14rpx 0;
      border-radius: 10rpx;
      background: #1A3350;
      font-size: 24rpx;
      color: #7AA8CC;

      &.primary {
        background: linear-gradient(135deg, #FF4D4F 0%, #FF7A45 100%);
        color: #fff;
        font-weight: 600;
      }
    }
  }
}

.graph-legend {
  position: absolute;
  bottom: 16rpx;
  left: 16rpx;
  background: rgba(12, 27, 42, 0.9);
  border-radius: 10rpx;
  padding: 12rpx 16rpx;
  border: 1px solid #1A3350;
  z-index: 50;

  .legend-title { font-size: 20rpx; color: #4A6A8A; margin-bottom: 8rpx; }
  .legend-items {
    display: flex;
    gap: 16rpx;
    flex-wrap: wrap;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6rpx;
      font-size: 20rpx;
      color: #7AA8CC;

      .legend-dot { width: 14rpx; height: 14rpx; border-radius: 50%; }
    }
  }
}
</style>
