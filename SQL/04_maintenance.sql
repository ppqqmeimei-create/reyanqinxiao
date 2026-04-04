-- ============================================
-- 热眼擒枭 - 生态环保监控系统
-- 数据库维护和优化脚本
-- ============================================
-- 版本: 1.0.0
-- 创建日期: 2026-03-13
-- 说明: 数据库备份、清理、优化等维护操作
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 数据库备份
-- ============================================

-- 1.1 备份整个数据库（在命令行执行）
-- mysqldump -u root -p reyanjingxiao > backup_reyanjingxiao_20260313.sql

-- 1.2 备份指定表（在命令行执行）
-- mysqldump -u root -p reyanjingxiao users alerts tasks devices > backup_core_tables_20260313.sql

-- 1.3 只备份表结构（在命令行执行）
-- mysqldump -u root -p --no-data reyanjingxiao > backup_schema_20260313.sql

-- ============================================
-- 2. 数据清理
-- ============================================

-- 2.1 清理30天前的系统日志
DELETE FROM system_logs
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 2.2 清理已读且超过7天的通知
DELETE FROM notifications
WHERE is_read = TRUE 
  AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 2.3 清理已取消且超过90天的任务
DELETE FROM tasks
WHERE status = 'cancelled'
  AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 2.4 清理已忽略且超过180天的预警
DELETE FROM alerts
WHERE status = 'ignored'
  AND updated_at < DATE_SUB(NOW(), INTERVAL 180 DAY);

-- 2.5 清理孤立的任务证据（关联任务已删除）
DELETE FROM task_evidence
WHERE task_id NOT IN (SELECT id FROM tasks);

-- 2.6 清理孤立的任务检查清单
DELETE FROM task_checklist
WHERE task_id NOT IN (SELECT id FROM tasks);

-- 2.7 清理孤立的设备元数据
DELETE FROM device_metadata
WHERE device_id NOT IN (SELECT id FROM devices);

-- ============================================
-- 3. 数据归档
-- ============================================

-- 3.1 创建归档表（已解决的预警）
CREATE TABLE IF NOT EXISTS alerts_archive LIKE alerts;

-- 3.2 归档6个月前已解决的预警
INSERT INTO alerts_archive
SELECT * FROM alerts
WHERE status = 'resolved'
  AND resolved_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- 3.3 删除已归档的预警
DELETE FROM alerts
WHERE status = 'resolved'
  AND resolved_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- 3.4 创建归档表（已完成的任务）
CREATE TABLE IF NOT EXISTS tasks_archive LIKE tasks;

-- 3.5 归档6个月前已完成的任务
INSERT INTO tasks_archive
SELECT * FROM tasks
WHERE status = 'completed'
  AND end_time < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- 3.6 删除已归档的任务
DELETE FROM tasks
WHERE status = 'completed'
  AND end_time < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- ============================================
-- 4. 索引优化
-- ============================================

-- 4.1 分析表并优化索引
ANALYZE TABLE users;
ANALYZE TABLE alerts;
ANALYZE TABLE tasks;
ANALYZE TABLE devices;
ANALYZE TABLE device_metadata;
ANALYZE TABLE task_evidence;
ANALYZE TABLE task_checklist;
ANALYZE TABLE notifications;
ANALYZE TABLE system_logs;
ANALYZE TABLE file_uploads;

-- 4.2 优化表（整理碎片）
OPTIMIZE TABLE users;
OPTIMIZE TABLE alerts;
OPTIMIZE TABLE tasks;
OPTIMIZE TABLE devices;
OPTIMIZE TABLE device_metadata;
OPTIMIZE TABLE task_evidence;
OPTIMIZE TABLE task_checklist;
OPTIMIZE TABLE notifications;
OPTIMIZE TABLE system_logs;
OPTIMIZE TABLE file_uploads;

-- 4.3 检查表完整性
CHECK TABLE users;
CHECK TABLE alerts;
CHECK TABLE tasks;
CHECK TABLE devices;

-- 4.4 修复表（如果需要）
-- REPAIR TABLE table_name;

-- ============================================
-- 5. 性能监控
-- ============================================

-- 5.1 查看表大小
SELECT 
  table_name AS 表名,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 大小_MB,
  table_rows AS 行数,
  ROUND((data_length / 1024 / 1024), 2) AS 数据大小_MB,
  ROUND((index_length / 1024 / 1024), 2) AS 索引大小_MB
FROM information_schema.TABLES
WHERE table_schema = 'reyanjingxiao'
ORDER BY (data_length + index_length) DESC;

-- 5.2 查看索引使用情况
SELECT 
  table_name AS 表名,
  index_name AS 索引名,
  column_name AS 列名,
  cardinality AS 基数,
  index_type AS 索引类型
FROM information_schema.STATISTICS
WHERE table_schema = 'reyanjingxiao'
ORDER BY table_name, index_name;

-- 5.3 查看慢查询（需要开启慢查询日志）
-- SHOW VARIABLES LIKE 'slow_query%';
-- SHOW VARIABLES LIKE 'long_query_time';

-- 5.4 查看当前连接
SHOW PROCESSLIST;

