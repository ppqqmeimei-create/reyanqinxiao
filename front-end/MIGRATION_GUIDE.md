# 前端文件迁移指南

## 📋 需要移动的文件和文件夹

请将以下文件从原项目目录复制到 `front-end` 文件夹：

### 1. 核心文件夹（必须）
```
原位置                                    目标位置
pages/                    →    front-end/pages/
static/                   →    front-end/static/
utils/                    →    front-end/utils/
```

### 2. 核心配置文件（必须）
```
原位置                                    目标位置
App.vue                   →    front-end/App.vue
main.js                   →    front-end/main.js
pages.json                →    front-end/pages.json
manifest.json             →    front-end/manifest.json
uni.scss                  →    front-end/uni.scss
uni.promisify.adaptor.js  →    front-end/uni.promisify.adaptor.js
index.html                →    front-end/index.html
```

### 3. 项目配置文件（可选）
```
原位置                                    目标位置
project.config.json       →    front-end/project.config.json
project.private.config.json → front-end/project.private.config.json
```

## 🚀 手动迁移步骤

### 方法一：使用文件管理器（推荐）

1. **打开文件管理器**
   - 打开 `C:\Users\Maystars\Desktop\挑战杯\热眼擒枭\热眼擒枭`

2. **复制文件夹**
   - 右键点击 `pages` 文件夹 → 复制
   - 进入 `front-end` 文件夹 → 粘贴

3. **重复步骤2**
   - 复制 `static` 文件夹
   - 复制 `utils` 文件夹

4. **复制文件**
   - 复制 `App.vue` 到 `front-end/`
   - 复制 `main.js` 到 `front-end/`
   - 复制 `pages.json` 到 `front-end/`
   - 复制 `manifest.json` 到 `front-end/`
   - 复制 `uni.scss` 到 `front-end/`
   - 复制 `uni.promisify.adaptor.js` 到 `front-end/`
   - 复制 `index.html` 到 `front-end/`
   - 复制 `project.config.json` 到 `front-end/`
   - 复制 `project.private.config.json` 到 `front-end/`

### 方法二：使用命令行（Windows CMD）

```batch
REM 进入项目目录
cd C:\Users\Maystars\Desktop\挑战杯\热眼擒枭\热眼擒枭

REM 复制文件夹
xcopy pages ..\front-end\pages /E /I /Y
xcopy static ..\front-end\static /E /I /Y
xcopy utils ..\front-end\utils /E /I /Y

REM 复制文件
copy App.vue ..\front-end\
copy main.js ..\front-end\
copy pages.json ..\front-end\
copy manifest.json ..\front-end\
copy uni.scss ..\front-end\
copy uni.promisify.adaptor.js ..\front-end\
copy index.html ..\front-end\
copy project.config.json ..\front-end\
copy project.private.config.json ..\front-end\
```

## ✅ 迁移完成后的目录结构

```
front-end/
├── pages/                      # 页面文件
│   ├── Alert Center/
│   ├── Dashboard/
│   ├── Device/
│   ├── GIS/
│   ├── login/
│   ├── Profile/
│   └── Task/
├── static/                     # 静态资源
├── utils/                      # 工具函数
├── App.vue                     # 主应用
├── main.js                     # 入口文件
├── pages.json                  # 页面配置
├── manifest.json               # 应用配置
├── uni.scss                    # 全局样式
├── uni.promisify.adaptor.js    # uni-app适配器
├── index.html                  # HTML入口
├── project.config.json         # 项目配置
├── project.private.config.json # 私有配置
├── package.json                # npm配置
└── README.md                   # 项目说明
```

## 🔍 验证迁移

迁移完成后，检查以下内容：

1. ✅ `front-end/pages/` 包含所有页面文件夹
2. ✅ `front-end/static/` 包含所有静态资源
3. ✅ `front-end/utils/` 包含所有工具函数
4. ✅ `front-end/App.vue` 存在
5. ✅ `front-end/main.js` 存在
6. ✅ `front-end/pages.json` 存在
7. ✅ `front-end/manifest.json` 存在

## 📝 注意事项

- 确保文件夹名称完全相同（区分大小写）
- 不要移动原项目中的文件，只需复制
- 迁移完成后，可以在 `front-end` 文件夹中运行项目
- 原项目文件夹可以保留作为备份

## 🚀 迁移后的开发

迁移完成后，你可以：

1. **在 front-end 文件夹中开发**
   ```bash
   cd front-end
   npm install
   npm run dev
   ```

2. **构建项目**
   ```bash
   npm run build
   ```

3. **构建微信小程序**
   ```bash
   npm run build:mp-weixin
   ```

---

**迁移完成后，请告诉我！** 😊
