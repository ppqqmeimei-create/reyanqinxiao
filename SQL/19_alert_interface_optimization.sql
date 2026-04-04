-- ============================================
-- 热眼擒枭 - 预警界面优化脚本
-- ============================================
-- 版本: 3.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 预警界面完整功能支持
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 扩展alerts表 - 添加预警界面所需字段
-- ============================================

-- 添加案件编号字段
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS case_number VARCHAR(50) UNIQUE COMMENT '案件编号' AFTER id;

-- 添加污染物浓度和标准值
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS concentration DECIMAL(10, 4) COMMENT '污染物浓度' AFTER risk_score;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS standard_value DECIMAL(10, 4) COMMENT '标准值' AFTER concentration;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS exceed_ratio DECIMAL(10, 2) COMMENT '超标倍数' AFTER standard_value;

-- 添加影响人口
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS affected_population INT DEFAULT 0 COMMENT '影响人口数' AFTER exceed_ratio;

-- 添加法律依据
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS legal_basis VARCHAR(255) COMMENT '法律依据' AFTER affected_population;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS legal_articles TEXT COMMENT '法律条款' AFTER legal_basis;

-- 添加处罚建议
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS penalty_recommendation TEXT COMMENT '处罚建议' AFTER legal_articles;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS immediate_action VARCHAR(255) COMMENT '立即行动建议' AFTER penalty_recommendation;

-- 添加预警分类（用于区分严重污染/高风险/中风险/低风险）
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS alert_category ENUM('critical', 'high', 'medium', 'low') DEFAULT 'low' COMMENT '预警分类' AFTER level;

-- 添加处理状态
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS handled BOOLEAN DEFAULT FALSE COMMENT '是否已处理' AFTER status;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS ignored BOOLEAN DEFAULT FALSE COMMENT '是否已忽略' AFTER handled;

-- 添加索引
ALTER TABLE alerts ADD INDEX IF NOT EXISTS idx_case_number (case_number);
ALTER TABLE alerts ADD INDEX IF NOT EXISTS idx_exceed_ratio (exceed_ratio);
ALTER TABLE alerts ADD INDEX IF NOT EXISTS idx_alert_category (alert_category);
ALTER TABLE alerts ADD INDEX IF NOT EXISTS idx_handled (handled);
ALTER TABLE alerts ADD INDEX IF NOT EXISTS idx_ignored (ignored);

-- ============================================
-- 2. 扩展fooddrug_alerts表
-- ============================================

ALTER TABLE fooddrug_alerts ADD COLUMN IF NOT EXISTS case_number VARCHAR(50) UNIQUE COMMENT '案件编号' AFTER id;
ALTER TABLE fooddrug_alerts ADD COLUMN IF NOT EXISTS exceed_ratio DECIMAL(10, 2) COMMENT '超标倍数' AFTER risk_score;
ALTER TABLE fooddrug_alerts ADD COLUMN IF NOT EXISTS legal_basis VARCHAR(255) COMMENT '法律依据' AFTER exceed_ratio;
ALTER TABLE fooddrug_alerts ADD COLUMN IF NOT EXISTS legal_articles TEXT COMMENT '法律条款' AFTER legal_basis;
ALTER TABLE fooddrug_alerts ADD COLUMN IF NOT EXISTS penalty_recommendation TEXT COMMENT '处罚建议' AFTER legal_articles;
ALTER TABLE fooddrug_alerts ADD COLUMN IF NOT EXISTS immediate_action VARCHAR(255) COMMENT '立即行动建议' AFTER penalty_recommendation;
ALTER TABLE fooddrug_alerts ADD COLUMN IF NOT EXISTS alert_category ENUM('critical', 'high', 'medium', 'low') DEFAULT 'low' COMMENT '预警分类' AFTER level;
ALTER TABLE fooddrug_alerts ADD COLUMN IF NOT EXISTS handled BOOLEAN DEFAULT FALSE COMMENT '是否已处理' AFTER status;
ALTER TABLE fooddrug_alerts ADD COLUMN IF NOT EXISTS ignored BOOLEAN DEFAULT FALSE COMMENT '是否已忽略' AFTER handled;

