import jwt from 'jsonwebtoken'

/**
 * JWT 认证中间件
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const queryToken = req.query?.token

    if ((!authHeader || !authHeader.startsWith('Bearer ')) && !queryToken) {
      return res.status(401).json({
        success: false,
        message: '缺少认证令牌'
      })
    }

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : queryToken

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret-key'
    )

    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期'
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的令牌'
      })
    }

    res.status(401).json({
      success: false,
      message: '认证失败',
      error: error.message
    })
  }
}

/**
 * 角色检查中间件
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '没有权限访问此资源'
      })
    }

    next()
  }
}

/**
 * 权限检查中间件工厂
 * @param {string} permission - 所需的权限标识
 * @returns {Function} Express中间件
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证'
      })
    }

    // 获取用户权限列表
    const userPermissions = req.user.permissions || []

    // 检查是否拥有所需权限
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `缺少权限: ${permission}`
      })
    }

    next()
  }
}

/**
 * 权限表定义
 */
export const PERMISSIONS = {
  // 用户管理权限
  'user:manage': ['admin'],
  'user:read': ['admin', 'commander'],
  'user:create': ['admin', 'commander'],
  'user:update': ['admin', 'commander'],
  'user:delete': ['admin'],

  // 预警管理权限
  'alert:read': ['admin', 'commander', 'investigator', 'frontline'],
  'alert:create': ['admin', 'commander', 'investigator'],
  'alert:update': ['admin', 'commander', 'investigator'],
  'alert:delete': ['admin', 'commander'],
  'alert:assign': ['admin', 'commander'],
  'alert:resolve': ['admin', 'commander', 'investigator', 'frontline'],
  'alert:ignore': ['admin', 'commander', 'investigator'],

  // 任务管理权限
  'task:read': ['admin', 'commander', 'investigator', 'frontline'],
  'task:create': ['admin', 'commander', 'investigator'],
  'task:update': ['admin', 'commander', 'investigator'],
  'task:delete': ['admin', 'commander'],
  'task:assign': ['admin', 'commander'],
  'task:progress': ['admin', 'commander', 'investigator', 'frontline'],

  // 设备管理权限
  'device:read': ['admin', 'commander', 'investigator', 'frontline'],
  'device:create': ['admin', 'commander'],
  'device:update': ['admin', 'commander', 'investigator'],
  'device:delete': ['admin', 'commander'],
  'device:sensitivity': ['admin', 'commander'],

  // 取证管理权限
  'evidence:read': ['admin', 'commander', 'investigator', 'frontline'],
  'evidence:upload': ['admin', 'commander', 'investigator', 'frontline'],
  'evidence:verify': ['admin', 'commander', 'investigator'],

  // 统计分析权限
  'stats:read': ['admin', 'commander', 'investigator', 'frontline'],
  'stats:export': ['admin', 'commander', 'investigator'],

  // 系统管理权限
  'system:log': ['admin', 'commander'],
  'system:config': ['admin']
}

/**
 * 角色权限映射
 */
export const ROLE_PERMISSIONS = {
  admin: new Set([
    'user:manage', 'user:read', 'user:create', 'user:update', 'user:delete',
    'alert:read', 'alert:create', 'alert:update', 'alert:delete', 'alert:assign', 'alert:resolve', 'alert:ignore',
    'task:read', 'task:create', 'task:update', 'task:delete', 'task:assign', 'task:progress',
    'device:read', 'device:create', 'device:update', 'device:delete', 'device:sensitivity',
    'evidence:read', 'evidence:upload', 'evidence:verify',
    'stats:read', 'stats:export',
    'system:log', 'system:config'
  ]),
  commander: new Set([
    'alert:read', 'alert:create', 'alert:update', 'alert:delete', 'alert:assign', 'alert:resolve', 'alert:ignore',
    'task:read', 'task:create', 'task:update', 'task:delete', 'task:assign', 'task:progress',
    'device:read', 'device:create', 'device:update', 'device:delete', 'device:sensitivity',
    'evidence:read', 'evidence:upload', 'evidence:verify',
    'stats:read', 'stats:export',
    'system:log'
  ]),
  investigator: new Set([
    'alert:read', 'alert:create', 'alert:update', 'alert:ignore', 'alert:resolve',
    'task:read', 'task:create', 'task:update', 'task:progress',
    'device:read', 'device:update',
    'evidence:read', 'evidence:upload', 'evidence:verify',
    'stats:read', 'stats:export'
  ]),
  frontline: new Set([
    'alert:read', 'alert:resolve',
    'task:read', 'task:progress',
    'device:read',
    'evidence:read', 'evidence:upload',
    'stats:read'
  ])
}

/**
 * 获取用户的所有权限
 * @param {string} role - 用户角色
 * @returns {Set} 权限集合
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || new Set()
}

/**
 * 检查用户是否拥有特定权限
 * @param {string} role - 用户角色
 * @param {string} permission - 权限标识
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const perms = getRolePermissions(role)
  return perms.has(permission)
}

/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret-key'
      )
      req.user = decoded
    }
  } catch (error) {
    // 忽略错误，继续处理
  }
  next()
}

/**
 * 生成 JWT Token
 * @param {object} payload - Token载荷
 * @returns {string} JWT Token
 */
export function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

/**
 * 验证并解码 Token
 * @param {string} token - JWT Token
 * @returns {object} 解码后的payload
 */
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret-key')
}
