-- ============================================
-- 热眼擒枭 - 用户模块数据库优化脚本
-- ============================================
-- 版本: 2.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 用户角色扩展、权限管理、工作统计
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 扩展用户表
-- ============================================

-- 添加分类字段
ALTER TABLE users ADD COLUMN category ENUM('ecology', 'fooddrug', 'enforcement') DEFAULT 'ecology' COMMENT '用户分类';

-- 添加部门字段
ALTER TABLE users ADD COLUMN department VARCHAR(100) COMMENT '所属部门';

-- 添加职位字段
ALTER TABLE users ADD COLUMN position VARCHAR(50) COMMENT '职位';

-- 添加警号字段
ALTER TABLE users ADD COLUMN badge_number VARCHAR(50) COMMENT '警号';

-- 添加执勤状态字段
ALTER TABLE users ADD COLUMN on_duty BOOLEAN DEFAULT FALSE COMMENT '是否执勤';

-- 添加索引
ALTER TABLE users ADD INDEX idx_category (category);
ALTER TABLE users ADD INDEX idx_department (department);
ALTER TABLE users ADD INDEX idx_badge_number (badge_number);

-- ============================================
-- 2. 新增用户角色表
-- ============================================

DROP TABLE IF EXISTS user_roles;
CREATE TABLE user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '角色ID',
  role_key VARCHAR(50) UNIQUE NOT NULL COMMENT '角色键',
  role_name VARCHAR(100) NOT NULL COMMENT '角色名称',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '所属分类',
  description TEXT COMMENT '角色描述',
  icon VARCHAR(100) COMMENT '角色图标',
  color VARCHAR(20) COMMENT '角色颜色',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_role_key (role_key),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色表';

-- 插入预置角色
INSERT INTO user_roles (role_key, role_name, category, description, icon, color) VALUES
('ecology-inspector', '环保检查员', 'ecology', '负责环境资源检查工作', '🌍', '#10b981'),
('fooddrug-inspector', '食品药品检查员', 'fooddrug', '负责食品药品检查工作', '🏥', '#f59e0b'),
('enforcement-officer', '生态警务执法员', 'enforcement', '负责生态警务执法工作', '👮', '#ef4444');

-- ============================================
-- 3. 新增用户权限表
-- ============================================

