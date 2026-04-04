-- ============================================
-- 热眼擒枭 - 任务模块数据库升级脚本（第2部分）
-- ============================================
-- 版本: 1.1.0
-- 升级日期: 2026-03-14
-- 说明: 创建存储过程和触发器
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1. 创建存储过程 - 生成案件编号
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS generate_case_number//
CREATE PROCEDURE generate_case_number(
  IN p_priority VARCHAR(20),
  OUT p_case_number VARCHAR(50)
)
BEGIN
  DECLARE v_prefix VARCHAR(20);
  DECLARE v_year INT;
  DECLARE v_sequence INT;
  
  -- 根据优先级确定前缀
  SET v_prefix = CASE 
    WHEN p_priority = 'urgent' THEN 'ENV-CRIT'
    WHEN p_priority = 'high' THEN 'ENV-HIGH'
    WHEN p_priority = 'medium' THEN 'ENV-WARN'
    ELSE 'ENV-INFO'
  END;
  
  -- 获取当前年份
  SET v_year = YEAR(NOW());
  
  -- 获取当年的序列号
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_number, -6) AS UNSIGNED)), 0) + 1
  INTO v_sequence
  FROM tasks
  WHERE case_number LIKE CONCAT(v_prefix, '-', v_year, '-%');
  
  -- 生成案件编号
  SET p_case_number = CONCAT(v_prefix, '-', v_year, '-', LPAD(v_sequence, 6, '0'));
END//

DELIMITER ;

-- ============================================
-- 2. 创建触发器 - 自动生成案件编号
-- ============================================

DELIMITER //

DROP TRIGGER IF EXISTS before_task_insert//
CREATE TRIGGER before_task_insert
BEFORE INSERT ON tasks
FOR EACH ROW
BEGIN
  DECLARE v_case_number VARCHAR(50);
  
  -- 如果没有案件编号，自动生成
  IF NEW.case_number IS NULL THEN
    CALL generate_case_number(NEW.priority, v_case_number);
    SET NEW.case_number = v_case_number;
  END IF;
END//

DELIMITER ;

-- ============================================
-- 3. 创建触发器 - 更新证据统计
-- ============================================

DELIMITER //

DROP TRIGGER IF EXISTS after_evidence_insert//
CREATE TRIGGER after_evidence_insert
AFTER INSERT ON task_evidence
FOR EACH ROW
BEGIN
  UPDATE tasks 
  SET 
    photo_count = (SELECT COUNT(*) FROM task_evidence WHERE task_id = NEW.task_id AND type = 'photo'),
    video_count = (SELECT COUNT(*) FROM task_evidence WHERE task_id = NEW.task_id AND type = 'video'),
    audio_count = (SELECT COUNT(*) FROM task_evidence WHERE task_id = NEW.task_id AND type = 'audio'),
    evidence_count = (SELECT COUNT(*) FROM task_evidence WHERE task_id = NEW.task_id)
  WHERE id = NEW.task_id;
END//

DROP TRIGGER IF EXISTS after_evidence_delete//
CREATE TRIGGER after_evidence_delete
AFTER DELETE ON task_evidence
FOR EACH ROW
BEGIN
  UPDATE tasks 
  SET 
    photo_count = (SELECT COUNT(*) FROM task_evidence WHERE task_id = OLD.task_id AND type = 'photo'),
    video_count = (SELECT COUNT(*) FROM task_evidence WHERE task_id = OLD.task_id AND type = 'video'),
    audio_count = (SELECT COUNT(*) FROM task_evidence WHERE task_id = OLD.task_id AND type = 'audio'),
    evidence_count = (SELECT COUNT(*) FROM task_evidence WHERE task_id = OLD.task_id)
  WHERE id = OLD.task_id;
END//

DELIMITER ;

-- ============================================
-- 4. 创建触发器 - 更新检查清单进度
-- ============================================

DELIMITER //

DROP TRIGGER IF EXISTS after_checklist_update//
CREATE TRIGGER after_checklist_update
AFTER UPDATE ON task_checklist
FOR EACH ROW
BEGIN
  DECLARE v_total INT;
  DECLARE v_completed INT;
  DECLARE v_progress INT;
  
  SELECT COUNT(*) INTO v_total FROM task_checklist WHERE task_id = NEW.task_id;
  SELECT COUNT(*) INTO v_completed FROM task_checklist WHERE task_id = NEW.task_id AND status = 'completed';
  
  SET v_progress = FLOOR((v_completed / v_total) * 100);
  
  UPDATE tasks 
  SET checklist_progress = v_progress
  WHERE id = NEW.task_id;
END//

DELIMITER ;

-- ============================================
-- 5. 创建存储过程 - 完成任务
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS complete_task//
CREATE PROCEDURE complete_task(
  IN p_task_id INT,
  IN p_user_id INT,
  IN p_completion_notes TEXT
)
BEGIN
  DECLARE v_start_time DATETIME;
  DECLARE v_actual_duration INT;
  
  SELECT start_time INTO v_start_time FROM tasks WHERE id = p_task_id;
  
  IF v_start_time IS NOT NULL THEN
    SET v_actual_duration = TIMESTAMPDIFF(MINUTE, v_start_time, NOW());
  END IF;
  
  UPDATE tasks 
  SET 
    status = 'completed',
    completed_at = NOW(),
    actual_duration = v_actual_duration,
    completion_notes = p_completion_notes,
    updated_at = NOW()
  WHERE id = p_task_id;
  
  INSERT INTO task_timeline (task_id, event_type, event_title, event_description, user_id)
  VALUES (p_task_id, 'completed', '任务完成', p_completion_notes, p_user_id);
  
  UPDATE alerts 
  SET status = 'resolved', resolved_at = NOW(), resolved_by = p_user_id
  WHERE id = (SELECT alert_id FROM tasks WHERE id = p_task_id);
END//

DELIMITER ;

-- ============================================
-- 数据库升级第2部分完成
-- ============================================
SELECT 'Part 2: New tables and procedures created successfully!' AS message;
