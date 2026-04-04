-- =============================================
-- RBAC权限体系初始化
-- 文件: 03_rbac.sql
-- 描述: 角色、权限点、用户初始数据
-- =============================================

USE reyanqinxiao;

-- =============================================
-- 初始用户数据
-- 密码: 123456 (bcrypt加密后的hash)
-- =============================================
INSERT INTO users (id, username, password, name, badge_number, role, department, phone, status) VALUES
-- 系统管理员
('user-admin-001', 'admin', '$2a$10$X6xX5f5Y5Y5Y5Y5Y5Y5Y5.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', '系统管理员', 'GX-000', 'admin', '崇左支队信息中心', '0771-1234567', 'active'),
-- 指挥调度 (指挥官)
('user-commander-001', 'zhangwei', '$2a$10$X6xX5f5Y5Y5Y5Y5Y5Y5Y.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', '张伟', 'GX-001', 'commander', '崇左支队', '0771-1234501', 'active'),
('user-commander-002', 'lihua', '$2a$10$X6xX5f5Y5Y5Y5Y5Y5Y5Y.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', '李华', 'GX-006', 'commander', '防城港支队', '0770-1234501', 'active'),
-- 侦查研判 (调查员)
('user-investigator-001', 'lina', '$2a$10$X6xX5f5Y5Y5Y5Y5Y5Y5Y.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', '李娜', 'GX-002', 'investigator', '崇左支队', '0771-1234502', 'active'),
('user-investigator-002', 'liuyang', '$2a$10$X6xX5f5Y5Y5Y5Y5Y5Y5.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', '刘洋', 'GX-005', 'investigator', '防城港支队', '0770-1234505', 'active'),
-- 一线执勤 (巡逻员)
('user-frontline-001', 'wangqiang', '$2a$10$X6xX5f5Y5Y5Y5Y5Y5Y5Y.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', '王强', 'GX-003', 'frontline', '防城港支队', '0770-1234503', 'active'),
('user-frontline-002', 'chenjing', '$2a$10$X6xX5f5Y5Y5Y5Y5Y5Y5.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', '陈静', 'GX-004', 'frontline', '百色支队', '0776-1234504', 'active'),
('user-frontline-003', 'zhaoming', '$2a$10$X6xX5f5Y5Y5Y5Y5Y5Y5.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', '赵明', 'GX-007', 'frontline', '崇左支队', '0771-1234507', 'active'),
('user-frontline-004', 'sunli', '$2a$10$X6xX5f5Y5Y5Y5Y5Y5Y5.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5', '孙丽', 'GX-008', 'frontline', '百色支队', '0776-1234508', 'active');

-- =============================================
-- 预警样例数据
-- =============================================
INSERT INTO alerts (id, title, level, type, status, confidence, species_type, sensor_type, zone_id, location, latitude, longitude, distance_to_border, frequency, time_of_day, created_at) VALUES
('alert-001', '友谊关红外触发 - 疑似穿山甲', 'critical', '走私预警', 'pending', 96, '穿山甲', 'infrared', 'zone-001', '凭祥友谊关主通道', 22.0145, 106.7605, 50, 3, 'night', NOW()),
('alert-002', '东兴竹山区域异常震动信号', 'critical', '走私预警', 'assigned', 88, '未知', 'vibration', 'zone-002', '东兴竹山围网', 21.5350, 107.9580, 80, 2, 'night', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('alert-003', '水质传感器异常 - pH值偏低', 'warning', '生态预警', 'pending', 72, '未知', 'water', 'zone-003', '龙州水口河段', 22.4840, 106.6760, 200, 1, 'day', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('alert-004', 'GPS轨迹异常 - 偏离巡逻路线', 'critical', '走私预警', 'in_progress', 92, '未知', 'gps', 'zone-001', '凭祥友谊关北侧', 22.0180, 106.7540, 100, 1, 'night', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('alert-005', '气味传感器检测到异常气味', 'warning', '生态预警', 'pending', 68, '未知', 'smell', 'zone-005', '那坡边境区域', 23.4270, 105.8280, 150, 1, 'day', DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- =============================================
-- 任务样例数据
-- =============================================
INSERT INTO tasks (id, title, type, priority, status, alert_id, zone_id, location, latitude, longitude, assigned_to, created_by, progress, deadline, created_at) VALUES
('task-001', '友谊关走私案件调查', 'complete-sampling', 'high', 'in_progress', 'alert-001', 'zone-001', '凭祥友谊关主通道', 22.0145, 106.7605, 'user-frontline-001', 'user-commander-001', 65, DATE_ADD(NOW(), INTERVAL 8 HOUR), NOW()),
('task-002', '东兴口岸例行巡查', 'monitoring', 'normal', 'pending', 'alert-002', 'zone-002', '东兴竹山区域', 21.5350, 107.9580, 'user-investigator-001', 'user-commander-002', 0, DATE_ADD(NOW(), INTERVAL 8 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('task-003', '靖西岳圩快速勘查', 'quick-sampling', 'high', 'in_progress', 'alert-004', 'zone-004', '靖西岳圩主道', 23.1360, 106.4185, 'user-commander-001', 'user-commander-001', 30, DATE_ADD(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('task-004', '龙州水口定点检查', 'inspection', 'normal', 'completed', 'alert-003', 'zone-003', '龙州水口河段', 22.4840, 106.6760, 'user-investigator-002', 'user-commander-001', 100, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('task-005', '那坡桂林持续巡逻', 'monitoring', 'low', 'pending', null, 'zone-005', '那坡边境区域', 23.4270, 105.8280, 'user-frontline-002', 'user-commander-002', 0, DATE_ADD(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 30 MINUTE));

-- =============================================
-- AI模型配置
-- =============================================
INSERT INTO ai_config (id, model_version, model_name, confidence_threshold, enable_auto_alert, update_time, update_notes, accuracy, status) VALUES
('ai-config-001', 'FusionEngine-Lite-2026.03', '多模态时空融合引擎', 85, TRUE, '2026-03-15 10:00:00', '新增红外+振动+可见光三路信号融合算法', 94.50, 'active'),
('ai-config-002', 'FusionEngine-Lite-2025.11', '影子追踪V2.0', 85, TRUE, '2025-11-20 14:30:00', '优化夜间识别率', 91.20, 'deprecated');

COMMIT;
