@echo off
chcp 65001 >nul
echo ================================================
echo   热眼擒枭 - 架构可视化页面 部署脚本
echo ================================================
echo.

:: 检查 GitHub Token
echo [1/5] 检查 GitHub 配置...
set /p TOKEN="请输入你的 GitHub Personal Access Token (https://github.com/settings/tokens): "

if "%TOKEN%"=="" (
    echo [错误] Token 不能为空！
    pause
    exit /b 1
)

:: 设置仓库信息
set REPO_NAME=reyanqinxiao
set ORG_NAME=ppqqmeimei-create
set REPO_DESC=热眼擒枭 - 边境活物走私智能防控与生态协同预警平台

:: 创建 GitHub 仓库
echo.
echo [2/5] 创建 GitHub 仓库...

curl -s -X POST "https://api.github.com/user/repos" ^
    -H "Authorization: token %TOKEN%" ^
    -H "Content-Type: application/json" ^
    -d "{\"name\":\"%REPO_NAME%\",\"description\":\"%REPO_DESC%\",\"private\":false,\"has_issues\":true,\"has_wiki\":true}" >nul

echo      仓库 %ORG_NAME%/%REPO_NAME% 已创建/已存在

:: 配置 git remote
echo.
echo [3/5] 配置 Git 仓库...
git remote set-url origin https://%TOKEN%@github.com/%ORG_NAME%/%REPO_NAME%.git
git branch -M main

:: 推送代码
echo.
echo [4/5] 推送代码到 GitHub...
git add -A
git commit -m "feat: 添加云-边-端协同架构可视化页面"
git push -u origin main

:: 创建 gh-pages 分支
echo.
echo [5/5] 部署到 GitHub Pages...
git subtree push --prefix=architecture origin gh-pages

echo.
echo ================================================
echo   部署完成！
echo.
echo   架构可视化页面: https://%ORG_NAME%.github.io/%REPO_NAME%/architecture/
echo   仓库地址: https://github.com/%ORG_NAME%/%REPO_NAME%
echo ================================================
pause
