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
    'fontSize': '14px', 
    'nodeSpacing': '20',
    'rankSpacing': '35',
    'primaryColor': '#3b82f6'
}}}%%
flowchart TD
    %% ============ 主标题 ============
    TITLE["<b>🔥 热眼擒枭 - 多传感器融合架构</b>"]
    
    %% ============ 感知层 ============
    subgraph SENSING["<b>🛰️ 感知层</b>"]
        direction LR
        S1["📷 红外"]
        S2["📡 雷达"]
        S3["〰️ 震动"]
        S4["📹 卡口"]
        S5["💧 水质"]
        S6["📝 人工"]
        S7["🚁 无人机"]
    end
    
    %% ============ 边缘计算层 ============
    subgraph EDGE["<b>⚡ 边缘计算层</b>"]
        direction LR
        E1["①东兴"]
        E2["②凭祥"]
        E3["③龙州"]
        E4["④那坡"]
        E5["⑤总部"]
    end
    
    %% ============ 数据融合层 ============
    subgraph FUSION["<b>🧠 数据融合层</b>"]
        direction LR
        F1["🔗 时空融合"]
        F2["🤖 AI识别"]
        F3["⚖️ 研判引擎"]
        F4["📊 风险评分"]
        F5["🚨 预警生成"]
    end
    
    %% ============ 存储层 ============
    subgraph STORAGE["<b>🗄️ 存储层</b>"]
        direction LR
        DB["🗃️ MySQL"]
        CACHE["💾 离线缓存"]
    end
    
    %% ============ 应用层 ============
    subgraph APP["<b>📱 应用层</b>"]
        direction LR
        P1["🗺️ GIS"]
        P2["📊 大屏"]
        P3["⚖️ 执法"]
        P4["🔴 预警"]
        P5["✅ 任务"]
        P6["🔧 设备"]
    end
    
    %% ============ 执法闭环 ============
    subgraph ENFORCE["<b>📡 执法闭环</b>"]
        direction LR
        L1["🚔 派警"]
        L2["📋 取证"]
        L3["🔍 研判"]
        L4["📁 归档"]
    end
    
    %% ============ 数据流向（全部向下） ============
    SENSING -->|"↓ 多源数据汇聚"| EDGE
    EDGE -->|"↓ 边缘处理"| FUSION
    F1 --> F2 --> F3 --> F4 --> F5
    FUSION -->|"↓ 分析结果"| STORAGE
    STORAGE -->|"↓ 数据支撑"| APP
    APP -->|"↓ 预警触发"| ENFORCE
    L1 --> L2 --> L3 --> L4
    L4 -.->|"↑ 触发新预警"| F5
    
    %% ============ 样式定义 ============
    classDef SENSING fill:#dbeafe,stroke:#3b82f6,stroke-width:3px,color:#1e40af
    classDef EDGE fill:#fef3c7,stroke:#f59e0b,stroke-width:3px,color:#92400e
    classDef FUSION fill:#d1fae5,stroke:#10b981,stroke-width:3px,color:#065f46
    classDef STORAGE fill:#ede9fe,stroke:#8b5cf6,stroke-width:3px,color:#5b21b6
    classDef APP fill:#fee2e2,stroke:#ef4444,stroke-width:3px,color:#991b1b
    classDef ENFORCE fill:#fef9c3,stroke:#eab308,stroke-width:3px,color:#854d0e
    classDef TITLE fill:#f8fafc,stroke:#64748b,stroke-width:2px,color:#1e293b,font-size:16px

    class SENSING SENSING
    class EDGE EDGE
    class FUSION FUSION
    class STORAGE STORAGE
    class APP APP
    class ENFORCE ENFORCE
    class TITLE TITLE
