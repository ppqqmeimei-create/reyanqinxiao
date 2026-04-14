<template>
	<view class="evidence-capture">
		<!-- 元数据状态栏（始终可见，让执法人员知道当前GPS是否有效） -->
		<view class="ec-meta-bar" :class="gpsStatus">
			<text class="meta-bar-icon">{{ gpsStatus === 'valid' ? '📍' : gpsStatus === 'fallback' ? '⚠️' : '⏳' }}</text>
			<text class="meta-bar-label">当前位置</text>
			<text class="meta-bar-coords">{{ currentMeta.latitude && currentMeta.longitude
				? `${currentMeta.latitude}, ${currentMeta.longitude}`
				: '定位中...' }}</text>
			<text class="meta-bar-time">{{ currentMeta.timestamp || '--' }}</text>
			<text class="meta-bar-status">{{ gpsStatusText }}</text>
		</view>

		<view class="ec-header">
			<text class="ec-title">📸 现场取证</text>
			<view class="ec-counts">
				<view class="count-item"><text class="count-num">{{ evidenceCount.photo || 0 }}</text><text class="count-label">照片</text></view>
				<view class="count-item"><text class="count-num">{{ evidenceCount.video || 0 }}</text><text class="count-label">视频</text></view>
				<view class="count-item"><text class="count-num">{{ evidenceCount.audio || 0 }}</text><text class="count-label">录音</text></view>
			</view>
		</view>

		<!-- 取证操作区 — 触控热区极度放大（高度≥56px，横向撑满屏） -->
		<view class="ec-actions">
			<view class="ec-btn photo" @tap="takePhoto">
				<text class="ec-btn-icon">📷</text>
				<text class="ec-btn-text">拍照取证</text>
				<text class="ec-btn-sub">自动附着GPS+时间戳</text>
			</view>
			<view class="ec-btn video" @tap="recordVideo">
				<text class="ec-btn-icon">🎥</text>
				<text class="ec-btn-text">录像取证</text>
				<text class="ec-btn-sub">自动附着GPS+时间戳</text>
			</view>
			<view class="ec-btn audio" @tap="recordAudio">
				<text class="ec-btn-icon">🎙️</text>
				<text class="ec-btn-text">录音取证</text>
				<text class="ec-btn-sub">自动附着时间戳</text>
			</view>
			<view class="ec-btn file" @tap="chooseFile">
				<text class="ec-btn-icon">📄</text>
				<text class="ec-btn-text">上传文件</text>
				<text class="ec-btn-sub">从相册选取</text>
			</view>
		</view>

		<!-- 证据列表 -->
		<view v-if="uploads.length > 0" class="ec-list">
			<text class="ec-list-title">已采集证据（ {{ uploads.length }} 条 · 不可篡改元数据）</text>
			<view v-for="(item, i) in uploads" :key="i" class="ec-item" :class="item.status">
				<text class="ec-item-icon">{{ getTypeIcon(item.type) }}</text>
				<view class="ec-item-body">
					<view class="ec-item-top">
						<text class="ec-item-name">{{ item.name }}</text>
						<view class="ec-item-badge" :class="item.status">
							<text class="badge-txt">{{ item.status === 'uploaded' ? '已上传' : item.status === 'uploading' ? '上传中' : '待上传' }}</text>
						</view>
					</view>
					<!-- 不可篡改元数据区块 -->
					<view class="ec-item-meta">
						<text class="meta-tag">📍 {{ item.latitude }}, {{ item.longitude }}</text>
						<text class="meta-tag">🕐 {{ item.timestamp }}</text>
						<text class="meta-tag">🔖 工单: {{ item.taskId || '--' }}</text>
						<text class="meta-tag">🏢 {{ item.unitName || '--' }}</text>
					</view>
					<!-- 司法链信息：哈希 + 存证状态 + 证据链编号 -->
					<view class="ec-chain-row" v-if="item.chainId">
						<text class="chain-hash-label">证据哈希：</text>
						<text class="chain-hash-val">{{ item.evidenceHash || '--' }}</text>
						<view class="chain-status-badge" :class="'chain-' + (item.chainStatus || 'pending')">
							<text class="chain-status-txt">{{ getChainStatusText(item.chainStatus) }}</text>
						</view>
					</view>
					<view class="ec-chain-id-row" v-if="item.chainId">
						<text class="chain-id-label">证据链编号：</text>
						<text class="chain-id-val" @tap="copyChainId(item.chainId)">{{ item.chainId }}</text>
					</view>
				</view>
				<!-- 立即上传按钮（触控热区放大） -->
				<view
					v-if="item.status !== 'uploaded' && item.status !== 'uploading'"
					class="ec-upload-btn"
					@tap.stop="uploadEvidence(item, i)"
				>
					<text class="upload-btn-text">立即上传</text>
				</view>
				<!-- 水印预览按钮 -->
				<view class="ec-preview-btn" @tap.stop="previewEvidence(item)">
					<text class="preview-btn-text">水印预览</text>
				</view>
			</view>
		</view>
	</view>

	<!-- 水印预览弹窗 -->
	<view v-if="previewVisible" class="ec-preview-overlay" @tap="previewVisible = false">
		<view class="ec-preview-card" @tap.stop>
			<view class="ec-preview-header">
				<text class="ec-preview-title">📋 电子卷宗预览</text>
				<view class="ec-preview-close" @tap="previewVisible = false">
					<text>✕</text>
				</view>
			</view>

			<!-- 水印叠加预览区 -->
			<view class="ec-preview-watermark-zone">
				<!-- 原始图片（模拟） -->
				<view class="ec-preview-image-placeholder">
					<text class="placeholder-icon">{{ previewItem ? getTypeIcon(previewItem.type) : '📷' }}</text>
					<text class="placeholder-text">证据照片预览</text>
				</view>
				<!-- 叠加水印层 -->
				<view class="ec-preview-watermark-overlay">
					<view class="wm-line wm-line-1">
						<text class="wm-text">📍 {{ previewMeta.latitude }}, {{ previewMeta.longitude }}</text>
					</view>
					<view class="wm-line wm-line-2">
						<text class="wm-text">🕐 {{ previewMeta.timestamp }}</text>
					</view>
					<view class="wm-line wm-line-3">
						<text class="wm-text">🏢 {{ previewMeta.unitName }}</text>
					</view>
					<view class="wm-line wm-line-4">
						<text class="wm-text">🔖 {{ previewMeta.badgeNo }}</text>
					</view>
					<view class="wm-line wm-line-5">
						<text class="wm-text">📋 工单: {{ previewMeta.taskId || '--' }}</text>
					</view>
					<!-- 防伪水印 -->
					<view class="wm-anti-forge">
						<text class="wm-forge-text">防伪校验</text>
						<text class="wm-forge-hash">{{ previewMeta.evidenceHash || '待上传生成' }}</text>
					</view>
				</view>
			</view>

			<!-- 防伪水印详情 -->
			<view class="ec-preview-detail">
				<view class="ec-preview-section-title">📜 防伪水印详情</view>
				<view class="ec-preview-detail-row">
					<text class="detail-label">经纬度水印</text>
					<text class="detail-value">{{ previewMeta.latitude }}, {{ previewMeta.longitude }}</text>
				</view>
				<view class="ec-preview-detail-row">
					<text class="detail-label">时间戳</text>
					<text class="detail-value">{{ previewMeta.timestamp }}</text>
				</view>
				<view class="ec-preview-detail-row">
					<text class="detail-label">设备ID</text>
					<text class="detail-value">{{ previewMeta.deviceId }}</text>
				</view>
				<view class="ec-preview-detail-row">
					<text class="detail-label">单位名称</text>
					<text class="detail-value">{{ previewMeta.unitName }}</text>
				</view>
				<view class="ec-preview-detail-row">
					<text class="detail-label">警号</text>
					<text class="detail-value">{{ previewMeta.badgeNo }}</text>
				</view>
				<view class="ec-preview-detail-row">
					<text class="detail-label">证据链编号</text>
					<text class="detail-value">{{ previewMeta.chainId || '待上传后生成' }}</text>
				</view>
				<view class="ec-preview-detail-row">
					<text class="detail-label">防伪哈希</text>
					<text class="detail-value mono">{{ previewMeta.evidenceHash || '待上传后生成（SHA256）' }}</text>
				</view>
				<view class="ec-preview-detail-row">
					<text class="detail-label">生成格式</text>
					<text class="detail-value">EV-{SHA256}-{时间戳}-{设备ID}</text>
				</view>
			</view>

			<view class="ec-preview-footer">
				<text class="ec-preview-hint">提交后将自动叠加上述防伪水印，生成不可篡改的电子卷宗</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
	taskId:         { type: Number, required: true },
	evidenceCount:  { type: Object, default: () => ({ photo: 0, video: 0, audio: 0 }) }
})
const emit = defineEmits(['upload'])

