/**
 * ==========================================
 * 生态系统 - 生态警务全局状态管理
 * ==========================================
 * 统一导出所有 Pinia Store
 */

import { createPinia } from 'pinia';

const pinia = createPinia();

export default pinia;

// 原有Store
export { useUserStore } from './user';
export { useRealtimeStore } from './realtime';

// 新增Store
export { useAppStore } from './app';           // 全局应用状态（夜间模式、手套触控）
export { useIntelligenceStore } from './intelligence'; // 情报研判状态
export { useEvidenceStore } from './evidence'; // 证据链状态（签名/存证）
export { useSecurityStore } from './security'; // 安全审计状态
export { useOfflineStore } from './offline';  // 离线CRDTs状态
export { useSensorStore } from './sensor';     // 传感器融合状态
