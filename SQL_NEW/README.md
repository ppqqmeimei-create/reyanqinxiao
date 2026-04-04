-- =============================================
-- README - 数据库设计文档
-- 文件: README.md
-- =============================================

# 热眼擒枭数据库设计

## 数据库概述

- **数据库名称**: `reyanqinxiao`
- **字符集**: `utf8mb4_unicode_ci`
- **存储引擎**: InnoDB

## 表结构设计

### 核心业务表

| 表名 | 描述 | 关键字段 |
|------|------|---------|
| `users` | 用户表(支持RBAC) | role, permissions, status, login_attempts |
| `alerts` | 预警表(AI研判) | confidence, species_type, sensor_type, zone_id |
| `tasks` | 任务表 | type, priority, progress, evidence_list |
| `devices` | 设备表(云边端) | type, status, sensitivity, edge_node_id |
| `evidence` | 取证表(防伪溯源) | check_code, watermark, sync_status, verified |
| `zones` | 战区表 | name, risk_level, center_lat, center_lng |
| `border_markers` | 界碑表 | marker_no, zone_id, latitude, longitude |
| `system_logs` | 系统日志表 | level, action, operator, ip |
| `ai_config` | AI配置表 | model_version, confidence_threshold, accuracy |

## 角色权限体系

### 角色说明

- **admin**: 系统管理员，拥有所有权限
- **commander**: 指挥调度，负责预警分配、任务派发
- **investigator**: 侦查研判，负责预警核查、取证分析
- **frontline**: 一线执勤，负责现场处置、任务执行

### 权限点说明

```json
{
  "用户管理": ["user:manage", "user:read", "user:create", "user:update", "user:delete"],
  "预警管理": ["alert:read", "alert:create", "alert:update", "alert:delete", "alert:assign", "alert:resolve", "alert:ignore"],
  "任务管理": ["task:read", "task:create", "task:update", "task:delete", "task:assign", "task:progress"],
  "设备管理": ["device:read", "device:create", "device:update", "device:delete", "device:sensitivity"],
  "取证管理": ["evidence:read", "evidence:upload", "evidence:verify"],
  "统计分析": ["stats:read", "stats:export"],
  "系统管理": ["system:log", "system:config"]
}
```

## 五大战区

| 战区编码 | 战区名称 | 风险等级 | 位置 |
|---------|---------|---------|------|
| PXYYG | 凭祥友谊关 | 高风险 | 广西凭祥市友谊镇 |
| DXKK | 东兴口岸 | 高风险 | 广西防城港东兴市 |
| LZSK | 龙州水口 | 中风险 | 广西崇左市龙州县 |
| JXYW | 靖西岳圩 | 中风险 | 广西百色市靖西县 |
| NPGL | 那坡桂林 | 低风险 | 广西百色市那坡县 |

## 设备类型

| 类型代码 | 类型名称 | 说明 |
|---------|---------|------|
| infrared | 红外热成像 | 检测体温和移动 |
| vibration | 振动光纤 | 检测围网震动 |
| visible | 可见光摄像 | 视频监控 |
| gps | GPS定位 | 人员和车辆定位 |
| drone | 无人机 | 空中巡逻 |
| smell | 气味传感 | 检测异常气味 |
| water | 水质传感 | 监测水质参数 |
| air | 空气传感 | 监测空气质量 |

## 取证校验码格式

```
EV-{随机字符(8位)}-{时间戳后6位}
```

示例: `EV-A3F2C1D9-103456`

## 预警等级

| 等级 | 标识 | 置信度 | 说明 |
|-----|-----|-------|------|
| critical | 紧急 | ≥85 | 自动推送，需立即处置 |
| warning | 警告 | 70-84 | 人工复核，优先处置 |
| info | 提示 | <70 | 仅记录，观察趋势 |

## SQL脚本执行顺序

1. `01_init.sql` - 创建数据库和表结构
2. `02_seed.sql` - 插入五大战区和设备种子数据
3. `03_rbac.sql` - 初始化用户和AI配置

## 索引优化建议

- `alerts`: 在 `level`, `status`, `zone_id`, `created_at` 上建立复合索引
- `tasks`: 在 `assigned_to`, `deadline`, `status` 上建立索引
- `devices`: 在 `zone_id`, `type`, `status` 上建立索引
- `evidence`: 在 `check_code`, `operator`, `alert_id` 上建立索引

## 安全建议

1. 生产环境请修改 `users` 表中默认密码
2. 定期备份 `system_logs` 表
3. 对敏感操作启用审计日志
4. 使用加密连接访问数据库
