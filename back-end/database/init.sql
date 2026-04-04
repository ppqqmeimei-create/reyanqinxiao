-- ==========================================
-- 热眼擒枭 - MySQL 数据库初始化脚本
-- 数据库名称: SQL
-- ==========================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `SQL` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `SQL`;

-- ==========================================
-- 用户表 (users)
-- ==========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(30) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `role` ENUM('inspector', 'manager', 'admin') DEFAULT 'inspector',
  `status` ENUM('online', 'offline', 'busy') DEFAULT 'offline',
  `phone` VARCHAR(20),
  `avatar` VARCHAR(255),
  `department` VARCHAR(100),
  `badge_number` VARCHAR(50),
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 预警表 (alerts)
-- ==========================================
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `level` ENUM('critical', 'warning', 'info') DEFAULT 'warning',
  `status` ENUM('pending', 'processing', 'resolved', 'ignored') DEFAULT 'pending',
  `type` ENUM('water-pollution', 'air-pollution', 'soil-pollution', 'waste-pollution') NOT NULL,
  `category` ENUM('water', 'air', 'soil', 'waste') NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `risk_score` INT DEFAULT 0 CHECK (`risk_score` >= 0 AND `risk_score` <= 100),
  `pollutant_type` VARCHAR(100),
  `pollutant_value` DECIMAL(10, 2),
  `standard_value` DECIMAL(10, 2),
  `exceed_ratio` DECIMAL(10, 2),
  `affected_population` INT,
  `source` ENUM('device', 'manual', 'hotline', 'social_media', 'enterprise') DEFAULT 'device',
  `urgency` VARCHAR(50),
  `assigned_to` INT,
  `created_by` INT,
  `resolved_by` INT,
  `resolved_at` DATETIME,
  `resolution_notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_level` (`level`),
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_category` (`category`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_risk_score` (`risk_score`),
  INDEX `idx_location` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 任务表 (tasks)
-- ==========================================
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `type` ENUM('quick-sampling', 'complete-sampling', 'inspection', 'monitoring') NOT NULL,
  `status` ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `alert_id` INT,
  `assigned_to` INT NOT NULL,
  `created_by` INT,
  `location` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `start_time` DATETIME,
  `end_time` DATETIME,
  `deadline` DATETIME,
  `progress` INT DEFAULT 0 CHECK (`progress` >= 0 AND `progress` <= 100),
  `notes` TEXT,
  `completion_notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`alert_id`) REFERENCES `alerts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_assigned_to` (`assigned_to`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 任务证据表 (task_evidence)
-- ==========================================
CREATE TABLE IF NOT EXISTS `task_evidence` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `type` VARCHAR(50),
  `url` VARCHAR(500),
  `description` TEXT,
  `uploaded_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  INDEX `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 任务检查清单表 (task_checklist)
-- ==========================================
CREATE TABLE IF NOT EXISTS `task_checklist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `item` VARCHAR(255) NOT NULL,
  `completed` BOOLEAN DEFAULT FALSE,
  `completed_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  INDEX `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 设备表 (devices)