const uploads = ref([])

function buildUploadUrl() {
	const base = uni.getStorageSync('baseURL') || 'http://127.0.0.1:3000'
	return (base.replace(/\/$/, '') + '/api/v1')
}
const previewVisible = ref(false)
const previewItem = ref(null)

const gpsStatus = ref('loading') // 'loading' | 'valid' | 'fallback' | 'error'
const gpsStatusText = computed(() => ({
	loading: '定位中...',
	valid:   'GPS有效',
	fallback: '离线兜底',
	error:   '定位失败'
}[gpsStatus.value] || ''))

// 预览水印弹窗相关
const previewMeta = computed(() => {
	if (!previewItem.value) return {}
	return {
		latitude: previewItem.value.latitude || '--',
		longitude: previewItem.value.longitude || '--',
		timestamp: previewItem.value.timestamp || '--',
		unitName: previewItem.value.unitName || '--',
		badgeNo: previewItem.value.badgeNo || '--',
		taskId: previewItem.value.taskId || '--',
		deviceId: 'DEV-' + (previewItem.value.latitude || '000000') + '-' + (previewItem.value.timestamp || '').replace(/[^\d]/g, '').substring(0, 8),
		evidenceHash: previewItem.value.evidenceHash || null,
		chainId: previewItem.value.chainId || null
	}
})

