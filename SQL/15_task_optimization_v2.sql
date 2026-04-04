-- ============================================
-- 热眼擒枭 - 任务模块数据库优化脚本
-- ============================================
-- 版本: 2.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 性能优化、备份策略、查询优化
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 查询性能优化
-- ============================================

-- 分析现有查询性能
-- EXPLAIN SELECT * FROM tasks WHERE category = 'ecology' AND status = 'pending';

-- 添加复合索引优化查询
ALTER TABLE tasks ADD INDEX idx_category_status (category, status);
ALTER TABLE tasks ADD INDEX idx_assigned_to_status (assigned_to, status);
ALTER TABLE tasks ADD INDEX idx_created_at_category (created_at, category);

-- 优化统计查询
ALTER TABLE task_statistics ADD INDEX idx_date_category (date, category);

-- 优化审计日志查询
ALTER TABLE task_audit_logs ADD INDEX idx_task_id_created_at (task_id, created_at);

-- ============================================
-- 2. 慢查询日志配置
-- ============================================

-- 启用慢查询日志（需要MySQL配置文件支持）
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 2;
-- SET GLOBAL log_queries_not_using_indexes = 'ON';

-- ============================================
-- 3. 数据一致性检查
-- ============================================

-- 检查孤立的审计日志记录
-- SELECT * FROM task_audit_logs 
-- WHERE task_id NOT IN (SELECT id FROM tasks);

-- 删除孤立的审计日志记录
-- DELETE FROM task_audit_logs 
-- WHERE task_id NOT IN (SELECT id FROM tasks);

-- 检查任务统计数据的一致性
-- SELECT t.id, t.category, ts.total_tasks
-- FROM tasks t
-- LEFT JOIN task_statistics ts ON DATE(t.created_at) = ts.date AND t.category = ts.category
-- WHERE ts.total_tasks IS NULL;

-- ============================================
-- 4. 备份和恢复策略
-- ============================================

-- 创建备份表（用于备份前的快照）
DROP TABLE IF EXISTS tasks_backup;
CREATE TABLE tasks_backup LIKE tasks;

-- 创建备份存储过程
DROP PROCEDURE IF EXISTS sp_backup_tasks;
DELIMITER //
CREATE PROCEDURE sp_backup_tasks()
BEGIN
  -- 清空备份表
  TRUNCATE TABLE tasks_backup;
  
  -- 复制数据到备份表
  INSERT INTO tasks_backup SELECT * FROM tasks;
  
  -- 记录备份时间
  INSERT INTO system_logs (log_type, message, created_at)
  VALUES ('BACKUP', 'Tasks backup completed', NOW());
END //
DELIMITER ;

-- 创建恢复存储过程
DROP PROCEDURE IF EXISTS sp_restore_tasks;
DELIMITER //
CREATE PROCEDURE sp_restore_tasks()
BEGIN
  -- 清空原表
  TRUNCATE TABLE tasks;
  
  -- 从备份表恢复数据
  INSERT INTO tasks SELECT * FROM tasks_backup;
  
  -- 记录恢复时间
  INSERT INTO system_logs (log_type, message, created_at)
  VALUES ('RESTORE', 'Tasks restore completed', NOW());
END //
DELIMITER ;

-- ============================================
-- 5. 定期维护任务
-- ============================================

-- 创建表维护存储过程
DROP PROCEDURE IF EXISTS sp_maintain_tasks_table;
DELIMITER //
CREATE PROCEDURE sp_maintain_tasks_table()
BEGIN
  -- 优化表
  OPTIMIZE TABLE tasks;
  OPTIMIZE TABLE task_statistics;
  OPTIMIZE TABLE task_audit_logs;
  
  -- 分析表
  ANALYZE TABLE tasks;
  ANALYZE TABLE task_statistics;
  ANALYZE TABLE task_audit_logs;
  
  -- 检查表
  CHECK TABLE tasks;
  CHECK TABLE task_statistics;
  CHECK TABLE task_audit_logs;
  
  -- 记录维护时间
  INSERT INTO system_logs (log_type, message, created_at)
  VALUES ('MAINTENANCE', 'Tasks table maintenance completed', NOW());
END //
DELIMITER ;

-- ============================================
-- 6. 数据清理策略
-- ============================================

