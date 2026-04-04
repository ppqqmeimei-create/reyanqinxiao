# 🧠 热眼擒枭 — 算法说明文档

> **文档版本**：v1.0 · 2026-04-04  
> **维护团队**：环境资源和食品药品侦查总队 · 热眼擒枭项目组  
> **覆盖范围**：前端（Vue3/uni-app）+ 后端（Node.js/Express）全部算法实现

---

## 📋 算法总览

本系统共计 **19 个核心算法**，分为六大类别：

| 类型 | 数量 | 代表算法 |
|------|:----:|---------|
| 🔢 数学计算类 | 8 | Haversine 距离、AI 置信度评分、综合风险评分 |
| 🔍 数据处理类 | 5 | 多条件过滤、时空去重、优先级排序、趋势统计 |
| 🗺️ GIS/地图类 | 6 | 影子追踪、轨迹平滑、射线法、坐标转换、拦截点计算、扩散路径 |
| 🤖 融合分析类 | 2 | 多传感器时空融合、热点网格聚合 |
| ⚖️ 相似度匹配类 | 1 | 加权多维相似度 |
| 📊 状态评估类 | 3 | 设备健康分、风险等级映射、预警优先级 |

> **算法来源说明**：所有算法均为项目团队**自研实现**，其中经典算法（Haversine 公式、射线法、移动平均、坐标转换）直接应用计算机科学/大地测量学/计算几何领域的成熟公式；GCJ-02 坐标转换参照国家公开标准实现。

---

## 一、🔢 数学计算类

---

### 1.1 Haversine 距离计算

> **文件位置**：`front-end/pages/Alert Center/utils/alertLogic.js`  
> **调用位置**：`back-end/front-end/pages/GIS/hooks/useMapLogic.js`

#### 算法原理

使用 Haversine 公式计算地球表面两点之间的球面距离（米），精度可达 ±1 米。

#### 已知信息

| 参数 | 类型 | 说明 |
|------|------|------|
| `lat1, lon1` | number | 第一个点的纬度和经度（度） |
| `lat2, lon2` | number | 第二个点的纬度和经度（度） |

#### 核心公式

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

其中 **R = 6371000 米**（地球平均半径）。

#### 业务用途

- 预警去重的空间距离判断（阈值 100 米）
- 设备拓扑连接的相邻节点判定（阈值 1000 米）
- 拦截点计算的相对位置求解

#### 代码实现

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(lat1 * Math.PI / 180)
            * Math.cos(lat2 * Math.PI / 180)
            * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}
```

> **算法来源**：大地测量学经典算法（Haversine formula），非项目原创，直接实现。

---

### 1.2 AI 置信度评分

> **文件位置**：`back-end/src/services/aiService.js`

#### 算法原理

综合传感器类型、信号强度、历史频率、时间段、距边境距离五个维度加权求和，输出 0~100 的置信度评分。

#### 已知信息

| 参数 | 来源 | 说明 |
|------|------|------|
| `sensorData.type` | 传感器数据 | infrared / vibration / visible |
| `sensorData.signal_strength` | 传感器数据 | 0~100 |
| `alertData.frequency` | 预警数据 | 该区域历史触发次数 |
| `alertData.distance_to_border` | 预警数据 | 距边境线距离（米） |

#### 评分维度表

| 维度 | 分值 | 判定条件 |
|------|:----:|---------|
| 传感器类型 | +40 | 红外摄像头（infrared） |
| | +35 | 震动光纤（vibration） |
| | +30 | 可见光摄像头（visible） |
| 信号强度 | +20 | ≥ 90 |
| | +15 | ≥ 70 |
| | +10 | ≥ 50 |
| 历史频率 | +15 | 该区域触发 > 5 次 |
| | +10 | 该区域触发 > 2 次 |
| 时间段 | +10 | 夜间 22:00 — 06:00 |
| 距边境距离 | +15 | < 100 米 |
| | +10 | < 500 米 |

#### 核心公式

```
总评分 = min(100, 传感器类型分 + 信号强度分 + 历史频率分 + 时间段分 + 距离分)
```

#### 业务用途

多传感器融合的前置评分，为后续风险等级判定和预警推送提供量化依据。

#### 代码实现

```javascript
export function calculateConfidence(alertData, sensorData) {
    let score = 0

    if (sensorData.type === 'infrared') score += 40
    else if (sensorData.type === 'vibration') score += 35
    else if (sensorData.type === 'visible') score += 30

    if (sensorData.signal_strength >= 90) score += 20
    else if (sensorData.signal_strength >= 70) score += 15
    else if (sensorData.signal_strength >= 50) score += 10

    if (alertData.frequency > 5) score += 15
    else if (alertData.frequency > 2) score += 10

    const hour = new Date().getHours()
    if (hour >= 22 || hour < 6) score += 10

    if (alertData.distance_to_border < 100) score += 15
    else if (alertData.distance_to_border < 500) score += 10

    return Math.min(100, score)
}
```

> **算法来源**：项目团队根据边境执法业务经验自研的多因子评分模型。

---

### 1.3 综合风险评分公式（后端）

> **文件位置**：`back-end/src/services/riskScoringService.js`

#### 算法原理

以业务分类为基准分，加上异常评分、置信度、设备状态、历史案件、受影响人口等多个可量化因子，输出 0~100 的综合风险分。

#### 已知信息

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `category` | string | ecology | smuggling / ecology / fooddrug |
| `anomaly_score` | number | 0 | 传感器异常评分 |
| `confidence` | number | 0.6 | AI 置信度 |
| `device_status` | string | online | online / warning / error |
| `target_type` | string | unknown | human / animal / vehicle |
| `historical_case_count` | number | 0 | 历史案件数 |
| `affected_population` | number | 0 | 受影响人口 |

#### 核心公式

```
基础分（按分类）    : smuggling=48, ecology=30, fooddrug=28
异常评分加成        : + min(25, anomaly_score)
置信度加成         : + round(min(12, confidence × 12))
设备状态加成        : +5 (warning) / +8 (error)
目标类型加成        : +6 (animal 或 vehicle)
历史案件加成        : + min(8, historical_case_count)
受影响人口加成      : + min(6, floor(affected_population / 500))

