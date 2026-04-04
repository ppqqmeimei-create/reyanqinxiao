/**
 * 用户API - 优化版本
 * 文件: back-end/src/routes/users_optimization.js
 * 功能: 提供用户角色、权限、工作统计等API
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/users/roles/list
 * 获取所有用户角色列表
 */
router.get('/roles/list', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested user roles list`);
    
    // 模拟数据
    const roles = [
      {
        key: 'ecology-inspector',
        name: '环保检查员',
        category: 'ecology',
        icon: '🌍',
        color: '#10b981',
        permissions: ['ecology-task', 'ecology-device', 'ecology-alert', 'ecology-report']
      },
      {
        key: 'fooddrug-inspector',
        name: '食品药品检查员',
        category: 'fooddrug',
        icon: '🏥',
        color: '#f59e0b',
        permissions: ['fooddrug-task', 'fooddrug-device', 'fooddrug-alert', 'fooddrug-report']
      },
      {
        key: 'enforcement-officer',
        name: '生态警务执法员',
        category: 'enforcement',
        icon: '👮',
        color: '#ef4444',
        permissions: ['enforcement-task', 'enforcement-device', 'enforcement-alert', 'enforcement-case', 'enforcement-evidence', 'enforcement-record']
      }
    ];
    
    res.json({
      success: true,
      data: { roles }
    });
  } catch (error) {
    logger.error(`Error fetching user roles: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取用户角色失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/users/me/roles
 * 获取当前用户的角色
 */
router.get('/me/roles', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested their roles`);
    
    // 这里需要导入User模型
    // const user = await User.findById(req.user.id);
    
    // 模拟数据
    const userRoles = {
      primary: 'ecology-inspector',
      category: 'ecology',
      name: '环保检查员',
      department: '广西环食药侦查总队',
      badge_number: 'ENV-001',
      icon: '🌍',
      color: '#10b981'
    };
    
    res.json({
      success: true,
      data: { roles: userRoles }
    });
  } catch (error) {
    logger.error(`Error fetching user roles: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取用户角色失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/users/me/permissions
 * 获取当前用户的权限列表
 */
router.get('/me/permissions', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested their permissions`);
    
    // 这里需要导入UserPermission模型
    // const permissions = await UserPermission.find({ user_id: req.user.id });
    
    // 模拟数据
    const permissions = [
      { key: 'ecology-task', name: '环保任务管理', granted: true },
      { key: 'ecology-device', name: '环保设备管理', granted: true },
      { key: 'ecology-alert', name: '环保告警管理', granted: true },
      { key: 'ecology-report', name: '环保报告生成', granted: true }
    ];
    
    res.json({
      success: true,
      data: { permissions }
    });
  } catch (error) {
    logger.error(`Error fetching user permissions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取用户权限失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/users/me/check-permission
 * 检查用户是否有特定权限
 */
router.post('/me/check-permission', authenticate, async (req, res) => {
  try {
    const { permission_key } = req.body;
    
    if (!permission_key) {
      return res.status(400).json({
        success: false,
        message: '缺少权限键'
      });
    }
    
    logger.info(`User ${req.user.id} checking permission: ${permission_key}`);
    
    // 这里需要导入UserPermission模型
    // const permission = await UserPermission.findOne({
    //   user_id: req.user.id,
    //   permission_key: permission_key
    // });
    
    // 模拟数据
    const hasPermission = true;
    
    res.json({
      success: true,
      data: { 
        permission_key,
        has_permission: hasPermission
      }
    });
  } catch (error) {
    logger.error(`Error checking permission: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '权限检查失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/users/me/work-stats
 * 获取当前用户的工作统计
 */
router.get('/me/work-stats', authenticate, async (req, res) => {
  try {
    const { start_date, end_date, category } = req.query;
    
    logger.info(`User ${req.user.id} requested work stats`);
    
    // 这里需要导入UserWorkStats模型
    // let query = { user_id: req.user.id };
    // if (category) query.category = category;
    // if (start_date && end_date) {
    //   query.work_date = {
    //     $gte: new Date(start_date),
    //     $lte: new Date(end_date)
    //   };
    // }
    // const stats = await UserWorkStats.find(query);
    
    // 模拟数据
    const stats = {
      total_tasks: 45,
      total_alerts: 12,
      total_distance: 156.5,
      total_hours: 240,
      work_days: 30,
      avg_tasks_per_day: 1.5,
      avg_hours_per_day: 8,
      by_category: {
        ecology: {
          tasks: 45,
          alerts: 12,
          distance: 156.5,
          hours: 240
        }
      }
    };
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error(`Error fetching work stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取工作统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/users/me/work-stats/daily
 * 获取当前用户的每日工作统计
 */
router.get('/me/work-stats/daily', authenticate, async (req, res) => {
  try {
    const { date, category } = req.query;
    
    logger.info(`User ${req.user.id} requested daily work stats for ${date}`);
    
    // 这里需要导入UserWorkStats模型
    // const stats = await UserWorkStats.findOne({
    //   user_id: req.user.id,
    //   work_date: new Date(date),
    //   category: category
    // });
    
    // 模拟数据
    const dailyStats = {
      work_date: date,
      category: category || 'ecology',
      task_count: 3,
      alert_count: 1,
      patrol_distance: 25.5,
      work_hours: 8
    };
    
    res.json({
      success: true,
      data: { stats: dailyStats }
    });
  } catch (error) {
    logger.error(`Error fetching daily work stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取每日工作统计失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/users/me/work-stats
 * 更新用户工作统计
 */
router.post('/me/work-stats', authenticate, async (req, res) => {
  try {
    const { category, work_date, task_count, alert_count, patrol_distance, work_hours } = req.body;
    
    // 验证必要字段
    if (!category || !work_date) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }
    
    logger.info(`User ${req.user.id} updated work stats for ${work_date}`);
    
    // 这里需要导入UserWorkStats模型
    // const stats = await UserWorkStats.findOneAndUpdate(
    //   { user_id: req.user.id, work_date, category },
    //   {
    //     task_count: task_count || 0,
    //     alert_count: alert_count || 0,
    //     patrol_distance: patrol_distance || 0,
    //     work_hours: work_hours || 0
    //   },
    //   { upsert: true, new: true }
    // );
    
    // 模拟数据
    const stats = {
      user_id: req.user.id,
      category,
      work_date,
      task_count: task_count || 0,
      alert_count: alert_count || 0,
      patrol_distance: patrol_distance || 0,
      work_hours: work_hours || 0
    };
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error(`Error updating work stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新工作统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/users/me/medals
 * 获取当前用户的勋章
 */
router.get('/me/medals', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested their medals`);
    
    // 这里需要导入UserMedal模型
    // const medals = await UserMedal.find({ user_id: req.user.id });
    
    // 模拟数据
    const medals = [
      { key: 'excellent-inspector', name: '优秀检查员', icon: '🏆', earned: true },
      { key: 'eco-guardian', name: '生态守护者', icon: '🌍', earned: true },
      { key: 'enforcement-hero', name: '执法英雄', icon: '👮', earned: false }
    ];
    
    res.json({
      success: true,
      data: { medals }
    });
  } catch (error) {
    logger.error(`Error fetching user medals: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取用户勋章失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/users/me/duty-status
 * 获取当前用户的执勤状态
 */
router.get('/me/duty-status', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested duty status`);
    
    // 这里需要导入User模型
    // const user = await User.findById(req.user.id);
    
    // 模拟数据
    const dutyStatus = {
      on_duty: false,
      last_duty_start: new Date(Date.now() - 86400000),
      last_duty_end: new Date(Date.now() - 82800000),
      total_duty_hours: 240,
      current_duty_location: null
    };
    
    res.json({
      success: true,
      data: { duty_status: dutyStatus }
    });
  } catch (error) {
    logger.error(`Error fetching duty status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取执勤状态失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/users/me/duty-status
 * 更新用户执勤状态
 */
router.post('/me/duty-status', authenticate, async (req, res) => {
  try {
    const { on_duty, location } = req.body;
    
    logger.info(`User ${req.user.id} updated duty status: ${on_duty}`);
    
    // 这里需要导入User和DutyRecord模型
    // const user = await User.findByIdAndUpdate(
    //   req.user.id,
    //   { on_duty },
    //   { new: true }
    // );
    
    // if (on_duty) {
    //   await DutyRecord.create({
    //     user_id: req.user.id,
    //     duty_start: new Date(),
    //     location
    //   });
    // } else {
    //   await DutyRecord.findOneAndUpdate(
    //     { user_id: req.user.id, duty_end: null },
    //     { duty_end: new Date() }
    //   );
    // }
    
    // 模拟数据
    const result = {
      on_duty,
      updated_at: new Date(),
      location
    };
    
    res.json({
      success: true,
      data: { duty_status: result }
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

export default router;
