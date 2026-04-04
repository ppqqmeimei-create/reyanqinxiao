-- ============================================
-- 热眼擒枭 - 用户模块数据库升级脚本
-- 版本: 1.3.0  创建日期: 2026-03-14
-- 修复: users表补充badge_number/department/rank字段
-- ============================================

USE reyanjingxiao;

-- 1. 补充用户必需字段
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department   VARCHAR(100) DEFAULT '广西环食药侦查总队' COMMENT '所属部门',
  ADD COLUMN IF NOT EXISTS badge_number VARCHAR(50)  COMMENT '警号',
  ADD COLUMN IF NOT EXISTS rank         VARCHAR(50)  DEFAULT '检查员' COMMENT '职级';

-- 2. status 枚举确保含 busy
ALTER TABLE users
  MODIFY COLUMN status ENUM('online','offline','busy') DEFAULT 'offline' COMMENT '用户状态';

-- 3. 插入测试用户数据
INSERT IGNORE INTO users
  (username, email, password, name, role, department, badge_number, rank, is_active)
VALUES
  ('zhang_san', 'zhangsan@eco.gov.cn', SHA2('password123',256), '张三', 'inspector',
   '广西环食药侦查总队', '9527', '高级检查员', TRUE),
  ('li_si',     'lisi@eco.gov.cn',     SHA2('password123',256), '李四', 'manager',
   '广西环食药侦查总队', '9528', '队长', TRUE)
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 4. 验证
SELECT id, username, name, department, badge_number, rank, status FROM users;