```

---

### 系统整体技术链路图

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {
    'fontSize': '12px',
    'nodeSpacing': '25',
    'rankSpacing': '40',
    'primaryColor': '#1976d2',
    'edgeLabelBackground': '#ffffff'
}}}%%
flowchart TD
    %% ============ 主标题 ============
    TITLE["<b>🔥 热眼擒枭 - 系统整体技术链路图</b>"]
    SUBTITLE["<i>边境活物走私智能防控全链路闭环系统</i>"]

    %% ============ 感知层 ============
    subgraph SENSING["<b>🛰️ 感知层</b>"]
        direction LR
        S1["📷 红外热成像\n友谊关/东兴/龙州/那坡"]
        S2["📡 活体探测雷达\n凭祥/龙州水口"]
        S3["〰️ 边界震动光纤\n那坡界碑/靖西岳圩"]
        S4["📹 卡口抓拍摄像头\n万尾金滩/友谊关"]
        S5["🚁 无人机巡检系统\n广西总部调度"]
        S6["💧 水质监测传感器\n边境河段/水源地"]
        S7["📝 人工上报\n一线执法人员"]
    end

    %% ============ 边缘计算层 ============
    subgraph EDGE["<b>⚡ 边缘计算层</b>"]
        direction LR
        E1["🏢 EDGE-GX-HQ\n广西总部指挥节点"]
        E2["📍 EDGE-DX-01\n东兴节点(防城港)"]
        E3["📍 EDGE-PX-01\n凭祥节点(崇左)"]
        E4["📍 EDGE-LZ-01\n龙州节点(崇左)"]
        E5["📍 EDGE-NAPO-01\n那坡节点(百色)"]
    end

    %% ============ 数据融合层 ============
    subgraph FUSION["<b>🧠 数据融合层</b>"]
        direction LR
        F1["🔗 时空融合引擎\n坐标对齐/时间戳同步"]
        F2["🤖 AI物种识别\nCITES等级判定/置信度"]
        F3["⚖️ 风险研判引擎\n0-100分/历史加权"]
        F4["📊 风险评分输出\n威胁等级分类"]
        F5["🚨 预警生成模块\n实时推送"]
    end

    %% ============ 存储层 ============
    subgraph STORAGE["<b>🗄️ 存储层</b>"]
        direction LR
        DB1["🗃️ MySQL数据库\nalerts/tasks/devices/users"]
        DB2["💾 Redis缓存\n实时数据/会话管理"]
        DB3["📦 SQLite离线缓存\n边境地图包/脱网数据"]
    end

    %% ============ 应用层 ============
    subgraph APP["<b>📱 应用层</b>"]
        direction LR
        A1["🗺️ GIS态势一图\n五图层叠加/热力图"]
        A2["📊 指挥大屏\nECharts时段分析"]
        A3["🔴 预警工作台\n实时线索流/SSE推送"]
        A4["✅ 任务执行页\n执法清单/取证水印"]
        A5["🔧 设备监控页\n网络拓扑/健康度"]
        A6["👤 个人中心\nAI模型/安全设置"]
    end

    %% ============ 执法闭环 ============
    subgraph ENFORCE["<b>📡 执法闭环</b>"]
        direction LR
        L1["🚔 派警调度\n角色权限/就近派警"]
        L2["📋 证据固定\n水印相机/电子签名"]
        L3["🔍 研判分析\nAI辅助/案件关联"]
        L4["📁 案件归档\n证据链存证/哈希校验"]
    end

    %% ============ 数据流向 ============
    SENSING -->|"MQTT/HTTP\n实时采集"| EDGE
    E1 -.->|"调度控制"| S5
    EDGE -->|"边缘预处理\n本地AI推理"| FUSION
    F1 --> F2 --> F3 --> F4 --> F5
    FUSION -->|"分析结果入库"| STORAGE
    STORAGE -->|"数据支撑"| APP
    APP -->|"触发预警"| ENFORCE
    L1 --> L2 --> L3 --> L4
    L4 -.->|"案件归档\n触发新预警"| F5

    %% ============ 样式定义 ============
    classDef SENSING fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#0d47a1
    classDef EDGE fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c
    classDef FUSION fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20
    classDef STORAGE fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100
    classDef APP fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#880e4f
    classDef ENFORCE fill:#fff8e1,stroke:#fbc02d,stroke-width:2px,color:#f57f17
    classDef TITLE fill:#263238,stroke:#455a64,stroke-width:3px,color:#ffffff,font-size:18px

    class SENSING SENSING
    class EDGE EDGE
    class FUSION FUSION
    class STORAGE STORAGE
    class APP APP
    class ENFORCE ENFORCE
    class TITLE TITLE
```

