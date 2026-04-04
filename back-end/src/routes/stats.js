import express from 'express'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

/**
 * @route GET /api/v1/stats/dashboard
 * @desc 获取仪表盘统计数据
 * @access 需要认证
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    // 模拟数据（实际应从数据库查询）
    const stats = {
      alerts: {
        total: 156,
        critical: 12,
        warning: 43,
        pending: 89,
        resolved_today: 23
      },
      tasks: {
        total: 78,
        in_progress: 23,
        completed: 45,
        pending: 10
      },
      devices: {
        total: 87,
        online: 72,
        warning: 10,
        offline: 5,
        online_rate: 83
      },
      evidence: {
        total: 234,
        synced: 216,
        pending: 18,
        verified_today: 45
      },
      hotspots: {
        total: 15,
        critical: 5,
        warning: 8,
        inactive: 2
      },
      performance: {
        avg_response_time: 12.5,
        resolution_rate: 87,
        satisfaction: 94
      }
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取仪表盘数据失败'
    })
  }
})

/**
 * @route GET /api/v1/stats/trend
 * @desc 获取趋势数据
 * @access 需要认证
 */
router.get('/trend', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query
    const trendData = []
    const now = new Date()

    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      trendData.push({
        date: date.toISOString().split('T')[0],
        smuggling: Math.floor(Math.random() * 20) + 10,
        ecology: Math.floor(Math.random() * 15) + 5,
        fooddrug: Math.floor(Math.random() * 10) + 3,
        tasks_completed: Math.floor(Math.random() * 15) + 5,
        evidence_uploaded: Math.floor(Math.random() * 30) + 10
      })
    }

    res.json({
      success: true,
      data: trendData
    })
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取趋势数据失败'
    })
  }
})

/**
 * @route GET /api/v1/stats/species
 * @desc 物种分析统计
 * @access 需要认证
 */
router.get('/species', authenticate, async (req, res) => {
  try {
    // 模拟物种统计数据
    const speciesData = [
      { name: '穿山甲', count: 35, percentage: 35, protection_level: '国家一级', trend: 'up' },
      { name: '食蟹猴', count: 28, percentage: 28, protection_level: 'CITES附录II', trend: 'stable' },
      { name: '海龟', count: 15, percentage: 15, protection_level: '国家一级', trend: 'down' },
      { name: '象牙制品', count: 12, percentage: 12, protection_level: '全面禁止', trend: 'down' },
      { name: '巨蜥', count: 8, percentage: 8, protection_level: '国家一级', trend: 'stable' },
      { name: '其他', count: 2, percentage: 2, protection_level: '各类', trend: 'stable' }
    ]

    res.json({
      success: true,
      data: speciesData
    })
  } catch (error) {
    console.error('获取物种分析失败:', error)
    res.status(500).json({
      success: false,
      message: '获取物种分析失败'
    })
  }
})

/**
 * @route GET /api/v1/stats/performance
 * @desc 人员绩效统计
 * @access 需要认证
 */
router.get('/performance', authenticate, async (req, res) => {
  try {
    const { start_date, end_date, department } = req.query

    // 模拟人员绩效数据
    const performanceData = [
      { user_id: 1, name: '张伟', department: '崇左支队', completed_tasks: 45, resolved_alerts: 38, evidence_count: 56, avg_response_time: 8.5, score: 98, rank: 1 },
      { user_id: 2, name: '李娜', department: '崇左支队', completed_tasks: 42, resolved_alerts: 35, evidence_count: 48, avg_response_time: 9.2, score: 95, rank: 2 },
      { user_id: 3, name: '王强', department: '防城港支队', completed_tasks: 38, resolved_alerts: 32, evidence_count: 41, avg_response_time: 10.1, score: 92, rank: 3 },
      { user_id: 4, name: '刘洋', department: '防城港支队', completed_tasks: 35, resolved_alerts: 30, evidence_count: 38, avg_response_time: 11.3, score: 90, rank: 4 },
      { user_id: 5, name: '陈静', department: '百色支队', completed_tasks: 30, resolved_alerts: 25, evidence_count: 32, avg_response_time: 12.8, score: 88, rank: 5 }
    ]

    // 按部门筛选
    let filtered = performanceData
    if (department) {
      filtered = filtered.filter(p => p.department === department)
    }

    res.json({
      success: true,
      data: filtered
    })
  } catch (error) {
    console.error('获取绩效数据失败:', error)
    res.status(500).json({
      success: false,
      message: '获取绩效数据失败'
    })
  }
})

/**
 * @route GET /api/v1/stats/zones
 * @desc 战区统计
 * @access 需要认证
 */
router.get('/zones', authenticate, async (req, res) => {
  try {
    const zoneStats = [
      { zone_id: 'pingxiang', name: '凭祥友谊关', alerts: 45, tasks: 22, devices: 18, online_rate: 89, risk_level: 'high' },
      { zone_id: 'dongxing', name: '东兴口岸', alerts: 38, tasks: 18, devices: 15, online_rate: 87, risk_level: 'high' },
      { zone_id: 'longzhou', name: '龙州水口', alerts: 25, tasks: 12, devices: 12, online_rate: 92, risk_level: 'medium' },
      { zone_id: 'jingxi', name: '靖西岳圩', alerts: 28, tasks: 14, devices: 10, online_rate: 85, risk_level: 'medium' },
      { zone_id: 'napo', name: '那坡桂林', alerts: 20, tasks: 12, devices: 8, online_rate: 88, risk_level: 'low' }
    ]

    res.json({
      success: true,
      data: zoneStats
    })
  } catch (error) {
    console.error('获取战区统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取战区统计失败'
    })
  }
})

/**
 * @route GET /api/v1/stats/export
 * @desc 导出统计数据
 * @access 需要认证 (admin, commander)
 */
router.get('/export', authenticate, async (req, res) => {
  try {
    // 检查权限
    const allowedRoles = ['admin', 'commander']
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '没有导出权限'
      })
    }

    const { type = 'alerts', format = 'json', start_date, end_date } = req.query

    // 模拟导出数据
    const exportData = {
      type,
      generated_at: new Date().toISOString(),
      generated_by: req.user.name || '未知',
      date_range: { start: start_date, end: end_date },
      summary: {
        total: 156,
        data: []
      }
    }

    res.json({
      success: true,
      data: exportData,
      message: '数据导出成功，请使用文件下载接口获取完整文件'
    })
  } catch (error) {
    console.error('导出统计失败:', error)
    res.status(500).json({
      success: false,
      message: '导出统计失败'
    })
  }
})

export default router
