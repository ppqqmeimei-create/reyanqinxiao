-- ============================================
-- 热眼擒枭 - 登录模块数据库优化脚本
-- ============================================
-- 版本: 2.0.0
-- 创建日期: 2026-03-15
-- 数据库: MySQL 8.0+
-- 优化内容: 登录日志、生物识别、用户维度
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 新增登录日志表
-- ============================================

DROP TABLE IF EXISTS login_logs;
CREATE TABLE login_logs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  user_id INT COMMENT '用户ID',
  username VARCHAR(100) COMMENT '用户名/警号',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '用户分类',
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  device_info TEXT COMMENT '设备信息',
  login_method VARCHAR(50) COMMENT '登录方式(password/biometric/offline)',
  success BOOLEAN DEFAULT TRUE COMMENT '登录是否成功',
  failure_reason VARCHAR(255) COMMENT '失败原因',
  session_id VARCHAR(255) COMMENT '会话ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_username (username),
  INDEX idx_category (category),
  INDEX idx_login_time (login_time),
  INDEX idx_ip_address (ip_address),
  INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- ============================================
-- 2. 新增生物识别数据表
-- ============================================

DROP TABLE IF EXISTS biometric_data;
CREATE TABLE biometric_data (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '生物识别ID',
  user_id INT NOT NULL COMMENT '用户ID',
  biometric_type ENUM('fingerprint', 'face', 'iris') COMMENT '生物识别类型',
  biometric_hash VARCHAR(255) COMMENT '生物识别数据哈希',
  biometric_data LONGBLOB COMMENT '生物识别数据(加密存储)',
  is_primary BOOLEAN DEFAULT FALSE COMMENT '是否为主要识别方式',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  last_used DATETIME COMMENT '最后使用时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_biometric_type (biometric_type),
  INDEX idx_is_active (is_active),
  UNIQUE KEY unique_user_type (user_id, biometric_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生物识别数据表';

-- ============================================
-- 3. 新增用户设备表
-- ============================================

DROP TABLE IF EXISTS user_devices;
CREATE TABLE user_devices (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '设备ID',
  user_id INT NOT NULL COMMENT '用户ID',
  device_id VARCHAR(255) UNIQUE COMMENT '设备唯一标识',
  device_name VARCHAR(100) COMMENT '设备名称',
  device_type VARCHAR(50) COMMENT '设备类型(mobile/tablet/web)',
  os_type VARCHAR(50) COMMENT '操作系统类型',
  os_version VARCHAR(50) COMMENT '操作系统版本',
  app_version VARCHAR(50) COMMENT '应用版本',
  is_trusted BOOLEAN DEFAULT FALSE COMMENT '是否为信任设备',
  last_login DATETIME COMMENT '最后登录时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_device_id (device_id),
  INDEX idx_is_trusted (is_trusted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设备表';

-- ============================================
-- 4. 新增登录会话表
-- ============================================

DROP TABLE IF EXISTS login_sessions;
CREATE TABLE login_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
  user_id INT NOT NULL COMMENT '用户ID',
  session_token VARCHAR(255) UNIQUE COMMENT '会话令牌',
  device_id VARCHAR(255) COMMENT '设备ID',
  category ENUM('ecology', 'fooddrug', 'enforcement') COMMENT '用户分类',
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  last_activity DATETIME COMMENT '最后活动时间',
  expires_at DATETIME COMMENT '过期时间',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否活跃',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_session_token (session_token),
  INDEX idx_is_active (is_active),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录会话表';

-- ============================================
-- 5. 新增登录失败记录表
-- ============================================

DROP TABLE IF EXISTS login_failures;
CREATE TABLE login_failures (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '失败记录ID',
  username VARCHAR(100) COMMENT '用户名/警号',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  failure_reason VARCHAR(255) COMMENT '失败原因',
  attempt_count INT DEFAULT 1 COMMENT '尝试次数',
  is_locked BOOLEAN DEFAULT FALSE COMMENT '是否被锁定',
  locked_until DATETIME COMMENT '锁定截止时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_ip_address (ip_address),
  INDEX idx_is_locked (is_locked),
  UNIQUE KEY unique_username_ip (username, ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录失败记录表';

-- ============================================
-- 6. 扩展用户表
-- ============================================

-- 添加生物识别启用字段
ALTER TABLE users ADD COLUMN biometric_enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用生物识别' AFTER `on_duty`;

-- 添加最后登录时间
ALTER TABLE users ADD COLUMN last_login DATETIME COMMENT '最后登录时间' AFTER `biometric_enabled`;

-- 添加登录失败次数
ALTER TABLE users ADD COLUMN login_failures INT DEFAULT 0 COMMENT '登录失败次数' AFTER `last_login`;

-- 添加账户锁定状态
ALTER TABLE users ADD COLUMN is_locked BOOLEAN DEFAULT FALSE COMMENT '账户是否被锁定' AFTER `login_failures`;

-- 添加锁定截止时间
ALTER TABLE users ADD COLUMN locked_until DATETIME COMMENT '账户锁定截止时间' AFTER `is_locked`;

-- 添加索引
ALTER TABLE users ADD INDEX idx_last_login (last_login);
ALTER TABLE users ADD INDEX idx_is_locked (is_locked);

-- ============================================
-- 7. 新增视图
-- ============================================

-- 登录统计视图
DROP VIEW IF EXISTS v_login_summary;
CREATE VIEW v_login_summary AS
SELECT 
  DATE(login_time) as login_date,
  category,
  COUNT(*) as total_logins,
  SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_logins,
  SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed_logins,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM login_logs
GROUP BY DATE(login_time), category;

-- 用户登录历史视图
DROP VIEW IF EXISTS v_user_login_history;
CREATE VIEW v_user_login_history AS
SELECT 
  u.id,
  u.username,
  u.name,
  u.category,
  ll.login_time,
  ll.ip_address,
  ll.device_info,
  ll.login_method,
  ll.success,
  ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY ll.login_time DESC) as login_rank
FROM users u
LEFT JOIN login_logs ll ON u.id = ll.user_id;

-- 生物识别统计视图
DROP VIEW IF EXISTS v_biometric_summary;
CREATE VIEW v_biometric_summary AS
SELECT 
  user_id,
  COUNT(*) as total_biometric_methods,
  SUM(CASE WHEN biometric_type = 'fingerprint' THEN 1 ELSE 0 END) as fingerprint_count,
  SUM(CASE WHEN biometric_type = 'face' THEN 1 ELSE 0 END) as face_count,
  SUM(CASE WHEN biometric_type = 'iris' THEN 1 ELSE 0 END) as iris_count,
  MAX(last_used) as last_biometric_used
FROM biometric_data
WHERE is_active = TRUE
GROUP BY user_id;

-- ============================================
-- 8. 新增存储过程
-- ============================================

-- 记录登录日志
DROP PROCEDURE IF EXISTS sp_record_login;
DELIMITER //
CREATE PROCEDURE sp_record_login(
  IN p_user_id INT,
  IN p_username VARCHAR(100),
  IN p_category VARCHAR(20),
  IN p_ip_address VARCHAR(45),
  IN p_device_info TEXT,
  IN p_login_method VARCHAR(50),
  IN p_success BOOLEAN,
  IN p_failure_reason VARCHAR(255),
  IN p_session_id VARCHAR(255)
)
BEGIN
  INSERT INTO login_logs (
    user_id, username, category, ip_address, device_info, 
    login_method, success, failure_reason, session_id
  ) VALUES (
    p_user_id, p_username, p_category, p_ip_address, p_device_info,
    p_login_method, p_success, p_failure_reason, p_session_id
  );
  
  -- 更新用户最后登录时间
  IF p_success THEN
    UPDATE users SET last_login = NOW() WHERE id = p_user_id;
  END IF;
END //
DELIMITER ;

-- 记录登录失败
DROP PROCEDURE IF EXISTS sp_record_login_failure;
DELIMITER //
CREATE PROCEDURE sp_record_login_failure(
  IN p_username VARCHAR(100),
  IN p_ip_address VARCHAR(45),
  IN p_failure_reason VARCHAR(255),
  IN p_max_attempts INT
)
BEGIN
  DECLARE v_attempt_count INT;
  DECLARE v_lock_duration INT DEFAULT 3600; -- 1小时
  
  INSERT INTO login_failures (username, ip_address, failure_reason, attempt_count)
  VALUES (p_username, p_ip_address, p_failure_reason, 1)
  ON DUPLICATE KEY UPDATE 
    attempt_count = attempt_count + 1,
    updated_at = NOW();
  
  SELECT attempt_count INTO v_attempt_count 
  FROM login_failures 
  WHERE username = p_username AND ip_address = p_ip_address;
  
  -- 如果失败次数超过限制，锁定账户
  IF v_attempt_count >= p_max_attempts THEN
    UPDATE login_failures 
    SET is_locked = TRUE, locked_until = DATE_ADD(NOW(), INTERVAL v_lock_duration SECOND)
    WHERE username = p_username AND ip_address = p_ip_address;
    
    UPDATE users 
    SET is_locked = TRUE, locked_until = DATE_ADD(NOW(), INTERVAL v_lock_duration SECOND)
    WHERE username = p_username;
  END IF;
END //
DELIMITER ;

-- 创建登录会话
DROP PROCEDURE IF EXISTS sp_create_login_session;
DELIMITER //
CREATE PROCEDURE sp_create_login_session(
  IN p_user_id INT,
  IN p_session_token VARCHAR(255),
  IN p_device_id VARCHAR(255),
  IN p_category VARCHAR(20),
  IN p_ip_address VARCHAR(45),
  IN p_expires_hours INT
)
BEGIN
  INSERT INTO login_sessions (
    user_id, session_token, device_id, category, ip_address, expires_at
  ) VALUES (
    p_user_id, p_session_token, p_device_id, p_category, p_ip_address,
    DATE_ADD(NOW(), INTERVAL p_expires_hours HOUR)
  );
END //
DELIMITER ;

-- ============================================
-- 9. 新增触发器
-- ============================================

-- 登录失败时自动更新用户失败次数
DROP TRIGGER IF EXISTS tr_update_login_failures;
DELIMITER //
CREATE TRIGGER tr_update_login_failures
AFTER INSERT ON login_logs
FOR EACH ROW
BEGIN
  IF NEW.success = FALSE THEN
    UPDATE users 
    SET login_failures = login_failures + 1
    WHERE id = NEW.user_id;
  ELSE
    UPDATE users 
    SET login_failures = 0
    WHERE id = NEW.user_id;
  END IF;
END //
DELIMITER ;

-- ============================================
-- 10. 初始化数据
-- ============================================

-- 清理过期的会话
DELETE FROM login_sessions WHERE expires_at < NOW();

-- 解锁过期的账户
UPDATE users SET is_locked = FALSE WHERE locked_until < NOW();

-- ============================================
-- 完成
-- ============================================
-- 数据库优化脚本执行完成
-- 已添加: 5个新表, 3个视图, 3个存储过程, 1个触发器
-- 优化内容: 登录日志、生物识别、会话管理、失败记录
