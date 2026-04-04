-- ============================================
-- 热眼擒枭 v3 闭环数据库一键验收脚本
-- 文件: 27_verify.sql
-- 用途: 执行 27 重构/迁移后进行结构与链路核验
-- ============================================

-- 1) 请根据实际库名切换（rebuild: reyanjingxiao_v3 / migration: reyanjingxiao）
USE reyanjingxiao;

-- ============================================
-- A. 核心表存在性检查
-- ============================================
SELECT 'A1_tables_exist' AS check_item, t.table_name,
       CASE WHEN t.table_name IS NULL THEN 'FAIL' ELSE 'PASS' END AS result
FROM (
  SELECT 'roles' AS table_name UNION ALL
  SELECT 'users' UNION ALL
  SELECT 'devices' UNION ALL
  SELECT 'warnings' UNION ALL
  SELECT 'tasks' UNION ALL
  SELECT 'evidences' UNION ALL
  SELECT 'warning_flows'
) s
LEFT JOIN information_schema.tables t
  ON t.table_schema = DATABASE() AND t.table_name = s.table_name;

-- ============================================
-- B. 关键字段检查
-- ============================================
SELECT 'B1_users_role_id' AS check_item,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'role_id';

SELECT 'B2_devices_device_type' AS check_item,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'devices' AND column_name = 'device_type';

SELECT 'B3_warnings_risk_score' AS check_item,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'warnings' AND column_name = 'risk_score';

SELECT 'B4_tasks_warning_id' AS check_item,
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'tasks' AND column_name = 'warning_id';

SELECT 'B5_evidences_ref_cols' AS check_item,
       CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END AS result
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'evidences' AND column_name IN ('warning_id', 'task_id');

-- ============================================
-- C. 外键检查
-- ============================================
SELECT 'C1_foreign_keys_count' AS check_item,
       COUNT(*) AS fk_count,
       CASE WHEN COUNT(*) >= 10 THEN 'PASS' ELSE 'WARN' END AS result
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE() AND referenced_table_name IS NOT NULL;

SELECT 'C2_fk_details' AS check_item,
       table_name, column_name, referenced_table_name, referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE() AND referenced_table_name IS NOT NULL
ORDER BY table_name, column_name;

-- ============================================
-- D. 索引检查（经纬度 + 时间序列）
-- ============================================
SELECT 'D1_devices_lat_lng_index' AS check_item,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM information_schema.statistics
WHERE table_schema = DATABASE() AND table_name = 'devices' AND index_name LIKE '%lat_lng%';

SELECT 'D2_warnings_time_index' AS check_item,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM information_schema.statistics
WHERE table_schema = DATABASE() AND table_name = 'warnings' AND index_name LIKE '%status_time%';

SELECT 'D3_tasks_status_deadline_index' AS check_item,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM information_schema.statistics
WHERE table_schema = DATABASE() AND table_name = 'tasks' AND index_name LIKE '%status_deadline%';

SELECT 'D4_evidences_task_time_index' AS check_item,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM information_schema.statistics
WHERE table_schema = DATABASE() AND table_name = 'evidences' AND index_name LIKE '%task_time%';

-- 空间索引检查（如果环境不支持，可能为空）
SELECT 'D5_spatial_indexes' AS check_item,
       table_name, index_name, index_type
FROM information_schema.statistics
WHERE table_schema = DATABASE() AND table_name IN ('devices','warnings','tasks','evidences')
  AND index_type = 'SPATIAL';

-- ============================================
-- E. 基础数据质量检查
-- ============================================
SELECT 'E1_roles_count' AS check_item, COUNT(*) AS value,
       CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'WARN' END AS result
FROM roles;

SELECT 'E2_users_role_null' AS check_item, COUNT(*) AS null_role_users,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END AS result
FROM users WHERE role_id IS NULL;

SELECT 'E3_warnings_score_out_of_range' AS check_item, COUNT(*) AS bad_rows,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM warnings WHERE risk_score < 0 OR risk_score > 100;

SELECT 'E4_tasks_progress_out_of_range' AS check_item, COUNT(*) AS bad_rows,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM tasks WHERE progress < 0 OR progress > 100;

SELECT 'E5_evidences_orphan_ref' AS check_item, COUNT(*) AS bad_rows,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result
FROM evidences WHERE warning_id IS NULL AND task_id IS NULL;

-- ============================================
-- F. 闭环链路抽样检查
-- ============================================
SELECT 'F1_warning_task_link_count' AS check_item, COUNT(*) AS linked_count
FROM tasks t
JOIN warnings w ON w.id = t.warning_id;

SELECT 'F2_task_evidence_link_count' AS check_item, COUNT(*) AS linked_count
FROM evidences e
JOIN tasks t ON t.id = e.task_id;

SELECT 'F3_warning_flow_link_count' AS check_item, COUNT(*) AS linked_count
FROM warning_flows f
JOIN warnings w ON w.id = f.warning_id;

-- ============================================
-- G. 验收总结（人工判读）
-- ============================================
SELECT '验证完成：请检查上述结果，重点关注 FAIL 项。' AS summary;
