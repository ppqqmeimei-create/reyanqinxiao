-- ============================================
-- 热眼擒枭——广西边境核心数据模型升级
-- 脚本版本: 3.0.0
-- 日期: 2026-03-24
-- 内容: alerts扩展字段 + locations表 + 广西种子数据
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 扩展预警表 alerts：新增三个广西边境字段
-- ============================================

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS border_marker_id VARCHAR(20)
    COMMENT '界碑编号（格式：11xx，如1127、1154）'
    AFTER longitude,
  ADD COLUMN IF NOT EXISTS species_type VARCHAR(100)
    COMMENT '疑似物种类型（走私防控专用）'
    AFTER border_marker_id,
  ADD COLUMN IF NOT EXISTS risk_level ENUM(
    'extreme',   -- 极高风险（>=90分）
    'high',      -- 高风险（70-89分）
    'medium',    -- 中等风险（50-69分）
    'low'        -- 低风险（<50分）
  ) DEFAULT 'low'
    COMMENT '综合风险等级（由算法自动计算写入）'
    AFTER species_type;

ALTER TABLE alerts
  ADD INDEX IF NOT EXISTS idx_border_marker (border_marker_id),
  ADD INDEX IF NOT EXISTS idx_species_type  (species_type),
  ADD INDEX IF NOT EXISTS idx_risk_level    (risk_level);

-- ============================================
-- 2. 创建广西边境点位表 locations
-- ============================================

