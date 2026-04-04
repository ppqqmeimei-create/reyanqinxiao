<template>
	<view class="multi-evidence">
		<view class="camera-preview">
			<camera class="camera-view" :device-position="cameraPosition" flash="off" @error="handleCameraError">
				<cover-view class="sensor-overlay">
					<cover-view class="sensor-item">
						<cover-image class="sensor-icon" src="/static/icons-3/smell-white.png"></cover-image>
						<cover-view class="sensor-data">
							<cover-view class="sensor-label">气味</cover-view>
							<cover-view class="sensor-value">{{ sensorData.smell }}%</cover-view>
						</cover-view>
					</cover-view>
					<cover-view class="sensor-item">
						<cover-image class="sensor-icon" src="/static/icons-3/vibration-white.png"></cover-image>
						<cover-view class="sensor-data">
							<cover-view class="sensor-label">震动</cover-view>
							<cover-view class="sensor-value">{{ sensorData.vibration }}</cover-view>
						</cover-view>
					</cover-view>
					<cover-view class="sensor-item">
						<cover-image class="sensor-icon" src="/static/icons-3/infrared-white.png"></cover-image>
						<cover-view class="sensor-data">
							<cover-view class="sensor-label">红外</cover-view>
							<cover-view class="sensor-value">{{ sensorData.infrared }}°C</cover-view>
						</cover-view>
					</cover-view>
				</cover-view>
				<cover-view v-if="isRecording" class="recording-indicator">
					<cover-view class="recording-dot"></cover-view>
					<cover-view class="recording-text">录音中...</cover-view>
				</cover-view>
				<!-- 摄像头方向标识 -->
				<cover-view class="camera-position-badge">
					<cover-view class="camera-position-text">{{ cameraPosition === 'back' ? '📷 后置' : '🤳 前置' }}</cover-view>
				</cover-view>
			</camera>
		</view>
		<!-- 取证控制区 -->
		<view class="evidence-controls">
			<view class="control-btn" @tap="handleToggleRecording" :class="{ 'recording-active': isRecording }">
				<image class="btn-icon" src="/static/icons-3/microphone.png" mode="aspectFit"></image>
			</view>
			<view class="control-btn capture-btn" @tap="handleCapture">
				<image class="btn-icon" src="/static/icons-3/camera.png" mode="aspectFit"></image>
			</view>
			<view class="control-btn" :class="{ 'switch-active': isSwitching }" @tap="handleSwitchCamera">
				<image class="btn-icon" src="/static/icons-3/camera-switch.png" mode="aspectFit"></image>
			</view>
			<!-- 外侧红色圆圈一键取证按钮 -->
			<view class="control-btn quick-capture-btn" @tap="handleQuickCapture">
				<view class="btn-glow"></view>
				<image class="btn-icon" src="/static/icons-3/camera-capture.png" mode="aspectFit"></image>
				<view class="btn-label">一键取证</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
	isRecording: { type: Boolean, default: false },
	sensorData: { type: Object, required: true }
})
const emit = defineEmits(['capture', 'toggleRecording'])

// 摄像头方向状态：'back' 后置 | 'front' 前置
const cameraPosition = ref('back')
const isSwitching = ref(false)

function handleCapture() {
	const ctx = uni.createCameraContext()
	ctx.takePhoto({
		quality: 'high',
		success: (res) => {
			emit('capture', { type: 'photo', path: res.tempImagePath })
			uni.vibrateShort()
			uni.showToast({ title: '拍照成功', icon: 'success' })
		},
		fail: () => uni.showToast({ title: '拍照失败', icon: 'none' })
	})
}

function handleToggleRecording() { emit('toggleRecording'); uni.vibrateShort() }

function handleSwitchCamera() {
	if (isSwitching.value) return  // 防止快速连点
	
	isSwitching.value = true
	uni.vibrateShort()
	
	// 切换摄像头方向
	const newPosition = cameraPosition.value === 'back' ? 'front' : 'back'
	cameraPosition.value = newPosition
	
	uni.showToast({ 
		title: newPosition === 'back' ? '📷 已切换至后置摄像头' : '🤳 已切换至前置摄像头', 
		icon: 'none',
		duration: 1500
	})
	
	// 防抖：1秒内不能重复切换
	setTimeout(() => {
		isSwitching.value = false
	}, 1000)
}

function handleQuickCapture() { uni.vibrateLong(); uni.showToast({ title: '一键取证已启动', icon: 'success' }) }
function handleCameraError() { uni.showToast({ title: '相机启动失败', icon: 'none' }) }
</script>

