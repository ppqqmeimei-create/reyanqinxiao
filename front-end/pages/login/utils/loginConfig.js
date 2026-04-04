/**
 * 登录页面 - 用户维度和生物识别配置
 * 文件: front-end/pages/login/utils/loginConfig.js
 * 功能: 提供用户维度、生物识别、登录方式等配置
 */

/**
 * 用户维度配置
 */
export const userCategories = [
  {
    value: 'ecology',
    label: '生态巡查员',
    icon: '🌍',
    color: '#10b981',
    department: '广西环食药侦查总队',
    description: '负责生态资源与走私巡查工作'
  },
  {
    value: 'fooddrug',
    label: '食品药品检查员',
    icon: '🏥',
    color: '#f59e0b',
    department: '广西环食药侦查总队',
    description: '负责食品药品检查工作'
  },
  {
    value: 'enforcement',
    label: '生态警务执法员',
    icon: '👮',
    color: '#ef4444',
    department: '广西环食药侦查总队',
    description: '负责生态警务执法工作'
  }
];

/**
 * 生物识别方式配置
 */
export const biometricMethods = [
  {
    key: 'fingerprint',
    name: '指纹识别',
    icon: '👆',
    description: '使用指纹进行身份验证',
    supported: true
  },
  {
    key: 'face',
    name: '人脸识别',
    icon: '😊',
    description: '使用人脸进行身份验证',
    supported: true
  },
  {
    key: 'iris',
    name: '虹膜识别',
    icon: '👁️',
    description: '使用虹膜进行身份验证',
    supported: false
  }
];

/**
 * 登录方式配置
 */
export const loginMethods = [
  {
    key: 'password',
    name: '密码登录',
    icon: '🔐',
    description: '使用警号和密码登录'
  },
  {
    key: 'biometric',
    name: '生物识别',
    icon: '🔒',
    description: '使用生物识别登录'
  },
  {
    key: 'offline',
    name: '离线登录',
    icon: '📡',
    description: '使用本地凭证登录'
  }
];

/**
 * 登录失败原因配置
 */
export const loginFailureReasons = {
  'invalid-credentials': '警号或密码错误',
  'account-locked': '账户已被锁定',
  'account-disabled': '账户已被禁用',
  'biometric-mismatch': '生物识别不匹配',
  'network-error': '网络连接失败',
  'server-error': '服务器错误',
  'invalid-category': '无效的用户分类',
  'unknown': '未知错误'
};

/**
 * 获取用户分类信息
 */
export function getUserCategory(categoryValue) {
  return userCategories.find(c => c.value === categoryValue) || null;
}

/**
 * 获取生物识别方式信息
 */
export function getBiometricMethod(methodKey) {
  return biometricMethods.find(m => m.key === methodKey) || null;
}

/**
 * 获取登录方式信息
 */
export function getLoginMethod(methodKey) {
  return loginMethods.find(m => m.key === methodKey) || null;
}

/**
 * 获取失败原因描述
 */
export function getFailureReason(reasonKey) {
  return loginFailureReasons[reasonKey] || loginFailureReasons['unknown'];
}

/**
 * 验证警号格式
 */
export function validateBadgeNumber(badge) {
  // 警号格式: 3-10位字母数字组合
  const badgeRegex = /^[A-Z0-9]{3,10}$/i;
  return badgeRegex.test(badge);
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password) {
  if (password.length < 6) return { valid: false, level: 'weak', message: '密码至少6位' };
  if (password.length < 8) return { valid: true, level: 'medium', message: '密码强度中等' };
  if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
    return { valid: true, level: 'strong', message: '密码强度强' };
  }
  return { valid: true, level: 'medium', message: '密码强度中等' };
}

/**
 * 格式化登录日志
 */
export function formatLoginLog(log) {
  return {
    id: log.id,
    username: log.username,
    category: log.category,
    categoryName: getUserCategory(log.category)?.label || '未知',
    loginTime: new Date(log.login_time),
    ipAddress: log.ip_address,
    deviceInfo: log.device_info,
    loginMethod: log.login_method,
    methodName: getLoginMethod(log.login_method)?.name || '未知',
    success: log.success,
    failureReason: log.failure_reason ? getFailureReason(log.failure_reason) : null
  };
}

