USE reyanjingxiao;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_code VARCHAR(64) NOT NULL UNIQUE,
  role_name VARCHAR(128) NOT NULL,
  role_scope VARCHAR(64) NOT NULL DEFAULT 'city',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_active (is_active)
) ENGINE=InnoDB;

INSERT INTO roles (role_code, role_name, role_scope)
VALUES
('ecology_police_officer','生态警务执法员','district'),
('env_inspector','环保检查员','district'),
('fooddrug_inspector','食药检查员','district'),
('command_center','指挥中心管理员','city'),
('system_admin','系统管理员','global')
ON DUPLICATE KEY UPDATE role_name=VALUES(role_name), role_scope=VALUES(role_scope);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role_id BIGINT UNSIGNED NULL AFTER role,
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER password,
  ADD COLUMN IF NOT EXISTS real_name VARCHAR(64) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL AFTER last_login,
  ADD INDEX idx_users_role_id (role_id);

UPDATE users u
LEFT JOIN roles r ON
  (u.role='admin' AND r.role_code='system_admin') OR
  (u.role='manager' AND r.role_code='command_center') OR
  (u.role='inspector' AND r.role_code='ecology_police_officer')
SET u.role_id = COALESCE(u.role_id, r.id)
WHERE u.role_id IS NULL;

ALTER TABLE users
  ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS device_code VARCHAR(64) NULL AFTER device_id,
  ADD COLUMN IF NOT EXISTS device_name VARCHAR(128) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS device_type ENUM('infrared_camera','checkpoint_camera','fiber_vibration','water_sensor','air_sensor','soil_sensor','drone','other') NULL AFTER type,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at DATETIME NULL AFTER last_heartbeat,
  ADD COLUMN IF NOT EXISTS install_at DATETIME NULL AFTER installation_date,
  ADD COLUMN IF NOT EXISTS location_text VARCHAR(255) NULL AFTER location,
  ADD COLUMN IF NOT EXISTS geo_point POINT SRID 4326 NULL AFTER longitude,
  ADD COLUMN IF NOT EXISTS battery_level TINYINT UNSIGNED NULL AFTER battery,
  ADD COLUMN IF NOT EXISTS metadata JSON NULL AFTER signal_strength;

UPDATE devices
SET
  device_code = COALESCE(device_code, device_id),
  device_name = COALESCE(device_name, name),
  device_type = COALESCE(device_type,
    CASE type
      WHEN 'camera-infrared' THEN 'infrared_camera'
      WHEN 'camera-visible' THEN 'checkpoint_camera'
      WHEN 'fiber' THEN 'fiber_vibration'
      WHEN 'water-monitor' THEN 'water_sensor'
      WHEN 'air-monitor' THEN 'air_sensor'
      WHEN 'soil-monitor' THEN 'soil_sensor'
      ELSE 'other' END),
  last_heartbeat_at = COALESCE(last_heartbeat_at, last_heartbeat),
  location_text = COALESCE(location_text, location),
  battery_level = COALESCE(battery_level, battery)
WHERE 1=1;

ALTER TABLE devices
  ADD UNIQUE INDEX uk_devices_code (device_code),
  ADD INDEX idx_devices_type_status_new (device_type, status),
  ADD INDEX idx_devices_heartbeat_new (last_heartbeat_at),
  ADD INDEX idx_devices_lat_lng_new (latitude, longitude),
  ADD SPATIAL INDEX sp_idx_devices_point_new (geo_point);

CREATE TABLE IF NOT EXISTS warnings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warning_code VARCHAR(64) NOT NULL UNIQUE,
  warning_category ENUM('smuggling','ecology','fooddrug') NOT NULL,
  warning_type VARCHAR(64) NOT NULL,
  risk_level ENUM('critical','high_risk','processing','resolved') NOT NULL DEFAULT 'high_risk',
  warning_status ENUM('pending','processing','resolved','ignored') NOT NULL DEFAULT 'pending',
  risk_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  title VARCHAR(255) NOT NULL,
  content TEXT NULL,
  device_id BIGINT UNSIGNED NULL,
  discovered_at DATETIME NOT NULL,
  happened_at DATETIME NULL,
  location_text VARCHAR(255) NULL,
  border_section VARCHAR(64) NULL,
  latitude DECIMAL(10,8) NULL,
  longitude DECIMAL(11,8) NULL,
  geo_point POINT SRID 4326 NULL,
  source_channel ENUM('device','manual','report','intelligence','other') NOT NULL DEFAULT 'device',
  species_name VARCHAR(128) NULL,
  target_type ENUM('person','vehicle','animal','goods','unknown') NOT NULL DEFAULT 'unknown',
  assigned_to BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NULL,
  resolved_by BIGINT UNSIGNED NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_warnings_device FOREIGN KEY (device_id) REFERENCES devices(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_warnings_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_warnings_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_warnings_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT chk_warnings_score CHECK (risk_score BETWEEN 0 AND 100),
  INDEX idx_warnings_category_level_status_time (warning_category, risk_level, warning_status, discovered_at),
  INDEX idx_warnings_device_time (device_id, discovered_at),
  INDEX idx_warnings_status_time (warning_status, discovered_at),
  INDEX idx_warnings_lat_lng (latitude, longitude),
  SPATIAL INDEX sp_idx_warnings_point (geo_point)
) ENGINE=InnoDB;

