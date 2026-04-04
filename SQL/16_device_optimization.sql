-- ============================================
-- 热眼擒枭 - 设备模块数据库优化脚本
-- ============================================
-- 版本: 2.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 设备类型扩展、分类管理、健康度评估
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 扩展设备表
-- ============================================

-- 添加分类字段
ALTER TABLE devices ADD COLUMN category ENUM('ecology', 'fooddrug', 'enforcement') DEFAULT 'ecology' COMMENT '设备分类';

-- 添加设备类型字段（更详细的类型）
ALTER TABLE devices ADD COLUMN device_subtype VARCHAR(50) COMMENT '设备子类型';

-- 添加企业ID（用于食品药品设备）
ALTER TABLE devices ADD COLUMN enterprise_id INT COMMENT '企业ID';

-- 添加位置信息（用于执法设备）
ALTER TABLE devices ADD COLUMN latitude DECIMAL(10, 8) COMMENT '纬度';
ALTER TABLE devices ADD COLUMN longitude DECIMAL(11, 8) COMMENT '经度';

-- 添加索引
ALTER TABLE devices ADD INDEX idx_category (category);
ALTER TABLE devices ADD INDEX idx_device_subtype (device_subtype);
ALTER TABLE devices ADD INDEX idx_enterprise_id (enterprise_id);
ALTER TABLE devices ADD INDEX idx_location (latitude, longitude);

-- ============================================
-- 2. 新增设备分类表
-- ============================================