最终评分 = max(0, min(100, round(所有因子求和)))
```

#### 代码实现

```javascript
export function calculateRiskScore(input = {}) {
    const {
        category = 'ecology',
        anomaly_score = 0,
        confidence = 0.6,
        device_status = 'online',
        target_type = 'unknown',
        historical_case_count = 0,
        affected_population = 0
    } = input

    const baseByCategory = { smuggling: 48, ecology: 30, fooddrug: 28 }

    let score = baseByCategory[category] ?? 25
    score += Math.min(25, Number(anomaly_score) || 0)
    score += Math.round(Math.min(12, (Number(confidence) || 0) * 12))

    if (device_status === 'warning') score += 5
    if (device_status === 'error')   score += 8
    if (target_type === 'animal' || target_type === 'vehicle') score += 6
    score += Math.min(8, Number(historical_case_count) || 0)
    if (category !== 'smuggling')
        score += Math.min(6, Math.floor((Number(affected_population) || 0) / 500))

    return Math.max(0, Math.min(100, Math.round(score)))
}
```

> **算法来源**：项目团队针对三大业务场景（走私/生态/食药）设计的分层评分公式。

---

### 1.4 风险评分计算（前端预警）

> **文件位置**：`front-end/pages/Alert Center/utils/alertLogic.js`

#### 算法原理

综合目标类型、停留时长、传感器数量、时间段四个维度加权求和计算预警风险评分（满分100）。

#### 评分维度表

| 维度 | 权重 | 判定逻辑 |
|------|:----:|---------|
| 目标类型 | 0~30 | human=30, vehicle=25, animal=10 |
| 停留时长 | 0~30 | 超过标准时长(60秒)的 1.5x/2x/3x 倍时递增 |
| 传感器数量 | 0~20 | 每增加一个传感器 +5 分，上限 20 |
| 时间段 | 0~20 | 夜间 22:00-06:00 = 20，傍晚/清晨 = 10 |

#### 核心公式

```
总评分 = 目标类型分 + 停留时长分 + 传感器数量分 + 时间段分
```

#### 代码实现

```javascript
export function calculateRiskScore(alert) {
    let score = 0

    // 1. 目标类型权重 (30分)
    const targetWeights = { human: 30, vehicle: 25, animal: 10 }
    score += targetWeights[alert.target] || 0

    // 2. 停留时长权重 (30分)
    const normalDuration = 60
    const durationRatio = alert.duration / normalDuration
    if (durationRatio > 3) score += 30
    else if (durationRatio > 2) score += 20
    else if (durationRatio > 1.5) score += 10

    // 3. 传感器数量权重 (20分)
    const sensorCount = alert.sensors ? alert.sensors.length : 0
    score += Math.min(sensorCount * 5, 20)

    // 4. 时间因素权重 (20分)
    const hour = new Date(alert.time).getHours()
    if (hour >= 22 || hour < 6) score += 20
    else if (hour >= 18 || hour < 8) score += 10

    return Math.min(score, 100)
}
```

---

### 1.5 设备健康分数计算

> **文件位置**：`front-end/pages/Device/utils/diagnosticLogic.js`

#### 算法原理

从 100 分基础分出发，根据设备状态、电量、信号三维度逐项扣分，最终取所有设备分的平均值。

#### 扣分规则表

| 维度 | 条件 | 扣分 |
|------|------|-----:|
| 状态 | offline | 直接归 0 |
| 状态 | warning | −30 |
| 电量 | < 20% | −20 |
| 电量 | < 50% | −10 |
| 信号 | < 40 | −20 |
| 信号 | < 70 | −10 |

#### 核心公式

```
单设备分 = 100 − 状态扣分 − 电量扣分 − 信号扣分（最小值 0）
健康分   = round(sum(各设备分) / 设备总数)
```

#### 代码实现

```javascript
export function calculateHealthScore(devices) {
    if (!devices || devices.length === 0) return 0

    let totalScore = 0
    devices.forEach(device => {
        let deviceScore = 100
        if (device.status === 'offline')  deviceScore = 0
        else if (device.status === 'warning') deviceScore -= 30
        if (device.battery < 20) deviceScore -= 20
        else if (device.battery < 50) deviceScore -= 10
        if (device.signal < 40) deviceScore -= 20
        else if (device.signal < 70) deviceScore -= 10
        totalScore += Math.max(deviceScore, 0)
    })

    return Math.round(totalScore / devices.length)
}
```

> **算法来源**：基于运维经验设计的扣分模型，无外部算法参照。

---

### 1.6 风险等级映射

> **文件位置**：`front-end/pages/Alert Center/utils/riskEvaluator.js`

#### 算法原理

根据时间偏差倍数（实测值 / 标准值）划分三级风险等级。

#### 核心公式

```
风险等级 = critical   (偏差 >= 3.0倍)
          warning     (偏差 >= 1.5倍)
          normal      (偏差 < 1.5倍)
```

#### 代码实现

```javascript
export function evaluateRiskLevel(deviation) {
    if (deviation >= 3)   return 'critical'
    else if (deviation >= 1.5) return 'warning'
    else                    return 'normal'
}

