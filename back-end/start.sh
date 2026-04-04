#!/bin/bash

# 热眼擒枭后端启动脚本

echo "🚀 启动热眼擒枭后端服务..."

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js 版本: $NODE_VERSION"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm 版本: $NPM_VERSION"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查 MongoDB
echo "🔍 检查 MongoDB 连接..."
# 这里可以添加 MongoDB 连接检查逻辑

# 启动服务
echo "🎯 启动 API 服务..."
npm run dev