DROP TABLE IF EXISTS user_permissions;
CREATE TABLE user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '权限ID',
  user_id INT NOT NULL COMMENT '用户ID',
  permission_key VARCHAR(50) NOT NULL COMMENT '权限键',
  permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '授予时间',
  granted_by INT COMMENT '授予人ID',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_permission_key (permission_key),
  UNIQUE KEY unique_user_permission (user_id, permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户权限表';

-- ============================================
-- 4. 新增权限定义表
-- ============================================

DROP TABLE IF EXISTS permissions;
CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '权限ID',
  permission_key VARCHAR(50) UNIQUE NOT NULL COMMENT '权限键',
  permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '所属分类',
  description TEXT COMMENT '权限描述',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_permission_key (permission_key),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限定义表';

-- 插入预置权限
INSERT INTO permissions (permission_key, permission_name, category, description) VALUES
-- 环保权限
('ecology-task', '环保任务管理', 'ecology', '查看和管理环保任务'),
('ecology-device', '环保设备管理', 'ecology', '查看和管理环保设备'),
('ecology-alert', '环保告警管理', 'ecology', '查看和处理环保告警'),
('ecology-report', '环保报告生成', 'ecology', '生成环保检查报告'),
-- 食品药品权限
('fooddrug-task', '食品药品任务管理', 'fooddrug', '查看和管理食品药品任务'),
('fooddrug-device', '食品药品设备管理', 'fooddrug', '查看和管理食品药品设备'),
('fooddrug-alert', '食品药品告警管理', 'fooddrug', '查看和处理食品药品告警'),
('fooddrug-report', '食品药品报告生成', 'fooddrug', '生成食品药品检查报告'),
-- 执法权限
('enforcement-task', '执法任务管理', 'enforcement', '查看和管理执法任务'),
('enforcement-device', '执法设备管理', 'enforcement', '查看和管理执法设备'),
('enforcement-alert', '执法告警管理', 'enforcement', '查看和处理执法告警'),
('enforcement-case', '案件管理', 'enforcement', '查看和管理案件'),
('enforcement-evidence', '证据管理', 'enforcement', '查看和管理证据'),
('enforcement-record', '执法记录', 'enforcement', '查看和管理执法记录');

-- ============================================
-- 5. 新增工作统计表
-- ============================================

DROP TABLE IF EXISTS user_work_stats;
CREATE TABLE user_work_stats (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
  user_id INT NOT NULL COMMENT '用户ID',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '工作分类',
  work_date DATE NOT NULL COMMENT '工作日期',
  task_count INT DEFAULT 0 COMMENT '任务数量',
  alert_count INT DEFAULT 0 COMMENT '告警数量',
  patrol_distance DECIMAL(10, 2) DEFAULT 0 COMMENT '巡查距离(公里)',
  work_hours DECIMAL(5, 2) DEFAULT 0 COMMENT '工作时长(小时)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_work_date (work_date),
  INDEX idx_category (category),
  UNIQUE KEY unique_user_date (user_id, work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户工作统计表';

-- ============================================
-- 6. 新增用户勋章表
-- ============================================

DROP TABLE IF EXISTS user_medals;
CREATE TABLE user_medals (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '勋章ID',
  user_id INT NOT NULL COMMENT '用户ID',
  medal_key VARCHAR(50) NOT NULL COMMENT '勋章键',
  medal_name VARCHAR(100) NOT NULL COMMENT '勋章名称',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '所属分类',
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_medal_key (medal_key),
  UNIQUE KEY unique_user_medal (user_id, medal_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户勋章表';

-- ============================================
-- 7. 新增执勤记录表
-- ============================================

DROP TABLE IF EXISTS duty_records;
CREATE TABLE duty_records (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  user_id INT NOT NULL COMMENT '用户ID',
  duty_start DATETIME NOT NULL COMMENT '执勤开始时间',
  duty_end DATETIME COMMENT '执勤结束时间',
  duration INT COMMENT '执勤时长(分钟)',
  location VARCHAR(255) COMMENT '执勤地点',
  notes TEXT COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_duty_start (duty_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执勤记录表';

-- ============================================
-- 8. 新增视图
-- ============================================

-- 用户统计视图
DROP VIEW IF EXISTS v_user_summary;
CREATE VIEW v_user_summary AS
SELECT 
  u.id,
  u.username,
  u.name,
  u.category,
  u.department,
  u.position,
  u.badge_number,
  u.on_duty,
  COUNT(DISTINCT up.id) as permission_count,
  COUNT(DISTINCT uws.id) as work_days,
  SUM(uws.task_count) as total_tasks,
  SUM(uws.alert_count) as total_alerts,
  SUM(uws.patrol_distance) as total_distance,
  SUM(uws.work_hours) as total_hours
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN user_work_stats uws ON u.id = uws.user_id
GROUP BY u.id;

-- 用户权限视图
DROP VIEW IF EXISTS v_user_permissions;
CREATE VIEW v_user_permissions AS
SELECT 
  u.id as user_id,
  u.username,
  u.category,
  p.permission_key,
  p.permission_name,
  p.description,
  up.granted_at
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN permissions p ON up.permission_key = p.permission_key;

-- 用户工作统计视图
DROP VIEW IF EXISTS v_user_work_summary;
CREATE VIEW v_user_work_summary AS
SELECT 
  user_id,
  category,
  COUNT(*) as work_days,
  SUM(task_count) as total_tasks,
  SUM(alert_count) as total_alerts,
  SUM(patrol_distance) as total_distance,
  SUM(work_hours) as total_hours,
  AVG(task_count) as avg_tasks_per_day,
  AVG(work_hours) as avg_hours_per_day
FROM user_work_stats
GROUP BY user_id, category;

-- ============================================
-- 9. 新增存储过程
-- ============================================

-- 授予用户权限
DROP PROCEDURE IF EXISTS sp_grant_permission;
DELIMITER //
CREATE PROCEDURE sp_grant_permission(
  IN p_user_id INT,
  IN p_permission_key VARCHAR(50),
  IN p_granted_by INT
)
BEGIN
  DECLARE v_permission_name VARCHAR(100);
  
  -- 获取权限名称
  SELECT permission_name INTO v_permission_name
  FROM permissions WHERE permission_key = p_permission_key;
  
  -- 插入权限
  INSERT INTO user_permissions (user_id, permission_key, permission_name, granted_by)
  VALUES (p_user_id, p_permission_key, v_permission_name, p_granted_by)
  ON DUPLICATE KEY UPDATE granted_at = NOW();
END //
DELIMITER ;

-- 撤销用户权限
DROP PROCEDURE IF EXISTS sp_revoke_permission;
DELIMITER //
CREATE PROCEDURE sp_revoke_permission(
  IN p_user_id INT,
  IN p_permission_key VARCHAR(50)
)
BEGIN
  DELETE FROM user_permissions 
  WHERE user_id = p_user_id AND permission_key = p_permission_key;
END //
DELIMITER ;

-- 更新工作统计
DROP PROCEDURE IF EXISTS sp_update_work_stats;
DELIMITER //
CREATE PROCEDURE sp_update_work_stats(
  IN p_user_id INT,
  IN p_category VARCHAR(20),
  IN p_work_date DATE,
  IN p_task_count INT,
  IN p_alert_count INT,
  IN p_patrol_distance DECIMAL(10, 2),
  IN p_work_hours DECIMAL(5, 2)
)
BEGIN
  INSERT INTO user_work_stats (
    user_id, category, work_date, task_count, alert_count, patrol_distance, work_hours
  ) VALUES (
    p_user_id, p_category, p_work_date, p_task_count, p_alert_count, p_patrol_distance, p_work_hours
  )
  ON DUPLICATE KEY UPDATE
    task_count = task_count + p_task_count,
    alert_count = alert_count + p_alert_count,
    patrol_distance = patrol_distance + p_patrol_distance,
    work_hours = work_hours + p_work_hours;
END //
DELIMITER ;

-- ============================================
-- 10. 新增触发器
-- ============================================

-- 创建用户时自动授予基础权限
DROP TRIGGER IF EXISTS tr_user_default_permissions;
DELIMITER //
CREATE TRIGGER tr_user_default_permissions
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  -- 根据用户分类授予默认权限
  IF NEW.category = 'ecology' THEN
    INSERT INTO user_permissions (user_id, permission_key, permission_name)
    SELECT NEW.id, permission_key, permission_name
    FROM permissions WHERE category = 'ecology';
  ELSEIF NEW.category = 'fooddrug' THEN
    INSERT INTO user_permissions (user_id, permission_key, permission_name)
    SELECT NEW.id, permission_key, permission_name
    FROM permissions WHERE category = 'fooddrug';
  ELSEIF NEW.category = 'enforcement' THEN
    INSERT INTO user_permissions (user_id, permission_key, permission_name)
    SELECT NEW.id, permission_key, permission_name
    FROM permissions WHERE category = 'enforcement';
  END IF;
END //
DELIMITER ;

-- ============================================
-- 11. 初始化数据
-- ============================================

-- 更新现有用户的分类（示例）
-- UPDATE users SET category = 'ecology', department = '广西环食药侦查总队' WHERE id = 1;

-- ============================================
-- 完成
-- ============================================
-- 数据库优化脚本执行完成
-- 已添加: 7个新表, 3个视图, 3个存储过程, 1个触发器
-- 优化内容: 用户角色、权限管理、工作统计、执勤记录