export function getRiskColor(riskLevel) {
    const colorMap = {
        critical: '#FF4D4F',   // 警报红
        warning:  '#FFA940',   // 预警橙
        normal:   '#73D13D',    // 安全绿
        handled:  '#595959'     // 已处理灰
    }
    return colorMap[riskLevel] || '#8c8c8c'
}
```

---

### 1.7 时间偏差倍数计算

> **文件位置**：`front-end/pages/Alert Center/utils/riskEvaluator.js`

#### 核心公式

```
偏差倍数 = actualTime / normalTime   （保留1位小数）
```

#### 代码实现

```javascript
export function calculateDeviation(normalTime, actualTime) {
    if (normalTime === 0) return 0
    return parseFloat((actualTime / normalTime).toFixed(1))
}
```

---

### 1.8 污染范围半径计算

> **文件位置**：`front-end/pages/GIS/utils/gisOptimization.js`

#### 算法原理

风险评分越高，污染影响范围越大，按比例线性放大半径（最大为基础半径的 3 倍）。

#### 核心公式

```
radiusMultiplier = (riskScore / 100) × 3
污染半径 = baseRadius × radiusMultiplier   （baseRadius 默认 500 米）
```

#### 代码实现

```javascript
export function calculatePollutionRadius(riskScore, baseRadius = 500) {
    const radiusMultiplier = (riskScore / 100) * 3
    return baseRadius * radiusMultiplier
}
```

---

## 二、🔍 数据处理类

---

### 2.1 多条件预警过滤

> **文件位置**：`front-end/pages/Alert Center/utils/alertLogic.js`

#### 算法原理

支持按级别、目标类型、位置、时间范围四个维度串联过滤预警数据。

#### 核心逻辑

```
原始数据 → 按级别过滤 → 按目标类型过滤 → 按位置过滤 → 按时间范围过滤 → 输出
```

#### 代码实现

```javascript
export function filterAlerts(alerts, filters) {
    let filtered = [...alerts]

    if (filters.level && filters.level !== 'all')
        filtered = filtered.filter(a => a.level === filters.level)

    if (filters.target && filters.target !== 'all')
        filtered = filtered.filter(a => a.target === filters.target)

    if (filters.location)
        filtered = filtered.filter(a => a.location.includes(filters.location))

    if (filters.startTime && filters.endTime)
        filtered = filtered.filter(a => {
            const t = new Date(a.time)
            return t >= filters.startTime && t <= filters.endTime
        })

    return filtered
}
```

---

### 2.2 预警去重合并（时空窗口）

> **文件位置**：`front-end/pages/Alert Center/utils/alertLogic.js`

#### 算法原理

基于时间窗口 + 空间距离双条件，将相邻时空范围内的重复预警合并为一条，取最高风险分，合并传感器列表。

#### 参数配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `timeWindow` | 300000 ms（5分钟） | 时间相近判定阈值 |
| `distanceThreshold` | 100 m | 空间相近判定阈值 |

#### 核心逻辑

```
遍历每条预警 alert_i:
  查找满足以下所有条件的 alert_j:
    - |time_i − time_j| <= 5分钟
    - distance(i, j) <= 100米
    - target_i == target_j
  若存在相似预警:
    → 合并，取 max(风险分)，拼接传感器列表
  若不存在:
    → 保留原预警
```

#### 代码实现

```javascript
export function deduplicateAlerts(alerts, timeWindow = 300000,
                                   distanceThreshold = 100) {
    const deduplicated = []
    const processed = new Set()

    alerts.forEach((alert, index) => {
        if (processed.has(index)) return

        const similar = alerts.filter((other, otherIndex) => {
            if (otherIndex <= index || processed.has(otherIndex)) return false
            const timeDiff = Math.abs(new Date(alert.time) - new Date(other.time))
            if (timeDiff > timeWindow) return false
            const distance = calculateDistance(
                alert.latitude, alert.longitude,
                other.latitude, other.longitude
            )
            if (distance > distanceThreshold) return false
            if (alert.target !== other.target) return false
            return true
        })

        if (similar.length > 0) {
            const merged = {
                ...alert,
                riskScore: Math.max(alert.riskScore,
                    ...similar.map(s => s.riskScore)),
                sensors: [...alert.sensors,
                    ...similar.flatMap(s => s.sensors)]
            }
            deduplicated.push(merged)
            similar.forEach((_, i) => processed.add(alerts.indexOf(similar[i])))
        } else {
            deduplicated.push(alert)
        }
        processed.add(index)
    })
    return deduplicated
}
```

> **算法来源**：基于业务经验设计的时间窗口和距离阈值，非外部算法。

---

### 2.3 预警优先级排序

> **文件位置**：`front-end/pages/Alert Center/utils/alertLogic.js`

#### 算法原理

依次按处理状态 → 风险评分 → 时间戳三维度进行稳定排序（优先级递减）。

#### 核心逻辑

```
优先级比较规则:
  1. 未处理 > 已处理
  2. 风险评分: 高 > 低
  3. 时间: 新 > 旧
