-- ============================================
-- 热眼擒枭 - 第二批能力固化迁移脚本（增强版）
-- ============================================
-- 版本: 28.1.0
-- 创建日期: 2026-04-01
-- 数据库: MySQL 8.0+
-- 目标:
--   1) 任务维度联合执法字段
--   2) 跨部门流转状态字段
--   3) 相似案件规则查询索引增强
--   4) 相似性权重参数化表
--   5) 联合执法流转时间线表
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. tasks 表新增联合执法与协同流转字段
-- ============================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS joint_case_no VARCHAR(64) NULL COMMENT '联合执法案件号' AFTER completion_notes,
  ADD COLUMN IF NOT EXISTS joint_departments JSON NULL COMMENT '联合执法部门列表(JSON数组)' AFTER joint_case_no,
  ADD COLUMN IF NOT EXISTS collaboration_status ENUM('none', 'pending', 'in-progress', 'done') NOT NULL DEFAULT 'none' COMMENT '跨部门协同状态' AFTER joint_departments,
  ADD COLUMN IF NOT EXISTS collaboration_notes TEXT NULL COMMENT '跨部门协同备注' AFTER collaboration_status;

ALTER TABLE tasks
  ADD INDEX IF NOT EXISTS idx_tasks_joint_case_no (joint_case_no),
  ADD INDEX IF NOT EXISTS idx_tasks_collaboration_status (collaboration_status);

-- ============================================
-- 2. alerts 表补充相似案件规则查询索引
-- ============================================

ALTER TABLE alerts
  ADD INDEX IF NOT EXISTS idx_alerts_similarity_rule (type, level, category, created_at),
  ADD INDEX IF NOT EXISTS idx_alerts_similarity_geo (latitude, longitude, risk_score);

-- ============================================
-- 3. 相似性权重参数表
-- ============================================

CREATE TABLE IF NOT EXISTS system_params (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `group` VARCHAR(64) NOT NULL,
  `key` VARCHAR(64) NOT NULL,
  `value` VARCHAR(128) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_system_params_group_key (`group`, `key`),
  INDEX idx_system_params_group (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统参数表';

INSERT INTO system_params (`group`, `key`, `value`, description)
VALUES
('similarity_weights', 'type', '25', '相似案件：类型匹配权重'),
('similarity_weights', 'level', '20', '相似案件：等级匹配权重'),
('similarity_weights', 'category', '10', '相似案件：类别匹配权重'),
('similarity_weights', 'location', '35', '相似案件：地理接近权重上限'),
('similarity_weights', 'risk', '10', '相似案件：风险分接近权重上限')
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  description = VALUES(description);

-- ============================================
-- 4. 联合执法流转时间线表
-- ============================================

CREATE TABLE IF NOT EXISTS task_collaboration_flows (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT UNSIGNED NOT NULL,
  from_status ENUM('none', 'pending', 'in-progress', 'done') NULL,
  to_status ENUM('none', 'pending', 'in-progress', 'done') NOT NULL,
  action VARCHAR(64) NOT NULL,
  operator_id BIGINT UNSIGNED NULL,
  department VARCHAR(128) NULL,
  notes TEXT NULL,
  payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_collab_flows_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_task_collab_flows_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  INDEX idx_task_collab_flows_task_time (task_id, created_at),
  INDEX idx_task_collab_flows_status_time (to_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务联合执法流转时间线';

-- ============================================
-- 5. 历史数据兜底初始化（仅补空值）
-- ============================================

UPDATE tasks
SET collaboration_status = 'none'
WHERE collaboration_status IS NULL;

-- ============================================
-- 6. 结果提示
-- ============================================

SELECT '28_batch2_capabilities.sql done' AS migration_status;
