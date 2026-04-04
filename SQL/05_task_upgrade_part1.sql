-- ============================================
-- 热眼擒枭 - 任务模块数据库升级脚本（第2部分）
-- ============================================
-- 版本: 1.1.0
-- 升级日期: 2026-03-14
-- 说明: 创建新表和存储过程
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 创建任务位置轨迹表 (task_locations)
-- ============================================

DROP TABLE IF EXISTS task_locations;
CREATE TABLE task_locations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '轨迹ID',
  task_id INT NOT NULL COMMENT '任务ID',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  accuracy DECIMAL(8, 2) COMMENT '定位精度（米）',
  altitude DECIMAL(8, 2) COMMENT '海拔（米）',
  speed DECIMAL(8, 2) COMMENT '速度（米/秒）',
  heading DECIMAL(5, 2) COMMENT '方向（度）',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  INDEX idx_task_id (task_id),
  INDEX idx_recorded_at (recorded_at),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务位置轨迹表';

-- ============================================
-- 2. 创建任务采样记录表 (task_samples)
-- ============================================

DROP TABLE IF EXISTS task_samples;
CREATE TABLE task_samples (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '采样ID',
  task_id INT NOT NULL COMMENT '任务ID',
  sample_code VARCHAR(50) NOT NULL UNIQUE COMMENT '采样编号',
  sample_type ENUM('water', 'air', 'soil', 'waste') NOT NULL COMMENT '采样类型',
  sample_name VARCHAR(100) COMMENT '样品名称',
  sample_location VARCHAR(255) COMMENT '采样位置',
  latitude DECIMAL(10, 8) COMMENT '采样纬度',
  longitude DECIMAL(11, 8) COMMENT '采样经度',
  sample_time DATETIME NOT NULL COMMENT '采样时间',
  sampler_name VARCHAR(50) COMMENT '采样人姓名',
  sampler_badge VARCHAR(50) COMMENT '采样人警号',
  container_type VARCHAR(50) COMMENT '容器类型',
  preservation_method VARCHAR(100) COMMENT '保存方法',
  temperature DECIMAL(5, 2) COMMENT '采样时温度',
  weather VARCHAR(50) COMMENT '天气情况',
  notes TEXT COMMENT '备注',
  lab_result TEXT COMMENT '实验室检测结果',
  lab_result_time DATETIME COMMENT '检测结果时间',
  is_qualified BOOLEAN COMMENT '是否合格',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_task_id (task_id),
  INDEX idx_sample_code (sample_code),
  INDEX idx_sample_type (sample_type),
  INDEX idx_sample_time (sample_time),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务采样记录表';

-- ============================================
-- 3. 创建任务时间轴表 (task_timeline)
-- ============================================

DROP TABLE IF EXISTS task_timeline;
CREATE TABLE task_timeline (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '时间轴ID',
  task_id INT NOT NULL COMMENT '任务ID',
  event_type ENUM('created', 'assigned', 'started', 'location_updated', 'evidence_added', 'checklist_updated', 'sample_taken', 'completed', 'cancelled') NOT NULL COMMENT '事件类型',
  event_title VARCHAR(200) NOT NULL COMMENT '事件标题',
  event_description TEXT COMMENT '事件描述',
  user_id INT COMMENT '操作用户ID',
  user_name VARCHAR(50) COMMENT '操作用户姓名',
  latitude DECIMAL(10, 8) COMMENT '事件发生纬度',
  longitude DECIMAL(11, 8) COMMENT '事件发生经度',
  metadata JSON COMMENT '元数据',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_task_id (task_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务时间轴表';

-- ============================================
-- 4. 创建离线数据队列表 (offline_queue)
-- ============================================

DROP TABLE IF EXISTS offline_queue;
CREATE TABLE offline_queue (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '队列ID',
  user_id INT NOT NULL COMMENT '用户ID',
  task_id INT COMMENT '任务ID',
  action_type ENUM('evidence', 'checklist', 'sample', 'location', 'other') NOT NULL COMMENT '操作类型',
  action_data JSON NOT NULL COMMENT '操作数据',
  status ENUM('pending', 'syncing', 'synced', 'failed') DEFAULT 'pending' COMMENT '同步状态',
  retry_count INT DEFAULT 0 COMMENT '重试次数',
  error_message TEXT COMMENT '错误信息',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  synced_at DATETIME COMMENT '同步时间',
  INDEX idx_user_id (user_id),
  INDEX idx_task_id (task_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='离线数据队列表';

-- ============================================
-- 5. 创建视图 - 任务详情视图
-- ============================================

CREATE OR REPLACE VIEW v_task_details AS
SELECT 
  t.id,
  t.case_number,
  t.title,
  t.description,
  t.type,
  t.status,
  t.priority,
  t.legal_basis,
  t.penalty_suggestion,
  t.location,
  t.latitude,
  t.longitude,
  t.progress,
  t.sample_code,
  t.sample_type,
  t.sample_count,
  t.photo_count,
  t.video_count,
  t.audio_count,
  t.start_time,
  t.end_time,
  t.deadline,
  t.estimated_duration,
  t.actual_duration,
  t.created_at,
  t.updated_at,
  u.name AS assigned_user_name,
  u.badge_number AS assigned_user_badge,
  u.department AS assigned_user_department,
  a.title AS alert_title,
  a.level AS alert_level,
  a.risk_score AS alert_risk_score
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN alerts a ON t.alert_id = a.id;

-- ============================================
-- 数据库升级第1部分完成
-- ============================================
SELECT 'Part 1: Tasks table fields added successfully!' AS message;
