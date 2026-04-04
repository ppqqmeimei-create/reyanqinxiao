# MySQL 数据库迁移指南

**项目**: 热眼擒枭 - 生态环保监控系统  
**数据库**: MySQL  
**数据库名称**: SQL  
**迁移日期**: 2026年3月13日

---

## 📋 迁移概览

本项目已从 MongoDB 迁移到 MySQL，使用 Sequelize ORM 进行数据库操作。

### 技术栈变更
- **之前**: MongoDB + Mongoose
- **现在**: MySQL + Sequelize

---

## 🗄️ 数据库信息

### 数据库配置
- **数据库名称**: `SQL`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`
- **引擎**: InnoDB
- **时区**: +08:00 (中国标准时间)

### 连接信息
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=SQL
DB_USER=root
DB_PASSWORD=
```

---

## 📊 数据表结构

### 1. 用户表 (users)
存储系统用户信息

**字段**:
- `id` - 主键，自增
- `username` - 用户名，唯一
- `email` - 邮箱，唯一
- `password` - 密码（bcrypt 加密）
- `name` - 姓名
- `role` - 角色 (inspector, manager, admin)
- `status` - 状态 (online, offline, busy)
- `phone` - 电话
- `avatar` - 头像
- `department` - 部门
- `badge_number` - 警号
- `is_active` - 是否激活
- `last_login` - 最后登录时间
- `created_at` - 创建时间
- `updated_at` - 更新时间

**索引**:
- `idx_username` - 用户名索引
- `idx_email` - 邮箱索引
- `idx_role` - 角色索引
- `idx_status` - 状态索引

### 2. 预警表 (alerts)
存储环境污染预警信息

**字段**:
- `id` - 主键，自增
- `title` - 标题
- `description` - 描述
- `level` - 级别 (critical, warning, info)
- `status` - 状态 (pending, processing, resolved, ignored)
- `type` - 类型 (water-pollution, air-pollution, soil-pollution, waste-pollution)
- `category` - 分类 (water, air, soil, waste)
- `location` - 位置
- `latitude` - 纬度
- `longitude` - 经度
- `risk_score` - 风险评分 (0-100)
- `pollutant_type` - 污染物类型
- `pollutant_value` - 污染物浓度
- `standard_value` - 标准值
- `exceed_ratio` - 超标倍数
- `affected_population` - 影响人口
- `source` - 来源
- `urgency` - 紧急程度
- `assigned_to` - 分配给（外键 -> users.id）
- `created_by` - 创建者（外键 -> users.id）
- `resolved_by` - 解决者（外键 -> users.id）
- `resolved_at` - 解决时间
- `resolution_notes` - 解决备注
- `created_at` - 创建时间
- `updated_at` - 更新时间

**索引**:
- `idx_level` - 级别索引
- `idx_status` - 状态索引
- `idx_type` - 类型索引
- `idx_category` - 分类索引
- `idx_created_at` - 创建时间索引
- `idx_risk_score` - 风险评分索引
- `idx_location` - 位置索引（经纬度）

### 3. 任务表 (tasks)
存储任务信息

**字段**:
- `id` - 主键，自增
- `title` - 标题
- `description` - 描述
- `type` - 类型 (quick-sampling, complete-sampling, inspection, monitoring)
- `status` - 状态 (pending, in-progress, completed, cancelled)
- `priority` - 优先级 (low, medium, high, urgent)
- `alert_id` - 关联预警（外键 -> alerts.id）
- `assigned_to` - 分配给（外键 -> users.id）
- `created_by` - 创建者（外键 -> users.id）
- `location` - 位置
- `latitude` - 纬度
- `longitude` - 经度
- `start_time` - 开始时间
- `end_time` - 结束时间
- `deadline` - 截止时间
- `progress` - 进度 (0-100)
- `notes` - 备注
- `completion_notes` - 完成备注
- `created_at` - 创建时间
- `updated_at` - 更新时间

**索引**:
- `idx_status` - 状态索引
- `idx_type` - 类型索引
- `idx_priority` - 优先级索引
- `idx_assigned_to` - 分配人索引
- `idx_created_at` - 创建时间索引

### 4. 任务证据表 (task_evidence)
存储任务相关证据

**字段**:
- `id` - 主键，自增
- `task_id` - 任务ID（外键 -> tasks.id）
- `type` - 类型
- `url` - 文件URL
- `description` - 描述
- `uploaded_at` - 上传时间

**索引**:
- `idx_task_id` - 任务ID索引

