-- ============================================
-- 热眼擒枭 - 预警模块数据库修复脚本
-- ============================================
-- 版本: 1.1.0
-- 修复日期: 2026-03-14
-- 说明: 修复前后端数据不一致问题
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 添加缺失字段到 alerts 表
-- ============================================

-- 添加案件编号
ALTER TABLE alerts 
ADD COLUMN case_number VARCHAR(50) UNIQUE COMMENT '案件编号（格式：ENV-CRIT-2026-001001）' AFTER id;

-- 添加法律依据
ALTER TABLE alerts 
ADD COLUMN legal_basis TEXT COMMENT '适用法律依据' AFTER resolution_notes;

-- 添加处罚建议
ALTER TABLE alerts 
ADD COLUMN penalty_suggestion TEXT COMMENT '处罚建议' AFTER legal_basis;

-- 添加索引
CREATE INDEX idx_case_number ON alerts(case_number);

-- ============================================
-- 2. 创建预警证据表
-- ============================================

DROP TABLE IF EXISTS alert_evidence;
CREATE TABLE alert_evidence (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '证据ID',
  alert_id INT NOT NULL COMMENT '预警ID',
  type ENUM('photo', 'video', 'audio', 'document') NOT NULL COMMENT '证据类型',
  file_name VARCHAR(255) COMMENT '文件名',
  url VARCHAR(500) COMMENT '文件URL',
  file_size BIGINT COMMENT '文件大小（字节）',
  description TEXT COMMENT '证据描述',
  uploaded_by INT COMMENT '上传者ID',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  INDEX idx_alert_id (alert_id),
  INDEX idx_type (type),
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警证据表';

-- ============================================
-- 3. 创建预警操作记录表
-- ============================================

DROP TABLE IF EXISTS alert_actions;
CREATE TABLE alert_actions (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '操作ID',
  alert_id INT NOT NULL COMMENT '预警ID',
  action_type ENUM('created', 'assigned', 'ignored', 'resolved', 'escalated') NOT NULL COMMENT '操作类型',
  action_by INT NOT NULL COMMENT '操作人ID',
  action_notes TEXT COMMENT '操作备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_alert_id (alert_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
  FOREIGN KEY (action_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警操作记录表';

-- ============================================
-- 4. 创建存储过程 - 生成预警案件编号
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS generate_alert_case_number//
CREATE PROCEDURE generate_alert_case_number(
  IN p_level VARCHAR(20),
  OUT p_case_number VARCHAR(50)
)
BEGIN
  DECLARE v_prefix VARCHAR(20);
  DECLARE v_year INT;
  DECLARE v_sequence INT;
  
  SET v_prefix = CASE 
    WHEN p_level = 'critical' THEN 'ENV-CRIT'
    WHEN p_level = 'warning' THEN 'ENV-WARN'
    ELSE 'ENV-INFO'
  END;
  
  SET v_year = YEAR(NOW());
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_number, -6) AS UNSIGNED)), 0) + 1
  INTO v_sequence
  FROM alerts
  WHERE case_number LIKE CONCAT(v_prefix, '-', v_year, '-%');
  
  SET p_case_number = CONCAT(v_prefix, '-', v_year, '-', LPAD(v_sequence, 6, '0'));
END//

DELIMITER ;

-- ============================================
-- 5. 创建触发器 - 自动生成案件编号
-- ============================================

DELIMITER //

DROP TRIGGER IF EXISTS before_alert_insert//
CREATE TRIGGER before_alert_insert
BEFORE INSERT ON alerts
FOR EACH ROW
BEGIN
  DECLARE v_case_number VARCHAR(50);
  
  IF NEW.case_number IS NULL THEN
    CALL generate_alert_case_number(NEW.level, v_case_number);
    SET NEW.case_number = v_case_number;
  END IF;
END//

DELIMITER ;

-- ============================================
-- 修复完成
-- ============================================
SELECT 'Alert database fixed successfully!' AS message;