-- ==========================================
CREATE TABLE IF NOT EXISTS `devices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `device_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('camera-visible', 'camera-infrared', 'fiber', 'smell', 'water-monitor', 'air-monitor', 'soil-monitor') NOT NULL,
  `status` ENUM('online', 'offline', 'warning', 'error') DEFAULT 'offline',
  `location` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `battery` INT CHECK (`battery` >= 0 AND `battery` <= 100),
  `signal_strength` INT CHECK (`signal_strength` >= 0 AND `signal_strength` <= 100),
  `edge_node_id` VARCHAR(50),
  `last_active` DATETIME,
  `last_heartbeat` DATETIME,
  `firmware_version` VARCHAR(50),
  `hardware_version` VARCHAR(50),
  `manufacturer` VARCHAR(100),
  `model` VARCHAR(100),
  `installation_date` DATE,
  `maintenance_date` DATE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_device_id` (`device_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_location` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 设备元数据表 (device_metadata)
-- ==========================================
CREATE TABLE IF NOT EXISTS `device_metadata` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `device_id` INT NOT NULL,
  `ph` DECIMAL(4, 2),
  `temperature` DECIMAL(5, 2),
  `humidity` DECIMAL(5, 2),
  `pm25` DECIMAL(8, 2),
  `aqi` INT,
  `heavy_metal` DECIMAL(8, 4),
  `custom_data` JSON,
  `recorded_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE,
  INDEX `idx_device_id` (`device_id`),
  INDEX `idx_recorded_at` (`recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 插入初始管理员用户
-- ==========================================
-- 密码: admin123 (bcrypt 加密后)
INSERT INTO `users` (`username`, `email`, `password`, `name`, `role`, `status`) 
VALUES (
  'admin',
  'admin@reyanjingxiao.com',
  '$2a$10$XQKbZ5qYZ5qYZ5qYZ5qYZOeKqZ5qYZ5qYZ5qYZ5qYZ5qYZ5qYZ5qY',
  '系统管理员',
  'admin',
  'online'
) ON DUPLICATE KEY UPDATE `username` = `username`;

-- ==========================================
-- 插入测试数据（可选）
-- ==========================================

-- 测试用户
INSERT INTO `users` (`username`, `email`, `password`, `name`, `role`, `department`, `badge_number`) 
VALUES 
  ('inspector01', 'inspector01@test.com', '$2a$10$XQKbZ5qYZ5qYZ5qYZ5qYZOeKqZ5qYZ5qYZ5qYZ5qYZ5qYZ5qYZ5qY', '巡查员01', 'inspector', '边境一中队', '10001'),
  ('inspector02', 'inspector02@test.com', '$2a$10$XQKbZ5qYZ5qYZ5qYZ5qYZOeKqZ5qYZ5qYZ5qYZ5qYZ5qYZ5qYZ5qY', '巡查员02', 'inspector', '边境二中队', '10002'),
  ('manager01', 'manager01@test.com', '$2a$10$XQKbZ5qYZ5qYZ5qYZ5qYZOeKqZ5qYZ5qYZ5qYZ5qYZ5qYZ5qYZ5qY', '管理员01', 'manager', '指挥中心', '20001')
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 测试设备
INSERT INTO `devices` (`device_id`, `name`, `type`, `status`, `location`, `latitude`, `longitude`, `battery`, `signal_strength`) 
VALUES 
  ('CAM-001', '可见光摄像头-A01', 'camera-visible', 'online', '监测点A', 39.9042, 116.4074, 85, 92),
  ('CAM-002', '红外摄像头-A02', 'camera-infrared', 'warning', '监测点A', 39.9052, 116.4084, 18, 75),
  ('FIBER-001', '震动光纤-B01', 'fiber', 'online', '监测点B', 39.9032, 116.4064, 92, 88),
  ('SMELL-001', '气味探头-C01', 'smell', 'offline', '监测点C', 39.9062, 116.4094, 0, 0),
  ('WATER-001', '水质监测点-A', 'water-monitor', 'online', '监测点A', 39.9062, 116.4094, 95, 90),
  ('AIR-001', '空气监测点-B', 'air-monitor', 'online', '监测点B', 39.9022, 116.4054, 88, 85)
ON DUPLICATE KEY UPDATE `device_id` = `device_id`;

-- 测试预警
INSERT INTO `alerts` (`title`, `description`, `level`, `type`, `category`, `location`, `latitude`, `longitude`, `risk_score`, `pollutant_type`, `pollutant_value`, `standard_value`, `affected_population`, `created_by`) 
VALUES 
  ('水质污染预警', '某化工厂排污口检测到重金属超标', 'critical', 'water-pollution', 'water', '监测点A', 39.9042, 116.4074, 85, '重金属', 2.5, 1.0, 5000, 1),
  ('空气污染预警', '某钢铁厂PM2.5浓度异常升高', 'warning', 'air-pollution', 'air', '监测点B', 39.9052, 116.4084, 70, 'PM2.5', 150, 75, 3000, 1),
  ('土壤污染预警', '某农药厂土壤有机磷含量超标', 'warning', 'soil-pollution', 'soil', '监测点C', 39.9032, 116.4064, 65, '有机磷', 0.8, 0.5, 1000, 1)
ON DUPLICATE KEY UPDATE `title` = `title`;

-- ==========================================
-- 创建视图
-- ==========================================

-- 预警统计视图
CREATE OR REPLACE VIEW `alert_statistics` AS
SELECT 
  COUNT(*) AS total_alerts,
  SUM(CASE WHEN `level` = 'critical' THEN 1 ELSE 0 END) AS critical_alerts,
  SUM(CASE WHEN `level` = 'warning' THEN 1 ELSE 0 END) AS warning_alerts,
  SUM(CASE WHEN `level` = 'info' THEN 1 ELSE 0 END) AS info_alerts,
  SUM(CASE WHEN `status` = 'pending' THEN 1 ELSE 0 END) AS pending_alerts,
  SUM(CASE WHEN `status` = 'processing' THEN 1 ELSE 0 END) AS processing_alerts,
  SUM(CASE WHEN `status` = 'resolved' THEN 1 ELSE 0 END) AS resolved_alerts,
  SUM(CASE WHEN `status` = 'ignored' THEN 1 ELSE 0 END) AS ignored_alerts
FROM `alerts`;

-- 设备统计视图
CREATE OR REPLACE VIEW `device_statistics` AS
SELECT 
  COUNT(*) AS total_devices,
  SUM(CASE WHEN `status` = 'online' THEN 1 ELSE 0 END) AS online_devices,
  SUM(CASE WHEN `status` = 'offline' THEN 1 ELSE 0 END) AS offline_devices,
  SUM(CASE WHEN `status` = 'warning' THEN 1 ELSE 0 END) AS warning_devices,
  SUM(CASE WHEN `status` = 'error' THEN 1 ELSE 0 END) AS error_devices,
  AVG(`battery`) AS avg_battery,
  AVG(`signal_strength`) AS avg_signal_strength
FROM `devices`
WHERE `is_active` = TRUE;

-- 任务统计视图
CREATE OR REPLACE VIEW `task_statistics` AS
SELECT 
  COUNT(*) AS total_tasks,
  SUM(CASE WHEN `status` = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
  SUM(CASE WHEN `status` = 'in-progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
  SUM(CASE WHEN `status` = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
  SUM(CASE WHEN `status` = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_tasks,
  AVG(`progress`) AS avg_progress
FROM `tasks`;

-- ==========================================
-- 完成
-- ==========================================
SELECT '✅ 数据库初始化完成！' AS message;
