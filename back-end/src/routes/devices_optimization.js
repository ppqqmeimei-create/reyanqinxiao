/**
 * 设备API - 优化版本
 * 文件: back-end/src/routes/devices_optimization.js
 * 功能: 提供设备分类、健康度、位置追踪等API
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/devices/categories/list
 * 获取设备分类列表
 */
router.get('/categories/list', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested device categories`);
    
    // 这里需要导入DeviceCategory模型
    // const categories = await DeviceCategory.find().sort({ sort_order: 1 });
    
    // 模拟数据
    const categories = [
      {
        key: 'ecology',
        name: '环保设备',
        icon: '🌍',
        color: '#10b981',
        types: [
          { key: 'water-sensor', name: '水质传感器', icon: '💧' },
          { key: 'air-sensor', name: '空气传感器', icon: '💨' },
          { key: 'soil-sensor', name: '土壤传感器', icon: '🌱' },
          { key: 'waste-monitor', name: '废弃物监测', icon: '♻️' }
        ]
      },
      {
        key: 'fooddrug',
        name: '食品药品设备',
        icon: '🏥',
        color: '#f59e0b',
        types: [
          { key: 'temperature-sensor', name: '温度传感器', icon: '🌡️' },
          { key: 'humidity-sensor', name: '湿度传感器', icon: '💧' },
          { key: 'quality-detector', name: '质量检测器', icon: '🔬' },
          { key: 'safety-monitor', name: '安全监测器', icon: '🚨' }
        ]
      },
      {
        key: 'enforcement',
        name: '执法设备',
        icon: '👮',
        color: '#ef4444',
        types: [
          { key: 'gps-tracker', name: 'GPS追踪器', icon: '📍' },
          { key: 'camera-hd', name: '高清摄像头', icon: '📹' },
          { key: 'audio-recorder', name: '音频记录器', icon: '🎙️' },
          { key: 'evidence-collector', name: '证据采集器', icon: '📦' }
        ]
      }
    ];
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    logger.error(`Error fetching device categories: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取设备分类失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/devices/by-category/:category
 * 按分类获取设备列表
 */
router.get('/by-category/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // 验证分类
    const validCategories = ['ecology', 'fooddrug', 'enforcement'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: '无效的设备分类'
      });
    }
    
    logger.info(`User ${req.user.id} requested devices for category: ${category}`);
    
    // 这里需要导入Device模型
    // const skip = (page - 1) * limit;
    // const devices = await Device.find({ category })
    //   .skip(skip)
    //   .limit(parseInt(limit))
    //   .sort({ created_at: -1 });
    // const total = await Device.countDocuments({ category });
    
    // 模拟数据
    const devices = [];
    const total = 0;
    
    res.json({
      success: true,
      data: {
        devices,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching devices by category: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取分类设备失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/devices/health/summary
 * 获取设备健康度统计
 */
router.get('/health/summary', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested device health summary`);
    
    // 这里需要导入DeviceHealth模型
    // const health = await DeviceHealth.find();
    // const summary = {
    //   total: health.length,
    //   healthy: health.filter(h => h.status === 'healthy').length,
    //   warning: health.filter(h => h.status === 'warning').length,
    //   critical: health.filter(h => h.status === 'critical').length,
    //   avgHealthScore: health.reduce((sum, h) => sum + h.health_score, 0) / health.length,
    //   avgBattery: health.reduce((sum, h) => sum + (h.battery_level || 0), 0) / health.length,
    //   avgSignal: health.reduce((sum, h) => sum + (h.signal_strength || 0), 0) / health.length
    // };
    
    // 模拟数据
    const summary = {
      total: 0,
      healthy: 0,
      warning: 0,
      critical: 0,
      avgHealthScore: 0,
      avgBattery: 0,
      avgSignal: 0
    };
    
    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    logger.error(`Error fetching device health summary: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取设备健康度统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/devices/health/by-category/:category
 * 按分类获取设备健康度统计
 */
router.get('/health/by-category/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;
    
    // 验证分类
    const validCategories = ['ecology', 'fooddrug', 'enforcement'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: '无效的设备分类'
      });
    }
    
    logger.info(`User ${req.user.id} requested health for category: ${category}`);
    
    // 这里需要导入Device和DeviceHealth模型
    // const devices = await Device.find({ category });
    // const deviceIds = devices.map(d => d.id);
    // const health = await DeviceHealth.find({ device_id: { $in: deviceIds } });
    
    // 模拟数据
    const health = [];
    
    res.json({
      success: true,
      data: { health }
    });
  } catch (error) {
    logger.error(`Error fetching category health: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取分类设备健康度失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/devices/location/latest
 * 获取最新的设备位置信息
 */
router.get('/location/latest', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    
    logger.info(`User ${req.user.id} requested latest device locations`);
    
    // 这里需要导入DeviceLocation模型
    // let query = {};
    // if (category) {
    //   const devices = await Device.find({ category });
    //   query.device_id = { $in: devices.map(d => d.id) };
    // }
    // const locations = await DeviceLocation.find(query)
    //   .sort({ created_at: -1 })
    //   .limit(100);
    
    // 模拟数据
    const locations = [];
    
    res.json({
      success: true,
      data: { locations }
    });
  } catch (error) {
    logger.error(`Error fetching device locations: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取设备位置失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/devices/:id/location
 * 更新设备位置
 */
router.post('/:id/location', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, address } = req.body;
    
    // 验证坐标
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '缺少位置信息'
      });
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: '坐标范围无效'
      });
    }
    
    logger.info(`User ${req.user.id} updated location for device ${id}`);
    
    // 这里需要导入DeviceLocation模型
    // const location = await DeviceLocation.create({
    //   device_id: id,
    //   latitude,
    //   longitude,
    //   accuracy,
    //   address
    // });
    
    // 模拟数据
    const location = {
      device_id: id,
      latitude,
      longitude,
      accuracy,
      address,
      created_at: new Date()
    };
    
    res.json({
      success: true,
      data: { location }
    });
  } catch (error) {
    logger.error(`Error updating device location: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新设备位置失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/devices/:id/evidence
 * 获取设备采集的证据
 */
router.get('/:id/evidence', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    
    logger.info(`User ${req.user.id} requested evidence for device ${id}`);
    
    // 这里需要导入DeviceEvidence模型
    // const skip = (page - 1) * limit;
    // let query = { device_id: id };
    // if (type) query.evidence_type = type;
    // const evidence = await DeviceEvidence.find(query)
    //   .skip(skip)
    //   .limit(parseInt(limit))
    //   .sort({ created_at: -1 });
    // const total = await DeviceEvidence.countDocuments(query);
    
    // 模拟数据
    const evidence = [];
    const total = 0;
    
    res.json({
      success: true,
      data: {
        evidence,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching device evidence: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取设备证据失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/devices/:id/evidence
 * 上传设备证据
 */
router.post('/:id/evidence', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { evidence_type, file_path, file_size, duration, hash_value } = req.body;
    
    // 验证证据类型
    const validTypes = ['video', 'audio', 'photo'];
    if (!validTypes.includes(evidence_type)) {
      return res.status(400).json({
        success: false,
        message: '无效的证据类型'
      });
    }
    
    logger.info(`User ${req.user.id} uploaded evidence for device ${id}`);
    
    // 这里需要导入DeviceEvidence模型
    // const evidence = await DeviceEvidence.create({
    //   device_id: id,
    //   evidence_type,
    //   file_path,
    //   file_size,
    //   duration,
    //   hash_value
    // });
    
    // 模拟数据
    const evidence = {
      device_id: id,
      evidence_type,
      file_path,
      file_size,
      duration,
      hash_value,
      created_at: new Date()
    };
    
    res.json({
      success: true,
      data: { evidence }
    });
  } catch (error) {
    logger.error(`Error uploading device evidence: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '上传设备证据失败',
      error: error.message
    });
  }
});

export default router;
