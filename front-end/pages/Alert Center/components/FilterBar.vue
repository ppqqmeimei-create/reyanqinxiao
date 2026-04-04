<template>
	<view class="filter-bar">
		<view
			v-for="filter in filters" :key="filter.key"
			class="filter-item"
			:class="{ active: activeFilter === filter.key, ['active-' + filter.key]: activeFilter === filter.key }"
			@tap="handleTap(filter.key)"
		>
			<view class="filter-inner">
				<text class="filter-emoji">{{ filter.emoji }}</text>
				<text class="filter-label">{{ filter.label }}</text>
				<view v-if="counts[filter.key] > 0" class="filter-badge" :class="'badge-' + filter.key">
					<text class="badge-num">{{ counts[filter.key] }}</text>
				</view>
			</view>
			<view v-if="activeFilter === filter.key" class="active-line" :class="'line-' + filter.key"></view>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({
	activeFilter: { type: String, default: 'all' },
	counts: { type: Object, default: () => ({ all: 0, critical: 0, warning: 0, handled: 0 }) }
})
const emit = defineEmits(['filterChange'])
const filters = [
	{ key: 'all', label: '全部', emoji: '📋' },
	{ key: 'critical', label: '高危', emoji: '🔴' },
	{ key: 'warning', label: '预警', emoji: '🟠' },
	{ key: 'handled', label: '已处理', emoji: '✅' }
]
function handleTap(key) { emit('filterChange', key); uni.vibrateShort() }
</script>

<style lang="scss" scoped>
.filter-bar {
	display: flex; 
	align-items: center; 
	padding: 8rpx calc(20rpx + env(safe-area-inset-left)) 0 calc(20rpx + env(safe-area-inset-right));
	background: rgba(10,14,26,0.98);
	border-bottom: 1px solid rgba(255,255,255,0.05);
	gap: 6rpx;
}
.filter-item {
	position: relative; flex: 1; height: 72rpx;
	display: flex; align-items: center; justify-content: center;
	border-radius: 16rpx 16rpx 0 0;
	transition: background 0.2s ease;
	&.active { background: rgba(255,255,255,0.04); }
	&.active-critical { background: rgba(255,77,79,0.08); }
	&.active-warning { background: rgba(255,169,64,0.08); }
	&.active-all { background: rgba(0,212,255,0.08); }
	&.active-handled { background: rgba(115,209,61,0.06); }
	&:active { transform: scale(0.96); }
}
.filter-inner { display: flex; align-items: center; gap: 8rpx; }
.filter-emoji { font-size: 24rpx; line-height: 1; }
.filter-label { font-size: 24rpx; font-weight: 600; color: rgba(255,255,255,0.5); }
.active .filter-label { color: #ffffff; }
.filter-badge {
	min-width: 36rpx; height: 36rpx; padding: 0 8rpx;
	border-radius: 18rpx; display: flex; align-items: center; justify-content: center;
}
.badge-all { background: #00d4ff; }
.badge-critical { background: #FF4D4F; }
.badge-warning { background: #FFA940; }
.badge-handled { background: #595959; }
.badge-num { font-size: 18rpx; font-weight: 800; color: #fff; }
.active-line {
	position: absolute; bottom: 0; left: 20%; width: 60%; height: 3px; border-radius: 2px;
}
.line-all { background: #00d4ff; box-shadow: 0 0 8px #00d4ff; }
.line-critical { background: #FF4D4F; box-shadow: 0 0 8px #FF4D4F; }
.line-warning { background: #FFA940; box-shadow: 0 0 8px #FFA940; }
.line-handled { background: #73D13D; box-shadow: 0 0 8px #73D13D; }
</style>
