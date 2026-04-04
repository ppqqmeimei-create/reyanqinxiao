@echo off
REM 热眼擒枭后端启动脚本 (Windows)

echo.
echo ========================================
echo   热眼擒枭 - 后端 API 服务启动
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 版本: %NODE_VERSION%

REM 检查 npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未找到 npm
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm 版本: %NPM_VERSION%

REM 检查 node_modules
if not exist "node_modules" (
    echo.
    echo 📦 安装依赖中...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
)

REM 检查 .env 文件
if not exist ".env" (
    echo.
    echo ⚠️  警告: 未找到 .env 文件
    echo 正在从 .env.example 复制...
    if exist ".env.example" (
        copy .env.example .env
        echo ✅ .env 文件已创建，请修改配置
    ) else (
        echo ❌ 错误: 未找到 .env.example
        pause
        exit /b 1
    )
)

echo.
echo 🎯 启动 API 服务...
echo 📚 API 文档: http://localhost:3000/api/docs
echo 💚 健康检查: http://localhost:3000/health
echo.

call npm run dev

pause
