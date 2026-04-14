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
	counts: { type: Object, default: () => ({ all: 0, critical: 0, high: 0, warning: 0, medium: 0, low: 0, handled: 0 }) }
})
const emit = defineEmits(['filterChange'])
// 借鉴参考项目的 Emoji 体系，融合走私防控预警等级
const filters = [
	{ key: 'all',      label: '全部态势', emoji: '📋' },
	{ key: 'critical', label: '高危走私', emoji: '🔴' },
	{ key: 'high',     label: '重点研判', emoji: '🔺' },
	{ key: 'warning',  label: '联动核查', emoji: '🟠' },
	{ key: 'handled',  label: '闭环处置', emoji: '✅' }
]
function handleTap(key) { emit('filterChange', key); uni.vibrateShort() }
</script>

<style lang="scss" scoped>
/* ==================== FilterBar 筛选栏 ==================== */
/* 借鉴参考项目 FilterBar：颜色区分背景 + 发光下划线 + Emoji体系 */
.filter-bar {
	display: flex;
	align-items: center;
	padding: 14rpx 24rpx 0;
	background: rgba(10, 14, 26, 0.98);
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	gap: 8rpx;
}

.filter-item {
	position: relative;
	flex: 1;
	height: 84rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 16rpx 16rpx 0 0;
	transition: all 0.25s ease;

	&.active {
		background: rgba(255, 255, 255, 0.04);
	}
	/* 按类型区分激活背景色 */
	&.active-all {
		background: rgba(0, 212, 255, 0.1);
	}
	&.active-critical {
		background: rgba(255, 77, 79, 0.1);
	}
	&.active-high {
		background: rgba(255, 77, 79, 0.1);
	}
	&.active-warning {
		background: rgba(255, 169, 64, 0.1);
	}
	&.active-medium {
		background: rgba(250, 173, 20, 0.1);
	}
	&.active-low {
		background: rgba(115, 209, 61, 0.08);
	}
	&.active-handled {
		background: rgba(115, 209, 61, 0.08);
	}
	&:active {
		transform: scale(0.96);
		opacity: 0.85;
	}
}

.filter-inner {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.filter-emoji {
	font-size: 28rpx;
	line-height: 1;
}

.filter-label {
	font-size: 26rpx;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.45);
	transition: color 0.2s ease;
}

.active .filter-label {
	color: #ffffff;
	font-weight: 700;
}

.filter-badge {
	min-width: 36rpx;
	height: 36rpx;
	padding: 0 8rpx;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
}

.badge-all { background: #00d4ff; }
.badge-critical { background: #FF4D4F; }
.badge-high { background: #FF4D4F; }
.badge-warning { background: #FFA940; }
.badge-medium { background: #FFA940; }
.badge-low { background: #73D13D; }
.badge-handled { background: #595959; }

.badge-num {
	font-size: 18rpx;
	font-weight: 800;
	color: #fff;
}

/* 发光下划线（借鉴参考项目） */
.active-line {
	position: absolute;
	bottom: 0;
	left: 15%;
	width: 70%;
	height: 3px;
	border-radius: 3px;
	animation: lineGlow 0.3s ease forwards;
}

.line-all {
	background: #00d4ff;
	box-shadow: 0 0 10rpx #00d4ff, 0 0 20rpx rgba(0, 212, 255, 0.4);
}
.line-critical {
	background: #FF4D4F;
	box-shadow: 0 0 10rpx #FF4D4F, 0 0 20rpx rgba(255, 77, 79, 0.4);
}
.line-high {
	background: #FF4D4F;
	box-shadow: 0 0 10rpx #FF4D4F, 0 0 20rpx rgba(255, 77, 79, 0.4);
}
.line-warning {
	background: #FFA940;
	box-shadow: 0 0 10rpx #FFA940, 0 0 20rpx rgba(255, 169, 64, 0.4);
}
.line-medium {
	background: #FAAD14;
	box-shadow: 0 0 10rpx #FAAD14, 0 0 20rpx rgba(250, 173, 20, 0.4);
}
.line-low {
	background: #73D13D;
	box-shadow: 0 0 10rpx #73D13D, 0 0 20rpx rgba(115, 209, 61, 0.4);
}
.line-handled {
	background: #73D13D;
	box-shadow: 0 0 10rpx #73D13D;
}

@keyframes lineGlow {
	0%   { opacity: 0; transform: scaleX(0.5); }
	100% { opacity: 1; transform: scaleX(1); }
}
</style>