### 5. 任务检查清单表 (task_checklist)
存储任务检查清单

**字段**:
- `id` - 主键，自增
- `task_id` - 任务ID（外键 -> tasks.id）
- `item` - 检查项
- `completed` - 是否完成
- `completed_at` - 完成时间
- `created_at` - 创建时间

**索引**:
- `idx_task_id` - 任务ID索引

### 6. 设备表 (devices)
存储监测设备信息

**字段**:
- `id` - 主键，自增
- `device_id` - 设备ID，唯一
- `name` - 设备名称
- `type` - 类型 (camera-visible, camera-infrared, fiber, smell, water-monitor, air-monitor, soil-monitor)
- `status` - 状态 (online, offline, warning, error)
- `location` - 位置
- `latitude` - 纬度
- `longitude` - 经度
- `battery` - 电池电量 (0-100)
- `signal_strength` - 信号强度 (0-100)
- `edge_node_id` - 边缘节点ID
- `last_active` - 最后活跃时间
- `last_heartbeat` - 最后心跳时间
- `firmware_version` - 固件版本
- `hardware_version` - 硬件版本
- `manufacturer` - 制造商
- `model` - 型号
- `installation_date` - 安装日期
- `maintenance_date` - 维护日期
- `is_active` - 是否激活
- `created_at` - 创建时间
- `updated_at` - 更新时间

**索引**:
- `idx_device_id` - 设备ID索引（唯一）
- `idx_type` - 类型索引
- `idx_status` - 状态索引
- `idx_location` - 位置索引（经纬度）

### 7. 设备元数据表 (device_metadata)
存储设备监测数据

**字段**:
- `id` - 主键，自增
- `device_id` - 设备ID（外键 -> devices.id）
- `ph` - pH值
- `temperature` - 温度
- `humidity` - 湿度
- `pm25` - PM2.5
- `aqi` - 空气质量指数
- `heavy_metal` - 重金属含量
- `custom_data` - 自定义数据（JSON）
- `recorded_at` - 记录时间

**索引**:
- `idx_device_id` - 设备ID索引
- `idx_recorded_at` - 记录时间索引

---

## 🔗 表关系

### 外键关系
```
users (1) ----< (N) alerts (assigned_to)
users (1) ----< (N) alerts (created_by)
users (1) ----< (N) alerts (resolved_by)
users (1) ----< (N) tasks (assigned_to)
users (1) ----< (N) tasks (created_by)
alerts (1) ----< (N) tasks (alert_id)
tasks (1) ----< (N) task_evidence (task_id)
tasks (1) ----< (N) task_checklist (task_id)
devices (1) ----< (N) device_metadata (device_id)
```

---

## 📈 视图

### 1. alert_statistics
预警统计视图

**字段**:
- `total_alerts` - 总预警数
- `critical_alerts` - 严重预警数
- `warning_alerts` - 警告预警数
- `info_alerts` - 信息预警数
- `pending_alerts` - 待处理预警数
- `processing_alerts` - 处理中预警数
- `resolved_alerts` - 已解决预警数
- `ignored_alerts` - 已忽略预警数

### 2. device_statistics
设备统计视图

**字段**:
- `total_devices` - 总设备数
- `online_devices` - 在线设备数
- `offline_devices` - 离线设备数
- `warning_devices` - 预警设备数
- `error_devices` - 故障设备数
- `avg_battery` - 平均电量
- `avg_signal_strength` - 平均信号强度

### 3. task_statistics
任务统计视图

**字段**:
- `total_tasks` - 总任务数
- `pending_tasks` - 待处理任务数
- `in_progress_tasks` - 进行中任务数
- `completed_tasks` - 已完成任务数
- `cancelled_tasks` - 已取消任务数
- `avg_progress` - 平均进度

---

## 🚀 安装步骤

### 1. 安装 MySQL

**Windows**:
```bash
# 下载 MySQL 安装程序
https://dev.mysql.com/downloads/mysql/

# 或使用 Chocolatey
choco install mysql
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS**:
```bash
brew install mysql
brew services start mysql
```

### 2. 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source /path/to/back-end/database/init.sql

# 或直接导入
mysql -u root -p < /path/to/back-end/database/init.sql
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
DB_HOST=localhost
DB_PORT=3306
DB_NAME=SQL
DB_USER=root
DB_PASSWORD=your_password
```

### 4. 安装依赖

```bash
cd back-end
npm install
```

### 5. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

---

## 🔄 数据迁移

