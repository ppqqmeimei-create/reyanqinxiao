import express from 'express';
import { fn, col } from 'sequelize';
import Device, { DeviceMetadata } from '../models/Device.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/devices
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;
    const { status, type } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const { count, rows } = await Device.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        devices: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取设备列表失败', error: error.message });
  }
});

/**
 * GET /api/v1/devices/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const total = await Device.count();

    const byStatusRows = await Device.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    const byTypeRows = await Device.findAll({
      attributes: ['type', [fn('COUNT', col('id')), 'count']],
      group: ['type'],
      raw: true
    });

    const by_status = Object.fromEntries(byStatusRows.map((r) => [r.status, Number(r.count)]));
    const by_type = Object.fromEntries(byTypeRows.map((r) => [r.type, Number(r.count)]));

    res.json({ success: true, data: { total, by_status, by_type } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计失败', error: error.message });
  }
});

/**
 * GET /api/v1/devices/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id, {
      include: [{ model: DeviceMetadata, as: 'metadata', limit: 10, order: [['recorded_at', 'DESC']] }]
    });

    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    res.json({ success: true, data: { device } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取设备详情失败', error: error.message });
  }
});

/**
 * POST /api/v1/devices
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      device_id, name, type, location, latitude, longitude,
      manufacturer, model, firmware_version
    } = req.body;

    if (!device_id || !name || !type || !location || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: '缺少必要字段' });
    }

    const existed = await Device.findOne({ where: { device_id } });
    if (existed) {
      return res.status(409).json({ success: false, message: '设备ID已存在' });
    }

    const device = await Device.create({
      device_id,
      name,
      type,
      location,
      latitude,
      longitude,
      manufacturer,
      model,
      firmware_version,
      status: 'offline',
      is_active: true
    });

    res.status(201).json({ success: true, message: '设备添加成功', data: { device } });
  } catch (error) {
    res.status(500).json({ success: false, message: '添加设备失败', error: error.message });
  }
});

/**
 * PUT /api/v1/devices/:id
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    await device.update({ ...req.body, updated_at: new Date() });
    res.json({ success: true, message: '设备更新成功', data: { device } });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新设备失败', error: error.message });
  }
});

/**
 * DELETE /api/v1/devices/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    await device.destroy();
    res.json({ success: true, message: '设备删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除设备失败', error: error.message });
  }
});

/**
 * PUT /api/v1/devices/:id/heartbeat
 */
router.put('/:id/heartbeat', authenticate, async (req, res) => {
  try {
    const { battery, signal_strength, metadata } = req.body;

    const device = await Device.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    await device.update({
      status: 'online',
      last_heartbeat: new Date(),
      battery,
      signal_strength
    });

    if (metadata && typeof metadata === 'object') {
      await DeviceMetadata.create({
        device_id: device.id,
        custom_data: metadata,
        recorded_at: new Date()
      });
    }

    res.json({ success: true, message: '心跳更新成功', data: { device } });
  } catch (error) {
    res.status(500).json({ success: false, message: '心跳更新失败', error: error.message });
  }
});

/**
 * GET /api/v1/devices/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const total = await Device.count();

    const byStatusRows = await Device.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    const byTypeRows = await Device.findAll({
      attributes: ['type', [fn('COUNT', col('id')), 'count']],
      group: ['type'],
      raw: true
    });

    const by_status = Object.fromEntries(byStatusRows.map((r) => [r.status, Number(r.count)]));
    const by_type = Object.fromEntries(byTypeRows.map((r) => [r.type, Number(r.count)]));

    res.json({ success: true, data: { total, by_status, by_type } });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计失败', error: error.message });
  }
});

export default router;
