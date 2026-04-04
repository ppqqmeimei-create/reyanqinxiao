-- ============================================
-- 热眼擒枭 - 生态环保监控系统
-- MySQL 数据库初始化脚本
-- ============================================
-- 版本: 1.0.0
-- 创建日期: 2026-03-13
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4
-- ============================================

-- 创建数据库
DROP DATABASE IF EXISTS reyanjingxiao;
CREATE DATABASE reyanjingxiao 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE reyanjingxiao;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  username VARCHAR(30) NOT NULL UNIQUE COMMENT '用户名',
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  name VARCHAR(50) NOT NULL COMMENT '姓名',
  role ENUM('inspector', 'manager', 'admin') DEFAULT 'inspector' COMMENT '角色',
  status ENUM('online', 'offline', 'busy') DEFAULT 'offline' COMMENT '状态',
  phone VARCHAR(20) COMMENT '手机号',
  avatar VARCHAR(255) COMMENT '头像URL',
  department VARCHAR(100) COMMENT '部门',
  badge_number VARCHAR(50) COMMENT '警号',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  last_login DATETIME COMMENT '最后登录时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 预警表 (alerts)
-- ============================================
DROP TABLE IF EXISTS alerts;
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预警ID',
  title VARCHAR(200) NOT NULL COMMENT '预警标题',
  description TEXT COMMENT '预警描述',
  level ENUM('critical', 'warning', 'info') DEFAULT 'warning' NOT NULL COMMENT '预警级别',
  status ENUM('pending', 'processing', 'resolved', 'ignored') DEFAULT 'pending' COMMENT '预警状态',
  type ENUM('water-pollution', 'air-pollution', 'soil-pollution', 'waste-pollution') NOT NULL COMMENT '预警类型',
  category ENUM('water', 'air', 'soil', 'waste') NOT NULL COMMENT '预警分类',
  location VARCHAR(255) NOT NULL COMMENT '位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  risk_score INT DEFAULT 0 COMMENT '风险评分(0-100)',
  pollutant_type VARCHAR(100) COMMENT '污染物类型',
  pollutant_value DECIMAL(10, 2) COMMENT '污染物浓度',
  standard_value DECIMAL(10, 2) COMMENT '标准值',
  exceed_ratio DECIMAL(10, 2) COMMENT '超标倍数',
  affected_population INT COMMENT '影响人口数',
  source ENUM('device', 'manual', 'hotline', 'social_media', 'enterprise') DEFAULT 'device' COMMENT '预警来源',
  urgency VARCHAR(50) COMMENT '紧急程度',
  assigned_to INT COMMENT '分配给（用户ID）',
  created_by INT COMMENT '创建者（用户ID）',
  resolved_by INT COMMENT '解决者（用户ID）',
  resolved_at DATETIME COMMENT '解决时间',
  resolution_notes TEXT COMMENT '解决备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_level (level),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at),
  INDEX idx_risk_score (risk_score),
  INDEX idx_location (latitude, longitude),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (risk_score >= 0 AND risk_score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警表';

-- ============================================
-- 3. 任务表 (tasks)
-- ============================================
DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
  title VARCHAR(200) NOT NULL COMMENT '任务标题',
  description TEXT COMMENT '任务描述',
  type ENUM('quick-sampling', 'complete-sampling', 'inspection', 'monitoring') NOT NULL COMMENT '任务类型',
  status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '任务状态',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT '优先级',
  alert_id INT COMMENT '关联预警ID',
  assigned_to INT NOT NULL COMMENT '分配给（用户ID）',
  created_by INT COMMENT '创建者（用户ID）',
  location VARCHAR(255) NOT NULL COMMENT '位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  start_time DATETIME COMMENT '开始时间',
  end_time DATETIME COMMENT '结束时间',
  deadline DATETIME COMMENT '截止时间',
  progress INT DEFAULT 0 COMMENT '进度(0-100)',
  notes TEXT COMMENT '备注',
  completion_notes TEXT COMMENT '完成备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_priority (priority),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (progress >= 0 AND progress <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';

-- ============================================
-- 4. 任务证据表 (task_evidence)
-- ============================================
DROP TABLE IF EXISTS task_evidence;
CREATE TABLE task_evidence (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '证据ID',
  task_id INT NOT NULL COMMENT '任务ID',
  type VARCHAR(50) COMMENT '证据类型',
  url VARCHAR(500) COMMENT '证据URL',
  description TEXT COMMENT '证据描述',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  INDEX idx_task_id (task_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务证据表';

-- ============================================
-- 5. 任务检查清单表 (task_checklist)
-- ============================================
DROP TABLE IF EXISTS task_checklist;
CREATE TABLE task_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '检查项ID',
  task_id INT NOT NULL COMMENT '任务ID',
  item VARCHAR(255) NOT NULL COMMENT '检查项内容',
  completed BOOLEAN DEFAULT FALSE COMMENT '是否完成',
  completed_at DATETIME COMMENT '完成时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_task_id (task_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务检查清单表';

-- ============================================
-- 6. 设备表 (devices)
-- ============================================
DROP TABLE IF EXISTS devices;
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '设备ID',
  device_id VARCHAR(50) NOT NULL UNIQUE COMMENT '设备编号',
  name VARCHAR(100) NOT NULL COMMENT '设备名称',
  type ENUM('camera-visible', 'camera-infrared', 'fiber', 'smell', 'water-monitor', 'air-monitor', 'soil-monitor') NOT NULL COMMENT '设备类型',
  status ENUM('online', 'offline', 'warning', 'error') DEFAULT 'offline' COMMENT '设备状态',
  location VARCHAR(255) NOT NULL COMMENT '位置',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  battery INT COMMENT '电池电量(0-100)',
  signal_strength INT COMMENT '信号强度(0-100)',
  edge_node_id VARCHAR(50) COMMENT '边缘节点ID',
  last_active DATETIME COMMENT '最后活跃时间',
  last_heartbeat DATETIME COMMENT '最后心跳时间',
  firmware_version VARCHAR(50) COMMENT '固件版本',
  hardware_version VARCHAR(50) COMMENT '硬件版本',
  manufacturer VARCHAR(100) COMMENT '制造商',
  model VARCHAR(100) COMMENT '型号',
  installation_date DATE COMMENT '安装日期',
  maintenance_date DATE COMMENT '维护日期',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_device_id (device_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_location (latitude, longitude),
  CHECK (battery >= 0 AND battery <= 100),
  CHECK (signal_strength >= 0 AND signal_strength <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表';

-- ============================================
-- 7. 设备元数据表 (device_metadata)
-- ============================================
DROP TABLE IF EXISTS device_metadata;
CREATE TABLE device_metadata (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '元数据ID',
  device_id INT NOT NULL COMMENT '设备ID',
  ph DECIMAL(4, 2) COMMENT 'pH值',
  temperature DECIMAL(5, 2) COMMENT '温度',
  humidity DECIMAL(5, 2) COMMENT '湿度',
  pm25 DECIMAL(8, 2) COMMENT 'PM2.5',
  aqi INT COMMENT '空气质量指数',
  heavy_metal DECIMAL(8, 4) COMMENT '重金属含量',
  custom_data JSON COMMENT '自定义数据',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  INDEX idx_device_id (device_id),
  INDEX idx_recorded_at (recorded_at),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备元数据表';

-- ============================================
-- 8. 系统日志表 (system_logs)
-- ============================================
DROP TABLE IF EXISTS system_logs;
CREATE TABLE system_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  user_id INT COMMENT '用户ID',
  action VARCHAR(100) NOT NULL COMMENT '操作',
  module VARCHAR(50) COMMENT '模块',
  method VARCHAR(10) COMMENT '请求方法',
  path VARCHAR(255) COMMENT '请求路径',
  ip VARCHAR(50) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  request_data JSON COMMENT '请求数据',
  response_status INT COMMENT '响应状态码',
  error_message TEXT COMMENT '错误信息',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_module (module),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- ============================================
-- 9. 文件上传表 (file_uploads)
-- ============================================
DROP TABLE IF EXISTS file_uploads;
CREATE TABLE file_uploads (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '文件ID',
  user_id INT COMMENT '上传用户ID',
  original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
  stored_name VARCHAR(255) NOT NULL COMMENT '存储文件名',
  file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
  file_size BIGINT COMMENT '文件大小(字节)',
  mime_type VARCHAR(100) COMMENT 'MIME类型',
  file_type ENUM('image', 'video', 'audio', 'document', 'other') COMMENT '文件类型',
  related_type ENUM('task', 'alert', 'device', 'user', 'other') COMMENT '关联类型',
  related_id INT COMMENT '关联ID',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  INDEX idx_user_id (user_id),
  INDEX idx_related (related_type, related_id),
  INDEX idx_uploaded_at (uploaded_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件上传表';

-- ============================================
-- 10. 通知表 (notifications)
-- ============================================
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '通知ID',
  user_id INT NOT NULL COMMENT '用户ID',
  type ENUM('alert', 'task', 'system', 'message') NOT NULL COMMENT '通知类型',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT COMMENT '通知内容',
  related_type ENUM('alert', 'task', 'device', 'user', 'other') COMMENT '关联类型',
  related_id INT COMMENT '关联ID',
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  read_at DATETIME COMMENT '阅读时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ============================================
-- 数据库初始化完成
-- ============================================
