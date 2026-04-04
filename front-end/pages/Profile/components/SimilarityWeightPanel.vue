<template>
	<view class="weight-panel data-card">
		<view class="card-title"><text>相似案件权重管理</text></view>

		<view v-if="forbidden" class="state-tip">当前账号无权访问该配置</view>
		<view v-else>
			<view class="state-tip" v-if="loading">加载中...</view>
			<view class="sliders" v-else>
				<view class="slider-row" v-for="item in items" :key="item.key">
					<view class="row-head">
						<text class="row-label">{{ item.label }}</text>
						<text class="row-value">{{ form[item.key] }}</text>
					</view>
					<slider
						:min="0"
						:max="100"
						:step="1"
						:value="form[item.key]"
						:activeColor="item.color"
						backgroundColor="rgba(255,255,255,0.12)"
						block-size="18"
						@change="(e) => onSlide(item.key, e.detail.value)"
					/>
				</view>
			</view>

			<view class="save-btn" :class="{ disabled: saving }" @tap="saveWeights">
				<text class="save-text">{{ saving ? '保存中...' : '保存权重' }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { alertAPI } from '../../../utils/request'

const loading = ref(true)
const saving = ref(false)
const forbidden = ref(false)

const items = [
	{ key: 'type', label: '类型匹配', color: '#00d4ff' },
	{ key: 'level', label: '等级匹配', color: '#73D13D' },
	{ key: 'category', label: '类别匹配', color: '#FFA940' },
	{ key: 'location', label: '地理接近', color: '#40a9ff' },
	{ key: 'risk', label: '风险接近', color: '#FF7875' }
]

const form = ref({
	type: 25,
	level: 20,
	category: 10,
	location: 35,
	risk: 10
})

function onSlide(key, value) {
	form.value[key] = value
}

async function loadWeights() {
	loading.value = true
	forbidden.value = false
	try {
		const res = await alertAPI.getSimilarityWeights()
		form.value = { ...form.value, ...(res?.data?.weights || {}) }
	} catch (error) {
		if (String(error?.message || '').includes('403')) {
			forbidden.value = true
		} else {
			uni.showToast({ title: '权重加载失败', icon: 'none' })
		}
	} finally {
		loading.value = false
	}
}

async function saveWeights() {
	if (saving.value || forbidden.value) return
	saving.value = true
	try {
		await alertAPI.updateSimilarityWeights(form.value)
		uni.showToast({ title: '权重已更新', icon: 'success' })
	} catch (error) {
		uni.showToast({ title: '保存失败', icon: 'none' })
	} finally {
		saving.value = false
	}
}

onMounted(() => {
	loadWeights()
})
</script>

<style lang="scss" scoped>
.weight-panel { margin-bottom: 24rpx; }
.state-tip { font-size: 24rpx; color: #8c8c8c; padding: 20rpx 0; }
.sliders { display: flex; flex-direction: column; gap: 18rpx; }
.slider-row { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14rpx; padding: 16rpx; }
.row-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8rpx; }
.row-label { font-size: 24rpx; color: #d9f7ff; }
.row-value { font-size: 24rpx; color: #fff; font-family: 'Courier New', monospace; }
.save-btn { margin-top: 20rpx; height: 84rpx; border-radius: 14rpx; background: linear-gradient(135deg,#00d4ff 0%,#00f2fe 100%); display: flex; align-items: center; justify-content: center; }
.save-btn.disabled { opacity: 0.7; }
.save-text { font-size: 28rpx; font-weight: 700; color: var(--bg-root); }
</style>