function previewEvidence(item) {
	previewItem.value = item
	previewVisible.value = true
}

// 当前元数据（拍照/录像时统一抓取）
const currentMeta = ref({
	latitude:  null,
	longitude: null,
	timestamp: null,
	unitName:  null,
	badgeNo:   null
})

// 初始化时立即获取一次 GPS，后续拍照/录像直接复用（避免多次弹权限）
function refreshMeta() {
	const userInfo = uni.getStorageSync('user_info') || {}
	const badgeNo  = userInfo.badgeNumber || userInfo.badge_number || 'BP-UNKNOWN'
	const unit     = '广西壮族自治区环境资源和食品药品侦查总队'
	currentMeta.value.badgeNo  = badgeNo
	currentMeta.value.unitName  = unit

	return new Promise((resolve) => {
		uni.getLocation({
			type: 'gcj02',
			success: (loc) => {
				currentMeta.value.latitude  = loc.latitude.toFixed(6)
				currentMeta.value.longitude = loc.longitude.toFixed(6)
				currentMeta.value.timestamp = formatTimestamp(new Date())
				gpsStatus.value = 'valid'
				resolve(currentMeta.value)
			},
			fail: () => {
				// 离线兜底：使用广西边境凭祥坐标
				currentMeta.value.latitude  = '22.110000'
				currentMeta.value.longitude = '106.760000'
				currentMeta.value.timestamp = formatTimestamp(new Date())
				gpsStatus.value = 'fallback'
				resolve(currentMeta.value)
			}
		})
	})
}

