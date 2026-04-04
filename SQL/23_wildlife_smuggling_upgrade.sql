-- ============================================
-- 热眼擒枭——边境活物走私智能防控系统
-- 数据库升级脚本：走私防控核心模块
-- 版本: 2.0.0
-- 日期: 2026-03-22
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 扩展用户表：新增生态警务相关字段
-- ============================================
ALTER TABLE users
  MODIFY COLUMN role ENUM(
    'ecology_commander',    -- 环食药总队生态警务指挥岗（最高权限）
    'border_patrol',        -- 环食药总队边境巡逻执法岗（核心一线）
    'ecology_inspector',    -- 生态警务执法员
    'food_drug_inspector',  -- 食品药品检查员
    'env_inspector',        -- 环保检查员
    'manager',              -- 管理员
    'admin'                 -- 系统管理员
  ) DEFAULT 'border_patrol' COMMENT '角色（生态警务优先级最高）',
  ADD COLUMN IF NOT EXISTS duty_zone VARCHAR(100) COMMENT '执勤辖区',
  ADD COLUMN IF NOT EXISTS squad VARCHAR(100) COMMENT '所属支队',
  ADD COLUMN IF NOT EXISTS cases_handled INT DEFAULT 0 COMMENT '走私案件处置数',
  ADD COLUMN IF NOT EXISTS leads_verified INT DEFAULT 0 COMMENT '线索核实数',
  ADD COLUMN IF NOT EXISTS animals_seized INT DEFAULT 0 COMMENT '查获活体数量',
  ADD COLUMN IF NOT EXISTS patrol_distance DECIMAL(10,2) DEFAULT 0 COMMENT '巡逻里程(km)',
  ADD COLUMN IF NOT EXISTS work_days INT DEFAULT 0 COMMENT '出勤天数';

-- ============================================
-- 2. 扩展预警表：新增走私防控预警类型
-- ============================================
ALTER TABLE alerts
  MODIFY COLUMN type ENUM(
    'wildlife-smuggling',    -- 活物走私预警（核心）
    'border-intrusion',      -- 边境入侵预警
    'suspicious-vehicle',    -- 可疑车辆预警
    'checkpoint-anomaly',    -- 卡口异常预警
    'illegal-transport',     -- 非法运输预警
    'water-pollution',       -- 水质污染预警
    'air-pollution',         -- 空气污染预警
    'soil-pollution',        -- 土壤污染预警
    'waste-pollution',       -- 废弃物污染预警
    'food-safety',           -- 食品安全预警
    'drug-safety'            -- 药品安全预警
  ) NOT NULL COMMENT '预警类型（走私防控优先）',
  MODIFY COLUMN category ENUM(
    'wildlife',    -- 野生动物（核心）
    'border',      -- 边境防控
    'vehicle',     -- 可疑车辆
    'checkpoint',  -- 卡口
    'water',
    'air',
    'soil',
    'waste',
    'food',
    'drug'
  ) NOT NULL COMMENT '预警分类',
  ADD COLUMN IF NOT EXISTS species_name VARCHAR(200) COMMENT '涉案物种名称',
  ADD COLUMN IF NOT EXISTS protection_level ENUM('国家一级','国家二级','省级','CITES附录I','CITES附录II','其他') COMMENT '保护级别',
  ADD COLUMN IF NOT EXISTS animal_count INT COMMENT '涉案活体数量',
  ADD COLUMN IF NOT EXISTS smuggling_route VARCHAR(500) COMMENT '走私路径描述',
  ADD COLUMN IF NOT EXISTS nearby_officers INT DEFAULT 0 COMMENT '附近可调警力数',
  ADD COLUMN IF NOT EXISTS legal_basis VARCHAR(500) COMMENT '执法法律依据',
  ADD COLUMN IF NOT EXISTS penalty_suggestion TEXT COMMENT '处罚建议';

