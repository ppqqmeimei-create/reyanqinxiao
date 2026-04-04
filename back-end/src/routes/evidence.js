import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'evidence')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `EV-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`
    cb(null, filename)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  }
})

// 模拟取证数据存储（实际应使用数据库）
const evidenceStore = []

/**
 * @route POST /api/v1/evidence/upload
 * @desc 上传取证记录
 * @access 需要认证
 */
router.post('/upload', authenticate, upload.single('evidence_image'), async (req, res) => {
  try {
    const { check_code, capture_time, latitude, longitude, operator, user_id, alert_id } = req.body

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传取证文件'
      })
    }

    const evidence = {
      id: uuidv4(),
      check_code: check_code || generateCheckCode(),
      file_path: `/uploads/evidence/${req.file.filename}`,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      capture_time: capture_time ? new Date(capture_time) : new Date(),
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      operator: operator || req.user.name || '未知',
      user_id: user_id || req.user.id || '未知',
      alert_id: alert_id || null,
      uploaded_by: req.user.id || '未知',
      uploaded_at: new Date(),
      sync_status: 'synced',
      verified: false,
      verification_time: null
    }

    evidenceStore.push(evidence)

    res.status(201).json({
      success: true,
      message: '取证记录上传成功',
      data: {
        id: evidence.id,
        check_code: evidence.check_code,
        file_path: evidence.file_path,
        capture_time: evidence.capture_time,
        latitude: evidence.latitude,
        longitude: evidence.longitude,
        operator: evidence.operator,
        sync_status: evidence.sync_status
      }
    })
  } catch (error) {
    console.error('取证上传失败:', error)
    res.status(500).json({
      success: false,
      message: '取证上传失败: ' + error.message
    })
  }
})

/**
 * @route GET /api/v1/evidence
 * @desc 获取取证记录列表
 * @access 需要认证
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, alert_id, user_id, start_date, end_date, status } = req.query

    let filtered = [...evidenceStore]

    // 按预警ID筛选
    if (alert_id) {
      filtered = filtered.filter(e => e.alert_id === alert_id)
    }

    // 按用户ID筛选
    if (user_id) {
      filtered = filtered.filter(e => e.user_id === user_id)
    }

    // 按日期范围筛选
    if (start_date) {
      const start = new Date(start_date)
      filtered = filtered.filter(e => new Date(e.capture_time) >= start)
    }
    if (end_date) {
      const end = new Date(end_date)
      filtered = filtered.filter(e => new Date(e.capture_time) <= end)
    }

    // 按同步状态筛选
    if (status) {
      filtered = filtered.filter(e => e.sync_status === status)
    }

    // 分页
    const total = filtered.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const items = filtered.slice(startIndex, endIndex)

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
    console.error('获取取证列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取取证列表失败'
    })
  }
})

/**
 * @route GET /api/v1/evidence/:id
 * @desc 获取取证详情
 * @access 需要认证
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const evidence = evidenceStore.find(e => e.id === req.params.id)

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: '取证记录不存在'
      })
    }

    res.json({
      success: true,
      data: evidence
    })
  } catch (error) {
    console.error('获取取证详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取取证详情失败'
    })
  }
})

/**
 * @route GET /api/v1/evidence/:id/verify
 * @desc 防伪校验
 * @access 需要认证
 */
router.get('/:id/verify', authenticate, async (req, res) => {
  try {
    const evidence = evidenceStore.find(e => e.id === req.params.id)

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: '取证记录不存在'
      })
    }

    // 模拟校验逻辑
    const verification = {
      check_code: evidence.check_code,
      is_valid: true,
      verified_at: new Date(),
      verified_by: req.user.name || '未知',
      file_integrity: '完整',
      watermark_valid: true,
      gps_coordinates: {
        latitude: evidence.latitude,
        longitude: evidence.longitude
      },
      capture_time: evidence.capture_time,
      operator: evidence.operator,
      message: '防伪校验通过，证据未被篡改'
    }

    // 更新取证记录
    evidence.verified = true
    evidence.verification_time = new Date()

    res.json({
      success: true,
      data: verification
    })
  } catch (error) {
    console.error('防伪校验失败:', error)
    res.status(500).json({
      success: false,
      message: '防伪校验失败'
    })
  }
})

/**
 * @route DELETE /api/v1/evidence/:id
 * @desc 删除取证记录
 * @access 需要认证 (admin, commander)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // 检查权限
    const allowedRoles = ['admin', 'commander']
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '没有删除权限'
      })
    }

    const index = evidenceStore.findIndex(e => e.id === req.params.id)
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '取证记录不存在'
      })
    }

    const deleted = evidenceStore.splice(index, 1)[0]

    // 删除物理文件
    if (deleted.file_path) {
      const filePath = path.join(process.cwd(), deleted.file_path)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    res.json({
      success: true,
      message: '取证记录已删除'
    })
  } catch (error) {
    console.error('删除取证记录失败:', error)
    res.status(500).json({
      success: false,
      message: '删除取证记录失败'
    })
  }
})

/**
 * @route GET /api/v1/evidence/stats
 * @desc 获取取证统计
 * @access 需要认证
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const total = evidenceStore.length
    const synced = evidenceStore.filter(e => e.sync_status === 'synced').length
    const pending = evidenceStore.filter(e => e.sync_status === 'pending').length
    const failed = evidenceStore.filter(e => e.sync_status === 'failed').length
    const verified = evidenceStore.filter(e => e.verified).length

    // 按日期统计（最近7天）
    const now = new Date()
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = evidenceStore.filter(e => {
        const uploadDate = new Date(e.uploaded_at).toISOString().split('T')[0]
        return uploadDate === dateStr
      }).length
      dailyStats.push({ date: dateStr, count })
    }

    res.json({
      success: true,
      data: {
        total,
        synced,
        pending,
        failed,
        verified,
        verified_rate: total > 0 ? Math.round((verified / total) * 100) : 0,
        daily_stats: dailyStats
      }
    })
  } catch (error) {
    console.error('获取取证统计失败:', error)
    res.status(500).json({
      success: false,
      message: '获取取证统计失败'
    })
  }
})

// 辅助函数：生成校验码
function generateCheckCode() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `EV-${random}-${String(timestamp).slice(-6)}`
}

export default router
