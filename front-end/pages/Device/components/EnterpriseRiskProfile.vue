<template>
	<view class="risk-container">
		<view class="header">
			<view class="info">
				<text class="name">{{ ent.name }}</text>
				<text class="type">{{ ent.type }}</text>
			</view>
			<view class="badge" :class="'r-' + getLevel()">
				<text class="val">{{ ent.score }}</text>
				<text class="lbl">风险分</text>
			</view>
		</view>

		<view class="level-card" :class="'l-' + getLevel()">
			<text class="icon">{{ getIcon() }}</text>
			<view class="detail">
				<text class="name">{{ getLevelName() }}</text>
				<text class="desc">{{ getDesc() }}</text>
			</view>
		</view>

		<view class="freq-card">
			<text class="label">建议巡检频率</text>
			<text class="value">{{ getFreq() }}</text>
		</view>

		<view class="breakdown">
			<text class="title">风险构成分析</text>
			<view class="item">
				<view class="h">
					<text class="l">违规风险</text>
					<text class="s">{{ ent.vScore }}/40</text>
				</view>
				<view class="bar"><view class="fill" :style="{ width: (ent.vScore / 40 * 100) + '%', background: '#ef4444' }"></view></view>
			</view>
			<view class="item">
				<view class="h">
					<text class="l">合规完成率</text>
					<text class="s">{{ ent.comp }}%</text>
				</view>
				<view class="bar"><view class="fill" :style="{ width: ent.comp + '%', background: '#10b981' }"></view></view>
			</view>
			<view class="item">
				<view class="h">
					<text class="l">整改次数</text>
					<text class="s">{{ ent.comp2 }}/10</text>
				</view>
				<view class="bar"><view class="fill" :style="{ width: (ent.comp2 / 10 * 100) + '%', background: '#f59e0b' }"></view></view>
			</view>
			<view class="item">
				<view class="h">
					<text class="l">行业敏感度</text>
					<text class="s">{{ ent.ind }}/10</text>
				</view>
				<view class="bar"><view class="fill" :style="{ width: (ent.ind / 10 * 100) + '%', background: '#8b5cf6' }"></view></view>
			</view>
		</view>

		<view class="data-grid">
			<text class="title">监管数据概览</text>
			<view class="grid">
				<view class="item"><text class="l">检查次数</text><text class="v">{{ ent.insp }}</text></view>
				<view class="item"><text class="l">违规记录</text><text class="v">{{ ent.viol }}</text></view>
				<view class="item"><text class="l">整改任务</text><text class="v">{{ ent.comp2 }}</text></view>
				<view class="item"><text class="l">已闭环</text><text class="v">{{ ent.rect }}</text></view>
			</view>
		</view>

		<view class="issues">
			<text class="title">近期问题事件</text>
			<view v-for="(issue, i) in ent.issues" :key="i" class="issue">
				<view class="h">
					<text class="d">{{ issue.date }}</text>
					<text class="t" :class="'st-' + issue.sev">{{ issue.sev === 'c' ? '严重' : '较高' }}</text>
				</view>
				<text class="desc">{{ issue.desc }}</text>
			</view>
		</view>

		<view class="trend">
			<text class="title">风险趋势研判</text>
			<view class="card">
				<text class="text">{{ getTrend() }}</text>
				<view class="ind" :class="'t-' + getTrendDir()">
					<text class="icon">{{ getTrendIcon() }}</text>
					<text class="val">{{ getTrendVal() }}</text>
				</view>
			</view>
		</view>

		<view class="recs">
			<text class="title">处置建议</text>
			<view v-for="(rec, i) in getRecs()" :key="i" class="rec">
				<text class="icon">{{ rec.icon }}</text>
				<text class="text">{{ rec.text }}</text>
			</view>
		</view>

		<view class="btns">
			<button class="btn-1" @tap="createTask">创建检查任务</button>
			<button class="btn-2" @tap="viewReport">查看完整报告</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'

const ent = ref({
	name: '凭祥重点货运企业',
	type: '冷链仓储 / 边贸运输',
	score: 75,
	vScore: 25,
	comp: 75,
	comp2: 5,
	ind: 6,
	insp: 12,
	viol: 3,
	rect: 2,
	issues: [
		{ date: '2024-01-15', sev: 'c', desc: '夜间异常装卸频次偏高，存在规避巡检风险。' },
		{ date: '2024-03-20', sev: 'h', desc: '运输链路台账更新滞后，车辆去向核验存在缺口。' },
		{ date: '2024-06-10', sev: 'h', desc: '活体运输临时停靠记录异常，建议复核调度指令。' }
	]
})

