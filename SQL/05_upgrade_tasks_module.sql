-- ============================================
-- 热眼擒枭 - 任务模块数据库升级脚本
-- ============================================
-- 版本: 1.1.0
-- 升级日期: 2026-03-14
-- 说明: 添加生态警务专业字段
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 升级 tasks 表 - 添加生态警务字段
-- ============================================

-- 添加案件编号
ALTER TABLE tasks 
ADD COLUMN case_number VARCHAR(50) UNIQUE COMMENT '案件编号（格式：ENV-CRIT-2026-001001）' AFTER id;

-- 添加法律依据
ALTER TABLE tasks 
ADD COLUMN legal_basis TEXT COMMENT '适用法律依据' AFTER description;

-- 添加处罚建议
ALTER TABLE tasks 
ADD COLUMN penalty_suggestion TEXT COMMENT '处罚建议' AFTER legal_basis;

-- 添加采样信息
ALTER TABLE tasks 
ADD COLUMN sample_code VARCHAR(50) COMMENT '采样编号' AFTER penalty_suggestion,
ADD COLUMN sample_type ENUM('water', 'air', 'soil', 'waste') COMMENT '采样类型' AFTER sample_code,
ADD COLUMN sample_count INT DEFAULT 0 COMMENT '采样数量' AFTER sample_type;

-- 添加执法记录
ALTER TABLE tasks 
ADD COLUMN inspector_name VARCHAR(50) COMMENT '执法人员姓名' AFTER assigned_to,
ADD COLUMN inspector_badge VARCHAR(50) COMMENT '执法人员警号' AFTER inspector_name,
ADD COLUMN start_location VARCHAR(255) COMMENT '出发位置' AFTER location,
ADD COLUMN arrival_time DATETIME COMMENT '到达时间' AFTER start_time;

-- 添加证据统计
ALTER TABLE tasks 
ADD COLUMN photo_count INT DEFAULT 0 COMMENT '照片数量' AFTER evidence_count,
ADD COLUMN video_count INT DEFAULT 0 COMMENT '视频数量' AFTER photo_count,
ADD COLUMN audio_count INT DEFAULT 0 COMMENT '录音数量' AFTER video_count;

-- 添加索引
CREATE INDEX idx_case_number ON tasks(case_number);
CREATE INDEX idx_sample_code ON tasks(sample_code);
CREATE INDEX idx_inspector_badge ON tasks(inspector_badge);

-- ============================================
-- 2. 创建任务位置轨迹表
-- ============================================

DROP TABLE IF EXISTS task_locations;
CREATE TABLE task_locations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '轨迹ID',
  task_id INT NOT NULL COMMENT '任务ID',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  accuracy DECIMAL(8, 2) COMMENT '定位精度(米)',
  altitude DECIMAL(8, 2) COMMENT '海拔(米)',
  speed DECIMAL(8, 2) COMMENT '速度(m/s)',
  heading DECIMAL(5, 2) COMMENT '方向(度)',
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  INDEX idx_task_id (task_id),
  INDEX idx_recorded_at (recorded_at),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务位置轨迹表';

-- ============================================
-- 3. 升级 task_evidence 表 - 增强证据管理
-- ============================================

-- 添加更多字段
ALTER TABLE task_evidence 
ADD COLUMN file_name VARCHAR(255) COMMENT '文件名' AFTER type,
ADD COLUMN file_size BIGINT COMMENT '文件大小(字节)' AFTER file_name,
ADD COLUMN mime_type VARCHAR(100) COMMENT 'MIME类型' AFTER file_size,
ADD COLUMN latitude DECIMAL(10, 8) COMMENT '拍摄位置纬度' AFTER description,
ADD COLUMN longitude DECIMAL(11, 8) COMMENT '拍摄位置经度' AFTER latitude,
ADD COLUMN uploaded_by INT COMMENT '上传人ID' AFTER longitude,
ADD COLUMN is_synced BOOLEAN DEFAULT FALSE COMMENT '是否已同步' AFTER uploaded_by,
ADD COLUMN local_path VARCHAR(500) COMMENT '本地路径（离线）' AFTER is_synced;

-- 添加索引
CREATE INDEX idx_uploaded_by ON task_evidence(uploaded_by);
CREATE INDEX idx_is_synced ON task_evidence(is_synced);

-- 添加外键
ALTER TABLE task_evidence 
ADD FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 4. 升级 task_checklist 表 - 增强检查清单
-- ============================================

-- 添加更多字段
ALTER TABLE task_checklist 
ADD COLUMN status ENUM('pending', 'completed', 'failed', 'skipped') DEFAULT 'pending' COMMENT '状态' AFTER item,
ADD COLUMN notes TEXT COMMENT '备注' AFTER completed,
ADD COLUMN photo_url VARCHAR(500) COMMENT '检查照片' AFTER notes,
ADD COLUMN completed_by INT COMMENT '完成人ID' AFTER completed_at;

