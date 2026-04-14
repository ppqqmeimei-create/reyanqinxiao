/**
 * 用户界面 - 用户角色和权限配置
 * 文件: front-end/pages/Profile/utils/userConfig.js
 * 功能: 提供用户角色、权限、工作统计等配置
 */

/**
 * 用户角色配置
 */
export const userRoles = {

  enforcement: {
    key: 'enforcement-officer',
    name: '生态警务执法员',
    department: '热眼擒枭边境防控中心',
    icon: '👮',
    color: '#ef4444',
    description: '负责生态警务执法工作',
    permissions: [
      'enforcement-task',
      'enforcement-device',
      'enforcement-alert',
      'enforcement-case',
      'enforcement-evidence',
      'enforcement-record'
    ]
  }
};

/**
 * 权限配置
 */
export const permissions = {
  // 执法权限
  'enforcement-task': {
    key: 'enforcement-task',
    name: '执法任务管理',
    category: 'enforcement',
    description: '查看和管理执法任务',
    icon: '📋'
  },
  'enforcement-device': {
    key: 'enforcement-device',
    name: '执法设备管理',
    category: 'enforcement',
    description: '查看和管理执法设备',
    icon: '🔧'
  },
  'enforcement-alert': {
    key: 'enforcement-alert',
    name: '执法告警管理',
    category: 'enforcement',
    description: '查看和处理执法告警',
    icon: '🚨'
  },
  'enforcement-case': {
    key: 'enforcement-case',
    name: '案件管理',
    category: 'enforcement',
    description: '查看和管理案件',
    icon: '📁'
  },
  'enforcement-evidence': {
    key: 'enforcement-evidence',
    name: '证据管理',
    category: 'enforcement',
    description: '查看和管理证据',
    icon: '📸'
  },
  'enforcement-record': {
    key: 'enforcement-record',
    name: '执法记录',
    category: 'enforcement',
    description: '查看和管理执法记录',
    icon: '📝'
  }
};

/**
 * 勋章配置
 */
export const medals = {
  'excellent-inspector': {
    key: 'excellent-inspector',
    name: '优秀检查员',
    icon: '🏆',
    description: '完成100次检查任务',
    color: '#fbbf24'
  },
  'eco-guardian': {
    key: 'eco-guardian',
    name: '生态守护者',
    icon: '🌍',
    description: '生态巡查工作表现突出',
    color: '#10b981'
  },
  'enforcement-hero': {
    key: 'enforcement-hero',
    name: '执法英雄',
    icon: '👮',
    description: '执法工作表现突出',
    color: '#ef4444'
  },
	'border-guard': {
    key: 'border-guard',
    name: '镇守边关·广西生态卫士',
    icon: '🏯',
    description: '长期驻守广西中越边境，表现突出',
    color: '#00d4ff'
  },
};

/**
 * 获取用户角色
 */
export function getUserRole(category) {
  return userRoles[category] || null;
}

/**
 * 获取权限信息
 */
export function getPermission(permissionKey) {
  return permissions[permissionKey] || null;
}

/**
 * 获取勋章信息
 */
export function getMedal(medalKey) {
  return medals[medalKey] || null;
}

/**
 * 获取分类下的所有权限
 */
export function getCategoryPermissions(category) {
  return Object.values(permissions).filter(p => p.category === category);
}

/**
 * 检查用户是否有权限
 */
export function hasPermission(userPermissions, permissionKey) {
  return userPermissions && userPermissions.includes(permissionKey);
}

/**
 * 获取所有角色
 */
export function getAllRoles() {
  return Object.values(userRoles);
}

/**
 * 获取所有权限
 */
export function getAllPermissions() {
  return Object.values(permissions);
}

/**
 * 获取所有勋章
 */
export function getAllMedals() {
  return Object.values(medals);
}

/**
 * 格式化用户信息
 */
export function formatUserInfo(user) {
  const role = getUserRole(user.category);
  
  return {
    ...user,
    roleName: role?.name || '未知',
    roleIcon: role?.icon || '❓',
    roleColor: role?.color || '#6b7280',
    department: role?.department || user.department,
    permissions: role?.permissions || []
  };
}

/**
 * 获取工作统计的显示信息
 */
export function formatWorkStats(stats) {
  return {
    totalTasks: stats.total_tasks || 0,
    totalAlerts: stats.total_alerts || 0,
    totalDistance: (stats.total_distance || 0).toFixed(1),
    totalHours: (stats.total_hours || 0).toFixed(1),
    workDays: stats.work_days || 0,
    avgTasksPerDay: (stats.avg_tasks_per_day || 0).toFixed(1),
    avgHoursPerDay: (stats.avg_hours_per_day || 0).toFixed(1)
  };
}

/**
 * 获取执勤状态的显示信息
 */
export function formatDutyStatus(status) {
  return {
    onDuty: status.on_duty || false,
    lastDutyStart: status.last_duty_start ? new Date(status.last_duty_start) : null,
    lastDutyEnd: status.last_duty_end ? new Date(status.last_duty_end) : null,
    totalDutyHours: (status.total_duty_hours || 0).toFixed(1),
    currentLocation: status.current_duty_location || '未知'
  };
}

/**
 * 获取用户的勋章列表
 */
export function getUserMedals(earnedMedalKeys) {
  return earnedMedalKeys.map(key => getMedal(key)).filter(m => m !== null);
}

/**
 * 计算用户等级
 */
export function calculateUserLevel(stats) {
  const totalTasks = stats.total_tasks || 0;
  
  if (totalTasks >= 500) return { level: 5, name: '五星检查员', icon: '⭐⭐⭐⭐⭐' };
  if (totalTasks >= 400) return { level: 4, name: '四星检查员', icon: '⭐⭐⭐⭐' };
  if (totalTasks >= 300) return { level: 3, name: '三星检查员', icon: '⭐⭐⭐' };
  if (totalTasks >= 200) return { level: 2, name: '二星检查员', icon: '⭐⭐' };
  if (totalTasks >= 100) return { level: 1, name: '一星检查员', icon: '⭐' };
  return { level: 0, name: '见习检查员', icon: '🌱' };
}

/**
 * 获取用户的工作统计摘要
 */
export function getWorkStatsSummary(stats) {
  const level = calculateUserLevel(stats);
  
  return {
    level,
    totalTasks: stats.total_tasks || 0,
    totalAlerts: stats.total_alerts || 0,
    totalDistance: (stats.total_distance || 0).toFixed(1),
    totalHours: (stats.total_hours || 0).toFixed(1),
    workDays: stats.work_days || 0,
    efficiency: stats.work_days > 0 ? (stats.total_tasks / stats.work_days).toFixed(1) : 0
  };
}

export default {
  userRoles,
  permissions,
  medals,
  getUserRole,
  getPermission,
  getMedal,
  getCategoryPermissions,
  hasPermission,
  getAllRoles,
  getAllPermissions,
  getAllMedals,
  formatUserInfo,
  formatWorkStats,
  formatDutyStatus,
  getUserMedals,
  calculateUserLevel,
  getWorkStatsSummary
};
