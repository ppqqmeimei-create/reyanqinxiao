-- ============================================
-- 热眼擒枭 - 生态环保监控系统
-- 常用查询脚本
-- ============================================
-- 版本: 1.0.0
-- 创建日期: 2026-03-13
-- 说明: 常用的数据查询和统计SQL
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 用户相关查询
-- ============================================

-- 1.1 查询所有在线用户
SELECT id, username, name, role, status, last_login
FROM users
WHERE status = 'online'
ORDER BY last_login DESC;

-- 1.2 查询用户统计信息
SELECT 
  role AS 角色,
  COUNT(*) AS 用户数,
  SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) AS 在线数,
  SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS 激活数
FROM users
GROUP BY role;

-- 1.3 查询最近登录的用户
SELECT username, name, role, last_login
FROM users
WHERE last_login IS NOT NULL
ORDER BY last_login DESC
LIMIT 10;

-- ============================================
-- 2. 预警相关查询
-- ============================================

-- 2.1 查询待处理的紧急预警
SELECT 
  a.id,
  a.title,
  a.level,
  a.type,
  a.location,
  a.risk_score,
  a.created_at,
  u.name AS 分配给
FROM alerts a
LEFT JOIN users u ON a.assigned_to = u.id
WHERE a.status = 'pending' AND a.level = 'critical'
ORDER BY a.risk_score DESC, a.created_at ASC;

-- 2.2 预警统计（按级别）
SELECT 
  level AS 预警级别,
  COUNT(*) AS 总数,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS 待处理,
  SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS 处理中,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS 已解决,
  SUM(CASE WHEN status = 'ignored' THEN 1 ELSE 0 END) AS 已忽略
FROM alerts
GROUP BY level
ORDER BY FIELD(level, 'critical', 'warning', 'info');

-- 2.3 预警统计（按类型）
SELECT 
  type AS 预警类型,
  COUNT(*) AS 总数,
  AVG(risk_score) AS 平均风险评分,
  MAX(risk_score) AS 最高风险评分
FROM alerts
GROUP BY type
ORDER BY AVG(risk_score) DESC;

-- 2.4 查询最近24小时的预警
SELECT 
  id,
  title,
  level,
  type,
  location,
  risk_score,
  created_at
FROM alerts
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY created_at DESC;

-- 2.5 查询高风险区域（按位置统计）
SELECT 
  location AS 位置,
  COUNT(*) AS 预警次数,
  AVG(risk_score) AS 平均风险评分,
  SUM(CASE WHEN level = 'critical' THEN 1 ELSE 0 END) AS 紧急预警数
FROM alerts
GROUP BY location
HAVING COUNT(*) >= 2
ORDER BY AVG(risk_score) DESC;

-- 2.6 查询用户处理的预警统计
SELECT 
  u.name AS 用户名,
  u.role AS 角色,
  COUNT(a.id) AS 分配预警数,
  SUM(CASE WHEN a.status = 'resolved' THEN 1 ELSE 0 END) AS 已解决数,
  ROUND(SUM(CASE WHEN a.status = 'resolved' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id), 2) AS 解决率
FROM users u
LEFT JOIN alerts a ON u.id = a.assigned_to
WHERE u.role IN ('inspector', 'manager')
GROUP BY u.id, u.name, u.role
ORDER BY 解决率 DESC;

-- ============================================
-- 3. 任务相关查询
-- ============================================

-- 3.1 查询进行中的任务
SELECT 
  t.id,
  t.title,
  t.type,
  t.priority,
  t.progress,
  t.deadline,
  u.name AS 执行人,
  TIMESTAMPDIFF(HOUR, NOW(), t.deadline) AS 剩余小时
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status = 'in-progress'
ORDER BY t.priority DESC, t.deadline ASC;

-- 3.2 查询即将到期的任务
SELECT 
  t.id,
  t.title,
  t.priority,
  t.deadline,
  u.name AS 执行人,
  TIMESTAMPDIFF(HOUR, NOW(), t.deadline) AS 剩余小时
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status IN ('pending', 'in-progress')
  AND t.deadline <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
ORDER BY t.deadline ASC;

-- 3.3 任务统计（按状态）
SELECT 
  status AS 任务状态,
  COUNT(*) AS 数量,
  AVG(progress) AS 平均进度
