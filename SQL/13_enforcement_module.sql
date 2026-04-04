-- ============================================
-- 热眼擒枭 - 生态警务模块数据库脚本
-- ============================================
-- 版本: 1.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 执法人员表 (enforcement_officers)
-- ============================================
DROP TABLE IF EXISTS enforcement_officers;
CREATE TABLE enforcement_officers (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '执法人员ID',
  user_id INT NOT NULL COMMENT '用户ID',
  badge_number VARCHAR(50) UNIQUE NOT NULL COMMENT '警号',
  rank VARCHAR(50) COMMENT '职级',
  department VARCHAR(100) COMMENT '所属部门',
  specialization VARCHAR(100) COMMENT '专业领域',
  status ENUM('on-duty', 'off-duty', 'on-leave') DEFAULT 'off-duty' COMMENT '状态',
  current_location VARCHAR(255) COMMENT '当前位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user_id (user_id),
  INDEX idx_badge_number (badge_number),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执法人员表';

-- ============================================
-- 2. 执法案件表 (enforcement_cases)
-- ============================================
DROP TABLE IF EXISTS enforcement_cases;
CREATE TABLE enforcement_cases (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '案件ID',
  case_number VARCHAR(100) UNIQUE NOT NULL COMMENT '案件编号',
  title VARCHAR(200) NOT NULL COMMENT '案件标题',
  description TEXT COMMENT '案件描述',
  type ENUM('illegal-discharge', 'unauthorized-operation', 'violation-record', 'equipment-failure') NOT NULL COMMENT '案件类型',
  level ENUM('critical', 'warning', 'info') DEFAULT 'warning' COMMENT '案件级别',
  status ENUM('pending', 'investigating', 'processing', 'closed') DEFAULT 'pending' COMMENT '案件状态',
  location VARCHAR(255) NOT NULL COMMENT '案件位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  suspect_name VARCHAR(100) COMMENT '嫌疑人/企业名称',
  suspect_contact VARCHAR(100) COMMENT '嫌疑人联系方式',
  violation_description TEXT COMMENT '违规描述',
  law_basis TEXT COMMENT '法律依据',
  officer_id INT COMMENT '负责执法人员ID',
  alert_id INT COMMENT '关联预警ID',
  created_by INT COMMENT '创建者（用户ID）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  closed_at DATETIME COMMENT '结案时间',
  INDEX idx_case_number (case_number),
  INDEX idx_type (type),
  INDEX idx_level (level),
  INDEX idx_status (status),
  INDEX idx_officer_id (officer_id),
  INDEX idx_alert_id (alert_id),
  FOREIGN KEY (officer_id) REFERENCES enforcement_officers(id) ON DELETE SET NULL,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执法案件表';

-- ============================================
-- 3. 执法证据表 (enforcement_evidence)
-- ============================================
DROP TABLE IF EXISTS enforcement_evidence;
CREATE TABLE enforcement_evidence (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '证据ID',
  case_id INT NOT NULL COMMENT '案件ID',
  type ENUM('photo', 'video', 'document', 'sample', 'testimony') NOT NULL COMMENT '证据类型',
  title VARCHAR(200) COMMENT '证据标题',
  description TEXT COMMENT '证据描述',
  file_url VARCHAR(500) COMMENT '文件URL',
  file_size INT COMMENT '文件大小(字节)',
  collected_by INT COMMENT '采集人ID',
  collected_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '采集时间',
  location VARCHAR(255) COMMENT '采集位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
  verified_by INT COMMENT '验证人ID',
  verified_at DATETIME COMMENT '验证时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_case_id (case_id),
  INDEX idx_type (type),
  INDEX idx_collected_by (collected_by),
  FOREIGN KEY (case_id) REFERENCES enforcement_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (collected_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执法证据表';

-- ============================================
-- 4. 执法处罚表 (enforcement_penalties)
-- ============================================
DROP TABLE IF EXISTS enforcement_penalties;
CREATE TABLE enforcement_penalties (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '处罚ID',
  case_id INT NOT NULL COMMENT '案件ID',
  penalty_type ENUM('warning', 'fine', 'suspension', 'revocation', 'criminal') NOT NULL COMMENT '处罚类型',
  penalty_amount DECIMAL(10, 2) COMMENT '罚款金额',
  penalty_description TEXT COMMENT '处罚描述',
  law_basis TEXT COMMENT '法律依据',
  status ENUM('pending', 'issued', 'paid', 'appealed', 'cancelled') DEFAULT 'pending' COMMENT '处罚状态',
  issued_date DATE COMMENT '下达日期',
  deadline DATE COMMENT '执行截止日期',
  paid_date DATE COMMENT '缴纳日期',
  issued_by INT COMMENT '下达人ID',
  notes TEXT COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_case_id (case_id),
  INDEX idx_penalty_type (penalty_type),
  INDEX idx_status (status),
  FOREIGN KEY (case_id) REFERENCES enforcement_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执法处罚表';

-- ============================================
-- 5. 执法行动记录表 (enforcement_actions)
-- ============================================
DROP TABLE IF EXISTS enforcement_actions;
CREATE TABLE enforcement_actions (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '行动ID',
  case_id INT NOT NULL COMMENT '案件ID',
  action_type VARCHAR(100) NOT NULL COMMENT '行动类型',
  description TEXT COMMENT '行动描述',
  location VARCHAR(255) COMMENT '行动位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  start_time DATETIME COMMENT '开始时间',
  end_time DATETIME COMMENT '结束时间',
  participants TEXT COMMENT '参与人员',
  result TEXT COMMENT '行动结果',
  created_by INT COMMENT '创建者（用户ID）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_case_id (case_id),
  INDEX idx_start_time (start_time),
  FOREIGN KEY (case_id) REFERENCES enforcement_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执法行动记录表';

-- ============================================
-- 插入测试数据
-- ============================================

-- 插入执法人员
INSERT INTO enforcement_officers (user_id, badge_number, rank, department, specialization, status) VALUES
(1, 'ENV001', '一级执法员', '环境监察大队', '水污染防治', 'on-duty'),
(2, 'ENV002', '二级执法员', '环境监察大队', '大气污染防治', 'on-duty'),
(3, 'ENV003', '三级执法员', '环境监察大队', '固废管理', 'off-duty');

-- 插入执法案件
INSERT INTO enforcement_cases (case_number, title, description, type, level, status, location, latitude, longitude, suspect_name, violation_description, law_basis, officer_id) VALUES
('ENV-CASE-2026-000001', '东兴沿海便道可疑中转点非法排污案', '发现东兴沿海便道可疑中转点未经处理直接排放废水', 'illegal-discharge', 'critical', 'investigating', '北京市朝阳区', 39.9042, 116.4074, '北京东兴沿海便道可疑中转点', '未经处理直接排放工业废水，COD超标5倍', '《水污染防治法》第83条', 1),
('ENV-CASE-2026-000002', '某企业无证经营案', '发现某企业无环保许可证经营', 'unauthorized-operation', 'warning', 'pending', '上海市浦东新区', 31.2304, 121.4737, '上海某企业', '无环保许可证擅自经营', '《环境保护法》第61条', 2);

-- 插入执法证据
INSERT INTO enforcement_evidence (case_id, type, title, description, collected_by, location) VALUES
(1, 'photo', '排污口照片', '拍摄到排污口直接排放废水', 1, '北京市朝阳区东兴沿海便道可疑中转点'),
(1, 'sample', '水样检测报告', 'COD检测值为500mg/L，超标5倍', 1, '北京市朝阳区东兴沿海便道可疑中转点'),
(2, 'document', '企业营业执照', '企业营业执照复印件', 2, '上海市浦东新区某企业');

-- 插入执法处罚
INSERT INTO enforcement_penalties (case_id, penalty_type, penalty_amount, penalty_description, law_basis, status, issued_date, deadline, issued_by) VALUES
(1, 'fine', 500000.00, '罚款50万元，责令停产整改', '《水污染防治法》第83条', 'issued', '2026-03-15', '2026-04-15', 1);
