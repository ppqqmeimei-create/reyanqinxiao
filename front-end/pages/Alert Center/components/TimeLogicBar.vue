<template>
	<view class="time-logic-bar">
		<!-- 标题 -->
		<view class="bar-header">
			<text class="bar-title">时空逻辑对比</text>
			<view class="time-deviation-tag" :class="getDeviationLevel()">
				<text class="deviation-text">{{ getDeviationText() }}</text>
			</view>
		</view>
		
		<!-- 进度条对比 -->
		<view class="bar-container">
			<!-- 标准耗时（灰色细条） -->
			<view class="bar-row">
				<text class="bar-label">标准</text>
				<view class="bar-track normal">
					<view class="bar-fill normal" :style="{ width: '100%' }">
						<text class="bar-time">{{ formatTime(normalTime) }}</text>
					</view>
				</view>
			</view>
			
			<!-- 实际耗时（彩色粗条） -->
			<view class="bar-row">
				<text class="bar-label">实际</text>
				<view class="bar-track actual">
					<view 
						class="bar-fill actual" 
						:class="getDeviationLevel()"
						:style="{ width: getActualWidth() }"
					>
						<text class="bar-time">{{ formatTime(actualTime) }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 偏差说明 -->
		<view class="deviation-info">
			<text class="deviation-label">时间偏差：</text>
			<text class="deviation-value" :class="getDeviationLevel()">
				+{{ Math.floor((actualTime - normalTime) / 60) }}分钟 ({{ deviation }}x)
			</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'TimeLogicBar',
	
	props: {
		// 标准耗时（秒）
		normalTime: {
			type: Number,
			required: true
		},
		
		// 实际耗时（秒）
		actualTime: {
			type: Number,
			required: true
		},
		
		// 偏差倍数
		deviation: {
			type: Number,
			required: true
		},
		
		// 风险等级
		riskLevel: {
			type: String,
			default: 'warning'
		}
	},
	
	methods: {
		// 格式化时间
		formatTime(seconds) {
			const minutes = Math.floor(seconds / 60)
			const secs = seconds % 60
			if (minutes > 0) {
				return `${minutes}分${secs}秒`
			}
			return `${secs}秒`
		},
		
		// 获取偏差等级
		getDeviationLevel() {
			if (this.deviation >= 3) return 'critical'
			if (this.deviation >= 1.5) return 'warning'
			return 'normal'
		},
		
		// 获取偏差文本
		getDeviationText() {
			if (this.deviation >= 3) return '严重滞留'
			if (this.deviation >= 2) return '异常停留'
			if (this.deviation >= 1.5) return '轻微延迟'
			return '正常'
		},
		
		// 获取实际进度条宽度
		getActualWidth() {
			// 最大显示为标准时间的 5 倍
			const maxDeviation = 5
			const width = Math.min((this.actualTime / this.normalTime) * 100, maxDeviation * 100)
			return width + '%'
		}
	}
}
</script>

<style lang="scss" scoped>
.time-logic-bar {
	background: rgba(42, 47, 62, 0.6);
	border-radius: 16rpx;
	padding: 24rpx;
	border: 1px solid rgba(255, 255, 255, 0.05);
}

.bar-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.bar-title {
	font-size: 24rpx;
	color: #8c8c8c;
	font-weight: 500;
}

.time-deviation-tag {
	display: inline-flex;
	padding: 6rpx 16rpx;
	border-radius: 12rpx;
	font-size: 20rpx;
	font-weight: 600;
	
	&.critical {
		background: rgba(255, 77, 79, 0.2);
		color: #FF4D4F;
		border: 1px solid #FF4D4F;
	}
	
	&.warning {
		background: rgba(255, 169, 64, 0.2);
		color: #FFA940;
		border: 1px solid #FFA940;
	}
	
	&.normal {
		background: rgba(115, 209, 61, 0.2);
		color: #73D13D;
		border: 1px solid #73D13D;
	}
}

.bar-container {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.bar-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.bar-label {
	width: 64rpx;
	font-size: 22rpx;
	color: #8c8c8c;
	flex-shrink: 0;
}

.bar-track {
	flex: 1;
	height: 32rpx;
	border-radius: 16rpx;
	background: rgba(255, 255, 255, 0.05);
	overflow: hidden;
	position: relative;
	
	&.normal {
		height: 24rpx;
	}
	
	&.actual {
		height: 40rpx;
	}
}

.bar-fill {
	height: 100%;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	padding: 0 12rpx;
	transition: width 0.6s ease;
	position: relative;
	overflow: visible;
	
	&.normal {
		background: linear-gradient(90deg, #595959 0%, #8c8c8c 100%);
	}
	
	&.actual {
		&.critical {
			background: linear-gradient(90deg, #FF4D4F 0%, #ff7875 100%);
			box-shadow: 0 0 20rpx rgba(255, 77, 79, 0.5);
		}
		
		&.warning {
			background: linear-gradient(90deg, #FFA940 0%, #ffc069 100%);
			box-shadow: 0 0 20rpx rgba(255, 169, 64, 0.5);
		}
		
		&.normal {
			background: linear-gradient(90deg, #73D13D 0%, #95de64 100%);
		}
	}
}

.bar-time {
	font-size: 20rpx;
	font-weight: 600;
	color: #ffffff;
	white-space: nowrap;
	text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

.deviation-info {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding-top: 16rpx;
	border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.deviation-label {
	font-size: 22rpx;
	color: #8c8c8c;
}

.deviation-value {
	font-size: 24rpx;
	font-weight: 700;
	font-family: 'Courier New', monospace;
	
	&.critical {
		color: #FF4D4F;
		text-shadow: 0 0 10rpx #FF4D4F;
	}
	
	&.warning {
		color: #FFA940;
		text-shadow: 0 0 10rpx #FFA940;
	}
	
	&.normal {
		color: #73D13D;
	}
}
</style>
