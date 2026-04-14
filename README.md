# 热眼擒枭 - 边境活物走私智能防控引领者

热眼擒枭平台是一套面向边境活物走私防控场景的软件系统，集成移动端、管理后台、服务端及数据库管理能力，围绕"态势感知、预警管理、任务处置、设备监控、执法取证、统计研判"构建完整业务闭环。系统通过 GIS 可视化展示、多角色权限协同、实时预警联动和证据链管理，提升边境一线执法工作的数字化、智能化和协同化水平。

## 在线访问

访问地址：https://ppqqmeimei-create.github.io/reyanqinxiao/architecture/

## 本地运行

```bash
# 直接在浏览器中打开
open index.html
# 或使用 Python 服务
python -m http.server 8000
# 访问 http://localhost:8000
```

## 部署到 GitHub Pages

1. 在 GitHub 上创建仓库 `reyanqinxiao`
2. 推送代码到 `gh-pages` 分支
3. 在仓库 Settings → Pages 中选择 `gh-pages` 分支

## 多传感器融合架构图

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '20px', 'nodeSpacing': '35', 'rankSpacing': '120'}}}%%
flowchart TB
    subgraph SENSOR["<b>🛰️ 感知层（边境传感器网络）</b>"]
        direction LR
        IR["📷 红外热成像摄像头\n友谊关 / 东兴 / 龙州 / 那坡"]
        VIB["〰️ 震动光纤\n那坡界碑 / 靖西岳圩"]
        RADAR["📡 活体探测雷达\n凭祥 / 龙州水口"]
        CAM["📹 卡口抓拍摄像头\n万尾金滩 / 友谊关"]
        WATER["💧 水质监测节点\n那坡界河监测点-03"]
        MANUAL["📝 人工上报/群众举报"]
    end

    subgraph EDGE["<b>⚡ 边缘计算层（5大边境节点）</b>"]
        direction TB
        E1["东兴节点\n防城港"]
        E2["凭祥节点\n崇左"]
        E3["龙州节点\n崇左"]
        E4["那坡节点\n百色"]
        E5["广西总部\n指挥节点"]
    end

    subgraph FUSION["<b>🧠 数据融合层（Node.js / Express）</b>"]
        direction TB
        FUSE["时空融合引擎\n坐标对齐 · 时间戳同步 · 冲突消解"]
        AI["AI物种识别\nCITES等级判定 · 置信度评分"]
        JUDGE["走私研判引擎\n物种保护级别 · 保护等级权重"]
        RISK["风险评分引擎\n综合评分 0-100 · 历史案件加权"]
        SSE["SSE实时推送\n预警实时下发 · 前端热更新"]
    end

    subgraph STORE["<b>🗄️ 存储层</b>"]
        direction TB
        MYSQL["<b>MySQL</b>\nalerts / locations\ndevices / tasks"]
        CACHE["本地离线缓存\n边境无网场景兜底"]
    end

    subgraph APP["<b>📱 应用层（Vue3 + uni-app）</b>"]
        direction TB
        GIS["🗺️ GIS态势一张图\n五图层叠加显示"]
        DASH["📊 指挥大屏\nECharts走私时段分析"]
        ENFORCE["⚖️ 执法闭环页\n案件创建 · 证据上传 · 处罚建议"]
        WILDLIFE["🦅 走私预警页\n物种分析 · 案件统计 · 风险追踪"]
        TASK["✅ 任务执行页\n检查清单 · 取证水印 · 派警调度"]
        FOODDRUG["💊 食品药品监管\n冷链追溯 · 风险成分检测"]
        DEV["🔧 传感器网络页\n设备健康度 · 在线率��控"]
        ALERT_UI["🚨 预警工作台\n实时走私线索流 · SSE推送监控"]
    end

    IR & CAM --> E1
    IR --> E2
    VIB --> E4
    RADAR --> E2 & E3
    WATER --> E4
    MANUAL --> E2
    DRONE{{🚁 无人机}} -.-> E5

    E1 & E2 & E3 & E4 & E5 --> FUSE

    FUSE --> AI
    FUSE --> JUDGE
    FUSE --> RISK
    AI --> JUDGE
    JUDGE --> RISK
    RISK --> SSE
    SSE --> ALERT_UI

    FUSE --> MYSQL
    ALERT_UI --> MYSQL

    MYSQL --> GIS & DASH & ENFORCE & WILDLIFE & TASK & FOODDRUG & DEV
    CACHE --> GIS

    ALERT_UI --> DISPATCH["📡 派警调度\n智能推荐执法员 · 就近+忙闲+完成率"]
    DISPATCH --> ENFORCE
    ENFORCE --> EVIDENCE["📋 证据固定\n照片/视频 · 取证水印 · 哈希存证"]
    EVIDENCE --> RESEARCH["🔬 研判分析\n物种聚类 · 时段规律 · 链条还原"]
    RESEARCH -.->|触发新预警| SSE
    RESEARCH -.->|案件归档| MYSQL

    classDef SENSOR fill:#e8f4fd,stroke:#1890ff,color:#003a8c
    classDef EDGE fill:#fff7e6,stroke:#fa8c16,color:#873800
    classDef FUSION fill:#f6ffed,stroke:#52c41a,color:#135200
    classDef STORE fill:#f9f0ff,stroke:#722ed1,color:#391085
    classDef APP fill:#fff1f0,stroke:#f5222d,color:#820014
    classDef LOOP fill:#fffbe6,stroke:#d48806,color:#7a4100

    class IR,VIB,RADAR,CAM,WATER,MANUAL SENSOR
    class E1,E2,E3,E4,E5 EDGE
    class FUSE,AI,JUDGE,RISK,SSE FUSION
    class MYSQL,CACHE STORE
    class GIS,DASH,ENFORCE,WILDLIFE,TASK,FOODDRUG,DEV,ALERT_UI APP
    class DISPATCH,EVIDENCE,RESEARCH LOOP
```

---

## 在线访问

访问地址：https://ppqqmeimei-create.github.io/reyanqinxiao/architecture/

## 本地运行

```bash
# 直接在浏览器中打开
open index.html
# 或使用 Python 服务
python -m http.server 8000
# 访问 http://localhost:8000
```

## 部署到 GitHub Pages

1. 在 GitHub 上创建仓库 `reyanqinxiao`
2. 推送代码到 `gh-pages` 分支
3. 在仓库 Settings → Pages 中选择 `gh-pages` 分支

## 架构说明

本页面展示了热眼擒枭系统的三层架构：

### 云端层（数据中心）
- 态势感知：实时监控大屏
- AI研判：多模态融合分析
- 任务调度：智能任务分配
- 数据分析：趋势预测研判

### 边缘层（计算节点）
- 战区1 · 东兴
- 战区2 · 凭祥
- 战区3 · 龙州
- 战区4 · 靖西
- 战区5 · 那坡

### 设备层（感知终端）
- 红外热成像
- GPS定位
- 振动光纤
- 单兵设备
- 可见光摄像
- 无人机
- 气味传感
- 水质传感

## 技术栈

- Vue 3 / uni-app
- Node.js / Express
- MySQL / Redis
- WebSocket
- 红外热成像 / 振动光纤
- 边缘计算 / AI研判
- 多模态融合 / 离线同步
- 防伪取证 / GIS地图

---

**热眼擒枭 - 用科技守护绿水青山，用智慧筑牢边境防线**