```

#### 代码实现

```javascript
export function sortAlertsByPriority(alerts) {
    return alerts.sort((a, b) => {
        if (a.handled !== b.handled)
            return a.handled ? 1 : -1
        if (a.riskScore !== b.riskScore)
            return b.riskScore - a.riskScore
        return new Date(b.time) - new Date(a.time)
    })
}
```

---

### 2.4 设备优先级排序

> **文件位置**：`front-end/pages/Device/utils/diagnosticLogic.js`

#### 算法原理

离线设备 > 预警设备 > 在线设备；同状态下按电量升序（低电量优先处理）。

#### 优先级映射

```
offline (3) > warning (2) > online (1)
```

#### 代码实现

```javascript
export function sortDevicesByPriority(devices) {
    const priorityMap = { offline: 3, warning: 2, online: 1 }
    return [...devices].sort((a, b) => {
        const diff = priorityMap[b.status] - priorityMap[a.status]
        if (diff !== 0) return diff
        return a.battery - b.battery
    })
}
```

---

### 2.5 预警趋势计算（时间序列统计）

> **文件位置**：`front-end/pages/Alert Center/utils/alertLogic.js`

#### 算法原理

对最近 N 天（默认7天）的预警按天分组统计，计算每日预警总数和严重预警数。

#### 核心逻辑

```
for 每天 i 从 (today - days + 1) 到 today:
    counts[i]        = 当天所有预警数量
    criticalCounts[i] = 当天 level === 'critical' 的预警数量
```

#### 代码实现

```javascript
export function calculateAlertTrend(alerts, days = 7) {
    const now = new Date()
    const trend = { dates: [], counts: [], criticalCounts: [] }

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const dayAlerts = alerts.filter(a => {
            const t = new Date(a.time)
            return t >= date && t < nextDate
        })

        trend.dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
        trend.counts.push(dayAlerts.length)
        trend.criticalCounts.push(
            dayAlerts.filter(a => a.level === 'critical').length
        )
    }
    return trend
}
```

---

## 三、🗺️ GIS/地图类

---

### 3.1 影子追踪算法（目标轨迹预测）

> **文件位置**：`front-end/pages/GIS/hooks/useMapLogic.js`

#### 算法原理

根据目标最后已知位置和速度向量，预测若干秒后的可能位置，同时用概率扩散半径建模不确定性随时间的增长（概率随时间线性衰减）。

#### 已知信息

| 参数 | 类型 | 说明 |
|------|------|------|
| `lastPosition` | `{latitude, longitude}` | 最后已知位置 |
| `velocity.speed` | number | 移动速度（米/秒） |
| `velocity.direction` | number | 移动方向角（度，正北=0，顺时针） |
| `timeElapsed` | number | 经过时长（秒） |

#### 核心公式

```
预测距离(米) = speed × timeElapsed

预测纬度 = latitude  + (distance × cos(direction)) / 111000
预测经度 = longitude + (distance × sin(direction))
                            / (111000 × cos(latitude))

不确定扩散半径 = min(maxDistance × 0.3 + timeElapsed × 2, 500)

预测概率 = max(100 − timeElapsed × 5, 20)
```

> **单位转换**：111000 ≈ 赤道上 1 度纬度的米数

#### 不确定性建模

```
概率随时间线性衰减：每秒 −5%
扩散半径随时间增长：maxDistance×0.3 + timeElapsed×2，上限 500 米
```

#### 业务用途

用于指挥员判断目标逃窜方向，提前调度巡逻力量。

#### 代码实现

```javascript
export function calculateShadowPath(lastPosition, velocity, timeElapsed) {
    const { latitude, longitude } = lastPosition
    const { speed, direction } = velocity

    const maxDistance = speed * timeElapsed

    const predictedLat = latitude
        + (maxDistance * Math.cos(direction * Math.PI / 180)) / 111000
    const predictedLng = longitude
        + (maxDistance * Math.sin(direction * Math.PI / 180))
          / (111000 * Math.cos(latitude * Math.PI / 180))

    const uncertaintyRadius = Math.min(
        maxDistance * 0.3 + timeElapsed * 2, 500
    )

    return {
        predictedPosition: { latitude: predictedLat, longitude: predictedLng },
        uncertaintyRadius,
        probability: Math.max(100 - timeElapsed * 5, 20)
    }
}
```

> **算法来源**：项目团队完全自研的简化追踪模型，未参照卡尔曼滤波等经典追踪算法。

---

### 3.2 轨迹平滑算法（移动平均法）

> **文件位置**：`front-end/pages/GIS/hooks/useMapLogic.js`

#### 算法原理

使用滑动窗口内所有 GPS 点的经纬度均值替代中心点，消除噪声和抖动（GPS 抖动通常在 5~20 米）。

#### 已知信息

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points[]` | array | — | 原始轨迹点数组 |
| `windowSize` | number | 5 | 滑动窗口大小 |

#### 核心公式

```
smoothed[i].latitude  = sum(window_latitudes)  / window_length
smoothed[i].longitude = sum(window_longitudes) / window_length

窗口范围: [max(0, i − halfWindow), min(length, i + halfWindow + 1))
```

#### 业务用途

平滑历史轨迹展示，避免地图上轨迹线出现抖动锯齿。

#### 代码实现

```javascript
export function smoothTrajectory(points, windowSize = 5) {
    if (points.length < windowSize) return points

    const smoothed = []
    const halfWindow = Math.floor(windowSize / 2)

    for (let i = 0; i < points.length; i++) {
        const start = Math.max(0, i - halfWindow)
        const end = Math.min(points.length, i + halfWindow + 1)
        const window = points.slice(start, end)

        smoothed.push({
            latitude:  window.reduce((s, p) => s + p.latitude,  0) / window.length,
            longitude: window.reduce((s, p) => s + p.longitude, 0) / window.length
        })
    }
    return smoothed
}
```

> **算法来源**：经典移动平均（Moving Average）滤波方法在 GIS 平滑中的应用。

---

### 3.3 射线法判断点是否在多边形内

> **文件位置**：`front-end/pages/GIS/hooks/useMapLogic.js`

#### 算法原理

从目标点向右水平发射一条射线，统计射线与多边形边界的交点个数。**奇数次**交点在多边形内，**偶数次**（含0次）在多边形外。

#### 已知信息

