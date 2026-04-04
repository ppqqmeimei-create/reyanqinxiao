/**
 * 预警API - 优化版本
 * 文件: back-end/src/routes/alerts_optimization.js
 * 功能: 提供预警查询、风险评分、法律依据等API
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/alerts/calculate-risk-score
 * 计算风险评分
 */
router.post('/calculate-risk-score', async (req, res) => {
  try {
    const { concentration, standardValue, affectedPopulation, duration, timestamp, category } = req.body;

    if (!concentration || !standardValue) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    let score = 0;

    // 1. 风险评分计算权重 (40分)
    const exceedRatio = concentration / standardValue;
    if (exceedRatio >= 10) {
      score += 40;
    } else if (exceedRatio >= 5) {
      score += 30;
    } else if (exceedRatio >= 2) {
      score += 20;
    } else if (exceedRatio >= 1) {
      score += 10;
    }

    // 2. 影响人口权重 (30分)
    if (affectedPopulation) {
      if (affectedPopulation >= 10000) {
        score += 30;
      } else if (affectedPopulation >= 5000) {
        score += 25;
      } else if (affectedPopulation >= 1000) {
        score += 20;
      } else if (affectedPopulation >= 100) {
        score += 10;
      }
    }

    // 3. 时间因素权重 (20分)
    if (timestamp) {
      const hour = new Date(timestamp).getHours();
      if (hour >= 22 || hour < 6) {
        score += 20;
      } else if (hour >= 18 || hour < 8) {
        score += 15;
      } else {
        score += 10;
      }
    }

    // 4. 持续时间权重 (10分)
    if (duration) {
      if (duration >= 3600) {
        score += 10;
      } else if (duration >= 1800) {
        score += 7;
      } else if (duration >= 600) {
        score += 5;
      }
    }

    // ── 广西边境敏感因子加权 ──
    let guangxiBorderBoost = 0;
    const lat = parseFloat(req.body.latitude);
    const lon = parseFloat(req.body.longitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      const KEY_PORTS = [
        { lat: 22.1128, lon: 106.7612 },
        { lat: 21.5450, lon: 107.9720 }
      ];
      const nearPort = KEY_PORTS.some(p => {
        const d = Math.sqrt(Math.pow((lat - p.lat) * 111, 2) + Math.pow((lon - p.lon) * 111 * Math.cos(lat * Math.PI / 180), 2));
        return d <= 5;
      });
      if (nearPort) guangxiBorderBoost = Math.round(score * 0.2);
    }

    const finalScore = Math.min(Math.round(score) + guangxiBorderBoost, 100);

    // 确定风险等级
    let level = 'low';
    if (finalScore >= 80) {
      level = 'critical';
    } else if (finalScore >= 60) {
      level = 'high';
    } else if (finalScore >= 40) {
      level = 'medium';
    }

    logger.info(`Risk score calculated: ${finalScore} (${level})`);

    res.json({
      success: true,
      data: {
        riskScore: finalScore,
        level,
        exceedRatio: (exceedRatio).toFixed(2),
        recommendation: generateRecommendation(finalScore, category)
      }
    });
  } catch (error) {
    logger.error(`Error calculating risk score: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '风险评分计算失败',
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/list
 * 获取预警列表
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, level, status } = req.query;

    logger.info(`User ${req.user.id} requested alerts list`);

    // 这里需要导入Alert模型
    // let query = {};
    // if (category) query.category = category;
    // if (level) query.level = level;
    // if (status === 'handled') query.handled = true;
    // if (status === 'unhandled') query.handled = false;
    // const skip = (page - 1) * limit;
    // const alerts = await Alert.find(query)
    //   .skip(skip)
    //   .limit(parseInt(limit))
    //   .sort({ riskScore: -1, timestamp: -1 });
    // const total = await Alert.countDocuments(query);

    // 模拟数据
    const alerts = [];
    const total = 0;

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching alerts: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取预警列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/summary
 * 获取预警统计
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    logger.info(`User ${req.user.id} requested alerts summary`);

    // 这里需要导入Alert模型
    // let query = {};
    // if (category) query.category = category;
    // if (startDate && endDate) {
    //   query.timestamp = {
    //     $gte: new Date(startDate),
    //     $lte: new Date(endDate)
    //   };
    // }
    // const alerts = await Alert.find(query);

    // 模拟数据
    const summary = {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      handled: 0,
      unhandled: 0,
      by_category: {
        ecology: 0,
        fooddrug: 0,
        enforcement: 0
      },
      by_type: {}
    };

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    logger.error(`Error fetching alerts summary: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取预警统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/:id
 * 获取预警详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`User ${req.user.id} requested alert detail: ${id}`);

    // 这里需要导入Alert模型
    // const alert = await Alert.findById(id);

    // 模拟数据
    const alert = {
      id,
      caseNumber: `CASE-${id}`,
      category: 'ecology',
      type: 'water',
      timestamp: new Date(),
      location: '某地',
      concentration: 50,
      standardValue: 10,
      exceedRatio: 5,
      affectedPopulation: 5000,
      riskScore: 85,
      level: 'critical',
      description: '疑似走私活体预警',
      handled: false
    };

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: '预警不存在'
      });
    }

    res.json({
      success: true,
      data: { alert }
    });
  } catch (error) {
    logger.error(`Error fetching alert detail: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取预警详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/:id/handle
 * 处理预警（创建任务）
 */
router.post('/:id/handle', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    logger.info(`User ${req.user.id} handling alert: ${id}`);

    // 这里需要导入Alert和Task模型
    // const alert = await Alert.findById(id);
    // if (!alert) {
    //   return res.status(404).json({
    //     success: false,
    //     message: '预警不存在'
    //   });
    // }

    // // 创建执法任务
    // const task = await Task.create({
    //   alertId: id,
    //   userId: req.user.id,
    //   category: alert.category,
    //   type: alert.type,
    //   location: alert.location,
    //   priority: alert.level,
    //   status: 'pending',
    //   notes: notes
    // });

    // // 更新预警状态
    // alert.handled = true;
    // alert.handledBy = req.user.id;
    // alert.handledAt = new Date();
    // await alert.save();

    // 模拟数据
    const task = {
      id: `TASK-${Date.now()}`,
      alertId: id,
      userId: req.user.id,
      status: 'pending',
      createdAt: new Date()
    };

    res.json({
      success: true,
      data: {
        task,
        message: '任务创建成功'
      }
    });
  } catch (error) {
    logger.error(`Error handling alert: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '处理预警失败',
      error: error.message
    });
  }
});

