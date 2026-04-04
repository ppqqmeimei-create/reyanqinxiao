-- =============================================
-- 热眼擒枭数据库初始化脚本
-- 文件: 01_init.sql
-- 描述: 创建数据库和所有基础表结构
-- =============================================

CREATE DATABASE IF NOT EXISTS reyanqinxiao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reyanqinxiao;

-- =============================================
-- 用户表 (扩展支持RBAC)
-- =============================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    badge_number VARCHAR(20) UNIQUE COMMENT '警号',
    role ENUM('admin', 'commander', 'investigator', 'frontline') NOT NULL DEFAULT 'frontline',
    permissions JSON COMMENT '权限点列表',
    department VARCHAR(100) COMMENT '所属单位',
    phone VARCHAR(20),
    email VARCHAR(100),
    avatar VARCHAR(255),
    status ENUM('active', 'inactive', 'locked') NOT NULL DEFAULT 'active',
    login_attempts INT DEFAULT 0 COMMENT '连续登录失败次数',
    locked_until DATETIME COMMENT '账号锁定截止时间',
    last_login DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_badge (badge_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- =============================================
-- 预警表 (增强AI研判字段)
-- =============================================
DROP TABLE IF EXISTS alerts;
CREATE TABLE alerts (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    level ENUM('critical', 'warning', 'info') NOT NULL DEFAULT 'warning',
    type VARCHAR(50) NOT NULL COMMENT '预警类型: 走私预警/生态预警/食药预警',
    category VARCHAR(50) COMMENT '分类',
    status ENUM('pending', 'assigned', 'in_progress', 'resolved', 'ignored') NOT NULL DEFAULT 'pending',
    confidence INT DEFAULT 0 COMMENT '置信度评分 0-100',
    species_type VARCHAR(100) COMMENT '物种类型',
    sensor_type VARCHAR(50) COMMENT '传感器类型',
    sensor_id VARCHAR(36),
    border_marker_id VARCHAR(36) COMMENT '触发界碑ID',
    zone_id VARCHAR(36) COMMENT '战区ID',
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    distance_to_border INT COMMENT '距边境距离(米)',
    risk_score DECIMAL(5, 2) COMMENT '风险评分',
    risk_level VARCHAR(20),
    pollutant_type VARCHAR(100),
    pollutant_value DECIMAL(10, 2),
    affected_population INT,
    source ENUM('device', 'manual', 'hotline', 'social_media', 'enterprise') DEFAULT 'device',
    frequency INT DEFAULT 1 COMMENT '该区域历史触发次数',
    time_of_day ENUM('day', 'night') DEFAULT 'day',
    assignee_id VARCHAR(36),
    assigned_at DATETIME,
    resolved_at DATETIME,
    resolution_notes TEXT,
    created_by VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_level (level),
    INDEX idx_status (status),
    INDEX idx_zone (zone_id),
    INDEX idx_created (created_at),
    INDEX idx_assignee (assignee_id),
    INDEX idx_confidence (confidence)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预警表';

-- =============================================
-- 任务表 (增强)
-- =============================================
DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type ENUM('quick-sampling', 'complete-sampling', 'inspection', 'monitoring') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    alert_id VARCHAR(36) COMMENT '关联预警',
    zone_id VARCHAR(36) COMMENT '战区ID',
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    assigned_to VARCHAR(36) NOT NULL COMMENT '负责人',
    created_by VARCHAR(36) NOT NULL,
    progress INT DEFAULT 0 COMMENT '进度 0-100',
    evidence_list JSON COMMENT '关联取证记录ID列表',
    checklist JSON COMMENT '任务检查清单',
    trajectory JSON COMMENT '任务轨迹点',
    start_time DATETIME,
    deadline DATETIME,
    completed_at DATETIME,
    completion_notes TEXT,
    collaboration_status ENUM('independent', 'pending', 'in_progress', 'completed') DEFAULT 'independent',
    collaboration_notes TEXT,
    joint_case_no VARCHAR(50) COMMENT '联合案件编号',
    joint_departments JSON COMMENT '联合单位列表',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_assigned (assigned_to),
    INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务表';

-- =============================================
-- 设备表 (云边端架构)
-- =============================================
DROP TABLE IF EXISTS devices;
CREATE TABLE devices (
    id VARCHAR(36) PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL UNIQUE COMMENT '设备唯一标识',
    name VARCHAR(100) NOT NULL,
    type ENUM('infrared', 'vibration', 'visible', 'gps', 'drone', 'smell', 'water', 'air') NOT NULL,
    status ENUM('online', 'warning', 'offline') NOT NULL DEFAULT 'offline',
    zone_id VARCHAR(36) COMMENT '所属战区',
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    sensitivity INT DEFAULT 70 COMMENT '灵敏度 0-100',
    edge_node_id VARCHAR(36) COMMENT '边缘节点ID',
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    firmware_version VARCHAR(50),
    battery INT COMMENT '电量百分比',
    signal INT COMMENT '信号强度百分比',
    last_heartbeat DATETIME,
    enabled BOOLEAN DEFAULT TRUE,
    config JSON COMMENT '设备配置',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_zone (zone_id),
    INDEX idx_heartbeat (last_heartbeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';

-- =============================================
-- 取证表 (防伪溯源)
-- =============================================
DROP TABLE IF EXISTS evidence;
CREATE TABLE evidence (
    id VARCHAR(36) PRIMARY KEY,
    check_code VARCHAR(50) NOT NULL UNIQUE COMMENT '防伪校验码',
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT COMMENT '文件大小(字节)',
    mime_type VARCHAR(100),
    capture_time DATETIME NOT NULL COMMENT '采集时间',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    watermark JSON COMMENT '水印信息',
    operator VARCHAR(36) NOT NULL COMMENT '执法人员',
    user_id VARCHAR(36) NOT NULL,
    alert_id VARCHAR(36) COMMENT '关联预警',
    task_id VARCHAR(36) COMMENT '关联任务',
    sync_status ENUM('synced', 'pending', 'failed') DEFAULT 'synced',
    verified BOOLEAN DEFAULT FALSE,
    verification_time DATETIME,
    verification_result JSON,
    gps VARCHAR(100) COMMENT 'GPS原始数据',
    device_id VARCHAR(36) COMMENT '采集设备',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_check_code (check_code),
    INDEX idx_operator (operator),
    INDEX idx_alert (alert_id),
    INDEX idx_sync (sync_status),
    INDEX idx_capture_time (capture_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='取证表';

-- =============================================
-- 战区表 (五大战区)
-- =============================================
DROP TABLE IF EXISTS zones;
CREATE TABLE zones (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '战区名称',
    code VARCHAR(20) UNIQUE COMMENT '战区编码',
    risk_level ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('active', 'inactive') DEFAULT 'active',
    center_lat DECIMAL(10, 7) COMMENT '中心纬度',
    center_lng DECIMAL(10, 7) COMMENT '中心经度',
    scale INT DEFAULT 14 COMMENT '默认地图缩放级别',
    boundary JSON COMMENT '边界坐标',
    description TEXT,
    device_count INT DEFAULT 0,
    alert_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='战区表';

-- =============================================
-- 界碑表
-- =============================================
DROP TABLE IF EXISTS border_markers;
CREATE TABLE border_markers (
    id VARCHAR(36) PRIMARY KEY,
    marker_no VARCHAR(20) NOT NULL UNIQUE COMMENT '界碑编号',
    name VARCHAR(100),
    zone_id VARCHAR(36) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    marker_type ENUM('main', 'auxiliary', 'temporary') DEFAULT 'main',
    status ENUM('active', 'damaged', 'relocated') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_zone (zone_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='界碑表';

-- =============================================
-- 系统日志表
-- =============================================
DROP TABLE IF EXISTS system_logs;
CREATE TABLE system_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    level ENUM('info', 'warn', 'error') NOT NULL,
    action VARCHAR(100) NOT NULL,
    operator VARCHAR(36) COMMENT '操作人ID',
    operator_name VARCHAR(100),
    ip VARCHAR(45),
    user_agent TEXT,
    target_type VARCHAR(50) COMMENT '操作对象类型',
    target_id VARCHAR(36) COMMENT '操作对象ID',
    detail TEXT,
    request_data JSON,
    response_status INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_level (level),
    INDEX idx_action (action),
    INDEX idx_operator (operator),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统日志表';

-- =============================================
-- AI配置表
-- =============================================
DROP TABLE IF EXISTS ai_config;
CREATE TABLE ai_config (
    id VARCHAR(36) PRIMARY KEY,
    model_version VARCHAR(50) NOT NULL,
    model_name VARCHAR(100),
    confidence_threshold INT DEFAULT 85 COMMENT '置信度阈值',
    enable_auto_alert BOOLEAN DEFAULT TRUE,
    update_time DATETIME,
    update_notes TEXT,
    accuracy DECIMAL(5, 2) COMMENT '模型准确率',
    status ENUM('active', 'training', 'deprecated') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI模型配置表';

COMMIT;
