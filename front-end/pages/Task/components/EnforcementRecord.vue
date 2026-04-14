<template>
	<view class="enforcement-record">
		<view class="er-header">
			<text class="er-title">📝 执法记录</text>
			<view class="er-save-btn" @tap="saveRecord"><text class="er-save-txt">保存草稿</text></view>
		</view>
		<view class="er-form">
			<view class="er-field">
				<text class="er-label">检查人员</text>
				<input class="er-input" v-model="record.inspector" placeholder="请输入检查人员姓名" />
			</view>
			<view class="er-field">
				<text class="er-label">当事人</text>
				<input class="er-input" v-model="record.violator" placeholder="请输入当事人姓名或单位" />
			</view>
			<view class="er-field">
				<text class="er-label">涉案物种 / 违法类型</text>
				<view class="er-types">
					<view
						v-for="t in violationTypes" :key="t.value"
						class="er-type-chip" :class="{ active: record.violationType === t.value }"
						@tap="record.violationType = t.value"
					><text class="er-type-txt">{{ t.label }}</text></view>
				</view>
			</view>
			<view class="er-field">
				<text class="er-label">违法详情</text>
				<textarea class="er-textarea" v-model="record.opinion" placeholder="请详细描述违法事实、现场检查情况及处置过程..." />
			</view>
			<view class="er-field">
				<text class="er-label">处置时限</text>
				<view class="er-deadline-row">
					<view v-for="d in deadlines" :key="d" class="er-deadline-chip" :class="{ active: record.deadline === d }" @tap="record.deadline = d">
						<text class="er-deadline-txt">{{ d }}</text>
					</view>
				</view>
			</view>
			<view class="er-field">
				<text class="er-label">查处结果</text>
				<view class="er-result-row">
					<view
						v-for="r in resultOptions" :key="r.value"
						class="er-result-chip" :class="{ active: record.result === r.value }"
						@tap="record.result = r.value"
					><text class="er-result-txt">{{ r.label }}</text></view>
				</view>
			</view>
		</view>
		<view class="er-footer">
			<view class="er-submit-btn" @tap="submitRecord">
				<text class="er-submit-txt">📤 提交执法记录</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
	taskId:     { type: Number, required: true },
	caseNumber: { type: String, default: '' }
})
const emit  = defineEmits(['save', 'submitted'])

const violationTypes = [
	{ label: '走私活物', value: 'wildlife' },
	{ label: '水污染',   value: 'water' },
	{ label: '大气污染', value: 'air' },
	{ label: '土壤污染', value: 'soil' },
	{ label: '固废非法', value: 'waste' },
	{ label: '噪声超标', value: 'noise' },
	{ label: '其他违法', value: 'other' },
]
const deadlines = ['7天', '15天', '30天', '60天', '立即处置']
const resultOptions = [
	{ label: '现场查获', value: 'on-site' },
	{ label: '立案查处', value: 'filed' },
	{ label: '移交公安', value: 'transfer' },
	{ label: '批评教育', value: 'educate' },
]

const record = ref({
	inspector: '',
	violator: '',
	violationType: 'wildlife',
	opinion: '',
	deadline: '立即处置',
	result: 'on-site'
})

function saveRecord() {
	uni.setStorageSync('enforcement_record_' + props.taskId, JSON.stringify(record.value))
	uni.showToast({ title: '草稿已保存', icon: 'success', duration: 1500 })
	uni.vibrateShort()
	emit('save', { ...record.value })
}

function submitRecord() {
	if (!record.value.inspector.trim()) { uni.showToast({ title: '请填写检查人员', icon: 'none' }); return }
	if (!record.value.violator.trim())  { uni.showToast({ title: '请填写当事人信息', icon: 'none' }); return }
	if (!record.value.opinion.trim())   { uni.showToast({ title: '请填写违法详情', icon: 'none' }); return }
	uni.showModal({
		title: '确认提交', content: '执法记录提交后将不可修改，确认提交？', confirmText: '确认提交',
		confirmColor: '#00D4FF',
		success: (res) => {
			if (res.confirm) {
				uni.showLoading({ title: '提交中...', mask: true })
				setTimeout(() => {
					uni.hideLoading()
					uni.removeStorageSync('enforcement_record_' + props.taskId)
					uni.showToast({ title: '提交成功', icon: 'success', duration: 2000 })
					uni.vibrateLong()
					emit('submitted', { ...record.value })
				}, 1500)
			}
		}
	})
	uni.vibrateShort()
}
</script>

<style lang="scss" scoped>
.enforcement-record { background:rgba(26,31,46,.95); border-radius:20rpx; padding:32rpx; margin-bottom:24rpx; }
.er-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:32rpx; }
.er-title    { font-size:32rpx; font-weight:700; color:#fff; }
.er-save-btn { padding:10rpx 24rpx; background:rgba(0,212,255,.12); border:1rpx solid rgba(0,212,255,.3); border-radius:20rpx; }
.er-save-txt { font-size:24rpx; color:#00D4FF; font-weight:600; }
.er-form { display:flex; flex-direction:column; gap:28rpx; }
.er-field { display:flex; flex-direction:column; gap:12rpx; }
.er-label { font-size:24rpx; color:#8c8c8c; font-weight:600; }
.er-input { background:rgba(255,255,255,.08); border:1rpx solid rgba(255,255,255,.15); border-radius:12rpx; padding:20rpx 24rpx; font-size:28rpx; color:#fff; }
.er-textarea { background:rgba(255,255,255,.08); border:1rpx solid rgba(255,255,255,.15); border-radius:12rpx; padding:20rpx 24rpx; font-size:26rpx; color:#fff; height:160rpx; }
.er-types, .er-result-row { display:flex; flex-wrap:wrap; gap:12rpx; }
.er-type-chip, .er-result-chip { padding:10rpx 20rpx; border-radius:20rpx; background:rgba(255,255,255,.06); border:1rpx solid rgba(255,255,255,.12); transition:all .2s;
	&.active { background:rgba(0,212,255,.18); border-color:rgba(0,212,255,.5); }
}
.er-type-txt, .er-result-txt { font-size:24rpx; color:rgba(255,255,255,.6);
	.active & { color:#00D4FF; font-weight:600; }
}
.er-deadline-row { display:flex; flex-wrap:wrap; gap:12rpx; }
.er-deadline-chip { padding:10rpx 20rpx; border-radius:20rpx; background:rgba(255,255,255,.06); border:1rpx solid rgba(255,255,255,.12); transition:all .2s;
	&.active { background:rgba(255,169,64,.18); border-color:rgba(255,169,64,.5); }
}
.er-deadline-txt { font-size:24rpx; color:rgba(255,255,255,.6);
	.active & { color:#FFA940; font-weight:600; }
}
.er-footer { margin-top:8rpx; }
.er-submit-btn { background:linear-gradient(135deg,#00A8D6,#007EA8); border-radius:20rpx; padding:28rpx; display:flex; align-items:center; justify-content:center;
	&:active { opacity:.9; transform:scale(.99); }
}
.er-submit-txt { font-size:30rpx; font-weight:700; color:#fff; }
</style>