### 从 MongoDB 迁移到 MySQL

如果您有现有的 MongoDB 数据需要迁移：

1. **导出 MongoDB 数据**
```bash
mongoexport --db=reyanjingxiao --collection=users --out=users.json
mongoexport --db=reyanjingxiao --collection=alerts --out=alerts.json
mongoexport --db=reyanjingxiao --collection=tasks --out=tasks.json
mongoexport --db=reyanjingxiao --collection=devices --out=devices.json
```

2. **转换数据格式**
使用提供的迁移脚本转换 JSON 数据为 SQL 格式

3. **导入 MySQL**
```bash
mysql -u root -p SQL < migrated_data.sql
```

---

## 🧪 测试数据

数据库初始化脚本已包含测试数据：

### 测试用户
- **管理员**: admin / admin123
- **巡查员01**: inspector01 / password123
- **巡查员02**: inspector02 / password123
- **管理员01**: manager01 / password123

### 测试设备
- CAM-001 - 可见光摄像头
- CAM-002 - 红外摄像头
- FIBER-001 - 震动光纤
- SMELL-001 - 气味探头
- WATER-001 - 水质监测点
- AIR-001 - 空气监测点

### 测试预警
- 水质污染预警
- 空气污染预警
- 土壤污染预警

---

## 📝 Sequelize 使用示例

### 查询示例

```javascript
// 查询所有用户
const users = await User.findAll();

// 查询单个用户
const user = await User.findByPk(1);

// 条件查询
const alerts = await Alert.findAll({
  where: { level: 'critical', status: 'pending' },
  include: [{ model: User, as: 'assignedUser' }],
  order: [['created_at', 'DESC']],
  limit: 10
});

// 创建记录
const newAlert = await Alert.create({
  title: '水质污染预警',
  level: 'critical',
  type: 'water-pollution',
  category: 'water',
  location: '监测点A',
  latitude: 39.9042,
  longitude: 116.4074
});

// 更新记录
await alert.update({ status: 'resolved' });

// 删除记录
await alert.destroy();
```

### 关联查询

```javascript
// 查询预警及其分配的用户
const alert = await Alert.findByPk(1, {
  include: [
    { model: User, as: 'assignedUser' },
    { model: User, as: 'creator' }
  ]
});

// 查询任务及其证据和检查清单
const task = await Task.findByPk(1, {
  include: [
    { model: TaskEvidence, as: 'evidence' },
    { model: TaskChecklist, as: 'checklist' }
  ]
});
```

---

## 🔧 维护

### 备份数据库

```bash
# 备份整个数据库
mysqldump -u root -p SQL > backup_$(date +%Y%m%d).sql

# 备份特定表
mysqldump -u root -p SQL users alerts tasks devices > backup_tables.sql
```

### 恢复数据库

```bash
mysql -u root -p SQL < backup_20260313.sql
```

### 优化数据库

```sql
-- 优化表
OPTIMIZE TABLE users, alerts, tasks, devices;

-- 分析表
ANALYZE TABLE users, alerts, tasks, devices;

-- 检查表
CHECK TABLE users, alerts, tasks, devices;
```

---

## 📊 性能优化

### 索引优化
- 已为常用查询字段创建索引
- 外键字段自动创建索引
- 复合索引用于多字段查询

### 查询优化
- 使用 `EXPLAIN` 分析查询计划
- 避免 `SELECT *`，只查询需要的字段
- 使用分页限制结果集大小
- 合理使用 JOIN 和子查询

### 连接池配置
```javascript
pool: {
  max: 10,        // 最大连接数
  min: 0,         // 最小连接数
  acquire: 30000, // 获取连接超时时间
  idle: 10000     // 空闲连接超时时间
}
```

---

## 🔐 安全建议

1. **修改默认密码**
   - 修改 root 密码
   - 创建专用数据库用户

2. **权限控制**
   ```sql
   CREATE USER 'reyanjingxiao'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT ALL PRIVILEGES ON SQL.* TO 'reyanjingxiao'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **定期备份**
   - 设置自动备份任务
   - 异地存储备份文件

4. **监控日志**
   - 启用慢查询日志
   - 监控错误日志

---

## 📞 支持

如有问题，请查看：
- `README.md` - 项目说明
- `BACKEND_TECH_VERIFICATION.md` - 技术验证报告
- `QUICKSTART.md` - 快速启动指南

---

**迁移完成** ✅  
**日期**: 2026年3月13日  
**数据库**: MySQL (SQL)