DROP TABLE IF EXISTS device_categories;
CREATE TABLE device_categories (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
  category_key VARCHAR(50) UNIQUE NOT NULL COMMENT '分类键',
  category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
  description TEXT COMMENT '分类描述',
  icon VARCHAR(100) COMMENT '分类图标',
  color VARCHAR(20) COMMENT '分类颜色',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_category_key (category_key),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备分类表';

-- 插入预置数据
INSERT INTO device_categories (category_key, category_name, description, icon, color, sort_order) VALUES
('ecology', '环保设备', '环境监测和污染防治设备', '🌍', '#10b981', 1),
('fooddrug', '食品药品设备', '食品药品企业监测设备', '🏥', '#f59e0b', 2),
('enforcement', '执法设备', '生态警务执法设备', '👮', '#ef4444', 3);

-- ============================================
-- 3. 新增设备类型表
-- ============================================

DROP TABLE IF EXISTS device_types;
CREATE TABLE device_types (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '类型ID',
  category_key VARCHAR(50) NOT NULL COMMENT '分类键',
  type_key VARCHAR(50) NOT NULL COMMENT '类型键',
  type_name VARCHAR(100) NOT NULL COMMENT '类型名称',
  description TEXT COMMENT '类型描述',
  icon VARCHAR(100) COMMENT '类型图标',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY unique_category_type (category_key, type_key),
  INDEX idx_category_key (category_key),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备类型表';

-- 插入环保设备类型
INSERT INTO device_types (category_key, type_key, type_name, description, icon, sort_order) VALUES
('ecology', 'water-sensor', '水质传感器', '监测水体质量参数', '💧', 1),
('ecology', 'air-sensor', '空气传感器', '监测空气质量指标', '💨', 2),
('ecology', 'soil-sensor', '土壤传感器', '监测土壤污染状况', '🌱', 3),
('ecology', 'waste-monitor', '废弃物监测', '监测固体废弃物', '♻️', 4);

-- 插入食品药品设备类型
INSERT INTO device_types (category_key, type_key, type_name, description, icon, sort_order) VALUES
('fooddrug', 'temperature-sensor', '温度传感器', '冷链温度监测', '🌡️', 1),
('fooddrug', 'humidity-sensor', '湿度传感器', '环境湿度监测', '💧', 2),
('fooddrug', 'quality-detector', '质量检测器', '产品质量检测', '🔬', 3),
('fooddrug', 'safety-monitor', '安全监测器', '安全事件监测', '🚨', 4);

-- 插入执法设备类型
INSERT INTO device_types (category_key, type_key, type_name, description, icon, sort_order) VALUES
('enforcement', 'gps-tracker', 'GPS追踪器', '实时位置追踪', '📍', 1),
('enforcement', 'camera-hd', '高清摄像头', '高清视频采集', '📹', 2),
('enforcement', 'audio-recorder', '音频记录器', '现场音频记录', '🎙️', 3),
('enforcement', 'evidence-collector', '证据采集器', '物证管理系统', '📦', 4);

-- ============================================
-- 4. 新增设备健康度表
-- ============================================

DROP TABLE IF EXISTS device_health;
CREATE TABLE device_health (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '健康度ID',
  device_id INT NOT NULL COMMENT '设备ID',
  health_score INT DEFAULT 100 COMMENT '健康度评分(0-100)',
  battery_level INT COMMENT '电池电量(%)',
  signal_strength INT COMMENT '信号强度(%)',
  status ENUM('healthy', 'warning', 'critical') DEFAULT 'healthy' COMMENT '设备状态',
  last_heartbeat DATETIME COMMENT '最后心跳时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_id (device_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备健康度表';

-- ============================================
-- 5. 新增设备位置表
-- ============================================

DROP TABLE IF EXISTS device_location;
CREATE TABLE device_location (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '位置ID',
  device_id INT NOT NULL COMMENT '设备ID',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  accuracy INT COMMENT '精度(米)',
  address VARCHAR(255) COMMENT '地址',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_id (device_id),
  INDEX idx_location (latitude, longitude),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备位置表';

-- ============================================
-- 6. 新增设备证据表
-- ============================================

DROP TABLE IF EXISTS device_evidence;
CREATE TABLE device_evidence (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '证据ID',
  device_id INT NOT NULL COMMENT '设备ID',
  evidence_type VARCHAR(50) COMMENT '证据类型(video/audio/photo)',
  file_path VARCHAR(255) COMMENT '文件路径',
  file_size INT COMMENT '文件大小(字节)',
  duration INT COMMENT '时长(秒)',
  hash_value VARCHAR(64) COMMENT '文件哈希值',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_id (device_id),
  INDEX idx_evidence_type (evidence_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备证据表';

-- ============================================
-- 7. 新增设备统计视图
-- ============================================

DROP VIEW IF EXISTS v_device_summary;
CREATE VIEW v_device_summary AS
SELECT 
  category,
  COUNT(*) as total_devices,
  SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_count,
  SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_count,
  SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning_count,
  AVG(battery_level) as avg_battery,
  AVG(signal_strength) as avg_signal
FROM devices
LEFT JOIN device_health ON devices.id = device_health.device_id
GROUP BY category;

-- ============================================
-- 8. 新增设备健康度统计视图
-- ============================================

DROP VIEW IF EXISTS v_device_health_summary;
CREATE VIEW v_device_health_summary AS
SELECT 
  device_id,
  health_score,
  battery_level,
  signal_strength,
  status,
  last_heartbeat,
  CASE 
    WHEN health_score >= 80 THEN 'healthy'
    WHEN health_score >= 50 THEN 'warning'
    ELSE 'critical'
  END as health_status
FROM device_health;

-- ============================================
-- 9. 新增设备位置追踪视图
-- ============================================

DROP VIEW IF EXISTS v_device_location_latest;
CREATE VIEW v_device_location_latest AS
SELECT 
  d.id,
  d.name,
  d.category,
  dl.latitude,
  dl.longitude,
  dl.accuracy,
  dl.address,
  dl.created_at
FROM devices d
LEFT JOIN device_location dl ON d.id = dl.device_id
WHERE dl.created_at = (
  SELECT MAX(created_at) FROM device_location WHERE device_id = d.id
);

-- ============================================
-- 10. 新增存储过程
-- ============================================

-- 更新设备健康度存储过程
DROP PROCEDURE IF EXISTS sp_update_device_health;
DELIMITER //
CREATE PROCEDURE sp_update_device_health(IN p_device_id INT)
BEGIN
  DECLARE v_battery INT;
  DECLARE v_signal INT;
  DECLARE v_health_score INT;
  DECLARE v_status VARCHAR(20);
  
  -- 获取设备的电池和信号强度
  SELECT battery_level, signal_strength INTO v_battery, v_signal
  FROM device_health WHERE device_id = p_device_id LIMIT 1;
  
  -- 计算健康度评分
  SET v_health_score = ROUND((v_battery * 0.4 + v_signal * 0.6));
  
  -- 判断设备状态
  IF v_health_score >= 80 THEN
    SET v_status = 'healthy';
  ELSEIF v_health_score >= 50 THEN
    SET v_status = 'warning';
  ELSE
    SET v_status = 'critical';
  END IF;
  
  -- 更新健康度
  UPDATE device_health 
  SET health_score = v_health_score, 
      status = v_status,
      last_heartbeat = NOW()
  WHERE device_id = p_device_id;
END //
DELIMITER ;

-- 批量更新所有设备健康度
DROP PROCEDURE IF EXISTS sp_update_all_device_health;
DELIMITER //
CREATE PROCEDURE sp_update_all_device_health()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_device_id INT;
  DECLARE device_cursor CURSOR FOR SELECT id FROM devices;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN device_cursor;
  read_loop: LOOP
    FETCH device_cursor INTO v_device_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    CALL sp_update_device_health(v_device_id);
  END LOOP;
  CLOSE device_cursor;
END //
DELIMITER ;

-- ============================================
-- 11. 新增触发器
-- ============================================

-- 创建设备时自动创建健康度记录
DROP TRIGGER IF EXISTS tr_device_health_insert;
DELIMITER //
CREATE TRIGGER tr_device_health_insert
AFTER INSERT ON devices
FOR EACH ROW
BEGIN
  INSERT INTO device_health (device_id, health_score, battery_level, signal_strength, status)
  VALUES (NEW.id, 100, 100, 100, 'healthy');
END //
DELIMITER ;

-- ============================================
-- 12. 执行优化
-- ============================================

-- 更新所有设备健康度
-- CALL sp_update_all_device_health();

-- ============================================
-- 完成
-- ============================================
-- 数据库优化脚本执行完成
-- 已添加: 4个新表, 3个视图, 2个存储过程, 1个触发器
-- 优化内容: 设备分类、健康度评估、位置追踪、证据管理
