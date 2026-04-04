-- ============================================
-- 热眼擒枭 - 闭环数据库重构（全量重建版）
-- 文件: 27_closed_loop_rebuild.sql
-- 目标: 感知-预警-处置-取证-研判 一体化数据模型
-- 说明: 适用于新环境或允许重建的环境
-- ============================================

DROP DATABASE IF EXISTS reyanjingxiao_v3;
CREATE DATABASE reyanjingxiao_v3
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE reyanjingxiao_v3;

-- 1) 角色表
CREATE TABLE roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '角色ID',
  role_code VARCHAR(64) NOT NULL UNIQUE COMMENT '角色编码',
  role_name VARCHAR(128) NOT NULL COMMENT '角色名称',
  role_scope VARCHAR(64) NOT NULL DEFAULT 'city' COMMENT '权限范围',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_active (is_active)
) ENGINE=InnoDB COMMENT='角色表';

-- 2) 用户表
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  username VARCHAR(64) NOT NULL UNIQUE COMMENT '用户名',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  real_name VARCHAR(64) NOT NULL COMMENT '姓名',
  badge_number VARCHAR(64) NULL UNIQUE COMMENT '警号/工号',
  phone VARCHAR(20) NULL UNIQUE COMMENT '手机号',
  email VARCHAR(128) NULL UNIQUE COMMENT '邮箱',
  department VARCHAR(128) NULL COMMENT '部门',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  status ENUM('online','offline','busy','disabled') NOT NULL DEFAULT 'offline' COMMENT '用户状态',
  last_login_at DATETIME NULL COMMENT '最后登录时间',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  INDEX idx_users_role_status (role_id, status),
  INDEX idx_users_department (department),
  INDEX idx_users_last_login (last_login_at),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB COMMENT='用户表';

-- 3) 多源设备表
CREATE TABLE devices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '设备主键ID',
  device_code VARCHAR(64) NOT NULL UNIQUE COMMENT '设备编码',
  device_name VARCHAR(128) NOT NULL COMMENT '设备名称',
  device_type ENUM(
    'infrared_camera',
    'checkpoint_camera',
    'fiber_vibration',
    'water_sensor',
    'air_sensor',
    'soil_sensor',
    'drone',
    'other'
  ) NOT NULL COMMENT '设备类型',
  device_vendor VARCHAR(128) NULL COMMENT '厂商',
  model VARCHAR(128) NULL COMMENT '型号',
  firmware_version VARCHAR(64) NULL COMMENT '固件版本',
  status ENUM('online','offline','warning','error','maintenance') NOT NULL DEFAULT 'offline' COMMENT '在线状态',
  last_heartbeat_at DATETIME NULL COMMENT '最近心跳时间',
  install_at DATETIME NULL COMMENT '安装时间',
  location_text VARCHAR(255) NULL COMMENT '地址描述',
  border_section VARCHAR(64) NULL COMMENT '边境片区',
  latitude DECIMAL(10,8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11,8) NOT NULL COMMENT '经度',
  geo_point POINT SRID 4326 NULL COMMENT '地理点位',
  battery_level TINYINT UNSIGNED NULL COMMENT '电量(0-100)',
  signal_strength TINYINT UNSIGNED NULL COMMENT '信号(0-100)',
  metadata JSON NULL COMMENT '扩展属性',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_devices_lat CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_devices_lng CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT chk_devices_battery CHECK (battery_level IS NULL OR battery_level BETWEEN 0 AND 100),
  CONSTRAINT chk_devices_signal CHECK (signal_strength IS NULL OR signal_strength BETWEEN 0 AND 100),
  INDEX idx_devices_type_status (device_type, status),
  INDEX idx_devices_heartbeat (last_heartbeat_at),
  INDEX idx_devices_border_section (border_section),
  INDEX idx_devices_lat_lng (latitude, longitude),
  SPATIAL INDEX sp_idx_devices_point (geo_point)
) ENGINE=InnoDB COMMENT='多源感知设备表';

