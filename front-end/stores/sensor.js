/**
 * ==========================================
 * Sensor Store - 传感器融合状态
 * ==========================================
 * 多传感器数据融合、AR物种识别、现场快速检测
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BUSINESS_CONSTANTS } from '../utils/systemConfig.js';

export const useSensorStore = defineStore('sensor', () => {
  // ===== AR物种识别 =====
  const arRecognitionState = ref({
    active: false,
    cameraStream: null,
    recognitionResult: null,
    confidence: 0,
    speciesInfo: null,
    processing: false,
    lastCapturedImage: null, // 最近一次拍摄的图片路径
  });

  const speciesDatabase = ref([
    {
      id: 'SP001',
      name: '亚洲象',
      latinName: 'Elephas maximus',
      protectionLevel: 'FIRST',
      imageUrls: [],
      description: '国家一级保护动物，是热带森林生态系统旗舰物种',
      legalBasis: '《野生动物保护法》第九条',
      handlingProcedure: '立即上报，设置警戒区域，协助专业人员转移',
    },
    {
      id: 'SP002',
      name: '穿山甲',
      latinName: 'Manis pentadactyla',
      protectionLevel: 'FIRST',
      imageUrls: [],
      description: '国家一级保护动物，禁止任何形式的猎捕、交易',
      legalBasis: '《野生动物保护法》第九条',
      handlingProcedure: '立即上报，禁止触碰，协助野生动物救护部门',
    },
    {
      id: 'SP003',
      name: '白颊长臂猿',
      latinName: 'Nomascus leucogenys',
      protectionLevel: 'FIRST',
      imageUrls: [],
      description: '国家一级保护动物，鸣声婉转，社会性强的类人猿',
      legalBasis: '《野生动物保护法》第九条',
      handlingProcedure: '设置隔离区，立即上报，等待专业人员到场',
    },
    {
      id: 'SP004',
      name: '巨蜥',
      latinName: 'Varanus salvator',
      protectionLevel: 'SECOND',
      imageUrls: [],
      description: '国家二级保护动物，需审批后方可处置',
      legalBasis: '《野生动物保护法》第十条',
      handlingProcedure: '拍照留证，暂扣处理，联系野生动物保护部门',
    },
    {
      id: 'SP005',
      name: '眼镜王蛇',
      latinName: 'Ophiophagus hannah',
      protectionLevel: 'SECOND',
      imageUrls: [],
      description: '国家二级保护动物，世界上最大的毒蛇',
      legalBasis: '《野生动物保护法》第十条',
      handlingProcedure: '保持安全距离，禁止徒手捕捉，联系专业人员',
    },
    {
      id: 'SP006',
      name: '巴西龟',
      latinName: 'Trachemys scripta elegans',
      protectionLevel: 'INVASIVE',
      imageUrls: [],
      description: '外来入侵物种，对本地生态系统造成威胁',
      legalBasis: '《生物安全法》',
      handlingProcedure: '无需审批，直接处置，作无害化处理',
    },
    {
      id: 'SP007',
      name: '福寿螺',
      latinName: 'Pomacea canaliculata',
      protectionLevel: 'INVASIVE',
      imageUrls: [],
      description: '外来入侵物种，对农业生产和生态平衡造成严重危害',
      legalBasis: '《生物安全法》',
      handlingProcedure: '无需审批，直接处置，作无害化处理',
    },
    {
      id: 'SP008',
      name: '鬣羚',
      latinName: 'Capricornis milneedwardsii',
      protectionLevel: 'SECOND',
      imageUrls: [],
      description: '国家二级保护动物，偶蹄目牛科动物',
      legalBasis: '《野生动物保护法》第十条',
      handlingProcedure: '设置隔离区，拍照留证，联系野生动物保护部门',
    },
  ]);

  // ===== 现场快速检测 =====
  const rapidTestState = ref({
    active: false,
    testType: null,    // 'wildlife' | 'border'
    result: null,
    progress: 0,
    connectedDevice: null,
  });

  const rapidTestHistory = ref([]);

  // ===== 传感器融合数据 =====
  const sensorFusionData = ref({
    infrared: [],
    visible: [],
    acoustic: [],
    chemical: [],
    water: [],
    soil: [],
    air: [],
  });

  // ===== 物种识别结果缓存 =====
  const recognitionHistory = ref([]);

  // ===== 计算属性 =====
  const protectionLevelInfo = computed(() => BUSINESS_CONSTANTS.PROTECTION_LEVELS);

  const criticalSpecies = computed(() =>
    speciesDatabase.value.filter(s => s.protectionLevel === 'FIRST')
  );

  const invasiveSpecies = computed(() =>
    speciesDatabase.value.filter(s => s.protectionLevel === 'INVASIVE')
  );

  const recentRecognitions = computed(() =>
    recognitionHistory.value.slice(0, 10)
  );

  // ===== AR物种识别Actions =====
  function startARRecognition() {
    arRecognitionState.value.active = true;
    arRecognitionState.value.processing = true;
    arRecognitionState.value.recognitionResult = null;
    arRecognitionState.value.speciesInfo = null;

    uni.vibrateShort && uni.vibrateShort();
  }

  function stopARRecognition() {
    arRecognitionState.value.active = false;
    arRecognitionState.value.processing = false;
    arRecognitionState.value.lastCapturedImage = null;

    // 关闭摄像头
    if (arRecognitionState.value.cameraStream) {
      // uni-app关闭摄像头
      uni.stopCamera && uni.stopCamera();
      arRecognitionState.value.cameraStream = null;
    }
  }

  /** 缓存摄像头截取的图片路径，供识别使用 */
  function setLastCapturedImage(path) {
    arRecognitionState.value.lastCapturedImage = path;
  }

  /**
   * 模拟AI物种识别
   * 实际应用中应调用后端AI模型API
   * @param {string|null} imageData - 图片路径，若为null则使用模拟数据
   */
  async function recognizeSpecies(imageData) {
    arRecognitionState.value.processing = true;

    // 优先使用真实拍摄图片路径
    const imagePath = imageData || arRecognitionState.value.lastCapturedImage;
    console.log('[Sensor] 识别图片路径:', imagePath);

    // 模拟AI识别延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 模拟随机选择一个物种作为识别结果
    const randomSpecies = speciesDatabase.value[
      Math.floor(Math.random() * speciesDatabase.value.length)
    ];

    const confidence = 0.75 + Math.random() * 0.2;  // 0.75 ~ 0.95

    arRecognitionState.value.recognitionResult = {
      speciesId: randomSpecies.id,
      speciesName: randomSpecies.name,
      confidence: Math.round(confidence * 100) / 100,
    };
    arRecognitionState.value.speciesInfo = randomSpecies;
    arRecognitionState.value.processing = false;

    // 震动反馈
    if (randomSpecies.protectionLevel === 'FIRST') {
      uni.vibrateLong && uni.vibrateLong();
    } else {
      uni.vibrateShort && uni.vibrateShort();
    }

    // 记录历史
    recognitionHistory.value.unshift({
      id: `REC-${Date.now()}`,
      ...arRecognitionState.value.recognitionResult,
      timestamp: new Date().toISOString(),
      location: uni.getStorageSync('current_location') || null,
    });

    return arRecognitionState.value.speciesInfo;
  }

  function getSpeciesByProtectionLevel(level) {
    return speciesDatabase.value.filter(s => s.protectionLevel === level);
  }

  // ===== 快速检测Actions =====
  function startRapidTest(testType) {
    rapidTestState.value.active = true;
    rapidTestState.value.testType = testType;
    rapidTestState.value.result = null;
    rapidTestState.value.progress = 0;

    // 模拟检测进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        _completeRapidTest();
      }
      rapidTestState.value.progress = Math.min(Math.round(progress), 100);
    }, 300);

    uni.vibrateShort && uni.vibrateShort();
  }

  async function _completeRapidTest() {
    // 模拟检测结果
    const results = {
      drug: [
        { name: '瘦肉精（克伦特罗）', status: 'NEGATIVE', value: '<0.5μg/kg', limit: '1.0μg/kg' },
        { name: '莱克多巴胺', status: 'NEGATIVE', value: '<0.5μg/kg', limit: '1.0μg/kg' },
        { name: '沙丁胺醇', status: 'POSITIVE', value: '2.3μg/kg', limit: '1.0μg/kg' },
      ],
      food: [
        { name: '亚硝酸盐', status: 'NEGATIVE', value: '8mg/kg', limit: '30mg/kg' },
        { name: '重金属（铅）', status: 'NEGATIVE', value: '0.02mg/kg', limit: '0.1mg/kg' },
        { name: '农药残留（有机磷）', status: 'NEGATIVE', value: '<0.01mg/kg', limit: '0.1mg/kg' },
      ],
    };
    const testResult = {
      id: `TEST-${Date.now()}`,
      testType: rapidTestState.value.testType,
      timestamp: new Date().toISOString(),
      location: uni.getStorageSync('current_location') || null,
      operator: uni.getStorageSync('user_info')?.name || 'unknown',
      items: results[rapidTestState.value.testType] || [],
      overallStatus: _getOverallStatus(results[rapidTestState.value.testType]),
    };

    rapidTestState.value.result = testResult;
    rapidTestState.value.active = false;
    rapidTestState.value.progress = 100;

    rapidTestHistory.value.unshift(testResult);
    uni.setStorageSync('rapid_test_history', rapidTestHistory.value.slice(0, 200));

    // 告警震动
    if (testResult.overallStatus === 'POSITIVE' || testResult.overallStatus === 'WARNING') {
      uni.vibrateLong && uni.vibrateLong();
    }

    return testResult;
  }

  function _getOverallStatus(items) {
    if (items.some(i => i.status === 'POSITIVE')) return 'POSITIVE';
    if (items.some(i => i.status === 'WARNING')) return 'WARNING';
    return 'NEGATIVE';
  }

  function stopRapidTest() {
    rapidTestState.value.active = false;
    rapidTestState.value.progress = 0;
  }

  // ===== 传感器数据融合 =====
  function updateSensorData(type, data) {
    if (Array.isArray(sensorFusionData.value[type])) {
      sensorFusionData.value[type] = data;
    }
  }

  /**
   * 多传感器融合分析
   * 综合红外、可见光、声学、化学等多种传感器数据
   */
  function performSensorFusion(location) {
    const result = {
      location,
      timestamp: new Date().toISOString(),
      overallRiskLevel: 'LOW',  // LOW | MEDIUM | HIGH | CRITICAL
      confidence: 0,
      factors: [],
    };

    // 模拟融合分析逻辑
    // 实际应用中应根据各传感器数据综合判断

    // 红外传感器检测
    if (sensorFusionData.value.infrared.length > 0) {
      const infraredRisk = sensorFusionData.value.infrared
        .filter(d => d.temperature > 38)
        .length;
      if (infraredRisk > 0) {
        result.factors.push({ source: 'infrared', risk: 'HIGH', detail: '检测到高温热源' });
      }
    }

    // 化学传感器检测
    if (sensorFusionData.value.chemical.length > 0) {
      const chemicalAlert = sensorFusionData.value.chemical
        .filter(d => d.anomaly > 0.7)
        .length;
      if (chemicalAlert > 0) {
        result.factors.push({ source: 'chemical', risk: 'MEDIUM', detail: '检测到化学异常' });
      }
    }

    // 综合评分
    const riskMap = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const maxRisk = Math.max(...result.factors.map(f => riskMap[f.risk] || 1), 1);
    const levelMap = { 4: 'CRITICAL', 3: 'HIGH', 2: 'MEDIUM', 1: 'LOW' };
    result.overallRiskLevel = levelMap[maxRisk];
    result.confidence = 0.6 + maxRisk * 0.1;

    return result;
  }

  // ===== 初始化 =====
  function init() {
    // 恢复物种数据库（可扩展为从后端拉取）
    const savedSpecies = uni.getStorageSync('species_database');
    if (Array.isArray(savedSpecies) && savedSpecies.length > 0) {
      speciesDatabase.value = savedSpecies;
    }

    // 恢复快速检测历史
    const savedTests = uni.getStorageSync('rapid_test_history');
    if (Array.isArray(savedTests)) {
      rapidTestHistory.value = savedTests;
    }

    // 恢复识别历史
    const savedRecognitions = uni.getStorageSync('recognition_history');
    if (Array.isArray(savedRecognitions)) {
      recognitionHistory.value = savedRecognitions;
    }
  }

  return {
    // AR物种识别
    arRecognitionState,
    speciesDatabase,
    recognitionHistory,

    // 快速检测
    rapidTestState,
    rapidTestHistory,

    // 传感器融合
    sensorFusionData,

    // 计算属性
    protectionLevelInfo,
    criticalSpecies,
    invasiveSpecies,
    recentRecognitions,

    // AR Actions
    startARRecognition,
    stopARRecognition,
    setLastCapturedImage,
    recognizeSpecies,
    getSpeciesByProtectionLevel,

    // 快速检测Actions
    startRapidTest,
    stopRapidTest,

    // 传感器融合Actions
    updateSensorData,
    performSensorFusion,

    // 初始化
    init,
  };
});
