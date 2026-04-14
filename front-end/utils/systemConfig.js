/**
 * ==========================================
 * 热眼擒枭 - 边境活物走私智能防控引领者
 * ==========================================
 *
 * 目标：边境活物走私智能防控
 * 服务对象：公安机关边境执法部门
 * 核心定位：智能防控引领者
 *
 * 核心能力矩阵：
 * ┌─────────────┬─────────────┬─────────────┬─────────────┐
 * │ 态势感知    │ 情报研判    │ 执法指挥    │ 证据合规    │
 * ├─────────────┼─────────────┼─────────────┼─────────────┤
 * │ 传感器网络  │ 线索分析    │ 联合行动    │ 数字签名    │
 * │ 热力预警    │ 案件串并    │ 资源调度    │ 存证上链    │
 * │ 轨迹追踪    │ 关系图谱    │ 绩效评估    │ 审计追溯    │
 * └─────────────┴─────────────┴─────────────┴─────────────┘
 */

export const SYSTEM_CONFIG = {
  // 系统标识
  appName: '热眼擒枭',
  appCode: 'REYANQINXIAO',
  version: '2.0.0',
  buildNumber: '20260406',

  // 服务对象
  owner: '公安机关边境执法部门',
  domain: '边境活物走私智能防控',

  // 核心业务
  businessScope: [
    '野生动物走私防控',
    '生态环境犯罪监测',
    '食品药品安全监管',
    '跨境有组织犯罪打击',
  ],

  // 技术架构
  techStack: {
    framework: 'uni-app',
    ui: 'Vue 3 Composition API',
    state: 'Pinia',
    style: 'SCSS',
    offline: 'CRDTs Sync Engine',
  },

  // 运行环境（避免模块加载时调用已废弃的 getSystemInfoSync；由 getRuntimeEnv() 按需读取）
  env: 'mp-weixin',
};

