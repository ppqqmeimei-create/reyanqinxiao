# 27/28 系列脚本执行顺序与回滚说明

## 目标

将数据库升级到“感知—预警—处置—取证—研判”闭环模型，并补齐第二批能力字段，支持：

- `roles / users` 权限分离
- `devices` 多源感知设备模型扩展
- `warnings` 统一预警主表
- `tasks` 预警转任务闭环
- `evidences` 证据留痕
- `warning_flows` 流转轨迹
- 任务维度联合执法字段与跨部门流转状态
- 相似案件规则查询索引优化

---

## 脚本说明

- `27_closed_loop_rebuild.sql`：**全量重建版**（创建新库 `reyanjingxiao_v3`）
- `27_closed_loop_migration.sql`：**增量迁移版**（在现有 `reyanjingxiao` 上升级）
- `28_batch2_capabilities.sql`：**第二批能力补充版**（相似案件规则索引 + 联合执法字段）

> `27` 的重建版与迁移版二选一执行，不要混用到同一个目标库。`28` 在 `27` 之后执行。

---

## 推荐执行策略

### 场景 A：新环境 / 演示环境（推荐）

1. 备份（如有历史数据）
2. 执行 `27_closed_loop_rebuild.sql`
3. 导入初始化业务数据（可选）
4. 修改后端连接库名到 `reyanjingxiao_v3`
5. 执行 `28_batch2_capabilities.sql`
6. 联调验证

### 场景 B：现网保留历史数据

1. 全库备份（必须）
2. 在测试库先执行并验证
3. 业务低峰期执行 `27_closed_loop_migration.sql`
4. 执行后核对迁移结果
5. 执行 `28_batch2_capabilities.sql`
6. 切换后端读写到新结构并联调

---

## 执行前检查清单

- MySQL 版本 >= 8.0
- 存储引擎 InnoDB
- 具备 `ALTER/CREATE/INDEX` 权限
- 已完成全量备份
- 已通知业务侧变更窗口
- 后端配置可切换数据库名（重建版）

---

## 具体执行命令（示例）

### 1) 全量重建版

```bash
mysql -u root -p < SQL/27_closed_loop_rebuild.sql
```

### 2) 增量迁移版

```bash
mysql -u root -p < SQL/27_closed_loop_migration.sql
```

### 3) 第二批能力补充

```bash
mysql -u root -p < SQL/28_batch2_capabilities.sql
```

---

## 执行后核验 SQL

```sql
-- 1. 核验核心表
SHOW TABLES LIKE 'roles';
SHOW TABLES LIKE 'warnings';
SHOW TABLES LIKE 'evidences';
SHOW TABLES LIKE 'warning_flows';

-- 2. 核验字段
DESC users;
DESC devices;
DESC tasks;
DESC warnings;
DESC evidences;

-- 3. 核验索引
SHOW INDEX FROM alerts;
SHOW INDEX FROM tasks;
SHOW INDEX FROM warnings;
SHOW INDEX FROM evidences;

-- 4. 核验外键
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA IN ('reyanjingxiao', 'reyanjingxiao_v3')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;
```

---

## 业务联调最小用例

1. 新建或启用用户（含 `role_id`）
2. 新建设备（`devices`）
3. 写入一条预警（`warnings`）
4. 查询相似案件（规则版）
5. 将预警转任务（`tasks.warning_id`）
6. 在任务中写入联合执法字段（案件号、协同单位、协同状态）
7. 上传证据并写入流转轨迹
8. 验证闭环查询链路完整

---

## 回滚建议

### 重建版回滚

- 直接切回旧库连接（若旧库仍在）
- 或删除新库后重建

### 增量版/补充版回滚

- **首选：数据库备份回滚**（整库恢复）
- 若需局部回滚：
  - 暂停新字段读写
  - 回退应用代码到旧结构
  - 逐步清理新增索引/字段（不建议手工临场回退）

---

## 上线建议

- 先测试库、后预发、再生产
- 每一步都做结构 + 数据 + 接口联调验收
- 生产环境务必在低峰期执行并保留快速回滚路径
