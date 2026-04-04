-- ============================================
-- 预警系统增强脚本
-- 支持食品药品和生态警务维度
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 扩展alerts表 - 添加新的预警类型
-- ============================================

-- 修改alerts表的type字段，支持食品药品和执法类型
ALTER TABLE alerts MODIFY type ENUM(
  'water-pollution', 'air-pollution', 'soil-pollution', 'waste-pollution',
  'food-safety', 'drug-safety', 'hygiene-violation',
  'illegal-discharge', 'unauthorized-operation', 'violation-record'
) NOT NULL COMMENT '预警类型';

-- 添加维度字段
ALTER TABLE alerts ADD COLUMN dimension ENUM('ecology', 'fooddrug', 'enforcement') 
  DEFAULT 'ecology' COMMENT '预警维度' AFTER category;

-- 添加索引
ALTER TABLE alerts ADD INDEX idx_dimension (dimension);

-- ============================================
-- 2. 创建食品药品预警表
-- ============================================

DROP TABLE IF EXISTS fooddrug_alerts;
CREATE TABLE fooddrug_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预警ID',
  title VARCHAR(200) NOT NULL COMMENT '预警标题',
  description TEXT COMMENT '预警描述',
  level ENUM('critical', 'warning', 'info') DEFAULT 'warning' COMMENT '预警级别',
  status ENUM('pending', 'processing', 'resolved', 'ignored') DEFAULT 'pending' COMMENT '预警状态',
  type ENUM('food-safety', 'drug-safety', 'hygiene-violation') NOT NULL COMMENT '预警类型',
  product_name VARCHAR(255) COMMENT '产品名称',
  product_batch VARCHAR(100) COMMENT '产品批次',
  enterprise_id INT COMMENT '企业ID',
  enterprise_name VARCHAR(255) COMMENT '企业名称',
  risk_score INT DEFAULT 0 COMMENT '风险评分(0-100)',
  affected_population INT COMMENT '影响人口数',
  source ENUM('device', 'manual', 'hotline', 'social_media', 'enterprise') DEFAULT 'device' COMMENT '预警来源',
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
  INDEX idx_created_at (created_at),
  INDEX idx_risk_score (risk_score),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (risk_score >= 0 AND risk_score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食品药品预警表';

-- ============================================
-- 3. 创建生态警务预警表
-- ============================================

DROP TABLE IF EXISTS enforcement_alerts;
CREATE TABLE enforcement_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预警ID',
  title VARCHAR(200) NOT NULL COMMENT '预警标题',
  description TEXT COMMENT '预警描述',
  level ENUM('critical', 'warning', 'info') DEFAULT 'warning' COMMENT '预警级别',
  status ENUM('pending', 'processing', 'resolved', 'ignored') DEFAULT 'pending' COMMENT '预警状态',
  type ENUM('illegal-discharge', 'unauthorized-operation', 'violation-record') NOT NULL COMMENT '预警类型',
  location VARCHAR(255) NOT NULL COMMENT '位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  risk_score INT DEFAULT 0 COMMENT '风险评分(0-100)',
  officer_id INT NOT NULL COMMENT '执法人员ID',
  case_number VARCHAR(50) COMMENT '案件编号',
  evidence_count INT DEFAULT 0 COMMENT '证据数量',
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
  INDEX idx_officer_id (officer_id),
  INDEX idx_created_at (created_at),
  INDEX idx_risk_score (risk_score),
  INDEX idx_location (latitude, longitude),
  FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (risk_score >= 0 AND risk_score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生态警务预警表';

-- ============================================
-- 4. 创建食品药品产品表
-- ============================================

DROP TABLE IF EXISTS fooddrug_products;
CREATE TABLE fooddrug_products (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '产品ID',
  name VARCHAR(255) NOT NULL COMMENT '产品名称',
  type ENUM('food', 'drug', 'supplement') NOT NULL COMMENT '产品类型',
  batch_number VARCHAR(100) NOT NULL COMMENT '批次号',
  manufacturer VARCHAR(255) COMMENT '生产厂家',
  production_date DATE COMMENT '生产日期',
  expiry_date DATE COMMENT '过期日期',
  status ENUM('normal', 'recalled', 'suspended') DEFAULT 'normal' COMMENT '状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_batch_number (batch_number),
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食品药品产品表';

-- ============================================
-- 5. 创建食品药品召回表
-- ============================================

DROP TABLE IF EXISTS fooddrug_recalls;
CREATE TABLE fooddrug_recalls (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '召回ID',
  product_id INT NOT NULL COMMENT '产品ID',
  alert_id INT COMMENT '关联预警ID',
  reason TEXT NOT NULL COMMENT '召回原因',
  recall_level ENUM('class-i', 'class-ii', 'class-iii') COMMENT '召回等级',
  status ENUM('initiated', 'in-progress', 'completed') DEFAULT 'initiated' COMMENT '召回状态',
  affected_units INT COMMENT '影响单位数',
  created_by INT COMMENT '创建者ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_product_id (product_id),
  INDEX idx_status (status),
  FOREIGN KEY (product_id) REFERENCES fooddrug_products(id) ON DELETE CASCADE,
  FOREIGN KEY (alert_id) REFERENCES fooddrug_alerts(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食品药品召回表';

-- ============================================
-- 6. 创建执法证据表
-- ============================================

DROP TABLE IF EXISTS enforcement_evidence;
CREATE TABLE enforcement_evidence (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '证据ID',
  alert_id INT NOT NULL COMMENT '预警ID',
  type VARCHAR(50) COMMENT '证据类型',
  url VARCHAR(500) COMMENT '证据URL',
  description TEXT COMMENT '证据描述',
  uploaded_by INT COMMENT '上传者ID',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  INDEX idx_alert_id (alert_id),
  FOREIGN KEY (alert_id) REFERENCES enforcement_alerts(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执法证据表';

-- ============================================
-- 7. 创建执法处罚表
-- ============================================

DROP TABLE IF EXISTS enforcement_penalties;
CREATE TABLE enforcement_penalties (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '处罚ID',
  alert_id INT NOT NULL COMMENT '预警ID',
  penalty_type VARCHAR(100) COMMENT '处罚类型',
  penalty_amount DECIMAL(10, 2) COMMENT '处罚金额',
  penalty_description TEXT COMMENT '处罚说明',
  status ENUM('pending', 'issued', 'paid', 'appealed') DEFAULT 'pending' COMMENT '处罚状态',
  issued_by INT COMMENT '处罚人ID',
  issued_at DATETIME COMMENT '处罚时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_alert_id (alert_id),
  INDEX idx_status (status),
  FOREIGN KEY (alert_id) REFERENCES enforcement_alerts(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执法处罚表';

-- ============================================
-- 8. 插入测试数据
-- ============================================

-- 食品药品预警测试数据
INSERT INTO fooddrug_alerts (title, level, type, product_name, enterprise_name, risk_score, created_by) VALUES
('某品牌奶粉检出三聚氰胺', 'critical', 'food-safety', '某品牌婴幼儿奶粉', '南宁某乳制品企业', 95, 1),
('某药厂生产的感冒药不合格', 'warning', 'drug-safety', '感冒清热颗粒', '某制药公司', 75, 1),
('餐厅卫生检查发现违规', 'warning', 'hygiene-violation', '某餐厅', '某餐饮集团', 60, 1);

-- 生态警务预警测试数据
INSERT INTO enforcement_alerts (title, level, type, location, officer_id, risk_score, created_by) VALUES
('工业废水非法排放', 'critical', 'illegal-discharge', '某工业园区', 2, 90, 1),
('无证经营化工厂', 'critical', 'unauthorized-operation', '某镇工业区', 2, 85, 1),
('环保违规记录', 'warning', 'violation-record', '某企业', 2, 70, 1);

-- ============================================
-- 9. 验证表创建
-- ============================================

SHOW TABLES LIKE '%alert%';
SHOW TABLES LIKE '%fooddrug%';
SHOW TABLES LIKE '%enforcement%';

-- ============================================
-- 脚本执行完成
-- ============================================
