# 预警工作台 (Alert Center) - 逻辑偏差预警与多模态证据回溯

## 📋 模块概述

预警工作台是"热眼擒枭"移动端的第二个核心页面，专注于**逻辑偏差预警列表**和**多模态证据回溯**，采用**高对比度通知设计**，确保巡逻员一眼识别高危风险。

### 设计理念

- **高对比度通知**：采用"红/橙/灰"三级分级，确保在任何环境下都能快速识别
- **认知负荷最小化**：不显示复杂的原始报文，直接通过图标告知识别结果
- **证据链对齐**：将不同传感器在同一时间戳的数据对齐展示
- **快速响应**：大按钮设计，支持快速创建任务或忽略预警

---

## 📁 文件结构

```
pages/Alert Center/
├── Alert Center.vue           # 【入口文件】主页面，负责整体布局与数据管理
├── alertCenter.scss           # 【样式文件】定义高对比度通知样式、预警分级颜色
├── components/
│   ├── FilterBar.vue          # 【筛选栏】全部/高危/预警/已处理 四级筛选
│   ├── AlertList.vue          # 【预警列表】预警卡片列表容器
│   ├── AlertCard.vue          # 【预警卡片】单个预警的卡片展示
│   ├── AlertDetail.vue        # 【详情弹窗】预警详情弹窗，包含多模态证据
│   └── EvidenceTimeline.vue   # 【证据时间轴】多模态证据时间轴展示
└── utils/
    └── alertLogic.js          # 【逻辑处理】预警分类、风险评分、优先级排序等
```

---

## 🎨 核心功能模块

### 1. 筛选栏 (FilterBar.vue)

**功能**
- 四级筛选：全部、高危、预警、已处理
- 实时显示各级别预警数量
- 激活状态高亮显示

**交互**
- 点击筛选项切换筛选条件
- 激活项底部显示指示器
- 触觉反馈

**关键代码**
```vue
<view 
  class="filter-item"
  :class="{ 
    active: activeFilter === filter.key,
    [`level-${filter.key}`]: activeFilter === filter.key
  }"
  @tap="handleFilterTap(filter.key)"
>
  <text class="filter-label">{{ filter.label }}</text>
  <view class="filter-badge">{{ counts[filter.key] }}</view>
</view>
```

---

### 2. 预警卡片 (AlertCard.vue)

**设计特点**
- **左侧状态条**：红色（高危）、橙色（预警）、灰色（已处理）
- **脉冲动画**：高危预警卡片持续脉冲闪烁
- **风险评分**：右上角显示风险评分（0-100）
- **目标类型**：图标显示人员/车辆/动物

**核心信息**
- 预警标题
- 预警消息
- 目标类型
- 位置信息
- 风险评分
- 发生时间

**操作按钮**
- **忽略**：标记预警为已处理
- **创建任务**：跳转到任务执行页

**关键样式**
```scss
.alert-card {
  &.level-critical {
    border-color: rgba(255, 77, 79, 0.3);
    box-shadow: 0 8rpx 32rpx rgba(255, 77, 79, 0.2);
  }
  
  &.pulse-animation {
    animation: cardPulse 2s ease-in-out infinite;
  }
}
```

---

### 3. 预警详情弹窗 (AlertDetail.vue)

**布局结构**
- **顶部**：预警标题、时间、风险评分徽章
- **基本信息**：目标类型、位置、停留时长、坐标
- **多模态证据链**：时间轴展示各传感器数据
- **逻辑偏差分析**：对比正常值与异常值
- **处理记录**：显示处理人和处理时间（已处理预警）
- **底部操作**：忽略预警、创建任务

**多模态证据展示**
```
📷 可见光摄像头  →  已捕获          10:23:45
🌡️ 红外热像仪    →  温度 36.5°C     10:23:46
👃 气味探头      →  浓度 85.3 ppm   10:23:47
📳 震动光纤      →  强度 78         10:23:48
```

**逻辑偏差分析**
- 正常通过时长：60秒（绿色进度条）
- 当前停留时长：180秒（红色进度条）
- 偏差结果：停留时长超出正常值 200%

---

### 4. 证据时间轴 (EvidenceTimeline.vue)

**设计特点**
- 垂直时间轴布局
- 蓝色发光节点
- 渐变连接线
- 传感器图标 + 名称 + 数值 + 时间

**时间轴节点**
```scss
.node-dot {
  background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
  border: 4rpx solid rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 20rpx rgba(0, 212, 255, 0.6);
}
```

---

## 🧮 核心算法 (alertLogic.js)

### 1. 风险评分算法

