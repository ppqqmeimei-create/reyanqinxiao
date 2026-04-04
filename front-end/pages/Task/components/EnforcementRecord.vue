<template>
	<view class="enforcement-record">
		<view class="er-header">
			<text class="er-title">?? ????</text>
			<view class="er-save-btn" @tap="saveRecord"><text class="er-save-txt">??</text></view>
		</view>
		<view class="er-form">
			<view class="er-field">
				<text class="er-label">????</text>
				<input class="er-input" v-model="record.inspector" placeholder="?????????" />
			</view>
			<view class="er-field">
				<text class="er-label">????</text>
				<input class="er-input" v-model="record.violator" placeholder="???????" />
			</view>
			<view class="er-field">
				<text class="er-label">????</text>
				<view class="er-types">
					<view
						v-for="t in violationTypes" :key="t.value"
						class="er-type-chip" :class="{ active: record.violationType === t.value }"
						@tap="record.violationType = t.value"
					><text class="er-type-txt">{{ t.label }}</text></view>
				</view>
			</view>
			<view class="er-field">
				<text class="er-label">????</text>
				<textarea class="er-textarea" v-model="record.opinion" placeholder="???????..." />
			</view>
			<view class="er-field">
				<text class="er-label">????</text>
				<view class="er-deadline-row">
					<view v-for="d in deadlines" :key="d" class="er-deadline-chip" :class="{ active: record.deadline === d }" @tap="record.deadline = d">
						<text class="er-deadline-txt">{{ d }}</text>
					</view>
				</view>
			</view>
		</view>
		<view class="er-footer">
			<view class="er-submit-btn" @tap="submitRecord">
				<text class="er-submit-txt">?? ??????</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({ taskId: { type: Number, required: true } })
const emit  = defineEmits(['submitted'])
const violationTypes = [
	{ label: '???', value: 'water' },
	{ label: '????', value: 'air' },
	{ label: '???????', value: 'soil' },
	{ label: '????', value: 'waste' },
	{ label: '????', value: 'noise' },
]
const deadlines = ['7?', '15?', '30?', '60?', '????']
const record = ref({ inspector: '', violator: '', violationType: 'water', opinion: '', deadline: '15?' })

function saveRecord() {
	uni.setStorageSync('enforcement_record_' + props.taskId, record.value)
	uni.showToast({ title: '?????', icon: 'success' })
	uni.vibrateShort()
}

function submitRecord() {
	if (!record.value.inspector.trim()) { uni.showToast({ title: '???????', icon: 'none' }); return }
	if (!record.value.violator.trim())  { uni.showToast({ title: '???????', icon: 'none' }); return }
	uni.showModal({
		title: '????', content: '?????????????????', confirmText: '????',
		success: (res) => {
			if (res.confirm) {
				uni.showLoading({ title: '???...', mask: true })
				setTimeout(() => {
					uni.hideLoading()
					uni.showToast({ title: '???????', icon: 'success' })
					emit('submitted', record.value)
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
.er-save-btn { padding:12rpx 28rpx; background:rgba(0,212,255,.15); border:1px solid rgba(0,212,255,.3); border-radius:20rpx; }
.er-save-txt { font-size:24rpx; color:#00d4ff; font-weight:600; }
.er-form { display:flex; flex-direction:column; gap:28rpx; }
.er-field { display:flex; flex-direction:column; gap:12rpx; }
.er-label { font-size:24rpx; color:#8c8c8c; font-weight:600; }
.er-input { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); border-radius:12rpx; padding:20rpx 24rpx; font-size:28rpx; color:#fff; }
.er-textarea { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); border-radius:12rpx; padding:20rpx 24rpx; font-size:26rpx; color:#fff; height:160rpx; }
.er-types { display:flex; flex-wrap:wrap; gap:16rpx; }
.er-type-chip { padding:12rpx 24rpx; border-radius:20rpx; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
	&.active { background:rgba(0,212,255,.2); border-color:rgba(0,212,255,.5); }
}
.er-type-txt { font-size:24rpx; color:#8c8c8c; .active & { color:#00d4ff; font-weight:600; } }
.er-deadline-row { display:flex; flex-wrap:wrap; gap:16rpx; }
.er-deadline-chip { padding:12rpx 24rpx; border-radius:20rpx; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
	&.active { background:rgba(255,169,64,.2); border-color:rgba(255,169,64,.5); }
}
.er-deadline-txt { font-size:24rpx; color:#8c8c8c; .active & { color:#FFA940; font-weight:600; } }
.er-footer { margin-top:16rpx; }
.er-submit-btn { background:linear-gradient(135deg,#00A8D6,#007EA8); border-radius:20rpx; padding:32rpx; display:flex; align-items:center; justify-content:center;
	&:active { opacity:.9; transform:scale(.99); }
}
.er-submit-txt { font-size:30rpx; font-weight:700; color:#fff; }
</style>
