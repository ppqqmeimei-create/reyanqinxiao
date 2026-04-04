/**
 * auth.js — 前端 RBAC 权限工具
 * 角色体系：
 *   frontline    一线执勤人员
 *   investigator 侦查研判人员
 *   commander    指挥调度人员
 */

/** 各角色在旧 category 字段下的别名映射（兼容演示数据） */
const CATEGORY_TO_ROLE = {
  patrol:       'frontline',
  inspector:    'frontline',
  investigator: 'investigator',
  manager:      'commander',
  commander:    'commander',
  admin:        'commander',
}

/**
 * 获取当前登录用户信息
 * @returns {{ role: string, role_name: string, name: string, badgeNumber: string, ... } | null}
 */
export function getCurrentUser() {
  const info = uni.getStorageSync('user_info')
  if (!info) return null
  // 兼容旧 category 字段
  if (!info.role && info.category) {
    info.role = CATEGORY_TO_ROLE[info.category] || 'frontline'
  }
  return info
}

/**
 * 获取当前角色（字符串）
 * @returns {'frontline' | 'investigator' | 'commander' | null}
 */
export function getCurrentRole() {
  const user = getCurrentUser()
  return user?.role ?? null
}

/**
 * 权限检查：当前用户是否拥有给定权限之一
 *
 * 权限表（从低到高）：
 *   frontline    - 读任务/预警，更新自己任务进度
 *   investigator - frontline 全部 + 创建预警/任务，导出报告
 *   commander    - 全量权限（包括删除、分配、设备管理）
 *
 * @param {string | string[]} permission  权限标识（见下方 PERMISSIONS）
 * @param {string} [roleOverride]          可选：手动传入角色（测试用）
 * @returns {boolean}
 */
export function checkPermission(permission, roleOverride) {
  const role = roleOverride || getCurrentRole()
  if (!role) return false

  const perms = Array.isArray(permission) ? permission : [permission]
  return perms.some(p => ROLE_PERMISSIONS[role]?.has(p))
}

/**
 * 各角色拥有的权限集合
 * 遵循「低角色权限 ⊂ 高角色权限」原则
 */
const FRONTLINE_PERMS = new Set([
  'task:read',
  'task:start',
  'task:complete',
  'task:progress',
  'alert:read',
  'alert:resolve',
  'evidence:create',
  'device:read',
  'gis:read',
])

const INVESTIGATOR_PERMS = new Set([
  ...FRONTLINE_PERMS,
  'task:create',
  'task:update',
  'alert:create',
  'alert:update',
  'alert:ignore',
  'device:update',
  'report:export',
])

const COMMANDER_PERMS = new Set([
  ...INVESTIGATOR_PERMS,
  'task:delete',
  'task:assign',
  'alert:delete',
  'alert:assign',
  'device:create',
  'device:delete',
  'user:manage',
  'system:log',
])

const ROLE_PERMISSIONS = {
  frontline:    FRONTLINE_PERMS,
  investigator: INVESTIGATOR_PERMS,
  commander:    COMMANDER_PERMS,
}

/**
 * 根据角色决定登录后跳转目标
 *
 * tabBar 列表: GIS / Alert Center / Task / Device / Profile
 *
 * frontline    → Alert Center（最需要快速响应预警）
 * investigator → GIS（需要看全盘态势）
 * commander    → Alert Center（指挥分配，预警工作台兼顾调度）
 *
 * @param {string} role
 * @param {boolean} [isTabPage=true]  目标是否在 tabBar 中
 * @returns {{ url: string, isTab: boolean }}
 */
export function getRoleHomePage(role) {
  switch (role) {
    case 'frontline':
      return { url: '/pages/Alert Center/Alert Center', isTab: true }
    case 'investigator':
      return { url: '/pages/GIS/index', isTab: true }
    case 'commander':
      return { url: '/pages/Alert Center/Alert Center', isTab: true }
    default:
      return { url: '/pages/GIS/index', isTab: true }
  }
}

/**
 * 登录成功后统一执行跳转
 * @param {string} role
 */
export function navigateAfterLogin(role) {
  const { url, isTab } = getRoleHomePage(role)
  if (isTab) {
    uni.switchTab({ url })
  } else {
    uni.navigateTo({ url })
  }
}

/**
 * 清除登录态（登出）
 */
export function clearAuth() {
  ;['token', 'user_token', 'user_info', 'token_expiry', 'device_id',
    'login_fail_count', 'login_lock_until'].forEach(k => uni.removeStorageSync(k))
}

/**
 * 登录成功后统一存储 token + 用户信息（含 role）
 * @param {string} token
 * @param {object} userInfo  必须含 role 字段
 * @param {string} [deviceId]
 */
export function saveLoginState(token, userInfo, deviceId) {
  uni.setStorageSync('token', token)
  uni.setStorageSync('user_token', token)
  uni.setStorageSync('user_info', userInfo)
  uni.setStorageSync('token_expiry', Date.now() + 7 * 24 * 3600 * 1000)
  if (deviceId) uni.setStorageSync('device_id', deviceId)
  uni.removeStorageSync('login_fail_count')
  uni.removeStorageSync('login_lock_until')
}

/**
 * 获取基础 URL
 * @returns {string}
 */
export function getBaseURL() {
  try {
    return uni.getStorageSync('baseURL') || 'http://127.0.0.1:3000'
  } catch (e) {
    return 'http://127.0.0.1:3000'
  }
}
