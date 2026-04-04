import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/users
 * 获取用户列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/users/:id
 * 获取用户详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/users/:id
 * 更新用户信息
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    // 防止修改敏感字段
    const { password, role, is_active, ...updateData } = req.body;

    // 只有管理员可以修改角色和激活状态
    if (req.user.role === 'admin') {
      if (role) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/users/:id
 * 删除用户
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // 只有管理员可以删除用户
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除用户'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/users/:id/change-password
 * 修改密码
 */
router.put('/:id/change-password', authenticate, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: '缺少密码参数'
      });
    }

    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isPasswordValid = await user.comparePassword(old_password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '旧密码错误'
      });
    }

    // 设置新密码
    user.password = new_password;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/users/stats
 * 获取用户统计
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const total = await User.countDocuments();
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const byStatus = await User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        by_role: Object.fromEntries(byRole.map(item => [item._id, item.count])),
        by_status: Object.fromEntries(byStatus.map(item => [item._id, item.count]))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计失败',
      error: error.message
    });
  }
});

export default router;
