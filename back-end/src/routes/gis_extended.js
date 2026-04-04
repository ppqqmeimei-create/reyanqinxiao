import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * ===== 食品药品API =====
 */

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
        message: '缺少必要参数'
      });
    }

    // 模拟数据 - 实际应从数据库查询
    const alerts = [
      {
        id: 101,
        alert_type: 'food',
        risk_level: 'critical',
        product_name: '某品牌牛奶',
        manufacturer: '北京南宁某乳制品企业',
        latitude: parseFloat(latitude) + 0.01,
        longitude: parseFloat(longitude) + 0.01,
        description: '检测到不合格成分',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 102,
        alert_type: 'drug',
        risk_level: 'warning',
        product_name: '某感冒药',
        manufacturer: '上海凭祥某制药企业',
        latitude: parseFloat(latitude) + 0.02,
        longitude: parseFloat(longitude) + 0.02,
        description: '发现质量问题',
        status: 'pending',
        created_at: new Date().toISOString()
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

    const filtered = type ? enterprises.filter(e => e.type === type) : enterprises;

    res.json({
      success: true,
      data: {
        enterprises: filtered,
        count: filtered.length
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

/**
 * ===== 执法API =====
 */

/**
 * GET /api/v1/gis/enforcement-officers
 * 获取执法人员
 */
router.get('/enforcement-officers', authenticate, async (req, res) => {
  try {
    // 模拟数据
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
        id: 3,
        name: '王五',
        badge_number: '003',
        latitude: 39.9200,
        longitude: 116.4200,
        status: 'off_duty'
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
    
    // 模拟数据
    const routes = [
      {
        id: 1,
        officer_id: 1,
        route_data: [
          { latitude: 39.9042, longitude: 116.4074 },
          { latitude: 39.9100, longitude: 116.4100 },
          { latitude: 39.9150, longitude: 116.4150 }
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
          { latitude: 39.9200, longitude: 116.4200 },
          { latitude: 39.9250, longitude: 116.4250 }
        ],
        status: 'active',
        distance: 6.8,
        duration: 40
      }
    ];

    const filtered = officer_id ? routes.filter(r => r.officer_id == officer_id) : routes;

    res.json({
      success: true,
      data: {
        routes: filtered,
        count: filtered.length
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
    
    // 模拟数据
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
      },
      {
        id: 3,
        title: '环境违法行为',
        description: '未经许可排放',
        latitude: 39.9200,
        longitude: 116.4200,
        officer_id: 3,
        status: 'closed'
      }
    ];

    const filtered = cases.filter(c => c.status === status);

    res.json({
      success: true,
      data: {
        cases: filtered,
        count: filtered.length
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

    // 模拟更新
    const officer = {
      id: officer_id,
      latitude,
      longitude,
      last_update: new Date().toISOString()
    };

    res.json({
      success: true,
      data: { officer }
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
