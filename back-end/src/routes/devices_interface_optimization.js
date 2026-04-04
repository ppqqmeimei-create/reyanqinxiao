/**
 * 设备API - 优化版本
 * 文件: back-end/src/routes/devices_interface_optimization.js
 * 功能: 提供设备管理、健康度评估、离线地图管理等API
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/devices/list
 * 获取设备列表
 */
router.get('/list', authenticate, async (req, res) => {
  try {
    const { category, status, page = 1, limit = 20 } = req.query;
    logger.info(`User ${req.user.id} requested devices list`);

    // 这里需要导入Device模型
    // let query = {};
    // if (category) query.category = category;
    // if (status) query.status = status;
    // const skip = (page - 1) * limit;
    // const devices = await Device.find(query)
    //   .skip(skip)
    //   .limit(parseInt(limit))
    //   .sort({ status: 1, health_score: -1 });
    // const total = await Device.countDocuments(query);

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
    logger.error(`Error fetching devices: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取设备列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/devices/stats
 * 获取设备统计信息
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested device stats`);

    // 这里需要导入Device模型
    // const stats = await Device.aggregate([
    //   {
    //     $group: {
    //       _id: '$category',
    //       total: { $sum: 1 },
    //       online: { $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] } },
    //       offline: { $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] } },
    //       warning: { $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] } },
    //       avgHealth: { $avg: '$health_score' }
    //     }
    //   }
    // ]);

    // 模拟数据
    const stats = {
      total: 0,
      online: 0,
      offline: 0,
      warning: 0,
      byCategory: {
        ecology: { total: 0, online: 0, offline: 0, warning: 0, avgHealth: 0 },
        fooddrug: { total: 0, online: 0, offline: 0, warning: 0, avgHealth: 0 },
        enforcement: { total: 0, online: 0, offline: 0, warning: 0, avgHealth: 0 }
      },
      systemHealth: 0
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    logger.error(`Error fetching device stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取设备统计失败',
      error: error.message
    });
  }
});

/**
 * GET /api/devices/:id
 * 获取设备详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const deviceId = req.params.id;
    logger.info(`User ${req.user.id} requested device ${deviceId}`);

    // 这里需要导入Device模型
    // const device = await Device.findById(deviceId)
    //   .populate('edge_node_id', 'node_name status');

    // 模拟数据
    const device = {
      id: deviceId,
      deviceId: 'DEV-001',
      deviceName: '水质传感器-A01',
      category: 'ecology',
      deviceType: 'water-sensor',
      status: 'online',
      healthScore: 85,
      batteryLevel: 85,
      signalStrength: 92,
      latitude: 30.2741,
      longitude: 120.1551,
      locationAddress: '浙江省杭州市某地',
      lastHeartbeat: new Date(),
      lastActive: new Date(),
      edgeNodeId: 'EDGE-01',
      firmwareVersion: '1.2.3'
    };

    res.json({
      success: true,
      data: { device }
    });
  } catch (error) {
    logger.error(`Error fetching device: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取设备详情失败',
      error: error.message
    });
  }
});

/**
 * GET /api/devices/:id/parameters
 * 获取设备参数
 */
router.get('/:id/parameters', authenticate, async (req, res) => {
  try {
    const deviceId = req.params.id;
    logger.info(`User ${req.user.id} requested parameters for device ${deviceId}`);

    // 这里需要导入DeviceParameter模型
    // const parameters = await DeviceParameter.find({ device_id: deviceId })
    //   .sort({ recorded_at: -1 })
    //   .limit(100);

    // 模拟数据
    const parameters = [];

    res.json({
      success: true,
      data: { parameters }
    });
  } catch (error) {
    logger.error(`Error fetching device parameters: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取设备参数失败',
      error: error.message
    });
  }
});

/**
 * POST /api/devices/:id/health
 * 更新设备健康度
 */
router.post('/:id/health', authenticate, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { batteryLevel, signalStrength } = req.body;

    if (batteryLevel === undefined || signalStrength === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    logger.info(`User ${req.user.id} updating health for device ${deviceId}`);

    // 计算健康度评分：电池权重40%，信号权重60%
    const healthScore = Math.round((batteryLevel * 0.4 + signalStrength * 0.6));

    // 这里需要导入Device模型
    // const device = await Device.findByIdAndUpdate(
    //   deviceId,
    //   {
    //     health_score: healthScore,
    //     battery_level: batteryLevel,
    //     signal_strength: signalStrength,
    //     last_active: new Date()
    //   },
    //   { new: true }
    // );

    // 模拟数据
    const device = {
      id: deviceId,
      healthScore,
      batteryLevel,
      signalStrength,
      lastActive: new Date()
    };

    res.json({
      success: true,
      data: { device }
    });
  } catch (error) {
    logger.error(`Error updating device health: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新设备健康度失败',
      error: error.message
    });
  }
});

/**
 * GET /api/devices/storage/info
 * 获取存储信息
 */