### 核心数据模型关系图

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {
    'fontSize': '10px'
}}}%%
erDiagram
    USER ||--o{ ALERT : "assigned_to"
    USER ||--o{ ALERT : "created_by"
    USER ||--o{ TASK : "assigned_to"
    ALERT ||--o{ TASK : "triggers"
    ALERT ||--o| WILDLIFE_CASE : "escalates_to"
    TASK ||--o{ TASK_EVIDENCE : "contains"
    DEVICE ||--o{ DEVICE_METADATA : "generates"
    
    USER {
        int id PK
        string badge_number UK
        string username
        enum role
        bool is_active
    }
    
    ALERT {
        int id PK
        enum level
        enum type
        enum status
        float risk_score
        float latitude
        float longitude
    }
    
    TASK {
        int id PK
        string title
        enum status
        int alert_id FK
        int assigned_to FK
    }
    
    DEVICE {
        int id PK
        string device_id UK
        enum type
        enum status
    }
```

### API接口链路图

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {
    'fontSize': '10px'
}}}%%
flowchart TB
    subgraph API["API接口 (/api/v1)"]
        subgraph AUTH["认证模块"]
            A1["POST /auth/login"]
            A2["POST /auth/biometric"]
            A3["POST /auth/logout"]
        end
        
        subgraph ALERT["预警模块"]
            B1["GET /alerts"]
            B2["GET /alerts/:id"]
            B3["PUT /alerts/:id/assign"]
        end
        
        subgraph TASK["任务模块"]
            C1["GET /tasks"]
            C2["POST /tasks"]
            C3["PUT /tasks/:id"]
        end
        
        subgraph FUSION["融合模块"]
            E1["GET /fusion/events"]
            E2["GET /fusion/metrics"]
            E3["POST /fusion/dispatch"]
        end
        
        subgraph WS["实时通信"]
            W1["WS /ws/command"]
            W2["SSE /sse/alerts"]
        end
    end

    classDef AUTH fill:#ffcdd2,stroke:#d32f2f
    classDef ALERT fill:#f8bbd0,stroke:#c2185b
    classDef TASK fill:#e1bee7,stroke:#7b1fa2
    classDef FUSION fill:#c5cae9,stroke:#303f9f
    classDef WS fill:#bbdefb,stroke:#1976d2

    class AUTH AUTH
    class ALERT ALERT
    class TASK TASK
    class FUSION FUSION
    class WS WS
```

---

### 系统技术架构图

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {
    'fontSize': '11px',
    'nodeSpacing': '20',
    'rankSpacing': '45'
}}}%%
flowchart TD
    TITLE["<b>🔥 热眼擒枭 - 系统技术架构图</b>"]

    subgraph SENSING[<b>🛰️ 感知层</b>]
        DRONE["🚁 无人机巡检"]
        FIBER["〰️ 边界震动光纤"]
        RADAR["📡 活体探测雷达"]
        CAM1["📹 卡口抓拍"]
        CAM2["📷 红外热成像"]
    end

    subgraph EDGE[<b>⚡ 边缘计算节点</b>]
        HQ["🏢 EDGE-GX-HQ"]
        NAPO["📍 EDGE-NAPO-01"]
        LONGZHOU["📍 EDGE-LZ-01"]
        PINGXIANG["📍 EDGE-PX-01"]
        DONGXING["📍 EDGE-DX-01"]
    end

    subgraph FUSION[<b>🧠 数据融合层</b>]
        FUSE["🔗 时空融合"]
        AI["🤖 AI物种识别"]
        RISK["📊 风险分引擎"]
        SSE["🚨 SSE实时推送"]
    end

    subgraph STORAGE[<b>🗄️ 存储层</b>]
        MYSQL["🗃️ MySQL"]
        CACHE["💾 离线缓存"]
    end

    subgraph APP[<b>📱 应用层</b>]
        GIS["🗺️ GIS态势一图"]
        SCREEN["📊 指挥大屏"]
        TASK["✅ 任务执行"]
        SENSOR["🔧 设备监控"]
        WARN["🔴 预警工作台"]
    end

    subgraph ENFORCE[<b>📡 执法闭环</b>]
        DISPATCH["🚔 派警调度"]
        EVIDENCE["📋 证据固定"]
        ANALYSIS["🔍 研判分析"]
        ARCHIVE["📁 案件归档"]
    end

    SENSING -->|"↓ 实时采集"| EDGE
    DRONE -.-> HQ
    FIBER -.-> NAPO
    RADAR -.-> LONGZHOU
    CAM1 -.-> PINGXIANG
    CAM2 -.-> DONGXING

    HQ & NAPO & LONGZHOU & PINGXIANG & DONGXING -->|"↓ 边缘预处理"| FUSION
    FUSE --> AI --> RISK --> SSE
    SSE -->|"↓ 预警入库"| STORAGE
    STORAGE -->|"↓ 数据查询"| APP
    MYSQL -.->|"双向读写"| APP

    WARN -->|"↓ 预警触发"| ENFORCE
    DISPATCH --> EVIDENCE --> ANALYSIS --> ARCHIVE
    ARCHIVE -.->|"↑ 触发新预警"| SSE

    classDef ENFORCE fill:#fef9c3,stroke:#eab308,stroke-width:3px,color:#854d0e
    classDef SENSING fill:#e1f5fe,stroke:#03a9f4,stroke-width:3px,color:#01579b
    classDef EDGE fill:#f3e5f5,stroke:#9c27b0,stroke-width:3px,color:#4a148c
    classDef FUSION fill:#c8e6c9,stroke:#43a047,stroke-width:3px,color:#1b5e20
    classDef STORAGE fill:#fff3e0,stroke:#fb8c00,stroke-width:3px,color:#e65100
    classDef APP fill:#e8f5e9,stroke:#4caf50,stroke-width:3px,color:#1b5e20
    classDef TITLE fill:#0a0e17,stroke:#3b82f6,stroke-width:2px,color:#f9fafb,font-size:16px

    class SENSING SENSING
    class EDGE EDGE
    class FUSION FUSION
    class STORAGE STORAGE
    class APP APP
    class ENFORCE ENFORCE
    class TITLE TITLE

    subgraph __spacer[ ]
        SPACE1[ ] --> SPACE2[ ] --> SPACE3[ ] --> SPACE4[ ] --> SPACE5[ ]
        GIS -.-> SPACE1
        SCREEN -.-> SPACE2
        TASK -.-> SPACE3
        SENSOR -.-> SPACE4
        WARN -.-> SPACE5
        style __spacer fill:none,stroke:none
    end
```

---

### 架构特点
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
