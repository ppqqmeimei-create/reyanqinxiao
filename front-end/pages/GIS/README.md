# 态势一张图 - GIS 页面

## 📋 项目概述

"态势一张图"是**热眼擒枭**边境巡逻系统的核心页面，采用**三层嵌套布局**设计，为一线巡逻人员提供实时态势感知、影子追踪、智能预警和设备监控功能。

---

## 🎨 设计理念

### 核心设计原则
1. **盲区可视化** - 不仅显示"看到"的，更要展示"推测在"的目标位置
2. **单手操作** - 所有核心功能可在奔跑/驾驶状态下单手完成
3. **视觉分层** - 严格的 Z-Index 策略确保紧急信息永不被遮挡
4. **暗色优先** - 保护夜间视力，防止屏幕亮光暴露位置

### 三层布局架构

```
┌─────────────────────────────────────┐
│  最顶层 (z-index: 999)              │
│  ├─ StatusHeader (状态栏)           │
│  ├─ MapControls (工具栏)            │
│  └─ AlertMiniPanel (预警抽屉)       │
├─────────────────────────────────────┤
│  中间层 (z-index: 10-100)           │
│  ├─ 影子追踪可视化                  │
│  ├─ 拓扑连接线                      │
│  └─ 传感器标记点                    │
├─────────────────────────────────────┤
│  底层 (z-index: 1)                  │
│  └─ MapContainer (地图引擎)         │
└─────────────────────────────────────┘
```

---

## 📁 文件结构

```
pages/gis/
├── index.vue                    # 主页面，负责调度所有组件与数据生命周期
├── gis.scss                     # 全局样式文件，处理地图层级、暗色模式及特殊动画
├── components/                  # 组件目录
│   ├── MapContainer.vue         # 地图引擎渲染层（处理 Marker、Polyline、影子光圈）
│   ├── StatusHeader.vue         # 顶部系统状态挂件（GPS精度、信号强度、离线标记）
│   ├── MapControls.vue          # 右侧地图操作工具栏（图层切换、SOS、我的位置、测距）
│   ├── AlertMiniPanel.vue       # 底部悬浮预警简报抽屉（滑动展开）
│   └── SensorPopup.vue          # 传感器点击后的多模态详情浮窗
└── hooks/                       # 逻辑抽离目录
    └── useMapLogic.js           # 处理坐标转换、影子追踪算法、轨迹平滑等逻辑
```

---

## 🚀 核心功能

### 1. 影子追踪 (Shadow Tracker)
当目标消失在监控盲区时，系统会：
- 绘制**红色虚线**预测路径
- 显示**半透明扩散圈**表示概率范围
- 实时更新概率百分比

**实现位置**: `MapContainer.vue` + `useMapLogic.js`

```javascript
// 影子追踪算法
calculateShadowPath(lastPosition, velocity, timeElapsed)
```

### 2. 拓扑网络连线
自动绘制前端感知节点（摄像头、光纤、气味探头）之间的逻辑连接：
- **绿色实线** - 正常通信链路
- **流动动画** - 数据传输可视化

**实现位置**: `useMapLogic.js` - `generateTopologyLinks()`

### 3. 动态 Marker 系统
不同类型传感器使用不同图标和动效：
- 📹 **可见光摄像头** - 紫色渐变背景
- 🌡️ **红外热像仪** - 粉红渐变背景
- 📡 **震动光纤** - 蓝色渐变 + 波纹动效
- 👃 **气味探头** - 绿色渐变 + 浓度渐变

**健康脉动**: 故障设备显示黄色呼吸灯效果

### 4. SOS 紧急求救
- **长按 3 秒**触发全局最高优先级救援
- **进度环**可视化反馈
- **震动反馈**确认操作

**实现位置**: `MapControls.vue`

### 5. 预警抽屉
- 显示最新的一条逻辑报警
- **上滑**直接进入"任务执行页"
- 支持预警等级分类（紧急/预警/提示）

**实现位置**: `AlertMiniPanel.vue`

---

## 🎯 交互设计

### 触觉反馈策略
```javascript
// 短震动 - 普通操作
uni.vibrateShort()

// 长震动 - 紧急操作（SOS）
uni.vibrateLong()
```

### 手势操作
| 手势 | 功能 |
|------|------|
| 单击标记点 | 打开传感器详情弹窗 |
| 上滑预警抽屉 | 跳转任务执行页 |
| 长按 SOS | 触发紧急求救 |
| 双指缩放 | 地图缩放 |

---

## 🎨 视觉规范