**评分维度**（总分100分）
- **目标类型**（30分）：人员30分、车辆25分、动物10分
- **停留时长**（30分）：超过正常值3倍得30分
- **传感器数量**（20分）：每个传感器5分，最多20分
- **时间因素**（20分）：夜间（22:00-6:00）得20分

```javascript
export function calculateRiskScore(alert) {
  let score = 0
  
  // 1. 目标类型权重
  const targetWeights = {
    'human': 30,
    'vehicle': 25,
    'animal': 10
  }
  score += targetWeights[alert.target] || 0
  
  // 2. 停留时长权重
  const normalDuration = 60
  const durationRatio = alert.duration / normalDuration
  if (durationRatio > 3) score += 30
  
  // 3. 传感器数量权重
  score += Math.min(alert.sensors.length * 5, 20)
  
  // 4. 时间因素权重
  const hour = new Date(alert.time).getHours()
  if (hour >= 22 || hour < 6) score += 20
  
  return Math.min(score, 100)
}
```

### 2. 预警分类算法

```javascript
export function classifyAlert(alert) {
  if (alert.riskScore >= 80) return 'critical'  // 高危
  if (alert.riskScore >= 60) return 'warning'   // 预警
  return 'info'                                  // 信息
}
```

### 3. 优先级排序

**排序规则**
1. 未处理的优先于已处理的
2. 风险评分高的优先
3. 时间新的优先

```javascript
export function sortAlertsByPriority(alerts) {
  return alerts.sort((a, b) => {
    if (a.handled !== b.handled) return a.handled ? 1 : -1
    if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore
    return new Date(b.time) - new Date(a.time)
  })
}
```

### 4. 预警去重

**去重条件**
- 时间窗口：5分钟内
- 距离阈值：100米内
- 目标类型：相同

```javascript
export function deduplicateAlerts(alerts, timeWindow = 300000, distanceThreshold = 100) {
  // 合并相似预警，取最高风险评分
  // 合并所有传感器数据
}
```

---

## 🎨 UI 设计规范

### 色彩规范

```scss
// 预警分级颜色
$color-critical: #FF4D4F;      // 高危红
$color-warning: #FFA940;       // 预警橙
$color-handled: #595959;       // 已处理灰
$color-success: #73D13D;       // 安全绿
$color-primary: #00d4ff;       // 全息蓝
```

### 预警级别视觉规范

| 级别 | 颜色 | 边框 | 阴影 | 动画 |
|------|------|------|------|------|
| 高危 (critical) | #FF4D4F | 红色发光边框 | 红色阴影 | 脉冲动画 |
| 预警 (warning) | #FFA940 | 橙色边框 | 橙色阴影 | 无 |
| 已处理 (handled) | #595959 | 灰色边框 | 无 | 无 |

### 动画效果

#### 1. 卡片脉冲动画（高危预警）
```scss
@keyframes cardPulse {
  0%, 100% {
    box-shadow: 0 8rpx 32rpx rgba(255, 77, 79, 0.2);
  }
  50% {
    box-shadow: 0 8rpx 32rpx rgba(255, 77, 79, 0.6);
  }
}
```

#### 2. 弹窗滑入动画
```scss
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

---

## 🔄 数据流

### 页面加载流程
```
onLoad()
  ├── loadAlerts()              // 加载预警列表
  ├── updateAlertCounts()       // 更新统计数据
  └── startRealTimeUpdate()     // 开启实时更新
```

### 筛选流程
```
handleFilterChange(filter)
  ├── 更新 activeFilter
  ├── 触发 computed: filteredAlerts
  └── 触觉反馈
```

### 预警处理流程
```
handleIgnoreAlert(alert)
  ├── 显示二次确认弹窗
  ├── 用户确认
  ├── 更新预警状态为 handled
  ├── 更新统计数据
  ├── 关闭详情弹窗
  └── 显示成功提示
```

### 创建任务流程
```
handleCreateTask(alert)
  ├── 触觉反馈
  └── 跳转到任务执行页
      └── url: /pages/Task/Task?alertId=${alert.id}&type=intercept
```

---

## 📊 本地存储结构

### 预警数据结构
```javascript
{
  id: 1001,                          // 预警ID
  level: 'critical',                 // 级别：critical/warning/handled
  type: 'logic-deviation',           // 类型
  target: 'human',                   // 目标：human/vehicle/animal
  title: '逻辑偏差异常',             // 标题
  message: '疑似人员在路径停留...',  // 消息
  location: '边境A区',               // 位置
  latitude: 39.9042,                 // 纬度
  longitude: 116.4074,               // 经度
  time: Date,                        // 发生时间
  duration: 180,                     // 停留时长（秒）
  riskScore: 85,                     // 风险评分
  sensors: [                         // 传感器数据
    {
      type: 'camera',
      name: '可见光摄像头',
      value: '已捕获',
      time: Date,
      icon: '/static/icons/camera-visible.png'
    }
  ],
  handled: false,                    // 是否已处理
  handledBy: null,                   // 处理人
  handledTime: null                  // 处理时间
}
```

---

## 🚀 使用示例

### 基础使用
```vue
<template>
  <AlertCenter />
