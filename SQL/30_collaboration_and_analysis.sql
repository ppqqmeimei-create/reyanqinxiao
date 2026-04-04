-- ============================================
-- 第二批：联合执法与研判增强
-- 文件：30_collaboration_and_analysis.sql
-- 要求：幂等、可重复执行
-- ============================================

USE reyanjingxiao;

-- 1) 联合执法流转时间线表（若不存在）
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
  INDEX idx_task_collab_flows_task_time (task_id, created_at),
  INDEX idx_task_collab_flows_status_time (to_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务联合执法流转时间线';

-- 2) 相似案件权重参数表（若不存在）
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

-- 3) 初始化/兜底相似权重
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

-- 4) 研判查询日志（可选增强）
CREATE TABLE IF NOT EXISTS similarity_query_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alert_id BIGINT UNSIGNED NOT NULL,
  operator_id BIGINT UNSIGNED NULL,
  result_count INT NOT NULL DEFAULT 0,
  weights_snapshot JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_similarity_logs_alert_time (alert_id, created_at),
  INDEX idx_similarity_logs_operator_time (operator_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='相似案件查询日志';

SELECT '30_collaboration_and_analysis.sql done' AS migration_status;