-- ============================================
-- 3. 扩展任务表：新增走私案件执法类型
-- ============================================
ALTER TABLE tasks
  MODIFY COLUMN type ENUM(
    'wildlife-case',        -- 边境活物走私案件执法（默认核心模板）
    'border-patrol',        -- 边境巡逻任务
    'checkpoint-control',   -- 卡口布控任务
    'arrest-operation',     -- 抓捕行动
    'evidence-collection',  -- 证据采集
    'quick-sampling',
    'complete-sampling',
    'inspection',
    'monitoring'
  ) NOT NULL COMMENT '任务类型（走私案件为默认模板）',
  ADD COLUMN IF NOT EXISTS case_nature VARCHAR(100) COMMENT '案件性质',
  ADD COLUMN IF NOT EXISTS suspect_info TEXT COMMENT '涉案人员信息（JSON）',
  ADD COLUMN IF NOT EXISTS vehicle_info VARCHAR(500) COMMENT '运输工具信息',
  ADD COLUMN IF NOT EXISTS transfer_record TEXT COMMENT '移交记录',
  ADD COLUMN IF NOT EXISTS species_confirmed VARCHAR(500) COMMENT '确认物种/保护级别';

-- ============================================
-- 4. 新增：野生动物走私案件表 (wildlife_cases)
-- ============================================
CREATE TABLE IF NOT EXISTS wildlife_cases (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '案件ID',
  case_number VARCHAR(50) NOT NULL UNIQUE COMMENT '案件编号（格式：WL-YYYY-XXXXXX）',
  title VARCHAR(200) NOT NULL COMMENT '案件标题',
  status ENUM('reporting','investigating','arresting','closed','transferred') DEFAULT 'reporting' COMMENT '案件状态',
  priority ENUM('low','medium','high','urgent') DEFAULT 'high' COMMENT '优先级',
  alert_id INT COMMENT '关联预警ID',
  task_id INT COMMENT '关联任务ID',
  assigned_to INT COMMENT '负责人（用户ID）',
  created_by INT COMMENT '创建者（用户ID）',

  -- 物种信息
  species_name VARCHAR(200) NOT NULL COMMENT '涉案物种名称',
  species_scientific VARCHAR(200) COMMENT '物种学名',
  protection_level ENUM('国家一级','国家二级','省级','CITES附录I','CITES附录II','其他') COMMENT '保护级别',
  animal_count INT DEFAULT 0 COMMENT '活体数量',
  animal_condition ENUM('活体','死体','制品','混合') DEFAULT '活体' COMMENT '动物状态',

  -- 走私路径
  origin_location VARCHAR(255) COMMENT '来源地',
  destination VARCHAR(255) COMMENT '目的地',
  smuggling_route TEXT COMMENT '走私路径描述',
  border_crossing VARCHAR(100) COMMENT '涉及边境口岸',

  -- 案件地点
  location VARCHAR(255) NOT NULL COMMENT '发现地点',
  latitude DECIMAL(10,8) COMMENT '纬度',
  longitude DECIMAL(11,8) COMMENT '经度',

  -- 涉案人员
  suspect_count INT DEFAULT 0 COMMENT '涉案人员数',
  suspect_info TEXT COMMENT '涉案人员信息（JSON数组）',
  vehicle_info VARCHAR(500) COMMENT '运输工具信息',

  -- 执法信息
  law_enforcement_unit VARCHAR(100) COMMENT '执法单位',
  legal_basis TEXT COMMENT '适用法律条款',
  penalty_amount DECIMAL(12,2) COMMENT '建议罚款金额',
  case_notes TEXT COMMENT '案件备注',
  transfer_record TEXT COMMENT '移交记录',
  evidence_hash VARCHAR(64) COMMENT '证据链哈希值（SHA-256）',

  -- 时间
  incident_time DATETIME COMMENT '案发时间',
  closed_at DATETIME COMMENT '结案时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_case_number (case_number),
  INDEX idx_status (status),
  INDEX idx_protection_level (protection_level),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at),
  INDEX idx_location (latitude, longitude),
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='野生动物走私案件表';