</template>

<script>
import AlertCenter from '@/pages/Alert Center/Alert Center.vue'

export default {
  components: { AlertCenter }
}
</script>
```

### 从其他页面跳转
```javascript
// 从 GIS 页面跳转到预警详情
uni.navigateTo({
  url: '/pages/Alert Center/Alert Center?alertId=1001'
})
```

### 监听预警事件
```javascript
// 在 App.vue 中监听新预警
uni.$on('newAlert', (alert) => {
  // 震动提醒
  if (alert.level === 'critical') {
    uni.vibrateLong()
  } else {
    uni.vibrateShort()
  }
  
  // Toast 提示
  uni.showToast({
    title: `新${alert.level === 'critical' ? '高危' : ''}预警`,
    icon: 'none'
  })
})
```

---

## 🎯 交互细节

### 1. 筛选切换
- **视觉反馈**：激活项高亮显示，底部指示器
- **触觉反馈**：震动反馈
- **动画**：平滑过渡

### 2. 预警卡片
- **点击**：打开详情弹窗
- **长按**：快速操作菜单（未实现）
- **滑动**：左滑显示操作按钮（未实现）

### 3. 详情弹窗
- **打开**：从底部滑入
- **关闭**：点击遮罩或关闭按钮
- **滚动**：内容区域可滚动

### 4. 操作确认
- **忽略预警**：二次确认弹窗
- **创建任务**：直接跳转

---

## 🐛 常见问题

### Q1: 预警列表不显示？
**A:** 检查数据加载：
```javascript
console.log('[AlertCenter] 预警数据:', this.alerts)
```

### Q2: 筛选不生效？
**A:** 检查 computed 属性：
```javascript
computed: {
  filteredAlerts() {
    if (this.activeFilter === 'all') return this.alerts
    return this.alerts.filter(a => a.level === this.activeFilter)
  }
}
```

### Q3: 详情弹窗不显示？
**A:** 检查 visible 和 alert 数据：
```javascript
console.log('弹窗状态:', this.detailVisible)
console.log('选中预警:', this.selectedAlert)
```

### Q4: 图标不显示？
**A:** 确认图标文件路径：
```
static/icons-2/
├── alert-critical.png
├── alert-warning.png
├── target-human.png
└── ...
```

---

## 📈 性能优化

### 1. 列表虚拟滚动
对于大量预警数据，建议使用虚拟滚动：
```vue
<recycle-list :list="filteredAlerts" />
```

### 2. 图片懒加载
```vue
<image lazy-load :src="icon" />
```

### 3. 防抖处理
```javascript
// 筛选切换防抖
handleFilterChange: debounce(function(filter) {
  this.activeFilter = filter
}, 300)
```

### 4. 数据缓存
```javascript
// 缓存预警列表
uni.setStorageSync('cached_alerts', this.alerts)
```

---

## 🔮 未来扩展

### 1. 高级筛选
- 按时间范围筛选
- 按位置筛选
- 按目标类型筛选
- 多条件组合筛选

### 2. 预警统计
- 预警趋势图表
- 热点区域分析
- 时段分布统计

### 3. 智能推荐
- 推荐最佳处理方案
- 推荐最近巡逻员
- 推荐拦截路线

### 4. 离线支持
- 离线预警缓存
- 离线处理记录
- 网络恢复后同步

---

## 📝 开发日志

### v1.0.0 (2026-01-20)
- ✅ 完成预警列表展示
- ✅ 完成四级筛选功能
- ✅ 完成预警卡片设计
- ✅ 完成详情弹窗
- ✅ 完成多模态证据时间轴
- ✅ 完成逻辑偏差分析
- ✅ 完成风险评分算法
- ✅ 完成预警去重算法

---

## 👥 贡献者

- UI设计：Claude (Sonnet 4.5)
- 算法设计：热眼擒枭团队
- 需求分析：边境安全系统

---

## 📄 许可证

© 2026 边境安全系统 - 保留所有权利

---

## 🔗 相关文档

- [态势一张图文档](../GIS/README.md)
- [任务执行文档](../Task/README.md)
- [传感器网络文档](../Device/README.md)
- [个人中心文档](../Profile/README.md)
- [API接口文档](../../docs/API.md)
