-- ============================================
-- 热眼擒枭 - GIS地图模块数据库优化脚本
-- ============================================
-- 版本: 2.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 监测点、污染源、预警、扩散路径、污染范围
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 新增监测点表
-- ============================================

DROP TABLE IF EXISTS monitoring_points;
CREATE TABLE monitoring_points (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '监测点ID',
  name VARCHAR(100) NOT NULL COMMENT '监测点名称',
  type ENUM('water', 'air', 'soil', 'waste') COMMENT '监测类型',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '用户分类',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  status ENUM('online', 'offline', 'warning') DEFAULT 'online' COMMENT '设备状态',
  risk_score INT DEFAULT 0 COMMENT '风险评分(0-100)',
  battery_level INT COMMENT '电池电量(%)',
  signal_strength INT COMMENT '信号强度(%)',
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后更新时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_risk_score (risk_score),
  INDEX idx_location (latitude, longitude),
  INDEX idx_last_update (last_update)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='监测点表';

-- ============================================
-- 2. 新增监测数据表
-- ============================================

DROP TABLE IF EXISTS monitoring_data;
CREATE TABLE monitoring_data (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '数据ID',
  point_id INT NOT NULL COMMENT '监测点ID',
  data_type VARCHAR(50) COMMENT '数据类型',
  -- 水质数据
  pH DECIMAL(4, 2) COMMENT 'pH值',
  temperature DECIMAL(5, 2) COMMENT '温度(℃)',
  COD DECIMAL(8, 2) COMMENT 'COD(mg/L)',
  dissolved_oxygen DECIMAL(5, 2) COMMENT '溶解氧(mg/L)',
  turbidity DECIMAL(5, 2) COMMENT '浊度(NTU)',
  -- 大气数据
  PM25 DECIMAL(8, 2) COMMENT 'PM2.5(μg/m³)',
  PM10 DECIMAL(8, 2) COMMENT 'PM10(μg/m³)',
  AQI INT COMMENT '空气质量指数',
  SO2 DECIMAL(8, 2) COMMENT 'SO2(μg/m³)',
  NO2 DECIMAL(8, 2) COMMENT 'NO2(μg/m³)',
  O3 DECIMAL(8, 2) COMMENT 'O3(μg/m³)',
  -- 土壤数据
  heavy_metal DECIMAL(8, 2) COMMENT '重金属(mg/kg)',
  organic DECIMAL(8, 2) COMMENT '有机物(mg/kg)',
  pH_soil DECIMAL(4, 2) COMMENT '土壤pH值',
  moisture DECIMAL(5, 2) COMMENT '含水量(%)',
  -- 固废数据
  waste_weight DECIMAL(10, 2) COMMENT '固废重量(kg)',
  waste_type VARCHAR(50) COMMENT '固废类型',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (point_id) REFERENCES monitoring_points(id) ON DELETE CASCADE,
  INDEX idx_point_id (point_id),
  INDEX idx_data_type (data_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='监测数据表';

-- ============================================
-- 3. 新增污染源表
-- ============================================

DROP TABLE IF EXISTS pollution_sources;
CREATE TABLE pollution_sources (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '污染源ID',
  name VARCHAR(100) NOT NULL COMMENT '污染源名称',
  type ENUM('water', 'air', 'soil', 'waste') COMMENT '污染类型',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '用户分类',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  risk_score INT DEFAULT 0 COMMENT '风险评分(0-100)',
  pollution_level ENUM('critical', 'high', 'medium', 'low') COMMENT '污染等级',
  description TEXT COMMENT '污染源描述',
  source_type VARCHAR(50) COMMENT '污染源类型(工业、生活、农业等)',
  last_detected DATETIME COMMENT '最后检测时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_risk_score (risk_score),
  INDEX idx_pollution_level (pollution_level),
  INDEX idx_location (latitude, longitude),
  INDEX idx_last_detected (last_detected)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='污染源表';

-- ============================================
-- 4. 新增预警表
-- ============================================

DROP TABLE IF EXISTS gis_alerts;
CREATE TABLE gis_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预警ID',
  sensor_id INT COMMENT '传感器ID',
  sensor_name VARCHAR(100) COMMENT '传感器名称',
  type ENUM('water', 'air', 'soil', 'waste') COMMENT '污染类型',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '用户分类',
  level ENUM('critical', 'high', 'medium', 'low') COMMENT '预警等级',
  risk_score INT COMMENT '风险评分',
  message TEXT COMMENT '预警信息',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  status ENUM('pending', 'processing', 'resolved') DEFAULT 'pending' COMMENT '预警状态',
  task_id INT COMMENT '关联任务ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  resolved_at DATETIME COMMENT '解决时间',
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_level (level),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GIS预警表';

-- ============================================
-- 5. 新增扩散路径表
-- ============================================

DROP TABLE IF EXISTS diffusion_paths;
CREATE TABLE diffusion_paths (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '扩散路径ID',
  source_id INT NOT NULL COMMENT '污染源ID',
  wind_direction INT COMMENT '风向(0-360度)',
  wind_speed DECIMAL(5, 2) COMMENT '风速(m/s)',
  distance INT COMMENT '扩散距离(米)',
  points JSON COMMENT '路径点(GeoJSON格式)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (source_id) REFERENCES pollution_sources(id) ON DELETE CASCADE,
  INDEX idx_source_id (source_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='污染物扩散路径表';

-- ============================================
-- 6. 新增污染范围表
-- ============================================

DROP TABLE IF EXISTS pollution_ranges;
CREATE TABLE pollution_ranges (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '污染范围ID',
  source_id INT NOT NULL COMMENT '污染源ID',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '中心纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '中心经度',
  radius INT NOT NULL COMMENT '范围半径(米)',
  affected_population INT COMMENT '影响人口数',
  risk_level ENUM('critical', 'high', 'medium', 'low') COMMENT '风险等级',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (source_id) REFERENCES pollution_sources(id) ON DELETE CASCADE,
  INDEX idx_source_id (source_id),
  INDEX idx_risk_level (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='污染范围表';

-- ============================================
-- 7. 新增GIS操作日志表
-- ============================================

DROP TABLE IF EXISTS gis_operation_logs;
CREATE TABLE gis_operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  user_id INT NOT NULL COMMENT '用户ID',
  operation VARCHAR(50) COMMENT '操作类型',
  target_type VARCHAR(50) COMMENT '目标类型(point/source/alert)',
  target_id INT COMMENT '目标ID',
  latitude DECIMAL(10, 8) COMMENT '操作位置纬度',
  longitude DECIMAL(11, 8) COMMENT '操作位置经度',
  details TEXT COMMENT '操作详情',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_operation (operation),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GIS操作日志表';

-- ============================================
-- 8. 新增视图
-- ============================================

-- 监测点统计视图
DROP VIEW IF EXISTS v_monitoring_point_summary;
CREATE VIEW v_monitoring_point_summary AS
SELECT 
  type,
  category,
  COUNT(*) as total_points,
  SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_points,
  SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_points,
  SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning_points,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score
FROM monitoring_points
GROUP BY type, category;

-- 污染源统计视图
DROP VIEW IF EXISTS v_pollution_source_summary;
CREATE VIEW v_pollution_source_summary AS
SELECT 
  type,
  category,
  COUNT(*) as total_sources,
  SUM(CASE WHEN pollution_level = 'critical' THEN 1 ELSE 0 END) as critical_sources,
  SUM(CASE WHEN pollution_level = 'high' THEN 1 ELSE 0 END) as high_sources,
  SUM(CASE WHEN pollution_level = 'medium' THEN 1 ELSE 0 END) as medium_sources,
  SUM(CASE WHEN pollution_level = 'low' THEN 1 ELSE 0 END) as low_sources,
  AVG(risk_score) as avg_risk_score
FROM pollution_sources
GROUP BY type, category;

-- 预警统计视图
DROP VIEW IF EXISTS v_alert_summary;
CREATE VIEW v_alert_summary AS
SELECT 
  DATE(created_at) as alert_date,
  type,
  category,
  level,
  COUNT(*) as alert_count,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_alerts,
  SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_alerts,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_alerts
FROM gis_alerts
GROUP BY DATE(created_at), type, category, level;

-- ============================================
-- 9. 新增存储过程
-- ============================================

-- 创建预警
DROP PROCEDURE IF EXISTS sp_create_gis_alert;
DELIMITER //
CREATE PROCEDURE sp_create_gis_alert(
  IN p_sensor_id INT,
  IN p_sensor_name VARCHAR(100),
  IN p_type VARCHAR(20),
  IN p_category VARCHAR(20),
  IN p_level VARCHAR(20),
  IN p_risk_score INT,
  IN p_message TEXT,
  IN p_latitude DECIMAL(10, 8),
  IN p_longitude DECIMAL(11, 8)
)
BEGIN
  INSERT INTO gis_alerts (
    sensor_id, sensor_name, type, category, level, risk_score, 
    message, latitude, longitude, status
  ) VALUES (
    p_sensor_id, p_sensor_name, p_type, p_category, p_level, p_risk_score,
    p_message, p_latitude, p_longitude, 'pending'
  );
END //
DELIMITER ;

-- 更新预警状态
DROP PROCEDURE IF EXISTS sp_update_alert_status;
DELIMITER //
CREATE PROCEDURE sp_update_alert_status(
  IN p_alert_id INT,
  IN p_status VARCHAR(20),
  IN p_task_id INT
)
BEGIN
  UPDATE gis_alerts 
  SET status = p_status, task_id = p_task_id
  WHERE id = p_alert_id;
  
  IF p_status = 'resolved' THEN
    UPDATE gis_alerts 
    SET resolved_at = NOW()
    WHERE id = p_alert_id;
  END IF;
END //
DELIMITER ;

-- ============================================
-- 10. 新增触发器
-- ============================================

-- 监测点状态变化时更新风险评分
DROP TRIGGER IF EXISTS tr_update_monitoring_point_risk;
DELIMITER //
CREATE TRIGGER tr_update_monitoring_point_risk
AFTER INSERT ON monitoring_data
FOR EACH ROW
BEGIN
  DECLARE v_risk_score INT DEFAULT 0;
  
  -- 根据监测数据计算风险评分
  IF NEW.COD > 50 THEN SET v_risk_score = v_risk_score + 30; END IF;
  IF NEW.PM25 > 100 THEN SET v_risk_score = v_risk_score + 30; END IF;
  IF NEW.heavy_metal > 100 THEN SET v_risk_score = v_risk_score + 40; END IF;
  
  UPDATE monitoring_points 
  SET risk_score = v_risk_score, last_update = NOW()
  WHERE id = NEW.point_id;
END //
DELIMITER ;

-- ============================================
-- 11. 初始化数据
-- ============================================

-- 插入示例监测点
INSERT INTO monitoring_points (name, type, category, latitude, longitude, status, risk_score) VALUES
('水质监测点-北京-001', 'water', 'ecology', 39.9042, 116.4074, 'online', 45),
('大气监测点-北京-001', 'air', 'ecology', 39.9050, 116.4080, 'online', 65),
('土壤监测点-北京-001', 'soil', 'ecology', 39.9060, 116.4090, 'online', 35);

-- 插入示例污染源
INSERT INTO pollution_sources (name, type, category, latitude, longitude, risk_score, pollution_level, description) VALUES
('工业废水排放口', 'water', 'ecology', 39.9045, 116.4075, 85, 'critical', '工业园区废水排放'),
('大气污染源-工厂', 'air', 'ecology', 39.9055, 116.4085, 75, 'high', '工厂烟囱排放');

-- ============================================
-- 完成
-- ============================================
-- 数据库优化脚本执行完成
-- 已添加: 7个新表, 3个视图, 2个存储过程, 1个触发器
-- 优化内容: 监测点、污染源、预警、扩散路径、污染范围
