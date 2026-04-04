-- =============================================
-- 广西边境种子数据
-- 文件: 02_seed.sql
-- 描述: 五大战区、界碑、联合执勤点等基础数据
-- =============================================

USE reyanqinxiao;

-- =============================================
-- 五大战区数据
-- =============================================
INSERT INTO zones (id, name, code, risk_level, center_lat, center_lng, scale, description) VALUES
('zone-001', '凭祥友谊关', 'PXYYG', 'high', 22.0150, 106.7580, 14, '广西凭祥市友谊镇，中越边境重要的陆地口岸'),
('zone-002', '东兴口岸', 'DXKK', 'high', 21.5400, 107.9700, 14, '广西防城港东兴市，中国与越南海陆相连的口岸'),
('zone-003', '龙州水口', 'LZSK', 'medium', 22.4868, 106.6719, 13, '广西崇左市龙州县水口镇，边境贸易重要通道'),
('zone-004', '靖西岳圩', 'JXYW', 'medium', 23.1340, 106.4170, 13, '广西百色市靖西县岳圩乡，山区边境地带'),
('zone-005', '那坡桂林', 'NPGL', 'low', 23.4245, 105.8336, 13, '广西百色市那坡县，滇桂交界山区');

-- =============================================
-- 界碑数据 (凭祥友谊关)
-- =============================================
INSERT INTO border_markers (id, marker_no, name, zone_id, latitude, longitude, marker_type) VALUES
('bm-001', '835', '友谊关1号界碑', 'zone-001', 22.0135, 106.7620, 'main'),
('bm-002', '836', '友谊关2号界碑', 'zone-001', 22.0168, 106.7545, 'main'),
('bm-003', '837', '凭祥3号界碑', 'zone-001', 22.0225, 106.7490, 'main'),
('bm-004', '838', '凭祥4号界碑', 'zone-001', 22.0185, 106.7568, 'auxiliary'),
('bm-005', '839', '凭祥5号界碑', 'zone-001', 22.0250, 106.7425, 'auxiliary'),
('bm-006', '840', '凭祥6号界碑', 'zone-001', 22.0080, 106.7680, 'main'),
('bm-007', '841', '凭祥7号界碑', 'zone-001', 22.0295, 106.7350, 'auxiliary'),
('bm-008', '842', '凭祥8号界碑', 'zone-001', 22.0045, 106.7725, 'auxiliary');

-- =============================================
-- 界碑数据 (东兴口岸)
-- =============================================
INSERT INTO border_markers (id, marker_no, name, zone_id, latitude, longitude, marker_type) VALUES
('bm-101', '1108', '东兴北仑河1号', 'zone-002', 21.5385, 107.9650, 'main'),
('bm-102', '1109', '东兴北仑河2号', 'zone-002', 21.5420, 107.9720, 'main'),
('bm-103', '1110', '东兴竹山1号', 'zone-002', 21.5350, 107.9580, 'main'),
('bm-104', '1111', '东兴竹山2号', 'zone-002', 21.5475, 107.9785, 'auxiliary'),
('bm-105', '1112', '东兴口岸1号', 'zone-002', 21.5490, 107.9820, 'main'),
('bm-106', '1113', '东兴口岸2号', 'zone-002', 21.5330, 107.9540, 'auxiliary');

-- =============================================
-- 界碑数据 (龙州水口)
-- =============================================
INSERT INTO border_markers (id, marker_no, name, zone_id, latitude, longitude, marker_type) VALUES
('bm-201', '786', '水口1号界碑', 'zone-003', 22.4890, 106.6680, 'main'),
('bm-202', '787', '水口2号界碑', 'zone-003', 22.4835, 106.6750, 'main'),
('bm-203', '788', '水口3号界碑', 'zone-003', 22.4915, 106.6620, 'auxiliary'),
('bm-204', '789', '水口4号界碑', 'zone-003', 22.4800, 106.6795, 'auxiliary');

-- =============================================
-- 界碑数据 (靖西岳圩)
-- =============================================
INSERT INTO border_markers (id, marker_no, name, zone_id, latitude, longitude, marker_type) VALUES
('bm-301', '654', '岳圩1号界碑', 'zone-004', 23.1365, 106.4200, 'main'),
('bm-302', '655', '岳圩2号界碑', 'zone-004', 23.1310, 106.4155, 'main'),
('bm-303', '656', '岳圩3号界碑', 'zone-004', 23.1395, 106.4250, 'auxiliary');