function getLevel() {
	const s = ent.value.score
	if (s >= 80) return 'c'
	if (s >= 60) return 'h'
	if (s >= 40) return 'm'
	return 'l'
}

function getIcon() {
	const l = getLevel()
	if (l === 'c') return '🔴'
	if (l === 'h') return '🟠'
	if (l === 'm') return '🟡'
	return '🟢'
}

function getLevelName() {
	const l = getLevel()
	if (l === 'c') return '高风险主体'
	if (l === 'h') return '重点关注主体'
	if (l === 'm') return '常规监管主体'
	return '低风险主体'
}

function getDesc() {
	const l = getLevel()
	if (l === 'c') return '需立即纳入重点盯防，安排联勤力量复核。'
	if (l === 'h') return '建议提高巡检频次，并补齐关键台账。'
	if (l === 'm') return '整体可控，建议保持常态化复查。'
	return '当前风险较低，按计划巡检即可。'
}

function getFreq() {
	const l = getLevel()
	if (l === 'c') return '每日巡检'
	if (l === 'h') return '每周两次'
	if (l === 'm') return '每周一次'
	return '每月一次'
}

function getTrend() {
	if (ent.value.viol > 2) return '近期违规记录偏多，风险有持续走高迹象。'
	if (ent.value.viol > 0) return '风险波动可控，但仍需关注运输链路异常。'
	return '近期风险平稳，未发现明显新增异常。'
}

function getTrendDir() {
	if (ent.value.viol > 2) return 'd'
	if (ent.value.viol > 0) return 's'
	return 'u'
}

function getTrendIcon() {
	const d = getTrendDir()
	if (d === 'd') return '↗'
	if (d === 's') return '→'
	return '↘'
}

function getTrendVal() {
	const d = getTrendDir()
	if (d === 'd') return '风险上升'
	if (d === 's') return '波动持平'
	return '风险下降'
}

function getRecs() {
	const l = getLevel()
	const recs = []
	if (l === 'c') {
		recs.push({ icon: '①', text: '立即下发联合核查任务，复核仓储与装卸记录。' })
		recs.push({ icon: '②', text: '对高风险车辆和装卸口开展视频回溯。' })
		recs.push({ icon: '③', text: '同步边检、缉私和属地执法单位联动处置。' })
	} else if (l === 'h') {
		recs.push({ icon: '①', text: '提高现场巡检频率，补查缺失台账。' })
		recs.push({ icon: '②', text: '对近期异常运输节点做重点抽查。' })
		recs.push({ icon: '③', text: '督促企业限期完成整改闭环。' })
	} else if (l === 'm') {
		recs.push({ icon: '①', text: '保持常态巡检，关注夜间异常活动。' })
		recs.push({ icon: '②', text: '抽查车辆与货物台账一致性。' })
		recs.push({ icon: '③', text: '持续跟踪整改任务执行进度。' })
	} else {
		recs.push({ icon: '①', text: '按照月度计划开展例行巡检。' })
		recs.push({ icon: '②', text: '保留基础台账审计与视频留存。' })
		recs.push({ icon: '③', text: '继续维持当前风险防控措施。' })
	}
	return recs
}

function createTask() {
	uni.showToast({ title: '正在创建任务...', icon: 'loading' })
	setTimeout(() => uni.showToast({ title: '检查任务已创建', icon: 'success' }), 1500)
}

function viewReport() {
	uni.showToast({ title: '正在打开报告...', icon: 'loading' })
	setTimeout(() => uni.showToast({ title: '报告已打开', icon: 'success' }), 1500)
}
</script>

