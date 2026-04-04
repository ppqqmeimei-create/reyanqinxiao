-- ============================================
-- 热眼擒枭——边境活物走私智能防控系统
-- Migration：生态警务字典重构（角色/预警类型/法律依据）
-- 版本: 2.1.0
-- 日期: 2026-03-23
-- ============================================

USE reyanjingxiao;

-- ============================================
-- 1) 用户表/角色表重构
-- - 取消默认“环保检查员”、“食药检查员”
-- - 核心默认角色设置为“生态警务执法员（广西环食药侦查总队）”
-- ============================================

-- 将旧角色数据迁移到生态警务执法员
UPDATE users
SET role = 'ecology_inspector'
WHERE role IN ('env_inspector', 'food_drug_inspector', 'inspector');

-- 更新 users.role Enum（移除 env_inspector / food_drug_inspector）
ALTER TABLE users
  MODIFY COLUMN role ENUM(
    'ecology_commander',    -- 生态警务指挥岗
    'border_patrol',        -- 边境巡逻执法岗
    'ecology_inspector',    -- 生态警务执法员（默认核心）
    'manager',
    'admin'
  ) DEFAULT 'ecology_inspector' COMMENT '角色（生态警务优先级最高）';

-- 更新/清理 user_roles 字典表（用于前端展示/权限）
-- 若 user_roles 不存在，请先执行 17_user_optimization.sql
DELETE FROM user_roles
WHERE role_key IN ('ecology-inspector', 'fooddrug-inspector');

INSERT INTO user_roles (role_key, role_name, category, description, icon, color)
SELECT
  'enforcement-officer',
  '生态警务执法员（广西环食药侦查总队）',
  'enforcement',
  '负责生态警务执法工作',
  '👮',
  '#ef4444'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE role_key = 'enforcement-officer'
);

UPDATE user_roles
SET
  role_name   = '生态警务执法员（广西环食药侦查总队）',
  category    = 'enforcement',
  description = '负责生态警务执法工作',
  icon        = '👮',
  color       = '#ef4444'
WHERE role_key = 'enforcement-officer';

-- ============================================
-- 2) 预警类型表：Alert_Type 重构
-- - 删除水/气/土/废分类
-- - 插入新的 4 类预警
-- ============================================

DROP TABLE IF EXISTS Alert_Type;
CREATE TABLE Alert_Type (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预警类型ID',
  type_key VARCHAR(50) NOT NULL UNIQUE COMMENT '预警类型编码',
  type_name VARCHAR(120) NOT NULL COMMENT '预警类型名称',
  match_weight DECIMAL(3,2) NOT NULL DEFAULT 1.00 COMMENT '匹配权重',
  is_top BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否置顶',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警类型字典表';

INSERT INTO Alert_Type (type_key, type_name, match_weight, is_top) VALUES
  ('infrared-trigger',   '红外活体识别告警',   1.00, TRUE),
  ('checkpoint-anomaly', '车辆冲卡告警',       0.95, TRUE),
  ('report',             '群众举报线索',       0.90, TRUE),
  ('patrol-discovery',   '野生动物异常移动',   0.92, TRUE);

-- ============================================
-- 2.1) 同步调整 alerts / smuggling_alerts 枚举（清除旧分类）
-- ============================================

-- alerts.type / alerts.category 旧值迁移到新 4 类编码
UPDATE alerts
SET
  type = CASE
    WHEN type IN ('water-pollution', 'air-pollution') THEN 'infrared-trigger'
    WHEN type IN ('soil-pollution')                    THEN 'patrol-discovery'
    WHEN type IN ('waste-pollution')                   THEN 'report'
    WHEN type IN ('wildlife-smuggling', 'border-intrusion', 'suspicious-vehicle', 'illegal-transport') THEN 'patrol-discovery'
    WHEN type IN ('food-safety', 'drug-safety', 'hygiene-violation', 'illegal-discharge', 'unauthorized-operation', 'violation-record') THEN 'report'
    ELSE type
  END
WHERE type IS NOT NULL;

UPDATE alerts
SET
  category = CASE
    WHEN type IN ('infrared-trigger', 'patrol-discovery') THEN 'wildlife'
    WHEN type = 'checkpoint-anomaly'                         THEN 'checkpoint'
    WHEN type = 'report'                                     THEN 'border'
    ELSE category
  END
WHERE category IN ('water', 'air', 'soil', 'waste', 'food', 'drug', 'vehicle', 'checkpoint', 'border', 'wildlife');

-- 修改 alerts.type Enum（只保留 4 类）
ALTER TABLE alerts
  MODIFY COLUMN type ENUM(
    'infrared-trigger',
    'checkpoint-anomaly',
    'report',
    'patrol-discovery'
  ) NOT NULL COMMENT '预警类型（生态警务-边境活物走私）';

-- 修改 alerts.category Enum（删除水/气/土/废及食药维度）
ALTER TABLE alerts
  MODIFY COLUMN category ENUM(
    'wildlife',
    'border',
    'vehicle',
    'checkpoint'
  ) NOT NULL COMMENT '预警分类（生态警务口径）';

-- 同步 smuggling_alerts：移除旧类型 intelligence
UPDATE smuggling_alerts
SET alert_type = 'patrol-discovery'
WHERE alert_type = 'intelligence';

ALTER TABLE smuggling_alerts
  MODIFY COLUMN alert_type ENUM(
    'infrared-trigger',
    'checkpoint-anomaly',
    'report',
    'patrol-discovery'
  ) NOT NULL COMMENT '预警类型（生态警务-边境活物走私）';

-- ============================================
-- 3) 法律法规字典表：Law_Dict 重构
-- - 降级《水污染防治法》等
-- - 置顶匹配高优法律：《野生动物保护法》、《海关法》、《边境管理条例》
-- ============================================

DROP TABLE IF EXISTS Law_Dict;
CREATE TABLE Law_Dict (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '法律ID',
  law_key VARCHAR(80) NOT NULL UNIQUE COMMENT '法律编码',
  law_name VARCHAR(255) NOT NULL COMMENT '法律名称',
  match_score DECIMAL(4,3) NOT NULL DEFAULT 0.10 COMMENT '匹配分数',
  is_top BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否置顶',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='法律法规字典表';

-- 高优置顶法律
INSERT INTO Law_Dict (law_key, law_name, match_score, is_top) VALUES
  ('wildlife_protection_law', '《野生动物保护法》', 0.980, TRUE),
  ('customs_law',              '《海关法》',        0.960, TRUE),
  ('border_admin_reg',        '《边境管理条例》',  0.950, TRUE);

-- 旧法降级（用于兼容历史数据/展示兜底）
INSERT INTO Law_Dict (law_key, law_name, match_score, is_top) VALUES
  ('water_pollution_law', '《水污染防治法》', 0.120, FALSE),
  ('air_pollution_law',   '《大气污染防治法》', 0.110, FALSE),
  ('soil_pollution_law',  '《土壤污染防治法》', 0.100, FALSE);

-- ============================================
-- Migration completed
-- ============================================
SELECT '生态警务字典重构 Migration v2.1.0 完成' AS status;

