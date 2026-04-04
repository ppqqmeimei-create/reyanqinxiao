# 热眼擒枭 - 图标资源清单

## 📋 图标规格说明

### 通用规格
- **尺寸**：建议使用 64x64px 或 128x128px（@2x）
- **格式**：PNG（支持透明背景）
- **色彩模式**：RGBA
- **设计风格**：线性图标，军用终端风格
- **背景**：透明背景
- **导出**：建议同时提供 @1x、@2x、@3x 三种尺寸

---

## 📁 图标目录结构

```
static/icons/
├── system/                          # 系统图标
│   ├── gps.png                      # GPS 定位图标
│   ├── gps-weak.png                 # GPS 信号弱
│   ├── gps-lost.png                 # GPS 信号丢失
│   ├── battery-full.png             # 电池满电（≥80%）
│   ├── battery-high.png             # 电池高电量（50-80%）
│   ├── battery-medium.png           # 电池中等（20-50%）
│   ├── battery-low.png              # 电池低电量（<20%）
│   ├── battery-charging.png         # 充电中
│   ├── wifi-online.png              # WiFi 在线
│   ├── wifi-offline.png             # WiFi 离线
│   ├── signal-strong.png            # 信号强
│   ├── signal-weak.png              # 信号弱
│   └── signal-none.png              # 无信号
│
├── sensors/                         # 传感器图标
│   ├── camera-visible.png           # 可见光摄像头
│   ├── camera-infrared.png          # 红外摄像头
│   ├── camera-thermal.png           # 热成像摄像头
│   ├── fiber.png                    # 震动光纤传感器
│   ├── smell.png                    # 气味探头
│   ├── radar.png                    # 雷达传感器
│   ├── microphone.png               # 声音传感器
│   ├── motion.png                   # 运动传感器
│   └── sensor-offline.png           # 传感器离线
│
├── map/                             # 地图相关图标
│   ├── satellite.png                # 卫星图层
│   ├── terrain.png                  # 地形图层
│   ├── dark-vector.png              # 暗色矢量图
│   ├── location.png                 # 定位按钮
│   ├── location-active.png          # 定位激活状态
│   ├── compass.png                  # 指南针
│   ├── ruler.png                    # 测距工具
│   ├── layers.png                   # 图层切换
│   ├── zoom-in.png                  # 放大
│   ├── zoom-out.png                 # 缩小
│   ├── fullscreen.png               # 全屏
│   └── marker.png                   # 地图标记
│
├── actions/                         # 操作图标
│   ├── sos.png                      # SOS 紧急求救
│   ├── sos-active.png               # SOS 激活状态
│   ├── camera.png                   # 拍照
│   ├── video.png                    # 录像
│   ├── voice.png                    # 语音
│   ├── flashlight.png               # 手电筒
│   ├── flashlight-on.png            # 手电筒开启
│   ├── scan.png                     # 扫描
│   ├── upload.png                   # 上传
│   ├── download.png                 # 下载
│   ├── sync.png                     # 同步
│   ├── refresh.png                  # 刷新
│   └── share.png                    # 分享
│
├── alerts/                          # 预警图标
│   ├── alert-high.png               # 高危预警（红色）
│   ├── alert-medium.png             # 中危预警（橙色）
│   ├── alert-low.png                # 低危预警（黄色）
│   ├── alert-info.png               # 信息提示（蓝色）
│   ├── warning.png                  # 警告
│   ├── danger.png                   # 危险
│   ├── success.png                  # 成功
│   └── info.png                     # 信息
│
├── navigation/                      # 导航图标
│   ├── arrow-up.png                 # 上箭头
│   ├── arrow-down.png               # 下箭头
│   ├── arrow-left.png               # 左箭头
│   ├── arrow-right.png              # 右箭头
│   ├── chevron-up.png               # 上尖括号
│   ├── chevron-down.png             # 下尖括号
│   ├── chevron-left.png             # 左尖括号
│   ├── chevron-right.png            # 右尖括号
│   ├── close.png                    # 关闭
│   ├── back.png                     # 返回
│   ├── menu.png                     # 菜单
│   └── more.png                     # 更多
│
├── status/                          # 状态图标
│   ├── online.png                   # 在线
│   ├── offline.png                  # 离线
│   ├── syncing.png                  # 同步中
│   ├── synced.png                   # 已同步
│   ├── pending.png                  # 待处理
│   ├── processing.png               # 处理中
│   ├── completed.png                # 已完成
│   ├── failed.png                   # 失败
│   ├── locked.png                   # 已锁定
│   └── unlocked.png                 # 已解锁
│
├── evidence/                        # 证据相关图标
│   ├── photo.png                    # 照片
│   ├── video-clip.png               # 视频片段
│   ├── audio.png                    # 音频
│   ├── document.png                 # 文档
│   ├── location-pin.png             # 位置标记
│   ├── timestamp.png                # 时间戳
│   ├── watermark.png                # 水印
│   └── evidence-chain.png           # 证据链
│
└── misc/                            # 其他图标
    ├── user.png                     # 用户
    ├── team.png                     # 团队
    ├── settings.png                 # 设置
    ├── help.png                     # 帮助
    ├── search.png                   # 搜索
    ├── filter.png                   # 筛选
    ├── sort.png                     # 排序
    ├── calendar.png                 # 日历
    ├── clock.png                    # 时钟
    ├── notification.png             # 通知
    ├── badge.png                    # 徽章
    ├── medal.png                    # 勋章
    ├── star.png                     # 星标
    ├── heart.png                    # 收藏
    ├── bookmark.png                 # 书签
    └── tag.png                      # 标签
```

