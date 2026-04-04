-- ============================================
-- 热眼擒枭 - 设备界面优化脚本
-- ============================================
-- 版本: 3.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 设备管理、健康度评估、离线地图管理
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 创建设备表
-- ============================================

DROP TABLE IF EXISTS devices;
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '设备ID',
  device_id VARCHAR(50) UNIQUE NOT NULL COMMENT '设备编号',
  device_name VARCHAR(255) NOT NULL COMMENT '设备名称',
  category ENUM('ecology', 'fooddrug', 'enforcement') NOT NULL COMMENT '设备分类',
  device_type VARCHAR(100) NOT NULL COMMENT '设备类型',
  status ENUM('online', 'offline', 'warning', 'error') DEFAULT 'offline' COMMENT '设备状态',
  health_score INT DEFAULT 100 COMMENT '健康度评分(0-100)',
  battery_level INT DEFAULT 0 COMMENT '电池电量(%)',
  signal_strength INT DEFAULT 0 COMMENT '信号强度(%)',
  latitude DECIMAL(10, 8) COMMENT '设备纬度',
  longitude DECIMAL(11, 8) COMMENT '设备经度',
  location_address VARCHAR(255) COMMENT '设备位置地址',
  last_heartbeat DATETIME COMMENT '最后心跳时间',
  last_active DATETIME COMMENT '最后活动时间',
  edge_node_id VARCHAR(50) COMMENT '边缘节点ID',
  firmware_version VARCHAR(50) COMMENT '固件版本',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_device_id (device_id),
  INDEX idx_category (category),
  INDEX idx_device_type (device_type),
  INDEX idx_status (status),
  INDEX idx_health_score (health_score),
  INDEX idx_location (latitude, longitude),
  INDEX idx_last_heartbeat (last_heartbeat),
  INDEX idx_edge_node_id (edge_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表';

-- ============================================
-- 2. 创建设备参数表
-- ============================================

DROP TABLE IF EXISTS device_parameters;
CREATE TABLE device_parameters (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '参数ID',
  device_id INT NOT NULL COMMENT '设备ID',
  parameter_name VARCHAR(100) NOT NULL COMMENT '参数名称',
  parameter_value VARCHAR(255) COMMENT '参数值',
  parameter_unit VARCHAR(50) COMMENT '参数单位',
  alert_threshold_min DECIMAL(10, 4) COMMENT '告警阈值-最小值',
  alert_threshold_max DECIMAL(10, 4) COMMENT '告警阈值-最大值',
  is_alert BOOLEAN DEFAULT FALSE COMMENT '是否告警',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_id (device_id),
  INDEX idx_parameter_name (parameter_name),
  INDEX idx_is_alert (is_alert),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备参数表';

-- ============================================
-- 3. 创建设备健康度历史表
-- ============================================

DROP TABLE IF EXISTS device_health_history;
CREATE TABLE device_health_history (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '历史ID',
  device_id INT NOT NULL COMMENT '设备ID',
  health_score INT COMMENT '健康度评分',
  battery_level INT COMMENT '电池电量',
  signal_strength INT COMMENT '信号强度',
  status ENUM('online', 'offline', 'warning', 'error') COMMENT '设备状态',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_id (device_id),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备健康度历史表';

-- ============================================
-- 4. 创建离线地图包表
-- ============================================

DROP TABLE IF EXISTS offline_maps;
CREATE TABLE offline_maps (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '地图包ID',
  map_name VARCHAR(100) NOT NULL COMMENT '地图名称',
  map_region VARCHAR(100) NOT NULL COMMENT '地图区域',
  map_code VARCHAR(50) UNIQUE COMMENT '地图编码',
  file_size INT COMMENT '文件大小(字节)',
  file_path VARCHAR(500) COMMENT '文件路径',
  file_hash VARCHAR(255) COMMENT '文件哈希值',
  version VARCHAR(50) COMMENT '版本号',
  coverage_area TEXT COMMENT '覆盖范围(GeoJSON)',
  download_count INT DEFAULT 0 COMMENT '下载次数',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_map_region (map_region),
  INDEX idx_map_code (map_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='离线地图包表';

-- ============================================
-- 5. 创建用户地图下载记录表
-- ============================================

DROP TABLE IF EXISTS user_map_downloads;
CREATE TABLE user_map_downloads (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '下载记录ID',
  user_id INT NOT NULL COMMENT '用户ID',
  map_id INT NOT NULL COMMENT '地图包ID',
  device_id VARCHAR(50) COMMENT '设备ID',
  download_status ENUM('pending', 'downloading', 'completed', 'failed') DEFAULT 'pending' COMMENT '下载状态',
  download_progress INT DEFAULT 0 COMMENT '下载进度(%)',
  downloaded_size INT DEFAULT 0 COMMENT '已下载大小(字节)',
  total_size INT COMMENT '总大小(字节)',
  download_speed INT COMMENT '下载速度(KB/s)',
  started_at DATETIME COMMENT '开始时间',
  completed_at DATETIME COMMENT '完成时间',
  error_message VARCHAR(255) COMMENT '错误信息',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (map_id) REFERENCES offline_maps(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_map_id (map_id),
  INDEX idx_download_status (download_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户地图下载记录表';

-- ============================================
-- 6. 创建采样数据存储表
-- ============================================

DROP TABLE IF EXISTS device_storage;
CREATE TABLE device_storage (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '存储记录ID',
  device_id INT NOT NULL COMMENT '设备ID',
  total_capacity INT COMMENT '总容量(MB)',
  used_capacity INT DEFAULT 0 COMMENT '已用容量(MB)',
  available_capacity INT COMMENT '可用容量(MB)',
  sample_count INT DEFAULT 0 COMMENT '采样数据数量',
  uploaded_count INT DEFAULT 0 COMMENT '已上传数据数量',
  pending_count INT DEFAULT 0 COMMENT '待上传数据数量',
  last_cleanup DATETIME COMMENT '最后清理时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_id (device_id),
  UNIQUE KEY unique_device_storage (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备存储表';

-- ============================================
-- 7. 创建边缘节点表
-- ============================================

DROP TABLE IF EXISTS edge_nodes;
CREATE TABLE edge_nodes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '边缘节点ID',
  edge_node_id VARCHAR(50) UNIQUE NOT NULL COMMENT '边缘节点编号',
  node_name VARCHAR(100) NOT NULL COMMENT '节点名称',
  node_region VARCHAR(100) COMMENT '节点区域',
  status ENUM('online', 'offline', 'warning') DEFAULT 'offline' COMMENT '节点状态',
  device_count INT DEFAULT 0 COMMENT '连接设备数',
  cpu_usage INT DEFAULT 0 COMMENT 'CPU使用率(%)',
  memory_usage INT DEFAULT 0 COMMENT '内存使用率(%)',
  storage_usage INT DEFAULT 0 COMMENT '存储使用率(%)',
  last_heartbeat DATETIME COMMENT '最后心跳时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_edge_node_id (edge_node_id),
  INDEX idx_status (status),
  INDEX idx_node_region (node_region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='边缘节点表';

-- ============================================
-- 8. 创建视图
-- ============================================

-- 设备统计视图
DROP VIEW IF EXISTS v_device_stats;
CREATE VIEW v_device_stats AS
SELECT 
  category,
  COUNT(*) as total_devices,
  SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_count,
  SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_count,
  SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning_count,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
  AVG(health_score) as avg_health_score,
  AVG(battery_level) as avg_battery_level,
  AVG(signal_strength) as avg_signal_strength
FROM devices
GROUP BY category;

-- 设备健康度统计视图
DROP VIEW IF EXISTS v_device_health_stats;
CREATE VIEW v_device_health_stats AS
SELECT 
  device_id,
  COUNT(*) as record_count,
  AVG(health_score) as avg_health_score,
  MAX(health_score) as max_health_score,
  MIN(health_score) as min_health_score,
  AVG(battery_level) as avg_battery_level,
  AVG(signal_strength) as avg_signal_strength,
  MAX(recorded_at) as latest_record
FROM device_health_history
GROUP BY device_id;

-- ============================================
-- 9. 创建存储过程
-- ============================================

-- 计算设备健康度
DROP PROCEDURE IF EXISTS sp_calculate_device_health;
DELIMITER //
CREATE PROCEDURE sp_calculate_device_health(
  IN p_device_id INT,
  IN p_battery_level INT,
  IN p_signal_strength INT
)
BEGIN
  DECLARE v_health_score INT;
  
  -- 电池权重40%，信号权重60%
  SET v_health_score = ROUND((p_battery_level * 0.4 + p_signal_strength * 0.6));
  
  UPDATE devices 
  SET health_score = v_health_score
  WHERE id = p_device_id;
  
  -- 记录历史
  INSERT INTO device_health_history (device_id, health_score, battery_level, signal_strength, status)
  SELECT id, v_health_score, p_battery_level, p_signal_strength, status
  FROM devices WHERE id = p_device_id;
END //
DELIMITER ;

-- 更新设备状态
DROP PROCEDURE IF EXISTS sp_update_device_status;
DELIMITER //
CREATE PROCEDURE sp_update_device_status(
  IN p_device_id INT,
  IN p_status VARCHAR(20)
)
BEGIN
  UPDATE devices 
  SET status = p_status,
      last_active = NOW()
  WHERE id = p_device_id;
END //
DELIMITER ;

-- 清理已上传采样数据
DROP PROCEDURE IF EXISTS sp_cleanup_uploaded_samples;
DELIMITER //
CREATE PROCEDURE sp_cleanup_uploaded_samples(
  IN p_device_id INT,
  OUT p_freed_space INT
)
BEGIN
  DECLARE v_pending_count INT;
  DECLARE v_freed_size INT;
  
  SELECT pending_count INTO v_pending_count FROM device_storage WHERE device_id = p_device_id;
  
  IF v_pending_count = 0 THEN
    -- 计算释放空间（假设每个已上传样本平均占用1MB）
    SELECT uploaded_count * 1 INTO v_freed_size FROM device_storage WHERE device_id = p_device_id;
    
    UPDATE device_storage 
    SET used_capacity = used_capacity - v_freed_size,
        available_capacity = available_capacity + v_freed_size,
        uploaded_count = 0,
        last_cleanup = NOW()
    WHERE device_id = p_device_id;
    
    SET p_freed_space = v_freed_size;
  ELSE
    SET p_freed_space = 0;
  END IF;
END //
DELIMITER ;

-- 更新设备存储信息
DROP PROCEDURE IF EXISTS sp_update_device_storage;
DELIMITER //
CREATE PROCEDURE sp_update_device_storage(
  IN p_device_id INT,
  IN p_sample_count INT,
  IN p_uploaded_count INT
)
BEGIN
  DECLARE v_used_capacity INT;
  DECLARE v_available_capacity INT;
  DECLARE v_total_capacity INT;
  
  SELECT total_capacity INTO v_total_capacity FROM device_storage WHERE device_id = p_device_id;
  
  -- 假设每个样本占用1MB
  SET v_used_capacity = p_sample_count;
  SET v_available_capacity = v_total_capacity - v_used_capacity;
  
  UPDATE device_storage 
  SET used_capacity = v_used_capacity,
      available_capacity = v_available_capacity,
      sample_count = p_sample_count,
      uploaded_count = p_uploaded_count,
      pending_count = p_sample_count - p_uploaded_count
  WHERE device_id = p_device_id;
END //
DELIMITER ;

-- ============================================
-- 10. 创建触发器
-- ============================================

-- 自动更新设备最后活动时间
DROP TRIGGER IF EXISTS tr_update_device_last_active;
DELIMITER //
CREATE TRIGGER tr_update_device_last_active
BEFORE UPDATE ON devices
FOR EACH ROW
BEGIN
  IF NEW.status != OLD.status OR NEW.battery_level != OLD.battery_level THEN
    SET NEW.last_active = NOW();
  END IF;
END //
DELIMITER ;

-- ============================================
-- 11. 初始化数据
-- ============================================

-- 插入离线地图包
INSERT INTO offline_maps (map_name, map_region, map_code, file_size, version) VALUES
('东兴段地图', '东兴', 'MAP-DX-001', 512000000, '1.0.0'),
('凭祥段地图', '凭祥', 'MAP-PX-001', 480000000, '1.0.0'),
('那坡段地图', '那坡', 'MAP-NP-001', 560000000, '1.0.0');

-- 插入边缘节点
INSERT INTO edge_nodes (edge_node_id, node_name, node_region, status) VALUES
('EDGE-01', '边缘节点-A区', '北京', 'online'),
('EDGE-02', '边缘节点-B区', '杭州', 'online'),
('EDGE-03', '边缘节点-C区', '深圳', 'offline');

-- ============================================
-- 完成
-- ============================================
-- 设备界面优化脚本执行完成
-- 已创建: 7个新表、2个视图、4个存储过程、1个触发器
-- 支持三维度设备、健康度评估、离线地图管理