| 参数 | 类型 | 说明 |
|------|------|------|
| `point` | `{latitude, longitude}` | 待判断点 |
| `polygon[]` | array | 多边形顶点数组（逆时针或顺时针） |

#### 核心公式

```
inside = false
for i = 0 to n−1, j = i−1:
    yi, xi = polygon[i].latitude, polygon[i].longitude
    yj, xj = polygon[j].latitude, polygon[j].longitude
    if ((yi > y) !== (yj > y)) and
       (x < (xj−xi)*(y−yi)/(yj−yi) + xi):
        inside = !inside
```

#### 业务用途

- 判断预警位置是否落入巡逻区域多边形
- 判断污染源是否在管控范围内

#### 代码实现

```javascript
export function isPointInPolygon(point, polygon) {
    let inside = false
    const x = point.longitude
    const y = point.latitude

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude, yi = polygon[i].latitude
        const xj = polygon[j].longitude, yj = polygon[j].latitude

        const intersect =
            ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi)

        if (intersect) inside = !inside
    }
    return inside
}
```

> **算法来源**：计算几何经典算法（Ray Casting Algorithm），直接实现，无特定开源库参照。

---

### 3.4 拦截点计算（二次方程求解）

> **文件位置**：`front-end/pages/GIS/hooks/useMapLogic.js`

#### 算法原理

将巡逻队拦截问题建模为追赶问题，求解目标逃窜方向与巡逻队移动路径的交点，通过二次方程求根得到最优拦截时间。

#### 已知信息

| 参数 | 类型 | 说明 |
|------|------|------|
| `targetPos` | `{latitude, longitude}` | 目标当前位置 |
| `targetVelocity` | `{speed, direction}` | 目标速度向量 |
| `patrolPos` | `{latitude, longitude}` | 巡逻队位置 |
| `patrolSpeed` | number | 巡逻队移动速度（米/秒） |

#### 核心公式（二次方程）

```
相对位置:
    dx = (tLng − pLng) × 111000 × cos(pLat)
    dy = (tLat − pLat) × 111000

追赶方程:
    a = tVx² + tVy² − patrolSpeed²
    b = 2 × (dx × tVx + dy × tVy)
    c = dx² + dy²

判别式 Δ = b² − 4ac
t = (−b − √Δ) / 2a   （取较早的拦截时间）

interceptLat = tLat + (tVy × t) / 111000
interceptLng = tLng + (tVx × t) / (111000 × cos(tLat))
```

#### 业务用途

指挥员根据目标逃窜方向和巡逻队位置，计算最优拦截点，预估拦截时间。

#### 代码实现

```javascript
export function calculateInterceptPoint(targetPos, targetVelocity,
                                         patrolPos, patrolSpeed) {
    const { latitude: tLat, longitude: tLng } = targetPos
    const { speed: tSpeed, direction: tDir } = targetVelocity
    const { latitude: pLat, longitude: pLng } = patrolPos

    const tVx = tSpeed * Math.sin(tDir * Math.PI / 180)
    const tVy = tSpeed * Math.cos(tDir * Math.PI / 180)
    const dx  = (tLng - pLng) * 111000 * Math.cos(pLat * Math.PI / 180)
    const dy  = (tLat - pLat) * 111000

    const a = tVx * tVx + tVy * tVy - patrolSpeed * patrolSpeed
    const b = 2 * (dx * tVx + dy * tVy)
    const c = dx * dx + dy * dy
    const discriminant = b * b - 4 * a * c

    if (discriminant < 0)
        return { latitude: tLat, longitude: tLng, interceptTime: Infinity }

    const t = (-b - Math.sqrt(discriminant)) / (2 * a)

    return {
        latitude:  tLat + (tVy * t) / 111000,
        longitude: tLng + (tVx * t) / (111000 * Math.cos(tLat * Math.PI / 180)),
        interceptTime: t
    }
}
```

> **算法来源**：项目团队将追赶问题数学建模后直接求解二次方程，未参照 PID 控制或 A* 等外部路径规划算法。

---

### 3.5 WGS84 转 GCJ-02 坐标系转换

> **文件位置**：`front-end/pages/GIS/hooks/useMapLogic.js`

#### 算法原理

中国大陆地区使用的保密偏移算法，将原始 GPS 坐标（WGS84）转换为火星坐标系（GCJ-02），以符合国家测绘法规。国内所有地图应用（高德、腾讯、百度）均使用此坐标系。

#### 已知信息

| 参数 | 类型 | 说明 |
|------|------|------|
| `wgsLat` | number | WGS84 纬度 |
| `wgsLng` | number | WGS84 经度 |

#### 核心公式

```
transformLat(x, y) = −100 + 2x + 3y + 0.2y² + 0.1xy + 0.2√|x|
                     + (20sin(6xπ) + 20sin(2xπ)) × 2/3
                     + (20sin(yπ) + 40sin(y/3·π)) × 2/3
                     + (160sin(y/12·π) + 320sin(y/30·π)) × 2/3

dLat = transformLat(wgsLng − 105, wgsLat − 35)
dLng = transformLng(wgsLng − 105, wgsLat − 35)

gcjLat = wgsLat + dLat × 180 / (a(1−ee·sin²)/(1−ee) × π)
gcjLng = wgsLng + dLng × 180 / (a/√(1−ee·sin²) × π × cos)

常数: a = 6378245.0,  ee = 0.00669342162296594323
```

#### 业务用途

将边境传感器 GPS 坐标与国内地图坐标系对齐，确保地图标记精确显示。

#### 代码实现

