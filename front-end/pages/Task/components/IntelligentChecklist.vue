<template>
	<view class="checklist-container">
		<view class="checklist-header">
			<text class="checklist-title">📋 {{ checklistTitle }}</text>
			<view class="progress-bar">
				<view class="progress-fill" :style="{ width: completionRate + '%' }"></view>
			</view>
			<text class="progress-text">完成�? {{ completionRate }}%</text>
		</view>
		
		<view class="checklist-items">
			<view 
				v-for="item in checklistItems" 
				:key="item.id" 
				class="checklist-item"
				:class="{ 
					'item-completed': item.status === 'completed',
					'item-failed': item.status === 'failed'
				}"
				@tap="handleItemTap(item)"
			>
				<view class="item-checkbox">
					<text v-if="item.status === 'completed'" class="checkbox-icon">�?/text>
					<text v-else-if="item.status === 'failed'" class="checkbox-icon">�?/text>
					<text v-else class="checkbox-icon">�?/text>
				</view>
				<view class="item-content">
					<text class="item-name">{{ item.name }}</text>
					<text v-if="item.required" class="item-required">*必检</text>
				</view>
			</view>
		</view>
		
		<view class="checklist-summary">
			<view class="summary-item">
				<text class="summary-label">合格�?/text>
				<text class="summary-value passed">{{ passedCount }}</text>
			</view>
			<view class="summary-item">
				<text class="summary-label">不合格项</text>
				<text class="summary-value failed">{{ failedCount }}</text>
			</view>
			<view class="summary-item">
				<text class="summary-label">待检�?/text>
				<text class="summary-value pending">{{ pendingCount }}</text>
			</view>
		</view>
		
		<view class="checklist-actions">
			<button class="btn-secondary" @tap="handlePhotoAll">📸 批量拍照</button>
			<button class="btn-primary" @tap="handleGenerateReport">📝 生成报告</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
	checklistType: { type: String, default: 'food-enterprise' }
})

const checklistTemplates = {
	'food-enterprise': {
		title: '食品企业检查清�?,
		items: [
			{ id: 1, name: '营业执照、食品经营许可证', required: true, status: 'pending' },
			{ id: 2, name: '从业人员健康�?, required: true, status: 'pending' },
			{ id: 3, name: '进货查验记录', required: true, status: 'pending' },
			{ id: 4, name: '食品储存条件', required: true, status: 'pending' },
			{ id: 5, name: '生产日期、保质期标注', required: true, status: 'pending' },
			{ id: 6, name: '环境卫生状况', required: true, status: 'pending' },
			{ id: 7, name: '防鼠防虫设施', required: false, status: 'pending' },
			{ id: 8, name: '消毒记录', required: false, status: 'pending' }
		]
	}
}

const checklistTitle = ref(checklistTemplates[props.checklistType].title)
const checklistItems = ref(checklistTemplates[props.checklistType].items)

const completionRate = computed(() => {
	const total = checklistItems.value.length
	const completed = checklistItems.value.filter(item => item.status !== 'pending').length
	return Math.floor((completed / total) * 100)
})

const passedCount = computed(() => checklistItems.value.filter(item => item.status === 'completed').length)
const failedCount = computed(() => checklistItems.value.filter(item => item.status === 'failed').length)
const pendingCount = computed(() => checklistItems.value.filter(item => item.status === 'pending').length)

function handleItemTap(item) {
	uni.showActionSheet({
		itemList: ['�?合格', '�?不合�?, '📸 拍照取证'],
		success: (res) => {
			if (res.tapIndex === 0) item.status = 'completed'
			else if (res.tapIndex === 1) item.status = 'failed'
			else if (res.tapIndex === 2) handleTakePhoto(item)
		}
	})
}

function handleTakePhoto(item) {
	uni.chooseImage({
		count: 1,
		sourceType: ['camera'],
		success: () => uni.showToast({ title: '拍照成功', icon: 'success' })
	})
}

function handlePhotoAll() {
	uni.showToast({ title: '批量拍照功能开发中', icon: 'none' })
}

function handleGenerateReport() {
	if (pendingCount.value > 0) {
		uni.showModal({
			title: '提示',
			content: `还有${pendingCount.value}项未检查，确认生成报告吗？`,
			success: (res) => {
				if (res.confirm) {
					uni.showLoading({ title: '生成报告�?..' })
					setTimeout(() => {
						uni.hideLoading()
						uni.showToast({ title: '报告已生�?, icon: 'success' })
					}, 1500)
				}
			}
		})
	}
}
</script>

<style lang="scss" scoped>
.checklist-container {
	padding: 20rpx;
	background: #0f172a;
	min-height: 100vh;
}

.checklist-header {
	background: linear-gradient(135deg, #00A8D6 0%, #007EA8 100%);
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.checklist-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #fff;
	display: block;
	margin-bottom: 20rpx;
}

.progress-bar {
	height: 12rpx;
	background: rgba(255, 255, 255, 0.3);
	border-radius: 6rpx;
	overflow: hidden;
	margin-bottom: 10rpx;
}

.progress-fill {
	height: 100%;
	background: #10b981;
	transition: width 0.3s;
}

.progress-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
}

.checklist-items {
	margin-bottom: 20rpx;
}

.checklist-item {
	background: rgba(255, 255, 255, 0.05);
	border-radius: 12rpx;
	padding: 24rpx;
	margin-bottom: 16rpx;
	display: flex;
	align-items: center;
	border-left: 6rpx solid #00A8D6;
}

.checklist-item.item-completed {
	border-left-color: #10b981;
	background: rgba(16, 185, 129, 0.1);
}

.checklist-item.item-failed {
	border-left-color: #ef4444;
	background: rgba(239, 68, 68, 0.1);
}

.item-checkbox {
	margin-right: 20rpx;
}

.checkbox-icon {
	font-size: 40rpx;
}

.item-content {
	flex: 1;
}

.item-name {
	font-size: 28rpx;
	color: #fff;
}

.item-required {
	font-size: 20rpx;
	color: #ef4444;
	background: rgba(239, 68, 68, 0.2);
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	margin-left: 12rpx;
}

.checklist-summary {
	background: rgba(255, 255, 255, 0.05);
	border-radius: 12rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	display: flex;
	justify-content: space-around;
}

.summary-item {
	text-align: center;
}

.summary-label {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.6);
	display: block;
	margin-bottom: 8rpx;
}

.summary-value {
	font-size: 48rpx;
	font-weight: bold;
	display: block;
}

.summary-value.passed {
	color: #10b981;
}

.summary-value.failed {
	color: #ef4444;
}

.summary-value.pending {
	color: #f59e0b;
}

.checklist-actions {
	display: flex;
	gap: 20rpx;
}

.btn-secondary, .btn-primary {
	flex: 1;
	height: 88rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: bold;
	border: none;
}

.btn-secondary {
	background: rgba(255, 255, 255, 0.1);
	color: #fff;
}

.btn-primary {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: #fff;
}
</style>
