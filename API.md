# 热眼擒枭 API 文档

> 版本: v2.0.0
> 基础路径: `/api/v1`
> 认证方式: Bearer Token (JWT)

---

## 认证接口

### 1. 用户登录

```
POST /api/v1/auth/login
```

**请求参数:**

```json
{
  "username": "string",
  "password": "string"
}
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-001",
      "username": "zhangwei",
      "name": "张伟",
      "role": "commander",
      "badge_number": "GX-001",
      "department": "崇左支队"
    }
  }
}
```

---

### 2. 获取当前用户信息

```
GET /api/v1/auth/me
```

**请求头:**

```
Authorization: Bearer <token>
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "user-001",
    "username": "zhangwei",
    "name": "张伟",
    "role": "commander",
    "permissions": ["alert:read", "task:manage", ...]
  }
}
```

---

### 3. 用户注册

```
POST /api/v1/auth/register
```

**请求参数:**

```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "badge_number": "string",
  "role": "frontline|investigator|commander",
  "department": "string"
}
```

---

### 4. 更新用户状态

```
PUT /api/v1/auth/update-status
```

**请求参数:**

```json
{
  "status": "active|inactive"
}
```

---

## 预警接口

### 1. 获取预警列表

```
GET /api/v1/alerts
```

**查询参数:**

| 参数 | 类型 | 说明 |
|-----|-----|-----|
| page | number | 页码，默认1 |
| limit | number | 每页条数，默认20 |
| level | string | 预警等级: critical/warning/info |
| status | string | 预警状态: pending/assigned/in_progress/resolved/ignored |
| zone_id | string | 战区ID |
| start_date | string | 开始日期 |
| end_date | string | 结束日期 |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "alert-001",
        "title": "友谊关红外触发 - 疑似穿山甲",
        "level": "critical",
        "type": "走私预警",
        "status": "pending",
        "confidence": 96,
        "species_type": "穿山甲",
        "sensor_type": "infrared",
        "location": "凭祥友谊关主通道",
        "latitude": 22.0145,
        "longitude": 106.7605,
        "created_at": "2026-04-04T10:25:00Z"
      }
    ],
    "total": 156,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

---

### 2. 创建预警

```
POST /api/v1/alerts
```

**请求参数:**

```json
{
  "title": "string",
  "description": "string",
  "level": "critical|warning|info",
  "type": "走私预警|生态预警|食药预警",
  "category": "string",
  "location": "string",
  "latitude": 22.0145,
  "longitude": 106.7605,
  "confidence": 85,
  "source": "device|manual|hotline"
}
```

**权限:** commander, investigator, admin

---

### 3. 获取预警详情

```
GET /api/v1/alerts/:id
```

---

### 4. 更新预警

```
PUT /api/v1/alerts/:id
```

**权限:** commander, investigator, admin

---

### 5. 分配预警

```
PUT /api/v1/alerts/:id/assign
```

**请求参数:**

```json
{
  "assignee_id": "user-001"
}
```

**权限:** commander, admin

---

### 6. 解决预警

```
PUT /api/v1/alerts/:id/resolve
```

**请求参数:**

```json
{
  "resolution_notes": "处理完成，嫌疑人已抓获"
}
```

**权限:** 所有登录用户

---

### 7. 忽略预警

```
PUT /api/v1/alerts/:id/ignore
```

**权限:** commander, investigator, admin

---

### 8. 预警统计

```
GET /api/v1/alerts/stats
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "total": 156,
    "critical": 12,
    "warning": 43,
    "info": 89,
    "pending": 45,
    "resolved_today": 23,
    "avg_resolution_time": 45.5
  }
}
```

---

## 任务接口

### 1. 获取任务列表

```
GET /api/v1/tasks
```

**查询参数:**

| 参数 | 类型 | 说明 |
|-----|-----|-----|
| page | number | 页码 |
| limit | number | 每页条数 |
| type | string | 任务类型 |
| status | string | 任务状态 |
| assigned_to | string | 负责人ID |

---

### 2. 创建任务

```
POST /api/v1/tasks
```

**请求参数:**

```json
{
  "title": "友谊关走私案件调查",
  "description": "对友谊关主通道的可疑情况进行调查",
  "type": "complete-sampling|quick-sampling|inspection|monitoring",
  "priority": "low|medium|high|urgent",
  "alert_id": "alert-001",
  "zone_id": "zone-001",
  "location": "凭祥友谊关主通道",
  "latitude": 22.0145,
  "longitude": 106.7605,
  "assigned_to": "user-003",
  "deadline": "2026-04-05T18:00:00Z"
}
```

---

### 3. 获取任务详情

```
GET /api/v1/tasks/:id
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "title": "友谊关走私案件调查",
    "type": "complete-sampling",
    "priority": "high",
    "status": "in_progress",
    "progress": 65,
    "location": "凭祥友谊关主通道",
    "assigned_to": {
      "id": "user-003",
      "name": "王强",
      "badge_number": "GX-003"
    },
    "evidence_list": ["evidence-001", "evidence-002"],
    "timeline": [
      { "time": "2026-04-04T08:00:00Z", "action": "任务创建" },
      { "time": "2026-04-04T08:15:00Z", "action": "开始执行" }
    ],
    "created_at": "2026-04-04T08:00:00Z",
    "deadline": "2026-04-05T18:00:00Z"
  }
}
```

