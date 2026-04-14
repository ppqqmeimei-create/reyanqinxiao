<template>
	<view class="sheet-page">
		<!-- 顶部导航 -->
		<view class="sheet-nav">
			<view class="nav-back" @tap="goBack">
				<text class="nav-arrow">←</text>
			</view>
			<text class="nav-title">联动采样单</text>
			<view class="nav-right"></view>
		</view>

		<!-- 采样单卡片 -->
		<view class="sheet-card">
			<!-- 单据头部 -->
			<view class="card-header">
				<view class="header-left">
					<text class="header-icon">🧪</text>
					<view class="header-info">
						<text class="header-type">{{ sampleTypeName }}</text>
						<text class="header-id">编号：{{ sampleCode }}</text>
					</view>
				</view>
				<view class="header-status" :class="'status-' + sampleStatus">
					<text>{{ statusText }}</text>
				</view>
			</view>

			<!-- 分隔线 -->
			<view class="card-divider"></view>

			<!-- 采样基本信息 -->
			<view class="card-section">
				<text class="section-title">📋 采样信息</text>
				<view class="info-grid">
					<view class="info-item">
						<text class="info-label">采样地点</text>
						<text class="info-value">{{ location }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">采样时间</text>
						<text class="info-value">{{ sampleTime }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">采样类型</text>
						<text class="info-value highlight">{{ sampleTypeName }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">执行单位</text>
						<text class="info-value">{{ unit }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">采样人员</text>
						<text class="info-value">{{ inspector }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">关联监测点</text>
						<text class="info-value">{{ monitorPoint }}</text>
					</view>
				</view>
			</view>

			<!-- 分隔线 -->
			<view class="card-divider"></view>

			<!-- 检测指标 -->
			<view class="card-section">
				<text class="section-title">📊 检测指标</text>
				<view class="indicator-list">
					<view class="indicator-item" v-for="(item, idx) in indicators" :key="idx">
						<text class="indicator-name">{{ item.name }}</text>
						<text class="indicator-value" :class="{ 'exceed': item.exceed }">
							{{ item.value }} {{ item.unit }}
						</text>
						<text class="indicator-tag" :class="item.exceed ? 'tag-danger' : 'tag-normal'">
							{{ item.exceed ? '超标' : '正常' }}
						</text>
					</view>
				</view>
			</view>

			<!-- 分隔线 -->
			<view class="card-divider"></view>

			<!-- 采样说明 -->
			<view class="card-section">
				<text class="section-title">📝 操作说明</text>
				<view class="instruction-list">
					<view class="instruction-item">
						<text class="inst-num">1</text>
						<text class="inst-text">现场采集样本，拍摄采样照片</text>
					</view>
					<view class="instruction-item">
						<text class="inst-num">2</text>
						<text class="inst-text">填写采样记录，确认数据无误</text>
					</view>
					<view class="instruction-item">
						<text class="inst-num">3</text>
						<text class="inst-text">样本装瓶贴签，同步上传采样编号</text>
					</view>
					<view class="instruction-item">
						<text class="inst-num">4</text>
						<text class="inst-text">提交至实验室，填写快递单号</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部操作栏 -->
		<view class="sheet-actions">
			<view class="action-btn action-cancel" @tap="goBack">
				<text>取消</text>
			</view>
			<view class="action-btn action-confirm" @tap="handleConfirm">
				<text>确认采样</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const sampleCode = ref('')
const sampleType = ref('water') // water | soil | air
const location = ref('')
const sampleTime = ref('')
const unit = ref('崇左生态监测组')
const inspector = ref('李三分')
const monitorPoint = ref('友谊关GX-IR-201设备点')
const sampleStatus = ref('pending') // pending | confirmed | submitted

const sampleTypeMap = {
	water: '地表水快检',
	soil: '土壤平行样',
	air: '空气微站复核'
}

const sampleTypeName = computed(() => sampleTypeMap[sampleType.value] || '未知类型')

const statusText = computed(() => {
	const map = {
		pending: '待采样',
		confirmed: '已确认',
		submitted: '已提交'
	}
	return map[sampleStatus.value] || '待采样'
})

const indicators = computed(() => {
	const now = new Date()
	const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

	if (sampleType.value === 'water') {
		return [
			{ name: 'pH值', value: '7.42', unit: '', exceed: false },
			{ name: '氨氮', value: '0.85', unit: 'mg/L', exceed: true },
			{ name: 'COD', value: '18.2', unit: 'mg/L', exceed: false },
			{ name: '溶解氧', value: '6.5', unit: 'mg/L', exceed: false }
		]
	} else if (sampleType.value === 'soil') {
		return [
			{ name: '重金属Cd', value: '0.32', unit: 'mg/kg', exceed: true },
			{ name: '重金属Pb', value: '28.5', unit: 'mg/kg', exceed: false },
			{ name: '有机质', value: '2.8', unit: '%', exceed: false },
			{ name: 'pH值', value: '6.2', unit: '', exceed: false }
		]
	} else {
		return [
			{ name: 'PM2.5', value: '68', unit: 'μg/m³', exceed: true },
			{ name: 'PM10', value: '95', unit: 'μg/m³', exceed: false },
			{ name: 'O₃', value: '142', unit: 'μg/m³', exceed: false },
			{ name: 'CO', value: '0.8', unit: 'mg/m³', exceed: false }
		]
	}
})

function generateSampleCode() {
	const timestamp = Date.now()
	const code = `LY-${String(timestamp).slice(-6)}`
	sampleCode.value = code
	const now = new Date()
	sampleTime.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function goBack() {
	uni.navigateBack()
}

function handleConfirm() {
	sampleStatus.value = 'confirmed'
	uni.showToast({
		title: `采样单 ${sampleCode.value} 已确认`,
		icon: 'success'
	})
	setTimeout(() => {
		uni.navigateBack()
	}, 1500)
}

onLoad((options) => {
	if (options.type) {
		sampleType.value = options.type
	}
	if (options.code) {
		sampleCode.value = options.code
	} else {
		generateSampleCode()
	}
	if (options.location) {
		location.value = decodeURIComponent(options.location)
	} else {
		uni.getLocation({
			type: 'gcj02',
			success: (res) => {
				location.value = `${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}`
			},
			fail: () => {
				location.value = '凭祥市友谊关附近'
			}
		})
	}
	const now = new Date()
	sampleTime.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
})
</script>

<style lang="scss" scoped>
.sheet-page {
	min-height: 100vh;
	background: #07111d;
	padding-bottom: 160rpx;
}

// 顶部导航
.sheet-nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 60rpx 32rpx 24rpx;
	background: #0c1524;
	border-bottom: 1px solid rgba(0, 212, 255, 0.12);
}
.nav-back {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.06);
	border-radius: 50%;
}
.nav-arrow {
	font-size: 32rpx;
	color: #fff;
}
.nav-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #f4fbff;
}
.nav-right {
	width: 64rpx;
}

// 采样单卡片
.sheet-card {
	margin: 28rpx 24rpx;
	background: linear-gradient(160deg, #0f1e30, #0c1824);
	border-radius: 24rpx;
	border: 1px solid rgba(0, 212, 255, 0.15);
	overflow: hidden;
}

.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx 32rpx 28rpx;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.header-icon {
	font-size: 52rpx;
}

.header-info {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.header-type {
	font-size: 34rpx;
	font-weight: 800;
	color: #f4fbff;
}

.header-id {
	font-size: 22rpx;
	color: #8ca3b8;
	font-family: 'Courier New', monospace;
}

.header-status {
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 700;
}

.status-pending {
	background: rgba(255, 169, 64, 0.15);
	color: #ffa940;
	border: 1px solid rgba(255, 169, 64, 0.3);
}

.status-confirmed {
	background: rgba(0, 212, 255, 0.15);
	color: #00d4ff;
	border: 1px solid rgba(0, 212, 255, 0.3);
}

.status-submitted {
	background: rgba(115, 209, 61, 0.15);
	color: #73d13d;
	border: 1px solid rgba(115, 209, 61, 0.3);
}

.card-divider {
	height: 1px;
	background: rgba(255, 255, 255, 0.06);
	margin: 0 32rpx;
}

.card-section {
	padding: 28rpx 32rpx;
}

.section-title {
	font-size: 26rpx;
	font-weight: 700;
	color: #00d4ff;
	display: block;
	margin-bottom: 20rpx;
}

// 信息网格
.info-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 18rpx;
}

.info-item {
	background: rgba(255, 255, 255, 0.03);
	border-radius: 12rpx;
	padding: 18rpx 20rpx;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.info-label {
	font-size: 20rpx;
	color: #8ca3b8;
}

.info-value {
	font-size: 26rpx;
	font-weight: 700;
	color: #f4fbff;
}

.info-value.highlight {
	color: #00d4ff;
}

// 指标列表
.indicator-list {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.indicator-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 18rpx 20rpx;
	background: rgba(255, 255, 255, 0.03);
	border-radius: 12rpx;
}

.indicator-name {
	flex: 1;
	font-size: 26rpx;
	color: #f4fbff;
}

.indicator-value {
	font-size: 28rpx;
	font-weight: 800;
	color: #f4fbff;
}

.indicator-value.exceed {
	color: #ff6b6b;
}

.indicator-tag {
	font-size: 20rpx;
	font-weight: 700;
	padding: 4rpx 14rpx;
	border-radius: 999rpx;
}

.tag-danger {
	background: rgba(255, 107, 107, 0.15);
	color: #ff6b6b;
	border: 1px solid rgba(255, 107, 107, 0.3);
}

.tag-normal {
	background: rgba(115, 209, 61, 0.15);
	color: #73d13d;
	border: 1px solid rgba(115, 209, 61, 0.3);
}

// 操作说明
.instruction-list {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}

.instruction-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.inst-num {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: rgba(0, 212, 255, 0.15);
	border: 1px solid rgba(0, 212, 255, 0.3);
	color: #00d4ff;
	font-size: 22rpx;
	font-weight: 800;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.inst-text {
	font-size: 26rpx;
	color: #8ca3b8;
}

// 底部操作栏
.sheet-actions {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	gap: 20rpx;
	padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
	background: #0c1524;
	border-top: 1px solid rgba(0, 212, 255, 0.12);
}

.action-btn {
	flex: 1;
	height: 92rpx;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 800;
}

.action-cancel {
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #8ca3b8;
}

.action-confirm {
	background: linear-gradient(135deg, #007aaa, #00d4ff);
	color: #fff;
	box-shadow: 0 8rpx 24rpx rgba(0, 212, 255, 0.3);
}
</style>