-- =============================================
-- 界碑数据 (那坡桂林)
-- =============================================
INSERT INTO border_markers (id, marker_no, name, zone_id, latitude, longitude, marker_type) VALUES
('bm-401', '567', '那坡1号界碑', 'zone-005', 23.4270, 105.8280, 'main'),
('bm-402', '568', '那坡2号界碑', 'zone-005', 23.4210, 105.8380, 'main'),
('bm-403', '569', '那坡3号界碑', 'zone-005', 23.4300, 105.8210, 'auxiliary');

-- =============================================
-- 设备数据 (红外热成像相机)
-- =============================================
INSERT INTO devices (id, device_id, name, type, zone_id, location, latitude, longitude, sensitivity, manufacturer, model, firmware_version, status, last_heartbeat) VALUES
-- 凭祥友谊关
('dev-001', 'GX-IR-201', '友谊关红外相机A', 'infrared', 'zone-001', '友谊关主通道', 22.0145, 106.7605, 85, '海康威视', 'DS-2TD8167', 'V5.1.2', 'online', NOW()),
('dev-002', 'GX-IR-202', '友谊关红外相机B', 'infrared', 'zone-001', '友谊关北侧', 22.0175, 106.7555, 80, '大华', 'DH-TPC-B7500', 'V3.2.1', 'online', NOW()),
('dev-003', 'GX-IR-203', '凭祥红外相机A', 'infrared', 'zone-001', '凭祥货场', 22.0230, 106.7495, 78, '海康威视', 'DS-2TD8167', 'V5.1.2', 'warning', NOW()),
-- 东兴口岸
('dev-004', 'GX-IR-101', '东兴红外相机A', 'infrared', 'zone-002', '北仑河畔', 21.5375, 107.9645, 82, '海康威视', 'DS-2TD8167', 'V5.1.2', 'online', NOW()),
('dev-005', 'GX-IR-102', '东兴红外相机B', 'infrared', 'zone-002', '东兴口岸', 21.5495, 107.9815, 88, '大华', 'DH-TPC-B7500', 'V3.2.1', 'online', NOW()),
-- 龙州水口
('dev-006', 'GX-IR-301', '水口红外相机A', 'infrared', 'zone-003', '水口大桥', 22.4880, 106.6695, 75, '海康威视', 'DS-2TD8167', 'V5.1.2', 'online', NOW()),
-- 靖西岳圩
('dev-007', 'GX-IR-401', '岳圩红外相机A', 'infrared', 'zone-004', '岳圩主道', 23.1355, 106.4185, 80, '大华', 'DH-TPC-B7500', 'V3.2.1', 'online', NOW()),
-- 那坡桂林
('dev-008', 'GX-IR-501', '那坡红外相机A', 'infrared', 'zone-005', '那坡边境', 23.4260, 105.8295, 85, '海康威视', 'DS-2TD8167', 'V5.1.2', 'warning', NOW());

-- =============================================
-- 设备数据 (振动光纤传感器)
-- =============================================
INSERT INTO devices (id, device_id, name, type, zone_id, location, latitude, longitude, sensitivity, manufacturer, model, firmware_version, status, last_heartbeat) VALUES
('dev-101', 'GX-VIB-201', '凭祥光纤围栏A', 'vibration', 'zone-001', '友谊关围网', 22.0150, 106.7580, 75, '深圳华儒', 'HR-FOT-V', 'V2.5.0', 'online', NOW()),
('dev-102', 'GX-VIB-202', '凭祥光纤围栏B', 'vibration', 'zone-001', '凭祥货场围网', 22.0235, 106.7480, 72, '深圳华儒', 'HR-FOT-V', 'V2.5.0', 'online', NOW()),
('dev-103', 'GX-VIB-101', '东兴光纤围栏A', 'vibration', 'zone-002', '北仑河围网', 21.5405, 107.9685, 78, '深圳华儒', 'HR-FOT-V', 'V2.5.0', 'online', NOW()),
('dev-104', 'GX-VIB-301', '水口光纤围栏A', 'vibration', 'zone-003', '水口大桥围网', 22.4850, 106.6735, 70, '深圳华儒', 'HR-FOT-V', 'V2.5.0', 'online', NOW()),
('dev-105', 'GX-VIB-401', '岳圩光纤围栏A', 'vibration', 'zone-004', '岳圩围网', 23.1340, 106.4180, 68, '深圳华儒', 'HR-FOT-V', 'V2.5.0', 'offline', DATE_SUB(NOW(), INTERVAL 30 MINUTE));

