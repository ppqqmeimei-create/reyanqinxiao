<template>
	<view class="sampling-container">
		<view class="sampling-header">
			<text class="sampling-title">🧪 快速采�?/text>
			<text class="sampling-subtitle">扫码生成采样编号</text>
		</view>
		
		<view class="sample-code-card">
			<view class="code-display">
				<text class="code-label">采样编号</text>
				<text class="code-value">{{ sampleCode }}</text>
			</view>
			<button class="btn-generate" @tap="generateSampleCode">🔄 生成新编�?/button>
		</view>
		
		<view class="sample-type-selector">
			<text class="selector-label">采样类型</text>
			<view class="type-buttons">
				<view 
					v-for="type in sampleTypes" 
					:key="type.value"
					class="type-btn"
					:class="{ active: selectedType === type.value }"
					@tap="selectType(type.value)"
				>
					<text class="type-icon">{{ type.icon }}</text>
					<text class="type-name">{{ type.name }}</text>
				</view>
			</view>
		</view>
		
		<view class="sample-info-card">
			<view class="info-row">
				<text class="info-label">📍 采样位置</text>
				<text class="info-value">{{ location }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">�?采样时间</text>
				<text class="info-value">{{ formatTime(sampleTime) }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">👤 检查员</text>
				<text class="info-value">{{ inspector }}</text>
			</view>
		</view>
		
		<view class="sensor-data-card">
			<text class="card-title">📊 传感器数�?/text>
			<view class="sensor-grid">
				<view class="sensor-item">
					<text class="sensor-label">温度</text>
					<text class="sensor-value">{{ sensorData.temperature }}°C</text>
				</view>
				<view class="sensor-item">
					<text class="sensor-label">湿度</text>
					<text class="sensor-value">{{ sensorData.humidity }}%</text>
				</view>
				<view class="sensor-item">
					<text class="sensor-label">气压</text>
					<text class="sensor-value">{{ sensorData.pressure }}hPa</text>
				</view>
				<view class="sensor-item" v-if="selectedType === 'water'">
					<text class="sensor-label">pH�?/text>
					<text class="sensor-value">{{ sensorData.pH }}</text>
				</view>
			</view>
		</view>
		
		<view class="photo-section">
			<text class="section-title">📸 采样照片</text>
			<view class="photo-grid">
				<view v-for="(photo, index) in photos" :key="index" class="photo-item">
					<image :src="photo" mode="aspectFill" class="photo-img"></image>
					<text class="photo-delete" @tap="deletePhoto(index)">�?/text>
				</view>
				<view class="photo-add" @tap="handleTakePhoto">
					<text class="add-icon">📷</text>
					<text class="add-text">拍照</text>
				</view>
			</view>
		</view>
		
		<view class="sampling-actions">
			<button class="btn-save" @tap="handleSaveSample">💾 保存采样</button>
			<button class="btn-submit" @tap="handleSubmitSample">📤 提交送检</button>
		</view>
		
		<view class="sample-status">
			<text class="status-text">状�? {{ statusText }}</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const sampleCode = ref('')
const selectedType = ref('water')
const location = ref('监测点A')
const sampleTime = ref(Date.now())
const inspector = ref('张三')
const photos = ref([])
const status = ref('pending')

const sampleTypes = [
	{ value: 'water', icon: '💧', name: '走私线索样本' },
	{ value: 'air', icon: '💨', name: '气样' },
	{ value: 'soil', icon: '🌱', name: '活体物种样本' },
	{ value: 'waste', icon: '♻️', name: '废弃�? }
]

const sensorData = ref({
	temperature: 25.5,
	humidity: 65,
	pressure: 1013.25,
	pH: 7.2
})

const statusText = computed(() => {
	const statusMap = {
		pending: '待保�?,
		saved: '已保�?,
		submitted: '已送检',
		tested: '检测中',
		completed: '已完�?
	}
	return statusMap[status.value] || '未知'
})

function generateSampleCode() {
	const timestamp = Date.now()
	const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
	sampleCode.value = `SAMPLE-${timestamp}-${random}`
	uni.vibrateShort()
	uni.showToast({ title: '编号已生�?, icon: 'success' })
}

function selectType(type) {
	selectedType.value = type
	uni.vibrateShort()
}

function formatTime(timestamp) {
	const date = new Date(timestamp)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function handleTakePhoto() {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['camera'],
		success: (res) => {
			photos.value.push(res.tempFilePaths[0])
			uni.showToast({ title: '拍照成功', icon: 'success' })
		}
	})
}

function deletePhoto(index) {
	uni.showModal({
		title: '删除照片',
		content: '确认删除这张照片吗？',
		success: (res) => {
			if (res.confirm) {
				photos.value.splice(index, 1)
				uni.showToast({ title: '已删�?, icon: 'success' })
			}
		}
	})
}

function handleSaveSample() {
	if (!sampleCode.value) {
		uni.showToast({ title: '请先生成采样编号', icon: 'none' })
		return
	}
	
	uni.showLoading({ title: '保存�?..' })
	setTimeout(() => {
		status.value = 'saved'
		uni.hideLoading()
		uni.showToast({ title: '保存成功', icon: 'success' })
	}, 1000)
}

function handleSubmitSample() {
	if (!sampleCode.value) {
		uni.showToast({ title: '请先生成采样编号', icon: 'none' })
		return
	}
	
	if (photos.value.length === 0) {
		uni.showModal({
			title: '提示',
			content: '未拍摄采样照片，确认提交吗？',
			success: (res) => {
				if (res.confirm) {
					submitSample()
				}
			}
		})
	} else {
		submitSample()
	}
}

function submitSample() {
	uni.showLoading({ title: '提交�?..' })
	setTimeout(() => {
		status.value = 'submitted'
		uni.hideLoading()
		uni.showToast({ title: '提交成功', icon: 'success' })
	}, 1500)
}

onLoad(() => {
	generateSampleCode()
	// 获取当前位置
	uni.getLocation({
		type: 'gcj02',
		success: (res) => {
			location.value = `${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`
		}
	})
})
</script>

<style lang="scss" scoped>
.sampling-container {
	padding: 20rpx;
	background: #0f172a;
	min-height: 100vh;
}

.sampling-header {
	text-align: center;
	margin-bottom: 30rpx;
}

.sampling-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #fff;
	display: block;
	margin-bottom: 10rpx;
}

.sampling-subtitle {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.6);
}

.sample-code-card {
	background: linear-gradient(135deg, #00A8D6 0%, #007EA8 100%);
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.code-display {
	margin-bottom: 20rpx;
}

.code-label {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
	display: block;
	margin-bottom: 10rpx;
}

.code-value {
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
	font-family: monospace;
}

.btn-generate {
	width: 100%;
	height: 70rpx;
	background: rgba(255, 255, 255, 0.2);
	color: #fff;
	border-radius: 12rpx;
	font-size: 28rpx;
	border: none;
}

.sample-type-selector {
	margin-bottom: 20rpx;
}

.selector-label {
	font-size: 28rpx;
	color: #fff;
	display: block;
	margin-bottom: 16rpx;
}

.type-buttons {
	display: flex;
	gap: 16rpx;
}

.type-btn {
	flex: 1;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 12rpx;
	padding: 20rpx;
	text-align: center;
	border: 2rpx solid transparent;
}

.type-btn.active {
	border-color: #10b981;
	background: rgba(16, 185, 129, 0.2);
}

.type-icon {
	font-size: 40rpx;
	display: block;
	margin-bottom: 8rpx;
}

.type-name {
	font-size: 24rpx;
	color: #fff;
}

.sample-info-card, .sensor-data-card {
	background: rgba(255, 255, 255, 0.05);
	border-radius: 12rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.info-row {
	display: flex;
	justify-content: space-between;
	margin-bottom: 16rpx;
}

.info-row:last-child {
	margin-bottom: 0;
}

.info-label {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.6);
}

.info-value {
	font-size: 26rpx;
	color: #fff;
}

.card-title {
	font-size: 28rpx;
	color: #fff;
	display: block;
	margin-bottom: 20rpx;
}

.sensor-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16rpx;
}

.sensor-item {
	background: rgba(255, 255, 255, 0.05);
	border-radius: 8rpx;
	padding: 16rpx;
	text-align: center;
}

.sensor-label {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.6);
	display: block;
	margin-bottom: 8rpx;
}

.sensor-value {
	font-size: 32rpx;
	font-weight: bold;
	color: #10b981;
}

.photo-section {
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 28rpx;
	color: #fff;
	display: block;
	margin-bottom: 16rpx;
}

.photo-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.photo-item {
	width: 160rpx;
	height: 160rpx;
	position: relative;
	border-radius: 12rpx;
	overflow: hidden;
}

.photo-img {
	width: 100%;
	height: 100%;
}

.photo-delete {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 40rpx;
	height: 40rpx;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: 24rpx;
}

.photo-add {
	width: 160rpx;
	height: 160rpx;
	background: rgba(255, 255, 255, 0.05);
	border: 2rpx dashed rgba(255, 255, 255, 0.3);
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.add-icon {
	font-size: 48rpx;
	margin-bottom: 8rpx;
}

.add-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.6);
}

.sampling-actions {
	display: flex;
	gap: 20rpx;
	margin-bottom: 20rpx;
}

.btn-save, .btn-submit {
	flex: 1;
	height: 88rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	font-weight: bold;
	border: none;
}

.btn-save {
	background: rgba(255, 255, 255, 0.1);
	color: #fff;
}

.btn-submit {
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: #fff;
}

.sample-status {
	text-align: center;
	padding: 20rpx;
}

.status-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.6);
}
</style>
