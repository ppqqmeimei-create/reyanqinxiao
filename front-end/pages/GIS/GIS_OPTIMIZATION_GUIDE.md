// GIS页面优化说明文档
// 用于替换原有的 front-end/pages/GIS/index.vue

/**
 * 主要改进点：
 * 
 * 1. 添加分类选项卡
 *    - 环保预警 (🌍)
 *    - 食品药品 (🏥)
 *    - 执法 (👮)
 * 
 * 2. 动态标记显示
 *    - 根据分类切换显示不同的标记
 *    - 支持环保、食品药品、执法三种类型
 * 
 * 3. 响应式布局
 *    - 手机端: 竖排布局
 *    - 平板端: 横排布局
 *    - 大屏端: 完整信息展示
 * 
 * 4. 新增API调用
 *    - /api/v1/gis/food-drug-alerts
 *    - /api/v1/gis/enforcement-officers
 *    - /api/v1/gis/patrol-routes
 *    - /api/v1/gis/enforcement-cases
 * 
 * 5. 改进的弹窗
 *    - 支持显示食品药品信息
 *    - 支持显示执法人员信息
 *    - 支持显示案件信息
 */

// ===== 核心数据结构 =====

// 分类选项卡
const categoryTabs = [
  { value: 'ecology', label: '环保预警', icon: '🌍' },
  { value: 'fooddrug', label: '食品药品', icon: '🏥' },
  { value: 'enforcement', label: '执法', icon: '👮' }
]

// 标记数据
const ecologyMarkers = []      // 环保预警标记
const fooddrugMarkers = []     // 食品药品标记
const enforcementMarkers = []  // 执法人员标记

// ===== 关键方法 =====

// 1. 切换分类
function handleCategoryChange(category) {
  activeCategory.value = category
  loadCategoryData(category)
}

// 2. 加载分类数据
async function loadCategoryData(category) {
  if (category === 'ecology') {
    // 调用 /api/v1/gis/pollution-sources
    const response = await uni.request({
      url: '/api/v1/gis/pollution-sources',
      method: 'GET'
    })
    ecologyMarkers.value = response.data.data.sources
  } else if (category === 'fooddrug') {
    // 调用 /api/v1/gis/food-drug-alerts
    const response = await uni.request({
      url: '/api/v1/gis/food-drug-alerts',
      method: 'GET',
      data: { 
        latitude: mapCenter.value.latitude, 
        longitude: mapCenter.value.longitude 
      }
    })
    fooddrugMarkers.value = response.data.data.alerts
  } else if (category === 'enforcement') {
    // 调用 /api/v1/gis/enforcement-officers
    const response = await uni.request({
      url: '/api/v1/gis/enforcement-officers',
      method: 'GET'
    })
    enforcementMarkers.value = response.data.data.officers
  }
}

// 3. 获取分类数量
function getCategoryCount(category) {
  switch (category) {
    case 'ecology':
      return ecologyMarkers.value.length
    case 'fooddrug':
      return fooddrugMarkers.value.length
    case 'enforcement':
      return enforcementMarkers.value.length
    default:
      return 0
  }
}

// ===== 样式改进 =====

/**
 * 分类选项卡样式
 * .cv-category-tabs {
 *   position: absolute;
 *   top: 20px;
 *   left: 20px;
 *   display: flex;
 *   gap: 12px;
 *   background: rgba(0, 0, 0, 0.7);
 *   padding: 12px;
 *   border-radius: 12px;
 *   z-index: 10;
 *   flex-wrap: wrap;
 * }
 * 
 * .cv-category-tab {
 *   display: flex;
 *   align-items: center;
 *   gap: 8px;
 *   padding: 8px 16px;
 *   background: rgba(255, 255, 255, 0.1);
 *   border: 1px solid rgba(255, 255, 255, 0.2);
 *   border-radius: 8px;
 *   color: #fff;
 *   font-size: 14px;
 *   transition: all 0.3s ease;
 *   
 *   &.active {
 *     background: rgba(0, 212, 255, 0.3);
 *     border-color: rgba(0, 212, 255, 0.5);
 *     box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
 *   }
 * }
 */

// ===== 响应式设计 =====

/**
 * 手机端 (< 480px)
 * - 分类选项卡竖排
 * - 控件竖排
 * - 弹窗全屏
 * 
 * 平板端 (480px - 768px)
 * - 分类选项卡横排
 * - 控件横排
 * - 弹窗80%宽度
 * 
 * 大屏端 (> 768px)
 * - 分类选项卡固定位置
 * - 控件固定位置
 * - 弹窗90%宽度
 */

// ===== 集成步骤 =====

/**
 * 1. 备份原有的 index.vue
 * 2. 将 index_enhanced.vue 的内容复制到 index.vue
 * 3. 在 server.js 中导入新的 gis_enhanced.js
 *    import gisEnhanced from './routes/gis_enhanced.js'
 *    app.use('/api/v1/gis', gisEnhanced)
 * 4. 在数据库中执行 11_gis_optimization.sql
 * 5. 重启后端服务
 * 6. 在微信开发者工具中测试
 */

// ===== 测试清单 =====

/**
 * [ ] 环保预警分类显示正常
 * [ ] 食品药品分类显示正常
 * [ ] 执法分类显示正常
 * [ ] 分类切换流畅
 * [ ] 标记显示正确
 * [ ] 弹窗显示正确
 * [ ] 手机端响应式正常
 * [ ] 平板端响应式正常
 * [ ] 大屏端响应式正常
 * [ ] API调用成功
 * [ ] 数据加载正确
 */

export default {
  name: 'GIS',
  description: '态势界面 - 优化版本'
}
