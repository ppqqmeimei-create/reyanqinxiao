-- ============================================
-- 热眼擒枭 - 生态环保监控系统
-- 测试数据插入脚本
-- ============================================
-- 版本: 1.0.0
-- 创建日期: 2026-03-13
-- 说明: 插入测试数据用于开发和演示
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 插入测试用户
-- ============================================
-- 密码: password123 (已使用 bcrypt 加密)
INSERT INTO users (username, email, password, name, role, status, phone, department, badge_number) VALUES
('admin', 'admin@reyanjingxiao.com', '$2a$10$YourHashedPasswordHere', '系统管理员', 'admin', 'online', '13800138000', '广西环食药侦查总队', 'GX-A001'),
('manager1', 'manager1@reyanjingxiao.com', '$2a$10$YourHashedPasswordHere', '总队指挥员', 'manager', 'online', '13800138001', '广西环食药侦查总队', 'GX-M001'),
('inspector1', 'inspector1@reyanjingxiao.com', '$2a$10$YourHashedPasswordHere', '东兴执法员', 'inspector', 'online', '13800138002', '广西环食药侦查总队东兴边境支队', 'GX-DX001'),
('inspector2', 'inspector2@reyanjingxiao.com', '$2a$10$YourHashedPasswordHere', '凭祥执法员', 'inspector', 'online', '13800138003', '广西环食药侦查总队凭祥边境支队', 'GX-PX001'),
('inspector3', 'inspector3@reyanjingxiao.com', '$2a$10$YourHashedPasswordHere', '那坡执法员', 'inspector', 'busy', '13800138004', '广西环食药侦查总队那坡边境支队', 'GX-NP001');

-- ============================================
-- 2. 插入测试设备
-- ============================================
INSERT INTO devices (device_id, name, type, status, location, latitude, longitude, battery, signal_strength, edge_node_id, firmware_version, manufacturer, model) VALUES
('CAM-001', '东兴口岸可见光摄像头', 'camera-visible', 'online', '广西东兴市万尾金滩', 21.53180000, 108.03250000, 85, 92, 'GX-EDGE-01', 'v1.2.3', '海康威视', 'DS-2CD2345'),
('CAM-002', '友谊关红外摄像头', 'camera-infrared', 'warning', '广西凭祥市友谊关', 22.11280000, 106.76120000, 18, 75, 'GX-EDGE-01', 'v1.2.1', '大华', 'DH-IPC-HFW'),
('FIBER-001', '那坡界碑震动光纤', 'fiber', 'online', '广西那坡县中越界碑', 23.42450000, 105.83360000, 92, 88, 'GX-EDGE-02', 'v2.0.1', '烽火通信', 'FH-F100'),
('SMELL-001', '水口口岸气味探头', 'smell', 'offline', '广西龙州县水口口岸', 22.48680000, 106.67190000, 0, 0, 'GX-EDGE-02', 'v1.0.5', '汉威科技', 'HW-S200'),
('WATER-001', '东兴近海水质监测仪', 'water-monitor', 'online', '广西东兴市万尾金滩海域', 21.52800000, 108.03600000, 78, 85, 'GX-EDGE-03', 'v1.5.0', '聚光科技', 'JG-W300'),
('AIR-001', '凭祥空气监测站', 'air-monitor', 'online', '广西凭祥市边境口岸区', 22.10800000, 106.76200000, 95, 90, 'GX-EDGE-03', 'v2.1.0', '先河环保', 'XH-A500'),
('SOIL-001', '那坡土壤监测仪', 'soil-monitor', 'online', '广西那坡县边境耕地', 23.42000000, 105.84000000, 88, 82, 'GX-EDGE-04', 'v1.3.2', '雪迪龙', 'SDL-S100');

-- ============================================
-- 3. 插入设备元数据
-- ============================================
INSERT INTO device_metadata (device_id, ph, temperature, humidity, pm25, aqi, heavy_metal) VALUES
(5, 7.2, 25.5, 60.0, NULL, NULL, NULL),
(6, NULL, 22.0, 55.0, 45.0, 85, NULL),
(7, NULL, 18.5, 70.0, NULL, NULL, 0.3);