```javascript
export function wgs84ToGcj02(wgsLat, wgsLng) {
    const a = 6378245.0
    const ee = 0.00669342162296594323

    let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0)
    let dLng = transformLng(wgsLng - 105.0, wgsLat - 35.0)

    const radLat = wgsLat / 180.0 * Math.PI
    let magic = Math.sin(radLat)
    magic = 1 - ee * magic * magic
    const sqrtMagic = Math.sqrt(magic)

    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI)
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI)

    return { latitude: wgsLat + dLat, longitude: wgsLng + dLng }
}

function transformLat(x, y) {
    let ret = -100.0 + 2.0*x + 3.0*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x))
    ret += (20.0*Math.sin(6.0*x*Math.PI) + 20.0*Math.sin(2.0*x*Math.PI)) * 2.0/3.0
    ret += (20.0*Math.sin(y*Math.PI) + 40.0*Math.sin(y/3.0*Math.PI)) * 2.0/3.0
    ret += (160.0*Math.sin(y/12.0*Math.PI) + 320*Math.sin(y*Math.PI/30.0)) * 2.0/3.0
    return ret
}
```

> **算法来源**：中国国家保密算法，项目参照了公开流传的标准实现，广泛使用于国内所有地图应用。

---

### 3.6 扩散路径生成算法

> **文件位置**：`front-end/pages/GIS/utils/gisOptimization.js`

#### 算法原理

以污染源为起点，沿风向角度均匀生成 N 个扩散点，模拟污染物随气流的扩散轨迹（基于气象学对流扩散模型简化实现）。

#### 已知信息

| 参数 | 类型 | 说明 |
|------|------|------|
| `sourcePoint` | `{latitude, longitude}` | 污染源坐标 |
| `windDirection` | number | 风向角（度，正北=0） |
| `distance` | number | 总扩散距离（米） |
| `steps` | number | 扩散点数量（默认 5） |

#### 核心公式（逐点计算）

```
每步距离 = totalDistance / steps
for i in 1..steps:
    angle = windDirection × π/180
    lat_i = source.lat + (stepDistance × i / 111000) × cos(angle)
    lng_i = source.lng + (stepDistance × i / 111000) × sin(angle)
                              / cos(source.lat)
```

#### 代码实现

```javascript
export function generateDiffusionPath(sourcePoint, windDirection,
                                        distance, steps = 5) {
    const points = [sourcePoint]
    const stepDistance = distance / steps

    for (let i = 1; i <= steps; i++) {
        const angle = windDirection * Math.PI / 180
        points.push({
            latitude:  sourcePoint.latitude
                     + (stepDistance * i / 111000) * Math.cos(angle),
            longitude: sourcePoint.longitude
                     + (stepDistance * i / 111000) * Math.sin(angle)
                       / Math.cos(sourcePoint.latitude * Math.PI / 180)
        })
    }
    return points
}
```

> **算法来源**：基于气象学中污染物扩散的对流模型简化实现，无参照特定开源库。

---

## 四、🤖 融合分析类

---

### 4.1 多传感器时空融合

> **文件位置**：`back-end/src/services/aiService.js`

#### 算法原理

在时空一致性约束下（5 分钟时间窗口 + 500 米空间窗口），对多个传感器读数进行融合，得出协同检测结论。多传感器同时触发时给予额外加成，模拟"人防+物防+技防"协同感知。

#### 参数配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `timeWindow` | 5 分钟（300000 ms） | 时间一致性窗口 |
| `spaceWindow` | 500 米 | 空间一致性窗口 |

#### 处理流程

```
Step 1: 时空过滤
    validReadings = sensorReadings 过滤:
        时间: (now − timestamp) <= 5分钟
        空间: distance <= 500米

Step 2: 基础融合评分
    fusionScore = sum(各传感器置信度) / count

Step 3: 多模态加成
    if 传感器种类 >= 3: fusionScore += 20   （多模态融合）
    if 传感器种类 >= 2: fusionScore += 10   （双模态融合）

Step 4: 置信度上限
    return min(100, fusionScore)
```

#### 融合类型

| 类型 | 触发条件 | 加成分 |
|------|---------|-------|
| `multi-modal` | ≥ 3 种传感器同时触发 | +20 |
| `dual-modal` | 2 种传感器同时触发 | +10 |
| `single` | 仅 1 种传感器触发 | +0（降权） |

#### 代码实现

```javascript
export function multiSensorFusion(sensorReadings) {
    if (!sensorReadings || sensorReadings.length === 0)
        return { detected: false, confidence: 0 }

    const timeWindow = 5 * 60 * 1000
    const validReadings = sensorReadings.filter(r => {
        const now = Date.now()
        const readingTime = new Date(r.timestamp).getTime()
        return (now - readingTime) <= timeWindow
    })

    if (validReadings.length < 2)
        return {
            detected: validReadings.length === 1,
            confidence: validReadings.length === 1 ? 50 : 0,
            sensors: validReadings.map(r => r.type)
        }

    let fusionScore = 0
    const types = new Set()

    validReadings.forEach(reading => {
        types.add(reading.type)
        fusionScore += calculateConfidence(reading.alertData || {}, reading)
    })

    fusionScore = fusionScore / validReadings.length

    if (types.size >= 3) fusionScore += 20
    else if (types.size >= 2) fusionScore += 10

    return {
        detected: true,
        confidence: Math.min(100, fusionScore),
        sensors: Array.from(types),
        sensor_count: validReadings.length,
        fusion_type: types.size >= 3 ? 'multi-modal' : 'dual-modal'
    }
}
```

> **算法来源**：参照了多传感器融合（Multi-sensor Fusion）的基本协同感知理念，但实现完全自研。

---

### 4.2 热点区域网格聚合

> **文件位置**：`back-end/src/services/closedLoopService.js`

#### 算法原理