router.get('/storage/info', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested storage info`);

    // 这里需要导入DeviceStorage模型
    // const storages = await DeviceStorage.find();

    // 模拟数据
    const storages = [];
    const totalCapacity = 512;
    const usedCapacity = 256;
    const availableCapacity = totalCapacity - usedCapacity;

    res.json({
      success: true,
      data: {
        storages,
        summary: {
          totalCapacity,
          usedCapacity,
          availableCapacity,
          usagePercentage: Math.round((usedCapacity / totalCapacity) * 100)
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching storage info: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取存储信息失败',
      error: error.message
    });
  }
});

/**
 * POST /api/devices/storage/cleanup
 * 清理已上传采样数据
 */
router.post('/storage/cleanup', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} cleaning up storage`);

    // 这里需要导入DeviceStorage模型
    // const result = await DeviceStorage.updateMany(
    //   { uploaded_count: { $gt: 0 } },
    //   {
    //     $set: {
    //       used_capacity: { $subtract: ['$used_capacity', { $multiply: ['$uploaded_count', 1] }] },
    //       available_capacity: { $add: ['$available_capacity', { $multiply: ['$uploaded_count', 1] }] },
    //       uploaded_count: 0,
    //       last_cleanup: new Date()
    //     }
    //   }
    // );

    // 模拟数据
    const freedSpace = 128; // MB
    const result = {
      modifiedCount: 1,
      freedSpace
    };

    res.json({
      success: true,
      data: {
        message: `已清理 ${freedSpace}MB 存储空间`,
        freedSpace,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    logger.error(`Error cleaning up storage: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '清理存储失败',
      error: error.message
    });
  }
});

/**
 * GET /api/devices/maps/list
 * 获取离线地图列表
 */
router.get('/maps/list', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested offline maps list`);

    // 这里需要导入OfflineMap模型
    // const maps = await OfflineMap.find().sort({ created_at: -1 });

    // 模拟数据
    const maps = [
      {
        id: 1,
        mapName: '东兴段地图',
        mapRegion: '东兴',
        mapCode: 'MAP-DX-001',
        fileSize: 512000000,
        version: '1.0.0',
        downloadCount: 45
      },
      {
        id: 2,
        mapName: '凭祥段地图',
        mapRegion: '凭祥',
        mapCode: 'MAP-PX-001',
        fileSize: 480000000,
        version: '1.0.0',
        downloadCount: 38
      },
      {
        id: 3,
        mapName: '那坡段地图',
        mapRegion: '那坡',
        mapCode: 'MAP-NP-001',
        fileSize: 560000000,
        version: '1.0.0',
        downloadCount: 52
      }
    ];

    res.json({
      success: true,
      data: { maps }
    });
  } catch (error) {
    logger.error(`Error fetching offline maps: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取离线地图列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/devices/maps/:id/download
 * 下载离线地图
 */
router.post('/maps/:id/download', authenticate, async (req, res) => {
  try {
    const mapId = req.params.id;
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: '缺少设备ID'
      });
    }

    logger.info(`User ${req.user.id} downloading map ${mapId} to device ${deviceId}`);

    // 这里需要导入UserMapDownload模型
    // const download = await UserMapDownload.create({
    //   user_id: req.user.id,
    //   map_id: mapId,
    //   device_id: deviceId,
    //   download_status: 'pending'
    // });

    // 模拟数据
    const download = {
      id: Math.floor(Math.random() * 10000),
      userId: req.user.id,
      mapId,
      deviceId,
      downloadStatus: 'pending',
      downloadProgress: 0,
      createdAt: new Date()
    };

    res.json({
      success: true,
      data: { download }
    });
  } catch (error) {
    logger.error(`Error downloading map: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '下载地图失败',
      error: error.message
    });
  }
});

/**
 * POST /api/devices/maps/:id/delete
 * 删除离线地图
 */
router.post('/maps/:id/delete', authenticate, async (req, res) => {
  try {
    const mapId = req.params.id;
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: '缺少设备ID'
      });
    }

    logger.info(`User ${req.user.id} deleting map ${mapId} from device ${deviceId}`);

    // 这里需要导入UserMapDownload模型
    // const result = await UserMapDownload.deleteOne({
    //   map_id: mapId,
    //   device_id: deviceId,
    //   user_id: req.user.id
    // });

    // 模拟数据
    const result = {
      deletedCount: 1,
      freedSpace: 512 // MB
    };

    res.json({
      success: true,
      data: {
        message: `已删除地图，释放 ${result.freedSpace}MB 空间`,
        freedSpace: result.freedSpace
      }
    });
  } catch (error) {
    logger.error(`Error deleting map: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '删除地图失败',
      error: error.message
    });
  }
});

/**
 * GET /api/devices/edge-nodes
 * 获取边缘节点列表
 */
router.get('/edge-nodes', authenticate, async (req, res) => {
  try {
    logger.info(`User ${req.user.id} requested edge nodes`);

    // 这里需要导入EdgeNode模型
    // const edgeNodes = await EdgeNode.find().sort({ status: 1 });

    // 模拟数据
    const edgeNodes = [
      {
        id: 1,
        edgeNodeId: 'EDGE-01',
        nodeName: '边缘节点-A区',
        nodeRegion: '北京',
        status: 'online',
        deviceCount: 12,
        cpuUsage: 45,
        memoryUsage: 62,
        storageUsage: 78
      },
      {
        id: 2,
        edgeNodeId: 'EDGE-02',
        nodeName: '边缘节点-B区',
        nodeRegion: '杭州',
        status: 'online',
        deviceCount: 8,
        cpuUsage: 38,
        memoryUsage: 55,
        storageUsage: 65
      }
    ];

    res.json({
      success: true,
      data: { edgeNodes }
    });
  } catch (error) {
    logger.error(`Error fetching edge nodes: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取边缘节点失败',
      error: error.message
    });
  }
});

export default router;
