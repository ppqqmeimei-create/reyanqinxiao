-- ============================================
-- 热眼擒枭 - 食品药品模块数据库脚本
-- ============================================
-- 版本: 1.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 食品药品企业表 (fooddrug_enterprises)
-- ============================================
DROP TABLE IF EXISTS fooddrug_enterprises;
CREATE TABLE fooddrug_enterprises (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '企业ID',
  name VARCHAR(200) NOT NULL COMMENT '企业名称',
  type ENUM('food', 'drug', 'cosmetic', 'medical-device') NOT NULL COMMENT '企业类型',
  license_number VARCHAR(100) UNIQUE COMMENT '许可证号',
  location VARCHAR(255) NOT NULL COMMENT '企业位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  contact_person VARCHAR(50) COMMENT '联系人',
  contact_phone VARCHAR(20) COMMENT '联系电话',
  status ENUM('active', 'suspended', 'closed') DEFAULT 'active' COMMENT '企业状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食品药品企业表';

-- ============================================
-- 2. 食品药品产品表 (fooddrug_products)
-- ============================================
DROP TABLE IF EXISTS fooddrug_products;
CREATE TABLE fooddrug_products (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '产品ID',
  enterprise_id INT NOT NULL COMMENT '企业ID',
  name VARCHAR(200) NOT NULL COMMENT '产品名称',
  type ENUM('food', 'drug', 'cosmetic', 'medical-device') NOT NULL COMMENT '产品类型',
  category VARCHAR(100) COMMENT '产品分类',
  batch_number VARCHAR(100) COMMENT '批次号',
  production_date DATE COMMENT '生产日期',
  expiry_date DATE COMMENT '过期日期',
  quantity INT COMMENT '数量',
  unit VARCHAR(20) COMMENT '单位',
  status ENUM('normal', 'suspicious', 'recalled', 'destroyed') DEFAULT 'normal' COMMENT '产品状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_enterprise_id (enterprise_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_batch_number (batch_number),
  FOREIGN KEY (enterprise_id) REFERENCES fooddrug_enterprises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食品药品产品表';

-- ============================================
-- 3. 食品药品预警表 (fooddrug_alerts)
-- ============================================
DROP TABLE IF EXISTS fooddrug_alerts;
CREATE TABLE fooddrug_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预警ID',
  title VARCHAR(200) NOT NULL COMMENT '预警标题',
  description TEXT COMMENT '预警描述',
  type ENUM('food-safety', 'drug-safety', 'hygiene-violation', 'quality-issue') NOT NULL COMMENT '预警类型',
  level ENUM('critical', 'warning', 'info') DEFAULT 'warning' COMMENT '预警级别',
  status ENUM('pending', 'processing', 'resolved', 'ignored') DEFAULT 'pending' COMMENT '预警状态',
  enterprise_id INT COMMENT '企业ID',
  product_id INT COMMENT '产品ID',
  location VARCHAR(255) COMMENT '位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  risk_score INT DEFAULT 0 COMMENT '风险评分(0-100)',
  issue_description TEXT COMMENT '问题描述',
  affected_count INT COMMENT '影响数量',
  source ENUM('inspection', 'complaint', 'test', 'report') DEFAULT 'inspection' COMMENT '预警来源',
  assigned_to INT COMMENT '分配给（用户ID）',
  created_by INT COMMENT '创建者（用户ID）',
  resolved_by INT COMMENT '解决者（用户ID）',
  resolved_at DATETIME COMMENT '解决时间',
  resolution_notes TEXT COMMENT '解决备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_type (type),
  INDEX idx_level (level),
  INDEX idx_status (status),
  INDEX idx_enterprise_id (enterprise_id),
  INDEX idx_product_id (product_id),
  INDEX idx_created_at (created_at),
  INDEX idx_risk_score (risk_score),
  FOREIGN KEY (enterprise_id) REFERENCES fooddrug_enterprises(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES fooddrug_products(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (risk_score >= 0 AND risk_score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食品药品预警表';

-- ============================================
-- 4. 食品药品召回表 (fooddrug_recalls)
-- ============================================
DROP TABLE IF EXISTS fooddrug_recalls;
CREATE TABLE fooddrug_recalls (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '召回ID',
  product_id INT NOT NULL COMMENT '产品ID',
  reason VARCHAR(255) NOT NULL COMMENT '召回原因',
  level ENUM('class-i', 'class-ii', 'class-iii') DEFAULT 'class-iii' COMMENT '召回等级',
  status ENUM('initiated', 'in-progress', 'completed', 'cancelled') DEFAULT 'initiated' COMMENT '召回状态',
  recall_date DATE NOT NULL COMMENT '召回日期',
  deadline DATE COMMENT '截止日期',
  recovered_quantity INT DEFAULT 0 COMMENT '已回收数量',
  total_quantity INT COMMENT '总数量',
  recovery_rate DECIMAL(5, 2) COMMENT '回收率(%)',
  notes TEXT COMMENT '备注',
  created_by INT COMMENT '创建者（用户ID）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_product_id (product_id),
  INDEX idx_status (status),
  INDEX idx_recall_date (recall_date),
  FOREIGN KEY (product_id) REFERENCES fooddrug_products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食品药品召回表';

-- ============================================
-- 5. 食品药品检测记录表 (fooddrug_inspections)
-- ============================================
DROP TABLE IF EXISTS fooddrug_inspections;
CREATE TABLE fooddrug_inspections (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '检测ID',
  product_id INT NOT NULL COMMENT '产品ID',
  inspector_id INT NOT NULL COMMENT '检测员ID',
  inspection_date DATE NOT NULL COMMENT '检测日期',
  inspection_type VARCHAR(100) COMMENT '检测类型',
  result ENUM('pass', 'fail', 'conditional') DEFAULT 'pass' COMMENT '检测结果',
  findings TEXT COMMENT '检测发现',
  recommendations TEXT COMMENT '建议',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_product_id (product_id),
  INDEX idx_inspector_id (inspector_id),
  INDEX idx_inspection_date (inspection_date),
  FOREIGN KEY (product_id) REFERENCES fooddrug_products(id) ON DELETE CASCADE,
  FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='食品药品检测记录表';

-- ============================================
-- 插入测试数据
-- ============================================

-- 插入食品药品企业
INSERT INTO fooddrug_enterprises (name, type, license_number, location, latitude, longitude, contact_person, contact_phone, status) VALUES
('北京某食品有限公司', 'food', 'SC20110101001', '北京市朝阳区', 39.9042, 116.4074, '张三', '13800138000', 'active'),
('上海某药业有限公司', 'drug', 'YZ20110101002', '上海市浦东新区', 31.2304, 121.4737, '李四', '13800138001', 'active'),
('深圳某化妆品有限公司', 'cosmetic', 'XK20110101003', '深圳市南山区', 22.5431, 114.0579, '王五', '13800138002', 'active');

-- 插入食品药品产品
INSERT INTO fooddrug_products (enterprise_id, name, type, category, batch_number, production_date, expiry_date, quantity, unit, status) VALUES
(1, '某品牌牛奶', 'food', '乳制品', 'BATCH20260101', '2026-01-01', '2026-03-01', 1000, '盒', 'normal'),
(2, '某品牌感冒药', 'drug', '中成药', 'BATCH20260102', '2026-01-02', '2027-01-02', 500, '盒', 'normal'),
(3, '某品牌面膜', 'cosmetic', '护肤品', 'BATCH20260103', '2026-01-03', '2028-01-03', 2000, '片', 'normal');

-- 插入食品药品预警
INSERT INTO fooddrug_alerts (title, description, type, level, status, enterprise_id, product_id, location, latitude, longitude, risk_score, issue_description, affected_count, source) VALUES
('某品牌牛奶质量异常', '检测发现某批次牛奶菌落总数超标', 'food-safety', 'warning', 'pending', 1, 1, '北京市朝阳区', 39.9042, 116.4074, 65, '菌落总数超标2倍', 100, 'test'),
('某品牌感冒药成分不符', '检测发现某批次感冒药有效成分不足', 'drug-safety', 'critical', 'processing', 2, 2, '上海市浦东新区', 31.2304, 121.4737, 85, '有效成分不足30%', 50, 'inspection');