// 业务常量
export const BUSINESS_CONSTANTS = {
  // 预警响应等级
  RESPONSE_LEVELS: {
    IMMEDIATE: {
      level: 1,
      label: '立即响应',
      color: '#FF4D4F',
      timeout: 300, // 秒
      description: '需立即拦截，威胁度高',
    },
    URGENT: {
      level: 2,
      label: '紧急响应',
      color: '#FF7A45',
      timeout: 900,
      description: '需1小时内响应',
    },
    PRIORITY: {
      level: 3,
      label: '优先处理',
      color: '#FFA940',
      timeout: 3600,
      description: '需当日内响应',
    },
    ROUTINE: {
      level: 4,
      label: '常规处理',
      color: '#52C41A',
      timeout: 86400,
      description: '按正常工作流程处理',
    },
  },

  // 证据安全等级
  EVIDENCE_LEVELS: {
    CRITICAL: {
      level: 1,
      label: '关键证据',
      color: '#FF4D4F',
      description: '直接定罪证据，不可篡改',
    },
    IMPORTANT: {
      level: 2,
      label: '重要证据',
      color: '#FFA940',
      description: '支撑案件的重要证据',
    },
    SUPPLEMENTARY: {
      level: 3,
      label: '辅助证据',
      color: '#00D4FF',
      description: '辅助证明的补充证据',
    },
  },

  // 情报可信度等级
  INTELLIGENCE_CONFIDENCE: {
    VERY_HIGH: { threshold: 0.9, label: '高度可信', color: '#52C41A' },
    HIGH: { threshold: 0.7, label: '较可信', color: '#73D13D' },
    MEDIUM: { threshold: 0.5, label: '一般可信', color: '#FFA940' },
    LOW: { threshold: 0.3, label: '较低可信', color: '#FF7A45' },
    VERY_LOW: { threshold: 0, label: '存疑', color: '#FF4D4F' },
  },

  // 任务优先级
  TASK_PRIORITIES: {
    P1: { label: '最高', color: '#FF4D4F', sort: 1 },
    P2: { label: '高', color: '#FF7A45', sort: 2 },
    P3: { label: '中', color: '#FFA940', sort: 3 },
    P4: { label: '低', color: '#52C41A', sort: 4 },
  },

  // 案件类型
  CASE_TYPES: {
    WILDLIFE_SMUGGLING: { code: 'WLS', label: '野生动物走私', icon: '🐾', color: '#722ED1' },
    ENVIRONMENT_POLLUTION: { code: 'ENP', label: '环境污染', icon: '🧪', color: '#13C2C2' },
    FOOD_SAFETY: { code: 'FDS', label: '食品安全', icon: '🍖', color: '#FA8C16' },
    DRUG_SAFETY: { code: 'DRS', label: '药品安全', icon: '💊', color: '#EB2F96' },
    ILLEGAL_HUNTING: { code: 'ILH', label: '非法狩猎', icon: '🔫', color: '#F5222D' },
    INVASIVE_SPECIES: { code: 'IAS', label: '外来入侵物种', icon: '🦠', color: '#A0D911' },
    DEFORESTATION: { code: 'DEF', label: '非法采伐', icon: '🪓', color: '#9254DE' },
    ILLEGAL_MINING: { code: 'ILM', label: '非法采矿', icon: '⛏️', color: '#B8860B' },
    WATER_POLLUTION: { code: 'WTP', label: '水污染', icon: '💧', color: '#1890FF' },
    SOIL_POLLUTION: { code: 'SLP', label: '土壤污染', icon: '🌍', color: '#8B4513' },
  },

  // 数据分级
  DATA_CLASSIFICATION: {
    TOP_SECRET: {
      level: 5,
      label: '绝密',
      color: '#FF4D4F',
      description: '跨境有组织犯罪情报',
    },
    SECRET: {
      level: 4,
      label: '机密',
      color: '#FF7A45',
      description: '重点案件侦查数据',
    },
    CONFIDENTIAL: {
      level: 3,
      label: '秘密',
      color: '#FFA940',
      description: '案件基本信息',
    },
    INTERNAL: {
      level: 2,
      label: '内部',
      color: '#00D4FF',
      description: '预警/任务数据',
    },
    PUBLIC: {
      level: 1,
      label: '公开',
      color: '#52C41A',
      description: '态势统计对外发布',
    },
  },

  // 物种保护等级
  PROTECTION_LEVELS: {
    FIRST: { label: '国家一级保护', color: '#FF4D4F', description: '严禁任何形式的猎捕、交易', legalBasis: '《野生动物保护法》第九条' },
    SECOND: { label: '国家二级保护', color: '#FF7A45', description: '限制猎捕、交易，需审批', legalBasis: '《野生动物保护法》第十条' },
    THREE: { label: '三有动物', color: '#FFA940', description: '有重要生态、科学、社会价值', legalBasis: '《野生动物保护法》第十一条' },
    INVASIVE: { label: '外来入侵物种', color: '#EB2F96', description: '无审批直接处置', legalBasis: '《生物安全法》' },
    LEGAL: { label: '合法养殖/种植', color: '#52C41A', description: '持证经营', legalBasis: '《动物防疫法》' },
  },

  // 夜间执法模式配置
  NIGHT_MODE: {
    RED_LIGHT: {
      bg: '#1A0000',
      surface: '#2D0000',
      border: '#4D0000',
      text: '#FF6B6B',
      textSecondary: '#993333',
      accent: '#CC3333',
      highlight: '#FF4444',
    },
    DARK: {
      bg: '#060A14',
      surface: '#0C1B2A',
      border: '#1A3350',
      text: '#E8F4FF',
      textSecondary: '#7AA8CC',
      accent: '#00D4FF',
      highlight: '#00F5FF',
    },
  },
};

/** 按需获取运行平台（小程序端优先避免 getSystemInfoSync 废弃告警） */
export function getRuntimePlatform() {
  try {
    if (typeof uni === 'undefined') return 'unknown';
    if (typeof uni.getDeviceInfoSync === 'function') {
      const d = uni.getDeviceInfoSync();
      if (d && d.platform) return d.platform;
    }
    return 'mp-weixin';
  } catch {
    return 'mp-weixin';
  }
}

export default SYSTEM_CONFIG;