-- ============================================
-- 5. 新增：生物样本采样表 (biological_samples)
-- ============================================
CREATE TABLE IF NOT EXISTS biological_samples (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '样本ID',
  sample_number VARCHAR(50) NOT NULL UNIQUE COMMENT '样本编号',
  case_id INT COMMENT '关联案件ID',
  task_id INT COMMENT '关联任务ID',
  collected_by INT COMMENT '采样人（用户ID）',

  sample_type ENUM('血样','毛发','组织','粪便','羽毛','鳞片','DNA','其他') NOT NULL COMMENT '样本类型',
  species_name VARCHAR(200) COMMENT '涉案物种',
  animal_id VARCHAR(100) COMMENT '个体编号',
  sample_condition VARCHAR(100) COMMENT '样本状态',
  collection_location VARCHAR(255) COMMENT '采样地点',
  latitude DECIMAL(10,8) COMMENT '纬度',
  longitude DECIMAL(11,8) COMMENT '经度',
  collection_time DATETIME COMMENT '采样时间',

  storage_temp VARCHAR(50) COMMENT '储存温度',
  preservation_method VARCHAR(100) COMMENT '保存方法',
  lab_sent_to VARCHAR(200) COMMENT '送检机构',
  lab_status ENUM('待送检','已送检','检测中','已出报告') DEFAULT '待送检' COMMENT '检测状态',
  lab_result TEXT COMMENT '检测结果',
  sample_photo_url VARCHAR(500) COMMENT '样本照片URL',
  evidence_hash VARCHAR(64) COMMENT '样本哈希值',
  notes TEXT COMMENT '备注',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_sample_number (sample_number),
  INDEX idx_case_id (case_id),
  INDEX idx_task_id (task_id),
  INDEX idx_lab_status (lab_status),
  FOREIGN KEY (case_id) REFERENCES wildlife_cases(id) ON DELETE SET NULL,
  FOREIGN KEY (collected_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生物样本采样表';

-- ============================================
-- 6. 新增：边境防控设备表 (border_devices)
-- ============================================
CREATE TABLE IF NOT EXISTS border_devices (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '设备ID',
  device_code VARCHAR(50) NOT NULL UNIQUE COMMENT '设备编码',
  name VARCHAR(100) NOT NULL COMMENT '设备名称',
  device_type ENUM(
    'infrared-camera',    -- 红外热成像摄像头
    'fiber-vibration',    -- 边境震动光纤
    'checkpoint-camera',  -- 卡口抓拍摄像头
    'life-radar',         -- 活体探测雷达
    'body-camera',        -- 执法记录仪
    'drone',              -- 无人机巡检设备
    'gps-tracker',        -- GPS追踪器
    'audio-recorder'      -- 音频记录器
  ) NOT NULL COMMENT '边境防控设备类型',
  status ENUM('online','offline','warning','error') DEFAULT 'offline' COMMENT '设备状态',

  -- 位置
  location_name VARCHAR(255) NOT NULL COMMENT '部署地点名称',
  border_section VARCHAR(100) COMMENT '边境段名称（如：东兴段）',
  latitude DECIMAL(10,8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11,8) NOT NULL COMMENT '经度',

  -- 状态
  battery INT COMMENT '电池电量(0-100)',
  signal_strength INT COMMENT '信号强度(0-100)',
  is_remote_controllable BOOLEAN DEFAULT FALSE COMMENT '是否支持远程控制',
  responsible_officer INT COMMENT '负责警员（用户ID）',

  -- 触发统计
  trigger_count_today INT DEFAULT 0 COMMENT '今日触发次数',
  last_trigger DATETIME COMMENT '最近触发时间',
  last_heartbeat DATETIME COMMENT '最近心跳时间',

  firmware_version VARCHAR(50) COMMENT '固件版本',
  installation_date DATE COMMENT '安装日期',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  notes TEXT COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_device_type (device_type),
  INDEX idx_status (status),
  INDEX idx_border_section (border_section),
  INDEX idx_location (latitude, longitude),
  FOREIGN KEY (responsible_officer) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (battery >= 0 AND battery <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='边境防控设备表';

-- ============================================
-- 7. 新增：走私预警表 (smuggling_alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS smuggling_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预警ID',
  alert_code VARCHAR(50) NOT NULL UNIQUE COMMENT '预警编号（格式：SA-YYYY-XXXXXX）',
  alert_type ENUM(
    'infrared-trigger',   -- 红外触发活体目标
    'checkpoint-anomaly', -- 卡口可疑车辆
    'report',             -- 群众举报
    'patrol-discovery',   -- 巡逻发现
    'intelligence'        -- 情报线索
  ) NOT NULL COMMENT '预警类型',
  level ENUM('critical','warning','info') DEFAULT 'warning' COMMENT '预警级别',
  status ENUM('pending','dispatched','processing','resolved','ignored') DEFAULT 'pending' COMMENT '处置状态',

  species_name VARCHAR(200) COMMENT '疑似物种',
  animal_count INT COMMENT '疑似数量',
  protection_level ENUM('国家一级','国家二级','省级','CITES附录I','CITES附录II','未知') COMMENT '保护级别',
  target_moving_direction VARCHAR(100) COMMENT '目标移动方向',
  location VARCHAR(255) NOT NULL COMMENT '发现地点',
  latitude DECIMAL(10,8) COMMENT '纬度',
  longitude DECIMAL(11,8) COMMENT '经度',
  border_section VARCHAR(100) COMMENT '边境段',
  triggered_by_device INT COMMENT '触发设备ID',
  device_snapshot_url VARCHAR(500) COMMENT '设备抓拍图片URL',
  risk_score INT DEFAULT 0 COMMENT '走私风险评分(0-100)',
  hotspot_level INT DEFAULT 0 COMMENT '点位走私高发等级(0-5)',
  historical_case_count INT DEFAULT 0 COMMENT '该位置历史案件数',
  nearby_officers INT DEFAULT 0 COMMENT '附近可调警力数',
  dispatched_officers TEXT COMMENT '已派警员ID列表（JSON）',
  assigned_to INT COMMENT '接警人员（用户ID）',
  legal_basis VARCHAR(500) COMMENT '执法法律依据',
  penalty_suggestion TEXT COMMENT '处罚建议',
  resolution_notes TEXT COMMENT '处置备注',
  resolved_at DATETIME COMMENT '处置时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_alert_code (alert_code),
  INDEX idx_sa_level (level),
  INDEX idx_sa_status (status),
  INDEX idx_alert_type (alert_type),
  INDEX idx_risk_score (risk_score),
  INDEX idx_border_section (border_section),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (risk_score >= 0 AND risk_score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='走私预警表';

-- 初始化广西边境防控设备示例数据（试点：防城港市东兴市、崇左市凭祥市）
INSERT IGNORE INTO border_devices (
  device_code, name, device_type, status,
  location_name, border_section, latitude, longitude,
  battery, signal_strength, is_remote_controllable
) VALUES
  ('BD-IR-001','东兴口岸红外热成像摄像头A','infrared-camera','online','广西防城港市东兴口岸北侧','东兴段',21.5450,107.9720,85,92,TRUE),
  ('BD-FV-001','万尾金滩边境震动光纤01','fiber-vibration','warning','广西防城港市东兴万尾金滩界碑沿线','东兴段',21.5318,108.0325,76,83,FALSE),
  ('BD-CC-001','万尾金滩卡口抓拍摄像头','checkpoint-camera','online','广西防城港市东兴万尾金滩卡口','东兴段',21.5318,108.0325,100,95,TRUE),
  ('BD-IR-002','友谊关口岸红外热成像摄像头','infrared-camera','warning','广西崇左市凭祥友谊关口岸','凭祥段',22.1128,106.7612,23,65,TRUE),
  ('BD-CC-002','友谊关卡口抓拍摄像头','checkpoint-camera','online','广西崇左市凭祥友谊关卡口','凭祥段',22.1080,106.7620,91,87,TRUE),
  ('BD-LR-001','龙州水口口岸活体探测雷达01','life-radar','online','广西崇左市龙州县水口口岸','龙州段',22.4868,106.6719,78,80,FALSE),
  ('BD-FV-002','那坡界碑震动光纤01','fiber-vibration','warning','广西百色市那坡县中越界碑沿线','那坡段',23.4245,105.8336,69,74,FALSE),
  ('BD-DR-001','广西边境无人机巡检001','drone','offline','广西环食药侦查总队边境指挥中心','广西总部',22.8250,108.3650,0,0,TRUE);

-- 初始化广西试点走私预警案例（用户要求的三类案例）
INSERT IGNORE INTO smuggling_alerts (
  alert_code, alert_type, level, status,
  species_name, animal_count, protection_level,
  target_moving_direction, location, latitude, longitude, border_section,
  risk_score, hotspot_level, historical_case_count, nearby_officers,
  legal_basis, penalty_suggestion
) VALUES
  ('SA-2026-000101','checkpoint-anomaly','critical','pending','食蟹猴',12,'CITES附录II','北偏东15°','东兴市万尾金滩沿海便道发现疑似非法运输食蟹猴',21.5318,108.0325,'东兴段',94,5,7,5,'《野生动物保护法》第二十三条；《濒危野生动植物种国际贸易公约》','立即拦截车辆，固定证据后移送刑侦'),
  ('SA-2026-000102','infrared-trigger','critical','pending','穿山甲',3,'国家一级','西向','凭祥市友谊关附近红外相机抓拍疑似穿山甲走私',22.1128,106.7612,'凭祥段',96,5,10,4,'《野生动物保护法》第二十四条；《刑法》第三百四十一条','立即布控友谊关及周边卡口并开展联合查缉'),
  ('SA-2026-000103','intelligence','warning','processing','未知活体',0,'未知','南向','中越边境那坡县某界碑处发现异常震动',23.4245,105.8336,'那坡段',82,4,5,3,'《边境管理条例》；《野生动物保护法》','扩大巡查半径并启用无人机热成像复核');

-- 初始化广西试点案件（执法主体限定为广西环食药侦查总队及下属边境支队）
INSERT IGNORE INTO wildlife_cases (
  case_number, title, status, priority,
  species_name, protection_level, animal_count, animal_condition,
  location, latitude, longitude, border_crossing,
  suspect_count, law_enforcement_unit, legal_basis, case_notes, incident_time
) VALUES
  ('WL-2026-000101','东兴万尾金滩疑似食蟹猴非法运输案','investigating','urgent','食蟹猴','CITES附录II',12,'活体','广西东兴市万尾金滩边境便道',21.5318,108.0325,'东兴口岸',2,'广西环食药侦查总队东兴边境支队','《野生动物保护法》第二十三条','根据卡口异常预警立案侦查',DATE_SUB(NOW(), INTERVAL 3 HOUR)),
  ('WL-2026-000102','友谊关疑似穿山甲走私案','investigating','urgent','中华穿山甲','国家一级',3,'活体','广西凭祥市友谊关附近边境路段',22.1128,106.7612,'友谊关口岸',3,'广西环食药侦查总队凭祥边境支队','《野生动物保护法》第二十四条；《刑法》第三百四十一条','红外相机抓拍触发预警后立案',DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  ('WL-2026-000103','那坡界碑异常震动线索核查案','investigating','high','未知活体','未知',0,'混合','广西那坡县中越边境某界碑',23.4245,105.8336,'那坡边境点位',1,'广西环食药侦查总队那坡边境支队','《边境管理条例》','由异常震动情报线索转立案核查',DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- 升级完成
SELECT '热眼擒枭走私防控模块数据库升级完成 v2.0.0（广西试点）' AS upgrade_status;
