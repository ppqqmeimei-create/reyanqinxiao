import express from 'express';
import Device from '../models/Device.js';
import Alert from '../models/Alert.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/gis/pollution-sources
 * 获取走私/生态预警点位（接口路径保留）
 */
router.get('/pollution-sources', authenticate, async (req, res) => {
  try {
    const pollutionSources = await Device.find({
      type: { $in: ['camera-visible', 'camera-infrared', 'smell'] }
    }).select('device_id name type location latitude longitude status battery signal_strength');

    res.json({
      success: true,
      data: {
        sources: pollutionSources
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取预警点位失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/gis/monitoring-points
 * 获取监测点
 */
router.get('/monitoring-points', authenticate, async (req, res) => {
  try {
    const monitoringPoints = await Device.find({
      type: { $in: ['water-monitor', 'air-monitor', 'soil-monitor'] }
    }).select('device_id name type location latitude longitude status metadata');

    res.json({
      success: true,
      data: {
        points: monitoringPoints
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取监测点失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/gis/report-pollution
 * 上报走私/生态预警（接口路径保留，语义对齐）
 */
router.post('/report-pollution', authenticate, async (req, res) => {
  try {
    const {
      type, category, location, latitude, longitude,
      pollutant_type, pollutant_value, standard_value,
      description, affected_population
    } = req.body;

    if (!type || !category || !location || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    // 计算风险评分
    const concentrationFactor = pollutant_value && standard_value 
      ? Math.min((pollutant_value / standard_value) * 30, 100)
      : 0;
    const populationFactor = affected_population 
      ? Math.min((affected_population / 10000) * 30, 100)
      : 0;
    const riskScore = Math.min(concentrationFactor + populationFactor + 40, 100);

    // 确定预警级别
    let level = 'info';
    if (riskScore >= 80) level = 'critical';
    else if (riskScore >= 60) level = 'warning';

    const alert = new Alert({
      title: `${category === 'ecology' ? '生态' : category === 'enforcement' ? '走私' : '食药'}预警上报 - ${location}`,
      description,
      level,
      type,
      category,
      location,
      latitude,
      longitude,
      risk_score: Math.round(riskScore),
      pollutant_type,
      pollutant_value,
      standard_value,
      exceed_ratio: pollutant_value && standard_value ? (pollutant_value / standard_value).toFixed(2) : null,
      affected_population,
      source: 'manual',
      created_by: req.user.id
    });

    await alert.save();

    res.status(201).json({
      success: true,
      message: '预警上报成功',
      data: {
        alert,
        risk_score: Math.round(riskScore),
        level
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '上报预警失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/gis/alerts-on-map
 * 获取地图上的预警
 */
router.get('/alerts-on-map', authenticate, async (req, res) => {
  try {
    const alerts = await Alert.find({
      latitude: { $exists: true },
      longitude: { $exists: true }
    }).select('title level location latitude longitude created_at status');

    res.json({
      success: true,
      data: {
        alerts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取地图预警失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/gis/heatmap
 * 获取热力图数据
 */
router.get('/heatmap', authenticate, async (req, res) => {
  try {
    const heatmapData = await Alert.find({
      latitude: { $exists: true },
      longitude: { $exists: true },
      level: { $in: ['critical', 'warning'] }
    }).select('latitude longitude risk_score level');

    const points = heatmapData.map(alert => ({
      lat: alert.latitude,
      lng: alert.longitude,
      value: alert.risk_score,
      level: alert.level
    }));

    res.json({
      success: true,
      data: {
        points
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取热力图数据失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/gis/nearby-alerts
 * 获取附近的预警
 */
router.get('/nearby-alerts', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少坐标参数'
      });
    }

    const alerts = await Alert.find({
      latitude: { $exists: true },
      longitude: { $exists: true }
    });

    // 计算距离（简单的欧几里得距离）
    const nearbyAlerts = alerts.filter(alert => {
      const distance = Math.sqrt(
        Math.pow(alert.latitude - latitude, 2) + 
        Math.pow(alert.longitude - longitude, 2)
      ) * 111000; // 转换为米

      return distance <= radius;
    }).sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.latitude - latitude, 2) + 
        Math.pow(a.longitude - longitude, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.latitude - latitude, 2) + 
        Math.pow(b.longitude - longitude, 2)
      );
      return distA - distB;
    });

    res.json({
      success: true,
      data: {
        alerts: nearbyAlerts.slice(0, 20)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取附近预警失败',
      error: error.message
    });
  }
});

export default router;