FROM tasks
GROUP BY status
ORDER BY FIELD(status, 'pending', 'in-progress', 'completed', 'cancelled');

-- 3.4 任务统计（按类型）
SELECT 
  type AS 任务类型,
  COUNT(*) AS 总数,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS 已完成,
  ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS 完成率
FROM tasks
GROUP BY type;

-- 3.5 查询任务及其证据
SELECT 
  t.id AS 任务ID,
  t.title AS 任务标题,
  t.status AS 状态,
  COUNT(te.id) AS 证据数量,
  GROUP_CONCAT(te.type) AS 证据类型
FROM tasks t
LEFT JOIN task_evidence te ON t.id = te.task_id
GROUP BY t.id, t.title, t.status
HAVING COUNT(te.id) > 0
ORDER BY t.created_at DESC;

-- 3.6 查询用户任务完成情况
SELECT 
  u.name AS 用户名,
  COUNT(t.id) AS 分配任务数,
  SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS 已完成数,
  SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) AS 进行中,
  SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS 待开始,
  ROUND(AVG(t.progress), 2) AS 平均进度
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to
WHERE u.role IN ('inspector', 'manager')
GROUP BY u.id, u.name
ORDER BY 已完成数 DESC;

-- ============================================
-- 4. 设备相关查询
-- ============================================

-- 4.1 查询在线设备
SELECT 
  device_id,
  name,
  type,
  location,
  battery,
  signal_strength,
  last_heartbeat
FROM devices
WHERE status = 'online'
ORDER BY last_heartbeat DESC;

-- 4.2 查询需要维护的设备
SELECT 
  device_id,
  name,
  type,
  status,
  battery,
  last_heartbeat,
  CASE 
    WHEN battery < 20 THEN '电量不足'
    WHEN status = 'warning' THEN '状态异常'
    WHEN status = 'error' THEN '设备故障'
    WHEN TIMESTAMPDIFF(HOUR, last_heartbeat, NOW()) > 24 THEN '长时间未响应'
  END AS 维护原因
FROM devices
WHERE battery < 20 
   OR status IN ('warning', 'error')
   OR TIMESTAMPDIFF(HOUR, last_heartbeat, NOW()) > 24
ORDER BY 
  CASE status 
    WHEN 'error' THEN 1
    WHEN 'warning' THEN 2
    ELSE 3
  END,
  battery ASC;

-- 4.3 设备统计（按类型）
SELECT 
  type AS 设备类型,
  COUNT(*) AS 总数,
  SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) AS 在线数,
  SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) AS 离线数,
  SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) AS 预警数,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS 故障数,
  ROUND(AVG(battery), 2) AS 平均电量,
  ROUND(AVG(signal_strength), 2) AS 平均信号
FROM devices
GROUP BY type;

-- 4.4 设备健康度统计
SELECT 
  CASE 
    WHEN battery >= 80 AND signal_strength >= 80 AND status = 'online' THEN '优秀'
    WHEN battery >= 50 AND signal_strength >= 60 AND status = 'online' THEN '良好'
    WHEN battery >= 20 AND signal_strength >= 40 THEN '一般'
    ELSE '较差'
  END AS 健康度,
  COUNT(*) AS 设备数量
FROM devices
GROUP BY 健康度
ORDER BY FIELD(健康度, '优秀', '良好', '一般', '较差');

-- 4.5 查询设备最新监测数据
SELECT 
  d.device_id,
  d.name,
  d.type,
  dm.ph,
  dm.temperature,
  dm.humidity,
  dm.pm25,
  dm.aqi,
  dm.heavy_metal,
  dm.recorded_at
FROM devices d
INNER JOIN device_metadata dm ON d.id = dm.device_id
WHERE dm.id IN (
  SELECT MAX(id)
  FROM device_metadata
  GROUP BY device_id
)
ORDER BY dm.recorded_at DESC;

-- ============================================
-- 5. 综合统计查询
-- ============================================

-- 5.1 系统总体统计
SELECT 
  '用户总数' AS 统计项, COUNT(*) AS 数值 FROM users
