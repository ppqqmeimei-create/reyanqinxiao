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
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px', 'nodeSpacing': '25', 'rankSpacing': '120'}}}%%
flowchart LR
    %% ============ 模块标题 ============
    T1["<b>🛰️ 感知层</b>"]
    T2["<b>⚡ 边缘计算层</b>"]
    T3["<b>🧠 数据融合层</b>"]
    T4["<b>🗄️ 存储层</b>"]
    T5["<b>📱 应用层</b>"]
    T6["<b>📡 执法闭环</b>"]

    %% ============ 感知层（7个） ============
    subgraph S1["<div style='text-align: center; font-size: 24px; padding: 8px;'>🛰️ 感知层</div>"]
        direction LR
        S1_1["📷 红外热成像"]
        S1_2["📡 活体探测雷达"]
        S1_3["〰️ 震动光纤"]
        S1_4["📹 卡口抓拍"]
        S1_5["💧 水质监测"]
        S1_6["📝 人工上报"]
        S1_7["🚁 无人机"]
    end

    %% ============ 边缘计算层（5个） ============
    E1["① 东兴节点<br/>防城港"]
    E2["② 凭祥节点<br/>崇左"]
    E3["③ 龙州节点<br/>崇左"]
    E4["④ 那坡节点<br/>百色"]
    E5["⑤ 广西总部<br/>指挥"]

    %% ============ 数据融合层（5个） ============
    FUSE["时空融合引擎"]
    AI["AI物种识别"]
    JUDGE["走私研判引擎"]
    RISK["风险评分引擎"]
    SSE["预警生成器"]

    %% ============ 存储层（2个） ============
    DB["MySQL"]
    CACHE["离线缓存"]

    %% ============ 应用层（6个） ============
    P1["🗺️ GIS态势"]
    P2["📊 指挥大屏"]
    P3["⚖️ 执法闭环"]
    P4["🔴 预警工作台"]
    P5["✅ 任务执行"]
    P6["🔧 设备监控"]

    %% ============ 执法闭环（4个） ============
    DISPATCH["派警调度"]
    EVIDENCE["证据固定"]
    RESEARCH["研判分析"]
    CLOSE["案件归档"]

    %% ============ 标题与模块连接 ============
    T1 --> S1_1 & S1_2 & S1_3 & S1_4 & S1_5 & S1_6 & S1_7
    T2 --> E1 & E2 & E3 & E4 & E5
    T3 --> FUSE & AI & JUDGE & RISK & SSE
    T4 --> DB & CACHE
    T5 --> P1 & P2 & P3 & P4 & P5 & P6
    T6 --> DISPATCH & EVIDENCE & RESEARCH & CLOSE

    %% ============ 数据流向（跨层连接） ============
    S1_1 & S1_2 & S1_3 & S1_4 & S1_5 & S1_6 & S1_7 --> E1 & E2 & E3 & E4 & E5
    E1 & E2 & E3 & E4 & E5 --> FUSE
    FUSE --> AI --> JUDGE --> RISK --> SSE
    SSE --> DB & CACHE
    DB & CACHE --> P1 & P2 & P3 & P4 & P5 & P6
    P4 --> DISPATCH
    DISPATCH --> EVIDENCE --> RESEARCH --> CLOSE
    CLOSE -.->|触发新预警| SSE

    %% ============ 样式定义 ============
    classDef TITLE fill:none,stroke:none,color:#000,font-weight:bold,font-size:16px
    classDef SENSOR fill:#e8f4fd,stroke:#1890ff,stroke-width:2px,color:#003a8c
    classDef EDGE fill:#fff7e6,stroke:#fa8c16,stroke-width:2px,color:#873800
    classDef FUSION fill:#f6ffed,stroke:#52c41a,stroke-width:2px,color:#135200
    classDef STORE fill:#f9f0ff,stroke:#722ed1,stroke-width:2px,color:#391085
    classDef APP fill:#fff1f0,stroke:#f5222d,stroke-width:2px,color:#820014
    classDef LOOP fill:#fffbe6,stroke:#d48806,stroke-width:2px,color:#7a4100

    class T1,T2,T3,T4,T5,T6 TITLE
    class S1_1,S1_2,S1_3,S1_4,S1_5,S1_6,S1_7 SENSOR
    class E1,E2,E3,E4,E5 EDGE
    class FUSE,AI,JUDGE,RISK,SSE FUSION
    class DB,CACHE STORE
    class P1,P2,P3,P4,P5,P6 APP
    class DISPATCH,EVIDENCE,RESEARCH,CLOSE LOOP
```

---

## 架构说明

### 层级结构

| 层级 | 核心组件 | 功能说明 |
|:----:|:---------|:---------|
| **🛰️ 感知层** | 红外/雷达/震动/卡口/水质/人工/无人机 | 7类终端采集边境多维度数据 |
| **⚡ 边缘层** | 东兴、凭祥、龙州、那坡、广西总部 | 5大节点就近实时处理 |
| **🧠 融合层** | 时空融合 + AI识别 + 研判引擎 + 风险评分 | 多模态数据智能分析 |
| **🗄️ 存储层** | MySQL + 本地缓存 | 结构化存储 · 离线兜底 |
| **📱 应用层** | GIS / 大屏 / 执法 / 预警 / 任务 / 设备 | 8大业务模块支撑 |
| **📡 业务闭环** | 派警 → 取证 → 研判 | 执法全流程闭环管理 |

### 核心流程

```
感知层采集 → 边缘计算 → 数据融合 → 风险评分 → SSE推送 → 预警工作台
     ↓
派警调度 → 执法终端 → 证据固定 → 研判分析 → (触发新预警) → 案件归档
```

### 技术栈

| 类别 | 技术选型 |
|:-----|:---------|
| **前端框架** | Vue 3 + uni-app（多端统一） |
| **后端服务** | Node.js + Express + WebSocket |
| **数据库** | MySQL + Redis + SQLite离线缓存 |
| **AI能力** | 目标检测（YOLO）+ 物种识别 + 行为分析 |
| **通信协议** | SSE实时推送 + HTTP/2 + MQTT（传感器） |
| **GIS平台** | Mapbox GL + 天地图 + 热力图渲染 |
| **边缘计算** | 5大节点分布式部署 · 就近推理 |
| **安全合规** | 证据哈希存证 · 水印追踪 · 国产密码 |

---

**热眼擒枭 - 用科技守护绿水青山，用智慧筑牢边境防线**
