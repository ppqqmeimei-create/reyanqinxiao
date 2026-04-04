# 个人中心 (Profile) - 单兵数字化管理终端

## 📋 模块概述

个人中心是"热眼擒枭"移动端的第五个核心页面，定位为**单兵数字化管理终端**，集成了身份校验、战果激励、装备（AI模型）维护与安全退出四大核心模块。

### 设计理念

- **军用终端风格**：采用磨砂玻璃质感配合全息蓝色边框，模拟军用终端的身份识别区
- **游戏化激励**：通过勋章系统和覆盖率热力图缓解巡逻的枯燥感
- **装备感知**：让巡逻员感知到自己携带的不仅仅是手机，而是不断进化的AI武器
- **安全优先**：高风险操作放在底部防止误触，提供多重确认机制

---

## 📁 文件结构

```
pages/Profile/
├── Profile.vue                    # 【入口文件】主页面，负责整体布局与组件组装
├── profile.scss                   # 【样式文件】定义暗夜风格卡片、动态流光边框、高亮文字
├── components/
│   ├── UserCard.vue              # 【顶部】用户身份卡片（头像、警号、当前执勤状态开关）
│   ├── DutyStats.vue             # 【中部】勤务数据看板（拦截率图表、巡逻里程、热力图）
│   ├── AiModelManager.vue        # 【中部】AI模型管理（版本显示、离线包更新进度条）
│   └── SecurityPanel.vue         # 【底部】安全中心面板（指纹设置、脱敏清除、退出登录）
└── hooks/
    └── useAuthLogic.js           # 【逻辑脚本】封装登出清除缓存、生物识别调用、离线凭证校验
```

---

## 🎨 核心功能模块

### 1. 战术身份卡片 (UserCard.vue)

**视觉风格**
- 磨砂玻璃质感（Frosted Glass）
- 全息蓝色边框（Holographic Border）
- 动态扫描光圈（Scan Ring Animation）

**核心功能**
- **身份信息**：头像（带动态扫描光圈）、真实姓名、警号、所属分队、警衔
- **执勤状态切换**：物理风格滑块开关
  - 状态："休整中"（灰色） vs "执勤中"（绿色高亮）
  - 交互说明：切换为"执勤中"时，后台自动开启高精度GPS上报

**关键代码**
```vue
<view class="physical-switch" :class="{ active: onDuty }" @tap="toggleDuty">
  <view class="switch-slider"></view>
</view>
```

---

### 2. 勤务战果看板 (DutyStats.vue)

**设计理念**
利用游戏化的"成就系统"来缓解巡逻的枯燥感。

**核心功能**

#### 核心指标（三列布局）
- **本月拦截**：显示拦截次数，使用发光文字效果
- **巡逻里程**：显示累计巡逻公里数
- **预警贡献**：显示逻辑预警贡献条数

#### 勋章墙
- 小图标展示特殊荣誉
- 示例勋章：
  - 🦅 猎鹰勋章（连续7天无漏报）
  - 🛡️ 铁壁勋章（单月拦截超过20次）
  - 🦉 夜枭勋章（夜间巡逻超过100小时）

#### 覆盖率热力图
- 8x8微缩地图组件
- 显示该队员历史上报坐标的覆盖热力
- 激励队员去探索未巡逻的盲区
- 覆盖率评级：
  - 绿色（≥80%）：优秀
  - 橙色（50-80%）：良好
  - 红色（<50%）：需改进

**关键样式**
```scss
.medal-glow {
  background: radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, transparent 70%);
  animation: medalGlow 2s ease-in-out infinite;
}
```

---

### 3. AI 装备维护舱 (AiModelManager.vue)

**设计理念**
让巡逻员感知到自己携带的不仅仅是手机，而是不断进化的AI武器。

**核心功能**

#### 版本状态
- 显示当前视觉模型版本（如：V2.4 夜间灵长类增强版）
- 模型大小、更新时间
- 状态指示灯：
  - 绿色：最新版本
  - 橙色闪烁：有更新可用

#### 离线更新
- 当检测到本地有预下载的更新包时，显示"一键安装"按钮
- 进度反馈：
  - 绿色进度条
  - 哈希校验状态
  - 安装进度百分比

#### 性能指标
- 识别准确率（94%）
- 推理速度（88ms）
- 内存占用（65%）

**更新流程**
```javascript
handleUpdate() {
  // 1. 下载模型包
  // 2. 校验哈希
  // 3. 安装模型
  // 4. 更新版本信息
}
```

---

### 4. 安全与退出中心 (SecurityPanel.vue)

**设计理念**
高风险或低频操作放在底部防止误触。

**核心功能**

#### 生物识别锁
- 开关项，开启后App从后台切回前台需要指纹验证
- 使用物理风格滑块开关

#### 紧急数据销毁
- 红色文字按钮
- 用于极端情况下一键擦除本地所有缓存证据
- 二次确认机制

