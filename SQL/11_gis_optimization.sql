-- ============================================
-- 热眼擒枭项目 - 态势界面数据库优化脚本
-- 创建食品药品和执法相关表
-- ============================================

-- 1. 创建食品药品企业表
CREATE TABLE IF NOT EXISTS food_drug_enterprises (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '企业ID',
  name VARCHAR(255) NOT NULL COMMENT '企业名称',
  type ENUM('food', 'drug', 'cosmetic') NOT NULL COMMENT '类型',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  address VARCHAR(500) COMMENT '地址',
  risk_level VARCHAR(50) COMMENT '风险等级',
  status VARCHAR(50) DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_risk_level (risk_level),
  INDEX idx_status (status),
  SPATIAL INDEX idx_location (POINT(latitude, longitude))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='食品药品企业表';

-- 2. 创建食品药品预警表
CREATE TABLE IF NOT EXISTS food_drug_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预警ID',
  enterprise_id INT COMMENT '企业ID',
  alert_type VARCHAR(50) NOT NULL COMMENT '预警类型',
  risk_level VARCHAR(50) NOT NULL COMMENT '风险等级',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  description TEXT COMMENT '描述',
  status VARCHAR(50) DEFAULT 'pending' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_risk_level (risk_level),
  INDEX idx_status (status),
  INDEX idx_alert_type (alert_type),
  SPATIAL INDEX idx_location (POINT(latitude, longitude))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='食品药品预警表';

-- 3. 创建执法人员表
CREATE TABLE IF NOT EXISTS enforcement_officers (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '人员ID',
  name VARCHAR(255) NOT NULL COMMENT '姓名',
  badge_number VARCHAR(50) UNIQUE COMMENT '警号',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  status VARCHAR(50) DEFAULT 'on_duty' COMMENT '状态',
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  SPATIAL INDEX idx_location (POINT(latitude, longitude))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='执法人员表';

-- 4. 创建巡逻路线表
CREATE TABLE IF NOT EXISTS patrol_routes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '路线ID',
  officer_id INT NOT NULL COMMENT '执法人员ID',
  route_data JSON NOT NULL COMMENT '路线数据',
  status VARCHAR(50) DEFAULT 'active' COMMENT '状态',
  distance DECIMAL(10, 2) COMMENT '巡逻距离(km)',
  duration INT COMMENT '巡逻时长(分钟)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (officer_id) REFERENCES enforcement_officers(id),
  INDEX idx_status (status),
  INDEX idx_officer_id (officer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='巡逻路线表';

-- 5. 创建执法案件表
CREATE TABLE IF NOT EXISTS enforcement_cases (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '案件ID',
  title VARCHAR(255) NOT NULL COMMENT '案件标题',
  description TEXT COMMENT '案件描述',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  officer_id INT COMMENT '负责人员ID',
  status VARCHAR(50) DEFAULT 'open' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (officer_id) REFERENCES enforcement_officers(id),
  INDEX idx_status (status),
  INDEX idx_officer_id (officer_id),
  SPATIAL INDEX idx_location (POINT(latitude, longitude))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='执法案件表';

-- 6. 添加地理索引到现有表
ALTER TABLE alerts ADD SPATIAL INDEX IF NOT EXISTS idx_location (POINT(latitude, longitude));
ALTER TABLE devices ADD SPATIAL INDEX IF NOT EXISTS idx_location (POINT(latitude, longitude));

-- 7. 插入测试数据 - 食品药品企业
INSERT INTO food_drug_enterprises (name, type, latitude, longitude, address, risk_level, status) VALUES
('北京南宁某乳制品企业', 'food', 39.9042, 116.4074, '北京市朝阳区', 'low', 'active'),
('上海凭祥某制药企业', 'drug', 31.2304, 121.4737, '上海市浦东新区', 'medium', 'active'),
('深圳北海某化妆品企业', 'cosmetic', 22.5431, 114.0579, '深圳市南山区', 'high', 'active'),
('杭州东兴某食品企业', 'food', 30.2741, 120.1551, '杭州市西湖区', 'low', 'active'),
('成都钦州某医药物流企业', 'drug', 30.5728, 104.0668, '成都市武侯区', 'medium', 'active');

-- 8. 插入测试数据 - 执法人员
INSERT INTO enforcement_officers (name, badge_number, latitude, longitude, status) VALUES
('张三', '001', 39.9042, 116.4074, 'on_duty'),
('李四', '002', 39.9100, 116.4100, 'on_duty'),
('王五', '003', 39.9200, 116.4200, 'off_duty'),
('赵六', '004', 39.9300, 116.4300, 'on_duty'),
('孙七', '005', 39.9400, 116.4400, 'on_duty');

-- 9. 插入测试数据 - 巡逻路线
INSERT INTO patrol_routes (officer_id, route_data, status, distance, duration) VALUES
(1, '[{"latitude": 39.9042, "longitude": 116.4074}, {"latitude": 39.9100, "longitude": 116.4100}]', 'active', 5.2, 30),
(2, '[{"latitude": 39.9100, "longitude": 116.4100}, {"latitude": 39.9200, "longitude": 116.4200}]', 'active', 6.8, 40),
(4, '[{"latitude": 39.9300, "longitude": 116.4300}, {"latitude": 39.9400, "longitude": 116.4400}]', 'active', 4.5, 25);

-- 10. 插入测试数据 - 执法案件
INSERT INTO enforcement_cases (title, description, latitude, longitude, officer_id, status) VALUES
('某企业污染排放', '检测到超标排放', 39.9042, 116.4074, 1, 'open'),
('食品安全隐患', '发现不合格产品', 39.9100, 116.4100, 2, 'investigating'),
('环境污染投诉', '群众举报污染', 39.9200, 116.4200, 3, 'closed');

-- 完成
COMMIT;
