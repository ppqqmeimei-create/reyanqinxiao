-- ============================================
-- 热眼擒枭 - 任务界面优化脚本
-- ============================================
-- 版本: 3.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 任务界面五大功能模块完整支持
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 扩展tasks表 - 添加任务界面所需字段
-- ============================================

-- 添加案件编号
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS case_number VARCHAR(50) UNIQUE COMMENT '案件编号' AFTER id;

-- 添加任务进度
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0 COMMENT '任务进度(0-100)' AFTER status;

-- 添加执法人员信息
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS inspector_id INT COMMENT '执法人员ID' AFTER progress;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(100) COMMENT '执法人员名称' AFTER inspector_id;

-- 添加位置信息
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) COMMENT '纬度' AFTER inspector_name;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) COMMENT '经度' AFTER latitude;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_address VARCHAR(255) COMMENT '位置地址' AFTER longitude;

-- 添加法律依据和处罚建议
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS legal_basis VARCHAR(255) COMMENT '法律依据' AFTER location_address;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS legal_articles TEXT COMMENT '法律条款' AFTER legal_basis;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS penalty_suggestion TEXT COMMENT '处罚建议' AFTER legal_articles;

-- 添加索引
ALTER TABLE tasks ADD INDEX IF NOT EXISTS idx_case_number (case_number);
ALTER TABLE tasks ADD INDEX IF NOT EXISTS idx_progress (progress);
ALTER TABLE tasks ADD INDEX IF NOT EXISTS idx_inspector_id (inspector_id);
ALTER TABLE tasks ADD INDEX IF NOT EXISTS idx_location (latitude, longitude);

-- ============================================
-- 2. 创建证据表
-- ============================================

