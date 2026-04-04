/**
 * GIS地图API - 优化版本
 * 文件: back-end/src/routes/gis_optimization.js
 * 功能: 提供GIS地图的走私/生态预警点位、监测设备等API
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/gis/monitoring-points
 * 获取监测点列表
 */
router.get('/monitoring-points', authenticate, async (req, res) => {
  try {
    const { category, type, risk_level, bounds } = req.query;

    logger.info(`User ${req.user.id} requested monitoring points`);

    // 这里需要导入MonitoringPoint模型
    // let query = {};
    // if (category) query.category = category;
    // if (type) query.type = type;
    // if (risk_level) query.risk_level = risk_level;
    // const points = await MonitoringPoint.find(query);

    // 模拟数据
    const points = [
      {
        id: 1,
        name: '水质监测点-001',
        type: 'water',
        category: 'ecology',
        latitude: 39.9042,
        longitude: 116.4074,
        status: 'online',
        risk_score: 75,
        last_update: new Date(),
        data: {
          pH: 7.2,
          temperature: 22,
          COD: 45
        }
      },
      {
        id: 2,
        name: '大气监测点-001',
        type: 'air',
        category: 'ecology',
        latitude: 39.9050,
        longitude: 116.4080,
        status: 'online',
        risk_score: 65,
        last_update: new Date(),
        data: {
          PM25: 85,
          AQI: 120,
          SO2: 35
        }
      }
    ];

    res.json({
      success: true,
      data: { points }
    });
  } catch (error) {
    logger.error(`Error fetching monitoring points: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取监测点失败',
      error: error.message
    });
  }
});

/**
 * GET /api/gis/pollution-sources
 * 获取走私/生态预警点位列表（接口路径保留）
 */
router.get('/pollution-sources', authenticate, async (req, res) => {
  try {
    const { category, type, risk_level } = req.query;

    logger.info(`User ${req.user.id} requested ecology alert spots`);

    // 模拟走私/生态预警数据
    const sources = [
      {
        id: 1,
        name: '东兴万尾金滩',
        type: 'wildlife-track',
        category: 'ecology',
        latitude: 21.5318,
        longitude: 108.0325,
        risk_score: 85,
        alert_level: 'critical',
        description: '疑似活体走私',
        last_detected: new Date()
      }
    ];

    res.json({
      success: true,
      data: { sources }
    });
  } catch (error) {
    logger.error(`Error fetching ecology alert spots: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取预警点位失败',
      error: error.message
    });
  }
});

/**
 * GET /api/gis/alerts
 * 获取实时预警列表
 */
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { category, level, status } = req.query;

    logger.info(`User ${req.user.id} requested alerts`);

    // 这里需要导入Alert模型
    // let query = {};
    // if (category) query.category = category;
    // if (level) query.level = level;
    // if (status) query.status = status;
    // const alerts = await Alert.find(query).sort({ created_at: -1 });

    // 模拟数据
    const alerts = [
      {
        id: 1,
        sensor_id: 1,
        sensor_name: '水质监测点-001',
        type: 'water',
        category: 'ecology',
        level: 'critical',
        risk_score: 85,
        message: '水质COD超标3倍',
        latitude: 39.9042,
        longitude: 116.4074,
        created_at: new Date(),
        status: 'pending'
      }
    ];

    res.json({
      success: true,
      data: { alerts }
    });
  } catch (error) {
    logger.error(`Error fetching alerts: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取预警失败',
      error: error.message
    });
  }
});

/**
 * GET /api/gis/diffusion-path
 * 获取走私路径
 */
router.get('/diffusion-path', authenticate, async (req, res) => {
  try {
    const { source_id, wind_direction, distance } = req.query;

    logger.info(`User ${req.user.id} requested smuggling path for source ${source_id}`);

    // 模拟走私路径数据
    const path = {
      source_id: source_id,
      points: [
        { latitude: 39.9045, longitude: 116.4075 },
        { latitude: 39.9050, longitude: 116.4080 },
        { latitude: 39.9055, longitude: 116.4085 },
        { latitude: 39.9060, longitude: 116.4090 }
      ],
      wind_direction: wind_direction || 45,
      distance: distance || 5000,
      created_at: new Date()
    };

    res.json({
      success: true,
      data: { path }
    });
  } catch (error) {
    logger.error(`Error fetching diffusion path: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取走私路径失败',
      error: error.message
    });
  }
});

