# 情报研判中心 (Intelligence Center)

## 模块概述

情报研判中心是生态警务系统的"大脑"，负责将分散的线索汇聚为情报产品，支撑一线执法决策。

## 四大核心功能

### 1. 线索池 (Clue Pool)
- 汇总各类情报来源：传感器网络、群众举报、兄弟单位通报、巡逻发现等
- 智能分级：按可信度（VERY_HIGH→VERY_LOW）和类型分类
- 高优先级线索高亮展示，一键直达行动建议
- 筛选：类型 + 可信度 + 状态 + 时间范围

### 2. 案件串并 (Case Clustering)
- 自动发现跨区域、跨时间关联的案件
- 团伙网络可视化
- 关联度评分

### 3. 战法模型库 (Tactic Model Library)
- 积累沉淀侦查战法模板
- 模型分类：模式识别 / 异常检测 / 目标识别 / 溯源分析
- 准确率跟踪和历史使用记录

### 4. 关系图谱 (Relation Graph)
- 可视化人员/车辆/货物/地点/物种的关联网络
- 节点类型区分（颜色+图标）
- 可疑边高亮
- 支持缩放、重置、标签开关

## Store 数据结构

```javascript
useIntelligenceStore = {
  clues: [],          // 线索列表
  caseClusters: [],   // 案件串并列表
  tacticModels: [],   // 战法模型列表
  graphNodes: [],     // 图谱节点
  graphEdges: [],     // 图谱边
  stats: {},          // 统计摘要
}
```

## 关键常量 (systemConfig.js)

```javascript
INTELLIGENCE_CONFIDENCE: {
  VERY_HIGH: { threshold: 0.9, label: '高度可信', color: '#52C41A' },
  HIGH: { threshold: 0.7, label: '较可信', color: '#73D13D' },
  ...
}

RESPONSE_LEVELS: {
  IMMEDIATE: { level: 1, label: '立即响应', timeout: 300 },
  URGENT: { level: 2, label: '紧急响应', timeout: 900 },
  PRIORITY: { level: 3, label: '优先处理', timeout: 3600 },
  ROUTINE: { level: 4, label: '常规处理', timeout: 86400 },
}
```

## 业务流程

```
传感器/举报/通报 ──→ 线索池 ──→ 评估分级
                                    │
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
              高优先级线索                    低优先级线索
              立即部署核查                    纳入监控名单
                    │                               │
                    └───────────────┬───────────────┘
                                    ↓
                          情报研判 ──→ 案件串并 ──→ 战法匹配 ──→ 任务下发
```

## 后续扩展方向

- [ ] 线索详情页 (clue-detail.vue)
- [ ] 案件串并详情页 (cluster-detail.vue)
- [ ] 关系图谱交互（拖拽节点、添加边）
- [ ] AI辅助情报评估（自动生成可信度评分）
- [ ] 与后端情报系统对接（实时线索推送）
