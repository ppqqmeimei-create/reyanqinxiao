/**
 * 用户API - 优化版本
 * 文件: back-end/src/routes/users_interface_optimization.js
 * 功能: 提供用户身份管理、勤务统计、荣誉勋章、AI模型管理等API
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/users/me
 * 获取当前用户信息
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested profile`);

    // 这里需要导入User和DutyStatistics模型
    // const user = await User.findById(req.user.id);
    // const dutyStats = await DutyStatistics.findOne({ user_id: req.user.id });
    // const medals = await UserMedal.find({ user_id: req.user.id }).populate('medal_id');

    // 模拟数据
    const user = {
      id: req.user.id,
      username: 'officer001',
      name: '执法员张三',
      badgeNumber: 'ENV-001',
      rank: '高级检查员',
      department: '广西环食药侦查总队',
      userCategory: 'ecology',
      avatar: '/static/avatar.png',
      dutyStatus: 'on_duty',
      gpsEnabled: true
    };

    const dutyStats = {
      taskCount: 45,
      alertCount: 12,
      patrolDistance: 256.5,
      workDays: 22,
      interceptionCount: 8,
      enterpriseCheckCount: 0,
      caseCount: 0,
      workHours: 176
    };

    const medals = [];

    res.json({
      success: true,
      data: {
        user,
        dutyStats,
        medals
      }
    });
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/users/duty-status
 * 更新执勤状态
 */
router.put('/duty-status', authenticate, async (req, res) => {
  try {
    const { dutyStatus, gpsEnabled } = req.body;

    if (!dutyStatus) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    logger.info(`User ${req.user.id} updating duty status to ${dutyStatus}`);

    // 这里需要导入User模型
    // const user = await User.findByIdAndUpdate(
    //   req.user.id,
    //   {
    //     duty_status: dutyStatus,
    //     gps_enabled: gpsEnabled
    //   },
    //   { new: true }
    // );

    // 模拟数据
    const user = {
      id: req.user.id,
      dutyStatus,
      gpsEnabled: gpsEnabled !== undefined ? gpsEnabled : true
    };

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error(`Error updating duty status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新执勤状态失败',
      error: error.message
    });
  }
});

/**
 * GET /api/users/duty-statistics
 * 获取勤务统计
 */
router.get('/duty-statistics', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested duty statistics`);

    // 这里需要导入DutyStatistics模型
    // const stats = await DutyStatistics.findOne({ user_id: req.user.id });

    // 模拟数据
    const stats = {
      userId: req.user.id,
      userCategory: 'ecology',
      taskCount: 45,
      alertCount: 12,
      patrolDistance: 256.5,
      workDays: 22,
      interceptionCount: 8,
      enterpriseCheckCount: 0,
      caseCount: 0,
      workHours: 176
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error(`Error fetching duty statistics: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取勤务统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/users/medals
 * 获取用户勋章
 */
router.get('/medals', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested medals`);

    // 这里需要导入UserMedal和Medal模型
    // const userMedals = await UserMedal.find({ user_id: req.user.id })
    //   .populate('medal_id');
    // const allMedals = await Medal.find();

    // 模拟数据
    const userMedals = [];
    const allMedals = [
      {
        id: 1,
        medalCode: 'MEDAL-001',
        medalName: '优秀检查员',
        medalIcon: '🏆',
        medalDescription: '完成50个任务',
        earned: false
      },
      {
        id: 2,
        medalCode: 'MEDAL-002',
        medalName: '环保卫士',
        medalIcon: '🌍',
        medalDescription: '环保任务完成100个',
        earned: false
      },
      {
        id: 3,
        medalCode: 'MEDAL-003',
        medalName: '生态守护者',
        medalIcon: '🦉',
        medalDescription: '巡逻里程超过1000km',
        earned: false
      },
      {
        id: 4,
        medalCode: 'MEDAL-004',
        medalName: '食品安全卫士',
        medalIcon: '🏥',
        medalDescription: '食品药品检查50次',
        earned: false
      },
      {
        id: 5,
        medalCode: 'MEDAL-005',
        medalName: '执法英雄',
        medalIcon: '👮',
        medalDescription: '执法案件处理20个',
        earned: false
      }
    ];

    res.json({
      success: true,
      data: {
        userMedals,
        allMedals,
        earnedCount: userMedals.length,
        totalCount: allMedals.length
      }
    });
  } catch (error) {
    logger.error(`Error fetching medals: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取勋章失败',
      error: error.message
    });
  }
});

/**
 * GET /api/users/ai-models
 * 获取AI模型信息
 */
router.get('/ai-models', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested AI models`);

    // 这里需要导入AIModel和UserModelVersion模型
    // const userModels = await UserModelVersion.find({ user_id: req.user.id })
    //   .populate('model_id');
    // const latestModels = await AIModel.find({ is_latest: true });

    // 模拟数据
    const userModels = [
      {
        id: 1,
        modelId: 1,
        modelName: '生态/走私案件标准库',
        installedVersion: 'V2.4',
        installedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updateAvailable: true,
        latestVersion: 'V2.5'
      }
    ];

    const latestModels = [
      {
        id: 1,
        modelCode: 'MODEL-001',
        modelName: '生态/走私案件标准库',
        modelVersion: 'V2.5',
        modelType: '全天候目标识别',
        modelSize: 52,
        accuracyRate: 96.2,
        inferenceSpeed: 220,
        memoryUsage: 145,
        releaseNotes: '改进了夜间识别能力'
      },
      {
        id: 2,
        modelCode: 'MODEL-003',
        modelName: '食品安全检测库',
        modelVersion: 'V1.8',
        modelType: '食品质量检测',
        modelSize: 38,
        accuracyRate: 92.1,
        inferenceSpeed: 280,
        memoryUsage: 110,
        releaseNotes: '新增温度异常检测'
      },
      {
        id: 3,
        modelCode: 'MODEL-004',
        modelName: '执法证据识别库',
        modelVersion: 'V1.5',
        modelType: '证据自动识别',
        modelSize: 55,
        accuracyRate: 95.8,
        inferenceSpeed: 200,
        memoryUsage: 160,
        releaseNotes: '支持多种证据类型识别'
      }
    ];

    res.json({
      success: true,
      data: {
        userModels,
        latestModels
      }
    });
  } catch (error) {
    logger.error(`Error fetching AI models: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取AI模型失败',
      error: error.message
    });
  }
});

/**
 * POST /api/users/ai-models/:id/update
 * 更新AI模型
 */
router.post('/ai-models/:id/update', authenticate, async (req, res) => {
  try {
    const modelId = req.params.id;
    logger.info(`User ${req.user.id} updating AI model ${modelId}`);

    // 这里需要导入UserModelVersion模型
    // const userModel = await UserModelVersion.findOneAndUpdate(
    //   { user_id: req.user.id, model_id: modelId },
    //   {
    //     installed_version: req.body.newVersion,
    //     last_updated: new Date(),
    //     update_available: false
    //   },
    //   { new: true }
    // );

    // 模拟数据
    const userModel = {
      id: 1,
      userId: req.user.id,
      modelId,
      installedVersion: 'V2.5',
      lastUpdated: new Date(),
      updateAvailable: false
    };

    res.json({
      success: true,
      data: {
        message: '模型更新成功',
        userModel
      }
    });
  } catch (error) {
    logger.error(`Error updating AI model: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新AI模型失败',
      error: error.message
    });
  }
});

