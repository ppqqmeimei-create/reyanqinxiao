<!-- GIS页面增强版 - 添加分类功能 -->
<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 分类选项卡
const categoryTabs = ref([
	{ value: 'ecology', label: '环保预警', icon: '🌍' },
	{ value: 'fooddrug', label: '食品药品', icon: '🏥' },
	{ value: 'enforcement', label: '执法', icon: '👮' }
])

const activeCategory = ref('ecology')
const mapCenter = ref({ latitude: 39.9042, longitude: 116.4074 })
const mapScale = ref(10)

// 各分类的标记数据
const ecologyMarkers = ref([])
const fooddrugMarkers = ref([])
const enforcementMarkers = ref([])

// 根据分类显示不同的标记
const displayMarkers = computed(() => {
	switch (activeCategory.value) {
		case 'ecology':
			return ecologyMarkers.value
		case 'fooddrug':
			return fooddrugMarkers.value
		case 'enforcement':
			return enforcementMarkers.value
		default:
			return []
	}
})

function handleCategoryChange(category) {
	activeCategory.value = category
	loadCategoryData(category)
}

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

async function loadCategoryData(category) {
	try {
		if (category === 'ecology') {
			// 加载环保预警
			const response = await uni.request({
				url: '/api/v1/gis/pollution-sources',
				method: 'GET'
			})
			if (response.data.success) {
				ecologyMarkers.value = response.data.data.sources.map(s => ({
					id: s.device_id,
					latitude: s.latitude,
					longitude: s.longitude,
					title: s.name,
					type: s.type
				}))
			}
		} else if (category === 'fooddrug') {
			// 加载食品药品预警
			const response = await uni.request({
				url: '/api/v1/gis/food-drug-alerts',
				method: 'GET',
				data: { 
					latitude: mapCenter.value.latitude, 
					longitude: mapCenter.value.longitude 
				}
			})
			if (response.data.success) {
				fooddrugMarkers.value = response.data.data.alerts.map(a => ({
					id: a.id,
					latitude: a.latitude,
					longitude: a.longitude,
					title: a.product_name,
					type: a.alert_type
				}))
			}
		} else if (category === 'enforcement') {
			// 加载执法人员
			const response = await uni.request({
				url: '/api/v1/gis/enforcement-officers',
				method: 'GET'
			})
			if (response.data.success) {
				enforcementMarkers.value = response.data.data.officers.map(o => ({
					id: o.id,
					latitude: o.latitude,
					longitude: o.longitude,
					title: o.name,
					type: 'officer'
				}))
			}
		}
	} catch (error) {
		console.error('加载数据失败:', error)
	}
}

onLoad(() => {
	loadCategoryData('ecology')
})
</script>

<style lang="scss" scoped>
/* 分类选项卡样式 */
.cv-category-tabs {
	position: absolute;
	top: 20px;
	left: 20px;
	display: flex;
	gap: 12px;
	background: rgba(0, 0, 0, 0.7);
	padding: 12px;
	border-radius: 12px;
	z-index: 10;
	flex-wrap: wrap;
}

.cv-category-tab {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 8px;
	color: #fff;
	font-size: 14px;
	transition: all 0.3s ease;
	
	&.active {
		background: rgba(0, 212, 255, 0.3);
		border-color: rgba(0, 212, 255, 0.5);
		box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
	}
}

.cv-tab-icon {
	font-size: 18px;
}

.cv-tab-text {
	font-weight: 500;
	white-space: nowrap;
}

.cv-tab-count {
	background: rgba(255, 255, 255, 0.2);
	padding: 2px 8px;
	border-radius: 10px;
	font-size: 12px;
}

/* 响应式设计 */
@media (min-width: 768px) {
	.cv-category-tabs {
		flex-direction: row;
		left: 40px;
		top: 40px;
	}
}

@media (min-width: 1200px) {
	.cv-category-tabs {
		left: 60px;
		top: 60px;
	}
}
</style>
