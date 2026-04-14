<template>
	<view class="checklist-manager">
		<view class="cm-header">
			<text class="cm-title">✅ 检查清单</text>
			<text class="cm-progress">{{ checkedCount }}/{{ items.length }}</text>
		</view>
		<view class="cm-progress-bar">
			<view class="cm-progress-fill" :style="{ width: progressPct + '%' }"></view>
		</view>
		<view class="cm-list">
			<view v-for="(item, i) in items" :key="i" class="cm-item" :class="{ checked: item.checked }" @tap="toggle(i)">
				<view class="cm-checkbox" :class="{ checked: item.checked }">
					<text v-if="item.checked" class="cm-check-icon">✓</text>
				</view>
				<view class="cm-item-content">
					<text class="cm-item-text" :class="{ checked: item.checked }">{{ item.text }}</text>
					<text v-if="item.required" class="cm-required">必查</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ taskId: { type: Number, required: true } })
const emit  = defineEmits(['progress'])
const items = ref([
	// ── 必查项（广西边境执法标准流程）──
	{ text: '核实涉案人员身份（查验证件、比对系统）', required: true,  checked: false },
	{ text: '车辆暗格全面搜查（底盘/夹层/油箱区）',   required: true,  checked: false },
	{ text: '活体活样清点记录（物种/数量/状态）',       required: true,  checked: false },
	{ text: '野生动物检验检疫证明核验（CITES/国内）',   required: true,  checked: false },
	{ text: '拍照取证（含界碑坐标水印）',               required: true,  checked: false },
	// ── 选查项（视现场情况执行）──
	{ text: '询问走私链条上下游信息',                   required: false, checked: false },
	{ text: '查验运输委托书与货运单据',                 required: false, checked: false },
	{ text: '联络热眼擒枭项目指挥中心通报情况',         required: false, checked: false },
	{ text: '填写《广西边境活物走私执法处置记录表》',   required: false, checked: false },
	{ text: '告知当事人处理意见及申诉权利',             required: false, checked: false },
])
const checkedCount = computed(() => items.value.filter(i => i.checked).length)
const progressPct  = computed(() => Math.round(checkedCount.value / items.value.length * 100))
function toggle(index) {
	items.value[index].checked = !items.value[index].checked
	uni.vibrateShort()
	emit('progress', progressPct.value)
}
</script>

<style lang="scss" scoped>
.checklist-manager { background:rgba(26,31,46,.95); border-radius:20rpx; padding:32rpx; margin-bottom:24rpx; }
.cm-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20rpx; }
.cm-title    { font-size:32rpx; font-weight:700; color:#fff; }
.cm-progress { font-size:28rpx; font-weight:700; color:#00d4ff; font-family:'Courier New',monospace; }
.cm-progress-bar  { height:8rpx; background:rgba(255,255,255,.1); border-radius:4rpx; overflow:hidden; margin-bottom:32rpx; }
.cm-progress-fill { height:100%; background:linear-gradient(90deg,#00d4ff,#73D13D); border-radius:4rpx; transition:width .3s ease; }
.cm-list { display:flex; flex-direction:column; gap:16rpx; }
.cm-item { display:flex; align-items:center; gap:20rpx; padding:24rpx; background:rgba(255,255,255,.05); border-radius:16rpx; border:1px solid rgba(255,255,255,.08); transition:all .2s;
	&.checked { background:rgba(115,209,61,.08); border-color:rgba(115,209,61,.3); }
}
.cm-checkbox { width:48rpx; height:48rpx; border-radius:50%; border:3px solid rgba(255,255,255,.3); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s;
	&.checked { background:#73D13D; border-color:#73D13D; }
}
.cm-check-icon { font-size:28rpx; color:#fff; font-weight:700; }
.cm-item-content { flex:1; display:flex; align-items:center; justify-content:space-between; gap:12rpx; }
.cm-item-text { font-size:28rpx; color:#fff; flex:1;
	&.checked { color:#595959; text-decoration:line-through; }
}
.cm-required { font-size:18rpx; color:#FF4D4F; background:rgba(255,77,79,.15); padding:4rpx 12rpx; border-radius:8rpx; border:1px solid rgba(255,77,79,.3); flex-shrink:0; }
</style>
