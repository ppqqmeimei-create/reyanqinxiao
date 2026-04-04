import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { ingestDeviceHeartbeat, ingestDeviceStatusReport } from '../services/sensorIngestionService.js';

const router = express.Router();

/**
 * POST /api/v1/sensing/heartbeat
 * 多源设备心跳接入
 */
router.post('/heartbeat', authenticate, authorize('admin', 'manager', 'inspector'), async (req, res) => {
  try {
    const { device_id, battery, signal_strength, metadata } = req.body;
    if (!device_id) {
      return res.status(400).json({ success: false, message: 'device_id 不能为空' });
    }

    const data = await ingestDeviceHeartbeat({ device_id, battery, signal_strength, metadata });
    res.json({ success: true, message: '心跳接入成功', data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/sensing/status-report
 * 多源设备状态上报（触发实时预警引擎）
 */
router.post('/status-report', authenticate, authorize('admin', 'manager', 'inspector'), async (req, res) => {
  try {
    const {
      device_id,
      anomaly_score,
      confidence,
      target_type,
      species_name,
      affected_population,
      historical_case_count,
      description
    } = req.body;

    if (!device_id) {
      return res.status(400).json({ success: false, message: 'device_id 不能为空' });
    }

    const data = await ingestDeviceStatusReport({
      device_id,
      anomaly_score,
      confidence,
      target_type,
      species_name,
      affected_population,
      historical_case_count,
      description
    });

    res.status(201).json({ success: true, message: '状态上报成功并已触发预警', data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

export default router;
