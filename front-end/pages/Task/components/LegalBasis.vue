<template>
	<view class="legal-basis">
		<view class="lb-header">
			<text class="lb-title">⚖️ 执法依据</text>
			<view class="lb-badge"><text class="lb-badge-txt">{{ laws.length }} 条法规</text></view>
		</view>
		<view class="lb-list">
			<view v-for="(law, i) in laws" :key="i" class="lb-item" @tap="toggleExpand(i)">
				<view class="lb-item-header">
					<view class="lb-level" :class="law.level"><text class="lb-level-txt">{{ law.levelText }}</text></view>
					<text class="lb-law-name">{{ law.name }}{{ law.article }}</text>
					<text class="lb-expand-icon">{{ law.expanded ? '▲' : '▼' }}</text>
				</view>
				<view v-if="law.expanded" class="lb-detail">
					<text class="lb-content">{{ law.content }}</text>
					<view class="lb-penalty">
						<text class="lb-penalty-label">建议处罚：</text>
						<text class="lb-penalty-txt">{{ law.penalty }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
	violationType: { type: String, default: 'water-pollution' },
	exceedRatio:   { type: Number, default: 1.0 }
})
const laws = ref([
	{ name:'《野生动物保护法》',             article:'第二十三条',     level:'critical', levelText:'强制', content:'禁止出售、购买、利用国家重点保护野生动物及其制品。违反本条规定的，由县级以上人民政府野生动物保护主管部门没收野生动物及其制品和违法所得，并处野生动物及其制品价值二倍以上十倍以下的罚款。', penalty:'没收违法所得 + 罚款2-10倍价值', expanded: true },
	{ name:'《濒危野生动植物种国际贸易公约》', article:'CITES附录I/II', level:'critical', levelText:'强制', content:'列入CITES附录I的物种禁止一切商业性国际贸易；附录II物种须持有出口国许可证方可贸易。未经许可跨境运输属严重违法行为。', penalty:'扣押货物 + 吊销许可 + 刑事追究', expanded: false },
	{ name:'《刑法》',                         article:'第三百四十一条',  level:'critical', levelText:'刑事', content:'非法猎捕、杀害国家重点保护的珍贵、濒危野生动物的，或者非法收购、运输、出售国家重点保护的珍贵、濒危野生动物及其制品的，处五年以下有期徒刑或者拘役，并处罚金。情节严重的，处五年以上十年以下有期徒刑，并处罚金。', penalty:'5年以下有期徒刑；情节严重5-10年', expanded: false },
	{ name:'《广西壮族自治区野生动物保护条例》', article:'第三十五条',    level:'warning',  levelText:'地方', content:'违反本条例规定，非法猎捕、杀害野生动物的，由县级以上人民政府野生动物保护主管部门没收猎获物、猎捕工具和违法所得，吊销特许猎捕证，并处猎获物价值一倍以上五倍以下的罚款。', penalty:'没收猎获物 + 吊销证件 + 罚款1-5倍', expanded: false },
	{ name:'《海关法》',                       article:'第八十二条',     level:'info',     levelText:'适用', content:'违反本法规定，逃避海关监管，非法运输、携带、邮寄国家禁止进出境的野生动物及其制品进出境的，由海关没收走私货物、物品和违法所得，可以并处罚款。', penalty:'没收走私物品 + 罚款 + 移交公安', expanded: false },
])
function toggleExpand(i) { laws.value[i].expanded = !laws.value[i].expanded; uni.vibrateShort() }
</script>

<style lang="scss" scoped>
.legal-basis { background:rgba(26,31,46,.95); border-radius:20rpx; padding:32rpx; margin-bottom:24rpx; }
.lb-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:28rpx; }
.lb-title { font-size:32rpx; font-weight:700; color:#fff; }
.lb-badge { background:rgba(0,212,255,.15); border:1px solid rgba(0,212,255,.3); border-radius:20rpx; padding:8rpx 20rpx; }
.lb-badge-txt { font-size:22rpx; color:#00d4ff; }
.lb-list { display:flex; flex-direction:column; gap:16rpx; }
.lb-item { background:rgba(255,255,255,.05); border-radius:16rpx; border:1px solid rgba(255,255,255,.1); overflow:hidden; }
.lb-item-header { display:flex; align-items:center; gap:16rpx; padding:24rpx; }
.lb-level { padding:6rpx 16rpx; border-radius:10rpx;
	&.critical { background:rgba(255,77,79,.15); border:1px solid rgba(255,77,79,.3); }
	&.warning  { background:rgba(255,169,64,.15); border:1px solid rgba(255,169,64,.3); }
	&.info     { background:rgba(0,212,255,.15);  border:1px solid rgba(0,212,255,.3); }
}
.lb-level-txt { font-size:20rpx; font-weight:700;
	.critical & { color:#FF4D4F; }
	.warning  & { color:#FFA940; }
	.info     & { color:#00d4ff; }
}
.lb-law-name    { flex:1; font-size:26rpx; color:#fff; font-weight:600; }
.lb-expand-icon { font-size:20rpx; color:#8c8c8c; }
.lb-detail  { padding:0 24rpx 24rpx; border-top:1px solid rgba(255,255,255,.08); }
.lb-content { font-size:24rpx; color:#8c8c8c; line-height:1.6; display:block; margin:16rpx 0; }
.lb-penalty { display:flex; align-items:flex-start; gap:12rpx; background:rgba(255,169,64,.08); border:1px solid rgba(255,169,64,.2); border-radius:12rpx; padding:16rpx 20rpx; }
.lb-penalty-label { font-size:22rpx; color:#FFA940; flex-shrink:0; }
.lb-penalty-txt   { font-size:22rpx; color:#fff; flex:1; }
</style>
