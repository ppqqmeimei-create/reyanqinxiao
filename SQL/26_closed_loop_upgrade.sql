-- ============================================
-- 热眼擒枭 - 闭环能力升级脚本（走私活物 + 环境监测）
-- 版本: 26
-- 目标: 构建“感知-预警-处置-取证-研判”统一事件流
-- ============================================

USE reyanjingxiao;

-- 1) 预警表补充闭环字段（兼容旧结构）
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS scene ENUM('enforcement', 'ecology', 'fooddrug') DEFAULT 'ecology' COMMENT '业务场景' AFTER category,
  ADD COLUMN IF NOT EXISTS stage ENUM('sensing', 'prewarning', 'disposal', 'evidence', 'research', 'closed') DEFAULT 'prewarning' COMMENT '闭环阶段' AFTER scene,
  ADD COLUMN IF NOT EXISTS species_type VARCHAR(100) COMMENT '疑似活体物种类型' AFTER pollutant_type,
  ADD COLUMN IF NOT EXISTS target_type ENUM('person', 'vehicle', 'animal', 'goods', 'unknown') DEFAULT 'unknown' COMMENT '目标类型' AFTER species_type,
  ADD COLUMN IF NOT EXISTS border_section VARCHAR(100) COMMENT '边境战区（东兴/凭祥/龙州/靖西/那坡）' AFTER location,
  ADD COLUMN IF NOT EXISTS border_marker_id VARCHAR(50) COMMENT '界碑编号' AFTER border_section,
  ADD COLUMN IF NOT EXISTS legal_basis TEXT COMMENT '法律依据' AFTER resolution_notes,
  ADD COLUMN IF NOT EXISTS penalty_suggestion TEXT COMMENT '处罚建议' AFTER legal_basis;

CREATE INDEX IF NOT EXISTS idx_alert_scene_stage ON alerts(scene, stage);
CREATE INDEX IF NOT EXISTS idx_alert_border_section ON alerts(border_section);

-- 2) 新增闭环事件表（统一串联五环节）
CREATE TABLE IF NOT EXISTS fusion_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '闭环事件ID',
  alert_id INT NULL COMMENT '关联预警ID',
  task_id INT NULL COMMENT '关联任务ID',
  scene ENUM('enforcement', 'ecology', 'fooddrug') NOT NULL COMMENT '业务场景',
  stage ENUM('sensing', 'prewarning', 'disposal', 'evidence', 'research', 'closed') NOT NULL COMMENT '闭环阶段',
  event_title VARCHAR(200) NOT NULL COMMENT '事件标题',
  event_desc TEXT COMMENT '事件描述',
  level ENUM('critical', 'warning', 'info') DEFAULT 'warning' COMMENT '风险级别',
  status ENUM('pending', 'processing', 'resolved', 'ignored') DEFAULT 'pending' COMMENT '状态',
  location VARCHAR(255) NOT NULL COMMENT '位置',
  latitude DECIMAL(10,8) NULL COMMENT '纬度',
  longitude DECIMAL(11,8) NULL COMMENT '经度',
  border_section VARCHAR(100) NULL COMMENT '边境战区',
  species_type VARCHAR(100) NULL COMMENT '疑似物种',
  target_type ENUM('person', 'vehicle', 'animal', 'goods', 'unknown') DEFAULT 'unknown' COMMENT '目标类型',
  risk_score INT DEFAULT 0 COMMENT '风险评分',
  source VARCHAR(100) NULL COMMENT '来源设备/来源渠道',
  payload JSON NULL COMMENT '扩展载荷',
  created_by INT NULL COMMENT '创建人',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_scene_stage_created (scene, stage, created_at),
  INDEX idx_event_level_status (level, status),
  INDEX idx_event_location (latitude, longitude),
  CONSTRAINT fk_fusion_event_alert FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL,
  CONSTRAINT fk_fusion_event_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  CONSTRAINT fk_fusion_event_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_fusion_risk_score CHECK (risk_score >= 0 AND risk_score <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='闭环事件流';

-- 3) 示例数据：边境活物走私 + 环境监测协同
INSERT INTO fusion_events (
  scene, stage, event_title, event_desc, level, status, location, latitude, longitude,
  border_section, species_type, target_type, risk_score, source, payload
) VALUES
('enforcement', 'prewarning', '友谊关红外触发疑似穿山甲转运', '红外+震动双源触发，疑似活体转运', 'critical', 'pending', '凭祥市友谊关口岸北侧便道', 22.11280000, 106.76120000, '凭祥段', '穿山甲', 'animal', 96, 'infrared-camera', JSON_OBJECT('device_count', 2, 'confidence', 0.93)),
('enforcement', 'disposal', '东兴卡口疑似食蟹猴走私车辆拦截', '卡口抓拍+车牌识别异常，已下发联合查缉', 'warning', 'processing', '东兴万尾金滩卡口', 21.53180000, 108.03250000, '东兴段', '食蟹猴', 'vehicle', 88, 'checkpoint-camera', JSON_OBJECT('plate', '桂A****8', 'officers', 5)),
('ecology', 'prewarning', '那坡边境河段氨氮异常升高', '边境河流水质异常波动，疑似非法排放', 'warning', 'pending', '那坡界河监测点-03', 23.42450000, 105.83360000, '那坡段', NULL, 'unknown', 79, 'water-monitor', JSON_OBJECT('pollutant', '氨氮', 'value', 1.8, 'standard', 1.0));

-- ============================================
-- 升级完成
-- ============================================
