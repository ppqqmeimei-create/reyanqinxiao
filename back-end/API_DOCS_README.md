# 热眼擒枭 - 接口文档目录

## 📚 文档说明

本目录包含"热眼擒枭"边境巡逻智能系统的所有后端接口文档。

---

## 📋 文档列表

### 1. [API规范文档](./api-规范.md)
- 接口统一规范
- 请求/响应格式
- 状态码规范
- 错误码规范
- 安全规范

### 2. [认证接口](./01-认证接口.md)
- 用户登录
- 刷新Token
- 退出登录
- 获取用户信息
- 更新执勤状态
- 设置离线凭证
- 生物识别绑定

**接口数量**: 7个

### 3. [预警接口](./02-预警接口.md)
- 获取预警列表
- 获取预警详情
- 忽略预警
- 从预警创建任务
- 获取预警统计
- 实时预警推送（WebSocket）

**接口数量**: 6个

### 4. [任务接口](./03-任务接口.md)
- 获取任务详情
- 更新任务位置
- 上传证据
- 获取离线证据列表
- 同步离线证据
- 完成任务
- 获取任务列表

**接口数量**: 7个

### 5. [设备接口](./04-设备接口.md)
- 获取设备列表
- 获取设备详情
- 获取设备拓扑
- 获取系统健康评分
- 获取数据同步状态
- 手动触发数据同步
- 获取离线地图包列表
- 下载离线地图包
- 删除离线地图包
- 清理缓存

**接口数量**: 10个

### 6. [GIS地图接口](./05-GIS地图接口.md)
- 获取地图标记点
- 获取拓扑连接线
- 获取影子追踪数据
- 上报当前位置
- 获取巡逻轨迹
- 发送SOS求救
- 计算距离
- 获取最新预警（地图用）

**接口数量**: 8个

### 7. [AI模型接口](./06-AI模型接口.md)
- 获取AI模型信息
- 检查模型更新
- 下载AI模型
- 查询下载进度
- 安装AI模型
- 回滚AI模型
- 获取模型性能统计

**接口数量**: 7个

---

## 📊 接口统计

| 模块 | 接口数量 | 需要登录 | WebSocket |
|------|---------|---------|-----------|
| 认证 | 7 | 5个 | 否 |
| 预警 | 6 | 6个 | 1个 |
| 任务 | 7 | 7个 | 否 |
| 设备 | 10 | 10个 | 否 |
| GIS地图 | 8 | 8个 | 否 |
| AI模型 | 7 | 7个 | 否 |
| **合计** | **45** | **43个** | **1个** |

---

## 🔐 认证说明

### Token机制

- **Access Token**: 有效期7天，用于接口认证
- **Refresh Token**: 有效期30天，用于刷新Access Token
- **请求头格式**: `Authorization: Bearer {token}`

### 离线凭证

- 用于断网环境下的本地身份验证
- 有效期30天
- 基于哈希算法的安全验证

### 生物识别

- 支持指纹和面容识别
- 用于快速登录和敏感操作验证
- 数据本地存储，不上传服务器

---

## 🌐 环境配置

### 基础URL

```
开发环境: https://dev-api.reyan-qinxiao.com
测试环境: https://test-api.reyan-qinxiao.com
生产环境: https://api.reyan-qinxiao.com
```

### WebSocket URL

```
开发环境: wss://dev-api.reyan-qinxiao.com/ws
测试环境: wss://test-api.reyan-qinxiao.com/ws
生产环境: wss://api.reyan-qinxiao.com/ws
```

---

## 📝 接口调用流程

### 1. 登录流程

```
1. 调用 POST /api/auth/login
2. 获取 token 和 refreshToken
3. 保存到本地存储
4. 后续请求携带 token
```

### 2. Token刷新流程

```
1. 检测到 token 过期（401错误）
2. 调用 POST /api/auth/refresh
3. 使用 refreshToken 获取新 token
4. 更新本地存储
5. 重试原请求
```

### 3. 任务执行流程

```
1. 从预警列表选择预警
2. 调用 POST /api/alerts/{alertId}/create-task 创建任务
3. 调用 GET /api/tasks/{taskId} 获取任务详情
4. 实时上报位置 PUT /api/tasks/{taskId}/location
5. 采集证据 POST /api/tasks/{taskId}/evidence
6. 完成任务 PUT /api/tasks/{taskId}/complete
```

### 4. 离线证据同步流程

```
1. 断网时本地保存证据
2. 网络恢复后调用 GET /api/tasks/offline-evidence
3. 批量上传 POST /api/tasks/sync-evidence
4. 清理已同步证据
```

---

## 🔧 开发建议

### 1. 错误处理

```javascript
// 统一错误处理
uni.request({
  url: API_BASE + '/api/alerts/list',
  header: {
    'Authorization': 'Bearer ' + token
  },
  success: (res) => {
    if (res.statusCode === 200) {
      // 处理成功响应
    } else if (res.statusCode === 401) {
      // Token过期，刷新Token
      refreshToken().then(() => {
        // 重试请求
      })
    } else {
      // 其他错误
      uni.showToast({
        title: res.data.message,
        icon: 'none'
      })
    }
  },
  fail: (error) => {
    // 网络错误
    uni.showToast({
      title: '网络连接失败',
      icon: 'none'
    })
  }
})
```

### 2. 请求封装

```javascript
// 封装统一请求方法
function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_BASE + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken(),
        'X-Device-ID': getDeviceId(),
        'X-App-Version': '1.0.0',
        'X-Platform': 'mp-weixin',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data.data)
        } else {
          reject(res.data)
        }
      },
      fail: reject
    })
  })
}
```

### 3. 离线优先策略

```javascript
// 离线优先的数据获取
async function getAlerts() {
  try {
    // 先从缓存读取
    const cachedData = uni.getStorageSync('alerts_cache')
    if (cachedData && Date.now() - cachedData.time < 60000) {
      return cachedData.data
    }
    
    // 尝试从网络获取
    const data = await request({ url: '/api/alerts/list' })
    
    // 更新缓存
    uni.setStorageSync('alerts_cache', {
      data: data,
      time: Date.now()
    })
    
    return data
  } catch (error) {
    // 网络失败，返回缓存数据
    const cachedData = uni.getStorageSync('alerts_cache')
    return cachedData ? cachedData.data : null
  }
}
```

---

## 📞 技术支持

- **文档维护**: 热眼擒枭开发组
- **更新频率**: 随版本迭代更新
- **问题反馈**: dev@reyan-qinxiao.com

---

## 📅 更新日志

### v1.0.0 (2026-01-23)
- ✅ 初始版本
- ✅ 完成45个接口文档
- ✅ 包含7个功能模块
- ✅ 添加接口规范和开发建议

---

**文档版本**: v1.0.0  
**最后更新**: 2026-01-23  
**维护团队**: 热眼擒枭开发组