-- 5.5 查看表状态
SHOW TABLE STATUS FROM reyanjingxiao;

-- ============================================
-- 6. 数据完整性检查
-- ============================================

-- 6.1 检查孤立的外键引用（预警表）
SELECT 'alerts.assigned_to' AS 检查项, COUNT(*) AS 孤立记录数
FROM alerts
WHERE assigned_to IS NOT NULL 
  AND assigned_to NOT IN (SELECT id FROM users)
UNION ALL
SELECT 'alerts.created_by', COUNT(*)
FROM alerts
WHERE created_by IS NOT NULL 
  AND created_by NOT IN (SELECT id FROM users)
UNION ALL
SELECT 'alerts.resolved_by', COUNT(*)
FROM alerts
WHERE resolved_by IS NOT NULL 
  AND resolved_by NOT IN (SELECT id FROM users);

-- 6.2 检查孤立的外键引用（任务表）
SELECT 'tasks.alert_id' AS 检查项, COUNT(*) AS 孤立记录数
FROM tasks
WHERE alert_id IS NOT NULL 
  AND alert_id NOT IN (SELECT id FROM alerts)
UNION ALL
SELECT 'tasks.assigned_to', COUNT(*)
FROM tasks
WHERE assigned_to NOT IN (SELECT id FROM users)
UNION ALL
SELECT 'tasks.created_by', COUNT(*)
FROM tasks
WHERE created_by IS NOT NULL 
  AND created_by NOT IN (SELECT id FROM users);

-- 6.3 检查数据一致性（任务进度）
SELECT 
  id,
  title,
  status,
  progress
FROM tasks
WHERE (status = 'completed' AND progress < 100)
   OR (status = 'pending' AND progress > 0);

-- 6.4 检查数据一致性（预警解决时间）
SELECT 
  id,
  title,
  status,
  resolved_at,
  resolved_by
FROM alerts
WHERE (status = 'resolved' AND (resolved_at IS NULL OR resolved_by IS NULL))
   OR (status != 'resolved' AND (resolved_at IS NOT NULL OR resolved_by IS NOT NULL));

-- 6.5 检查设备数据异常
SELECT 
  device_id,
  name,
  battery,
  signal_strength,
  status
FROM devices
WHERE battery < 0 OR battery > 100
   OR signal_strength < 0 OR signal_strength > 100;

-- ============================================
-- 7. 统计信息更新
-- ============================================

-- 7.1 更新表统计信息
ANALYZE TABLE users;
ANALYZE TABLE alerts;
ANALYZE TABLE tasks;
ANALYZE TABLE devices;

-- 7.2 刷新查询缓存（如果启用）
-- FLUSH QUERY CACHE;

-- 7.3 刷新表缓存
FLUSH TABLES;

-- ============================================
-- 8. 定期维护任务（建议使用 cron 或计划任务）
-- ============================================

-- 8.1 每日维护任务
-- - 清理当天的临时数据
-- - 备份增量数据
-- - 检查数据完整性

-- 8.2 每周维护任务
-- - 优化表和索引
-- - 清理过期日志
-- - 分析慢查询

-- 8.3 每月维护任务
-- - 完整数据库备份
-- - 归档历史数据
-- - 性能评估和优化

-- ============================================
-- 9. 数据库用户权限管理
-- ============================================

-- 9.1 创建只读用户
-- CREATE USER 'readonly'@'localhost' IDENTIFIED BY 'password';
-- GRANT SELECT ON reyanjingxiao.* TO 'readonly'@'localhost';

-- 9.2 创建应用用户
-- CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON reyanjingxiao.* TO 'app_user'@'localhost';

-- 9.3 创建备份用户
-- CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'password';
-- GRANT SELECT, LOCK TABLES, SHOW VIEW ON reyanjingxiao.* TO 'backup_user'@'localhost';

-- 9.4 刷新权限
-- FLUSH PRIVILEGES;

-- ============================================
-- 10. 数据库配置优化建议
-- ============================================

-- 10.1 查看当前配置
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'query_cache_size';
SHOW VARIABLES LIKE 'tmp_table_size';
SHOW VARIABLES LIKE 'max_heap_table_size';

-- 10.2 推荐配置（在 my.cnf 或 my.ini 中设置）
/*
[mysqld]
# InnoDB 缓冲池大小（建议设置为物理内存的 50-70%）
innodb_buffer_pool_size = 2G

# 最大连接数
max_connections = 200

# 查询缓存大小
query_cache_size = 64M
query_cache_type = 1

# 临时表大小
tmp_table_size = 64M
max_heap_table_size = 64M

# 日志设置
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 二进制日志（用于主从复制和数据恢复）
log_bin = mysql-bin
expire_logs_days = 7
max_binlog_size = 100M
*/

-- ============================================
-- 维护脚本结束
-- ============================================

-- 执行维护后的验证
SELECT 
  '维护完成时间' AS 信息,
  NOW() AS 值
UNION ALL
SELECT 
  '数据库大小',
  CONCAT(ROUND(SUM(data_length + index_length) / 1024 / 1024, 2), ' MB')
FROM information_schema.TABLES
WHERE table_schema = 'reyanjingxiao';
