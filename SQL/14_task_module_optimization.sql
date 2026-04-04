-- ============================================
-- 热眼擒枭 - 任务模块数据库优化脚本
-- ============================================
-- 版本: 1.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 扩展任务表 (tasks)
-- ============================================

-- 添加分类字段
ALTER TABLE tasks ADD COLUMN category ENUM('ecology', 'fooddrug', 'enforcement') DEFAULT 'ecology' COMMENT '任务分类' AFTER type;

-- 添加优先级字段
ALTER TABLE tasks ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT '优先级' AFTER category;

-- 添加预计工时字段
ALTER TABLE tasks ADD COLUMN estimated_hours INT COMMENT '预计工时(小时)' AFTER priority;

-- 添加实际工时字段
ALTER TABLE tasks ADD COLUMN actual_hours INT COMMENT '实际工时(小时)' AFTER estimated_hours;

-- 添加分类索引
ALTER TABLE tasks ADD INDEX idx_category (category);

-- 添加优先级索引
ALTER TABLE tasks ADD INDEX idx_priority (priority);

-- ============================================
-- 2. 新增任务统计表 (task_statistics)
-- ============================================

DROP TABLE IF EXISTS task_statistics;
CREATE TABLE task_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
  date DATE NOT NULL COMMENT '统计日期',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '任务分类',
  total_tasks INT DEFAULT 0 COMMENT '总任务数',
  completed_tasks INT DEFAULT 0 COMMENT '已完成任务数',
  pending_tasks INT DEFAULT 0 COMMENT '待处理任务数',
  in_progress_tasks INT DEFAULT 0 COMMENT '进行中任务数',
  cancelled_tasks INT DEFAULT 0 COMMENT '已取消任务数',
  avg_completion_time DECIMAL(10, 2) COMMENT '平均完成时间(小时)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY unique_date_category (date, category),
  INDEX idx_date (date),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务统计表';

-- ============================================
-- 3. 新增任务审计日志表 (task_audit_logs)
-- ============================================

DROP TABLE IF EXISTS task_audit_logs;
CREATE TABLE task_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  task_id INT NOT NULL COMMENT '任务ID',
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  old_value JSON COMMENT '旧值',
  new_value JSON COMMENT '新值',
  changed_by INT COMMENT '修改人ID',
  change_reason TEXT COMMENT '修改原因',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_task_id (task_id),
  INDEX idx_changed_by (changed_by),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务审计日志表';

-- ============================================
-- 4. 新增任务分类表 (task_categories)
-- ============================================