-- 4) 预警事件表（统一 warnings）
CREATE TABLE warnings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '预警ID',
  warning_code VARCHAR(64) NOT NULL UNIQUE COMMENT '预警编号',
  warning_category ENUM('smuggling','ecology','fooddrug') NOT NULL COMMENT '预警分类',
  warning_type VARCHAR(64) NOT NULL COMMENT '预警类型',
  risk_level ENUM('critical','high_risk','processing','resolved') NOT NULL DEFAULT 'high_risk' COMMENT '风险等级',
  warning_status ENUM('pending','processing','resolved','ignored') NOT NULL DEFAULT 'pending' COMMENT '预警状态',
  risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '风险评分(0-100)',
  title VARCHAR(255) NOT NULL COMMENT '预警标题',
  content TEXT NULL COMMENT '预警内容',
  device_id BIGINT UNSIGNED NULL COMMENT '关联设备ID',
  discovered_at DATETIME NOT NULL COMMENT '发现时间',
  happened_at DATETIME NULL COMMENT '事件发生时间',
  location_text VARCHAR(255) NULL COMMENT '地点描述',
  border_section VARCHAR(64) NULL COMMENT '边境片区',
  latitude DECIMAL(10,8) NULL COMMENT '纬度',
  longitude DECIMAL(11,8) NULL COMMENT '经度',
  geo_point POINT SRID 4326 NULL COMMENT '地理点位',
  source_channel ENUM('device','manual','report','intelligence','other') NOT NULL DEFAULT 'device' COMMENT '来源渠道',
  species_name VARCHAR(128) NULL COMMENT '涉案物种',
  target_type ENUM('person','vehicle','animal','goods','unknown') NOT NULL DEFAULT 'unknown' COMMENT '目标类型',
  assigned_to BIGINT UNSIGNED NULL COMMENT '当前处置人',
  created_by BIGINT UNSIGNED NULL COMMENT '创建人',
  resolved_by BIGINT UNSIGNED NULL COMMENT '完成人',
  resolved_at DATETIME NULL COMMENT '完成时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_warnings_device
    FOREIGN KEY (device_id) REFERENCES devices(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_warnings_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_warnings_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_warnings_resolved_by
    FOREIGN KEY (resolved_by) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT chk_warnings_score CHECK (risk_score BETWEEN 0 AND 100),
  CONSTRAINT chk_warnings_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_warnings_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  INDEX idx_warnings_category_level_status_time (warning_category, risk_level, warning_status, discovered_at),
  INDEX idx_warnings_device_time (device_id, discovered_at),
  INDEX idx_warnings_status_time (warning_status, discovered_at),
  INDEX idx_warnings_border_section (border_section),
  INDEX idx_warnings_lat_lng (latitude, longitude),
  SPATIAL INDEX sp_idx_warnings_point (geo_point)
) ENGINE=InnoDB COMMENT='多维预警事件表';

-- 5) 任务表
CREATE TABLE tasks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
  task_code VARCHAR(64) NOT NULL UNIQUE COMMENT '任务编号',
  warning_id BIGINT UNSIGNED NOT NULL COMMENT '关联预警ID',
  task_type ENUM(
    'smuggling_disposal',
    'border_patrol',
    'evidence_collection',
    'eco_inspection',
    'fooddrug_inspection'
  ) NOT NULL DEFAULT 'smuggling_disposal' COMMENT '任务类型',
  title VARCHAR(255) NOT NULL COMMENT '任务标题',
  description TEXT NULL COMMENT '任务描述',
  task_status ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'high' COMMENT '优先级',
  assigned_user_id BIGINT UNSIGNED NOT NULL COMMENT '指派人员ID',
  assigned_by BIGINT UNSIGNED NULL COMMENT '指派人',
  deadline_at DATETIME NULL COMMENT '截止时间',
  started_at DATETIME NULL COMMENT '开始时间',
  completed_at DATETIME NULL COMMENT '完成时间',
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '进度(0-100)',
  location_text VARCHAR(255) NULL COMMENT '任务地点',
  latitude DECIMAL(10,8) NULL COMMENT '纬度',
  longitude DECIMAL(11,8) NULL COMMENT '经度',
  geo_point POINT SRID 4326 NULL COMMENT '地理点位',
  result_summary TEXT NULL COMMENT '处置结果',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_warning
    FOREIGN KEY (warning_id) REFERENCES warnings(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_tasks_assigned_user
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_tasks_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT chk_tasks_progress CHECK (progress BETWEEN 0 AND 100),
  CONSTRAINT chk_tasks_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_tasks_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  INDEX idx_tasks_warning (warning_id),
  INDEX idx_tasks_status_deadline (task_status, deadline_at),
  INDEX idx_tasks_assignee_status (assigned_user_id, task_status),
  INDEX idx_tasks_time (created_at, completed_at),
  INDEX idx_tasks_lat_lng (latitude, longitude),
  SPATIAL INDEX sp_idx_tasks_point (geo_point)
) ENGINE=InnoDB COMMENT='执法闭环任务表';