-- 修改 completed 字段为 status
-- ALTER TABLE task_checklist DROP COLUMN completed;

-- 添加索引
CREATE INDEX idx_status ON task_checklist(status);
CREATE INDEX idx_completed_by ON task_checklist(completed_by);

-- 添加外键
ALTER TABLE task_checklist 
ADD FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 5. 创建采样记录表
-- ============================================

DROP TABLE IF EXISTS task_samples;
CREATE TABLE task_samples (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '采样ID',
  task_id INT NOT NULL COMMENT '任务ID',
  sample_code VARCHAR(50) NOT NULL UNIQUE COMMENT '采样编号',
  sample_type ENUM('water', 'air', 'soil', 'waste') NOT NULL COMMENT '采样类型',
  sample_name VARCHAR(100) COMMENT '样品名称',
  location VARCHAR(255) NOT NULL COMMENT '采样位置',
  latitude DECIMAL(10, 8) COMMENT '纬度',
  longitude DECIMAL(11, 8) COMMENT '经度',
  container_type VARCHAR(50) COMMENT '容器类型',
  volume DECIMAL(10, 2) COMMENT '采样量',
  unit VARCHAR(20) COMMENT '单位',
  temperature DECIMAL(5, 2) COMMENT '采样时温度',
  weather VARCHAR(50) COMMENT '天气状况',
  description TEXT COMMENT '样品描述',
  photo_urls JSON COMMENT '采样照片URLs',
  sampled_by INT COMMENT '采样人ID',
  sampled_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '采样时间',
  submitted BOOLEAN DEFAULT FALSE COMMENT '是否已提交',
  submitted_at DATETIME COMMENT '提交时间',
  lab_received BOOLEAN DEFAULT FALSE COMMENT '实验室是否已接收',
  lab_received_at DATETIME COMMENT '实验室接收时间',
  test_result TEXT COMMENT '检测结果',
  test_completed_at DATETIME COMMENT '检测完成时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_task_id (task_id),
  INDEX idx_sample_code (sample_code),
  INDEX idx_sample_type (sample_type),
  INDEX idx_sampled_by (sampled_by),
  INDEX idx_sampled_at (sampled_at),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (sampled_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采样记录表';

-- ============================================
-- 6. 创建离线数据缓存表
-- ============================================

DROP TABLE IF EXISTS offline_cache;
CREATE TABLE offline_cache (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '缓存ID',
  user_id INT NOT NULL COMMENT '用户ID',
  task_id INT COMMENT '任务ID',
  data_type ENUM('evidence', 'checklist', 'sample', 'location', 'other') NOT NULL COMMENT '数据类型',
  data_content JSON NOT NULL COMMENT '数据内容',
  is_synced BOOLEAN DEFAULT FALSE COMMENT '是否已同步',
  synced_at DATETIME COMMENT '同步时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (user_id),
  INDEX idx_task_id (task_id),
  INDEX idx_is_synced (is_synced),
  INDEX idx_data_type (data_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='离线数据缓存表';

-- ============================================
-- 7. 创建执法记录表
-- ============================================

DROP TABLE IF EXISTS enforcement_records;
CREATE TABLE enforcement_records (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  task_id INT NOT NULL COMMENT '任务ID',
  case_number VARCHAR(50) NOT NULL COMMENT '案件编号',
  enforcement_type ENUM('inspection', 'sampling', 'penalty', 'closure', 'other') NOT NULL COMMENT '执法类型',
  legal_basis TEXT COMMENT '法律依据',
  violation_description TEXT COMMENT '违法行为描述',
  penalty_decision TEXT COMMENT '处罚决定',
  penalty_amount DECIMAL(12, 2) COMMENT '罚款金额',
  responsible_person VARCHAR(100) COMMENT '责任人',
  responsible_id_card VARCHAR(18) COMMENT '责任人身份证',
  company_name VARCHAR(200) COMMENT '企业名称',
  company_license VARCHAR(50) COMMENT '企业营业执照',
  inspector_name VARCHAR(50) COMMENT '执法人员',
  inspector_badge VARCHAR(50) COMMENT '执法人员警号',
  witness_name VARCHAR(50) COMMENT '见证人',
  witness_phone VARCHAR(20) COMMENT '见证人电话',
  enforcement_date DATETIME COMMENT '执法日期',
  signature_url VARCHAR(500) COMMENT '签名图片URL',
  notes TEXT COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_task_id (task_id),
  INDEX idx_case_number (case_number),
  INDEX idx_enforcement_type (enforcement_type),
  INDEX idx_enforcement_date (enforcement_date),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='执法记录表';

-- ============================================
-- 数据库升级完成
-- ============================================

-- 显示升级结果
SELECT 'Database upgrade completed successfully!' AS message;
