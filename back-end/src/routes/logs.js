import express from 'express'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

/**
 * @route GET /api/v1/logs
 * @desc 获取系统日志列表
 * @access 需要认证 (admin, commander)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // 检查权限
    const allowedRoles = ['admin', 'commander']
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '没有查看日志权限'
      })
    }

    const { page = 1, limit = 50, level, action, operator, start_date, end_date } = req.query

    // 模拟日志数据
    const logs = [
      { id: 1, timestamp: '2026-04-04 10:30:25', level: 'info', action: '系统配置', operator: '张伟', ip: '192.168.1.100', detail: '修改了预警置信度阈值: 85→88' },
      { id: 2, timestamp: '2026-04-04 09:15:42', level: 'info', action: '用户管理', operator: '李娜', ip: '192.168.1.101', detail: '新增用户: 刘洋 (警号GX-005)' },
      { id: 3, timestamp: '2026-04-04 08:45:18', level: 'warn', action: '设备管理', operator: '系统', ip: '127.0.0.1', detail: '设备GX-CAM-201心跳超时，已标记离线' },
      { id: 4, timestamp: '2026-04-04 08:30:00', level: 'info', action: '权限变更', operator: '王强', ip: '192.168.1.102', detail: '分配预警#1给张伟处理' },
      { id: 5, timestamp: '2026-04-03 18:00:15', level: 'info', action: '任务管理', operator: '陈静', ip: '192.168.1.103', detail: '完成任务: 龙州水口定点检查' },
      { id: 6, timestamp: '2026-04-03 17:30:00', level: 'error', action: '系统错误', operator: '系统', ip: '127.0.0.1', detail: '数据库连接超时，已自动重连' },
      { id: 7, timestamp: '2026-04-03 16:45:00', level: 'info', action: '取证上传', operator: '刘洋', ip: '192.168.1.104', detail: '上传取证记录: EV-A3F2C1D9-103456' },
      { id: 8, timestamp: '2026-04-03 15:30:00', level: 'warn', action: '安全警告', operator: '系统', ip: '192.168.1.200', detail: '检测到异常登录尝试: 连续失败3次' }
    ]

    let filtered = [...logs]

    // 按级别筛选
    if (level) {
      filtered = filtered.filter(l => l.level === level)
    }

    // 按操作类型筛选
    if (action) {
      filtered = filtered.filter(l => l.action.includes(action))
    }

    // 按操作人筛选
    if (operator) {
      filtered = filtered.filter(l => l.operator.includes(operator))
    }

    // 按日期范围筛选
    if (start_date) {
      filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(start_date))
    }
    if (end_date) {
      filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(end_date))
    }

    // 分页
    const total = filtered.length
    const startIndex = (page - 1) * limit
    const items = filtered.slice(startIndex, startIndex + parseInt(limit))

    res.json({
      success: true,
      data: {
        items,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取日志失败:', error)
    res.status(500).json({
      success: false,
      message: '获取日志失败'
    })
  }
})

/**
 * @route GET /api/v1/logs/stats
 * @desc 获取日志统计
 * @access 需要认证 (admin, commander)
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    // 检查权限
    const allowedRoles = ['admin', 'commander']
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '没有查看日志权限'
      })
    }

    const stats = {
      total: 1256,
      today: 45,
      by_level: {
        info: 980,
        warn: 220,
        error: 56
      },
      by_action: {
        '系统配置': 156,
        '用户管理': 89,
        '设备管理': 234,
        '权限变更': 45,
        '任务管理': 312,
        '取证上传': 267,
        '系统错误': 56,
        '安全警告': 97
      }
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('获取日志统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取日志统计失败'
    })
  }
})

/**
 * @route POST /api/v1/logs
 * @desc 记录操作日志
 * @access 自动记录
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { level, action, detail } = req.body

    const log = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      level: level || 'info',
      action: action || '未知操作',
      operator: req.user.name || '未知',
      operator_id: req.user.id || '未知',
      ip: req.ip || '未知',
      detail: detail || ''
    }

    // 实际应该写入数据库
    console.log('[LOG]', JSON.stringify(log))

    res.status(201).json({
      success: true,
      message: '日志记录成功'
    })
  } catch (error) {
    console.error('记录日志失败:', error)
    res.status(500).json({
      success: false,
      message: '记录日志失败'
    })
  }
})

export default router