UNION ALL
SELECT '在线用户', COUNT(*) FROM users WHERE status = 'online'
UNION ALL
SELECT '设备总数', COUNT(*) FROM devices
UNION ALL
SELECT '在线设备', COUNT(*) FROM devices WHERE status = 'online'
UNION ALL
SELECT '预警总数', COUNT(*) FROM alerts
UNION ALL
SELECT '待处理预警', COUNT(*) FROM alerts WHERE status = 'pending'
UNION ALL
SELECT '任务总数', COUNT(*) FROM tasks
UNION ALL
SELECT '进行中任务', COUNT(*) FROM tasks WHERE status = 'in-progress'
UNION ALL
SELECT '通知总数', COUNT(*) FROM notifications
UNION ALL
SELECT '未读通知', COUNT(*) FROM notifications WHERE is_read = FALSE;

-- 5.2 今日数据统计
SELECT 
  '今日新增预警' AS 统计项, COUNT(*) AS 数值
FROM alerts
WHERE DATE(created_at) = CURDATE()
UNION ALL
SELECT '今日新增任务', COUNT(*)
FROM tasks
WHERE DATE(created_at) = CURDATE()
UNION ALL
SELECT '今日完成任务', COUNT(*)
FROM tasks
WHERE DATE(updated_at) = CURDATE() AND status = 'completed'
UNION ALL
SELECT '今日解决预警', COUNT(*)
FROM alerts
WHERE DATE(resolved_at) = CURDATE() AND status = 'resolved';

-- 5.3 本周数据统计
SELECT 
  '本周新增预警' AS 统计项, COUNT(*) AS 数值
FROM alerts
WHERE YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1)
UNION ALL
SELECT '本周新增任务', COUNT(*)
FROM tasks
WHERE YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1)
UNION ALL
SELECT '本周完成任务', COUNT(*)
FROM tasks
WHERE YEARWEEK(updated_at, 1) = YEARWEEK(NOW(), 1) AND status = 'completed'
UNION ALL
SELECT '本周解决预警', COUNT(*)
FROM alerts
WHERE YEARWEEK(resolved_at, 1) = YEARWEEK(NOW(), 1) AND status = 'resolved';

-- 5.4 预警趋势（最近7天）
SELECT 
  DATE(created_at) AS 日期,
  COUNT(*) AS 预警数量,
  SUM(CASE WHEN level = 'critical' THEN 1 ELSE 0 END) AS 紧急预警,
  SUM(CASE WHEN level = 'warning' THEN 1 ELSE 0 END) AS 一般预警,
  AVG(risk_score) AS 平均风险评分
FROM alerts
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY 日期 DESC;

-- 5.5 任务完成趋势（最近7天）
SELECT 
  DATE(updated_at) AS 日期,
  COUNT(*) AS 完成任务数,
  AVG(progress) AS 平均进度
FROM tasks
WHERE updated_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  AND status = 'completed'
GROUP BY DATE(updated_at)
ORDER BY 日期 DESC;

-- ============================================
-- 6. 地理位置相关查询
-- ============================================

-- 6.1 查询指定范围内的预警（示例：以某点为中心，半径5公里）
-- 使用 Haversine 公式计算距离
SELECT 
  id,
  title,
  level,
  location,
  latitude,
  longitude,
  ROUND(
    6371 * ACOS(
      COS(RADIANS(39.9042)) * COS(RADIANS(latitude)) * 
      COS(RADIANS(longitude) - RADIANS(116.4074)) + 
      SIN(RADIANS(39.9042)) * SIN(RADIANS(latitude))
    ), 2
  ) AS 距离_公里
FROM alerts
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
HAVING 距离_公里 <= 5
ORDER BY 距离_公里 ASC;

-- 6.2 查询指定范围内的设备
SELECT 
  device_id,
  name,
  type,
  status,
  location,
  latitude,
  longitude,
  ROUND(
    6371 * ACOS(
      COS(RADIANS(39.9042)) * COS(RADIANS(latitude)) * 
      COS(RADIANS(longitude) - RADIANS(116.4074)) + 
      SIN(RADIANS(39.9042)) * SIN(RADIANS(latitude))
    ), 2
  ) AS 距离_公里
FROM devices
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
HAVING 距离_公里 <= 5
ORDER BY 距离_公里 ASC;

-- ============================================
-- 查询脚本结束
-- ============================================