ALTER TABLE fooddrug_alerts ADD INDEX IF NOT EXISTS idx_case_number (case_number);
ALTER TABLE fooddrug_alerts ADD INDEX IF NOT EXISTS idx_exceed_ratio (exceed_ratio);
ALTER TABLE fooddrug_alerts ADD INDEX IF NOT EXISTS idx_alert_category (alert_category);
ALTER TABLE fooddrug_alerts ADD INDEX IF NOT EXISTS idx_handled (handled);
ALTER TABLE fooddrug_alerts ADD INDEX IF NOT EXISTS idx_ignored (ignored);

-- ============================================
-- 3. 扩展enforcement_alerts表
-- ============================================

ALTER TABLE enforcement_alerts ADD COLUMN IF NOT EXISTS exceed_ratio DECIMAL(10, 2) COMMENT '超标倍数' AFTER risk_score;
ALTER TABLE enforcement_alerts ADD COLUMN IF NOT EXISTS legal_basis VARCHAR(255) COMMENT '法律依据' AFTER exceed_ratio;
ALTER TABLE enforcement_alerts ADD COLUMN IF NOT EXISTS legal_articles TEXT COMMENT '法律条款' AFTER legal_basis;
ALTER TABLE enforcement_alerts ADD COLUMN IF NOT EXISTS penalty_recommendation TEXT COMMENT '处罚建议' AFTER legal_articles;
ALTER TABLE enforcement_alerts ADD COLUMN IF NOT EXISTS immediate_action VARCHAR(255) COMMENT '立即行动建议' AFTER penalty_recommendation;
ALTER TABLE enforcement_alerts ADD COLUMN IF NOT EXISTS alert_category ENUM('critical', 'high', 'medium', 'low') DEFAULT 'low' COMMENT '预警分类' AFTER level;
ALTER TABLE enforcement_alerts ADD COLUMN IF NOT EXISTS handled BOOLEAN DEFAULT FALSE COMMENT '是否已处理' AFTER status;
ALTER TABLE enforcement_alerts ADD COLUMN IF NOT EXISTS ignored BOOLEAN DEFAULT FALSE COMMENT '是否已忽略' AFTER handled;

ALTER TABLE enforcement_alerts ADD INDEX IF NOT EXISTS idx_exceed_ratio (exceed_ratio);
ALTER TABLE enforcement_alerts ADD INDEX IF NOT EXISTS idx_alert_category (alert_category);
ALTER TABLE enforcement_alerts ADD INDEX IF NOT EXISTS idx_handled (handled);
ALTER TABLE enforcement_alerts ADD INDEX IF NOT EXISTS idx_ignored (ignored);

-- ============================================
-- 4. 创建预警统计视图
-- ============================================

DROP VIEW IF EXISTS v_alert_summary;
CREATE VIEW v_alert_summary AS
SELECT 
  DATE(created_at) as alert_date,
  category,
  alert_category,
  COUNT(*) as total_alerts,
  SUM(CASE WHEN handled = TRUE THEN 1 ELSE 0 END) as handled_count,
  SUM(CASE WHEN ignored = TRUE THEN 1 ELSE 0 END) as ignored_count,
  AVG(risk_score) as avg_risk_score,
  MAX(risk_score) as max_risk_score
FROM alerts
GROUP BY DATE(created_at), category, alert_category;

-- 预警分类统计视图
DROP VIEW IF EXISTS v_alert_category_stats;
CREATE VIEW v_alert_category_stats AS
SELECT 
  category,
  alert_category,
  COUNT(*) as count,
  SUM(CASE WHEN handled = TRUE THEN 1 ELSE 0 END) as handled,
  SUM(CASE WHEN ignored = TRUE THEN 1 ELSE 0 END) as ignored,
  SUM(CASE WHEN handled = FALSE AND ignored = FALSE THEN 1 ELSE 0 END) as pending
FROM alerts
GROUP BY category, alert_category;

-- ============================================
-- 5. 创建存储过程
-- ============================================

