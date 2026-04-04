import Device, { DeviceMetadata } from '../models/Device.js';
import Alert from '../models/Alert.js';
import { calculateRiskScore, mapRiskLevel } from './riskScoringService.js';
import realtimeEventBus from './realtimeEventBus.js';

function mapDeviceTypeToAlert(type) {
  if (type === 'camera-infrared' || type === 'camera-visible') {
    return { type: 'infrared-trigger', category: 'enforcement' };
  }
  if (type === 'fiber' || type === 'vibration') {
    return { type: 'wildlife-track', category: 'ecology' };
  }
  if (type === 'water-sensor') return { type: 'water-quality', category: 'ecology' };
  if (type === 'habitat-monitor') return { type: 'habitat-damage', category: 'ecology' };
  if (type === 'border-monitor') return { type: 'border-anomaly', category: 'enforcement' };
  return { type: 'wildlife-track', category: 'ecology' };
}

export async function ingestDeviceHeartbeat({ device_id, battery, signal_strength, metadata }) {
  const device = await Device.findOne({ where: { device_id } });
  if (!device) {
    const err = new Error('设备不存在');
    err.statusCode = 404;
    throw err;
  }

  const status = battery !== undefined && Number(battery) <= 15 ? 'warning' : 'online';

  await device.update({
    battery,
    signal_strength,
    status,
    last_heartbeat: new Date(),
    last_active: new Date()
  });

  if (metadata && typeof metadata === 'object') {
    await DeviceMetadata.create({
      device_id: device.id,
      custom_data: metadata,
      recorded_at: new Date()
    });
  }

  const payload = { device: device.toJSON(), metadata: metadata || null, ts: new Date().toISOString() };
  realtimeEventBus.publish('device:heartbeat', payload);

  return payload;
}

export async function ingestDeviceStatusReport({
  device_id,
  anomaly_score,
  confidence,
  target_type,
  species_name,
  affected_population,
  historical_case_count,
  description
}) {
  const device = await Device.findOne({ where: { device_id } });
  if (!device) {
    const err = new Error('设备不存在');
    err.statusCode = 404;
    throw err;
  }

  const isSmugglingHint = ['camera-infrared', 'camera-visible', 'fiber'].includes(device.type)
    || target_type === 'animal' || target_type === 'vehicle' || Boolean(species_name);

  const categoryForScoring = isSmugglingHint ? 'smuggling' : 'ecology';

  const risk_score = calculateRiskScore({
    category: categoryForScoring,
    anomaly_score,
    confidence,
    device_status: device.status,
    target_type,
    historical_case_count,
    affected_population
  });

  const level = mapRiskLevel(risk_score, categoryForScoring);
  const alertType = mapDeviceTypeToAlert(device.type);

  const alert = await Alert.create({
    title: isSmugglingHint
      ? `边境可疑活物走私线索 - ${device.name}`
      : `环境异常监测告警 - ${device.name}`,
    description: description || '感知设备状态上报触发自动预警',
    level,
    status: 'pending',
    type: alertType.type,
    category: alertType.category,
    location: device.location,
    latitude: device.latitude,
    longitude: device.longitude,
    risk_score,
    source: 'device',
    pollutant_type: species_name || null,
    affected_population: affected_population || null
  });

  const pushPayload = {
    kind: 'warning',
    alert: alert.toJSON(),
    priority: isSmugglingHint ? 'smuggling-first' : 'normal',
    ts: new Date().toISOString()
  };

  realtimeEventBus.publish('warning:new', pushPayload);

  return pushPayload;
}
