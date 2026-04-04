-- ============================================
-- 热眼擒枭 - 我的界面优化脚本
-- ============================================
-- 版本: 3.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 用户身份、勤务统计、荣誉勋章、AI模型管理
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 扩展users表 - 添加用户身份和勤务信息
-- ============================================

-- 添加用户维度字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_category ENUM('ecology', 'fooddrug', 'enforcement') DEFAULT 'ecology' COMMENT '用户分类' AFTER role;

-- 添加执勤状态
ALTER TABLE users ADD COLUMN IF NOT EXISTS duty_status ENUM('on_duty', 'off_duty', 'busy') DEFAULT 'off_duty' COMMENT '执勤状态' AFTER user_category;

-- 添加GPS实时上报相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS gps_enabled BOOLEAN DEFAULT FALSE COMMENT 'GPS实时上报是否启用' AFTER duty_status;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_gps_latitude DECIMAL(10, 8) COMMENT '最后GPS纬度' AFTER gps_enabled;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_gps_longitude DECIMAL(11, 8) COMMENT '最后GPS经度' AFTER last_gps_latitude;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_gps_time DATETIME COMMENT '最后GPS更新时间' AFTER last_gps_longitude;

-- 添加索引
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_user_category (user_category);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_duty_status (duty_status);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_gps_enabled (gps_enabled);

-- ============================================
-- 2. 创建勤务统计表
-- ============================================

DROP TABLE IF EXISTS duty_statistics;
CREATE TABLE duty_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  user_category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '用户分类',
  task_count INT DEFAULT 0 COMMENT '任务数',
  alert_count INT DEFAULT 0 COMMENT '告警数',
  patrol_distance DECIMAL(10, 2) DEFAULT 0 COMMENT '巡逻里程(km)',
  work_days INT DEFAULT 0 COMMENT '出勤天数',
  interception_count INT DEFAULT 0 COMMENT '拦截次数',
  enterprise_check_count INT DEFAULT 0 COMMENT '企业检查数',
  case_count INT DEFAULT 0 COMMENT '案件数',
  work_hours INT DEFAULT 0 COMMENT '工作时长(小时)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_user_category (user_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='勤务统计表';

-- ============================================
-- 3. 创建荣誉勋章表
-- ============================================

