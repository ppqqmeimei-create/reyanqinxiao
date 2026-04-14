<template>
	<view class="duty-stats data-card">
		<view class="card-title"><text>勤务战果看板</text></view>

		<!-- 核心指标 -->
		<view class="stats-grid">
			<view class="stat-item">
				<text class="stat-value monospace-text glow-text danger">{{ stats.interceptCount }}</text>
				<text class="stat-label">走私案件处置</text>
				<text class="stat-unit">件</text>
			</view>
			<view class="stat-item">
				<text class="stat-value monospace-text glow-text success">{{ stats.patrolDistance }}</text>
				<text class="stat-label">巡逻里程</text>
				<text class="stat-unit">km</text>
			</view>
			<view class="stat-item">
				<text class="stat-value monospace-text glow-text warning">{{ stats.alertContribution }}</text>
				<text class="stat-label">查获活体</text>
				<text class="stat-unit">只</text>
			</view>
			<view class="stat-item">
				<text class="stat-value monospace-text glow-text" style="color:#b37feb">{{ stats.workDays }}</text>
				<text class="stat-label">出勤天数</text>
				<text class="stat-unit">天</text>
			</view>
		</view>

		<!-- 勋章墙 -->
		<view class="inset-divider"></view>
		<view class="medals-section">
			<view class="section-header">
				<text class="section-title">荣誉勋章</text>
				<text class="section-subtitle">{{ earnedMedalsCount }}/{{ MEDAL_DEFS.length }}</text>
			</view>
			<view class="medals-grid">
				<view
					v-for="medal in computedMedals" :key="medal.id"
					class="medal-item"
					:class="{ earned: medal.earned, locked: !medal.earned }"
					@tap="onMedalTap(medal)"
				>
					<view class="medal-icon-wrapper">
						<text class="medal-emoji">{{ medal.earned ? medal.icon : '🔒' }}</text>
						<view v-if="medal.earned" class="medal-glow"></view>
					</view>
					<text class="medal-name">{{ medal.name }}</text>
					<text class="medal-unlock-hint" v-if="!medal.earned">{{ medal.unlockHint }}</text>
				</view>
			</view>
		</view>

		<!-- 勋章解锁提示弹窗 -->
		<view v-if="selectedMedal" class="medal-unlock-overlay" @tap="selectedMedal = null">
			<view class="medal-unlock-card" @tap.stop>
				<view class="unlock-card-header">
					<text class="unlock-medal-icon">{{ selectedMedal.icon }}</text>
					<text class="unlock-medal-name">{{ selectedMedal.name }}</text>
				</view>
				<view class="unlock-card-body">
					<text class="unlock-desc" v-if="selectedMedal.earned">{{ selectedMedal.desc }}</text>
					<view class="unlock-progress" v-else>
						<text class="progress-label">解锁进度</text>
						<view class="progress-bar"><view class="progress-fill" :style="{ width: selectedMedal.progress + '%' }"></view></view>
						<text class="progress-text">{{ selectedMedal.current }}/{{ selectedMedal.threshold }}</text>
					</view>
				</view>
				<view class="unlock-card-footer">
					<text class="unlock-tip">{{ selectedMedal.earned ? '已获得此勋章' : selectedMedal.unlockHint }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
	stats:       { type: Object, required: true },
	medals:      { type: Array,  default: () => [] }
})

const selectedMedal = ref(null)

// 勋章定义：基于实际战果数据动态计算
const MEDAL_DEFS = [
	{ id: 1, name: '环食药缉私先锋', icon: '🦅', desc: '在打击野生动物走私犯罪行动中表现卓越',   threshold: 1, key: 'interceptCount' },
	{ id: 2, name: '边境卫士',      icon: '🛡️', desc: '长期坚守边境一线，核查联勤超过20次',      threshold: 20, key: 'checkpointCount' },
	{ id: 3, name: '野生动物守护者', icon: '🦉', desc: '查获野生动物活体超过10只，保护生物多样性', threshold: 10, key: 'alertContribution' },
	{ id: 4, name: '优秀执法员',    icon: '🔍', desc: '累计出勤天数达到30天，工作勤勉',           threshold: 30, key: 'workDays' },
	{ id: 5, name: '生态守护者',    icon: '🌿', desc: '环境监测达标率长期保持100%，生态保护贡献突出', threshold: 100, key: 'envPassRate' },
	{ id: 6, name: '镇守边关·广西生态卫士', icon: '🏯', desc: '集生态警务执法之大成，综合战果累累', threshold: 5, key: 'jointOpsCount' },
]

const MEDAL_HINTS = {
	interceptCount:  '处置走私案件即可解锁',
	checkpointCount: '联勤核查满20次即可解锁',
	alertContribution:'查获活体满10只即可解锁',
	workDays:         '出勤满30天即可解锁',
	envPassRate:      '环境达标率保持100%即可解锁',
	jointOpsCount:    '联合执法满5次即可解锁',
}