-- =============================================
-- 设备数据 (可见光摄像机)
-- =============================================
INSERT INTO devices (id, device_id, name, type, zone_id, location, latitude, longitude, sensitivity, manufacturer, model, firmware_version, status, last_heartbeat) VALUES
('dev-201', 'GX-CAM-201', '凭祥可见光A', 'visible', 'zone-001', '友谊关入口', 22.0140, 106.7615, 70, '海康威视', 'DS-2CD3T86', 'V5.6.0', 'online', NOW()),
('dev-202', 'GX-CAM-202', '凭祥可见光B', 'visible', 'zone-001', '凭祥货场', 22.0230, 106.7490, 70, '大华', 'DH-IPC-HFW5', 'V4.3.0', 'offline', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('dev-203', 'GX-CAM-101', '东兴可见光A', 'visible', 'zone-002', '东兴口岸', 21.5485, 107.9810, 72, '海康威视', 'DS-2CD3T86', 'V5.6.0', 'online', NOW()),
('dev-204', 'GX-CAM-301', '水口可见光A', 'visible', 'zone-003', '水口大桥', 22.4870, 106.6700, 68, '大华', 'DH-IPC-HFW5', 'V4.3.0', 'online', NOW());

-- =============================================
-- 设备数据 (GPS定位设备)
-- =============================================
INSERT INTO devices (id, device_id, name, type, zone_id, location, latitude, longitude, status, last_heartbeat) VALUES
('dev-301', 'GX-GPS-201', '巡逻车GPS-A', 'gps', 'zone-001', '友谊关巡逻区', 22.0155, 106.7575, 'online', NOW()),
('dev-302', 'GX-GPS-101', '巡逻车GPS-B', 'gps', 'zone-002', '东兴巡逻区', 21.5420, 107.9710, 'online', NOW()),
('dev-303', 'GX-GPS-301', '单兵GPS-A', 'gps', 'zone-003', '水口巡逻区', 22.4865, 106.6720, 'online', NOW());

-- =============================================
-- 设备数据 (气味传感器)
-- =============================================
INSERT INTO devices (id, device_id, name, type, zone_id, location, latitude, longitude, sensitivity, manufacturer, model, firmware_version, status, last_heartbeat) VALUES
('dev-401', 'GX-SMELL-201', '凭祥气味传感器A', 'smell', 'zone-001', '友谊关货场', 22.0220, 106.7495, 65, '杭州慧控', 'HK-EA-200', 'V1.8.0', 'online', NOW()),
('dev-402', 'GX-SMELL-101', '东兴气味传感器A', 'smell', 'zone-002', '北仑河边', 21.5395, 107.9665, 62, '杭州慧控', 'HK-EA-200', 'V1.8.0', 'warning', NOW()),
('dev-403', 'GX-SMELL-301', '水口气味传感器A', 'smell', 'zone-003', '水口码头', 22.4855, 106.6740, 60, '杭州慧控', 'HK-EA-200', 'V1.8.0', 'online', NOW());

-- =============================================
-- 设备数据 (水质传感器)
-- =============================================
INSERT INTO devices (id, device_id, name, type, zone_id, location, latitude, longitude, sensitivity, manufacturer, model, firmware_version, status, last_heartbeat) VALUES
('dev-501', 'GX-WATER-301', '水口水质监测站', 'water', 'zone-003', '水口河段', 22.4840, 106.6760, 70, '南京鸿计', 'NJ-HJ-WMS', 'V3.1.0', 'online', NOW()),
('dev-502', 'GX-WATER-401', '岳圩水质监测点', 'water', 'zone-004', '岳圩河段', 23.1330, 106.4190, 68, '南京鸿计', 'NJ-HJ-WMS', 'V3.1.0', 'online', NOW()),
('dev-503', 'GX-WATER-501', '那坡水质监测点', 'water', 'zone-005', '那坡河段', 23.4250, 105.8310, 72, '南京鸿计', 'NJ-HJ-WMS', 'V3.1.0', 'online', NOW());

-- =============================================
-- 巡逻路线数据
-- =============================================
INSERT INTO zones (id, name, code, risk_level, description) VALUES
('route-001', '友谊关A线', 'PXYYG-A', 'high', '友谊关主通道-货场-北侧围网巡逻线，全长约2.5公里'),
('route-002', '友谊关B线', 'PXYYG-B', 'high', '友谊关南侧-口岸限定区巡逻线，全长约1.8公里'),
('route-003', '东兴A线', 'DXKK-A', 'high', '北仑河畔-东兴口岸巡逻线，全长约2公里'),
('route-004', '水口A线', 'LZSK-A', 'medium', '水口大桥-码头巡逻线，全长约1.5公里'),
('route-005', '岳圩A线', 'JXYW-A', 'medium', '岳圩主道-边境线巡逻线，全长约3公里');

COMMIT;
