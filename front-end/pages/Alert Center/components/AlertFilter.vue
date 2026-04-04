<template>
	<view class="alert-filter-header">
		<!-- 顶部状态栏占位 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		
		<!-- 同步状态指示器 -->
		<view class="sync-indicator">
			<view v-if="syncStatus === 'synced'" class="sync-status synced">
				<view class="status-dot online"></view>
				<text class="status-text">数据已实时更新</text>
			</view>
			<view v-else-if="syncStatus === 'syncing'" class="sync-status syncing">
				<view class="loading-spinner"></view>
				<text class="status-text">正在同步...</text>
			</view>
			<view v-else class="sync-status offline">
				<view class="status-dot offline"></view>
				<text class="status-text">待同步：{{ pendingCount }} 条</text>
			</view>
		</view>
		
		<!-- 风险分类标签 -->
		<view class="filter-tabs">
			<view 
				class="filter-tab"
				:class="{ active: activeFilter === 'all' }"
				@tap="handleFilterChange('all')"
			>
				<text class="tab-text">全部</text>
				<view v-if="activeFilter === 'all'" class="tab-indicator"></view>
			</view>
			
			<view 
				class="filter-tab critical"
				:class="{ active: activeFilter === 'critical' }"
				@tap="handleFilterChange('critical')"
			>
				<view class="tab-icon-wrapper critical">
					<image class="tab-icon" src="/static/icons/alert-critical.png" mode="aspectFit"></image>
				</view>
				<text class="tab-text">高危拦截</text>
				<view v-if="activeFilter === 'critical'" class="tab-indicator critical"></view>
			</view>
			
			<view 
				class="filter-tab warning"
				:class="{ active: activeFilter === 'warning' }"
				@tap="handleFilterChange('warning')"
			>
				<view class="tab-icon-wrapper warning">
					<image class="tab-icon" src="/static/icons/alert-warning.png" mode="aspectFit"></image>
				</view>
				<text class="tab-text">逻辑异常</text>
				<view v-if="activeFilter === 'warning'" class="tab-indicator warning"></view>
			</view>
			
			<view 
				class="filter-tab handled"
				:class="{ active: activeFilter === 'handled' }"
				@tap="handleFilterChange('handled')"
			>
				<view class="tab-icon-wrapper handled">
					<image class="tab-icon" src="/static/icons/alert-handled.png" mode="aspectFit"></image>
				</view>
				<text class="tab-text">已处理</text>
				<view v-if="activeFilter === 'handled'" class="tab-indicator handled"></view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'AlertFilter',
	
	props: {
		activeFilter: {
			type: String,
			default: 'all'
		},
		syncStatus: {
			type: String,
			default: 'synced'
		},
		pendingCount: {
			type: Number,
			default: 0
		}
	},
	
	data() {
		return {
			statusBarHeight: 0
		}
	},
	
	mounted() {
		// 获取状态栏高度
		const systemInfo = uni.getSystemInfoSync()
		this.statusBarHeight = systemInfo.statusBarHeight || 0
	},
	
	methods: {
		handleFilterChange(filter) {
			this.$emit('filterChange', filter)
		}
	}
}
</script>

<style lang="scss" scoped>
.alert-filter-header {
	background: rgba(10, 14, 26, 0.98);
	backdrop-filter: blur(30rpx) saturate(180%);
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.3);
	position: sticky;
	top: 0;
	z-index: 100;
}

.status-bar {
	width: 100%;
}

/* 同步状态指示器 */
.sync-indicator {
	padding: 16rpx 32rpx;
	display: flex;
	justify-content: center;
}

.sync-status {
	display: inline-flex;
	align-items: center;
	gap: 12rpx;
	padding: 12rpx 24rpx;
	border-radius: 24rpx;
	
	&.synced {
		background: rgba(115, 209, 61, 0.15);
		border: 1px solid rgba(115, 209, 61, 0.3);
	}
	
	&.syncing {
		background: rgba(255, 169, 64, 0.15);
		border: 1px solid rgba(255, 169, 64, 0.3);
	}
	
	&.offline {
		background: rgba(255, 77, 79, 0.15);
		border: 1px solid rgba(255, 77, 79, 0.3);
	}
}

.status-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	
	&.online {
		background: #73D13D;
		box-shadow: 0 0 10rpx #73D13D;
		animation: pulse 2s ease-in-out infinite;
	}
	
	&.offline {
		background: #FF4D4F;
		box-shadow: 0 0 10rpx #FF4D4F;
		animation: pulse 2s ease-in-out infinite;
	}
}

.loading-spinner {
	width: 24rpx;
	height: 24rpx;
	border: 3px solid rgba(255, 169, 64, 0.3);
	border-top-color: #FFA940;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

.status-text {
	font-size: 24rpx;
	font-weight: 500;
	color: #ffffff;
}

/* 筛选标签 */
.filter-tabs {
	display: flex;
	padding: 0 32rpx 16rpx;
	gap: 16rpx;
	overflow-x: auto;
	
	&::-webkit-scrollbar {
		display: none;
	}
}

.filter-tab {
	position: relative;
	flex-shrink: 0;
	padding: 20rpx 32rpx;
	border-radius: 20rpx;
	background: rgba(255, 255, 255, 0.05);
	border: 2px solid transparent;
	display: flex;
	align-items: center;
	gap: 12rpx;
	transition: all 0.3s ease;
	
	&.active {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(0, 212, 255, 0.16);
		transform: scale(1.05);
	}
	
	&.critical.active {
		background: rgba(255, 77, 79, 0.2);
		border-color: #FF4D4F;
	}
	
	&.warning.active {
		background: rgba(255, 169, 64, 0.2);
		border-color: #FFA940;
	}
	
	&.handled.active {
		background: rgba(89, 89, 89, 0.2);
		border-color: #595959;
	}
}

.tab-icon-wrapper {
	width: 40rpx;
	height: 40rpx;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	
	&.critical {
		background: linear-gradient(135deg, #FF4D4F 0%, #cf1322 100%);
	}
	
	&.warning {
		background: linear-gradient(135deg, #FFA940 0%, #fa8c16 100%);
	}
	
	&.handled {
		background: linear-gradient(135deg, #595959 0%, #434343 100%);
	}
}

.tab-icon {
	width: 24rpx;
	height: 24rpx;
}

.tab-text {
	font-size: 26rpx;
	font-weight: 600;
	color: #ffffff;
	white-space: nowrap;
}

.tab-indicator {
	position: absolute;
	bottom: -2rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 60%;
	height: 4rpx;
	border-radius: 2rpx;
	background: #ffffff;
	
	&.critical {
		background: #FF4D4F;
		box-shadow: 0 0 10rpx #FF4D4F;
	}
	
	&.warning {
		background: #FFA940;
		box-shadow: 0 0 10rpx #FFA940;
	}
	
	&.handled {
		background: #595959;
	}
}
</style>
