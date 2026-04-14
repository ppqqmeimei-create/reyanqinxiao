/**
 * ==========================================
 * Intelligence Store - 情报研判状态
 * ==========================================
 * 线索池、案件串并、关系图谱、战法模型库
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BUSINESS_CONSTANTS } from '../utils/systemConfig.js';

export const useIntelligenceStore = defineStore('intelligence', () => {
  // ===== 线索池 =====
  const clues = ref([]);
  const selectedClue = ref(null);
  const clueFilter = ref({
    type: 'all',       // 'all' | 'wildlife'
    confidence: 'all', // 'all' | 'very_high' | 'high' | 'medium' | 'low'
    status: 'all',     // 'all' | 'pending' | 'processing' | 'verified' | 'dismissed'
    dateRange: null,
  });

  // ===== 案件串并 =====
  const caseClusters = ref([]);  // 关联案件组
  const currentCluster = ref(null);

  // ===== 关系图谱数据 =====
  const graphNodes = ref([]);
  const graphEdges = ref([]);

  // ===== 战法模型库 =====
  const tacticModels = ref([
    {
      id: 'T001',
      name: '夜间跨境运输识别模型',
      description: '基于时间窗口和卡口数据的夜间运输识别',
      type: 'pattern',
      accuracy: 0.87,
      usageCount: 234,
      lastUsed: '2026-04-06T08:30:00Z',
    },
    {
      id: 'T002',
      name: '异常聚集检测模型',
      description: '基于热成像传感器数据检测人员异常聚集',
      type: 'anomaly',
      accuracy: 0.82,
      usageCount: 156,
      lastUsed: '2026-04-05T22:15:00Z',
    },
    {
      id: 'T003',
      name: '物种相似度比对模型',
      description: '利用图像识别比对受保护物种图谱',
      type: 'recognition',
      accuracy: 0.91,
      usageCount: 412,
      lastUsed: '2026-04-06T09:00:00Z',
    },
    {
      id: 'T004',
      name: '运输链溯源模型',
      description: '基于GPS轨迹和交易记录还原运输网络',
      type: 'tracing',
      accuracy: 0.78,
      usageCount: 89,
      lastUsed: '2026-04-04T14:30:00Z',
    },
  ]);

  // ===== 情报统计 =====
  const stats = ref({
    totalClues: 0,
    pendingClues: 0,
    verifiedClues: 0,
    dismissedClues: 0,
    totalClusters: 0,
    activeClusters: 0,
    resolvedClusters: 0,
  });

  // ===== 计算属性 =====
  const filteredClues = computed(() => {
    let result = clues.value;
    const f = clueFilter.value;

    if (f.type !== 'all') {
      result = result.filter(c => c.type === f.type);
    }
    if (f.confidence !== 'all') {
      result = result.filter(c => c.confidenceLevel === f.confidence);
    }
    if (f.status !== 'all') {
      result = result.filter(c => c.status === f.status);
    }
    if (f.dateRange) {
      const [start, end] = f.dateRange;
      result = result.filter(c => {
        const t = new Date(c.createdAt).getTime();
        return t >= start && t <= end;
      });
    }
    return result;
  });

  const highPriorityClues = computed(() =>
    filteredClues.value.filter(c =>
      c.confidenceLevel === 'VERY_HIGH' || c.confidenceLevel === 'HIGH'
    )
  );

  // ===== Actions =====
  function setClues(newClues) {
    clues.value = newClues;
    _updateStats();
  }

  function addClue(clue) {
    clues.value.unshift({
      id: `CLUE-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      confidenceLevel: 'MEDIUM',
      ...clue,
    });
    _updateStats();
  }

  function updateClue(id, updates) {
    const idx = clues.value.findIndex(c => c.id === id);
    if (idx !== -1) {
      clues.value[idx] = { ...clues.value[idx], ...updates };
      _updateStats();
    }
  }

  function selectClue(clue) {
    selectedClue.value = clue;
  }

  function setClueFilter(filter) {
    clueFilter.value = { ...clueFilter.value, ...filter };
  }

  function setCaseClusters(clusters) {
    caseClusters.value = clusters;
    _updateStats();
  }

  function selectCluster(cluster) {
    currentCluster.value = cluster;
  }

  function setGraphData(nodes, edges) {
    graphNodes.value = nodes;
    graphEdges.value = edges;
  }

  function addTacticModel(model) {
    tacticModels.value.push({
      id: `T${String(tacticModels.value.length + 1).padStart(3, '0')}`,
      usageCount: 0,
      lastUsed: null,
      ...model,
    });
  }

  function _updateStats() {
    stats.value = {
      totalClues: clues.value.length,
      pendingClues: clues.value.filter(c => c.status === 'pending').length,
      verifiedClues: clues.value.filter(c => c.status === 'verified').length,
      dismissedClues: clues.value.filter(c => c.status === 'dismissed').length,
      totalClusters: caseClusters.value.length,
      activeClusters: caseClusters.value.filter(c => c.status === 'active').length,
      resolvedClusters: caseClusters.value.filter(c => c.status === 'resolved').length,
    };
  }

  function reset() {
    clues.value = [];
    selectedClue.value = null;
    clueFilter.value = { type: 'all', confidence: 'all', status: 'all', dateRange: null };
    caseClusters.value = [];
    currentCluster.value = null;
    graphNodes.value = [];
    graphEdges.value = [];
    _updateStats();
  }

  return {
    // 状态
    clues,
    selectedClue,
    clueFilter,
    filteredClues,
    highPriorityClues,
    caseClusters,
    currentCluster,
    graphNodes,
    graphEdges,
    tacticModels,
    stats,

    // Actions
    setClues,
    addClue,
    updateClue,
    selectClue,
    setClueFilter,
    setCaseClusters,
    selectCluster,
    setGraphData,
    addTacticModel,
    reset,
  };
});