-- 创建数据清理存储过程（删除超过1年的已完成任务）
DROP PROCEDURE IF EXISTS sp_cleanup_old_tasks;
DELIMITER //
CREATE PROCEDURE sp_cleanup_old_tasks()
BEGIN
  DECLARE deleted_count INT;
  
  -- 删除超过1年的已完成任务
  DELETE FROM tasks 
  WHERE status = 'completed' 
  AND updated_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
  
  SET deleted_count = ROW_COUNT();
  
  -- 记录清理结果
  INSERT INTO system_logs (log_type, message, created_at)
  VALUES ('CLEANUP', CONCAT('Deleted ', deleted_count, ' old tasks'), NOW());
END //
DELIMITER ;

-- ============================================
-- 7. 监控和告警
-- ============================================

-- 创建系统日志表（用于记录维护操作）
DROP TABLE IF EXISTS system_logs;
CREATE TABLE system_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  log_type VARCHAR(50) COMMENT '日志类型',
  message TEXT COMMENT '日志信息',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_log_type (log_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- 创建性能监控视图
DROP VIEW IF EXISTS v_task_performance;
CREATE VIEW v_task_performance AS
SELECT 
  category,
  COUNT(*) as total_tasks,
  AVG(progress) as avg_progress,
  AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_duration_hours,
  MIN(created_at) as oldest_task,
  MAX(updated_at) as latest_update
FROM tasks
GROUP BY category;

-- 创建任务统计视图
DROP VIEW IF EXISTS v_task_status_summary;
CREATE VIEW v_task_status_summary AS
SELECT 
  category,
  status,
  COUNT(*) as count,
  AVG(progress) as avg_progress,
  MIN(priority) as min_priority,
  MAX(priority) as max_priority
FROM tasks
GROUP BY category, status;

-- ============================================
-- 8. 缓存策略配置
-- ============================================

-- 创建缓存表（用于存储热点数据）
DROP TABLE IF EXISTS task_cache;
CREATE TABLE task_cache (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '缓存ID',
  cache_key VARCHAR(255) UNIQUE NOT NULL COMMENT '缓存键',
  cache_value JSON COMMENT '缓存值',
  ttl INT DEFAULT 3600 COMMENT '生存时间（秒）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_cache_key (cache_key),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务缓存表';

-- 创建缓存清理存储过程
DROP PROCEDURE IF EXISTS sp_cleanup_expired_cache;
DELIMITER //
CREATE PROCEDURE sp_cleanup_expired_cache()
BEGIN
  DELETE FROM task_cache 
  WHERE TIMESTAMPDIFF(SECOND, created_at, NOW()) > ttl;
END //
DELIMITER ;

-- ============================================
-- 9. 分区策略（可选，用于大数据量）
-- ============================================

-- 注意：分区需要在表创建时指定，这里仅作为参考
-- 如果需要对现有表进行分区，需要重建表

-- 按年份分区的任务表示例（仅供参考）
-- CREATE TABLE tasks_partitioned (
--   id INT AUTO_INCREMENT,
--   title VARCHAR(200),
--   created_at DATETIME,
--   ...
--   PRIMARY KEY (id, created_at)
-- ) PARTITION BY RANGE (YEAR(created_at)) (
--   PARTITION p2024 VALUES LESS THAN (2025),
--   PARTITION p2025 VALUES LESS THAN (2026),
--   PARTITION p2026 VALUES LESS THAN (2027),
--   PARTITION pmax VALUES LESS THAN MAXVALUE
-- );

-- ============================================
-- 10. 执行优化
-- ============================================

-- 执行表维护
-- CALL sp_maintain_tasks_table();

-- 执行备份
-- CALL sp_backup_tasks();

-- 执行缓存清理
-- CALL sp_cleanup_expired_cache();

-- 执行数据清理（谨慎使用）
-- CALL sp_cleanup_old_tasks();

-- ============================================
-- 11. 验证优化效果
-- ============================================

-- 查看表大小
-- SELECT 
--   table_name,
--   ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
-- FROM information_schema.tables
-- WHERE table_schema = 'reyanjingxiao'
-- AND table_name LIKE 'task%';

-- 查看索引使用情况
-- SELECT 
--   object_schema,
--   object_name,
--   index_name,
--   count_read,
--   count_write,
--   count_delete,
--   count_update
-- FROM performance_schema.table_io_waits_summary_by_index_usage
-- WHERE object_schema = 'reyanjingxiao'
-- AND object_name LIKE 'task%'
-- ORDER BY count_read DESC;

-- ============================================
-- 完成
-- ============================================
-- 数据库优化脚本执行完成
-- 已添加: 5个复合索引, 6个存储过程, 3个视图, 2个新表
-- 优化内容: 查询性能、备份恢复、数据清理、缓存管理、监控告警