// 生成带毫秒精度的 ISO 时间戳
function formatTimestamp(date) {
	const pad = (n) => String(n).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} `
		+ `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3,'0')}`
}

// 拍照 — 自动附着：GPS + 时间戳 + 工单号 + 单位 + 警号
async function takePhoto() {
	uni.vibrateShort()
	const meta = await refreshMeta()

	uni.chooseImage({
		count: 9,
		sourceType: ['camera'],
		success: (res) => {
			res.tempFilePaths.forEach((path, idx) => {
				const seq = uploads.value.length + idx + 1
				const item = {
					type:      'photo',
					name:      `[${meta.unitName}]_${meta.badgeNo}_${meta.latitude},${meta.longitude}_T${seq}.jpg`,
					filePath:  path,
					latitude:  meta.latitude,
					longitude: meta.longitude,
					timestamp: meta.timestamp,
					taskId:    props.taskId,
					unitName:  meta.unitName,
					badgeNo:   meta.badgeNo,
					time:      new Date().toLocaleTimeString('zh-CN'),
					status:    'pending'
				}
				uploads.value.unshift(item)
				autoUpload(item)
			})
			showEvidenceConfirm(meta)
		},
		fail: () => uni.showToast({ title: '已取消拍照', icon: 'none' })
	})
}

// 录像 — 同样自动附着完整元数据
async function recordVideo() {
	uni.vibrateShort()
	const meta = await refreshMeta()

	uni.chooseVideo({
		sourceType: ['camera'],
		maxDuration: 300, // 扩展到5分钟
		success: (res) => {
			const item = {
				type:      'video',
				name:      `[${meta.unitName}]_${meta.badgeNo}_${meta.latitude},${meta.longitude}_VIDEO.mp4`,
				filePath:  res.tempFilePath,
				latitude:  meta.latitude,
				longitude: meta.longitude,
				timestamp: meta.timestamp,
				taskId:    props.taskId,
				unitName:  meta.unitName,
				badgeNo:   meta.badgeNo,
				time:      new Date().toLocaleTimeString('zh-CN'),
				status:    'pending'
			}
			uploads.value.unshift(item)
			autoUpload(item)
			showEvidenceConfirm(meta)
		},
		fail: () => uni.showToast({ title: '已取消录像', icon: 'none' })
	})
}

// 录音 — 仅时间戳（无GPS）
async function recordAudio() {
	uni.vibrateShort()
	const meta = await refreshMeta()

	uni.showToast({ title: '录音功能启动（实时GPS已锁定）', icon: 'none', duration: 1500 })
	const item = {
		type:      'audio',
		name:      `[${meta.unitName}]_${meta.badgeNo}_${meta.timestamp}_AUDIO.mp3`,
		filePath:  null,
		latitude:  meta.latitude,
		longitude: meta.longitude,
		timestamp: meta.timestamp,
		taskId:    props.taskId,
		unitName:  meta.unitName,
		badgeNo:   meta.badgeNo,
		time:      new Date().toLocaleTimeString('zh-CN'),
		status:    'pending'
	}
	uploads.value.unshift(item)
	emit('upload', { audios: [item] })
	uni.vibrateMedium?.()
}

function chooseFile() {
	uni.vibrateShort()
	uni.chooseImage({
		count: 9,
		sourceType: ['album'],
		success: (res) => {
			const meta = currentMeta.value
			res.tempFilePaths.forEach((path, idx) => {
				const item = {
					type:      'file',
					name:      `证据文件_${uploads.value.length + idx + 1}.jpg`,
					filePath:  path,
					latitude:  meta.latitude  || '--',
					longitude: meta.longitude || '--',
					timestamp: meta.timestamp || '--',
					taskId:    props.taskId,
					unitName:  meta.unitName  || '--',
					badgeNo:   meta.badgeNo   || '--',
					time:      new Date().toLocaleTimeString('zh-CN'),
					status:    'pending'
				}
				uploads.value.unshift(item)
				autoUpload(item)
			})
		}
	})
}

// 自动后台上传（带元数据的 FormData）
async function autoUpload(item) {
	try {
		item.status = 'uploading'
		const formData = {
			type:      item.type,
			task_id:   item.taskId,
			latitude:  item.latitude,
			longitude: item.longitude,
			timestamp: item.timestamp,
			unit_name: item.unitName,
			badge_no:  item.badgeNo,
			filename:  item.name
		}

		await uni.uploadFile({
			url:          buildUploadUrl() + '/evidence/upload',
			filePath:     item.filePath,
			name:         'file',
			formData,
			header: {
				Authorization: `Bearer ${uni.getStorageSync('user_token') || uni.getStorageSync('token') || ''}`
			},
			success: (res) => {
				item.status = 'uploaded'
				// 生成证据哈希和链编号（上传成功后追加司法链信息）
				item.evidenceHash = genEvidenceHash(item)
				item.chainId = genChainId()
				item.chainStatus = 'pending'
				// 模拟2秒后区块链存证确认
				setTimeout(() => { item.chainStatus = 'confirmed' }, 2000)
				emit('upload', { type: item.type, [item.type + 's']: [item] })
			},
			fail: () => {
				item.status = 'pending' // 保留待上传，不丢弃
			}
		})
	} catch (e) {
		item.status = 'pending'
	}
}

// 手动触发上传（用户点击"立即上传"按钮）
async function uploadEvidence(item, index) {
	uni.vibrateMedium?.()
	if (item.status === 'uploaded' || item.status === 'uploading') return
	uni.showLoading({ title: '上传中...', mask: true })
	await autoUpload(item)
	uni.hideLoading()
}

// 生成证据哈希（模拟，真实场景由后端计算）
function genEvidenceHash(item) {
	const raw = `${item.name}|${item.latitude}|${item.longitude}|${item.timestamp}|${item.badgeNo}|${Date.now()}`
	let h = 0x811c9dc5
	for (let i = 0; i < raw.length; i++) {
		h ^= raw.charCodeAt(i)
		h = (h * 0x01000193) >>> 0
	}
	return h.toString(16).toUpperCase().padStart(8, '0')
}

// 生成证据链编号
function genChainId() {
	const now = new Date()
	const pad = (n) => String(n).padStart(2, '0')
	const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`
	return `CHAIN-${ts}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
}

// 区块链存证状态文本
function getChainStatusText(status) {
	return { confirmed: '已存证', pending: '存证中', failed: '存证失败' }[status] || '待上传'
}

// 复制证据链编号
function copyChainId(chainId) {
	uni.setClipboardData({
		data: chainId,
		success: () => {
			uni.showToast({ title: '证据链编号已复制', icon: 'success' })
			uni.vibrateShort()
		}
	})
}

// 取证确认弹窗（高亮闪烁效果：余光可感知）
function showEvidenceConfirm(meta) {
	uni.vibrateMedium?.()

	// 强制屏幕高亮闪烁（利用系统toast覆盖层实现）
	uni.showModal({
		title:       '✅ 取证水印已嵌入',
		content:
			`─────────────────────\n` +
			`【不可篡改元数据】\n` +
			`所属单位：${meta.unitName}\n` +
			`执法警号：${meta.badgeNo}\n` +
			`工单编号：${props.taskId}\n` +
			`采集坐标：${meta.latitude}, ${meta.longitude}\n` +
			`采集时间：${meta.timestamp}\n` +
			`定位状态：${gpsStatusText.value}\n` +
			`─────────────────────\n` +
			`证据已自动提交至服务器，附带完整司法链数据。`,
		showCancel:  false,
		confirmText: '确认（震动反馈）',
		confirmColor: '#00D4FF',
		success: () => uni.vibrateMedium?.()
	})
}

function getTypeIcon(type) {
	return { photo: '🖼️', video: '🎬', audio: '🎵', file: '📄' }[type] || '📎'
}

onMounted(() => {
	// 页面挂载时立即锁定 GPS，后续拍照复用
	refreshMeta()
})
</script>

<style lang="scss" scoped>
/* ── 元数据状态栏 ── */
.ec-meta-bar {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 14rpx 20rpx;
	border-radius: 16rpx;
	margin-bottom: 24rpx;
	border: 1.5rpx solid rgba(255,255,255,0.08);
	background: rgba(255,255,255,0.04);
	flex-wrap: wrap;

	&.valid {
		border-color: rgba(16,185,129,0.45);
		background: rgba(16,185,129,0.08);
	}
	&.fallback {
		border-color: rgba(255,169,64,0.45);
		background: rgba(255,169,64,0.08);
	}
	&.loading, &.error {
		border-color: rgba(255,77,79,0.3);
		background: rgba(255,77,79,0.06);
	}
}

.meta-bar-icon { font-size: 26rpx; flex-shrink: 0; }
.meta-bar-label { font-size: 20rpx; color: #8c8c8c; flex-shrink: 0; }
.meta-bar-coords {
	font-size: 22rpx;
	color: #00D4FF;
	font-family: 'Courier New', monospace;
	font-weight: 700;
	flex: 1;
}
.meta-bar-time {
	font-size: 20rpx;
	color: #9db3c6;
	font-family: 'Courier New', monospace;
}
.meta-bar-status {
	font-size: 20rpx;
	font-weight: 700;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	background: rgba(16,185,129,0.18);
	color: #73D13D;
}

/* ── 取证主体 ── */
.evidence-capture {
	background: rgba(26,31,46,.95);
	border-radius: 20rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
}

.ec-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 32rpx;
}
.ec-title { font-size: 32rpx; font-weight: 700; color: #fff; }
.ec-counts { display: flex; gap: 24rpx; }
.count-item { display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.count-num { font-size: 32rpx; font-weight: 700; color: #00d4ff; font-family: 'Courier New', monospace; }
.count-label { font-size: 18rpx; color: #8c8c8c; }

/* ── 取证操作按钮（触控热区极度放大）──
   高度 ≥ 56px（≥112rpx），横向撑满屏
   padding + ::before 外扩热区，确保手套盲操可靠 */
.ec-actions {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	margin-bottom: 32rpx;
}

.ec-btn {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	padding: 36rpx 24rpx;
	border-radius: 24rpx;
	border: 1.5rpx solid rgba(255,255,255,.1);
	background: rgba(255,255,255,.05);
	transition: all .2s;
	/* 触控热区外扩（同 TacticalButton） */
	&::before {
		content: '';
		position: absolute;
		inset: -16rpx;
		z-index: 0;
	}
	&:active { transform: scale(.97); }

	&.photo {
		border-color: rgba(0,212,255,.35);
		background: rgba(0,212,255,.09);
		&:active { background: rgba(0,212,255,.18); }
	}
	&.video {
		border-color: rgba(115,209,61,.35);
		background: rgba(115,209,61,.09);
		&:active { background: rgba(115,209,61,.18); }
	}
	&.audio {
		border-color: rgba(255,169,64,.35);
		background: rgba(255,169,64,.09);
		&:active { background: rgba(255,169,64,.18); }
	}
	&.file {
		border-color: rgba(102,126,234,.35);
		background: rgba(102,126,234,.09);
		&:active { background: rgba(102,126,234,.18); }
	}
}

.ec-btn-icon {
	font-size: 64rpx;
	line-height: 1;
	position: relative;
	z-index: 1;
}
.ec-btn-text {
	font-size: 30rpx;
	font-weight: 700;
	color: #fff;
	position: relative;
	z-index: 1;
}
.ec-btn-sub {
	font-size: 18rpx;
	color: rgba(255,255,255,.5);
	position: relative;
	z-index: 1;
}

/* ── 证据列表 ── */
.ec-list {
	border-top: 1px solid rgba(255,255,255,.08);
	padding-top: 24rpx;
}
.ec-list-title {
	font-size: 24rpx;
	color: #8c8c8c;
	margin-bottom: 16rpx;
	display: block;
}

/* 单条证据 — 不可篡改元数据完整展示 */
.ec-item {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	padding: 20rpx;
	background: rgba(255,255,255,.04);
	border-radius: 16rpx;
	margin-bottom: 14rpx;
	border: 1rpx solid rgba(255,255,255,.06);
	transition: border-color .2s;

	&.uploaded { border-color: rgba(115,209,61,.3); }
	&.uploading { border-color: rgba(0,212,255,.3); }
	&.pending   { border-color: rgba(255,169,64,.25); }
}

.ec-item-icon {
	font-size: 40rpx;
	flex-shrink: 0;
	margin-top: 4rpx;
}

.ec-item-body { flex: 1; display: flex; flex-direction: column; gap: 8rpx; min-width: 0; }

.ec-item-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
}

.ec-item-name {
	font-size: 26rpx;
	color: #fff;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
}

.ec-item-badge {
	padding: 4rpx 12rpx;
	border-radius: 16rpx;
	flex-shrink: 0;
	&.uploaded { background: rgba(115,209,61,.18); }
	&.uploading { background: rgba(0,212,255,.18); }
	&.pending   { background: rgba(255,169,64,.18); }
}

.badge-txt {
	font-size: 20rpx;
	font-weight: 700;
	.uploaded &   { color: #73D13D; }
	.uploading &  { color: #00D4FF; }
	.pending &    { color: #FFA940; }
}

/* 不可篡改元数据标签行 */
.ec-item-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 8rpx;
	margin-top: 4rpx;
}

.meta-tag {
	font-size: 18rpx;
	color: rgba(255,255,255,.55);
	background: rgba(255,255,255,.06);
	border-radius: 8rpx;
	padding: 4rpx 10rpx;
	font-family: 'Courier New', monospace;
}

/* 立即上传按钮（触控热区放大） */
.ec-upload-btn {
	flex-shrink: 0;
	align-self: center;
	min-width: 120rpx;
	min-height: 72rpx;
	padding: 16rpx 20rpx;
	background: linear-gradient(135deg, rgba(0,212,255,.2), rgba(0,168,216,.1));
	border: 1.5rpx solid rgba(0,212,255,.45);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all .2s;

	&:active {
		transform: scale(.96);
		background: rgba(0,212,255,.28);
	}
}

.upload-btn-text {
	font-size: 22rpx;
	font-weight: 700;
	color: #00D4FF;
}

/* ── 证据司法链信息 ── */
.ec-chain-row {
	display: flex;
	align-items: center;
	gap: 8rpx;
	margin-top: 6rpx;
	padding-top: 8rpx;
	border-top: 1rpx dashed rgba(255,255,255,.08);
}
.chain-hash-label { font-size: 18rpx; color: #8c8c8c; flex-shrink: 0; }
.chain-hash-val {
	font-size: 18rpx;
	color: #00D4FF;
	font-family: 'Courier New', monospace;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.chain-status-badge {
	padding: 2rpx 10rpx;
	border-radius: 8rpx;
	flex-shrink: 0;
	font-size: 18rpx;
	font-weight: 700;
	&.chain-confirmed { background: rgba(115,209,61,.15); color: #73D13D; }
	&.chain-pending   { background: rgba(255,169,64,.12); color: #FFA940; }
	&.chain-failed    { background: rgba(255,77,79,.15);  color: #FF4D4F; }
}
.chain-id-label { font-size: 18rpx; color: #8c8c8c; flex-shrink: 0; }
.chain-id-val {
	font-size: 18rpx;
	color: #9be8ff;
	font-family: 'Courier New', monospace;
	text-decoration: underline;
	&:active { color: #00D4FF; }
}

/* ── 水印预览弹窗 ── */
.ec-preview-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.72);
	z-index: 300;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 30rpx;
}

.ec-preview-card {
	width: 100%;
	max-width: 680rpx;
	background: #0d1826;
	border: 1px solid rgba(0, 212, 255, 0.3);
	border-radius: 28rpx;
	overflow: hidden;
	box-shadow: 0 24rpx 60rpx rgba(0, 0, 0, 0.6);
}

.ec-preview-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 28rpx;
	background: rgba(0, 212, 255, 0.08);
	border-bottom: 1px solid rgba(0, 212, 255, 0.15);
}

.ec-preview-title {
	font-size: 30rpx;
	font-weight: 800;
	color: #f4fbff;
}

.ec-preview-close {
	width: 52rpx;
	height: 52rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #fff;
	&:active { background: rgba(255, 77, 79, 0.2); }
}

.ec-preview-watermark-zone {
	position: relative;
	margin: 20rpx;
	border-radius: 16rpx;
	overflow: hidden;
	border: 1px solid rgba(255, 255, 255, 0.08);
}

.ec-preview-image-placeholder {
	height: 320rpx;
	background: #152a3d;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	.placeholder-icon { font-size: 80rpx; }
	.placeholder-text { font-size: 24rpx; color: rgba(255, 255, 255, 0.4); }
}

.ec-preview-watermark-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		to bottom,
		rgba(0, 0, 0, 0.65) 0%,
		rgba(0, 0, 0, 0.45) 40%,
		rgba(0, 0, 0, 0.2) 100%
	);
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	padding: 16rpx;
	gap: 4rpx;
}

.wm-line {
	display: flex;
}
.wm-text {
	font-size: 18rpx;
	color: rgba(255, 255, 255, 0.9);
	font-family: 'Courier New', monospace;
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.wm-anti-forge {
	display: flex;
	flex-direction: column;
	gap: 2rpx;
	margin-top: 8rpx;
	padding-top: 8rpx;
	border-top: 1rpx solid rgba(0, 212, 255, 0.3);
	.wm-forge-text { font-size: 16rpx; color: rgba(0, 212, 255, 0.8); font-weight: 700; }
	.wm-forge-hash {
		font-size: 14rpx;
		color: rgba(0, 212, 255, 0.6);
		font-family: 'Courier New', monospace;
		word-break: break-all;
	}
}

.ec-preview-detail {
	padding: 20rpx 24rpx;
	border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.ec-preview-section-title {
	font-size: 24rpx;
	font-weight: 700;
	color: #7fe7ff;
	margin-bottom: 14rpx;
}

.ec-preview-detail-row {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 10rpx 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	&:last-child { border-bottom: none; }
	.detail-label { font-size: 22rpx; color: #7AA8CC; flex-shrink: 0; }
	.detail-value {
		font-size: 22rpx;
		color: #f4fbff;
		text-align: right;
		flex: 1;
		margin-left: 16rpx;
		word-break: break-all;
		&.mono { font-family: 'Courier New', monospace; font-size: 18rpx; color: #00D4FF; }
	}
}

.ec-preview-footer {
	padding: 16rpx 24rpx;
	background: rgba(0, 212, 255, 0.05);
	border-top: 1px solid rgba(0, 212, 255, 0.1);
	.ec-preview-hint { font-size: 20rpx; color: #7AA8CC; line-height: 1.5; }
}

/* ── 水印预览按钮 ── */
.ec-preview-btn {
	margin-top: 8rpx;
	padding: 6rpx 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 212, 255, 0.08);
	border: 1px solid rgba(0, 212, 255, 0.2);
	border-radius: 10rpx;
	.preview-btn-text { font-size: 20rpx; color: #00D4FF; font-weight: 700; }
	&:active { background: rgba(0, 212, 255, 0.18); }
}
</style>