/**
 * POST /api/alerts/:id/ignore
 * 忽略预警
 */
router.post('/:id/ignore', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    logger.info(`User ${req.user.id} ignoring alert: ${id}`);

    // 这里需要导入Alert模型
    // const alert = await Alert.findById(id);
    // if (!alert) {
    //   return res.status(404).json({
    //     success: false,
    //     message: '预警不存在'
    //   });
    // }

    // alert.ignored = true;
    // alert.ignoredBy = req.user.id;
    // alert.ignoredAt = new Date();
    // alert.ignoreReason = reason;
    // await alert.save();

    res.json({
      success: true,
      data: {
        message: '预警已忽略'
      }
    });
  } catch (error) {
    logger.error(`Error ignoring alert: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '忽略预警失败',
      error: error.message
    });
  }
});

/**
 * GET /api/alerts/legal-basis/:category
 * 获取法律依据
 */
router.get('/legal-basis/:category', async (req, res) => {
  try {
    const { category } = req.params;

    logger.info(`Requested legal basis for category: ${category}`);

    const legalBasis = {
      ecology: [
        {
          law: '《野生动物保护法》',
          articles: ['第十条', '第二十条', '第三十条'],
          penalties: {
            minor: '1000-5000元',
            moderate: '5000-50000元',
            severe: '50000-500000元或有期徒刑'
          }
        },
        {
          law: '《刑法》第三百四十一条（走私珍贵动物罪）',
          articles: ['情节较轻', '情节严重', '情节特别严重'],
          penalties: {
            minor: '5年以下有期徒刑',
            moderate: '5-10年有期徒刑',
            severe: '10年以上有期徒刑或无期徒刑'
          }
        }
      ],
      fooddrug: [
        {
          law: '《食品安全法》',
          articles: ['第三十四条', '第四十八条', '第六十三条'],
          penalties: {
            minor: '1000-10000元',
            moderate: '10000-100000元',
            severe: '100000-1000000元'
          }
        }
      ],
      enforcement: [
        {
          law: '《野生动物保护法》',
          articles: ['第二十三条', '第二十四条', '第三百四十一条'],
          penalties: {
            minor: '罚款',
            moderate: '没收违法所得',
            severe: '从重处罚'
          }
        },
        {
          law: '《海关法》',
          articles: ['第八十二条', '第三条', '第十条'],
          penalties: {
            minor: '罚款',
            moderate: '拘役',
            severe: '有期徒刑'
          }
        },
        {
          law: '《边境管理条例》',
          articles: ['第十五条', '第二十条', '第三十条'],
          penalties: {
            minor: '警告',
            moderate: '行政处罚',
            severe: '移送司法机关'
          }
        },
        {
          law: '《广西壮族自治区野生动物保护条例》',
          articles: ['第二十六条', '第二十八条', '第三十二条', '第三十四条'],
          penalties: {
            minor: '警告+没收违法所得',
            moderate: '没收活体+货値金额五倍罚款',
            severe: '移送公安机关，依法追究刑事责任'
          }
        }
      ]
    };

    const basis = legalBasis[category] || [];

    res.json({
      success: true,
      data: { legalBasis: basis }
    });
  } catch (error) {
    logger.error(`Error fetching legal basis: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取法律依据失败',
      error: error.message
    });
  }
});

/**
 * 生成处罚建议
 */
function generateRecommendation(riskScore, category) {
  let severity = 'minor';
  if (riskScore >= 80) {
    severity = 'severe';
  } else if (riskScore >= 60) {
    severity = 'moderate';
  }

  const recommendations = {
    ecology: {
      minor: '建议罚款1000-5000元',
      moderate: '建议罚款5000-50000元',
      severe: '建议罚款50000-500000元，可能需要停产整改'
    },
    fooddrug: {
      minor: '建议罚款1000-10000元',
      moderate: '建议罚款10000-100000元',
      severe: '建议罚款100000-1000000元，可能需要停业整改'
    },
    enforcement: {
      minor: '建议罚款5000-50000元',
      moderate: '建议罚款50000-500000元',
      severe: '建议罚款500000-5000000元，可能需要刑事处罚'
    }
  };

  return recommendations[category]?.[severity] || '建议立即处理';
}

export default router;
