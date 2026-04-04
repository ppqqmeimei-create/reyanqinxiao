<template>
	<view class="evidence-upload">
		<text class="section-title">📸 证据采集</text>
		
		<!-- 照片上传 -->
		<view class="upload-section">
			<text class="upload-label">现场照片（最多9张）</text>
			<view class="photo-grid">
				<view 
					v-for="(photo, index) in photos" 
					:key="index"
					class="photo-item"
				>
					<image :src="photo" mode="aspectFill" class="photo-img"></image>
					<view class="photo-delete" @tap="deletePhoto(index)">
						<text class="delete-icon">×</text>
					</view>
				</view>
				<view 
					v-if="photos.length < 9"
					class="photo-add" 
					@tap="addPhoto"
				>
					<text class="add-icon">+</text>
					<text class="add-text">添加照片</text>
				</view>
			</view>
		</view>
		
		<!-- 视频上传 -->
		<view class="upload-section">
			<text class="upload-label">现场视频（最多3个，每个60秒）</text>
			<view class="video-list">
				<view 
					v-for="(video, index) in videos" 
					:key="index"
					class="video-item"
				>
					<video 
						:src="video" 
						controls 
						class="video-player"
						:show-center-play-btn="true"
					></video>
					<view class="video-delete" @tap="deleteVideo(index)">
						<text class="delete-icon">×</text>
					</view>
				</view>
				<view 
					v-if="videos.length < 3"
					class="video-add" 
					@tap="addVideo"
				>
					<text class="add-icon">📹</text>
					<text class="add-text">录制视频</text>
				</view>
			</view>
		</view>
		
		<!-- 文字说明 -->
		<view class="upload-section">
			<text class="upload-label">现场说明</text>
			<textarea 
				class="evidence-textarea"
				placeholder="请详细描述现场情况、走私/生态异常程度、周边环境等..."
				v-model="description"
				:maxlength="500"
				:show-confirm-bar="false"
			></textarea>
			<text class="char-count">{{ description.length }}/500</text>
		</view>
		
		<!-- 上传按钮 -->
		<view class="upload-actions">
			<view class="upload-btn" @tap="handleUpload">
				<text class="upload-btn-text">📤 提交证据</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { evidenceAPI } from '../../../utils/request'
import { enqueueEvidence } from '../../../utils/evidenceQueue'

const props = defineProps({
	taskId: { type: [Number, String], default: null },
	warningId: { type: [Number, String], default: null }
})

const emit = defineEmits(['upload'])

const photos = ref([])
const videos = ref([])
const description = ref('')

function addPhoto() {
	uni.vibrateShort()
	uni.chooseImage({
		count: 9 - photos.value.length,
		sizeType: ['compressed'],
		sourceType: ['camera', 'album'],
		success: (res) => {
			photos.value.push(...res.tempFilePaths)
			uni.showToast({ 
				title: `已添加 ${res.tempFilePaths.length} 张照片`, 
				icon: 'success' 
			})
		},
		fail: () => {
			uni.showToast({ title: '取消选择', icon: 'none' })
		}
	})
}

function deletePhoto(index) {
	uni.vibrateShort()
	uni.showModal({
		title: '删除照片',
		content: '确认删除这张照片？',
		success: (res) => {
			if (res.confirm) {
				photos.value.splice(index, 1)
				uni.showToast({ title: '已删除', icon: 'success' })
			}
		}
	})
}

function addVideo() {
	uni.vibrateShort()
	uni.chooseVideo({
		maxDuration: 60,
		sourceType: ['camera', 'album'],
		camera: 'back',
		success: (res) => {
			videos.value.push(res.tempFilePath)
			uni.showToast({ 
				title: '已添加视频', 
				icon: 'success' 
			})
		},
		fail: () => {
			uni.showToast({ title: '取消录制', icon: 'none' })
		}
	})
}

function deleteVideo(index) {
	uni.vibrateShort()
	uni.showModal({
		title: '删除视频',
		content: '确认删除这个视频？',
		success: (res) => {
			if (res.confirm) {
				videos.value.splice(index, 1)
				uni.showToast({ title: '已删除', icon: 'success' })
			}
		}
	})
}

function clearEvidenceForm() {
	photos.value = []
	videos.value = []
	description.value = ''
}

function isOnline() {
	const net = uni.getStorageSync('network_type')
	return net && net !== 'none' && net !== 'unknown'
}

