<template>
	<view class="evidence-preview">
		<!-- 多模态指示器 -->
		<view class="evidence-indicators">
			<!-- 红外热像 -->
			<view 
				class="evidence-indicator" 
				:class="{ active: evidence.infrared, inactive: !evidence.infrared }"
				@tap="handleIndicatorTap('infrared')"
			>
				<image class="indicator-icon" src="/static/icons/infrared.png" mode="aspectFit"></image>
				<text class="indicator-label">红外</text>
				<text v-if="evidence.infrared" class="indicator-value">
					{{ evidence.infraredValue }}°C
				</text>
			</view>
			
			<!-- 气味探测 -->
			<view 
				class="evidence-indicator" 
				:class="{ active: evidence.smell, inactive: !evidence.smell }"
				@tap="handleIndicatorTap('smell')"
			>
				<image class="indicator-icon" src="/static/icons/smell.png" mode="aspectFit"></image>
				<text class="indicator-label">气味</text>
				<text v-if="evidence.smell" class="indicator-value">
					{{ evidence.smellValue }}%
				</text>
			</view>
			
			<!-- 震动光纤 -->
			<view 
				class="evidence-indicator" 
				:class="{ active: evidence.vibration, inactive: !evidence.vibration }"
				@tap="handleIndicatorTap('vibration')"
			>
				<image class="indicator-icon" src="/static/icons/vibration.png" mode="aspectFit"></image>
				<text class="indicator-label">震动</text>
				<text v-if="evidence.vibration" class="indicator-value">
					{{ evidence.vibrationValue }}
				</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'EvidencePreview',
	
	props: {
		evidence: {
			type: Object,
			required: true,
			default: () => ({
				infrared: false,
				smell: false,
				vibration: false,
				infraredValue: 0,
				smellValue: 0,
				vibrationValue: 0
			})
		}
	},
	
	methods: {
		handleIndicatorTap(type) {
			this.$emit('indicatorTap', type)
			uni.vibrateShort()
		}
	}
}
</script>

<style lang="scss" scoped>
.evidence-preview {
	display: flex;
	align-items: center;
}

.evidence-indicators {
	display: flex;
	gap: 12rpx;
}

.evidence-indicator {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6rpx;
	padding: 12rpx 16rpx;
	border-radius: 12rpx;
	min-width: 96rpx;
	transition: all 0.3s ease;
	
	&.active {
		background: rgba(115, 209, 61, 0.15);
		border: 1px solid rgba(115, 209, 61, 0.3);
		
		.indicator-icon {
			filter: brightness(1.2);
		}
		
		.indicator-label {
			color: #73D13D;
		}
		
		.indicator-value {
			color: #73D13D;
			font-weight: 700;
		}
	}
	
	&.inactive {
		background: rgba(89, 89, 89, 0.15);
		border: 1px solid rgba(89, 89, 89, 0.2);
		
		.indicator-icon {
			opacity: 0.3;
		}
		
		.indicator-label {
			color: #595959;
		}
	}
	
	&:active {
		transform: scale(0.95);
	}
}

.indicator-icon {
	width: 32rpx;
	height: 32rpx;
}

.indicator-label {
	font-size: 20rpx;
	font-weight: 500;
	color: #8c8c8c;
}

.indicator-value {
	font-size: 18rpx;
	font-family: 'Courier New', monospace;
	color: #ffffff;
}
</style>
