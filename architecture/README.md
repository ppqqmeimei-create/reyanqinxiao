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
%%{init: {'theme': 'base', 'themeVariables': { 
    'fontSize': '12px', 
    'nodeSpacing': '15',
    'rankSpacing': '35',
    'primaryColor': '#3b82f6',
    'primaryTextColor': '#fff',
    'primaryBorderColor': '#1d4ed8'
}}}%%
flowchart TB
    %% ============ 主标题 ============
    TITLE["<b>🔥 热眼擒枭 - 多传感器融合架构</b>"]
    
    %% ============ 感知层 ============
    subgraph SENSING["<b>🛰️ 感知层</b>"]
        S1["📷<br/>卡口抓拍<br/><sub>万尾·金滩·友谊关</sub>"]
        S2["📡<br/>活体探测雷达<br/><sub>凭祥·龙州·水口</sub>"]
        S3["〰️<br/>边界震动光纤<br/><sub>那坡·界碑·靖西</sub>"]
        S4["🚁<br/>无人机巡检<br/><sub>广西总部调度</sub>"]
    end
    
    %% ============ 数据汇聚 ============
    COLLECT["📥 多源数据汇聚"]
    
    %% ============ 边缘计算层 ============
    subgraph EDGE["<b>⚡ 边缘计算层</b>"]
        E1["① EDGE-GX-HQ<br/><sub>广西总部指挥节点</sub>"]
        E2["② EDGE-GX-PX<br/><sub>凭祥边贸节点</sub>"]
        E3["③ EDGE-GX-LZ<br/><sub>龙州口岸节点</sub>"]
        E4["④ EDGE-GX-NP<br/><sub>那坡山区节点</sub>"]
        E5["⑤ EDGE-GX-JX<br/><sub>靖西边境节点</sub>"]
    end
    
    %% ============ 数据融合层 ============
    subgraph FUSION["<b>🧠 数据融合层</b>"]
        F1["🔗 时空融合引擎<br/><sub>坐标对齐·时间同步</sub>"]
        F2["🤖 AI物种识别<br/><sub>CITES等级判定</sub>"]
        F3["⚖️ 风险评估引擎<br/><sub>0-100分·历史加权</sub>"]
        F4["🚨 预警生成器<br/><sub>SSE实时推送</sub>"]
    end
    
    %% ============ 存储层 ============
    subgraph STORAGE["<b>🗄️ 存储层</b>"]
        direction LR
        DB["🗃️ MySQL<br/><sub>alerts·locations<br/>devices·tasks</sub>"]
        CACHE["💾 本地离线缓存<br/><sub>地图包·离线数据</sub>"]
    end
    
    %% ============ 应用层 ============
    subgraph APP["<b>📱 应用层 Vue3 / uni-app</b>"]
        direction LR
        P1["🗺️ GIS态势<br/><sub>五图层叠加</sub>"]
        P2["📊 ECharts<br/><sub>时段分析</sub>"]
        P3["✅ 任务执行<br/><sub>检查清单·取证</sub>"]
        P4["🔧 设备监控<br/><sub>健康度监控</sub>"]
        P5["🔴 预警工作台<br/><sub>线索流</sub>"]
    end
    
    %% ============ 执法闭环 ============
    subgraph ENFORCE["<b>📡 执法闭环</b>"]
        direction LR
        L1["🚔 派警调度"]
        L2["📋 证据固定"]
        L3["🔍 研判分析"]
        L4["📁 案件归档"]
    end
    
    %% ============ 数据流向 ============
    SENSING --> COLLECT
    COLLECT --> EDGE
    EDGE --> FUSION
    F1 --> F2 --> F3 --> F4
    FUSION --> STORAGE
    STORAGE --> APP
    APP --> ENFORCE
    L1 --> L2 --> L3 --> L4
    L4 -.->|"触发新预警"| F4
    
    %% ============ 样式定义 ============
    classDef SENSING fill:#dbeafe,stroke:#3b82f6,stroke-width:3px,color:#1e40af
    classDef EDGE fill:#fef3c7,stroke:#f59e0b,stroke-width:3px,color:#92400e
    classDef FUSION fill:#d1fae5,stroke:#10b981,stroke-width:3px,color:#065f46
    classDef STORAGE fill:#ede9fe,stroke:#8b5cf6,stroke-width:3px,color:#5b21b6
    classDef APP fill:#fee2e2,stroke:#ef4444,stroke-width:3px,color:#991b1b
    classDef ENFORCE fill:#fef9c3,stroke:#eab308,stroke-width:3px,color:#854d0e
    classDef TITLE fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#1e293b,font-size:18px
    classDef COLLECT fill:#bbf7d0,stroke:#22c55e,stroke-width:2px,color:#166534

    class SENSING SENSING
    class EDGE EDGE
    class FUSION FUSION
    class STORAGE STORAGE
    class APP APP
    class ENFORCE ENFORCE
    class TITLE TITLE
    class COLLECT COLLECT
```

---

### 架构特点

- **🛰️ 多源感知**: 7类传感器协同，覆盖红外、雷达、震动、视觉、水质等多种维度
- **⚡ 边缘计算**: 5大节点分布式部署，就近实时处理，降低网络延迟
- **🧠 智能融合**: 时空数据融合 + AI物种识别 + 风险研判全链路分析
- **🔄 闭环运营**: 从预警到执法全流程闭环管理，数据持续迭代优化

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
