-- ============================================
-- 热眼擒枭 - 设备界面优化脚本 (第二部分)
-- ============================================
-- 版本: 3.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 存储过程、触发器、初始化数据
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 创建存储过程
-- ============================================

DROP PROCEDURE IF EXISTS sp_calculate_device_health;
DELIMITER //
CREATE PROCEDURE sp_calculate_device_health(
  IN p_device_id INT,
  OUT p_health_score INT
)
BEGIN
  DECLARE v_battery_score INT DEFAULT 0;
  DECLARE v_signal_score INT DEFAULT 0;
  DECLARE v_status_score INT DEFAULT 0;
  DECLARE v_battery_level INT;
  DECLARE v_signal_strength INT;
  DECLARE v_device_status VARCHAR(20);
  
  SELECT battery_level, signal_strength, device_status 
  INTO v_battery_level, v_signal_strength, v_device_status
  FROM devices WHERE id = p_device_id;
  
  IF v_battery_level >= 80 THEN
    SET v_battery_score = 40;
  ELSEIF v_battery_level >= 50 THEN
    SET v_battery_score = 30;
  ELSEIF v_battery_level >= 20 THEN
    SET v_battery_score = 15;
  ELSE
    SET v_battery_score = 0;
  END IF;
  
  IF v_signal_strength >= 80 THEN
    SET v_signal_score = 40;
  ELSEIF v_signal_strength >= 60 THEN
    SET v_signal_score = 30;
  ELSEIF v_signal_strength >= 40 THEN
    SET v_signal_score = 15;
  ELSE
    SET v_signal_score = 0;
  END IF;
  
  IF v_device_status = 'online' THEN
    SET v_status_score = 20;
  ELSEIF v_device_status = 'warning' THEN
    SET v_status_score = 10;
  ELSE
    SET v_status_score = 0;
  END IF;
  
  SET p_health_score = v_battery_score + v_signal_score + v_status_score;
  
  UPDATE devices SET health_score = p_health_score WHERE id = p_device_id;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_update_device_status;
DELIMITER //
CREATE PROCEDURE sp_update_device_status(
  IN p_device_id INT,
  IN p_battery_level INT,
  IN p_signal_strength INT
)
BEGIN
  DECLARE v_new_status VARCHAR(20);
  
  IF p_battery_level <= 10 OR p_signal_strength <= 20 THEN
    SET v_new_status = 'warning';
  ELSEIF p_battery_level > 0 AND p_signal_strength > 0 THEN
    SET v_new_status = 'online';
  ELSE
    SET v_new_status = 'offline';
  END IF;
  
  UPDATE devices 
  SET device_status = v_new_status,
      battery_level = p_battery_level,
      signal_strength = p_signal_strength,
      last_heartbeat = NOW()
  WHERE id = p_device_id;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_create_device_alert;
DELIMITER //
CREATE PROCEDURE sp_create_device_alert(
  IN p_device_id INT,
  IN p_alert_type VARCHAR(50),
  IN p_alert_level VARCHAR(20),
  IN p_alert_message VARCHAR(255)
)
BEGIN
  INSERT INTO device_alerts (device_id, alert_type, alert_level, alert_message)
  VALUES (p_device_id, p_alert_type, p_alert_level, p_alert_message);
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_cleanup_sampling_data;
DELIMITER //
CREATE PROCEDURE sp_cleanup_sampling_data(
  IN p_device_id INT,
  OUT p_freed_space INT
)
BEGIN
  DECLARE v_used_space INT;
  
  SELECT used_space INTO v_used_space 
  FROM sampling_storage WHERE device_id = p_device_id;
  
  UPDATE sampling_storage 
  SET used_space = 0,
      file_count = 0,
      last_cleanup = NOW()
  WHERE device_id = p_device_id;
  
  SET p_freed_space = COALESCE(v_used_space, 0);
END //
DELIMITER ;

-- ============================================
-- 2. 创建触发器
-- ============================================

DROP TRIGGER IF EXISTS tr_log_device_health;
DELIMITER //
CREATE TRIGGER tr_log_device_health
AFTER UPDATE ON devices
FOR EACH ROW
BEGIN
  IF NEW.health_score != OLD.health_score OR NEW.device_status != OLD.device_status THEN
    INSERT INTO device_health_logs (device_id, health_score, battery_level, signal_strength, status, last_heartbeat)
    VALUES (NEW.id, NEW.health_score, NEW.battery_level, NEW.signal_strength, NEW.device_status, NEW.last_heartbeat);
  END IF;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS tr_auto_battery_alert;
