-- ============================================
-- 热眼擒枭 - 登录模块数据库升级脚本
-- 版本: 1.4.0  创建日期: 2026-03-14
-- 修复: password列重命名为password_hash、补充rank
-- ============================================

USE reyanjingxiao;

-- 1. 将 password 列重命名为 password_hash（与ORM对齐）
-- 仅当 password 列存在、password_hash 不存在时执行
SET @has_password = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='reyanjingxiao' AND TABLE_NAME='users' AND COLUMN_NAME='password');
SET @has_hash = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='reyanjingxiao' AND TABLE_NAME='users' AND COLUMN_NAME='password_hash');
SET @sql = IF(@has_password > 0 AND @has_hash = 0,
  'ALTER TABLE users CHANGE COLUMN `password` `password_hash` VARCHAR(255) NOT NULL COMMENT \'密码哈希\'',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 补充 rank 字段
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS `rank` VARCHAR(50) DEFAULT '检查员' COMMENT '职级';

-- 3. badge_number 索引（加速按警号登录）
SET @idx = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA='reyanjingxiao' AND TABLE_NAME='users' AND INDEX_NAME='idx_badge_number');
SET @isql = IF(@idx=0, 'CREATE INDEX idx_badge_number ON users(badge_number)', 'SELECT 1');
PREPARE istmt FROM @isql; EXECUTE istmt; DEALLOCATE PREPARE istmt;

-- 4. 确保 department 字段存在
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department VARCHAR(100)
  DEFAULT '广西环食药侦查总队' COMMENT '部门';

-- 5. 插入测试账号（密码使用 werkzeug generate_password_hash('password123')）
-- 直接用明文仅作演示，生产环境请用Flask脚本生成hash后插入
INSERT IGNORE INTO users
  (username, email, password_hash, name, role, department, badge_number, `rank`, is_active)
VALUES
  ('zhang_san', 'zhangsan@eco.gov.cn',
   'pbkdf2:sha256:260000$placeholder$hash', -- 请用Flask生成真实hash
   '张三', 'inspector', '广西环食药侦查总队', '9527', '高级检查员', TRUE),
  ('admin', 'admin@eco.gov.cn',
   'pbkdf2:sha256:260000$placeholder$hash',
   '管理员', 'admin', '广西环食药侦查总队', '0001', '队长', TRUE)
ON DUPLICATE KEY UPDATE updated_at=NOW();

-- 6. 验证
SELECT id, username, name, badge_number, `rank`, department, status FROM users;
