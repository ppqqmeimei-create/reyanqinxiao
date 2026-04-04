/**
 * permission.js — 基于角色的权限校验工具
 * 角色体系：
 *   frontline    一线执勤人员
 *   investigator 侦查研判人员
 *   commander    指挥调度人员（最高权限）
 */

const CATEGORY_TO_ROLE = {
  patrol:       'frontline',
  inspector:    'frontline',
  investigator: 'investigator',
  manager:      'commander',
  commander:    'commander',
  admin:        'commander',
}

/**
 * 读取本地缓存中的当前角色
 * @returns {'frontline' | 'investigator' | 'commander' | ''}
 */
export function getCurrentUserRole() {
  try {
    const info = uni.getStorageSync('user_info')
    if (info && info.role) return info.role
    if (info && info.category) return CATEGORY_TO_ROLE[info.category] || 'frontline'
    return uni.getStorageSync('userRole') || ''
  } catch (e) {
    return ''
  }
}

/**
 * 权限校验：当前用户是否属于允许的角色之一
 * @param {string[]} allowedRoles - 允许访问的角色数组，如 ['commander', 'investigator']
 * @returns {boolean}
 *
 * @example
 * // template 中: v-if="checkRole(['investigator', 'commander'])"
 * // script 中:   const canDispatch = computed(() => checkRole(['commander']))
 */
export function checkRole(allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  const role = getCurrentUserRole()
  if (!role) return false
  return allowedRoles.includes(role)
}

/**
 * 响应式权限 ref：配合 onShow 自动刷新
 * @param {string[]} allowedRoles
 * @returns {import('vue').Ref<boolean>}
 *
 * @example
 * const canDispatch = useRolePermission(['commander'])
 * // template: v-if="canDispatch"
 */
export function useRolePermission(allowedRoles) {
  const { ref } = require('vue')
  const hasPermission = ref(checkRole(allowedRoles))
  try {
    const { onShow } = require('@dcloudio/uni-app')
    onShow(() => { hasPermission.value = checkRole(allowedRoles) })
  } catch (e) {}
  return hasPermission
}

/**
 * 获取用户权限集合
 * @returns {Set<string>}
 */
export function getUserPermissions() {
  const role = getCurrentUserRole()
  const permMap = {
    frontline: new Set([
      'task:read', 'task:start', 'task:complete', 'task:progress',
      'alert:read', 'alert:resolve',
      'evidence:create', 'device:read', 'gis:read',
    ]),
    investigator: new Set([
      'task:read', 'task:start', 'task:complete', 'task:progress', 'task:create', 'task:update',
      'alert:read', 'alert:resolve', 'alert:create', 'alert:update', 'alert:ignore',
      'evidence:create', 'device:read', 'device:update', 'gis:read', 'report:export',
    ]),
    commander: new Set([
      'task:read', 'task:start', 'task:complete', 'task:progress', 'task:create',
      'task:update', 'task:delete', 'task:assign',
      'alert:read', 'alert:resolve', 'alert:create', 'alert:update', 'alert:ignore',
      'alert:delete', 'alert:assign',
      'evidence:create', 'device:read', 'device:update', 'device:create', 'device:delete',
      'gis:read', 'user:manage', 'system:log', 'report:export',
    ]),
  }
  return permMap[role] || new Set()
}

/**
 * 检查是否有指定权限
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(permission) {
  const perms = getUserPermissions()
  return perms.has(permission)
}