---

## 🎨 图标设计规范

### 1. 色彩规范

#### 系统状态色
```scss
// 警报红
$alert-red: #FF4D4F;        // 高危预警、SOS、危险状态

// 预警橙
$warning-orange: #FFA940;   // 中危预警、逻辑偏差

// 安全绿
$success-green: #73D13D;    // 设备正常、任务完成

// 全息蓝
$primary-blue: #00d4ff;     // 主要操作、选中状态

// 中性灰
$neutral-gray: #8c8c8c;     // 未选中、禁用状态

// 背景深色
$bg-dark: #0a0e1a;          // 深色背景
$bg-card: #1a1f2e;          // 卡片背景
```

#### 图标颜色使用建议
- **系统图标**：使用中性灰（#8c8c8c）或白色（#ffffff）
- **传感器图标**：
  - 在线：全息蓝（#00d4ff）
  - 警告：预警橙（#FFA940）
  - 离线：中性灰（#8c8c8c）
- **预警图标**：
  - 高危：警报红（#FF4D4F）
  - 中危：预警橙（#FFA940）
  - 低危：黄色（#FADB14）
  - 信息：全息蓝（#00d4ff）
- **操作图标**：全息蓝（#00d4ff）或白色（#ffffff）

---

## 📐 图标尺寸规范

### 不同场景的尺寸建议

| 使用场景 | 推荐尺寸 | 说明 |
|---------|---------|------|
| 底部导航栏 | 81x81px | TabBar 图标 |
| 地图标记 | 32x32px | 传感器标记点 |
| 工具栏按钮 | 48x48px | 右侧工具栏 |
| 状态指示器 | 24x24px | GPS、电池等状态图标 |
| 列表图标 | 40x40px | 预警列表、设备列表 |
| 大按钮图标 | 64x64px | SOS、拍照等主要操作 |

---

## 🎯 关键图标设计要点

### 1. GPS 图标系列
- **gps.png**：标准GPS图标，显示定位功能
- **gps-weak.png**：信号弱，使用虚线或半透明
- **gps-lost.png**：信号丢失，使用红色或叉号

**设计建议**：
- 使用卫星信号波纹效果
- 信号强度用波纹数量表示（3条=强，2条=中，1条=弱）
- 添加发光效果增强可见性

### 2. 电池图标系列
- **battery-full.png**：绿色，电量≥80%
- **battery-high.png**：蓝色，电量50-80%
- **battery-medium.png**：橙色，电量20-50%
- **battery-low.png**：红色，电量<20%，添加闪烁动画
- **battery-charging.png**：闪电符号，充电中

**设计建议**：
- 使用填充式设计，直观显示电量
- 低电量状态添加警告色
- 充电状态添加动态效果

