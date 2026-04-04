import express from 'express';
import Device from '../models/Device.js';
import Alert from '../models/Alert.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ===== 原有API =====

/**
 * GET /api/v1/gis/pollution-sources
 * 获取走私/生态预警点位
 */
router.get('/pollution-sources', authenticate, async (req, res) => {
  try {
    const pollutionSources = await Device.find({
      type: { $in: ['camera-visible', 'camera-infrared', 'smell'] }
    }).select('device_id name type location latitude longitude status battery signal_strength');

    res.json({
      success: true,
      data: {
        sources: pollutionSources,
        count: pollutionSources.length
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
        points: monitoringPoints,
        count: monitoringPoints.length
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
 * 上报走私/生态预警
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

    const concentrationFactor = pollutant_value && standard_value 
      ? Math.min((pollutant_value / standard_value) * 30, 100)
      : 0;
    const populationFactor = affected_population 
      ? Math.min((affected_population / 10000) * 30, 100)
      : 0;
    const riskScore = Math.min(concentrationFactor + populationFactor + 40, 100);

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
      status: 'pending'
    });

    await alert.save();

    res.json({
      success: true,
      data: { alert },
      message: '预警上报成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '上报预警失败',
      error: error.message
    });
  }
});

// ===== 新增API - 食品药品 =====

/**
 * GET /api/v1/gis/food-drug-alerts
 * 获取食品药品预警
 */
router.get('/food-drug-alerts', authenticate, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5, type } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: latitude, longitude'
      });
    }

    let query = {
      status: { $ne: 'resolved' }
    };

    if (type) {
      query.alert_type = type;
    }

    // 模拟地理查询 (实际应使用MongoDB地理查询)
    const alerts = [
      {
        id: 101,
        alert_type: 'food',
        risk_level: 'critical',
        latitude: parseFloat(latitude) + 0.01,
        longitude: parseFloat(longitude) + 0.01,
        product_name: '某品牌牛奶',
        manufacturer: '北京南宁某乳制品企业',
        description: '检测到不合格成分',
        status: 'pending'
      },
      {
        id: 102,
        alert_type: 'drug',
        risk_level: 'warning',
        latitude: parseFloat(latitude) - 0.01,
        longitude: parseFloat(longitude) - 0.01,
        product_name: '某感冒药',
        manufacturer: '上海凭祥某制药企业',
        description: '发现质量问题',
        status: 'pending'
      }
    ];

    res.json({
      success: true,
      data: {
        alerts: alerts,
        count: alerts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取食品药品预警失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/gis/food-drug-enterprises
 * 获取食品药品企业
 */
router.get('/food-drug-enterprises', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = {};
    if (type) {
      query.type = type;
    }

    // 模拟数据
    const enterprises = [
      {
        id: 1,
        name: '北京南宁某乳制品企业',
        type: 'food',
        latitude: 39.9042,
        longitude: 116.4074,
        address: '北京市朝阳区',
        risk_level: 'low',
        status: 'active'
      },
      {
        id: 2,
        name: '上海凭祥某制药企业',
        type: 'drug',
        latitude: 31.2304,
        longitude: 121.4737,
        address: '上海市浦东新区',
        risk_level: 'medium',
        status: 'active'
      },
      {
        id: 3,
        name: '深圳北海某化妆品企业',
        type: 'cosmetic',
        latitude: 22.5431,
        longitude: 114.0579,
        address: '深圳市南山区',
        risk_level: 'high',
        status: 'active'
      }
    ];

    res.json({
      success: true,
      data: {
        enterprises: enterprises,
        count: enterprises.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取食品药品企业失败',
      error: error.message
    });
  }
});

// ===== 新增API - 执法 =====

/**
 * GET /api/v1/gis/enforcement-officers
 * 获取执法人员
 */
router.get('/enforcement-officers', authenticate, async (req, res) => {
  try {
    const officers = [
      {
        id: 1,
        name: '张三',
        badge_number: '001',
        latitude: 39.9042,
        longitude: 116.4074,
        status: 'on_duty'
      },
      {
        id: 2,
        name: '李四',
        badge_number: '002',
        latitude: 39.9100,
        longitude: 116.4100,
        status: 'on_duty'
      },
      {
        id: 4,
        name: '赵六',
        badge_number: '004',
        latitude: 39.9300,
        longitude: 116.4300,
        status: 'on_duty'
      }
    ];

    res.json({
      success: true,
      data: {
        officers: officers,
        count: officers.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取执法人员失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/gis/patrol-routes
 * 获取巡逻路线
 */
router.get('/patrol-routes', authenticate, async (req, res) => {
  try {
    const { officer_id } = req.query;
    
    const routes = [
      {
        id: 1,
        officer_id: 1,
        route_data: [
          { latitude: 39.9042, longitude: 116.4074 },
          { latitude: 39.9100, longitude: 116.4100 }
        ],
        status: 'active',
        distance: 5.2,
        duration: 30
      },
      {
        id: 2,
        officer_id: 2,
        route_data: [
          { latitude: 39.9100, longitude: 116.4100 },
          { latitude: 39.9200, longitude: 116.4200 }
        ],
        status: 'active',
        distance: 6.8,
        duration: 40
      }
    ];

    res.json({
      success: true,
      data: {
        routes: routes,
        count: routes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取巡逻路线失败',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/gis/enforcement-cases
 * 获取执法案件
 */
router.get('/enforcement-cases', authenticate, async (req, res) => {
  try {
    const { status = 'open' } = req.query;
    
    const cases = [
      {
        id: 1,
        title: '某企业走私/生态违法',
        description: '检测到超标排放',
        latitude: 39.9042,
        longitude: 116.4074,
        officer_id: 1,
        status: 'open'
      },
      {
        id: 2,
        title: '食品安全隐患',
        description: '发现不合格产品',
        latitude: 39.9100,
        longitude: 116.4100,
        officer_id: 2,
        status: 'investigating'
      }
    ];

    res.json({
      success: true,
      data: {
        cases: cases,
        count: cases.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取执法案件失败',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/gis/update-officer-location
 * 更新执法人员位置
 */
router.post('/update-officer-location', authenticate, async (req, res) => {
  try {
    const { officer_id, latitude, longitude } = req.body;
    
    if (!officer_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const officer = {
      id: officer_id,
      latitude,
      longitude,
      last_update: new Date()
    };

    res.json({
      success: true,
      data: { officer },
      message: '位置更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新位置失败',
      error: error.message
    });
  }
});

export default router;
