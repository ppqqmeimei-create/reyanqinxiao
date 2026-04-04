-- ============================================
-- 第一批：领域语义统一与闭环主链补强
-- 文件：29_domain_alignment.sql
-- 要求：幂等、可重复执行
-- ============================================

USE reyanjingxiao;

-- 1) alerts 表字段补齐
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS species_type VARCHAR(128) NULL COMMENT '疑似活物物种类型' AFTER category,
  ADD COLUMN IF NOT EXISTS target_type ENUM('person','vehicle','animal','goods','unknown') NOT NULL DEFAULT 'unknown' COMMENT '目标类型' AFTER species_type,
  ADD COLUMN IF NOT EXISTS border_section VARCHAR(128) NULL COMMENT '边境分段' AFTER location,
  ADD COLUMN IF NOT EXISTS source_channel ENUM('device','manual','report','intelligence','other') NOT NULL DEFAULT 'device' COMMENT '线索来源渠道' AFTER source,
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(32) NULL COMMENT '风险等级（兼容 level）' AFTER risk_score;

-- 2) tasks 表字段补齐
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS warning_id INT NULL COMMENT '来源预警ID（兼容 alert_id）' AFTER alert_id,
  ADD COLUMN IF NOT EXISTS joint_case_no VARCHAR(64) NULL COMMENT '联合执法案件号' AFTER completion_notes,
  ADD COLUMN IF NOT EXISTS joint_departments JSON NULL COMMENT '联合单位列表(JSON数组)' AFTER joint_case_no,
  ADD COLUMN IF NOT EXISTS collaboration_status ENUM('none','pending','in-progress','done') NOT NULL DEFAULT 'none' COMMENT '协同状态' AFTER joint_departments,
  ADD COLUMN IF NOT EXISTS collaboration_notes TEXT NULL COMMENT '协同备注' AFTER collaboration_status;

-- 3) 索引补齐
ALTER TABLE alerts
  ADD INDEX IF NOT EXISTS idx_alerts_domain_core (type, level, category, created_at),
  ADD INDEX IF NOT EXISTS idx_alerts_geo_risk (latitude, longitude, risk_score),
  ADD INDEX IF NOT EXISTS idx_alerts_status_created (status, created_at);

ALTER TABLE tasks
  ADD INDEX IF NOT EXISTS idx_tasks_collaboration_status (collaboration_status);

-- 4) 默认值与历史数据兜底
UPDATE alerts
SET target_type = 'unknown'
WHERE target_type IS NULL OR target_type = '';

UPDATE tasks
SET collaboration_status = 'none'
WHERE collaboration_status IS NULL OR collaboration_status = '';

-- 5) warning_id 与 alert_id 兼容回填
UPDATE tasks
SET warning_id = alert_id
WHERE warning_id IS NULL AND alert_id IS NOT NULL;

SELECT '29_domain_alignment.sql done' AS migration_status;
