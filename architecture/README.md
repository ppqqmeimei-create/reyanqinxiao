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
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '18px', 'nodeSpacing': '35', 'rankSpacing': '70'}}}%%
flowchart TB
    %% ============ 感知层（纵向排列） ============
    subgraph S1["<div style='text-align: center;'>🛰️ 感知层</div>"]
        direction TB
        S1_1["📷 红外热成像"]
        S1_2["📡 活体探测雷达"]
        S1_3["〰️ 震动光纤"]
        S1_4["📹 卡口抓拍"]
        S1_5["💧 水质监测"]
        S1_6["📝 人工上报"]
        S1_7["🚁 无人机"]
    end

    %% ============ 边缘计算层（核心处理） ============
    subgraph S2["<div style='text-align: center;'>⚡ 边缘计算层</div>"]
        direction TB
        E1["<b>① 东兴节点</b><br/>防城港战区"]
        E2["<b>② 凭祥节点</b><br/>崇左战区"]
        E3["<b>③ 龙州节点</b><br/>崇左战区"]
        E4["<b>④ 那坡节点</b><br/>百色战区"]
        E5["<b>⑤ 广西总部</b><br/>指挥节点"]
    end

    %% ============ 数据融合层（核心能力） ============
    subgraph S3["<div style='text-align: center;'>🧠 数据融合层</div>"]
        direction TB
        FUSE["<b>时空融合引擎</b><br/>坐标对齐 · 时间同步 · 冲突消解"]
        AI["<b>AI物种识别</b><br/>CITES等级 · 置信度评分"]
        JUDGE["<b>走私研判引擎</b><br/>保护级别 · 风险分析"]
        RISK["<b>风险评分引擎</b><br/>综合评分 0-100"]
        SSE["<b>预警生成器</b><br/>SSE推送 · 实时下发"]
    end

    %% ============ 存储层 ============
    subgraph S4["<div style='text-align: center;'>🗄️ 存储层</div>"]
        direction LR
        DB["<b>MySQL</b><br/>alerts/locations<br/>devices/tasks"]
        CACHE["<b>离线缓存</b><br/>SQLite兜底"]
    end

    %% ============ 应用层（核心功能） ============
    subgraph S5["<div style='text-align: center;'>📱 应用层</div>"]
        direction LR
        P1["🗺️ GIS态势"]
        P2["📊 指挥大屏"]
        P3["⚖️ 执法闭环"]
        P4["🔴 预警工作台"]
        P5["✅ 任务执行"]
        P6["🔧 设备监控"]
    end

    %% ============ 业务闭环（右侧） ============
    subgraph LOOP["<div style='text-align: center;'>📡 执法闭环</div>"]
        direction TB
        DISPATCH["📡 派警调度<br/>智能推荐执法员"]
        EVIDENCE["📋 证据固定<br/>水印 · 哈希存证"]
        RESEARCH["🔬 研判分析<br/>聚类 · 规律 · 还原"]
        CLOSE["📁 案件归档<br/>历史案件库"]
    end

    %% ============ 数据流向 ============
    S1 --> S2

    E1 & E2 & E3 & E4 & E5 --> FUSE
    FUSE --> AI --> JUDGE --> RISK --> SSE

    S3 --> DB
    SSE --> P4
    DB --> S5
    CACHE --> P1

    P4 --> DISPATCH
    DISPATCH --> EVIDENCE
    EVIDENCE --> RESEARCH
    RESEARCH --> CLOSE
    CLOSE -.->|触发新预警| SSE

    %% ============ 样式定义 ============
    classDef SENSOR fill:#e8f4fd,stroke:#1890ff,stroke-width:2px,color:#003a8c
    classDef EDGE fill:#fff7e6,stroke:#fa8c16,stroke-width:2px,color:#873800
    classDef FUSION fill:#f6ffed,stroke:#52c41a,stroke-width:2px,color:#135200
    classDef STORE fill:#f9f0ff,stroke:#722ed1,stroke-width:2px,color:#391085
    classDef APP fill:#fff1f0,stroke:#f5222d,stroke-width:2px,color:#820014
    classDef LOOP fill:#fffbe6,stroke:#d48806,stroke-width:2px,color:#7a4100

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