/**
 * GET /api/gis/pollution-range
 * 获取预警范围圈
 */
router.get('/pollution-range', authenticate, async (req, res) => {
  try {
    const { source_id } = req.query;

    logger.info(`User ${req.user.id} requested alert range for source ${source_id}`);

    // 模拟预警范围数据
    const range = {
      source_id: source_id,
      latitude: 39.9045,
      longitude: 116.4075,
      radius: 2000,
      affected_population: 5000,
      risk_level: 'critical',
      created_at: new Date()
    };

    res.json({
      success: true,
      data: { range }
    });
  } catch (error) {
    logger.error(`Error fetching pollution range: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取预警范围失败',
      error: error.message
    });
  }
});

/**
 * POST /api/gis/create-task
 * 从预警创建执法任务
 */
router.post('/create-task', authenticate, async (req, res) => {
  try {
    const { alert_id, alert_type, location, description } = req.body;

    if (!alert_id || !alert_type) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    logger.info(`User ${req.user.id} creating task from alert ${alert_id}`);

    // 这里需要导入Task模型
    // const task = await Task.create({
    //   alert_id,
    //   type: alert_type,
    //   creator_id: req.user.id,
    //   location,
    //   description,
    //   status: 'pending',
    //   created_at: new Date()
    // });

    // 模拟数据
    const task = {
      id: `task_${Date.now()}`,
      alert_id,
      type: alert_type,
      creator_id: req.user.id,
      location,
      description,
      status: 'pending',
      created_at: new Date()
    };

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    logger.error(`Error creating task: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '创建任务失败',
      error: error.message
    });
  }
});

/**
 * GET /api/gis/map-layers
 * 获取地图图层配置
 */
router.get('/map-layers', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested map layers`);

    const layers = [
      {
        key: 'smuggling_spot',
        name: '走私预警点',
        visible: true,
        description: '显示走私预警位置标记'
      },
      {
        key: 'monitoring_point',
        name: '监测点标记',
        visible: true,
        description: '显示监测设备位置'
      },
      {
        key: 'smuggling_path',
        name: '走私路径',
        visible: true,
        description: '显示走私路径'
      },
      {
        key: 'alert_range',
        name: '预警范围圈',
        visible: true,
        description: '显示预警影响范围'
      }
    ];

    res.json({
      success: true,
      data: { layers }
    });
  } catch (error) {
    logger.error(`Error fetching map layers: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取地图图层失败',
      error: error.message
    });
  }
});

/**
 * GET /api/gis/pollution-filters
 * 获取走私/生态预警筛选选项
 */
router.get('/pollution-filters', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested ecology alert filters`);

    const filters = [
      {
        value: 'wildlife-track',
        label: '野生动物活动',
        icon: '🐾',
        description: '野生动物走私活动监测'
      },
      {
        value: 'habitat-damage',
        label: '栖息地破坏',
        icon: '🌿',
        description: '栖息地破坏监测'
      },
      {
        value: 'border-anomaly',
        label: '边境走私异常',
        icon: '🛡️',
        description: '边境走私异常监测'
      },
      {
        value: 'water-quality',
        label: '水质异常',
        icon: '💧',
        description: '跨境水质异常监测'
      }
    ];

    res.json({
      success: true,
      data: { filters }
    });
  } catch (error) {
    logger.error(`Error fetching ecology alert filters: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取预警筛选失败',
      error: error.message
    });
  }
});

/**
 * GET /api/gis/statistics
 * 获取GIS统计数据
 */
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const { category } = req.query;

    logger.info(`User ${req.user.id} requested GIS statistics`);

    // 模拟数据
    const statistics = {
      total_monitoring_points: 150,
      online_points: 145,
      offline_points: 5,
      total_pollution_sources: 25,
      critical_alerts: 3,
      high_alerts: 8,
      medium_alerts: 15,
      low_alerts: 20,
      by_type: {
        water: { points: 40, sources: 8, alerts: 5 },
        air: { points: 50, sources: 10, alerts: 12 },
        soil: { points: 35, sources: 5, alerts: 8 },
        waste: { points: 25, sources: 2, alerts: 3 }
      }
    };

    res.json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    logger.error(`Error fetching GIS statistics: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取GIS统计失败',
      error: error.message
    });
  }
});

export default router;
