<template>
	<view class="sampling-container">
		<view class="code-section">
			<view class="code-card">
				<text class="code-label">采样编号</text>
				<text class="code-value">{{ sampleCode }}</text>
				<view class="code-btns">
					<button class="btn-copy" @tap="copySampleCode">📋 复制</button>
					<button class="btn-scan" @tap="handleScanCode">📱 扫码</button>
				</view>
			</view>
		</view>

		<view class="info-section">
			<text class="section-title">📋 采样信息</text>
			<view class="type-selector">
				<view v-for="t in types" :key="t.v" class="type-btn" :class="{active:type===t.v}" @tap="type=t.v">
					<text>{{ t.i }}</text><text>{{ t.n }}</text>
				</view>
			</view>
			<view class="info-row">
				<text>📍 {{ location }}</text>
				<button class="btn-sm" @tap="getLocation">定位</button>
			</view>
			<text class="info-row">�?{{ time }}</text>
		</view>

		<view class="photo-section">
			<text class="section-title">📸 拍照 ({{ photos.length }}/5)</text>
			<view class="photo-grid">
				<view v-for="(p,i) in photos" :key="i" class="photo-item">
					<image :src="p" mode="aspectFill"></image>
					<text class="del" @tap="deletePhoto(i)">�?/text>
				</view>
				<view v-if="photos.length<5" class="photo-add" @tap="takePhoto">
					<text>📷</text>
				</view>
			</view>
		</view>

		<view class="upload-section" v-if="status">
			<view class="status-card" :class="'st-'+status">
				<text class="st-icon">{{ statusIcon }}</text>
				<text class="st-text">{{ statusText }}</text>
				<view v-if="status==='uploading'" class="progress">
					<view class="fill" :style="{width:progress+'%'}"></view>
				</view>
			</view>
		</view>

		<view class="action-btns">
			<button class="btn-save" @tap="save" :disabled="!canSave">💾 保存</button>
			<button class="btn-submit" @tap="submit" :disabled="!canSubmit">📤 上传</button>
		</view>

		<view class="history-section">
			<text class="section-title">📋 历史</text>
			<view v-for="h in history" :key="h.id" class="history-item">
				<view class="h-header">
					<text class="h-code">{{ h.code }}</text>
					<text class="h-status">{{ h.status }}</text>
				</view>
				<text class="h-info">{{ h.type }} · {{ h.time }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const sampleCode = ref('SAMPLE-' + Date.now())
const type = ref('water')
const types = [
	{ v: 'water', i: '💧', n: '走私线索样本' },
	{ v: 'air', i: '💨', n: '气样' },
	{ v: 'soil', i: '🌱', n: '活体物种样本' },
	{ v: 'waste', i: '♻️', n: '废弃�? }
]

const location = ref('39.904200, 116.407400')
const time = ref(new Date().toLocaleString())
const photos = ref([])
const status = ref(null)
const progress = ref(0)
const history = ref([
	{ id: 1, code: 'SAMPLE-1710000000000', type: '💧 走私线索样本', time: '2026-03-12 10:30', status: '�?已上�? },
	{ id: 2, code: 'SAMPLE-1709999999999', type: '💨 气样', time: '2026-03-12 09:15', status: '�?已上�? }
])

const canSave = computed(() => type.value && photos.value.length >= 1)
const canSubmit = computed(() => type.value && photos.value.length >= 3)

const statusIcon = computed(() => {
	if (status.value === 'uploading') return '�?
	if (status.value === 'success') return '�?
	return '�?
})

const statusText = computed(() => {
	if (status.value === 'uploading') return `上传�?.. ${progress.value}%`
	if (status.value === 'success') return '上传成功'
	return '上传失败'
})

function copySampleCode() {
	uni.setClipboardData({ data: sampleCode.value, success: () => uni.showToast({ title: '�?已复�?, icon: 'success' }) })
}

function handleScanCode() {
	uni.scanCode({ onlyFromCamera: true, success: (res) => { sampleCode.value = res.result; uni.showToast({ title: '�?扫码成功', icon: 'success' }) }, fail: () => uni.showToast({ title: '扫码失败', icon: 'none' }) })
}

function getLocation() {
	uni.showLoading({ title: '定位�?..' })
	uni.getLocation({ type: 'gcj02', success: (res) => { uni.hideLoading(); location.value = `${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`; uni.showToast({ title: '�?定位成功', icon: 'success' }) }, fail: () => { uni.hideLoading(); uni.showToast({ title: '定位失败', icon: 'none' }) } })
}

function takePhoto() {
	uni.chooseImage({ count: 1, sourceType: ['camera'], success: (res) => { photos.value.push(res.tempFilePaths[0]); uni.showToast({ title: '�?拍照成功', icon: 'success' }); uni.vibrateShort() } })
}

function deletePhoto(i) {
	uni.showModal({ title: '删除照片', content: '确认删除�?, success: (res) => { if (res.confirm) { photos.value.splice(i, 1); uni.showToast({ title: '已删�?, icon: 'success' }) } } })
}

function save() {
	if (!canSave.value) { uni.showToast({ title: '请至少拍�?张照�?, icon: 'none' }); return }
	uni.showLoading({ title: '保存�?..' })
	setTimeout(() => { uni.hideLoading(); uni.showToast({ title: '�?已保�?, icon: 'success' }); history.value.unshift({ id: Date.now(), code: sampleCode.value, type: types.find(t => t.v === type.value).i + ' ' + types.find(t => t.v === type.value).n, time: new Date().toLocaleString(), status: '💾 已保�? }) }, 1000)
}

function submit() {
	if (!canSubmit.value) { uni.showToast({ title: '请至少拍�?张照�?, icon: 'none' }); return }
	uni.showModal({ title: '确认上传', content: `编号�?{sampleCode.value}\n照片�?{photos.value.length}张`, confirmText: '上传', confirmColor: '#10b981', success: (res) => { if (res.confirm) upload() } })
}

function upload() {
	status.value = 'uploading'
	progress.value = 0
	const timer = setInterval(() => { progress.value += Math.random() * 30; if (progress.value >= 100) { progress.value = 100; clearInterval(timer); setTimeout(() => { status.value = 'success'; uni.showToast({ title: '�?上传成功', icon: 'success' }); history.value.unshift({ id: Date.now(), code: sampleCode.value, type: types.find(t => t.v === type.value).i + ' ' + types.find(t => t.v === type.value).n, time: new Date().toLocaleString(), status: '�?已上�? }); setTimeout(() => reset(), 1500) }, 500) } }, 300)
}

function reset() {
	sampleCode.value = 'SAMPLE-' + Date.now()
	type.value = 'water'
	photos.value = []
	status.value = null
	progress.value = 0
}

onLoad(() => {
	uni.getLocation({ type: 'gcj02', success: (res) => { location.value = `${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}` } })
})
</script>

<style lang="scss" scoped>
.sampling-container { padding: 20rpx; background: #0f172a; min-height: 100vh; }
.code-section { margin-bottom: 20rpx; }
.code-card { background: linear-gradient(135deg, #00A8D6 0%, #007EA8 100%); border-radius: 16rpx; padding: 30rpx; text-align: center; }
.code-label { font-size: 24rpx; color: rgba(255,255,255,0.8); display: block; margin-bottom: 10rpx; }
.code-value { font-size: 36rpx; font-weight: bold; color: #fff; font-family: monospace; display: block; margin-bottom: 20rpx; }
.code-btns { display: flex; gap: 16rpx; }
.btn-copy, .btn-scan { flex: 1; height: 70rpx; background: rgba(255,255,255,0.2); color: #fff; border-radius: 12rpx; font-size: 26rpx; border: none; }
.info-section { background: rgba(255,255,255,0.05); border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #fff; display: block; margin-bottom: 16rpx; }
.type-selector { display: flex; gap: 12rpx; margin-bottom: 16rpx; }
.type-btn { flex: 1; background: rgba(255,255,255,0.05); border-radius: 12rpx; padding: 16rpx; text-align: center; border: 2rpx solid transparent; color: #fff; transition: all 0.3s; }
.type-btn.active { border-color: #10b981; background: rgba(16,185,129,0.2); }
.type-btn text { display: block; }
.type-btn text:first-child { font-size: 32rpx; margin-bottom: 8rpx; }
.type-btn text:last-child { font-size: 22rpx; }
.info-row { font-size: 26rpx; color: #fff; background: rgba(255,255,255,0.05); padding: 16rpx; border-radius: 12rpx; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.btn-sm { background: #10b981; color: #fff; border: none; border-radius: 8rpx; padding: 8rpx 16rpx; font-size: 22rpx; }
.photo-section { margin-bottom: 20rpx; }
.photo-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.photo-item { width: calc(50% - 8rpx); height: 200rpx; position: relative; border-radius: 12rpx; overflow: hidden; }
.photo-item image { width: 100%; height: 100%; }
.del { position: absolute; top: 8rpx; right: 8rpx; width: 40rpx; height: 40rpx; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24rpx; }
.photo-add { width: calc(50% - 8rpx); height: 200rpx; background: rgba(255,255,255,0.05); border: 2rpx dashed rgba(255,255,255,0.3); border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 48rpx; }
.upload-section { margin-bottom: 20rpx; }
.status-card { background: rgba(255,255,255,0.05); border-radius: 12rpx; padding: 24rpx; text-align: center; }
.st-uploading { background: rgba(16,185,129,0.1); border: 2rpx solid rgba(16,185,129,0.3); }
.st-success { background: rgba(16,185,129,0.2); border: 2rpx solid #10b981; }
.st-error { background: rgba(239,68,68,0.1); border: 2rpx solid rgba(239,68,68,0.3); }
.st-icon { font-size: 48rpx; display: block; margin-bottom: 12rpx; }
.st-text { font-size: 28rpx; color: #fff; display: block; margin-bottom: 12rpx; }
.progress { height: 8rpx; background: rgba(255,255,255,0.2); border-radius: 4rpx; overflow: hidden; }
.fill { height: 100%; background: #10b981; transition: width 0.3s; }
.action-btns { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.btn-save, .btn-submit { flex: 1; height: 88rpx; border-radius: 12rpx; font-size: 28rpx; font-weight: bold; border: none; }
.btn-save { background: rgba(255,255,255,0.1); color: #fff; }
.btn-save:disabled { opacity: 0.5; }
.btn-submit { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; }
.btn-submit:disabled { opacity: 0.5; }
.history-section { margin-bottom: 40rpx; }
.history-item { background: rgba(255,255,255,0.05); border-radius: 12rpx; padding: 16rpx; border-left: 4rpx solid #00A8D6; margin-bottom: 12rpx; }
.h-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.h-code { font-size: 26rpx; color: #fff; font-weight: bold; font-family: monospace; }
.h-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 8rpx; background: rgba(16,185,129,0.2); color: #10b981; }
.h-info { font-size: 22rpx; color: rgba(255,255,255,0.6); }
</style>