#### 其他安全选项
- 🗑️ 清理缓存
- 🔑 修改密码
- 🛡️ 隐私设置

#### 退出登录
- 样式：底部通栏大按钮，黑色背景，红色边框
- 逻辑说明：点击后弹出二次确认，确认后调用 `useAuthLogic.js` 清除Token并跳转至登录页

**关键样式**
```scss
.danger-button {
  background: rgba(255, 77, 79, 0.1);
  border: 2px solid #FF4D4F;
  box-shadow: 0 0 20rpx rgba(255, 77, 79, 0.3);
}
```

---

## 🔐 认证逻辑 (useAuthLogic.js)

### 核心方法

#### 1. handleLogout() - 安全退出流程
```javascript
async handleLogout() {
  // 1. 停止所有后台服务（GPS上报、WebSocket心跳）
  await stopBackgroundServices();
  
  // 2. 清除敏感缓存（但保留离线地图包）
  clearSensitiveCache();
  
  // 3. 记录日志
  logLogout();
  
  // 4. 通知服务器（如果在线）
  await notifyServerLogout();
  
  // 5. 重定向回登录页
  uni.reLaunch({ url: '/pages/login/index' });
}
```

#### 2. verifyBiometric() - 生物识别验证
```javascript
verifyBiometric() {
  return new Promise((resolve, reject) => {
    uni.checkIsSupportSoterAuthentication({
      success: (res) => {
        const authMode = res.supportMode.includes('fingerPrint') 
          ? 'fingerPrint' 
          : res.supportMode[0];
        
        uni.startSoterAuthentication({
          requestAuthModes: [authMode],
          authContent: '验证身份以继续',
          success: resolve,
          fail: reject
        });
      }
    });
  });
}
```

#### 3. verifyOfflineCredential() - 离线凭证校验
用于离线环境下的身份验证，通过本地哈希比对实现。

#### 4. emergencyDestroy() - 紧急数据销毁
清除所有敏感数据，包括：
- 临时证据缓存
- 离线证据
- 待上传数据
- 用户凭证

**保留数据**
- 离线地图包（offline_maps）
- AI模型文件（ai_model）
- 应用设置（app_settings）

---

## 🎨 UI 设计细节

### 色彩规范（军用终端风格）
```scss
$color-primary-blue: #00d4ff;      // 全息蓝
$color-success-green: #73D13D;     // 执勤绿
$color-warning-orange: #FFA940;    // 警告橙
$color-danger-red: #FF4D4F;        // 危险红
$color-bg-dark: #0a0e1a;           // 深色背景
$color-bg-card: #1a1f2e;           // 卡片背景
```

### 关键动画

#### 1. 扫描光圈动画
```scss
@keyframes scanPulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}
```

#### 2. 边框流光动画
```scss
@keyframes borderFlow {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 200%; }
}
```

#### 3. 勋章发光动画
```scss
@keyframes medalGlow {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
}
```

### 字体规范
- **警号和数字数据**：使用等宽字体（Monospace），模拟战术显示器风格
- **标题**：使用粗体，配合发光效果
- **描述文字**：使用常规字体，降低透明度

### 分割线
不使用简单的灰色线条，在暗色模式下使用深色凹槽（box-shadow: inset）来区分不同板块，增加界面的厚重感和层次感。

```scss
.inset-divider {
  height: 1px;
  background: transparent;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.5),
    0 1px 0 rgba(255, 255, 255, 0.05);
}
```

---

## 🔄 数据流

### 页面加载流程
```
onLoad()
  ├── loadUserInfo()          // 加载用户信息
  ├── loadDutyStats()         // 加载勤务统计
  └── checkModelUpdate()      // 检查模型更新
```

### 执勤状态切换流程
```
handleDutyChange(status)
  ├── 更新本地状态
  ├── 保存到本地存储
  ├── if (status === true)
  │     └── startDutyMode()   // 开启高精度GPS
  └── else
        └── stopDutyMode()    // 关闭高精度GPS
```

### 退出登录流程
```
handleLogout()
  ├── 显示二次确认弹窗
  ├── 用户确认
  └── executeLogout()
        ├── stopBackgroundServices()
        ├── clearSensitiveCache()
        ├── logLogout()
        ├── notifyServerLogout()
        └── uni.reLaunch('/pages/login/index')
```

---

## 📊 本地存储结构

### 用户相关
```javascript
{
  "user_info": {
    "avatar": "/static/avatar.png",
    "name": "张三",
    "badgeNumber": "9527",
    "department": "边境巡逻第一分队",
    "rank": "一级警司"
  },
  "user_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "token_expiry": 1735689600000
}
```

### 执勤相关
```javascript
{
  "on_duty": true,
  "duty_start_time": 1735603200000,
  "biometric_enabled": true
}
```

