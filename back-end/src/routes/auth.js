import express from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { validateLogin, validateRegister } from '../middleware/validation.js';

const router = express.Router();

function buildToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

/**
 * POST /api/v1/auth/login
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { badge_number: username }]
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: '用户已被禁用' });
    }

    await user.update({ last_login: new Date(), status: 'online' });

    const token = buildToken(user);

    res.json({
      success: true,
      message: '登录成功',
      token,
      data: {
        access_token: token,
        user: user.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败', error: error.message });
  }
});

/**
 * POST /api/v1/auth/biometric
 */
router.post('/biometric', async (req, res) => {
  try {
    const user = await User.findOne({ where: { is_active: true } });
    if (!user) {
      return res.status(404).json({ success: false, message: '暂无可用用户' });
    }

    await user.update({ last_login: new Date(), status: 'online' });
    const token = buildToken(user);

    res.json({
      success: true,
      message: '生物识别登录成功',
      token,
      data: {
        access_token: token,
        user: user.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '生物识别登录失败', error: error.message });
  }
});

/**
 * POST /api/v1/auth/register
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    const existedByUsername = await User.findOne({ where: { username } });
    if (existedByUsername) {
      return res.status(409).json({ success: false, message: '用户名已存在' });
    }

    const existedByEmail = await User.findOne({ where: { email } });
    if (existedByEmail) {
      return res.status(409).json({ success: false, message: '邮箱已被注册' });
    }

    const user = await User.create({ username, email, password, name, role: 'inspector' });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '注册失败', error: error.message });
  }
});

/**
 * GET /api/v1/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: { user: user.toJSON() } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户信息失败', error: error.message });
  }
});

/**
 * POST /api/v1/auth/logout
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user) {
      await user.update({ status: 'offline' });
    }

    res.json({ success: true, message: '登出成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '登出失败', error: error.message });
  }
});

/**
 * PUT /api/v1/auth/update-status
 */
router.put('/update-status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['online', 'offline', 'busy'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态值' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    await user.update({ status });

    res.json({ success: true, message: '状态更新成功', data: { user: user.toJSON() } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新状态失败', error: error.message });
  }
});

export default router;