const computedMedals = computed(() => {
	return MEDAL_DEFS.map(def => {
		const val = props.stats[def.key] ?? 0
		let earned = false
		let progress = 0
		if (def.key === 'envPassRate') {
			earned = val >= def.threshold
			progress = Math.min(100, Math.round((val / def.threshold) * 100))
		} else if (def.key === 'jointOpsCount') {
			earned = val >= def.threshold
			progress = Math.min(100, Math.round((val / def.threshold) * 100))
		} else {
			earned = val >= def.threshold
			progress = Math.min(100, Math.round((val / def.threshold) * 100))
		}
		return { ...def, earned, unlockHint: MEDAL_HINTS[def.key], current: val, progress }
	})
})

const earnedMedalsCount = computed(() => computedMedals.value.filter(m => m.earned).length)

function onMedalTap(medal) { selectedMedal.value = medal }
</script>

<style lang="scss" scoped>
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20rpx; margin-bottom: 32rpx }
.stat-item { display: flex; flex-direction: column; align-items: center; padding: 28rpx 16rpx; background: rgba(255,255,255,.05); border-radius: 16rpx; border: 1px solid rgba(255,255,255,.1); position: relative; overflow: hidden;
	&::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3rpx; background: linear-gradient(90deg, transparent, rgba(0,212,255,.5), transparent); }
}
.stat-value { font-size: 52rpx; font-weight: 700; line-height: 1; margin-bottom: 10rpx }
.stat-label { font-size: 22rpx; color: #8c8c8c; margin-bottom: 4rpx }
.stat-unit  { font-size: 18rpx; color: #595959 }

/* ── 勋章墙 ── */
.medals-section { margin-bottom: 32rpx }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx }
.section-title  { font-size: 28rpx; font-weight: 600; color: #fff }
.section-subtitle { font-size: 24rpx; color: #8c8c8c }
.medals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20rpx }
.medal-item { display: flex; flex-direction: column; align-items: center; gap: 10rpx; padding: 24rpx 12rpx; background: rgba(255,255,255,.05); border-radius: 16rpx; border: 1px solid rgba(255,255,255,.1);
	&.earned { border-color: rgba(0,212,255,.5); background: rgba(0,212,255,.1); animation: medalEarned 2s ease-in-out infinite }
	&.locked  { opacity: .4 }
	&:active { transform: scale(.95) }
}
@keyframes medalEarned { 0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,.3)} 50%{box-shadow:0 0 0 12rpx rgba(0,212,255,0)} }
.medal-icon-wrapper { position: relative; width: 80rpx; height: 80rpx; display: flex; align-items: center; justify-content: center }
.medal-emoji { font-size: 60rpx; position: relative; z-index: 1 }
.medal-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 100rpx; height: 100rpx; background: radial-gradient(circle, rgba(0,212,255,.4) 0%, transparent 70%); animation: medalGlow 2s ease-in-out infinite }
@keyframes medalGlow { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.6} 50%{transform:translate(-50%,-50%) scale(1.2);opacity:1} }
.medal-name { font-size: 20rpx; color: #fff; text-align: center }
.medal-unlock-hint { font-size: 16rpx; color: #595959; text-align: center }

/* ── 勋章解锁弹窗 ── */
.medal-unlock-overlay { position: fixed; inset: 0; z-index: 999; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10rpx) }
.medal-unlock-card { width: 580rpx; background: rgba(16,27,50,.98); border-radius: 28rpx; border: 1.5rpx solid rgba(0,212,255,.4); padding: 40rpx 36rpx; box-shadow: 0 0 40rpx rgba(0,212,255,.2) }
.unlock-card-header { display: flex; flex-direction: column; align-items: center; gap: 16rpx; margin-bottom: 32rpx }
.unlock-medal-icon { font-size: 80rpx }
.unlock-medal-name { font-size: 32rpx; font-weight: 700; color: #fff; text-align: center }
.unlock-card-body { margin-bottom: 28rpx }
.unlock-desc { font-size: 26rpx; color: rgba(255,255,255,.8); text-align: center; line-height: 1.6 }
.unlock-progress { display: flex; flex-direction: column; gap: 12rpx; align-items: center }
.progress-label { font-size: 24rpx; color: #8c8c8c }
.progress-bar { width: 100%; height: 12rpx; background: rgba(255,255,255,.1); border-radius: 6rpx; overflow: hidden }
.progress-fill { height: 100%; background: linear-gradient(90deg, #00D4FF, #73D13D); border-radius: 6rpx; transition: width .4s }
.progress-text { font-size: 28rpx; font-weight: 700; color: #00D4FF; font-family: 'Courier New',monospace }
.unlock-card-footer { border-top: 1rpx solid rgba(255,255,255,.1); padding-top: 20rpx; display: flex; justify-content: center }
.unlock-tip { font-size: 22rpx; color: #8c8c8c; text-align: center }

/* ── 通用 ── */
.inset-divider { height: 1px; background: transparent; box-shadow: inset 0 1px 2px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.05); margin: 28rpx 0 }
.progress-bar { width: 100%; height: 12rpx; background: rgba(255,255,255,.1); border-radius: 6rpx; overflow: hidden }
.progress-fill { height: 100%; background: linear-gradient(90deg, #00D4FF, #73D13D); border-radius: 6rpx; transition: width .4s }
</style>