DROP TABLE IF EXISTS task_categories;
CREATE TABLE task_categories (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
  category_key VARCHAR(50) UNIQUE NOT NULL COMMENT '分类键',
  category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
  description TEXT COMMENT '分类描述',
  icon VARCHAR(100) COMMENT '分类图标',
  color VARCHAR(20) COMMENT '分类颜色',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_category_key (category_key),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务分类表';

-- ============================================
-- 5. 新增任务类型表 (task_types)
-- ============================================

DROP TABLE IF EXISTS task_types;
CREATE TABLE task_types (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '类型ID',
  category_key VARCHAR(50) NOT NULL COMMENT '分类键',
  type_key VARCHAR(50) UNIQUE NOT NULL COMMENT '类型键',
  type_name VARCHAR(100) NOT NULL COMMENT '类型名称',
  description TEXT COMMENT '类型描述',
  icon VARCHAR(100) COMMENT '类型图标',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_category_key (category_key),
  INDEX idx_type_key (type_key),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (category_key) REFERENCES task_categories(category_key) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务类型表';

-- ============================================
-- 6. 插入任务分类数据
-- ============================================

INSERT INTO task_categories (category_key, category_name, description, icon, color, sort_order) VALUES
('ecology', '环保任务', '生态环保相关任务', '🌍', '#10b981', 1),
('fooddrug', '食品药品任务', '食品药品相关任务', '🏥', '#f59e0b', 2),
('enforcement', '执法任务', '生态警务执法任务', '👮', '#ef4444', 3);

-- ============================================
-- 7. 插入任务类型数据
-- ============================================

-- 环保任务类型
INSERT INTO task_types (category_key, type_key, type_name, description, icon, sort_order) VALUES
('ecology', 'quick-sampling', '快速取样', '快速采集污染样品', '⚡', 1),
('ecology', 'complete-sampling', '完整取样', '完整采集污染样品', '📦', 2),
('ecology', 'inspection', '现场检查', '进行现场环保检查', '🔍', 3),
('ecology', 'monitoring', '实时监测', '实时监测污染数据', '📊', 4);

-- 食品药品任务类型
INSERT INTO task_types (category_key, type_key, type_name, description, icon, sort_order) VALUES
('fooddrug', 'product-inspection', '产品检查', '检查产品质量和安全', '🔬', 1),
('fooddrug', 'recall-management', '召回管理', '管理产品召回流程', '⚠️', 2),
('fooddrug', 'compliance-check', '合规检查', '检查企业合规情况', '✅', 3),
('fooddrug', 'enterprise-audit', '企业审计', '进行企业审计检查', '📋', 4);

-- 执法任务类型
INSERT INTO task_types (category_key, type_key, type_name, description, icon, sort_order) VALUES
('enforcement', 'case-investigation', '案件调查', '调查违法案件', '🔎', 1),
('enforcement', 'evidence-collection', '证据采集', '采集执法证据', '📸', 2),
('enforcement', 'penalty-execution', '处罚执行', '执行处罚决定', '⚖️', 3),
('enforcement', 'follow-up-inspection', '后续检查', '进行后续检查', '🔄', 4);

-- ============================================
-- 8. 更新现有任务数据
-- ============================================

-- 为现有任务设置默认分类
UPDATE tasks SET category = 'ecology' WHERE category IS NULL;

-- 为现有任务设置默认优先级
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;

-- ============================================
-- 9. 创建视图：任务统计视图
-- ============================================

DROP VIEW IF EXISTS v_task_summary;
CREATE VIEW v_task_summary AS
SELECT 
  category,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
  SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tasks,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tasks,
  AVG(CASE WHEN status = 'completed' THEN actual_hours ELSE NULL END) as avg_completion_time
FROM tasks
GROUP BY category;

-- ============================================
-- 10. 创建存储过程：更新任务统计
-- ============================================

DROP PROCEDURE IF EXISTS sp_update_task_statistics;
DELIMITER //
CREATE PROCEDURE sp_update_task_statistics(IN p_date DATE)
BEGIN
  INSERT INTO task_statistics (date, category, total_tasks, completed_tasks, pending_tasks, in_progress_tasks, cancelled_tasks, avg_completion_time)
  SELECT 
    p_date,
    category,
    COUNT(*) as total_tasks,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
    SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tasks,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tasks,
    AVG(CASE WHEN status = 'completed' THEN actual_hours ELSE NULL END) as avg_completion_time
  FROM tasks
  WHERE DATE(created_at) = p_date
  GROUP BY category
  ON DUPLICATE KEY UPDATE
    total_tasks = VALUES(total_tasks),
    completed_tasks = VALUES(completed_tasks),
    pending_tasks = VALUES(pending_tasks),
    in_progress_tasks = VALUES(in_progress_tasks),
    cancelled_tasks = VALUES(cancelled_tasks),
    avg_completion_time = VALUES(avg_completion_time),
    updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- ============================================
-- 11. 创建触发器：记录任务变更
-- ============================================

DROP TRIGGER IF EXISTS tr_task_audit_log;
DELIMITER //
CREATE TRIGGER tr_task_audit_log AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status OR OLD.progress != NEW.progress THEN
    INSERT INTO task_audit_logs (task_id, action, old_value, new_value, changed_by)
    VALUES (
      NEW.id,
      'UPDATE',
      JSON_OBJECT('status', OLD.status, 'progress', OLD.progress),
      JSON_OBJECT('status', NEW.status, 'progress', NEW.progress),
      NEW.updated_by
    );
  END IF;
END //
DELIMITER ;

-- ============================================
-- 完成
-- ============================================
-- 数据库优化脚本执行完成
-- 已添加: 2个新字段, 4个新表, 1个视图, 1个存储过程, 1个触发器