/**
 * 获取登录状态描述
 */
export function getLoginStatusDescription(success, failureReason) {
  if (success) return '登录成功';
  return getFailureReason(failureReason);
}

/**
 * 检查是否支持生物识别
 */
export function isBiometricSupported(methodKey) {
  const method = getBiometricMethod(methodKey);
  return method ? method.supported : false;
}

/**
 * 获取所有支持的生物识别方式
 */
export function getSupportedBiometricMethods() {
  return biometricMethods.filter(m => m.supported);
}

/**
 * 生成设备ID
 */
export function generateDeviceId() {
  return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 获取设备信息
 */
export function getDeviceInfo() {
  // 这里需要根据实际环境获取设备信息
  return {
    userAgent: navigator.userAgent || 'Unknown',
    platform: navigator.platform || 'Unknown',
    language: navigator.language || 'Unknown',
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

/**
 * 格式化设备信息为字符串
 */
export function formatDeviceInfo(deviceInfo) {
  return `${deviceInfo.platform} | ${deviceInfo.language} | ${deviceInfo.screenResolution}`;
}

/**
 * 计算登录失败锁定时间
 */
export function calculateLockDuration(failureCount, maxAttempts = 5) {
  if (failureCount < maxAttempts) return 0;
  // 锁定时间: 60秒 * (失败次数 - 最大尝试次数)
  return 60 * (failureCount - maxAttempts + 1);
}

/**
 * 验证登录表单
 */
export function validateLoginForm(badgeNumber, password, category) {
  const errors = {};

  if (!badgeNumber || badgeNumber.trim() === '') {
    errors.badge = '请输入警号或用户名';
  } else if (!validateBadgeNumber(badgeNumber)) {
    errors.badge = '警号格式不正确';
  }

  if (!password || password === '') {
    errors.password = '请输入密码';
  } else if (password.length < 6) {
    errors.password = '密码至少6位';
  }

  if (!category) {
    errors.category = '请选择用户分类';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 保存登录状态
 */
export function saveLoginState(token, userInfo, deviceId) {
  uni.setStorageSync('token', token);
  uni.setStorageSync('user_token', token);
  uni.setStorageSync('user_info', userInfo);
  uni.setStorageSync('device_id', deviceId);
  uni.setStorageSync('token_expiry', Date.now() + 7 * 24 * 3600 * 1000);
}

/**
 * 清除登录状态
 */
export function clearLoginState() {
  uni.removeStorageSync('token');
  uni.removeStorageSync('user_token');
  uni.removeStorageSync('user_info');
  uni.removeStorageSync('device_id');
  uni.removeStorageSync('token_expiry');
  uni.removeStorageSync('login_fail_count');
  uni.removeStorageSync('login_lock_until');
}

/**
 * 获取保存的登录状态
 */
export function getLoginState() {
  return {
    token: uni.getStorageSync('token'),
    userInfo: uni.getStorageSync('user_info'),
    deviceId: uni.getStorageSync('device_id'),
    tokenExpiry: uni.getStorageSync('token_expiry')
  };
}

/**
 * 检查Token是否过期
 */
export function isTokenExpired() {
  const expiry = uni.getStorageSync('token_expiry');
  if (!expiry) return true;
  return Date.now() > expiry;
}

export default {
  userCategories,
  biometricMethods,
  loginMethods,
  loginFailureReasons,
  getUserCategory,
  getBiometricMethod,
  getLoginMethod,
  getFailureReason,
  validateBadgeNumber,
  validatePasswordStrength,
  formatLoginLog,
  getLoginStatusDescription,
  isBiometricSupported,
  getSupportedBiometricMethods,
  generateDeviceId,
  getDeviceInfo,
  formatDeviceInfo,
  calculateLockDuration,
  validateLoginForm,
  saveLoginState,
  clearLoginState,
  getLoginState,
  isTokenExpired
};
