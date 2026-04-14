<template>
	<view class="sampling-manager">
		<view class="sm-header">
			<text class="sm-title">🧪 采样管理</text>
			<view class="sm-add-btn" @tap="addSample"><text class="sm-add-txt">+ 新增采样</text></view>
		</view>
		<view class="sm-list">
			<view v-for="(s, i) in samples" :key="i" class="sm-item">
				<view class="sm-item-top">
					<text class="sm-item-id">{{ s.id }}</text>
					<view class="sm-type-badge"><text class="sm-type-txt">{{ s.type }}</text></view>
					<view class="sm-status" :class="s.status"><text class="sm-status-txt">{{ s.statusText }}</text></view>
				</view>
				<view class="sm-item-row"><text class="sm-label">采样点：</text><text class="sm-val">{{ s.location }}</text></view>
				<view class="sm-item-row"><text class="sm-label">检测值：</text><text class="sm-val danger">{{ s.value }} {{ s.unit }}</text><text class="sm-exceed" v-if="s.exceed > 1">超标{{ s.exceed }}倍</text></view>
				<view class="sm-item-row"><text class="sm-label">采样方法：</text><text class="sm-val-sm">{{ s.method || '--' }}</text></view>
				<view class="sm-item-row"><text class="sm-label">采样时间：</text><text class="sm-val-sm">{{ s.time }}</text></view>
				<view class="sm-chain-row" v-if="s.chainId">
					<text class="sm-chain-label">存证编号：</text>
					<text class="sm-chain-val">{{ s.chainId }}</text>
				</view>
			</view>
		</view>
		<view v-if="samples.length === 0" class="sm-empty">
			<text class="sm-empty-txt">暂无采样记录，点击「新增采样」开始</text>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({ taskId: { type: Number, required: true } })
const emit  = defineEmits(['sampleAdded'])
const TYPES   = [
	'走私活体物种采样',
	'环境DNA采样（eDNA）',
	'涉案车辆/货物擦拭采样',
	'水质样本采集',
	'土壤/沉积物样本',
	'大气样本采集',
	'红外触发影像取证',
	'气味分子采样（拉曼分析）'
]
const UNITS   = {
	'走私活体物种采样': 'mg/kg',
	'环境DNA采样（eDNA）': 'ng/μL',
	'涉案车辆/货物擦拭采样': 'μg/cm²',
	'水质样本采集': 'mg/L',
	'土壤/沉积物样本': 'mg/kg',
	'大气样本采集': 'μg/m³',
	'红外触发影像取证': '张/次',
	'气味分子采样（拉曼分析）': '拉曼峰/cm⁻¹'
}
const samples = ref([
	{ id:'SMPL-001', type:'走私活体物种采样', location:'友谊关GX-IR-201设备点', value:3.52, unit:'mg/kg', exceed:3.5, time:'09:15', status:'abnormal', statusText:'超标', method:'组织采样+拍照存档', chainId:'CHAIN-20260407-ABC123' },
	{ id:'SMPL-002', type:'环境DNA采样（eDNA）', location:'凭祥河段监测点B', value:0.82, unit:'ng/μL', exceed:0.8, time:'09:42', status:'normal', statusText:'正常', method:'水体过滤+乙醇保存', chainId:'CHAIN-20260407-DEF456' },
])
let counter = 3
function addSample() {
	const type = TYPES[Math.floor(Math.random() * TYPES.length)]
	const val  = +(Math.random() * 5 + 0.5).toFixed(2)
	const exceed = +(val / 1.0).toFixed(1)
	samples.value.push({
		id: 'SMPL-' + String(counter++).padStart(3,'0'),
		type, location: '监测点' + String.fromCharCode(65+Math.floor(Math.random()*5)) + '-0' + counter,
		value: val, unit: UNITS[type], exceed,
		time: new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),
		status: exceed > 1.5 ? 'abnormal' : 'normal',
		statusText: exceed > 1.5 ? '超标' : '正常'
	})
	uni.showToast({ title: '采样记录已添加', icon: 'success' })
	uni.vibrateShort()
	emit('sampleAdded', samples.value.length)
}
</script>

<style lang="scss" scoped>
.sampling-manager { background:rgba(26,31,46,.95); border-radius:20rpx; padding:32rpx; margin-bottom:24rpx; }
.sm-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28rpx; }
.sm-title  { font-size:32rpx; font-weight:700; color:#fff; }
.sm-add-btn { padding:12rpx 28rpx; background:linear-gradient(135deg,#00d4ff,#00f2fe); border-radius:20rpx; }
.sm-add-txt { font-size:24rpx; font-weight:700; color:var(--bg-root); }
.sm-list { display:flex; flex-direction:column; gap:20rpx; }
.sm-item { background:rgba(255,255,255,.05); border-radius:16rpx; border:1px solid rgba(255,255,255,.1); padding:24rpx; }
.sm-item-top { display:flex; align-items:center; gap:16rpx; margin-bottom:16rpx; }
.sm-item-id  { font-size:22rpx; color:#00d4ff; font-family:'Courier New',monospace; font-weight:700; flex:1; }
.sm-type-badge { background:rgba(0,212,255,.15); border:1px solid rgba(0,212,255,.3); border-radius:10rpx; padding:6rpx 16rpx; }
.sm-type-txt   { font-size:20rpx; color:#00d4ff; }
.sm-status { padding:6rpx 16rpx; border-radius:10rpx;
	&.abnormal { background:rgba(255,77,79,.15); border:1px solid rgba(255,77,79,.3); }
	&.normal   { background:rgba(115,209,61,.15); border:1px solid rgba(115,209,61,.3); }
}
.sm-status-txt { font-size:20rpx; font-weight:600;
	.abnormal & { color:#FF4D4F; }
	.normal   & { color:#73D13D; }
}
.sm-item-row { display:flex; align-items:center; gap:12rpx; margin-bottom:10rpx; }
.sm-label { font-size:22rpx; color:#8c8c8c; width:120rpx; flex-shrink:0; }
.sm-val   { font-size:24rpx; color:#fff; flex:1;
	&.danger { color:#FF4D4F; font-weight:700; font-family:'Courier New',monospace; }
}
.sm-val-sm { font-size:22rpx; color:#fff; flex:1; }
.sm-chain-row { display:flex; align-items:center; gap:8rpx; margin-top:8rpx; padding-top:8rpx; border-top:1rpx dashed rgba(255,255,255,.08); }
.sm-chain-label { font-size:18rpx; color:#8c8c8c; }
.sm-chain-val { font-size:18rpx; color:#9be8ff; font-family:'Courier New',monospace; }
.sm-exceed { font-size:20rpx; color:#FFA940; background:rgba(255,169,64,.15); padding:4rpx 12rpx; border-radius:8rpx; }
.sm-empty { padding:48rpx 0; text-align:center; }
.sm-empty-txt { font-size:26rpx; color:#595959; }
</style>