async function handleUpload() {
	if (photos.value.length === 0 && videos.value.length === 0 && !description.value) {
		uni.showToast({ 
			title: '请至少添加一项证据', 
			icon: 'none' 
		})
		return
	}
	
	uni.vibrateShort()
	uni.showLoading({ title: '上传中...', mask: true })

	const payload = {
		task_id: props.taskId || undefined,
		warning_id: props.warningId || undefined,
		type: videos.value.length > 0 ? 'video' : 'image',
		url: photos.value[0] || videos.value[0] || 'offline://local-evidence',
		description: description.value,
		photos: [...photos.value],
		videos: [...videos.value],
		uploadTime: new Date().toISOString()
	}

	try {
		if (!isOnline()) {
			const size = enqueueEvidence(payload)
			uni.hideLoading()
			uni.showToast({ title: `离线保存成功(${size})`, icon: 'none', duration: 2200 })
			emit('upload', payload)
			clearEvidenceForm()
			return
		}

		await evidenceAPI.upload(payload)
		uni.hideLoading()
		uni.showToast({ 
			title: '✅ 证据上传成功', 
			icon: 'success',
			duration: 2000
		})
		emit('upload', payload)
		clearEvidenceForm()
	} catch (error) {
		const size = enqueueEvidence(payload)
		uni.hideLoading()
		uni.showToast({ title: `网络异常，已转离线队列(${size})`, icon: 'none', duration: 2200 })
		emit('upload', payload)
		clearEvidenceForm()
	}
}
</script>

<style lang="scss" scoped>
.evidence-upload {
	padding: 0;
}

.section-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #ffffff;
	margin-bottom: 24rpx;
	display: block;
}

.upload-section {
	margin-bottom: 32rpx;
}

.upload-label {
	font-size: 24rpx;
	color: #8c8c8c;
	margin-bottom: 16rpx;
	display: block;
}

/* 照片网格 */
.photo-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16rpx;
}

.photo-item {
	position: relative;
	width: 100%;
	padding-bottom: 100%;
	border-radius: 12rpx;
	overflow: hidden;
	background: rgba(255,255,255,0.05);
}

.photo-img {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.photo-delete {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 48rpx;
	height: 48rpx;
	background: rgba(0,0,0,0.7);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
}

.delete-icon {
	font-size: 32rpx;
	color: #ffffff;
	line-height: 1;
	font-weight: 300;
}

.photo-add {
	width: 100%;
	padding-bottom: 100%;
	position: relative;
	background: rgba(255,255,255,0.05);
	border: 2rpx dashed rgba(255,255,255,0.2);
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}

.photo-add:active {
	background: rgba(255,255,255,0.1);
	border-color: rgba(255,255,255,0.4);
}

.add-icon {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -70%);
	font-size: 48rpx;
	color: rgba(255,255,255,0.4);
	line-height: 1;
}

.add-text {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, 20%);
	font-size: 20rpx;
	color: rgba(255,255,255,0.4);
	white-space: nowrap;
}

/* 视频列表 */
.video-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.video-item {
	position: relative;
	width: 100%;
	border-radius: 12rpx;
	overflow: hidden;
	background: rgba(255,255,255,0.05);
}

.video-player {
	width: 100%;
	height: 400rpx;
}

.video-delete {
	position: absolute;
	top: 16rpx;
	right: 16rpx;
	width: 56rpx;
	height: 56rpx;
	background: rgba(0,0,0,0.7);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
}

.video-add {
	width: 100%;
	height: 200rpx;
	background: rgba(255,255,255,0.05);
	border: 2rpx dashed rgba(255,255,255,0.2);
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	transition: all 0.3s;
}

.video-add:active {
	background: rgba(255,255,255,0.1);
	border-color: rgba(255,255,255,0.4);
}

.video-add .add-icon {
	font-size: 56rpx;
	color: rgba(255,255,255,0.4);
}

.video-add .add-text {
	font-size: 24rpx;
	color: rgba(255,255,255,0.4);
}

/* 文字说明 */
.evidence-textarea {
	width: 100%;
	min-height: 200rpx;
	padding: 20rpx;
	background: rgba(255,255,255,0.05);
	border: 1rpx solid rgba(255,255,255,0.1);
	border-radius: 12rpx;
	color: #ffffff;
	font-size: 26rpx;
	line-height: 1.6;
}

.char-count {
	display: block;
	text-align: right;
	font-size: 20rpx;
	color: #595959;
	margin-top: 8rpx;
}

/* 上传按钮 */
.upload-actions {
	margin-top: 32rpx;
}

.upload-btn {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(16,185,129,0.4);
	transition: all 0.3s;
}

.upload-btn:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 12rpx rgba(16,185,129,0.3);
}

.upload-btn-text {
	font-size: 32rpx;
	font-weight: 700;
	color: #ffffff;
}
</style>
