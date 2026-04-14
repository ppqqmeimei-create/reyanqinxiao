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
    'rankSpacing': '40',
    'primaryColor': '#3b82f6'
}}}%%
flowchart TB
    %% ============ 主标题 ============
    TITLE["<b>🔥 热眼擒枭 - 多传感器融合架构</b>"]

    %% ============ 感知层 ============
    subgraph SENSING["<b>🛰️ 感知层</b><br/><font size='12' color='#64748b'>多源数据采集</font>"]
        direction LR
        S1["📷<br/>红外热成像"]
        S2["📡<br/>活体探测雷达"]
        S3["〰️<br/>震动光纤"]
        S4["📹<br/>卡口抓拍"]
        S5["💧<br/>水质监测"]
        S6["📝<br/>人工上报"]
        S7["🚁<br/>无人机"]
    end
    
    %% ============ 边缘计算层 ============
    subgraph EDGE["<b>⚡ 边缘计算层</b><br/><font size='12' color='#64748b'>分布式就近处理</font>"]
        direction LR
        E1["①<br/>东兴节点<br/><sub>防城港</sub>"]
        E2["②<br/>凭祥节点<br/><sub>崇左</sub>"]
        E3["③<br/>龙州节点<br/><sub>崇左</sub>"]
        E4["④<br/>那坡节点<br/><sub>百色</sub>"]
        E5["⑤<br/>广西总部<br/><sub>指挥中心</sub>"]
    end
    
    %% ============ 数据融合层 ============
    subgraph FUSION["<b>🧠 数据融合层</b><br/><font size='12' color='#64748b'>多模态智能分析</font>"]
        direction LR
        F1["🔗<br/>时空融合引擎"]
        F2["🤖<br/>AI物种识别"]
        F3["⚖️<br/>走私研判引擎"]
        F4["📊<br/>风险评分引擎"]
        F5["🚨<br/>预警生成器"]
    end
    
    %% ============ 存储层 ============
    subgraph STORAGE["<b>🗄️ 存储层</b><br/><font size='12' color='#64748b'>结构化存储 · 离线兜底</font>"]
        direction LR
        DB["🗃️<br/>MySQL<br/><sub>业务数据库</sub>"]
        CACHE["💾<br/>离线缓存<br/><sub>边缘节点</sub>"]
    end
    
    %% ============ 应用层 ============
    subgraph APP["<b>📱 应用层</b><br/><font size='12' color='#64748b'>6大业务模块支撑</font>"]
        direction LR
        P1["🗺️<br/>GIS态势"]
        P2["📊<br/>指挥大屏"]
        P3["⚖️<br/>执法闭环"]
        P4["🔴<br/>预警工作台"]
        P5["✅<br/>任务执行"]
        P6["🔧<br/>设备监控"]
    end
    
    %% ============ 执法闭环 ============
    subgraph ENFORCE["<b>📡 执法闭环</b><br/><font size='12' color='#64748b'>全流程闭环管理</font>"]
        direction LR
        L1["🚔<br/>派警调度"]
        L2["📋<br/>证据固定"]
        L3["🔍<br/>研判分析"]
        L4["📁<br/>案件归档"]
    end
    
    %% ============ 数据流向 ============
    TITLE --> SENSING
    SENSING -->|"数据汇聚"| EDGE
    EDGE -->|"边缘处理"| FUSION
    FUSION -->|"分析结果"| STORAGE
    STORAGE -->|"数据支撑"| APP
    APP -->|"预警触发"| ENFORCE
    
    F1 --> F2 --> F3 --> F4 --> F5
    L1 --> L2 --> L3 --> L4
    L4 -.->|"触发新预警"| F5
    
    %% ============ 样式定义 ============
    classDef SENSING fill:#dbeafe,stroke:#3b82f6,stroke-width:3px,color:#1e40af
    classDef EDGE fill:#fef3c7,stroke:#f59e0b,stroke-width:3px,color:#92400e
    classDef FUSION fill:#d1fae5,stroke:#10b981,stroke-width:3px,color:#065f46
    classDef STORAGE fill:#ede9fe,stroke:#8b5cf6,stroke-width:3px,color:#5b21b6
    classDef APP fill:#fee2e2,stroke:#ef4444,stroke-width:3px,color:#991b1b
    classDef ENFORCE fill:#fef9c3,stroke:#eab308,stroke-width:3px,color:#854d0e
    classDef TITLE fill:#f1f5f9,stroke:#475569,stroke-width:2px,color:#1e293b,font-size:18px

    class SENSING SENSING
    class EDGE EDGE
    class FUSION FUSION
    class STORAGE STORAGE
    class APP APP
    class ENFORCE ENFORCE
    class TITLE TITLE
```

---

### 架构特点

| 层级 | 特点 | 说明 |
|:----:|:-----|:-----|
| 🛰️ **感知层** | 多源采集 | 7类传感器协同，覆盖红外、雷达、震动、视觉、水质等多种维度 |
| ⚡ **边缘计算层** | 分布式处理 | 5大节点就近实时处理，降低网络延迟，提升响应速度 |
| 🧠 **数据融合层** | 智能分析 | 时空融合 + AI识别 + 风险研判全链路分析 |
| 🗄️ **存储层** | 高可靠 | MySQL结构化存储 + 边缘节点离线缓存 |
| 📱 **应用层** | 全场景覆盖 | GIS态势、指挥大屏、执法闭环、预警管理等6大模块 |
| 📡 **执法闭环** | 持续优化 | 派警→取证→研判→归档，案件归档触发新预警循环迭代 |

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