DROP TABLE IF EXISTS medals;
CREATE TABLE medals (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '勋章ID',
  medal_code VARCHAR(50) UNIQUE COMMENT '勋章编码',
  medal_name VARCHAR(100) NOT NULL COMMENT '勋章名称',
  medal_icon VARCHAR(50) COMMENT '勋章图标',
  medal_description TEXT COMMENT '勋章描述',
  medal_category ENUM('ecology', 'fooddrug', 'enforcement', 'general') COMMENT '勋章分类',
  unlock_condition TEXT COMMENT '解锁条件',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_medal_code (medal_code),
  INDEX idx_medal_category (medal_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='荣誉勋章表';

-- ============================================
-- 4. 创建用户勋章表
-- ============================================

DROP TABLE IF EXISTS user_medals;
CREATE TABLE user_medals (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户勋章ID',
  user_id INT NOT NULL COMMENT '用户ID',
  medal_id INT NOT NULL COMMENT '勋章ID',
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (medal_id) REFERENCES medals(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_medal_id (medal_id),
  UNIQUE KEY unique_user_medal (user_id, medal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户勋章表';

-- ============================================
-- 5. 创建AI模型管理表
-- ============================================

DROP TABLE IF EXISTS ai_models;
CREATE TABLE ai_models (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '模型ID',
  model_code VARCHAR(50) UNIQUE COMMENT '模型编码',
  model_name VARCHAR(100) NOT NULL COMMENT '模型名称',
  model_version VARCHAR(50) COMMENT '模型版本',
  model_type VARCHAR(100) COMMENT '模型类型',
  model_size INT COMMENT '模型大小(MB)',
  accuracy_rate DECIMAL(5, 2) COMMENT '识别准确率(%)',
  inference_speed INT COMMENT '推理速度(ms)',
  memory_usage INT COMMENT '内存占用(MB)',
  download_url VARCHAR(500) COMMENT '下载地址',
  release_notes TEXT COMMENT '发布说明',
  is_latest BOOLEAN DEFAULT FALSE COMMENT '是否为最新版本',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_model_code (model_code),
  INDEX idx_is_latest (is_latest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型表';

-- ============================================
-- 6. 创建用户模型版本表
-- ============================================

DROP TABLE IF EXISTS user_model_versions;
CREATE TABLE user_model_versions (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户模型版本ID',
  user_id INT NOT NULL COMMENT '用户ID',
  model_id INT NOT NULL COMMENT '模型ID',
  installed_version VARCHAR(50) COMMENT '已安装版本',
  installed_at DATETIME COMMENT '安装时间',
  last_updated DATETIME COMMENT '最后更新时间',
  update_available BOOLEAN DEFAULT FALSE COMMENT '是否有更新可用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_model_id (model_id),
  UNIQUE KEY unique_user_model (user_id, model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户模型版本表';

-- ============================================
-- 7. 创建GPS位置历史表
-- ============================================

DROP TABLE IF EXISTS gps_location_history;
CREATE TABLE gps_location_history (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '位置历史ID',
  user_id INT NOT NULL COMMENT '用户ID',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  accuracy INT COMMENT '精度(米)',
  speed DECIMAL(10, 2) COMMENT '速度(km/h)',
  heading INT COMMENT '方向(度)',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_recorded_at (recorded_at),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='GPS位置历史表';

-- ============================================
-- 8. 创建视图
-- ============================================

-- 用户勤务统计视图
DROP VIEW IF EXISTS v_user_duty_stats;
CREATE VIEW v_user_duty_stats AS
SELECT 
  u.id,
  u.username,
  u.name,
  u.user_category,
  ds.task_count,
  ds.alert_count,
  ds.patrol_distance,
  ds.work_days,
  ds.interception_count,
  ds.enterprise_check_count,
  ds.case_count,
  COUNT(DISTINCT um.medal_id) as medal_count
FROM users u
LEFT JOIN duty_statistics ds ON u.id = ds.user_id
LEFT JOIN user_medals um ON u.id = um.user_id
GROUP BY u.id;

-- 用户勋章统计视图
DROP VIEW IF EXISTS v_user_medal_stats;
CREATE VIEW v_user_medal_stats AS
SELECT 
  u.id,
  u.username,
  COUNT(DISTINCT um.medal_id) as earned_medals,
  COUNT(DISTINCT m.id) as total_medals,
  ROUND(COUNT(DISTINCT um.medal_id) / COUNT(DISTINCT m.id) * 100, 2) as completion_rate
FROM users u
LEFT JOIN user_medals um ON u.id = um.user_id
CROSS JOIN medals m
GROUP BY u.id;

-- ============================================
-- 9. 创建存储过程
-- ============================================

-- 更新用户勤务统计
DROP PROCEDURE IF EXISTS sp_update_duty_statistics;
DELIMITER //
CREATE PROCEDURE sp_update_duty_statistics(
  IN p_user_id INT,
  IN p_task_count INT,
  IN p_alert_count INT,
  IN p_patrol_distance DECIMAL(10, 2),
  IN p_work_days INT
)
BEGIN
  INSERT INTO duty_statistics (user_id, task_count, alert_count, patrol_distance, work_days)
  VALUES (p_user_id, p_task_count, p_alert_count, p_patrol_distance, p_work_days)
  ON DUPLICATE KEY UPDATE
    task_count = p_task_count,
    alert_count = p_alert_count,
    patrol_distance = p_patrol_distance,
    work_days = p_work_days,
    updated_at = NOW();
END //
DELIMITER ;

-- 授予用户勋章
DROP PROCEDURE IF EXISTS sp_award_medal;
DELIMITER //
CREATE PROCEDURE sp_award_medal(
  IN p_user_id INT,
  IN p_medal_id INT
)
BEGIN
  INSERT IGNORE INTO user_medals (user_id, medal_id)
  VALUES (p_user_id, p_medal_id);
END //
DELIMITER ;

-- 更新用户GPS位置
DROP PROCEDURE IF EXISTS sp_update_user_gps;
DELIMITER //
CREATE PROCEDURE sp_update_user_gps(
  IN p_user_id INT,
  IN p_latitude DECIMAL(10, 8),
  IN p_longitude DECIMAL(11, 8),
  IN p_accuracy INT
)
BEGIN
  UPDATE users 
  SET last_gps_latitude = p_latitude,
      last_gps_longitude = p_longitude,
      last_gps_time = NOW()
  WHERE id = p_user_id;
  
  INSERT INTO gps_location_history (user_id, latitude, longitude, accuracy)
  VALUES (p_user_id, p_latitude, p_longitude, p_accuracy);
END //
DELIMITER ;

-- 更新用户执勤状态
DROP PROCEDURE IF EXISTS sp_update_duty_status;
DELIMITER //
CREATE PROCEDURE sp_update_duty_status(
  IN p_user_id INT,
  IN p_duty_status VARCHAR(20),
  IN p_gps_enabled BOOLEAN
)
BEGIN
  UPDATE users 
  SET duty_status = p_duty_status,
      gps_enabled = p_gps_enabled
  WHERE id = p_user_id;
END //
DELIMITER ;

-- ============================================
-- 10. 创建触发器
-- ============================================

-- 自动创建勤务统计记录
DROP TRIGGER IF EXISTS tr_create_duty_statistics;
DELIMITER //
CREATE TRIGGER tr_create_duty_statistics
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO duty_statistics (user_id, user_category)
  VALUES (NEW.id, NEW.user_category);
END //
DELIMITER ;

-- ============================================
-- 11. 初始化数据
-- ============================================

-- 插入荣誉勋章
INSERT INTO medals (medal_code, medal_name, medal_icon, medal_description, medal_category, unlock_condition) VALUES
('MEDAL-001', '优秀检查员', '🏆', '完成50个任务', 'general', 'task_count >= 50'),
('MEDAL-002', '环保卫士', '🌍', '环保任务完成100个', 'ecology', 'ecology_task_count >= 100'),
('MEDAL-003', '生态守护者', '🦉', '巡逻里程超过1000km', 'ecology', 'patrol_distance >= 1000'),
('MEDAL-004', '食品安全卫士', '🏥', '食品药品检查50次', 'fooddrug', 'enterprise_check_count >= 50'),
('MEDAL-005', '执法英雄', '👮', '执法案件处理20个', 'enforcement', 'case_count >= 20');

-- 插入AI模型
INSERT INTO ai_models (model_code, model_name, model_version, model_type, model_size, accuracy_rate, inference_speed, memory_usage, is_latest) VALUES
('MODEL-001', '污染检查标准库', 'V2.4', '污染源识别', 45, 94.5, 250, 128, FALSE),
('MODEL-002', '污染检查标准库', 'V2.5', '全天候目标识别', 52, 96.2, 220, 145, TRUE),
('MODEL-003', '食品安全检测库', 'V1.8', '食品质量检测', 38, 92.1, 280, 110, TRUE),
('MODEL-004', '执法证据识别库', 'V1.5', '证据自动识别', 55, 95.8, 200, 160, TRUE);

-- ============================================
-- 完成
-- ============================================
-- 我的界面优化脚本执行完成
-- 已创建: 7个新表、2个视图、4个存储过程、2个触发器
-- 支持三维度用户、勤务统计、荣誉勋章、AI模型管理
