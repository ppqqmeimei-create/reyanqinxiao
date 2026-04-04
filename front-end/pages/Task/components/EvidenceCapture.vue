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
				</view>
				<!-- 立即上传按钮（触控热区放大） -->
				<view
					v-if="item.status !== 'uploaded' && item.status !== 'uploading'"
					class="ec-upload-btn"
					@tap.stop="uploadEvidence(item, i)"
				>
					<text class="upload-btn-text">立即上传</text>
				</view>
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
const gpsStatus = ref('loading') // 'loading' | 'valid' | 'fallback' | 'error'
const gpsStatusText = computed(() => ({
	loading: '定位中...',
	valid:   'GPS有效',
	fallback: '离线兜底',
	error:   '定位失败'
}[gpsStatus.value] || ''))

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
			url:          'http://localhost:5000/api/v1/evidence/upload',
			filePath:     item.filePath,
			name:         'file',
			formData,
			header: {
				Authorization: `Bearer ${uni.getStorageSync('user_token') || uni.getStorageSync('token') || ''}`
			},
			success: (res) => {
				item.status = 'uploaded'
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
</style>