-- 6) 证据表
CREATE TABLE evidences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '证据ID',
  evidence_code VARCHAR(64) NOT NULL UNIQUE COMMENT '证据编号',
  warning_id BIGINT UNSIGNED NULL COMMENT '关联预警ID',
  task_id BIGINT UNSIGNED NULL COMMENT '关联任务ID',
  uploader_id BIGINT UNSIGNED NOT NULL COMMENT '上传人ID',
  evidence_type ENUM('image','video','audio','document','other') NOT NULL COMMENT '证据类型',
  file_url VARCHAR(1024) NOT NULL COMMENT '文件URL',
  thumb_url VARCHAR(1024) NULL COMMENT '缩略图URL',
  hash_sha256 CHAR(64) NULL COMMENT '文件哈希',
  file_size BIGINT UNSIGNED NULL COMMENT '文件大小字节',
  mime_type VARCHAR(128) NULL COMMENT 'MIME类型',
  duration_seconds INT UNSIGNED NULL COMMENT '时长(音视频)',
  location_text VARCHAR(255) NULL COMMENT '上传地点描述',
  latitude DECIMAL(10,8) NULL COMMENT '上传纬度',
  longitude DECIMAL(11,8) NULL COMMENT '上传经度',
  geo_point POINT SRID 4326 NULL COMMENT '上传地理点位',
  captured_at DATETIME NULL COMMENT '拍摄/录制时间',
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  chain_prev_hash CHAR(64) NULL COMMENT '证据链前序哈希',
  remark TEXT NULL COMMENT '备注',
  CONSTRAINT fk_evidences_warning
    FOREIGN KEY (warning_id) REFERENCES warnings(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_evidences_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_evidences_uploader
    FOREIGN KEY (uploader_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT chk_evidences_ref CHECK (warning_id IS NOT NULL OR task_id IS NOT NULL),
  CONSTRAINT chk_evidences_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_evidences_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  INDEX idx_evidences_task_time (task_id, uploaded_at),
  INDEX idx_evidences_warning_time (warning_id, uploaded_at),
  INDEX idx_evidences_type_time (evidence_type, uploaded_at),
  INDEX idx_evidences_uploader_time (uploader_id, uploaded_at),
  INDEX idx_evidences_lat_lng (latitude, longitude),
  SPATIAL INDEX sp_idx_evidences_point (geo_point)
) ENGINE=InnoDB COMMENT='证据与留痕表';

-- 7) 闭环流转轨迹表
CREATE TABLE warning_flows (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '流转记录ID',
  warning_id BIGINT UNSIGNED NOT NULL COMMENT '预警ID',
  task_id BIGINT UNSIGNED NULL COMMENT '任务ID',
  flow_stage ENUM('sensing','warning','disposal','evidence','analysis','closed') NOT NULL COMMENT '闭环阶段',
  action_code VARCHAR(64) NOT NULL COMMENT '动作编码',
  action_desc VARCHAR(255) NULL COMMENT '动作描述',
  operator_id BIGINT UNSIGNED NULL COMMENT '操作人',
  payload JSON NULL COMMENT '扩展载荷',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_warning_flows_warning
    FOREIGN KEY (warning_id) REFERENCES warnings(id)
    ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_warning_flows_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_warning_flows_operator
    FOREIGN KEY (operator_id) REFERENCES users(id)
    ON UPDATE RESTRICT ON DELETE SET NULL,
  INDEX idx_warning_flows_warning_time (warning_id, created_at),
  INDEX idx_warning_flows_stage_time (flow_stage, created_at),
  INDEX idx_warning_flows_operator_time (operator_id, created_at)
) ENGINE=InnoDB COMMENT='预警闭环流转记录表';

-- 8) 角色初始化
INSERT INTO roles (role_code, role_name, role_scope) VALUES
('ecology_police_officer', '生态警务执法员', 'district'),
('env_inspector', '环保检查员', 'district'),
('fooddrug_inspector', '食药检查员', 'district'),
('command_center', '指挥中心管理员', 'city'),
('system_admin', '系统管理员', 'global');
