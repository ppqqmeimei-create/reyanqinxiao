-- ============================================
-- 热眼擒枭 - GIS 态势界面数据库升级脚本
-- 版本: 1.1.0  创建日期: 2026-03-14
-- 新增: pollution_sources表、task_locations表、空间索引优化
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 污染源企业表 (pollution_sources)
--    替换前端硬编码假数据，实现动态管理
-- ============================================
CREATE TABLE IF NOT EXISTS pollution_sources (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '污染源ID',
  name VARCHAR(200) NOT NULL COMMENT '企业/污染源名称',
  type ENUM('water-pollution','air-pollution','soil-pollution','waste-pollution') NOT NULL COMMENT '污染类型',
  status ENUM('critical','warning','normal') DEFAULT 'warning' COMMENT '当前状态',
  risk_level ENUM('low','medium','high','critical') DEFAULT 'medium' COMMENT '风险等级',
  risk_score INT DEFAULT 0 COMMENT '风险评分(0-100)',
  latitude DECIMAL(10,8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11,8) NOT NULL COMMENT '经度',
  address VARCHAR(500) COMMENT '详细地址',
  region VARCHAR(100) COMMENT '所属区域',
  pollutant_type VARCHAR(100) COMMENT '主要污染物类型',
  pollutant_value DECIMAL(12,4) COMMENT '实测浓度',
  standard_value DECIMAL(12,4) COMMENT '标准限值',
  unit VARCHAR(30) COMMENT '计量单位(mg/L, μg/m³等)',
  exceed_ratio DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN standard_value > 0 THEN ROUND(pollutant_value / standard_value, 2) ELSE NULL END
  ) STORED COMMENT '超标倍数（自动计算）',
  legal_basis TEXT COMMENT '适用法律条款',
  license_number VARCHAR(100) COMMENT '排污许可证号',
  legal_representative VARCHAR(50) COMMENT '法定代表人',
  contact_phone VARCHAR(20) COMMENT '联系电话',
  last_inspection_date DATE COMMENT '最后检查日期',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_risk_level (risk_level),
  INDEX idx_risk_score (risk_score),
  INDEX idx_location (latitude, longitude),
  CHECK (risk_score >= 0 AND risk_score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='污染源企业表';

-- ============================================
-- 2. 任务位置轨迹表 (task_locations)
--    记录执法人员巡逻轨迹，支持GIS回放
-- ============================================
CREATE TABLE IF NOT EXISTS task_locations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '轨迹点ID',
  task_id INT NOT NULL COMMENT '关联任务ID',
  user_id INT COMMENT '上报用户ID',
  latitude DECIMAL(10,8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11,8) NOT NULL COMMENT '经度',
  accuracy DECIMAL(8,2) COMMENT 'GPS精度(米)',
  altitude DECIMAL(8,2) COMMENT '海拔(米)',
  speed DECIMAL(6,2) COMMENT '速度(m/s)',
  heading DECIMAL(6,2) COMMENT '方位角(度)',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_recorded_at (recorded_at),
  INDEX idx_location (latitude, longitude),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务位置轨迹表';

-- ============================================
-- 3. alerts 表补充字段
--    添加法律依据、处罚建议、案件编号
-- ============================================
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS case_number VARCHAR(50) UNIQUE COMMENT '案件编号(ENV-YYYY-NNNNNN)',
  ADD COLUMN IF NOT EXISTS legal_basis TEXT COMMENT '法律依据',
  ADD COLUMN IF NOT EXISTS penalty_suggestion TEXT COMMENT '处罚建议';

-- ============================================
-- 4. tasks 表补充字段
--    添加案件编号、法律依据、采样信息
-- ============================================
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS case_number VARCHAR(50) COMMENT '关联案件编号',
  ADD COLUMN IF NOT EXISTS legal_basis TEXT COMMENT '法律依据',
  ADD COLUMN IF NOT EXISTS sample_code VARCHAR(50) COMMENT '采样编号',
  ADD COLUMN IF NOT EXISTS sample_type ENUM('water','air','soil','waste') COMMENT '采样类型';

-- ============================================
-- 5. 插入污染源测试数据（20条，覆盖全国主要工业区）
-- ============================================
INSERT IGNORE INTO pollution_sources
  (id, name, type, status, risk_level, risk_score, latitude, longitude, region,
   pollutant_type, pollutant_value, standard_value, unit, legal_basis)
VALUES
  (1,  '北京东兴沿海便道可疑中转点排污口',  'water-pollution', 'critical','high',   92, 39.90420000, 116.40740000, '华北', '重金属',   2.5,  1.0,  'mg/L',   '《水污染防治法》第83条'),
  (2,  '天津凭祥口岸高风险货车线索点',       'air-pollution',   'critical','high',   88, 39.14220000, 117.17670000, '华北', 'PM2.5',   150.0, 75.0, 'μg/m³', '《大气污染防治法》第99条'),
  (3,  '石家庄某水泥厂',     'air-pollution',   'warning', 'medium', 72, 38.04280000, 114.51490000, '华北', 'PM10',    200.0,150.0, 'μg/m³', '《大气污染防治法》第117条'),
  (4,  '沈阳某重工业园',     'air-pollution',   'critical','high',   85, 41.80570000, 123.43280000, '东北', 'SO2',     180.0, 80.0, 'μg/m³', '《大气污染防治法》第99条'),
  (5,  '哈尔滨凭祥某制药企业',     'water-pollution', 'warning', 'medium', 65, 45.75600000, 126.64250000, '东北', 'COD',     180.0,100.0, 'mg/L',   '《水污染防治法》第74条'),
  (6,  '上海某化工园区',     'water-pollution', 'warning', 'medium', 70, 31.23040000, 121.47370000, '华东', '氨氮',     25.0, 15.0, 'mg/L',   '《水污染防治法》第74条'),
  (7,  '南京某垃圾填埋场',   'waste-pollution', 'critical','high',   90, 32.06030000, 118.79690000, '华东', '渗滤液',    3.2,  1.0, 'mg/L',   '《固体废物污染环境防治法》第102条'),
  (8,  '杭州某印染厂',       'water-pollution', 'warning', 'medium', 68, 30.27410000, 120.15510000, '华东', 'COD',     160.0,100.0, 'mg/L',   '《水污染防治法》第74条'),
  (9,  '合肥某化肥厂',       'soil-pollution',  'warning', 'medium', 60, 31.86390000, 117.28080000, '华东', '氮磷钾',    1.5,  1.0, 'mg/kg',  '《土壤污染防治法》第86条'),
  (10, '武汉凭祥口岸高风险货车线索点',       'air-pollution',   'warning', 'medium', 67, 30.59280000, 114.30550000, '华中', 'PM2.5',   120.0, 75.0, 'μg/m³', '《大气污染防治法》第117条'),
  (11, '长沙那坡边境可疑仓储点',       'soil-pollution',  'warning', 'medium', 62, 28.22820000, 112.93880000, '华中', '有机磷',    0.8,  0.5, 'mg/kg',  '《土壤污染防治法》第86条'),
  (12, '广州防城港物流园可疑中转点',       'air-pollution',   'warning', 'medium', 66, 23.12910000, 113.26440000, '华南', 'VOCs',     85.0, 50.0, 'mg/m³',  '《大气污染防治法》第117条'),
  (13, '深圳某电镀厂',       'water-pollution', 'warning', 'medium', 69, 22.54310000, 114.05790000, '华南', '重金属',    1.8,  1.0, 'mg/L',   '《水污染防治法》第74条'),
  (14, '南宁某危废处理站',   'waste-pollution', 'warning', 'medium', 64, 22.81700000, 108.36650000, '华南', '危险化学品',1.8,  1.0, 'mg/L',   '《固体废物污染环境防治法》第102条'),
  (15, '成都某造纸厂',       'water-pollution', 'warning', 'medium', 63, 30.57280000, 104.06680000, '西南', 'COD',     150.0,100.0, 'mg/L',   '《水污染防治法》第74条'),
  (16, '重庆某化工园区',     'air-pollution',   'critical','high',   83, 29.56300000, 106.55160000, '西南', 'SO2',     140.0, 80.0, 'μg/m³', '《大气污染防治法》第99条'),
  (17, '西安某燃煤电厂',     'air-pollution',   'warning', 'medium', 71, 34.34160000, 108.93980000, '西北', 'PM10',    180.0,150.0, 'μg/m³', '《大气污染防治法》第117条'),
  (18, '西宁东兴沿海便道可疑中转点',       'soil-pollution',  'warning', 'medium', 58, 36.61710000, 101.77820000, '西北', '重金属',    1.2,  0.8, 'mg/kg',  '《土壤污染防治法》第86条'),
  (19, '青岛某化工园区',     'water-pollution', 'critical','high',   87, 36.06710000, 120.38260000, '沿海', '石油类',    2.8,  1.0, 'mg/L',   '《水污染防治法》第83条'),
  (20, '宁波某石化厂',       'air-pollution',   'warning', 'medium', 69, 29.86830000, 121.54400000, '沿海', 'VOCs',     95.0, 50.0, 'mg/m³',  '《大气污染防治法》第117条')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================
-- 6. 验证
-- ============================================
SELECT '污染源数量' AS 统计项, COUNT(*) AS 数量 FROM pollution_sources
UNION ALL
SELECT '轨迹表是否存在', COUNT(*) FROM information_schema.tables
  WHERE table_schema='reyanjingxiao' AND table_name='task_locations';