CREATE TABLE IF NOT EXISTS locations (
  id              INT AUTO_INCREMENT PRIMARY KEY COMMENT '点位ID',
  name            VARCHAR(200) NOT NULL            COMMENT '点位名称',
  location_type   ENUM(
    'border_marker',
    'checkpoint',
    'joint_duty_point',
    'infrared_sentry',
    'patrol_base',
    'hotspot'
  ) NOT NULL                                       COMMENT '点位类型',
  border_section  VARCHAR(50)                      COMMENT '所属边境段',
  border_marker_id VARCHAR(20)                     COMMENT '关联界碑编号',
  latitude        DECIMAL(10,8) NOT NULL            COMMENT '纬度',
  longitude       DECIMAL(11,8) NOT NULL            COMMENT '经度',
  altitude        DECIMAL(8,2)                      COMMENT '海拔(m)',
  law_enforcement_unit VARCHAR(100)                 COMMENT '管辖单位',
  device_count    INT DEFAULT 0                     COMMENT '部署设备数量',
  device_types    VARCHAR(500)                      COMMENT '设备类型清单（JSON）',
  historical_case_count INT DEFAULT 0              COMMENT '历史走私案件数',
  hotspot_level   TINYINT DEFAULT 0                 COMMENT '走私热点等级（0-5）',
  is_active       BOOLEAN DEFAULT TRUE              COMMENT '是否激活',
  notes           TEXT                              COMMENT '备注',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_location_type    (location_type),
  INDEX idx_border_section   (border_section),
  INDEX idx_border_marker_id (border_marker_id),
  INDEX idx_coordinates      (latitude, longitude),
  INDEX idx_hotspot_level    (hotspot_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='广西边境点位表（界碑/口岸/执勤点/监控哨）';

-- ============================================
-- 3. 广西边境点位种子数据
-- ============================================

INSERT IGNORE INTO locations (
  name, location_type, border_section, border_marker_id,
  latitude, longitude, altitude,
  law_enforcement_unit, device_count, device_types,
  historical_case_count, hotspot_level, notes
) VALUES
('中越边境1127号界碑', 'border_marker', '东兴段', '1127',
  21.5318, 108.0325, 12.5,
  '广西壮族自治区环境资源和食品药品侦查总队东兴边境支队', 3,
  '["infrared-camera","fiber-vibration","checkpoint-camera"]',
  7, 5, '东兴万尾金滩入海口附近，走私频发，重点布控'),
('中越边境1154号界碑', 'border_marker', '凭祥段', '1154',
  22.1128, 106.7612, 186.0,
  '广西壮族自治区环境资源和食品药品侦查总队凭祥边境支队', 4,
  '["infrared-camera","checkpoint-camera","life-radar","fiber-vibration"]',
  10, 5, '友谊关口岸附近，穿山甲、灵长类走私高发'),
('中越边境1168号界碑', 'border_marker', '龙州段', '1168',
  22.4868, 106.6719, 142.0,
  '广西壮族自治区环境资源和食品药品侦查总队龙州边境支队', 2,
  '["life-radar","fiber-vibration"]',
  5, 3, '水口口岸附近，活体走私时有发生'),
('中越边境1176号界碑', 'border_marker', '靖西段', '1176',
  23.1340, 106.4170, 631.0,
  '广西壮族自治区环境资源和食品药品侦查总队靖西边境支队', 2,
  '["infrared-camera","fiber-vibration"]',
  3, 2, '岳圩口岸附近'),
('中越边境1189号界碑', 'border_marker', '那坡段', '1189',
  23.4245, 105.8336, 892.0,
  '广西壮族自治区环境资源和食品药品侦查总队那坡边境支队', 2,
  '["infrared-camera","fiber-vibration"]',
  5, 4, '那坡山地密林，遮蔽度高，走私隐蔽性强'),
('东兴口岸', 'checkpoint', '东兴段', '1127',
  21.5450, 107.9720, 8.0,
  '广西壮族自治区环境资源和食品药品侦查总队东兴边境支队', 5,
  '["checkpoint-camera","infrared-camera","life-radar","drone","gps-tracker"]',
  12, 5, '广西最大海陆联运口岸，食蟹猴走私高发节点'),
('凭祥友谊关口岸', 'checkpoint', '凭祥段', '1154',
  22.1080, 106.7620, 182.0,
  '广西壮族自治区环境资源和食品药品侦查总队凭祥边境支队', 6,
  '["checkpoint-camera","infrared-camera","life-radar","drone","gps-tracker","fiber-vibration"]',
  15, 5, '中越陆路最重要口岸，穿山甲、象牙走私重点'),
('龙州水口口岸', 'checkpoint', '龙州段', '1168',
  22.4868, 106.6719, 138.0,
  '广西壮族自治区环境资源和食品药品侦查总队龙州边境支队', 3,
  '["checkpoint-camera","life-radar","gps-tracker"]',
  6, 3, '龙州水口边境贸易口岸'),
('那坡平孟口岸', 'checkpoint', '那坡段', '1189',
  23.4200, 105.8400, 876.0,
  '广西壮族自治区环境资源和食品药品侦查总队那坡边境支队', 2,
  '["checkpoint-camera","infrared-camera"]',
  4, 3, '那坡高山口岸，名贵木材走私时有发生'),
('东兴口岸环食药联合执勤点', 'joint_duty_point', '东兴段', '1127',
  21.5380, 107.9650, 9.0,
  '广西壮族自治区环境资源和食品药品侦查总队东兴边境支队', 0, '[]', 0, 5,
  '在岗6人，24小时联合值守'),
('凭祥浦寨环食药联合执勤点', 'joint_duty_point', '凭祥段', '1154',
  22.1080, 106.7620, 180.0,
  '广西壮族自治区环境资源和食品药品侦查总队凭祥边境支队', 0, '[]', 0, 5,
  '在岗8人，凭祥浦寨边贸区常驻执勤'),
('友谊关环食药联合执勤点', 'joint_duty_point', '凭祥段', '1154',
  22.0150, 106.7580, 176.0,
  '广西壮族自治区环境资源和食品药品侦查总队凭祥边境支队', 0, '[]', 0, 5,
  '在岗10人，国家一类口岸重点值守'),
('龙州水口环食药联合执勤点', 'joint_duty_point', '龙州段', '1168',
  22.4868, 106.6719, 135.0,
  '广西壮族自治区环境资源和食品药品侦查总队龙州边境支队', 0, '[]', 0, 3,
  '在岗5人'),
('那坡边境环食药联合执勤点', 'joint_duty_point', '那坡段', '1189',
  23.4245, 105.8336, 880.0,
  '广西壮族自治区环境资源和食品药品侦查总队那坡边境支队', 0, '[]', 0, 4,
  '在岗4人，高山密林执勤条件艰苦'),
('东兴口岸北侧红外热成像监控哨', 'infrared_sentry', '东兴段', '1127',
  21.5450, 107.9720, 15.0,
  '广西壮族自治区环境资源和食品药品侦查总队东兴边境支队', 1,
  '["infrared-camera"]', 12, 5, '今日触发3次'),
('友谊关口岸红外热成像监控哨', 'infrared_sentry', '凭祥段', '1154',
  22.1128, 106.7612, 190.0,
  '广西壮族自治区环境资源和食品药品侦查总队凭祥边境支队', 1,
  '["infrared-camera"]', 18, 5, '今日触发7次，异常频繁'),
('龙州水口红外热成像监控哨', 'infrared_sentry', '龙州段', '1168',
  22.4920, 106.6800, 148.0,
  '广西壮族自治区环境资源和食品药品侦查总队龙州边境支队', 1,
  '["infrared-camera"]', 5, 3, '今日触发1次'),
('那坡界碑红外热成像监控哨', 'infrared_sentry', '那坡段', '1189',
  23.4300, 105.8400, 900.0,
  '广西壮族自治区环境资源和食品药品侦查总队那坡边境支队', 1,
  '["infrared-camera"]', 8, 4, '今日触发5次'),
('靖西岳圩红外热成像监控哨', 'infrared_sentry', '靖西段', '1176',
  23.1400, 106.4200, 645.0,
  '广西壮族自治区环境资源和食品药品侦查总队靖西边境支队', 1,
  '["infrared-camera"]', 3, 2, '今日触发2次'),
('东兴万尾金滩走私热点区域', 'hotspot', '东兴段', '1127',
  21.5318, 108.0325, 5.0,
  '广西壮族自治区环境资源和食品药品侦查总队东兴边境支队', 3,
  '["checkpoint-camera","fiber-vibration","infrared-camera"]',
  14, 5, '食蟹猴、鳄鱼、海产品走私高发，沿海入境隐蔽'),
('凭祥友谊关便道走私热点区域', 'hotspot', '凭祥段', '1154',
  22.0900, 106.7700, 175.0,
  '广西壮族自治区环境资源和食品药品侦查总队凭祥边境支队', 2,
  '["infrared-camera","fiber-vibration"]',
  11, 5, '绕开口岸检查的隐蔽便道，穿山甲、灵长类走私高发'),
('那坡密林走私热点区域', 'hotspot', '那坡段', '1189',
  23.4100, 105.8200, 870.0,
  '广西壮族自治区环境资源和食品药品侦查总队那坡边境支队', 1,
  '["fiber-vibration"]',
  7, 4, '亚热带密林遮蔽度高，名贵木材和活体走私通道');

-- ============================================
-- 4. 广西边境预警种子数据（符合实况的Mock预警）
-- ============================================

INSERT IGNORE INTO alerts (
  title, description, level, status, type, category,
  location, latitude, longitude,
  border_marker_id, species_type, risk_level,
  risk_score, source, urgency,
  species_name, protection_level, animal_count,
  legal_basis, penalty_suggestion,
  created_at
) VALUES
(
  '[防城港支队] 东兴万尾金滩疑似食蟹猴走私预警',
  '卡口摄像头抓拍到一辆厢型货车从越南方向入境，后备箱隐约可见铁笼，疑似运载食蟹猴12只，目标向北偏东15度方向行驶，建议立即拦截。',
  'critical', 'pending', 'wildlife-smuggling', 'wildlife',
  '广西防城港市东兴市万尾金滩沿海便道', 21.5318, 108.0325,
  '1127', '食蟹猴（Macaca fascicularis）', 'extreme',
  94, 'device', '立即出警',
  '食蟹猴', 'CITES附录II', 12,
  '《野生动物保护法》第二十三条；《广西壮族自治区野生动物保护条例》第二十八条',
  '立即拦截车辆，固定证据后移送刑侦，依法处货值金额五倍以上罚款',
  DATE_SUB(NOW(), INTERVAL 2 HOUR)
),
(
  '[崇左支队] 凭祥友谊关附近红外抓拍疑似穿山甲走私',
  '友谊关口岸红外热成像摄像头在夜间23:47触发活体目标预警，热成像显示3个低矮哺乳动物热源，移动特征符合穿山甲活体特征，目标向西侧越境便道移动。',
  'critical', 'pending', 'wildlife-smuggling', 'wildlife',
  '广西崇左市凭祥市友谊关口岸附近边境便道', 22.1128, 106.7612,
  '1154', '中华穿山甲（Manis pentadactyla）', 'extreme',
  96, 'device', '立即出警',
  '中华穿山甲', '国家一级', 3,
  '《野生动物保护法》第二十四条；《刑法》第三百四十一条；《广西壮族自治区野生动物保护条例》第三十二条',
  '立即布控友谊关及周边全部卡口，移送公安机关追究刑事责任，处货值金额十倍以上罚款',
  DATE_SUB(NOW(), INTERVAL 5 HOUR)
),
(
  '[崇左支队] 龙州水口口岸截获疑似非法运输名贵红木',
  '水口口岸扫描仪显示一批申报为普通木材的货物密度异常，抽检发现疑似越南黄花梨原木5立方米，市值估算超80万元，属CITES附录II保护树种。',
  'critical', 'processing', 'illegal-transport', 'wildlife',
  '广西崇左市龙州县水口口岸查验区', 22.4868, 106.6719,
  '1168', '越南黄花梨（Dalbergia tonkinensis）', 'extreme',
  89, 'device', '2小时内响应',
  '越南黄花梨', 'CITES附录II', 0,
  '《野生动物保护法》第二十三条；《广西壮族自治区野生动物保护条例》第三十四条',
  '扣押货物，立案调查，处货值金额五倍以上罚款，没收违法所得',
  DATE_SUB(NOW(), INTERVAL 8 HOUR)
),
(
  '[百色支队] 那坡1189号界碑处发现异常震动情报线索',
  '那坡界碑震动光纤传感器今日触发5次，结合情报研判，疑有走私团伙利用高山密林地形夜间过境，目标物种未知，建议启动无人机热成像复核。',
  'warning', 'processing', 'border-intrusion', 'border',
  '广西百色市那坡县中越边境1189号界碑附近密林', 23.4245, 105.8336,
  '1189', '未知活体（待核实）', 'high',
  82, 'device', '2小时内响应',
  NULL, '未知', 0,
  '《边境管理条例》第十五条；《野生动物保护法》',
  '扩大巡查半径，启用无人机热成像复核，联动那坡边境支队加密巡逻',
  DATE_SUB(NOW(), INTERVAL 12 HOUR)
),
(
  '[崇左支队] 凭祥浦寨便道疑似灵长类活体绕关走私',
  '群众举报一辆面包车傍晚从浦寨便道快速驶过，车内传出动物鸣叫声，初步研判为灵长类活体，涉案人员2人已向凭祥市区方向逃窜。',
  'critical', 'pending', 'wildlife-smuggling', 'wildlife',
  '广西崇左市凭祥市浦寨口岸附近边境便道', 22.1080, 106.7620,
  '1154', '疑似猕猴属灵长类', 'extreme',
  91, 'manual', '立即出警',
  '猕猴', '国家二级', 6,
  '《野生动物保护法》第二十三条；《广西壮族自治区野生动物保护条例》第二十八条',
  '紧急布控凭祥市区主要路口，联合公安实施围捕，没收活体并妥善安置',
  DATE_SUB(NOW(), INTERVAL 1 HOUR)
),
(
  '[防城港支队] 东兴口岸截获疑似暹罗鳄皮制品',
  '东兴口岸X光机扫描发现一批申报为皮具的货物形态异常，开箱检查发现疑似暹罗鳄皮制品约20件，暹罗鳄为CITES附录I保护物种，已移交海关联合查处。',
  'warning', 'processing', 'checkpoint-anomaly', 'wildlife',
  '广西防城港市东兴市东兴口岸查验大厅', 21.5450, 107.9720,
  '1127', '暹罗鳄皮制品（Crocodylus siamensis）', 'high',
  78, 'device', '2小时内响应',
  '暹罗鳄', 'CITES附录I', 0,
  '《海关法》第八十二条；《濒危野生动植物种国际贸易公约》；《野生动物保护法》第二十四条',
  '联合海关没收货物，处货值金额十倍以上罚款，移送检察机关',
  DATE_SUB(NOW(), INTERVAL 18 HOUR)
),
(
  '[百色支队] 靖西岳圩口岸截获疑似象牙制品情报',
  '情报显示一名越南籍男性携带象牙制品准备从岳圩口岸入境，重量约3公斤，已通知口岸布控，待查验确认。',
  'critical', 'pending', 'suspicious-vehicle', 'wildlife',
  '广西百色市靖西市岳圩口岸', 23.1340, 106.4170,
  '1176', '象牙制品（非洲象 Loxodonta africana）', 'extreme',
  93, 'manual', '立即出警',
  '非洲象象牙', 'CITES附录I', 0,
  '《野生动物保护法》第二十四条；《濒危野生动植物种国际贸易公约》；《刑法》第三百四十一条',
  '立即布控口岸所有出入通道，移送公安机关刑事立案，处货值金额十倍以上罚款',
  DATE_SUB(NOW(), INTERVAL 30 MINUTE)
);

-- ============================================
-- 5. 验证查询
-- ============================================

SELECT
  COUNT(*) AS total_locations,
  SUM(CASE WHEN location_type = 'border_marker'    THEN 1 ELSE 0 END) AS 界碑数,
  SUM(CASE WHEN location_type = 'checkpoint'       THEN 1 ELSE 0 END) AS 口岸数,
  SUM(CASE WHEN location_type = 'joint_duty_point' THEN 1 ELSE 0 END) AS 联合执勤点数,
  SUM(CASE WHEN location_type = 'infrared_sentry'  THEN 1 ELSE 0 END) AS 红外哨数,
  SUM(CASE WHEN location_type = 'hotspot'          THEN 1 ELSE 0 END) AS 热点区域数
FROM locations;

SELECT
  COUNT(*) AS 广西边境预警总数,
  SUM(CASE WHEN risk_level = 'extreme' THEN 1 ELSE 0 END) AS 极高风险,
  SUM(CASE WHEN risk_level = 'high'    THEN 1 ELSE 0 END) AS 高风险,
  SUM(CASE WHEN level = 'critical'     THEN 1 ELSE 0 END) AS 紧急预警,
  SUM(CASE WHEN status = 'pending'     THEN 1 ELSE 0 END) AS 待处置
FROM alerts
WHERE border_marker_id IS NOT NULL;

SELECT '广西边境核心数据模型升级完成 v3.0.0' AS upgrade_status;
