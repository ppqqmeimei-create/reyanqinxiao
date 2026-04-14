<template>
	<view class="map-package-item" :class="'status-' + pkg.status">
		<view class="package-info">
			<view class="package-header">
				<view class="package-details">
					<text class="package-name">{{ pkg.name }}</text>
					<text class="package-size">{{ pkg.size }}MB</text>
				</view>
			</view>
			<text class="update-time">{{ formatUpdateTime(pkg.updateTime) }}</text>
		</view>
		<view class="package-actions">
			<view v-if="pkg.status === 'downloaded'" class="action-group">
				<view class="status-badge downloaded"><text class="badge-text">已下载</text></view>
				<view class="action-btn delete" @tap="emit('delete', pkg)"><text class="btn-text">删除</text></view>
			</view>
			<view v-else-if="pkg.status === 'downloading'" class="downloading-progress">
				<view class="progress-bar"><view class="progress-fill" :style="{ width: pkg.progress + '%' }"></view></view>
				<text class="progress-text">{{ pkg.progress }}%</text>
			</view>
			<view v-else class="action-btn download" @tap="emit('download', pkg)"><text class="btn-text">下载</text></view>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({ pkg: { type: Object, required: true } })
const emit = defineEmits(['download', 'delete'])

function formatUpdateTime(time) {
	const diff = Math.floor((Date.now() - new Date(time)) / 1000)
	if (diff < 86400)          return '今天'
	if (diff < 86400 * 7)     return Math.floor(diff / 86400) + '天前'
	if (diff < 86400 * 30)    return Math.floor(diff / 86400 / 7) + '周前'
	return Math.floor(diff / 86400 / 30) + '月前'
}
</script>

<style lang="scss" scoped>
.map-package-item { background:rgba(26,31,46,.95); border-radius:20rpx; border:1px solid rgba(255,255,255,.05); padding:24rpx; display:flex; align-items:center; justify-content:space-between; gap:20rpx; margin-bottom:16rpx; transition:border-color .2s; }
.map-package-item.status-downloading { border-color:rgba(255,169,64,.3); background:rgba(255,169,64,.05); }
.map-package-item.status-downloaded  { border-color:rgba(115,209,61,.15); }
.package-info { flex:1; display:flex; flex-direction:column; gap:12rpx; }
.package-header { display:flex; align-items:center; gap:16rpx; }
.package-details { flex:1; display:flex; flex-direction:column; gap:6rpx; }
.package-name { font-size:28rpx; font-weight:600; color:#fff; }
.package-size { font-size:22rpx; color:#8c8c8c; font-family:'Courier New',monospace; }
.update-time { font-size:20rpx; color:#595959; }
.package-actions { flex-shrink:0; }
.action-group { display:flex; align-items:center; gap:12rpx; }
.status-badge.downloaded { padding:8rpx 16rpx; border-radius:16rpx; background:rgba(115,209,61,.15); border:1px solid rgba(115,209,61,.3); }
.badge-text { font-size:22rpx; font-weight:600; color:#73D13D; }
.action-btn { display:flex; align-items:center; gap:8rpx; padding:12rpx 20rpx; border-radius:16rpx; }
.action-btn.download { background:linear-gradient(135deg,#00A8D6,#007EA8); }
.action-btn.delete   { background:rgba(255,77,79,.15); border:1px solid rgba(255,77,79,.3); }
.btn-text { font-size:24rpx; font-weight:600; color:#fff; }
.downloading-progress { display:flex; flex-direction:column; align-items:flex-end; gap:8rpx; min-width:120rpx; }
.progress-bar { width:120rpx; height:8rpx; background:rgba(255,255,255,.1); border-radius:4rpx; overflow:hidden; }
.progress-fill { height:100%; background:linear-gradient(90deg,#FFA940,#ffc069); transition:width .2s ease; }
.progress-text { font-size:22rpx; font-weight:700; color:#FFA940; font-family:'Courier New',monospace; }
</style>
