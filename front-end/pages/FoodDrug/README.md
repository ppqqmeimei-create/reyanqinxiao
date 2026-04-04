# 食品药品安全工作台

## 📋 模块概述

食品药品安全工作台是热眼擒枭系统的重要组成部分，专注于食品、药品、化妆品的安全监管和预警处理。

## 🎯 核心功能

### 1. 预警管理
- 实时显示食品药品安全预警
- 支持多级别风险等级（严重、高、中、低）
- 自动生成预警编码
- 支持预警筛选和搜索

### 2. 产品监管
- 覆盖食品、药品、化妆品三大类
- 记录产品基本信息（名称、批次、厂家）
- 追踪受影响消费者数量
- 支持产品批次管理

### 3. 召回管理
- 支持部分召回和全部召回
- 记录召回状态和进度
- 统计召回数量
- 生成召回报告

### 4. 数据分析
- 实时统计预警数量
- 按风险等级分类统计
- 按产品类型分类统计
- 按处理状态分类统计

## 📁 文件结构

```
FoodDrug/
├── FoodDrug.vue                    # 主页面
├── components/
│   ├── FoodDrugFilter.vue         # 筛选栏组件
│   ├── FoodDrugList.vue           # 预警列表组件
│   └── FoodDrugDetail.vue         # 预警详情组件
├── utils/
│   └── foodDrugLogic.js           # 业务逻辑工具
└── README.md                       # 本文件
```

## 🔧 组件说明

### FoodDrug.vue (主页面)
**职责**: 页面容器和数据管理

**主要功能**:
- 加载和管理预警数据
- 处理筛选和刷新
- 管理详情弹窗显示
- 统计预警数量

**Props**: 无

**Events**: 无

**Data**:
- `alerts`: 预警列表
- `alertCounts`: 预警统计
- `activeFilter`: 当前筛选条件
- `detailVisible`: 详情弹窗显示状态

### FoodDrugFilter.vue (筛选栏)
**职责**: 提供预警筛选功能

**主要功能**:
- 显示筛选按钮
- 显示各类别预警数量
- 支持点击筛选

**Props**:
- `activeFilter` (String): 当前活跃筛选
- `counts` (Object): 各类别预警数量

**Events**:
- `filterChange`: 筛选条件改变

### FoodDrugList.vue (预警列表)
**职责**: 显示预警列表

**主要功能**:
- 显示预警卡片
- 支持点击查看详情
- 支持快速操作（查看、处理）

**Props**:
- `alerts` (Array): 预警列表

**Events**:
- `alertClick`: 点击预警卡片
- `handleAlert`: 执行操作

### FoodDrugDetail.vue (预警详情)
**职责**: 显示预警详细信息

**主要功能**:
- 显示完整预警信息
- 支持启动召回
- 支持标记处理
- 支持忽略预警

**Props**:
- `visible` (Boolean): 是否显示
- `alert` (Object): 预警数据

**Events**:
- `close`: 关闭详情
- `handle`: 执行操作

## 🎨 样式设计

### 颜色方案
- **严重风险**: #ff4d4f (红色)
- **高风险**: #ffa940 (橙色)
- **中风险**: #ffc107 (黄色)
- **低风险**: #4caf50 (绿色)

### 产品类型颜色
- **食品**: #4caf50 (绿色)
- **药品**: #2196f3 (蓝色)
- **化妆品**: #e91e63 (粉色)

## 📊 数据结构

### Alert 对象
```javascript
{
  id: Number,                    // 预警ID
  alert_code: String,            // 预警编码
  alert_type: String,            // 预警类型 (food/drug/cosmetic)
  risk_level: String,            // 风险等级 (critical/warning/medium/low)
  product_name: String,          // 产品名称
  product_batch: String,         // 产品批次
  manufacturer: String,          // 生产厂家
  risk_description: String,      // 风险描述
  affected_consumers: Number,    // 受影响消费者数
  recall_status: String,         // 召回状态 (not-recalled/partial-recall/full-recall)
  status: String,                // 处理状态 (pending/investigating/resolved)
  create_time: String            // 创建时间
}
```

## 🔌 API 集成

### 后端API端点

#### 获取预警列表
```
GET /v1/ecology/food-drug-alerts
Query: page, pageSize, alertType, riskLevel, status
Response: { list: [], total: 0, page: 1, pageSize: 20 }
```

#### 获取预警详情
```
GET /v1/ecology/food-drug-alerts/<id>
Response: { id, alert_code, ... }
```

#### 创建预警
```
POST /v1/ecology/food-drug-alerts/create
Body: { alert_type, risk_level, product_name, ... }
Response: { id, alert_code, ... }
```

#### 处理预警
```
PUT /v1/ecology/food-drug-alerts/<id>/handle
Body: { status, recall_status, handling_measures }
Response: { id, status, recall_status, ... }
```

#### 获取统计数据
```
GET /v1/ecology/food-drug-statistics
Response: { total, byType, byRiskLevel, byStatus, recallStats }
```

## 🚀 使用示例

### 基本使用
```vue
<template>
  <FoodDrug />
</template>

<script setup>
import FoodDrug from '@/pages/FoodDrug/FoodDrug.vue'
</script>
```

### 自定义筛选
```javascript
// 在FoodDrug.vue中
function handleFilterChange(filter) {
  activeFilter.value = filter
  // 根据筛选条件过滤预警
}
```

### 处理预警
```javascript
// 在FoodDrug.vue中
function handleAlertAction(action) {
  if (action.type === 'recall') {
    // 启动召回流程
  } else if (action.type === 'handle') {
    // 标记为处理中
  }
}
```

## 📱 响应式设计

- 支持手机、平板、小程序等多端
- 自适应屏幕宽度
- 触摸友好的交互设计
- 优化的性能表现

## 🔄 状态管理

### 预警状态流转
```
pending (待处理)
  ↓
investigating (处理中)
  ↓
resolved (已解决)
```

### 召回状态流转
```
not-recalled (未召回)
  ↓
partial-recall (部分召回)
  ↓
full-recall (全部召回)
```

## 🧪 测试

### 单元测试
- 组件渲染测试
- Props验证测试
- Events触发测试

### 集成测试
- 预警列表加载
- 筛选功能
- 详情弹窗
- 操作流程

### 性能测试
- 列表滚动性能
- 大数据量处理
- 内存占用

## 📝 最佳实践

1. **数据管理**
   - 使用computed处理派生数据
   - 避免直接修改props
   - 使用emit通知父组件

2. **性能优化**
   - 使用虚拟滚动处理大列表
   - 图片懒加载
   - 防抖/节流处理频繁操作

3. **用户体验**
   - 提供加载状态反馈
   - 操作前确认
   - 错误提示清晰

## 🐛 常见问题

### Q: 如何添加新的预警类型？
A: 修改`getTypeLabel()`函数，添加新的类型映射

### Q: 如何自定义风险等级颜色？
A: 修改SCSS中的颜色变量

### Q: 如何集成真实API？
A: 在`loadAlerts()`函数中替换为实际API调用

## 🔗 相关文档

- [API文档](../../API_DOCUMENTATION.md)
- [项目计划书](../../项目计划书_第一部分.md)
- [快速开始](../../ECOLOGY_QUICKSTART.md)

## 📞 技术支持

如有问题，请联系技术团队。

---

**最后更新**: 2026年3月15日  
**版本**: 1.0.0  
**状态**: ✅ 完成