-- 计算超标倍数
DROP PROCEDURE IF EXISTS sp_calculate_exceed_ratio;
DELIMITER //
CREATE PROCEDURE sp_calculate_exceed_ratio(
  IN p_alert_id INT,
  IN p_concentration DECIMAL(10, 4),
  IN p_standard_value DECIMAL(10, 4)
)
BEGIN
  DECLARE v_exceed_ratio DECIMAL(10, 2);
  
  IF p_standard_value > 0 THEN
    SET v_exceed_ratio = p_concentration / p_standard_value;
  ELSE
    SET v_exceed_ratio = 0;
  END IF;
  
  UPDATE alerts 
  SET exceed_ratio = v_exceed_ratio,
      concentration = p_concentration,
      standard_value = p_standard_value
  WHERE id = p_alert_id;
END //
DELIMITER ;

-- 更新预警分类
DROP PROCEDURE IF EXISTS sp_update_alert_category;
DELIMITER //
CREATE PROCEDURE sp_update_alert_category(
  IN p_alert_id INT,
  IN p_risk_score INT
)
BEGIN
  DECLARE v_category VARCHAR(20);
  
  IF p_risk_score >= 80 THEN
    SET v_category = 'critical';
  ELSEIF p_risk_score >= 60 THEN
    SET v_category = 'high';
  ELSEIF p_risk_score >= 40 THEN
    SET v_category = 'medium';
  ELSE
    SET v_category = 'low';
  END IF;
  
  UPDATE alerts 
  SET alert_category = v_category
  WHERE id = p_alert_id;
END //
DELIMITER ;

-- 标记预警为已处理
DROP PROCEDURE IF EXISTS sp_mark_alert_handled;
DELIMITER //
CREATE PROCEDURE sp_mark_alert_handled(
  IN p_alert_id INT,
  IN p_user_id INT
)
BEGIN
  UPDATE alerts 
  SET handled = TRUE,
      ignored = FALSE,
      status = 'resolved',
      resolved_by = p_user_id,
      resolved_at = NOW()
  WHERE id = p_alert_id;
END //
DELIMITER ;

-- 标记预警为已忽略
DROP PROCEDURE IF EXISTS sp_mark_alert_ignored;
DELIMITER //
CREATE PROCEDURE sp_mark_alert_ignored(
  IN p_alert_id INT
)
BEGIN
  UPDATE alerts 
  SET ignored = TRUE,
      status = 'ignored'
  WHERE id = p_alert_id;
END //
DELIMITER ;

-- ============================================
-- 6. 创建触发器
-- ============================================

-- 自动生成案件编号
DROP TRIGGER IF EXISTS tr_generate_case_number;
DELIMITER //
CREATE TRIGGER tr_generate_case_number
BEFORE INSERT ON alerts
FOR EACH ROW
BEGIN
  IF NEW.case_number IS NULL THEN
    SET NEW.case_number = CONCAT('CASE-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(LAST_INSERT_ID() + 1, 6, '0'));
  END IF;
END //
DELIMITER ;

-- 自动更新预警分类
DROP TRIGGER IF EXISTS tr_auto_update_alert_category;
DELIMITER //
CREATE TRIGGER tr_auto_update_alert_category
BEFORE INSERT ON alerts
FOR EACH ROW
BEGIN
  IF NEW.risk_score >= 80 THEN
    SET NEW.alert_category = 'critical';
  ELSEIF NEW.risk_score >= 60 THEN
    SET NEW.alert_category = 'high';
  ELSEIF NEW.risk_score >= 40 THEN
    SET NEW.alert_category = 'medium';
  ELSE
    SET NEW.alert_category = 'low';
  END IF;
END //
DELIMITER ;

-- ============================================
-- 7. 初始化数据
-- ============================================

-- 更新现有预警的超标倍数
UPDATE alerts 
SET exceed_ratio = CASE 
  WHEN standard_value > 0 THEN ROUND(concentration / standard_value, 2)
  ELSE 0
END
WHERE concentration IS NOT NULL AND standard_value IS NOT NULL;

-- 更新现有预警的分类
UPDATE alerts 
SET alert_category = CASE 
  WHEN risk_score >= 80 THEN 'critical'
  WHEN risk_score >= 60 THEN 'high'
  WHEN risk_score >= 40 THEN 'medium'
  ELSE 'low'
END;

-- ============================================
-- 完成
-- ============================================
-- 预警界面优化脚本执行完成
-- 已添加: 超标倍数、法律依据、处罚建议等字段
-- 已创建: 2个视图、4个存储过程、2个触发器