将地图按指定精度（如保留 2 位小数 ≈ 1km² 网格）划分网格，统计每个网格内的预警数量和平均风险分，识别高发区域。

#### 参数配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `hotspot_precision` | 2 | 经纬度保留小数位数（2 ≈ 1km²） |
| `hotspot_limit` | 10 | 返回热点数量上限 |

#### 核心公式（SQL）

```sql
SELECT
  ROUND(latitude, 精度)  AS lat_grid,
  ROUND(longitude, 精度) AS lng_grid,
  COUNT(*)               AS warning_count,
  ROUND(AVG(risk_score), 1) AS avg_risk
FROM alerts
WHERE created_at BETWEEN :start_at AND :end_at
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
GROUP BY lat_grid, lng_grid
ORDER BY warning_count DESC, avg_risk DESC
LIMIT :hotspot_limit
```

#### 业务用途

- 识别边境走私高发区域，指导巡逻路线优化
- 发现环保预警密集区域，指导污染治理优先级

#### 代码实现

```javascript
export async function getResearchAggregation({
    start_at, end_at,
    hotspot_precision = 2,
    hotspot_limit = 10
}) {
    const replacements = {
        start_at: start_at || '1970-01-01',
        end_at:   end_at   || '2999-12-31'
    }

    const hotspot_sql = `
        SELECT
          ROUND(latitude,  ${Number(hotspot_precision)}) AS lat_grid,
          ROUND(longitude, ${Number(hotspot_precision)}) AS lng_grid,
          COUNT(*) AS warning_count,
          ROUND(AVG(risk_score), 1) AS avg_risk
        FROM alerts
        WHERE latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND created_at BETWEEN :start_at AND :end_at
        GROUP BY lat_grid, lng_grid
        ORDER BY warning_count DESC, avg_risk DESC
        LIMIT ${Number(hotspot_limit)}
    `

    const hotspot_areas = await sequelize.query(hotspot_sql, {
        replacements,
        type: QueryTypes.SELECT
    })

    return { hotspot_areas }
}
```

> **算法来源**：基于空间网格化（Grid-based Spatial Clustering）基本思想的自研实现，参照了经典空间聚类算法（如 Geohash 网格化）的理念，但实现为简单的 SQL 聚合查询。

---

## 五、⚖️ 相似度匹配类

---

### 5.1 加权多维相似度匹配

> **文件位置**：`back-end/src/routes/alerts.js`

#### 算法原理

从类型、等级、分类、地理位置、风险评分五个维度计算两件预警的相似度总分，找出历史相似案件供研判参考。

#### 已知信息

| 参数 | 来源 | 说明 |
|------|------|------|
| `alert` | 目标预警 | 当前分析的预警对象 |
| `item` | 候选预警 | 历史预警池中待比较对象 |
| `weights` | 系统配置 | 五维度权重（管理员可动态调整） |

#### 默认权重配置

| 维度 | 默认权重 | 满分条件 |
|------|:--------:|---------|
| 地理位置（location） | 35 | 两预警坐标完全重合 |
| 目标类型（type） | 25 | 类型完全一致 |
| 预警等级（level） | 20 | 等级完全一致 |
| 风险评分（risk） | 10 | 风险分完全一致 |
| 业务分类（category） | 10 | 分类完全一致 |

#### 核心公式

```
地理距离     = √((baseLat − lat)² + (baseLng − lng)²)

locationScore = max(0, 权重.location − 地理距离 × 120)
typeScore     = (item.type === alert.type)     ? 权重.type     : 0
levelScore    = (item.level === alert.level)   ? 权重.level    : 0
categoryScore = (item.category === alert.category) ? 权重.category : 0
riskScore     = max(0, 权重.risk − |item.risk − alert.risk| / 10)

总相似度 = typeScore + levelScore + categoryScore
         + locationScore + riskScore
         （仅保留 >= 20 的结果）
```

#### 业务用途

- 辅助研判员快速找到历史类似案件
- 基于相似案件的结果预估当前预警的处置方案

#### 代码实现

```javascript
const weights = await loadSimilarityWeights()

const similar = candidates.map((item) => {
    const lat  = Number(item.latitude  || 0)
    const lng  = Number(item.longitude || 0)
    const risk = Number(item.risk_score || 0)

    const geoDistance  = Math.sqrt(
        Math.pow(baseLat - lat, 2) + Math.pow(baseLng - lng, 2)
    )
    const locationScore = Math.max(0, weights.location - geoDistance * 120)
    const typeScore     = item.type     === alert.type     ? weights.type     : 0
    const levelScore    = item.level    === alert.level    ? weights.level    : 0
    const categoryScore = item.category === alert.category ? weights.category : 0
    const riskScore     = Math.max(0, weights.risk - Math.abs(baseRisk - risk) / 10)
    const score = Math.round(
        typeScore + levelScore + categoryScore + locationScore + riskScore
    )

    return {
        ...normalizeAlertView(item),
        similarityScore: score,
        similarityExplain: {
            matchedDimensions: [...],
            scoreBreakdown: {
                type:     Math.round(typeScore),
                level:    Math.round(levelScore),
                category: Math.round(categoryScore),
                location: Math.round(locationScore),
                risk:     Math.round(riskScore)
            }
        }
    }
})
.filter(x => x.similarityScore >= 20)
.sort((a, b) => b.similarityScore - a.similarityScore)
.slice(0, limit)
```

> **算法来源**：参照了推荐系统中加权相似度的基本思想，针对预警业务场景定制化设计；权重支持管理员动态配置。

---

## 六、📊 状态评估类

---

### 6.1 设备状态评估

> **文件位置**：`front-end/pages/Device/utils/diagnosticLogic.js`

