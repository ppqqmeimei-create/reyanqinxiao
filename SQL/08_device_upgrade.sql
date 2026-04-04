-- ============================================
-- 热眼擒枭 - 设备模块数据库升级脚本
-- 版本: 1.2.0  创建日期: 2026-03-14
-- 修复: devices表字段对齐前端、status添加warning
-- ============================================

USE reyanjingxiao;

-- 1. status 枚举添加 'warning'
ALTER TABLE devices
  MODIFY COLUMN status ENUM('online','offline','warning','error') DEFAULT 'offline' COMMENT '设备状态';

-- 2. 补充前端必需字段
ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS battery INT DEFAULT 100 COMMENT '电量(0-100)',
  ADD COLUMN IF NOT EXISTS signal INT DEFAULT 100 COMMENT '信号强度(0-100)',
  ADD COLUMN IF NOT EXISTS edge_node_id VARCHAR(50) COMMENT '所属边缘节点ID';

-- 3. 确保 device_id 字段存在（前端用字符串ID如CAM-001）
ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS device_id VARCHAR(50) UNIQUE COMMENT '设备字符串编号';

-- 4. 补充 last_active 字段（前端用此字段显示最后活跃时间）
ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS last_active DATETIME COMMENT '最后活跃时间';

-- 5. 插入测试设备数据
INSERT IGNORE INTO devices
  (device_id, name, type, status, location, latitude, longitude,
   battery, signal, edge_node_id, last_active, is_active)
VALUES
  ('CAM-001',   '可见光摄像头-A01', 'camera-visible',  'online',  '边境A区-1号点', 39.9042, 116.4074, 85, 92, 'EDGE-01', NOW(), TRUE),
  ('CAM-002',   '红外摄像头-A02',   'camera-infrared', 'warning', '边境A区-2号点', 39.9052, 116.4084, 18, 75, 'EDGE-01', NOW(), TRUE),
  ('FIBER-001', '震动光纤-B01',     'fiber',           'online',  '边境B区-1号点', 39.9032, 116.4064, 92, 88, 'EDGE-02', NOW(), TRUE),
  ('SMELL-001', '气味探头-C01',     'smell',           'offline', '边境C区-1号点', 39.9062, 116.4094,  0,  0, 'EDGE-02', DATE_SUB(NOW(), INTERVAL 2 HOUR), TRUE),
  ('WATER-001', '水质监测仪-D01',   'water-monitor',   'online',  '河段D区监测点', 39.9072, 116.4104, 76, 83, 'EDGE-01', NOW(), TRUE),
  ('AIR-001',   '空气探测仪-E01',   'air-monitor',     'warning', '空气E区监测点', 39.9082, 116.4114, 12, 55, 'EDGE-02', NOW(), TRUE)
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- 6. 验证
SELECT device_id, name, type, status, battery, signal, edge_node_id
FROM devices ORDER BY id;