DELIMITER //
CREATE TRIGGER tr_auto_battery_alert
AFTER UPDATE ON devices
FOR EACH ROW
BEGIN
  IF NEW.battery_level <= 10 AND OLD.battery_level > 10 THEN
    INSERT INTO device_alerts (device_id, alert_type, alert_level, alert_message)
    VALUES (NEW.id, 'battery_low', 'warning', CONCAT('设备电量过低: ', NEW.battery_level, '%'));
  END IF;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS tr_auto_signal_alert;
DELIMITER //
CREATE TRIGGER tr_auto_signal_alert
AFTER UPDATE ON devices
FOR EACH ROW
BEGIN
  IF NEW.signal_strength <= 20 AND OLD.signal_strength > 20 THEN
    INSERT INTO device_alerts (device_id, alert_type, alert_level, alert_message)
    VALUES (NEW.id, 'signal_weak', 'warning', CONCAT('设备信号弱: ', NEW.signal_strength, '%'));
  END IF;
END //
DELIMITER ;

-- ============================================
-- 3. 初始化数据
-- ============================================

INSERT IGNORE INTO device_types (device_type_code, device_type_name, device_dimension, category, icon, description, parameters) VALUES
('water-sensor', '水质传感器', 'ecology', '环保设备', '💧', '监测pH值、溶解氧、浊度、电导率', '{"parameters":["pH","DO","Turbidity","Conductivity"]}'),
('air-sensor', '空气传感器', 'ecology', '环保设备', '💨', '监测PM2.5、PM10、NO2、SO2、O3', '{"parameters":["PM2.5","PM10","NO2","SO2","O3"]}'),
('soil-sensor', '土壤传感器', 'ecology', '环保设备', '🌱', '监测重金属、有机物、pH值、含水量', '{"parameters":["HeavyMetals","Organics","pH","Moisture"]}'),
('waste-monitor', '废弃物监测', 'ecology', '环保设备', '🗑️', '监测重量、成分、温度、湿度', '{"parameters":["Weight","Composition","Temperature","Humidity"]}'),
('temp-sensor', '温度传感器', 'fooddrug', '食品药品设备', '🌡️', '冷链温度监测（-25℃至-18℃）', '{"parameters":["Temperature"],"range":[-25,18]}'),
('humidity-sensor', '湿度传感器', 'fooddrug', '食品药品设备', '💧', '环境湿度监测（30%-70%）', '{"parameters":["Humidity"],"range":[30,70]}'),
('quality-detector', '质量检测器', 'fooddrug', '食品药品设备', '⚖️', '产品质量检测', '{"parameters":["Quality"]}'),
('safety-monitor', '安全监测器', 'fooddrug', '食品药品设备', '🚨', '安全事件监测', '{"parameters":["Safety"]}'),
('gps-tracker', 'GPS追踪器', 'enforcement', '执法设备', '📍', '实时位置追踪、轨迹记录、地理围栏', '{"parameters":["Location","Trajectory","Geofence"]}'),
('camera-4k', '高清摄像头', 'enforcement', '执法设备', '📹', '4K录制、夜视、人脸识别', '{"parameters":["Resolution","NightVision","FaceRecognition"]}'),
('audio-recorder', '音频记录器', 'enforcement', '执法设备', '🎙️', '高保真录音、降噪、时间戳', '{"parameters":["Quality","NoiseReduction","Timestamp"]}'),
('evidence-collector', '证据采集器', 'enforcement', '执法设备', '🔍', '物证管理、链条追踪、数据加密', '{"parameters":["EvidenceManagement","ChainTracking","Encryption"]}');

INSERT IGNORE INTO offline_maps (map_name, map_region, map_code, file_size, version, coverage_area, is_downloaded) VALUES
('东兴段地图', '东兴', 'MAP-DX-001', 524288000, '1.0.0', '{"north":21.58,"south":21.48,"east":108.10,"west":107.92}', FALSE),
('凭祥段地图', '凭祥', 'MAP-PX-001', 524288000, '1.0.0', '{"north":22.18,"south":22.02,"east":106.83,"west":106.68}', FALSE),
('那坡段地图', '那坡', 'MAP-NP-001', 524288000, '1.0.0', '{"north":23.52,"south":23.33,"east":105.95,"west":105.72}', FALSE);

-- ============================================
-- 完成第二部分
-- ============================================
-- 设备界面优化脚本执行完成
-- 已创建: 4个存储过程、3个触发器
-- 已初始化: 12个设备类型、3个离线地图包
