# MySQL 数据库设计

**项目**: 热眼擒枭 - 生态环保监控系统  
**数据库**: MySQL 8.0+  
**字符集**: utf8mb4  
**排序规则**: utf8mb4_unicode_ci  
**创建日期**: 2026年3月13日

---

## 📋 数据库概述

本数据库用于存储生态环保监控系统的所有结构化数据，包括用户信息、预警数据、任务信息、设备数据、GIS 地理信息等。

---

## 📁 文件说明

| 文件名 | 用途 | 说明 |
|-------|------|------|
| `01_create_database.sql` | 数据库初始化 | 创建数据库和所有表结构 |
| `02_insert_test_data.sql` | 测试数据 | 插入测试数据用于开发和演示 |
| `03_common_queries.sql` | 常用查询 | 常用的数据查询和统计SQL |
| `04_maintenance.sql` | 数据库维护 | 备份、清理、优化等维护操作 |
| `DATABASE_DESIGN.md` | 设计文档 | 完整的数据库设计文档 |
| `README.md` | 说明文档 | 本文件 |

---

## 🗂️ 数据库表结构

### 核心业务表 (4 个)
1. **users** - 用户表
2. **alerts** - 预警表
3. **tasks** - 任务表
4. **devices** - 设备表

### 关联表 (3 个)
5. **task_evidence** - 任务证据表
6. **task_checklist** - 任务检查清单表
7. **device_metadata** - 设备元数据表

### 辅助表 (3 个)
8. **notifications** - 通知表
9. **system_logs** - 系统日志表
10. **file_uploads** - 文件上传表

**总计**: 10 个表

---

## 🚀 快速开始

### 1. 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
mysql -u root -p < 01_create_database.sql
```

### 2. 插入测试数据

```bash
mysql -u root -p < 02_insert_test_data.sql
```

### 3. 验证安装

```bash
mysql -u root -p

# 在 MySQL 命令行中执行
USE reyanjingxiao;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

---

## 📊 数据库统计

| 统计项 | 数量 |
|-------|------|
| 数据库表 | 10 |
| 核心业务表 | 4 |
| 关联表 | 3 |
| 辅助表 | 3 |
| 索引总数 | 45+ |
| 外键约束 | 15+ |

---

## 🔗 表关系

```
users (用户)
  ├─→ alerts (预警)
  ├─→ tasks (任务)
  ├─→ notifications (通知)
  ├─→ system_logs (日志)
  └─→ file_uploads (文件)

alerts (预警)
  └─→ tasks (任务)

tasks (任务)
  ├─→ task_evidence (证据)
  └─→ task_checklist (检查清单)

devices (设备)
  └─→ device_metadata (元数据)
```

---

## 📚 常用操作

### 查询用户列表
```sql
SELECT id, username, name, role, status FROM users;
```

### 查询待处理预警
```sql
SELECT id, title, level, location, risk_score 
FROM alerts 
WHERE status = 'pending' 
ORDER BY risk_score DESC;
```

### 查询进行中的任务
```sql
SELECT t.id, t.title, t.progress, u.name AS 执行人
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status = 'in-progress';
```

### 查询在线设备
```sql
SELECT device_id, name, type, battery, signal_strength
FROM devices
WHERE status = 'online';
```

---

## 🛠️ 维护操作

### 备份数据库
```bash
mysqldump -u root -p reyanjingxiao > backup_$(date +%Y%m%d).sql
```

### 恢复数据库
```bash
mysql -u root -p reyanjingxiao < backup_20260313.sql
```

### 优化表
```sql
OPTIMIZE TABLE users, alerts, tasks, devices;
```

### 分析表
```sql
ANALYZE TABLE users, alerts, tasks, devices;
```

---

## 🔐 安全建议

1. **修改默认密码**: 测试数据中的密码需要修改
2. **创建专用用户**: 不要使用 root 用户连接应用
3. **限制访问**: 配置防火墙规则
4. **定期备份**: 建立自动备份机制
5. **监控日志**: 定期检查系统日志

---

## 📖 详细文档

完整的数据库设计文档请查看: [DATABASE_DESIGN.md](DATABASE_DESIGN.md)

包含内容:
- 详细的表结构说明
- 字段类型和约束
- 索引设计
- 关系设计
- 性能优化建议
- 安全建议

---

## 🆘 常见问题

### Q: 如何修改数据库字符集？
A: 在创建数据库时已设置为 utf8mb4，支持所有 Unicode 字符。

### Q: 如何添加新表？
A: 参考现有表结构，使用 InnoDB 引擎，utf8mb4 字符集。

### Q: 如何优化查询性能？
A: 查看 `03_common_queries.sql` 中的优化示例，合理使用索引。

### Q: 如何清理历史数据？
A: 执行 `04_maintenance.sql` 中的清理脚本。

---

## 📞 技术支持

如有问题，请查看:
- `DATABASE_DESIGN.md` - 完整设计文档
- `03_common_queries.sql` - 常用查询示例
- `04_maintenance.sql` - 维护操作示例

---

**版本**: 1.0.0  
**最后更新**: 2026年3月13日  
**维护人**: 数据库管理员
