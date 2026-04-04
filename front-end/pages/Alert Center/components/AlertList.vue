<template>
	<view class="alert-list">
		<AlertCard 
			v-for="alert in alerts" 
			:key="alert.id"
			:alert="alert"
			:category="category"
			@click="handleAlertClick(alert)"
			@ignore="handleIgnore(alert)"
			@createTask="handleCreateTask(alert)"
		/>
	</view>
</template>

<script setup>
import AlertCard from './AlertCard.vue'

const props = defineProps({
	alerts: { type: Array, default: () => [] },
	category: { type: String, default: 'enforcement' }
})
const emit = defineEmits(['alertClick', 'ignoreAlert', 'createTask'])

function handleAlertClick(alert) { emit('alertClick', alert) }
function handleIgnore(alert) { emit('ignoreAlert', alert) }
function handleCreateTask(alert) { emit('createTask', alert) }
</script>

<style lang="scss" scoped>
.alert-list { padding: 8rpx 16rpx 24rpx; display: flex; flex-direction: column; gap: 12rpx; }

/* 平板适配 - 双列布局 */
@media (min-width: 768px) {
	.alert-list {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24rpx;
	}
}

/* 大屏适配 - 三列布局 */
@media (min-width: 1200px) {
	.alert-list {
		grid-template-columns: repeat(3, 1fr);
	}
}
</style>