---

### 4. 更新任务进度

```
PUT /api/v1/tasks/:id/progress
```

**请求参数:**

```json
{
  "progress": 75,
  "notes": "已完成现场勘查，正在整理证据"
}
```

---

### 5. 完成任务

```
PUT /api/v1/tasks/:id/complete
```

**请求参数:**

```json
{
  "completion_notes": "任务完成，已上传3份取证记录"
}
```

---

## 设备接口

### 1. 获取设备列表

```
GET /api/v1/devices
```

**查询参数:**

| 参数 | 类型 | 说明 |
|-----|-----|-----|
| type | string | 设备类型 |
| status | string | 设备状态 |
| zone_id | string | 战区ID |

---

### 2. 创建设备

```
POST /api/v1/devices
```

**请求参数:**

```json
{
  "device_id": "GX-IR-201",
  "name": "友谊关红外相机A",
  "type": "infrared|vibration|visible|gps|drone|smell|water|air",
  "zone_id": "zone-001",
  "location": "友谊关主通道",
  "latitude": 22.0145,
  "longitude": 106.7605,
  "sensitivity": 85,
  "manufacturer": "海康威视",
  "model": "DS-2TD8167"
}
```

---

### 3. 设备心跳

```
POST /api/v1/devices/:id/heartbeat
```

**请求参数:**

```json
{
  "battery": 72,
  "signal": 95,
  "latitude": 22.0145,
  "longitude": 106.7605
}
```

---

### 4. 更新设备灵敏度

```
PUT /api/v1/devices/:id/sensitivity
```

**请求参数:**

```json
{
  "sensitivity": 75
}
```

---

## 取证接口

### 1. 上传播证记录

```
POST /api/v1/evidence/upload
Content-Type: multipart/form-data
```

**表单参数:**

| 参数 | 类型 | 说明 |
|-----|-----|-----|
| evidence_image | file | 取证图片/视频文件 |
| check_code | string | 防伪校验码 |
| capture_time | string | 采集时间 |
| latitude | number | 纬度 |
| longitude | number | 经度 |
| operator | string | 执法人员 |
| alert_id | string | 关联预警ID |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "evidence-001",
    "check_code": "EV-A3F2C1D9-103456",
    "file_path": "/uploads/evidence/xxx.jpg",
    "capture_time": "2026-04-04T10:25:36Z",
    "sync_status": "synced"
  }
}
```

---

### 2. 获取取证列表

```
GET /api/v1/evidence
```

**查询参数:**

| 参数 | 类型 | 说明 |
|-----|-----|-----|
| page | number | 页码 |
| limit | number | 每页条数 |
| alert_id | string | 预警ID |
| status | string | 同步状态 |

---

### 3. 防伪校验

```
GET /api/v1/evidence/:id/verify
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "check_code": "EV-A3F2C1D9-103456",
    "is_valid": true,
    "file_integrity": "完整",
    "watermark_valid": true,
    "capture_time": "2026-04-04T10:25:36Z",
    "operator": "王强",
    "message": "防伪校验通过，证据未被篡改"
  }
}
```

---

## 统计接口

### 1. 仪表盘数据

```
GET /api/v1/stats/dashboard
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "alerts": { "total": 156, "critical": 12, "warning": 43, "pending": 89 },
    "tasks": { "total": 78, "in_progress": 23, "completed": 45, "pending": 10 },
    "devices": { "total": 87, "online": 72, "warning": 10, "offline": 5 },
    "evidence": { "total": 234, "synced": 216, "pending": 18 }
  }
}
```

---

### 2. 趋势数据

```
GET /api/v1/stats/trend
```

**查询参数:**

| 参数 | 类型 | 说明 |
|-----|-----|-----|
| days | number | 天数，默认7 |

---

### 3. 物种分析

```
GET /api/v1/stats/species
```

---

### 4. 绩效统计

```
GET /api/v1/stats/performance
```

---

### 5. 战区统计

```
GET /api/v1/stats/zones
```

---

## GIS接口

### 1. 获取战区列表

```
GET /api/v1/gis/zones
```

---

### 2. 获取界碑列表

```
GET /api/v1/gis/border-markers
```

**查询参数:**

| 参数 | 类型 | 说明 |
|-----|-----|-----|
| zone_id | string | 战区ID |

---

### 3. 获取走私热点

```
GET /api/v1/gis/hotspots
```

---

## 错误码

| 错误码 | 说明 |
|-------|------|
| 400 | 请求参数错误 |
| 401 | 未授权/令牌过期 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 注意事项

1. 所有需要认证的接口，都需要在请求头中携带 `Authorization: Bearer <token>`
2. 请求Content-Type为 `application/json`
3. 日期格式使用 ISO 8601 标准: `YYYY-MM-DDTHH:mm:ssZ`
4. 位置坐标使用 WGS-84 坐标系