-- ============================================
-- 4. 插入测试预警
-- ============================================
INSERT INTO alerts (title, description, level, status, type, category, location, latitude, longitude, risk_score, pollutant_type, pollutant_value, standard_value, exceed_ratio, affected_population, source, urgency, created_by, assigned_to) VALUES
('疑似非法运输食蟹猴', '东兴万尾金滩便道卡口识别到疑似非法运输食蟹猴车辆', 'critical', 'pending', 'water-pollution', 'water', '广西东兴市万尾金滩', 21.53180000, 108.03250000, 94, '生物活体风险', 12.0, 0.0, NULL, 0, 'device', '立即出警', 1, 3),
('红外相机抓拍疑似穿山甲走私', '友谊关附近红外相机连续抓拍可疑运输行为', 'critical', 'processing', 'air-pollution', 'air', '广西凭祥市友谊关附近', 22.11280000, 106.76120000, 96, '疑似穿山甲', 3.0, 0.0, NULL, 0, 'device', '2小时内响应', 1, 4),
('中越边境某界碑处发现异常震动', '那坡县边境震动光纤报警，疑似夜间跨境运输', 'warning', 'pending', 'soil-pollution', 'soil', '广西那坡县中越界碑', 23.42450000, 105.83360000, 82, '边境异常震动', 1.0, 0.0, NULL, 0, 'device', '24小时内响应', 1, 5),
('龙州水口口岸发现疑似活体藏匿', '口岸联合检查发现疑似活体运输舱', 'warning', 'resolved', 'waste-pollution', 'waste', '广西龙州县水口口岸', 22.48680000, 106.67190000, 78, '活体藏匿线索', NULL, NULL, NULL, 0, 'manual', '立即出警', 2, 3),
('东兴近海监测点出现异常轨迹', '近海监测识别出非常规夜间接驳轨迹', 'info', 'ignored', 'water-pollution', 'water', '广西东兴市万尾金滩海域', 21.52800000, 108.03600000, 45, '轨迹异常', 5.8, 7.0, NULL, 0, 'device', '常规处理', 1, NULL);

-- ============================================
-- 5. 插入测试任务
-- ============================================
INSERT INTO tasks (title, description, type, status, priority, alert_id, assigned_to, created_by, location, latitude, longitude, deadline, progress) VALUES
('东兴口岸疑似食蟹猴运输核查', '对东兴万尾金滩可疑车辆开展现场核查', 'inspection', 'in-progress', 'urgent', 1, 3, 1, '广西东兴市万尾金滩', 21.53180000, 108.03250000, DATE_ADD(NOW(), INTERVAL 2 HOUR), 60),
('友谊关穿山甲线索围堵', '组织凭祥边境支队对友谊关周边开展围堵', 'inspection', 'pending', 'high', 2, 4, 1, '广西凭祥市友谊关附近', 22.11280000, 106.76120000, DATE_ADD(NOW(), INTERVAL 1 DAY), 0),
('那坡界碑异常震动复核', '对那坡县界碑异常震动点位进行复核', 'monitoring', 'pending', 'medium', 3, 5, 1, '广西那坡县中越界碑', 23.42450000, 105.83360000, DATE_ADD(NOW(), INTERVAL 2 DAY), 0),
('龙州水口口岸现场调查', '对水口口岸可疑运输舱开展证据固定', 'inspection', 'completed', 'urgent', 4, 3, 2, '广西龙州县水口口岸', 22.48680000, 106.67190000, DATE_ADD(NOW(), INTERVAL -1 DAY), 100),
('东兴近海常规巡检', '对东兴近海高风险接驳区域进行常态巡检', 'monitoring', 'in-progress', 'low', NULL, 4, 2, '广西东兴市万尾金滩海域', 21.52800000, 108.03600000, DATE_ADD(NOW(), INTERVAL 7 DAY), 30);

-- ============================================
-- 6. 插入任务证据
-- ============================================
INSERT INTO task_evidence (task_id, type, url, description) VALUES
(1, 'image', '/uploads/evidence/task1_sample1.jpg', '排污口水样照片'),
(1, 'image', '/uploads/evidence/task1_sample2.jpg', '采样过程照片'),
(1, 'document', '/uploads/evidence/task1_report.pdf', '初步检测报告'),
(4, 'image', '/uploads/evidence/task4_scene1.jpg', '现场全景照片'),
(4, 'image', '/uploads/evidence/task4_scene2.jpg', '废弃物特写照片'),
(4, 'video', '/uploads/evidence/task4_video.mp4', '现场视频记录');