### 色彩系统
```scss
$color-alert-red: #FF4D4F;      // 警报红 - 发现走私目标
$color-warning-orange: #FFA940;  // 预警橙 - 逻辑偏差异常
$color-safe-green: #73D13D;      // 安全绿 - 设备正常
$color-bg-dark: #0a0e1a;         // 背景深色
$color-bg-card: #1a1f2e;         // 卡片背景
```

### 动画效果
- **呼吸灯** (`breathe`) - 故障设备
- **波纹扩散** (`ripple`) - 震动光纤
- **脉冲** (`pulse`) - SOS 按钮
- **滑动提示** (`slideHint`) - 预警抽屉

### 毛玻璃效果
```scss
.glass-effect {
  background: rgba(26, 31, 46, 0.8);
  backdrop-filter: blur(30rpx) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 📊 数据结构

### 传感器标记点
```javascript
{
  id: 1,
  latitude: 39.9042,
  longitude: 116.4074,
  type: 'camera-visible',  // camera-visible | camera-infrared | fiber | smell
  status: 'online',        // online | warning | offline
  iconPath: '/static/icons/camera-visible.png',
  width: 32,
  height: 32
}
```

### 预警数据
```javascript
{
  id: 1001,
  type: 'logic-deviation',  // logic-deviation | intrusion | sensor-fault | abnormal-stay
  level: 'warning',         // critical | warning | info
  message: '目标在 A-B 路径停留已超正常时长 3 倍',
  time: new Date(),
  location: '边境A区-B区连接段'
}
```

---

## 🔧 核心算法

### 1. 影子追踪算法
```javascript
calculateShadowPath(lastPosition, velocity, timeElapsed)
```
- 根据最后已知位置和速度预测目标位置
- 计算概率扩散半径（随时间增加不确定性）
- 返回预测位置、半径和概率

### 2. 轨迹平滑算法
```javascript
smoothTrajectory(points, windowSize = 5)
```
- 使用移动平均法平滑 GPS 轨迹点
- 减少 GPS 漂移影响

### 3. 距离计算（Haversine 公式）
```javascript
calculateDistance(point1, point2)
```
- 精确计算地球表面两点间距离（米）

### 4. 拦截点计算
```javascript
calculateInterceptPoint(targetPos, targetVelocity, patrolPos, patrolSpeed)
```
- 计算巡逻员拦截目标的最佳位置
- 返回拦截点坐标和预计时间

---

## 🌐 离线支持

### 离线地图
- 支持分区域下载离线矢量地图
- 顶部状态栏显示"离线地图 v2.0"标识

### 数据同步
- 断网时数据暂存本地
- 网络恢复后自动同步

---

## 📱 性能优化

1. **按需渲染** - 只渲染可视区域内的标记点
2. **节流防抖** - 地图移动事件使用节流
3. **图片懒加载** - 传感器图标按需加载
4. **动画优化** - 使用 CSS3 硬件加速

---

## 🔐 安全考虑

1. **位置隐私** - 暗色模式防止屏幕亮光暴露位置
2. **误触防护** - SOS 需长按 3 秒触发
3. **数据加密** - 敏感数据本地加密存储

---

## 🎓 使用说明

### 快速开始
1. 打开 APP 自动进入"态势一张图"页面
2. 查看顶部状态栏确认 GPS 信号和电量
3. 点击地图上的传感器图标查看详情
4. 如有预警，底部抽屉会自动弹出

### 紧急情况
1. **长按右侧红色 SOS 按钮 3 秒**
2. 确认发送后，所有附近队员将收到通知
3. 系统自动记录当前位置和时间

---

## 🛠️ 技术栈

- **框架**: uni-app (Vue 2)
- **地图引擎**: uni-app map 组件
- **样式**: SCSS
- **动画**: CSS3 Animations
- **状态管理**: 组件内部 data + props

---

## 📝 待优化项

- [ ] 接入真实地图 API（高德/腾讯地图）
- [ ] 实现 WebSocket 实时数据推送
- [ ] 添加 AR 路径引导功能
- [ ] 优化影子追踪算法精度
- [ ] 支持多目标同时追踪

---

## 👥 设计团队

**UI/UX 设计**: Claude (AI 设计师)  
**设计理念**: 极端环境下的决策支持系统  
**设计时间**: 2026年1月

---

## 📄 许可证

本项目为"热眼擒枭"边境巡逻系统的一部分，仅供内部使用。

---

**🎯 设计目标**: 让一线巡逻人员在最恶劣的环境下，依然能够快速、准确地做出决策。