### 3. 传感器图标系列
- **camera-visible.png**：摄像机图标，可见光
- **camera-infrared.png**：摄像机+红外波纹
- **fiber.png**：波浪线，表示震动
- **smell.png**：鼻子或气味分子图标

**设计建议**：
- 每种传感器使用独特的视觉符号
- 在线状态添加发光效果
- 离线状态使用灰色+虚线边框

### 4. SOS 图标
- **sos.png**：红色圆形，白色SOS文字
- **sos-active.png**：添加脉冲动画效果

**设计建议**：
- 使用高对比度（红底白字）
- 添加外发光效果
- 激活状态添加呼吸灯动画

### 5. 地图图层图标
- **satellite.png**：卫星图标
- **terrain.png**：地形等高线
- **dark-vector.png**：矢量地图图标

**设计建议**：
- 使用简洁的线性图标
- 选中状态添加全息蓝色
- 添加微妙的阴影增强立体感

---

## 🔧 图标导出规范

### 导出设置
```
格式：PNG-24（支持透明度）
色彩空间：sRGB
分辨率：72 DPI（屏幕显示）
压缩：无损压缩
```

### 多倍率导出
```
@1x: 原始尺寸（如 32x32px）
@2x: 2倍尺寸（如 64x64px）
@3x: 3倍尺寸（如 96x96px）
```

### 命名规范
```
图标名称-状态@倍率.png

示例：
battery-full.png          # 1倍图
battery-full@2x.png       # 2倍图
battery-full@3x.png       # 3倍图
```

---

## 🎨 设计工具推荐

### 矢量设计工具
- **Figma**（推荐）：在线协作，支持组件库
- **Sketch**：Mac专用，图标设计标准工具
- **Adobe Illustrator**：专业矢量设计
- **Affinity Designer**：性价比高的替代方案

### 图标资源库
- **Iconfont**（阿里巴巴图标库）：https://www.iconfont.cn/
- **Iconpark**（字节跳动图标库）：https://iconpark.oceanengine.com/
- **Feather Icons**：简洁的线性图标
- **Material Icons**：Google Material Design 图标

### 在线工具
- **Squoosh**：图片压缩优化
- **TinyPNG**：PNG压缩
- **SVGOMG**：SVG优化

---

## 📝 图标使用示例

### 在 Vue 组件中使用
```vue
<template>
  <image 
    class="icon" 
    src="/static/icons/system/gps.png" 
    mode="aspectFit"
  />
</template>

<style>
.icon {
  width: 48rpx;
  height: 48rpx;
}
</style>
```

### 动态切换图标
```vue
<template>
  <image 
    class="battery-icon" 
    :src="batteryIcon" 
    mode="aspectFit"
  />
</template>

<script>
export default {
  computed: {
    batteryIcon() {
      const battery = this.batteryLevel
      if (battery >= 80) return '/static/icons/system/battery-full.png'
      if (battery >= 50) return '/static/icons/system/battery-high.png'
      if (battery >= 20) return '/static/icons/system/battery-medium.png'
      return '/static/icons/system/battery-low.png'
    }
  }
}
</script>
```

---

## ✅ 图标检查清单

在设计完成后，请检查以下项目：

- [ ] 所有图标尺寸统一
- [ ] 背景透明
- [ ] 色彩符合设计规范
- [ ] 导出了多倍率版本（@1x, @2x, @3x）
- [ ] 文件命名规范
- [ ] 文件大小优化（建议<50KB）
- [ ] 在暗色背景下可见性良好
- [ ] 在小尺寸下依然清晰可辨
- [ ] 状态图标有明显区分
- [ ] 添加了必要的发光效果

---

## 🚀 快速开始

### 1. 创建图标目录
```bash
mkdir -p static/icons/{system,sensors,map,actions,alerts,navigation,status,evidence,misc}
```

### 2. 下载或设计图标
根据上述清单，准备所需的图标资源。

### 3. 优化图标
使用 TinyPNG 或 Squoosh 压缩图标文件。

### 4. 放置图标
将图标文件放置到对应的目录中。

### 5. 在代码中引用
在 Vue 组件中使用相对路径引用图标。

---

## 📞 联系与支持

如有图标设计相关问题，请联系设计团队。

---

**最后更新**：2026-01-20  
**版本**：v1.0.0  
**维护者**：热眼擒枭设计团队