-- ============================================
-- 7. 插入任务检查清单
-- ============================================
INSERT INTO task_checklist (task_id, item, completed, completed_at) VALUES
(1, '准备采样设备', TRUE, DATE_ADD(NOW(), INTERVAL -2 HOUR)),
(1, '到达现场', TRUE, DATE_ADD(NOW(), INTERVAL -1 HOUR)),
(1, '采集水样', TRUE, DATE_ADD(NOW(), INTERVAL -30 MINUTE)),
(1, '封存样品', FALSE, NULL),
(1, '送检实验室', FALSE, NULL),
(2, '准备检测设备', FALSE, NULL),
(2, '到达现场', FALSE, NULL),
(2, '空气质量检测', FALSE, NULL),
(2, '记录数据', FALSE, NULL);

-- ============================================
-- 8. 插入通知
-- ============================================
INSERT INTO notifications (user_id, type, title, content, related_type, related_id, is_read) VALUES
(3, 'alert', '新预警分配', '您有一个新的紧急预警需要处理：东兴万尾金滩疑似非法运输食蟹猴', 'alert', 1, FALSE),
(3, 'task', '任务即将到期', '任务"东兴口岸疑似食蟹猴运输核查"将在2小时后到期', 'task', 1, FALSE),
(4, 'alert', '新预警分配', '您有一个新的预警需要处理：友谊关红外抓拍疑似穿山甲走私', 'alert', 2, TRUE),
(5, 'alert', '新预警分配', '您有一个新的预警需要处理：那坡界碑异常震动', 'alert', 3, FALSE),
(3, 'system', '系统通知', '广西边境试点数据已更新，请及时核查在办案件', 'other', NULL, TRUE);

-- ============================================
-- 9. 插入系统日志
-- ============================================
INSERT INTO system_logs (user_id, action, module, method, path, ip, response_status) VALUES
(1, '用户登录', 'auth', 'POST', '/api/v1/auth/login', '192.168.1.100', 200),
(3, '查看预警列表', 'alerts', 'GET', '/api/v1/alerts', '192.168.1.101', 200),
(3, '创建任务', 'tasks', 'POST', '/api/v1/tasks', '192.168.1.101', 201),
(4, '更新任务进度', 'tasks', 'PUT', '/api/v1/tasks/5/progress', '192.168.1.102', 200),
(2, '查看设备列表', 'devices', 'GET', '/api/v1/devices', '192.168.1.103', 200);

-- ============================================
-- 10. 插入文件上传记录
-- ============================================
INSERT INTO file_uploads (user_id, original_name, stored_name, file_path, file_size, mime_type, file_type, related_type, related_id) VALUES
(3, 'sample1.jpg', 'task1_sample1_20260313.jpg', '/uploads/evidence/task1_sample1.jpg', 2048576, 'image/jpeg', 'image', 'task', 1),
(3, 'sample2.jpg', 'task1_sample2_20260313.jpg', '/uploads/evidence/task1_sample2.jpg', 1856432, 'image/jpeg', 'image', 'task', 1),
(3, 'report.pdf', 'task1_report_20260313.pdf', '/uploads/evidence/task1_report.pdf', 512000, 'application/pdf', 'document', 'task', 1),
(3, 'scene1.jpg', 'task4_scene1_20260313.jpg', '/uploads/evidence/task4_scene1.jpg', 3145728, 'image/jpeg', 'image', 'task', 4),
(3, 'video.mp4', 'task4_video_20260313.mp4', '/uploads/evidence/task4_video.mp4', 15728640, 'video/mp4', 'video', 'task', 4);

-- ============================================
-- 测试数据插入完成
-- ============================================

-- 查询统计信息
SELECT '用户数量' AS 统计项, COUNT(*) AS 数量 FROM users
UNION ALL
SELECT '设备数量', COUNT(*) FROM devices
UNION ALL
SELECT '预警数量', COUNT(*) FROM alerts
UNION ALL
SELECT '任务数量', COUNT(*) FROM tasks
UNION ALL
SELECT '证据数量', COUNT(*) FROM task_evidence
UNION ALL
SELECT '通知数量', COUNT(*) FROM notifications;
