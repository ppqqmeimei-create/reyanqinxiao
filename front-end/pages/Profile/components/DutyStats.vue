<template>
	<view class="duty-stats data-card">
		<view class="card-title"><text>勤务战果看板</text></view>

		<!-- 核心指标 -->
		<view class="stats-grid">
			<view class="stat-item">
				<text class="stat-value monospace-text glow-text primary">{{ stats.interceptCount }}</text>
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
				<text class="section-subtitle">{{ earnedMedalsCount }}/{{ medals.length }}</text>
			</view>
			<view class="medals-grid">
				<view
					v-for="medal in medals" :key="medal.id"
					class="medal-item"
					:class="{ earned: medal.earned, locked: !medal.earned }"
				>
					<view class="medal-icon-wrapper">
						<text class="medal-emoji">{{ getMedalEmoji(medal.id) }}</text>
						<view v-if="medal.earned" class="medal-glow"></view>
					</view>
					<text class="medal-name">{{ medal.name }}</text>
				</view>
			</view>
		</view>


	</view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	stats:       { type: Object, required: true },
	medals:      { type: Array,  default: () => [] },
	coverageMap: { type: Object, default: () => ({ coverage: 0, hotspots: [] }) }
})

// 已获得勋章数
const earnedMedalsCount = computed(() => props.medals.filter(m => m.earned).length)



const MEDAL_EMOJIS = { 1: '🦅', 2: '🛡️', 3: '🦉', 4: '🔍', 5: '🌿', 6: '🏯' }
function getMedalEmoji(id) { return MEDAL_EMOJIS[id] || '🏅' }
</script>

<style lang="scss" scoped>
.stats-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20rpx; margin-bottom:32rpx; }
.stat-item { display:flex; flex-direction:column; align-items:center; padding:28rpx 16rpx; background:rgba(255,255,255,.05); border-radius:16rpx; border:1px solid rgba(255,255,255,.1); position:relative; overflow:hidden; }
.stat-value { font-size:52rpx; font-weight:700; line-height:1; margin-bottom:10rpx; }
.stat-label { font-size:22rpx; color:#8c8c8c; margin-bottom:4rpx; }
.stat-unit  { font-size:18rpx; color:#595959; }

.medals-section { margin-bottom:32rpx; }
.section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24rpx; }
.section-title  { font-size:28rpx; font-weight:600; color:#fff; }
.section-subtitle { font-size:24rpx; color:#8c8c8c; }
.medals-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20rpx; }
.medal-item { display:flex; flex-direction:column; align-items:center; gap:12rpx; padding:24rpx; background:rgba(255,255,255,.05); border-radius:16rpx; border:1px solid rgba(255,255,255,.1);
	&.earned { border-color:rgba(0,212,255,.5); background:rgba(0,212,255,.1); }
	&.locked  { opacity:.4; }
}
.medal-icon-wrapper { position:relative; width:80rpx; height:80rpx; display:flex; align-items:center; justify-content:center; }
.medal-emoji { font-size:60rpx; position:relative; z-index:1; }
.medal-glow { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100rpx; height:100rpx; background:radial-gradient(circle,rgba(0,212,255,.4) 0%,transparent 70%); animation:medalGlow 2s ease-in-out infinite; }
@keyframes medalGlow { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.6} 50%{transform:translate(-50%,-50%) scale(1.2);opacity:1} }
.medal-name { font-size:20rpx; color:#fff; text-align:center; }


</style>