INSERT INTO warnings (
  warning_code, warning_category, warning_type, risk_level, warning_status,
  risk_score, title, content, discovered_at, location_text, border_section,
  latitude, longitude, source_channel, species_name, target_type,
  assigned_to, created_by, resolved_by, resolved_at, created_at, updated_at
)
SELECT
  CONCAT('AL-', a.id),
  CASE WHEN a.category IN ('water','air','soil','waste') THEN 'ecology'
       WHEN a.category IN ('food','drug') THEN 'fooddrug'
       ELSE 'smuggling' END,
  a.type,
  CASE WHEN a.level='critical' THEN 'critical'
       WHEN a.status='processing' THEN 'processing'
       WHEN a.status='resolved' THEN 'resolved'
       ELSE 'high_risk' END,
  a.status,
  LEAST(GREATEST(IFNULL(a.risk_score,0),0),100),
  a.title, a.description, COALESCE(a.created_at,NOW()), a.location, a.border_section,
  a.latitude, a.longitude, COALESCE(a.source,'device'), COALESCE(a.species_name,a.species_type),
  COALESCE(a.target_type,'unknown'), a.assigned_to, a.created_by, a.resolved_by, a.resolved_at,
  a.created_at, a.updated_at
FROM alerts a
WHERE NOT EXISTS (SELECT 1 FROM warnings w WHERE w.warning_code = CONCAT('AL-', a.id));

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS warning_id BIGINT UNSIGNED NULL AFTER alert_id,
  ADD COLUMN IF NOT EXISTS task_status ENUM('pending','in_progress','completed','cancelled') NULL AFTER status,
  ADD COLUMN IF NOT EXISTS assigned_user_id BIGINT UNSIGNED NULL AFTER assigned_to,
  ADD COLUMN IF NOT EXISTS deadline_at DATETIME NULL AFTER deadline,
  ADD COLUMN IF NOT EXISTS geo_point POINT SRID 4326 NULL AFTER longitude;

UPDATE tasks t
LEFT JOIN warnings w ON w.warning_code = CONCAT('AL-', t.alert_id)
SET
  t.warning_id = COALESCE(t.warning_id, w.id),
  t.task_status = COALESCE(t.task_status, CASE WHEN t.status='in-progress' THEN 'in_progress' ELSE t.status END),
  t.assigned_user_id = COALESCE(t.assigned_user_id, t.assigned_to),
  t.deadline_at = COALESCE(t.deadline_at, t.deadline)
WHERE 1=1;

ALTER TABLE tasks
  ADD INDEX idx_tasks_warning_new (warning_id),
  ADD INDEX idx_tasks_status_deadline_new (task_status, deadline_at),
  ADD INDEX idx_tasks_assignee_status_new (assigned_user_id, task_status),
  ADD SPATIAL INDEX sp_idx_tasks_point_new (geo_point),
  ADD CONSTRAINT fk_tasks_warning_new FOREIGN KEY (warning_id) REFERENCES warnings(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT fk_tasks_assigned_user_new FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS evidences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  evidence_code VARCHAR(64) NOT NULL UNIQUE,
  warning_id BIGINT UNSIGNED NULL,
  task_id BIGINT UNSIGNED NULL,
  uploader_id BIGINT UNSIGNED NOT NULL,
  evidence_type ENUM('image','video','audio','document','other') NOT NULL,
  file_url VARCHAR(1024) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remark TEXT NULL,
  CONSTRAINT fk_evidences_warning FOREIGN KEY (warning_id) REFERENCES warnings(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_evidences_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_evidences_uploader FOREIGN KEY (uploader_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT chk_evidences_ref CHECK (warning_id IS NOT NULL OR task_id IS NOT NULL),
  INDEX idx_evidences_task_time (task_id, uploaded_at),
  INDEX idx_evidences_warning_time (warning_id, uploaded_at),
  INDEX idx_evidences_uploader_time (uploader_id, uploaded_at)
) ENGINE=InnoDB;

INSERT INTO evidences (evidence_code, warning_id, task_id, uploader_id, evidence_type, file_url, remark, uploaded_at)
SELECT
  CONCAT('TE-', te.id),
  t.warning_id,
  te.task_id,
  COALESCE(t.assigned_user_id, t.assigned_to, 1),
  COALESCE(te.type, 'other'),
  te.url,
  te.description,
  COALESCE(te.uploaded_at, NOW())
FROM task_evidence te
LEFT JOIN tasks t ON t.id = te.task_id
WHERE NOT EXISTS (SELECT 1 FROM evidences e WHERE e.evidence_code = CONCAT('TE-', te.id));

CREATE TABLE IF NOT EXISTS warning_flows (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warning_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NULL,
  flow_stage ENUM('sensing','warning','disposal','evidence','analysis','closed') NOT NULL,
  action_code VARCHAR(64) NOT NULL,
  action_desc VARCHAR(255) NULL,
  operator_id BIGINT UNSIGNED NULL,
  payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_warning_flows_warning FOREIGN KEY (warning_id) REFERENCES warnings(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT fk_warning_flows_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  CONSTRAINT fk_warning_flows_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE SET NULL,
  INDEX idx_warning_flows_warning_time (warning_id, created_at),
  INDEX idx_warning_flows_stage_time (flow_stage, created_at),
  INDEX idx_warning_flows_operator_time (operator_id, created_at)
) ENGINE=InnoDB;

SELECT '27_closed_loop_migration.sql done' AS migration_status;
