<template>
	<view class="fooddrug-filter">
		<scroll-view scroll-x class="filter-scroll">
			<view class="filter-buttons">
				<view
					v-for="item in filterItems"
					:key="item.value"
					class="filter-btn"
					:class="{ active: activeFilter === item.value }"
					@tap="$emit('filterChange', item.value)"
				>
					<text class="filter-text">{{ item.label }}</text>
					<text v-if="item.count" class="filter-count">{{ item.count }}</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	activeFilter: { type: String, default: 'all' },
	counts: { type: Object, required: true }
})

const emit = defineEmits(['filterChange'])

const filterItems = computed(() => [
	{ value: 'all', label: '全部预警', count: props.counts.all },
	{ value: 'critical', label: '严重风险', count: props.counts.critical },
	{ value: 'warning', label: '高风险', count: props.counts.warning },
	{ value: 'recalled', label: '已召回', count: props.counts.recalled }
])
</script>

<style lang="scss" scoped>
.fooddrug-filter {
	background: rgba(0, 0, 0, 0.3);
	border-bottom: 1px solid rgba(0, 212, 255, 0.1);
	padding: 12rpx 0;
}

.filter-scroll {
	width: 100%;
	white-space: nowrap;
}

.filter-buttons {
	display: flex;
	gap: 12rpx;
	padding: 0 16rpx;
}

.filter-btn {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 20rpx;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid var(--line-soft);
	border-radius: 20rpx;
	white-space: nowrap;
	transition: all 0.3s ease;

	&.active {
		background: rgba(0, 212, 255, 0.2);
		border-color: rgba(0, 212, 255, 0.5);
		box-shadow: 0 0 12rpx rgba(0, 212, 255, 0.3);
	}
}

.filter-text {
	font-size: 24rpx;
	color: #fff;
}

.filter-count {
	font-size: 20rpx;
	color: #8c8c8c;
	background: rgba(255, 255, 255, 0.1);
	padding: 2rpx 8rpx;
	border-radius: 10rpx;
}
</style>
