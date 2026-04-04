-- ============================================
-- 热眼擒枭 - 28 批次自动核验脚本
-- ============================================
-- 用途: 在执行 28_batch2_capabilities.sql 后快速核验结构与初始化数据
-- ============================================

USE reyanjingxiao;

-- 1) tasks 新增字段核验
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'tasks'
  AND COLUMN_NAME IN ('joint_case_no', 'joint_departments', 'collaboration_status', 'collaboration_notes')
ORDER BY COLUMN_NAME;

-- 2) tasks 索引核验
SHOW INDEX FROM tasks WHERE Key_name IN ('idx_tasks_joint_case_no', 'idx_tasks_collaboration_status');

-- 3) alerts 相似性索引核验
SHOW INDEX FROM alerts WHERE Key_name IN ('idx_alerts_similarity_rule', 'idx_alerts_similarity_geo');

-- 4) system_params 表与相似性权重核验
SHOW TABLES LIKE 'system_params';

SELECT `group`, `key`, `value`, description
FROM system_params
WHERE `group` = 'similarity_weights'
ORDER BY `key`;

-- 5) task_collaboration_flows 表核验
SHOW TABLES LIKE 'task_collaboration_flows';
DESC task_collaboration_flows;
SHOW INDEX FROM task_collaboration_flows;

-- 6) 外键核验
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('task_collaboration_flows')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 7) 状态分布核验（确认默认值已回填）
SELECT collaboration_status, COUNT(*) AS cnt
FROM tasks
GROUP BY collaboration_status
ORDER BY cnt DESC;

SELECT '28_verify.sql done' AS verify_status;