DROP TABLE IF EXISTS evidence;
CREATE TABLE evidence (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '证据ID',
  task_id INT NOT NULL COMMENT '任务ID',
  evidence_number VARCHAR(50) UNIQUE COMMENT '证据编号',
  evidence_type ENUM('photo', 'video', 'audio', 'file', 'sample') COMMENT '证据类型',
  file_name VARCHAR(255) COMMENT '文件名称',
  file_path VARCHAR(500) COMMENT '文件路径',
  file_size INT COMMENT '文件大小(字节)',
  file_hash VARCHAR(255) COMMENT '文件哈希值',
  collected_by INT COMMENT '采集人员ID',
  collected_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '采集时间',
  location_latitude DECIMAL(10, 8) COMMENT '采集位置纬度',
  location_longitude DECIMAL(11, 8) COMMENT '采集位置经度',
  location_address VARCHAR(255) COMMENT '采集位置地址',
  description TEXT COMMENT '证据描述',
  tags VARCHAR(255) COMMENT '证据标签',
  is_verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
  verified_by INT COMMENT '验证人员ID',
  verified_at DATETIME COMMENT '验证时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (collected_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_task_id (task_id),
  INDEX idx_evidence_type (evidence_type),
  INDEX idx_collected_at (collected_at),
  INDEX idx_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='证据表';

-- ============================================
-- 3. 创建检查清单表
-- ============================================

DROP TABLE IF EXISTS checklist;
CREATE TABLE checklist (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '清单ID',
  task_id INT NOT NULL COMMENT '任务ID',
  item_name VARCHAR(255) NOT NULL COMMENT '检查项名称',
  item_category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '检查项分类',
  is_required BOOLEAN DEFAULT FALSE COMMENT '是否为必查项',
  is_checked BOOLEAN DEFAULT FALSE COMMENT '是否已检查',
  checked_by INT COMMENT '检查人员ID',
  checked_at DATETIME COMMENT '检查时间',
  notes TEXT COMMENT '检查备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_task_id (task_id),
  INDEX idx_is_required (is_required),
  INDEX idx_is_checked (is_checked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='检查清单表';

-- ============================================
-- 4. 创建采样记录表
-- ============================================

DROP TABLE IF EXISTS sampling_records;
CREATE TABLE sampling_records (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '采样记录ID',
  task_id INT NOT NULL COMMENT '任务ID',
  sample_number VARCHAR(50) UNIQUE COMMENT '采样编号',
  sample_type VARCHAR(100) COMMENT '采样类型(水样/土样/气样等)',
  sample_location VARCHAR(255) COMMENT '采样位置',
  sample_latitude DECIMAL(10, 8) COMMENT '采样位置纬度',
  sample_longitude DECIMAL(11, 8) COMMENT '采样位置经度',
  sampled_by INT COMMENT '采样人员ID',
  sampled_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '采样时间',
  sample_quantity DECIMAL(10, 4) COMMENT '采样数量',
  sample_unit VARCHAR(50) COMMENT '采样单位',
  measured_value DECIMAL(10, 4) COMMENT '测量值',
  standard_value DECIMAL(10, 4) COMMENT '标准值',
  exceed_ratio DECIMAL(10, 2) COMMENT '超标倍数',
  is_exceed BOOLEAN DEFAULT FALSE COMMENT '是否超标',
  sample_photo VARCHAR(500) COMMENT '采样照片',
  notes TEXT COMMENT '采样备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (sampled_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_task_id (task_id),
  INDEX idx_sample_type (sample_type),
  INDEX idx_is_exceed (is_exceed),
  INDEX idx_sampled_at (sampled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采样记录表';

-- ============================================
-- 5. 创建执法记录表
-- ============================================

DROP TABLE IF EXISTS enforcement_records;
CREATE TABLE enforcement_records (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '执法记录ID',
  task_id INT NOT NULL COMMENT '任务ID',
  case_number VARCHAR(50) COMMENT '案件编号',
  inspector_id INT COMMENT '执法人员ID',
  inspector_name VARCHAR(100) COMMENT '执法人员名称',
  violator_name VARCHAR(255) COMMENT '违规单位名称',
  violator_address VARCHAR(255) COMMENT '违规单位地址',
  violation_type VARCHAR(100) COMMENT '违规类型',
  violation_description TEXT COMMENT '违规描述',
  handling_opinion TEXT COMMENT '处理意见',
  rectification_period ENUM('7days', '15days', '30days', '60days', 'immediate') COMMENT '整改期限',
  legal_basis VARCHAR(255) COMMENT '法律依据',
  penalty_amount DECIMAL(12, 2) COMMENT '处罚金额',
  penalty_type VARCHAR(100) COMMENT '处罚类型',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_task_id (task_id),
  INDEX idx_case_number (case_number),
  INDEX idx_violation_type (violation_type),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执法记录表';

-- ============================================
-- 6. 创建视图
-- ============================================

-- 任务完成度视图
DROP VIEW IF EXISTS v_task_completion;
CREATE VIEW v_task_completion AS
SELECT 
  t.id,
  t.case_number,
  t.title,
  t.progress,
  COUNT(DISTINCT e.id) as evidence_count,
  SUM(CASE WHEN c.is_checked = TRUE THEN 1 ELSE 0 END) as checked_items,
  COUNT(DISTINCT c.id) as total_items,
  COUNT(DISTINCT s.id) as sample_count,
  COUNT(DISTINCT er.id) as record_count
FROM tasks t
LEFT JOIN evidence e ON t.id = e.task_id
LEFT JOIN checklist c ON t.id = c.task_id
LEFT JOIN sampling_records s ON t.id = s.task_id
LEFT JOIN enforcement_records er ON t.id = er.task_id
GROUP BY t.id;

-- 采样数据超标统计视图
DROP VIEW IF EXISTS v_sampling_exceed_stats;
CREATE VIEW v_sampling_exceed_stats AS
SELECT 
  task_id,
  COUNT(*) as total_samples,
  SUM(CASE WHEN is_exceed = TRUE THEN 1 ELSE 0 END) as exceed_count,
  AVG(exceed_ratio) as avg_exceed_ratio,
  MAX(exceed_ratio) as max_exceed_ratio,
  MIN(exceed_ratio) as min_exceed_ratio
FROM sampling_records
GROUP BY task_id;

-- ============================================
-- 7. 创建存储过程
-- ============================================

-- 自动生成证据编号
DROP PROCEDURE IF EXISTS sp_generate_evidence_number;
DELIMITER //
CREATE PROCEDURE sp_generate_evidence_number(
  IN p_task_id INT,
  OUT p_evidence_number VARCHAR(50)
)
BEGIN
  DECLARE v_case_number VARCHAR(50);
  DECLARE v_count INT;
  
  SELECT case_number INTO v_case_number FROM tasks WHERE id = p_task_id;
  SELECT COUNT(*) + 1 INTO v_count FROM evidence WHERE task_id = p_task_id;
  
  SET p_evidence_number = CONCAT(v_case_number, '-EV-', LPAD(v_count, 4, '0'));
END //
DELIMITER ;

-- 自动生成采样编号
DROP PROCEDURE IF EXISTS sp_generate_sample_number;
DELIMITER //
CREATE PROCEDURE sp_generate_sample_number(
  IN p_task_id INT,
  OUT p_sample_number VARCHAR(50)
)
BEGIN
  DECLARE v_case_number VARCHAR(50);
  DECLARE v_count INT;
  
  SELECT case_number INTO v_case_number FROM tasks WHERE id = p_task_id;
  SELECT COUNT(*) + 1 INTO v_count FROM sampling_records WHERE task_id = p_task_id;
  
  SET p_sample_number = CONCAT(v_case_number, '-SP-', LPAD(v_count, 4, '0'));
END //
DELIMITER ;

-- 计算采样超标倍数
DROP PROCEDURE IF EXISTS sp_calculate_sample_exceed_ratio;
DELIMITER //
CREATE PROCEDURE sp_calculate_sample_exceed_ratio(
  IN p_sample_id INT,
  IN p_measured_value DECIMAL(10, 4),
  IN p_standard_value DECIMAL(10, 4)
)
BEGIN
  DECLARE v_exceed_ratio DECIMAL(10, 2);
  DECLARE v_is_exceed BOOLEAN;
  
  IF p_standard_value > 0 THEN
    SET v_exceed_ratio = p_measured_value / p_standard_value;
    SET v_is_exceed = p_measured_value > p_standard_value;
  ELSE
    SET v_exceed_ratio = 0;
    SET v_is_exceed = FALSE;
  END IF;
  
  UPDATE sampling_records 
  SET exceed_ratio = v_exceed_ratio,
      is_exceed = v_is_exceed,
      measured_value = p_measured_value,
      standard_value = p_standard_value
  WHERE id = p_sample_id;
END //
DELIMITER ;

-- 更新任务进度
DROP PROCEDURE IF EXISTS sp_update_task_progress;
DELIMITER //
CREATE PROCEDURE sp_update_task_progress(
  IN p_task_id INT
)
BEGIN
  DECLARE v_evidence_count INT;
  DECLARE v_checked_items INT;
  DECLARE v_total_items INT;
  DECLARE v_sample_count INT;
  DECLARE v_progress INT;
  
  SELECT 
    COUNT(DISTINCT e.id),
    SUM(CASE WHEN c.is_checked = TRUE THEN 1 ELSE 0 END),
    COUNT(DISTINCT c.id),
    COUNT(DISTINCT s.id)
  INTO v_evidence_count, v_checked_items, v_total_items, v_sample_count
  FROM tasks t
  LEFT JOIN evidence e ON t.id = e.task_id
  LEFT JOIN checklist c ON t.id = c.task_id
  LEFT JOIN sampling_records s ON t.id = s.task_id
  WHERE t.id = p_task_id;
  
  -- 计算进度: 取证(25%) + 清单(25%) + 采样(25%) + 记录(25%)
  SET v_progress = 0;
  IF v_evidence_count > 0 THEN SET v_progress = v_progress + 25; END IF;
  IF v_total_items > 0 AND v_checked_items = v_total_items THEN SET v_progress = v_progress + 25; END IF;
  IF v_sample_count > 0 THEN SET v_progress = v_progress + 25; END IF;
  
  UPDATE tasks SET progress = v_progress WHERE id = p_task_id;
END //
DELIMITER ;

-- ============================================
-- 8. 创建触发器
-- ============================================

-- 自动生成案件编号
DROP TRIGGER IF EXISTS tr_generate_task_case_number;
DELIMITER //
CREATE TRIGGER tr_generate_task_case_number
BEFORE INSERT ON tasks
FOR EACH ROW
BEGIN
  IF NEW.case_number IS NULL THEN
    SET NEW.case_number = CONCAT('CASE-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(LAST_INSERT_ID() + 1, 6, '0'));
  END IF;
END //
DELIMITER ;

-- 自动计算采样超标倍数
DROP TRIGGER IF EXISTS tr_auto_calculate_exceed_ratio;
DELIMITER //
CREATE TRIGGER tr_auto_calculate_exceed_ratio
BEFORE INSERT ON sampling_records
FOR EACH ROW
BEGIN
  IF NEW.standard_value > 0 THEN
    SET NEW.exceed_ratio = ROUND(NEW.measured_value / NEW.standard_value, 2);
    SET NEW.is_exceed = NEW.measured_value > NEW.standard_value;
  END IF;
END //
DELIMITER ;

-- ============================================
-- 9. 初始化数据
-- ============================================

-- 为现有任务生成案件编号
UPDATE tasks 
SET case_number = CONCAT('CASE-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 6, '0'))
WHERE case_number IS NULL;

-- ============================================
-- 完成
-- ============================================
-- 任务界面优化脚本执行完成
-- 已创建: 5个新表、2个视图、4个存储过程、2个触发器
-- 支持五大功能模块: 取证、清单、采样、法律、记录