/**
 * POST /api/users/gps-location
 * 上报GPS位置
 */
router.post('/gps-location', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, speed, heading } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少位置信息'
      });
    }

    logger.info(`User ${req.user.id} reporting GPS location: ${latitude}, ${longitude}`);

    // 这里需要导入User和GPSLocationHistory模型
    // await User.findByIdAndUpdate(req.user.id, {
    //   last_gps_latitude: latitude,
    //   last_gps_longitude: longitude,
    //   last_gps_time: new Date()
    // });
    // await GPSLocationHistory.create({
    //   user_id: req.user.id,
    //   latitude,
    //   longitude,
    //   accuracy,
    //   speed,
    //   heading
    // });

    // 模拟数据
    const location = {
      userId: req.user.id,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      recordedAt: new Date()
    };

    res.json({
      success: true,
      data: { location }
    });
  } catch (error) {
    logger.error(`Error reporting GPS location: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '上报GPS位置失败',
      error: error.message
    });
  }
});

/**
 * GET /api/users/gps-history
 * 获取GPS位置历史
 */
router.get('/gps-history', authenticate, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    logger.info(`User ${req.user.id} requested GPS history`);

    // 这里需要导入GPSLocationHistory模型
    // const history = await GPSLocationHistory.find({ user_id: req.user.id })
    //   .sort({ recorded_at: -1 })
    //   .limit(parseInt(limit));

    // 模拟数据
    const history = [];

    res.json({
      success: true,
      data: { history }
    });
  } catch (error) {
    logger.error(`Error fetching GPS history: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取GPS历史失败',
      error: error.message
    });
  }
});

/**
 * POST /api/users/emergency-destroy
 * 紧急数据销毁
 */
router.post('/emergency-destroy', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} executing emergency data destruction`);

    // 这里需要执行数据销毁逻辑
    // 清除用户的所有本地缓存证据、临时文件等

    res.json({
      success: true,
      data: {
        message: '紧急数据销毁已执行',
        destroyedAt: new Date()
      }
    });
  } catch (error) {
    logger.error(`Error executing emergency destroy: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '紧急数据销毁失败',
      error: error.message
    });
  }
});

/**
 * POST /api/users/logout
 * 用户登出
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} logging out`);

    // 这里可以执行登出逻辑，如清除会话、记录登出时间等

    res.json({
      success: true,
      data: {
        message: '登出成功',
        logoutAt: new Date()
      }
    });
  } catch (error) {
    logger.error(`Error logging out: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '登出失败',
      error: error.message
    });
  }
});

export default router;