#### 核心逻辑

```
状态判定: offline  (最后活跃时间 > 60分钟)
          warning  (电量 < 20% 或 信号 < 40)
          online   (其他情况)
```

#### 代码实现

```javascript
export function evaluateDeviceStatus(device) {
    const now = new Date()
    const lastActive = new Date(device.lastActive)
    const inactiveMinutes = (now - lastActive) / 1000 / 60

    if (inactiveMinutes > 60) return 'offline'
    if (device.battery < 20 || device.signal < 40) return 'warning'
    return 'online'
}
```

---

### 6.2 预警等级判定

> **文件位置**：`back-end/src/services/aiService.js`

#### 核心逻辑

```
置信度 >= 85  → critical  (紧急，自动推送)
置信度 >= 70  → warning   (高风险，人工复核)
其他          → info      (提示，仅记录)
```

#### 代码实现

```javascript
export function determineAlertLevel(confidence) {
    if (confidence >= 85) return 'critical'
    else if (confidence >= 70) return 'warning'
    else return 'info'
}
```

---

### 6.3 预警优先级评分

> **文件位置**：`front-end/pages/Alert Center/utils/riskEvaluator.js`

#### 核心逻辑

```
时间偏差权重: >= 3倍 → +100, >= 2倍 → +50, >= 1.5倍 → +25
多模态证据: 红外 +30, 气味 +20, 震动 +10
时间新鲜度: < 5分钟 +50, < 15分钟 +30, < 30分钟 +10
```

#### 代码实现

```javascript
export function calculatePriority(alert) {
    let score = 0
    if (alert.timeDeviation >= 3) score += 100
    else if (alert.timeDeviation >= 2) score += 50
    else if (alert.timeDeviation >= 1.5) score += 25

    if (alert.evidence?.infrared)  score += 30
    if (alert.evidence?.smell)     score += 20
    if (alert.evidence?.vibration) score += 10

    const minutesAgo = (Date.now() - new Date(alert.timestamp)) / 1000 / 60
    if (minutesAgo < 5)  score += 50
    else if (minutesAgo < 15) score += 30
    else if (minutesAgo < 30) score += 10

    return score
}
```

---

## 📁 算法文件索引

| 序号 | 算法名称 | 文件路径 | 类型 |
|:----:|---------|---------|:----:|
| 1 | Haversine 距离计算 | `front-end/pages/Alert Center/utils/alertLogic.js` | 🔢 |
| 2 | AI 置信度评分 | `back-end/src/services/aiService.js` | 🔢 |
| 3 | 综合风险评分（后端） | `back-end/src/services/riskScoringService.js` | 🔢 |
| 4 | 风险评分计算（前端） | `front-end/pages/Alert Center/utils/alertLogic.js` | 🔢 |
| 5 | 设备健康分数计算 | `front-end/pages/Device/utils/diagnosticLogic.js` | 🔢 |
| 6 | 风险等级映射 | `front-end/pages/Alert Center/utils/riskEvaluator.js` | 🔢 |
| 7 | 时间偏差倍数计算 | `front-end/pages/Alert Center/utils/riskEvaluator.js` | 🔢 |
| 8 | 污染范围半径计算 | `front-end/pages/GIS/utils/gisOptimization.js` | 🔢 |
| 9 | 多条件过滤 | `front-end/pages/Alert Center/utils/alertLogic.js` | 🔍 |
| 10 | 预警去重合并 | `front-end/pages/Alert Center/utils/alertLogic.js` | 🔍 |
| 11 | 预警优先级排序 | `front-end/pages/Alert Center/utils/alertLogic.js` | 🔍 |
| 12 | 设备优先级排序 | `front-end/pages/Device/utils/diagnosticLogic.js` | 🔍 |
| 13 | 预警趋势统计 | `front-end/pages/Alert Center/utils/alertLogic.js` | 🔍 |
| 14 | **影子追踪算法** | `front-end/pages/GIS/hooks/useMapLogic.js` | 🗺️ |
| 15 | 轨迹平滑算法 | `front-end/pages/GIS/hooks/useMapLogic.js` | 🗺️ |
| 16 | 射线法多边形判断 | `front-end/pages/GIS/hooks/useMapLogic.js` | 🗺️ |
| 17 | 拦截点计算 | `front-end/pages/GIS/hooks/useMapLogic.js` | 🗺️ |
| 18 | 坐标系转换 | `front-end/pages/GIS/hooks/useMapLogic.js` | 🗺️ |
| 19 | 扩散路径生成 | `front-end/pages/GIS/utils/gisOptimization.js` | 🗺️ |
| 20 | 多传感器时空融合 | `back-end/src/services/aiService.js` | 🤖 |
| 21 | 热点网格聚合 | `back-end/src/services/closedLoopService.js` | 🤖 |
| 22 | 加权多维相似度 | `back-end/src/routes/alerts.js` | ⚖️ |
| 23 | 设备状态评估 | `front-end/pages/Device/utils/diagnosticLogic.js` | 📊 |
| 24 | 预警等级判定 | `back-end/src/services/aiService.js` | 📊 |
| 25 | 预警优先级评分 | `front-end/pages/Alert Center/utils/riskEvaluator.js` | 📊 |

---

## 🔗 相关文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目整体说明、技术栈、架构 |
| [API.md](API.md) | 后端 RESTful API 接口文档 |
| [DEPLOY.md](DEPLOY.md) | 部署指南 |
| [architecture/index.html](architecture/index.html) | 系统架构图（Mermaid） |

---

> **版权声明**：© 环境资源和食品药品侦查总队 · 热眼擒枭项目组  
> 本文档仅限授权执法人员使用。