<style lang="scss" scoped>
.multi-evidence { position: relative; width: 100%; height: 400rpx; border-radius: 24rpx; overflow: hidden; }
.camera-preview { width: 100%; height: 100%; }
.camera-view { width: 100%; height: 100%; }
.sensor-overlay { position: absolute; top: 0; left: 0; right: 0; padding: 24rpx; display: flex; flex-direction: column; gap: 16rpx; }
.sensor-item { background: rgba(0,0,0,0.7); border-radius: 16rpx; padding: 16rpx; display: flex; align-items: center; gap: 16rpx; border: 1px solid var(--line-soft); }
.sensor-icon { width: 40rpx; height: 40rpx; }
.sensor-data { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.sensor-label { font-size: 20rpx; color: rgba(255,255,255,0.6); }
.sensor-value { font-size: 28rpx; font-weight: 700; color: #ffffff; font-family: Courier New, monospace; }
.recording-indicator { position: absolute; top: 24rpx; right: 24rpx; display: flex; align-items: center; gap: 12rpx; padding: 12rpx 20rpx; background: rgba(255,77,79,0.9); border-radius: 20rpx; }
.recording-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #ffffff; animation: blink 1s ease-in-out infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.recording-text { font-size: 22rpx; font-weight: 600; color: #ffffff; }

.camera-position-badge { position: absolute; bottom: 140rpx; left: 24rpx; background: rgba(0,0,0,0.6); border-radius: 12rpx; padding: 8rpx 16rpx; }
.camera-position-text { font-size: 22rpx; color: #ffffff; }

.evidence-controls { position: absolute; bottom: 24rpx; left: 50%; transform: translateX(-50%); display: flex; gap: 32rpx; align-items: center; }
.control-btn { width: 96rpx; height: 96rpx; border-radius: 50%; background: rgba(0,0,0,0.7); border: 3px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.capture-btn { width: 120rpx; height: 120rpx; background: rgba(255,255,255,0.9); border-color: #ffffff; }
.recording-active { background: rgba(255,77,79,0.9); border-color: #FF4D4F; }
.switch-active { background: rgba(16,185,129,0.8); border-color: #10b981; transform: rotate(180deg); }
.btn-icon { width: 48rpx; height: 48rpx; }

/* 一键取证按钮美化 */
.quick-capture-btn { width: 140rpx; height: 140rpx; background: linear-gradient(135deg, #FF6B6B 0%, #FF4D4F 100%); border: 3px solid rgba(255,255,255,0.4); box-shadow: 0 12rpx 48rpx rgba(255,77,79,0.6); position: relative; }
.btn-glow { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle, rgba(255,77,79,0.4) 0%, transparent 70%); animation: glow-pulse 1.5s ease-in-out infinite; }
@keyframes glow-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.btn-label { font-size: 18rpx; font-weight: 600; color: #ffffff; text-align: center; position: relative; z-index: 1; margin-top: 4rpx; }
</style>

				<cover-view class="sensor-overlay">
					<cover-view class="sensor-item">
						<cover-image class="sensor-icon" src="/static/icons-3/smell-white.png"></cover-image>
						<cover-view class="sensor-data">
							<cover-view class="sensor-label">气味</cover-view>
							<cover-view class="sensor-value">{{ sensorData.smell }}%</cover-view>
						</cover-view>
					</cover-view>
					<cover-view class="sensor-item">
						<cover-image class="sensor-icon" src="/static/icons-3/vibration-white.png"></cover-image>
						<cover-view class="sensor-data">
							<cover-view class="sensor-label">震动</cover-view>
							<cover-view class="sensor-value">{{ sensorData.vibration }}</cover-view>
						</cover-view>
					</cover-view>
					<cover-view class="sensor-item">
						<cover-image class="sensor-icon" src="/static/icons-3/infrared-white.png"></cover-image>
						<cover-view class="sensor-data">
							<cover-view class="sensor-label">红外</cover-view>
							<cover-view class="sensor-value">{{ sensorData.infrared }}°C</cover-view>
						</cover-view>
					</cover-view>
				</cover-view>
				<cover-view v-if="isRecording" class="recording-indicator">
					<cover-view class="recording-dot"></cover-view>
					<cover-view class="recording-text">录音中...</cover-view>
				</cover-view>
			</camera>
		</view>
		<!-- 取证控制区 -->
		<view class="evidence-controls">
			<view class="control-btn" @tap="handleToggleRecording" :class="{ 'recording-active': isRecording }">
				<image class="btn-icon" src="/static/icons-3/microphone.png" mode="aspectFit"></image>
			</view>
			<view class="control-btn capture-btn" @tap="handleCapture">
				<image class="btn-icon" src="/static/icons-3/camera.png" mode="aspectFit"></image>
			</view>
			<view class="control-btn" @tap="handleSwitchCamera">
				<image class="btn-icon" src="/static/icons-3/camera-switch.png" mode="aspectFit"></image>
			</view>
			<!-- 外侧红色圆圈一键取证按钮 -->
			<view class="control-btn quick-capture-btn" @tap="handleQuickCapture">
				<view class="btn-glow"></view>
				<image class="btn-icon" src="/static/icons-3/camera-capture.png" mode="aspectFit"></image>
				<view class="btn-label">一键取证</view>
			</view>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({
	isRecording: { type: Boolean, default: false },
	sensorData: { type: Object, required: true }
})
const emit = defineEmits(['capture', 'toggleRecording'])

function handleCapture() {
	const ctx = uni.createCameraContext()
	ctx.takePhoto({
		quality: 'high',
		success: (res) => {
			emit('capture', { type: 'photo', path: res.tempImagePath })
			uni.vibrateShort()
			uni.showToast({ title: '拍照成功', icon: 'success' })
		},
		fail: () => uni.showToast({ title: '拍照失败', icon: 'none' })
	})
}
function handleToggleRecording() { emit('toggleRecording'); uni.vibrateShort() }
function handleSwitchCamera() { uni.vibrateShort(); uni.showToast({ title: '摄像头已切换', icon: 'none' }) }
function handleQuickCapture() { uni.vibrateLong(); uni.showToast({ title: '一键取证已启动', icon: 'success' }) }
function handleCameraError() { uni.showToast({ title: '相机启动失败', icon: 'none' }) }
</script>

<style lang="scss" scoped>
.multi-evidence { position: relative; width: 100%; height: 400rpx; border-radius: 24rpx; overflow: hidden; }
.camera-preview { width: 100%; height: 100%; }
.camera-view { width: 100%; height: 100%; }
.sensor-overlay { position: absolute; top: 0; left: 0; right: 0; padding: 24rpx; display: flex; flex-direction: column; gap: 16rpx; }
.sensor-item { background: rgba(0,0,0,0.7); border-radius: 16rpx; padding: 16rpx; display: flex; align-items: center; gap: 16rpx; border: 1px solid var(--line-soft); }
.sensor-icon { width: 40rpx; height: 40rpx; }
.sensor-data { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.sensor-label { font-size: 20rpx; color: rgba(255,255,255,0.6); }
.sensor-value { font-size: 28rpx; font-weight: 700; color: #ffffff; font-family: Courier New, monospace; }
.recording-indicator { position: absolute; top: 24rpx; right: 24rpx; display: flex; align-items: center; gap: 12rpx; padding: 12rpx 20rpx; background: rgba(255,77,79,0.9); border-radius: 20rpx; }
.recording-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #ffffff; animation: blink 1s ease-in-out infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.recording-text { font-size: 22rpx; font-weight: 600; color: #ffffff; }

.evidence-controls { position: absolute; bottom: 24rpx; left: 50%; transform: translateX(-50%); display: flex; gap: 32rpx; align-items: center; }
.control-btn { width: 96rpx; height: 96rpx; border-radius: 50%; background: rgba(0,0,0,0.7); border: 3px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.capture-btn { width: 120rpx; height: 120rpx; background: rgba(255,255,255,0.9); border-color: #ffffff; }
.recording-active { background: rgba(255,77,79,0.9); border-color: #FF4D4F; }
.btn-icon { width: 48rpx; height: 48rpx; }

/* 一键取证按钮美化 */
.quick-capture-btn { width: 140rpx; height: 140rpx; background: linear-gradient(135deg, #FF6B6B 0%, #FF4D4F 100%); border: 3px solid rgba(255,255,255,0.4); box-shadow: 0 12rpx 48rpx rgba(255,77,79,0.6); position: relative; }
.btn-glow { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle, rgba(255,77,79,0.4) 0%, transparent 70%); animation: glow-pulse 1.5s ease-in-out infinite; }
@keyframes glow-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.btn-label { font-size: 18rpx; font-weight: 600; color: #ffffff; text-align: center; position: relative; z-index: 1; margin-top: 4rpx; }
</style>