### 安全日志
```javascript
{
  "security_logs": [
    {
      "action": "logout",
      "timestamp": "2026-01-20T10:30:00.000Z",
      "device": "iPhone 14 Pro",
      "reason": "user_initiated"
    }
  ]
}
```

---

## 🚀 使用示例

### 基础使用
```vue
<template>
  <Profile />
</template>

<script>
import Profile from '@/pages/Profile/Profile.vue'

export default {
  components: { Profile }
}
</script>
```

### 自定义用户信息
```javascript
// 在 Profile.vue 的 onLoad 中
loadUserInfo() {
  const userInfo = uni.getStorageSync('user_info')
  if (userInfo) {
    this.userInfo = userInfo
  }
}
```

### 监听执勤状态变化
```javascript
handleDutyChange(status) {
  this.onDuty = status
  uni.setStorageSync('on_duty', status)
  
  // 触发自定义事件
  uni.$emit('dutyStatusChanged', status)
}
```

---

## 🔧 配置项

### 生物识别配置
```javascript
// 在 manifest.json 中配置
{
  "mp-weixin": {
    "permission": {
      "scope.userLocation": {
        "desc": "用于执勤时的位置上报"
      }
    }
  }
}
```

### 后台定位配置
```javascript
// 在 App.vue 中配置
onLaunch() {
  // 检查定位权限
  uni.authorize({
    scope: 'scope.userLocation',
    success() {
      console.log('定位权限已授权')
    }
  })
}
```

---

## 🎯 交互细节

### 1. 执勤状态切换
- **视觉反馈**：滑块平滑移动，背景色渐变
- **触觉反馈**：震动反馈（uni.vibrateShort()）
- **提示信息**：Toast提示当前状态

### 2. 模型更新
- **进度可视化**：实时显示下载进度
- **状态提示**：下载中 → 校验哈希 → 安装中 → 完成
- **错误处理**：网络异常时显示重试按钮

### 3. 退出登录
- **二次确认**：防止误触
- **加载状态**：显示"退出中..."
- **清理反馈**：Toast提示清理完成

### 4. 紧急数据销毁
- **红色警告**：使用危险色强调风险
- **二次确认**：明确告知不可恢复
- **快速执行**：1.5秒内完成销毁

---

## 🐛 常见问题

### Q1: 生物识别不可用？
**A:** 检查设备是否支持生物识别，可以使用以下代码：
```javascript
uni.checkIsSupportSoterAuthentication({
  success: (res) => {
    console.log('支持的认证方式:', res.supportMode)
  }
})
```

### Q2: 退出登录后数据未清除？
**A:** 确保调用了 `clearSensitiveCache()` 方法，并检查本地存储：
```javascript
console.log('Token:', uni.getStorageSync('user_token'))
```

### Q3: 执勤状态切换无效？
**A:** 检查是否正确保存到本地存储：
```javascript
uni.setStorageSync('on_duty', status)
```

### Q4: 模型更新进度不显示？
**A:** 确保 `isUpdating` 状态正确更新：
```javascript
this.isUpdating = true
this.updateProgress = 0
```

---

## 📈 性能优化

### 1. 图片优化
- 头像使用 WebP 格式
- 勋章图标使用 Emoji 或 SVG
- 懒加载非关键图片

### 2. 动画优化
- 使用 CSS 动画代替 JS 动画
- 使用 `transform` 和 `opacity` 属性
- 避免频繁的 DOM 操作

### 3. 数据缓存
- 用户信息缓存到本地
- 勤务统计数据定时更新
- 模型信息本地存储

### 4. 懒加载
- 热力图数据按需生成
- 勋章列表虚拟滚动
- 安全日志分页加载

---

## 🔮 未来扩展

### 1. 社交功能
- 队友排行榜
- 战果分享
- 团队协作

### 2. 数据分析
- 巡逻轨迹回放
- 拦截热点分析
- 个人成长曲线

### 3. 智能推荐
- 巡逻路线推荐
- 最佳巡逻时间
- 装备升级建议

### 4. 离线增强
- 完全离线模式
- 离线数据同步
- 离线AI推理

---

## 📝 开发日志

### v1.0.0 (2026-01-20)
- ✅ 完成战术身份卡片
- ✅ 完成勤务战果看板
- ✅ 完成AI装备维护舱
- ✅ 完成安全与退出中心
- ✅ 完成认证逻辑封装
- ✅ 完成全局样式定义

---

## 👥 贡献者

- UI设计：Claude (Sonnet 4.5)
- 技术架构：热眼擒枭团队
- 需求分析：边境安全系统

---

## 📄 许可证

© 2026 边境安全系统 - 保留所有权利

---

## 🔗 相关文档

- [登录页面文档](../Login/README.md)
- [首页文档](../Home/README.md)
- [证据采集文档](../Evidence/README.md)
- [传感器网络文档](../Device/README.md)
- [API接口文档](../../docs/API.md)
