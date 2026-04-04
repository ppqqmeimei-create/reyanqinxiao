# MySQL 数据库设计文档

**项目**: 热眼擒枭 - 生态环保监控系统  
**数据库**: MySQL 8.0+  
**字符集**: utf8mb4  
**排序规则**: utf8mb4_unicode_ci  
**设计日期**: 2026年3月13日

---

## 📋 目录

1. [数据库概述](#数据库概述)
2. [表结构设计](#表结构设计)
3. [关系设计](#关系设计)
4. [索引设计](#索引设计)
5. [使用说明](#使用说明)

---

## 1. 数据库概述

### 1.1 设计目标

- 存储生态环保监控系统的所有结构化数据
- 支持高并发的读写操作
- 保证数据的完整性和一致性
- 提供高效的查询性能
- 支持数据归档和备份

### 1.2 数据库架构

```
reyanjingxiao (数据库)
├── 核心业务表
│   ├── users (用户表)
│   ├── alerts (预警表)
│   ├── tasks (任务表)
│   └── devices (设备表)
├── 关联表
│   ├── task_evidence (任务证据表)
│   ├── task_checklist (任务检查清单表)
│   └── device_metadata (设备元数据表)
└── 辅助表
    ├── notifications (通知表)
    ├── system_logs (系统日志表)
    └── file_uploads (文件上传表)
```

### 1.3 技术规范

| 项目 | 规范 |
|-----|------|
| 数据库引擎 | InnoDB |
| 字符集 | utf8mb4 |
| 排序规则 | utf8mb4_unicode_ci |
| 主键策略 | 自增整数 |
| 外键约束 | 启用 |
| 时间戳 | DATETIME |

---

## 2. 表结构设计

### 2.1 核心业务表

#### users (用户表)
- **用途**: 存储系统用户信息
- **主键**: id (INT, AUTO_INCREMENT)
- **唯一键**: username, email
- **关键字段**: username, email, password, name, role, status
- **索引**: username, email, role, status

#### alerts (预警表)
- **用途**: 存储环保预警信息
- **主键**: id (INT, AUTO_INCREMENT)
- **外键**: assigned_to, created_by, resolved_by → users(id)
- **关键字段**: title, level, status, type, category, location, risk_score
- **索引**: level, status, type, category, created_at, risk_score, (latitude, longitude)

#### tasks (任务表)
- **用途**: 存储任务信息
- **主键**: id (INT, AUTO_INCREMENT)
- **外键**: alert_id → alerts(id), assigned_to, created_by → users(id)
- **关键字段**: title, type, status, priority, progress, deadline
- **索引**: status, type, priority, assigned_to, created_at

#### devices (设备表)
- **用途**: 存储监测设备信息
- **主键**: id (INT, AUTO_INCREMENT)
- **唯一键**: device_id
- **关键字段**: device_id, name, type, status, location, battery, signal_strength
- **索引**: device_id, type, status, (latitude, longitude)

### 2.2 关联表

#### task_evidence (任务证据表)
- **用途**: 存储任务相关证据
- **主键**: id (INT, AUTO_INCREMENT)
- **外键**: task_id → tasks(id) ON DELETE CASCADE
- **关键字段**: task_id, type, url, description

#### task_checklist (任务检查清单表)
- **用途**: 存储任务检查清单
- **主键**: id (INT, AUTO_INCREMENT)
- **外键**: task_id → tasks(id) ON DELETE CASCADE
- **关键字段**: task_id, item, completed, completed_at

#### device_metadata (设备元数据表)
- **用途**: 存储设备监测数据
- **主键**: id (INT, AUTO_INCREMENT)
- **外键**: device_id → devices(id) ON DELETE CASCADE
- **关键字段**: device_id, ph, temperature, humidity, pm25, aqi, heavy_metal

### 2.3 辅助表

#### notifications (通知表)
- **用途**: 存储用户通知
- **主键**: id (INT, AUTO_INCREMENT)
- **外键**: user_id → users(id) ON DELETE CASCADE
- **关键字段**: user_id, type, title, content, is_read

#### system_logs (系统日志表)
- **用途**: 存储系统操作日志
- **主键**: id (BIGINT, AUTO_INCREMENT)
- **外键**: user_id → users(id) ON DELETE SET NULL
- **关键字段**: user_id, action, module, method, path, ip

#### file_uploads (文件上传表)
- **用途**: 存储文件上传记录
- **主键**: id (INT, AUTO_INCREMENT)
- **外键**: user_id → users(id) ON DELETE SET NULL
- **关键字段**: user_id, original_name, stored_name, file_path, file_size

---

## 3. 关系设计

### 3.1 ER 图关系

```
users (用户)
  ├─→ alerts (预警) [created_by, assigned_to, resolved_by]
  ├─→ tasks (任务) [created_by, assigned_to]
  ├─→ notifications (通知) [user_id]
  ├─→ system_logs (日志) [user_id]
  └─→ file_uploads (文件) [user_id]

alerts (预警)
  └─→ tasks (任务) [alert_id]

tasks (任务)
  ├─→ task_evidence (证据) [task_id]
  └─→ task_checklist (检查清单) [task_id]

devices (设备)
  └─→ device_metadata (元数据) [device_id]
```

### 3.2 关系类型

| 关系 | 类型 | 说明 |
|-----|------|------|
| users → alerts | 1:N | 一个用户可以创建/处理多个预警 |
| users → tasks | 1:N | 一个用户可以创建/执行多个任务 |
| alerts → tasks | 1:N | 一个预警可以关联多个任务 |
| tasks → task_evidence | 1:N | 一个任务可以有多个证据 |
| tasks → task_checklist | 1:N | 一个任务可以有多个检查项 |
| devices → device_metadata | 1:N | 一个设备可以有多条监测数据 |

---

## 4. 索引设计

### 4.1 索引策略

1. **主键索引**: 所有表都使用自增整数作为主键
2. **唯一索引**: username, email, device_id
3. **外键索引**: 所有外键字段都建立索引
4. **查询索引**: 根据常用查询条件建立索引
5. **复合索引**: 地理位置查询使用 (latitude, longitude)

### 4.2 索引统计

| 表名 | 索引数量 | 说明 |
|-----|---------|------|
| users | 5 | 主键 + 4个索引 |
| alerts | 8 | 主键 + 7个索引 |
| tasks | 6 | 主键 + 5个索引 |
| devices | 5 | 主键 + 4个索引 |
| task_evidence | 2 | 主键 + 1个索引 |
| task_checklist | 2 | 主键 + 1个索引 |
| device_metadata | 3 | 主键 + 2个索引 |
| notifications | 5 | 主键 + 4个索引 |
| system_logs | 5 | 主键 + 4个索引 |
| file_uploads | 4 | 主键 + 3个索引 |

---

## 5. 使用说明

### 5.1 初始化数据库

```bash
# 1. 创建数据库和表结构
mysql -u root -p < 01_create_database.sql

# 2. 插入测试数据
mysql -u root -p < 02_insert_test_data.sql
```

### 5.2 常用查询

```bash
# 执行常用查询脚本
mysql -u root -p < 03_common_queries.sql
```

### 5.3 数据库维护

```bash
# 执行维护脚本
mysql -u root -p < 04_maintenance.sql
```

### 5.4 备份数据库

```bash
# 完整备份
mysqldump -u root -p reyanjingxiao > backup_$(date +%Y%m%d).sql

# 只备份结构
mysqldump -u root -p --no-data reyanjingxiao > schema_$(date +%Y%m%d).sql
```

### 5.5 恢复数据库

```bash
# 恢复数据库
mysql -u root -p reyanjingxiao < backup_20260313.sql
```

---

## 6. 枚举类型说明

### 用户相关
- **role**: inspector (巡查员), manager (管理员), admin (系统管理员)
- **status**: online (在线), offline (离线), busy (忙碌)

### 预警相关
- **level**: critical (紧急), warning (预警), info (信息)
- **status**: pending (待处理), processing (处理中), resolved (已解决), ignored (已忽略)
- **type**: water-pollution, air-pollution, soil-pollution, waste-pollution
- **category**: water, air, soil, waste
- **source**: device, manual, hotline, social_media, enterprise

### 任务相关
- **type**: quick-sampling, complete-sampling, inspection, monitoring
- **status**: pending (待开始), in-progress (进行中), completed (已完成), cancelled (已取消)
- **priority**: low (低), medium (中), high (高), urgent (紧急)

### 设备相关
- **type**: camera-visible, camera-infrared, fiber, smell, water-monitor, air-monitor, soil-monitor
- **status**: online (在线), offline (离线), warning (预警), error (故障)

---

## 7. 性能优化建议

### 7.1 查询优化
1. 使用索引覆盖查询
2. 避免 SELECT *
3. 使用 LIMIT 限制结果集
4. 合理使用 JOIN
5. 避免在 WHERE 子句中使用函数

### 7.2 表优化
1. 定期执行 OPTIMIZE TABLE
2. 定期执行 ANALYZE TABLE
3. 清理过期数据
4. 归档历史数据

### 7.3 配置优化
1. 调整 innodb_buffer_pool_size
2. 调整 max_connections
3. 启用查询缓存
4. 配置慢查询日志

---

## 8. 安全建议

### 8.1 访问控制
1. 使用最小权限原则
2. 为不同用途创建不同的数据库用户
3. 定期更新密码
4. 限制远程访问

### 8.2 数据保护
1. 定期备份数据
2. 加密敏感数据
3. 使用 SSL 连接
4. 启用二进制日志

---

## 9. SQL 文件说明

| 文件名 | 用途 |
|-------|------|
| 01_create_database.sql | 创建数据库和表结构 |
| 02_insert_test_data.sql | 插入测试数据 |
| 03_common_queries.sql | 常用查询脚本 |
| 04_maintenance.sql | 数据库维护脚本 |
| DATABASE_DESIGN.md | 数据库设计文档 |
| README.md | 数据库说明 |

---

**文档版本**: 1.0.0  
**最后更新**: 2026年3月13日  
**维护人**: 数据库管理员
