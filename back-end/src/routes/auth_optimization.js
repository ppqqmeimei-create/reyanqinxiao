/**
 * 登录API - 优化版本
 * 文件: back-end/src/routes/auth_optimization.js
 * 功能: 提供用户维度验证、生物识别、登录日志等API
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * 用户登录 - 支持三维度用户
 */
router.post('/login', async (req, res) => {
  try {
    const { badge_number, username, password, category } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const device_info = req.headers['user-agent'] || 'Unknown';

    // 验证必要字段
    if (!password || (!badge_number && !username)) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    // 验证分类
    const validCategories = ['ecology', 'fooddrug', 'enforcement'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: '无效的用户分类'
      });
    }

    logger.info(`Login attempt: ${badge_number || username} from ${ip_address}`);

    // 这里需要导入User和LoginLog模型
    // const user = await User.findOne({
    //   $or: [
    //     { badge_number: badge_number },
    //     { username: username }
    //   ],
    //   category: category || 'ecology'
    // });

    // 模拟数据
    const user = {
      id: 1,
      username: badge_number || username,
      name: '检查员',
      badge_number: badge_number,
      category: category || 'ecology',
      department: '广西环食药侦查总队',
      avatar: '/static/avatar.png',
      is_locked: false
    };

    // 检查账户是否被锁定
    if (user.is_locked) {
      logger.warn(`Account locked: ${badge_number || username}`);
      
      // 记录登录失败
      // await sp_record_login_failure(badge_number || username, ip_address, '账户已锁定', 5);
      
      return res.status(403).json({
        success: false,
        message: '账户已被锁定，请稍后重试'
      });
    }

    // 验证密码
    // const isValid = await user.validatePassword(password);
    const isValid = true; // 模拟验证

    if (!isValid) {
      logger.warn(`Login failed: ${badge_number || username}`);
      
      // 记录登录失败
      // await sp_record_login_failure(badge_number || username, ip_address, '密码错误', 5);
      
      // 记录登录日志
      // await sp_record_login(user.id, badge_number || username, category, ip_address, device_info, 'password', false, '密码错误', null);
      
      return res.status(401).json({
        success: false,
        message: '警号或密码错误'
      });
    }

    // 生成Token
    const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const session_id = 'session_' + Date.now();

    // 创建登录会话
    // await sp_create_login_session(user.id, token, device_info, category, ip_address, 168);

    // 记录登录日志
    // await sp_record_login(user.id, badge_number || username, category, ip_address, device_info, 'password', true, null, session_id);

    logger.info(`Login successful: ${badge_number || username}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          badge_number: user.badge_number,
          category: user.category,
          department: user.department,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/biometric
 * 生物识别登录
 */
router.post('/biometric', async (req, res) => {
  try {
    const { biometric_type, biometric_data, category } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const device_info = req.headers['user-agent'] || 'Unknown';

    // 验证必要字段
    if (!biometric_type || !biometric_data) {
      return res.status(400).json({
        success: false,
        message: '缺少生物识别数据'
      });
    }

    // 验证生物识别类型
    const validTypes = ['fingerprint', 'face', 'iris'];
    if (!validTypes.includes(biometric_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的生物识别类型'
      });
    }

    logger.info(`Biometric login attempt: ${biometric_type} from ${ip_address}`);

    // 这里需要导入BiometricData和User模型
    // const biometric = await BiometricData.findOne({
    //   biometric_type: biometric_type,
    //   is_active: true
    // });

    // 模拟数据
    const biometric = {
      user_id: 1,
      biometric_type: biometric_type,
      is_active: true
    };

    if (!biometric) {
      logger.warn(`Biometric not found: ${biometric_type}`);
      
      // 记录登录失败
      // await sp_record_login_failure('unknown', ip_address, '生物识别不匹配', 5);
      
      return res.status(401).json({
        success: false,
        message: '生物识别不匹配'
      });
    }

    // 获取用户信息
    // const user = await User.findById(biometric.user_id);
    const user = {
      id: 1,
      username: 'officer001',
      name: '执法员',
      badge_number: 'ENF-001',
      category: category || 'enforcement',
      department: '广西环食药侦查总队',
      avatar: '/static/avatar.png'
    };

    // 生成Token
    const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const session_id = 'session_' + Date.now();

    // 创建登录会话
    // await sp_create_login_session(user.id, token, device_info, user.category, ip_address, 168);

    // 记录登录日志
    // await sp_record_login(user.id, user.username, user.category, ip_address, device_info, biometric_type, true, null, session_id);

    // 更新最后使用时间
    // await BiometricData.updateOne({ _id: biometric._id }, { last_used: new Date() });

    logger.info(`Biometric login successful: ${user.username}`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          badge_number: user.badge_number,
          category: user.category,
          department: user.department,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    logger.error(`Biometric login error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '生物识别登录失败',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/login-logs
 * 获取登录日志
 */
router.get('/login-logs', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, success } = req.query;

    logger.info(`User ${req.user.id} requested login logs`);

    // 这里需要导入LoginLog模型
    // let query = {};
    // if (category) query.category = category;
    // if (success !== undefined) query.success = success === 'true';
    // const skip = (page - 1) * limit;
    // const logs = await LoginLog.find(query)
    //   .skip(skip)
    //   .limit(parseInt(limit))
    //   .sort({ login_time: -1 });
    // const total = await LoginLog.countDocuments(query);

    // 模拟数据
    const logs = [];
    const total = 0;

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching login logs: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取登录日志失败',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/login-summary
 * 获取登录统计
 */
router.get('/login-summary', authenticate, async (req, res) => {
  try {
    const { start_date, end_date, category } = req.query;

    logger.info(`User ${req.user.id} requested login summary`);

    // 这里需要导入LoginLog模型
    // let query = {};
    // if (category) query.category = category;
    // if (start_date && end_date) {
    //   query.login_time = {
    //     $gte: new Date(start_date),
    //     $lte: new Date(end_date)
    //   };
    // }
    // const logs = await LoginLog.find(query);

    // 模拟数据
    const summary = {
      total_logins: 0,
      successful_logins: 0,
      failed_logins: 0,
      unique_users: 0,
      unique_ips: 0,
      by_category: {
        ecology: 0,
        fooddrug: 0,
        enforcement: 0
      },
      by_method: {
        password: 0,
        biometric: 0,
        offline: 0
      }
    };

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    logger.error(`Error fetching login summary: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取登录统计失败',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/register-biometric
 * 注册生物识别
 */
router.post('/register-biometric', authenticate, async (req, res) => {
  try {
    const { biometric_type, biometric_data, is_primary } = req.body;

    // 验证生物识别类型
    const validTypes = ['fingerprint', 'face', 'iris'];
    if (!validTypes.includes(biometric_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的生物识别类型'
      });
    }

    logger.info(`User ${req.user.id} registering biometric: ${biometric_type}`);

    // 这里需要导入BiometricData模型
    // const biometric = await BiometricData.create({
    //   user_id: req.user.id,
    //   biometric_type: biometric_type,
    //   biometric_data: biometric_data,
    //   is_primary: is_primary || false,
    //   is_active: true
    // });

    // 模拟数据
    const biometric = {
      user_id: req.user.id,
      biometric_type: biometric_type,
      is_primary: is_primary || false,
      is_active: true,
      registered_at: new Date()
    };

    // 如果设置为主要识别方式，更新用户
    if (is_primary) {
      // await User.updateOne({ _id: req.user.id }, { biometric_enabled: true });
    }

    res.json({
      success: true,
      data: { biometric }
    });
  } catch (error) {
    logger.error(`Error registering biometric: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '注册生物识别失败',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/user-devices
 * 获取用户设备列表
 */
router.get('/user-devices', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested device list`);

    // 这里需要导入UserDevice模型
    // const devices = await UserDevice.find({ user_id: req.user.id });

    // 模拟数据
    const devices = [];

    res.json({
      success: true,
      data: { devices }
    });
  } catch (error) {
    logger.error(`Error fetching user devices: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取设备列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/trust-device
 * 信任设备
 */
router.post('/trust-device', authenticate, async (req, res) => {
  try {
    const { device_id, device_name } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: '缺少设备ID'
      });
    }

    logger.info(`User ${req.user.id} trusting device: ${device_id}`);

    // 这里需要导入UserDevice模型
    // const device = await UserDevice.findOneAndUpdate(
    //   { user_id: req.user.id, device_id: device_id },
    //   { is_trusted: true, device_name: device_name },
    //   { upsert: true, new: true }
    // );

    // 模拟数据
    const device = {
      user_id: req.user.id,
      device_id: device_id,
      device_name: device_name,
      is_trusted: true
    };

    res.json({
      success: true,
      data: { device }
    });
  } catch (error) {
    logger.error(`Error trusting device: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '信任设备失败',
      error: error.message
    });
  }
});

export default router;