<style lang="scss" scoped>
.risk-container { padding: 20rpx; background: #0f172a; min-height: 100vh; }
.header { background: linear-gradient(135deg, #00A8D6 0%, #007EA8 100%); border-radius: 16rpx; padding: 24rpx; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.info { flex: 1; }
.name { font-size: 32rpx; font-weight: bold; color: #fff; display: block; margin-bottom: 8rpx; }
.type { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.badge { width: 120rpx; height: 120rpx; border-radius: 60rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); border: 3rpx solid rgba(255,255,255,0.5); }
.r-c { background: rgba(239,68,68,0.3); border-color: #ef4444; }
.r-h { background: rgba(255,169,64,0.3); border-color: #ffa940; }
.r-m { background: rgba(250,173,20,0.3); border-color: #fac858; }
.r-l { background: rgba(16,185,129,0.3); border-color: #10b981; }
.val { font-size: 40rpx; font-weight: bold; color: #fff; }
.lbl { font-size: 20rpx; color: rgba(255,255,255,0.8); }
.level-card { background: rgba(255,255,255,0.05); border-radius: 16rpx; padding: 24rpx; display: flex; align-items: center; gap: 20rpx; margin-bottom: 16rpx; border-left: 6rpx solid #00A8D6; }
.l-c { border-left-color: #ef4444; background: rgba(239,68,68,0.1); }
.l-h { border-left-color: #ffa940; background: rgba(255,169,64,0.1); }
.l-m { border-left-color: #fac858; background: rgba(250,173,20,0.1); }
.l-l { border-left-color: #10b981; background: rgba(16,185,129,0.1); }
.icon { font-size: 48rpx; }
.detail { flex: 1; }
.detail .name { font-size: 28rpx; font-weight: bold; color: #fff; display: block; margin-bottom: 8rpx; }
.detail .desc { font-size: 22rpx; color: rgba(255,255,255,0.7); }
.freq-card { background: rgba(255,255,255,0.05); border-radius: 12rpx; padding: 16rpx; margin-bottom: 20rpx; }
.label { font-size: 24rpx; color: rgba(255,255,255,0.6); display: block; margin-bottom: 8rpx; }
.value { font-size: 28rpx; font-weight: bold; color: #10b981; }
.breakdown, .data-grid, .issues, .recs { margin-bottom: 20rpx; }
.title { font-size: 28rpx; font-weight: bold; color: #fff; display: block; margin-bottom: 16rpx; }
.item { background: rgba(255,255,255,0.05); border-radius: 12rpx; padding: 16rpx; margin-bottom: 12rpx; }
.h { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.l { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.s { font-size: 24rpx; color: #fff; font-weight: bold; }
.bar { height: 8rpx; background: rgba(255,255,255,0.1); border-radius: 4rpx; overflow: hidden; }
.fill { height: 100%; transition: width 0.3s; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; }
.grid .item { background: rgba(255,255,255,0.05); border-radius: 12rpx; padding: 20rpx; text-align: center; }
.grid .l { font-size: 22rpx; color: rgba(255,255,255,0.6); display: block; margin-bottom: 8rpx; }
.grid .v { font-size: 36rpx; font-weight: bold; color: #10b981; }
.issue { background: rgba(255,255,255,0.05); border-radius: 12rpx; padding: 16rpx; border-left: 4rpx solid #00A8D6; margin-bottom: 12rpx; }
.issue .h { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.d { font-size: 22rpx; color: rgba(255,255,255,0.6); }
.t { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; background: rgba(239,68,68,0.2); color: #ef4444; }
.st-h { background: rgba(255,169,64,0.2); color: #ffa940; }
.issue .desc { font-size: 24rpx; color: #fff; }
.trend { margin-bottom: 20rpx; }
.card { background: rgba(255,255,255,0.05); border-radius: 12rpx; padding: 24rpx; }
.text { font-size: 26rpx; color: #fff; display: block; margin-bottom: 16rpx; }
.ind { display: flex; align-items: center; gap: 12rpx; }
.ind .icon { font-size: 40rpx; }
.ind .val { font-size: 28rpx; font-weight: bold; color: #10b981; }
.t-d .val { color: #ef4444; }
.t-s .val { color: #f59e0b; }
.rec { background: rgba(255,255,255,0.05); border-radius: 12rpx; padding: 16rpx; display: flex; align-items: center; gap: 16rpx; margin-bottom: 12rpx; }
.rec .icon { font-size: 32rpx; }
.rec .text { font-size: 24rpx; color: #fff; flex: 1; }
.btns { display: flex; gap: 16rpx; margin-bottom: 40rpx; }
.btn-1, .btn-2 { flex: 1; height: 88rpx; border-radius: 12rpx; font-size: 28rpx; font-weight: bold; border: none; }
.btn-1 { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; }
.btn-2 { background: rgba(255,255,255,0.1); color: #fff; }
</style>
