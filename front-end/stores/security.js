/**
 * ==========================================
 * Security Store - 安全与合规状态
 * ==========================================
 * 操作审计、数据分级、安全策略
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BUSINESS_CONSTANTS } from '../utils/systemConfig.js';

export const useSecurityStore = defineStore('security', () => {
  // ===== 当前用户安全状态 =====
  const currentUser = ref(null);
  const sessionToken = ref(null);
  const sessionExpiry = ref(null);

  // ===== 敏感操作记录 =====
  const sensitiveOperations = ref([]);

  // ===== 登录历史 =====
  const loginHistory = ref([]);

  // ===== 设备绑定 =====
  const deviceBindings = ref([]);

  // ===== 权限变更记录 =====
  const permissionChanges = ref([]);

  // ===== 安全告警 =====
  const securityAlerts = ref([]);

  // ===== 计算属性 =====
  const isSessionValid = computed(() => {
    if (!sessionExpiry.value) return false;
    return new Date(sessionExpiry.value) > new Date();
  });

  const recentAlerts = computed(() =>
    securityAlerts.value.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH')
  );

  // ===== Actions =====
  function setSession(user, token, expiryTime = 24 * 60 * 60 * 1000) {
    currentUser.value = user;
    sessionToken.value = token;
    sessionExpiry.value = new Date(Date.now() + expiryTime).toISOString();
    uni.setStorageSync('session_token', token);
    uni.setStorageSync('session_expiry', sessionExpiry.value);
    _addSecurityLog('SESSION_START', `用户 ${user.name} 登录会话开始`);
  }

  function clearSession() {
    _addSecurityLog('SESSION_END', `用户 ${currentUser.value?.name} 登出`);
    currentUser.value = null;
    sessionToken.value = null;
    sessionExpiry.value = null;
    uni.removeStorageSync('session_token');
    uni.removeStorageSync('session_expiry');
  }

  function extendSession(extraTime = 24 * 60 * 60 * 1000) {
    if (sessionExpiry.value) {
      sessionExpiry.value = new Date(
        new Date(sessionExpiry.value).getTime() + extraTime
      ).toISOString();
      uni.setStorageSync('session_expiry', sessionExpiry.value);
    }
  }

  // ===== 敏感操作记录 =====
  function recordSensitiveOperation(operation) {
    sensitiveOperations.value.unshift({
      id: `SEC-${Date.now()}`,
      ...operation,
      operator: currentUser.value?.name || 'system',
      operatorRole: currentUser.value?.role || 'unknown',
      timestamp: new Date().toISOString(),
      deviceInfo: uni.getSystemInfoSync() || {},
      ipAddress: '127.0.0.1',
    });

    // 持久化
    uni.setStorageSync('sensitive_operations', sensitiveOperations.value.slice(0, 500));

    // 超过阈值告警
    const recentCount = sensitiveOperations.value.filter(
      op => op.operator === currentUser.value?.name &&
      new Date(op.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    ).length;

    if (recentCount > 50) {
      addSecurityAlert({
        type: 'OPERATION_THRESHOLD',
        severity: 'HIGH',
        message: `用户 ${currentUser.value?.name} 1小时内执行了${recentCount}次敏感操作`,
        relatedOperations: recentCount,
      });
    }
  }

  // ===== 登录历史 =====
  function addLoginRecord(success, method = 'password', metadata = {}) {
    loginHistory.value.unshift({
      id: `LOGIN-${Date.now()}`,
      userId: currentUser.value?.id,
      userName: currentUser.value?.name,
      success,
      method,
      timestamp: new Date().toISOString(),
      ipAddress: metadata.ipAddress || '127.0.0.1',
      deviceId: metadata.deviceId || 'unknown',
      location: metadata.location || 'unknown',
      userAgent: metadata.userAgent || 'unknown',
    });
    uni.setStorageSync('login_history', loginHistory.value.slice(0, 100));
  }

  // ===== 设备绑定 =====
  function addDeviceBinding(deviceInfo) {
    deviceBindings.value.push({
      id: `DEV-${Date.now()}`,
      ...deviceInfo,
      boundAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      isTrusted: false,
    });
  }

  function verifyDevice(deviceId) {
    const idx = deviceBindings.value.findIndex(d => d.id === deviceId);
    if (idx !== -1) {
      deviceBindings.value[idx].isTrusted = true;
      deviceBindings.value[idx].verifiedAt = new Date().toISOString();
      _addSecurityLog('DEVICE_VERIFY', `设备 ${deviceId} 验证通过`);
    }
  }

  function revokeDevice(deviceId) {
    const idx = deviceBindings.value.findIndex(d => d.id === deviceId);
    if (idx !== -1) {
      deviceBindings.value.splice(idx, 1);
      _addSecurityLog('DEVICE_REVOKE', `设备 ${deviceId} 已解绑`);
    }
  }

  // ===== 安全告警 =====
  function addSecurityAlert(alert) {
    securityAlerts.value.unshift({
      id: `ALERT-${Date.now()}`,
      ...alert,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });

    // 严重告警震动提示
    if (alert.severity === 'CRITICAL') {
      uni.vibrateLong && uni.vibrateLong();
    }

    uni.setStorageSync('security_alerts', securityAlerts.value.slice(0, 200));
  }

  function acknowledgeAlert(alertId) {
    const idx = securityAlerts.value.findIndex(a => a.id === alertId);
    if (idx !== -1) {
      securityAlerts.value[idx].acknowledged = true;
      securityAlerts.value[idx].acknowledgedAt = new Date().toISOString();
      securityAlerts.value[idx].acknowledgedBy = currentUser.value?.name;
    }
  }

  // ===== 权限变更 =====
  function recordPermissionChange(userId, changes) {
    permissionChanges.value.unshift({
      id: `PERM-${Date.now()}`,
      userId,
      changes,
      changedBy: currentUser.value?.name,
      timestamp: new Date().toISOString(),
    });
    _addSecurityLog('PERMISSION_CHANGE', `用户 ${userId} 权限变更`);
  }

  // ===== 紧急数据销毁 =====
  async function emergencyDataDestroy(options = {}) {
    const {
      destroyEvidence = true,
      destroyTasks = false,
      destroyAlerts = false,
      destroyLogs = false,
      reason = '紧急销毁',
    } = options;

    _addSecurityLog('EMERGENCY_DESTROY', reason, {
      destroyEvidence,
      destroyTasks,
      destroyAlerts,
      destroyLogs,
    });

    if (destroyEvidence) {
      uni.removeStorageSync('evidence_sync_queue');
      uni.removeStorageSync('pending_evidence_queue');
    }
    if (destroyTasks) {
      uni.removeStorageSync('offline_task_queue');
    }
    if (destroyAlerts) {
      uni.removeStorageSync('offline_alert_queue');
    }
    if (destroyLogs) {
      uni.removeStorageSync('evidence_audit_logs');
    }

    // 震动反馈
    uni.vibratePattern && uni.vibratePattern([100, 50, 100, 50, 300]);

    // 清除会话
    clearSession();

    return true;
  }

  // ===== 导出安全报告 =====
  function generateSecurityReport(dateRange = null) {
    const logs = [...sensitiveOperations.value];
    const alerts = [...securityAlerts.value];
    const history = [...loginHistory.value];

    return {
      reportId: `SEC-RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      period: dateRange || 'ALL',
      summary: {
        totalSensitiveOps: logs.length,
        totalAlerts: alerts.length,
        totalLogins: history.length,
        criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
        failedLogins: history.filter(h => !h.success).length,
      },
      sensitiveOperations: logs.slice(0, 100),
      securityAlerts: alerts.slice(0, 100),
      loginHistory: history.slice(0, 100),
      permissionChanges: permissionChanges.value.slice(0, 50),
    };
  }

  // ===== 内部审计日志 =====
  function _addSecurityLog(action, description, metadata = {}) {
    const log = {
      action,
      description,
      operator: currentUser.value?.name || 'system',
      timestamp: new Date().toISOString(),
      metadata,
    };
    uni.getLogManager && uni.getLogManager().warn(`[SECURITY] ${action}: ${description}`);
  }

  // ===== 初始化 =====
  function init() {
    // 恢复会话
    const savedToken = uni.getStorageSync('session_token');
    const savedExpiry = uni.getStorageSync('session_expiry');
    if (savedToken && savedExpiry && new Date(savedExpiry) > new Date()) {
      sessionToken.value = savedToken;
      sessionExpiry.value = savedExpiry;
    }

    // 恢复历史记录
    const savedOps = uni.getStorageSync('sensitive_operations');
    if (Array.isArray(savedOps)) sensitiveOperations.value = savedOps;

    const savedHistory = uni.getStorageSync('login_history');
    if (Array.isArray(savedHistory)) loginHistory.value = savedHistory;

    const savedAlerts = uni.getStorageSync('security_alerts');
    if (Array.isArray(savedAlerts)) securityAlerts.value = savedAlerts;
  }

  return {
    // 状态
    currentUser,
    sessionToken,
    sessionExpiry,
    sensitiveOperations,
    loginHistory,
    deviceBindings,
    permissionChanges,
    securityAlerts,

    // 计算属性
    isSessionValid,
    recentAlerts,

    // Actions
    setSession,
    clearSession,
    extendSession,
    recordSensitiveOperation,
    addLoginRecord,
    addDeviceBinding,
    verifyDevice,
    revokeDevice,
    addSecurityAlert,
    acknowledgeAlert,
    recordPermissionChange,
    emergencyDataDestroy,
    generateSecurityReport,
    init,
  };
});
