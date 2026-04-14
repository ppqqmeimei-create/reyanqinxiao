<template>
	<view class="nsc-page">
		<!-- 自定义导航栏 -->
		<view class="nsc-nav">
			<view class="nsc-nav-left" @tap="onBack">
				<image class="nsc-back-ico" src="/static/icons/case-border-shield.png" mode="aspectFit"></image>
			</view>
			<text class="nsc-nav-title">活物走私线索登记</text>
			<view class="nsc-nav-right"></view>
		</view>

		<scroll-view class="nsc-scroll" scroll-y :show-scrollbar="false">
			<!-- 基本情况 -->
			<view class="nsc-card">
				<view class="nsc-sec-head">
					<image class="nsc-sec-icon-img" src="/static/icons/case-border-shield.png" mode="aspectFit"></image>
					<text class="nsc-sec-title">基本情况</text>
				</view>
				<text class="nsc-label">案事件标题</text>
				<input v-model="form.title" class="nsc-input" placeholder="如：东兴北仑河夜间活体转运 / 凭祥互市通道可疑冻柜" placeholder-class="nsc-ph" maxlength="50" />
				<text class="nsc-counter">{{ form.title.length }}/50</text>

				<text class="nsc-label">案事件类型</text>
				<view class="nsc-tags">
					<view v-for="c in caseTypes" :key="c.id" class="nsc-tag" :class="{ active: form.caseType === c.id }" @tap="form.caseType = c.id">
						<image v-if="c.iconPath" class="nsc-tag-ico" :src="c.iconPath" mode="aspectFit"></image>
						<text class="nsc-tag-txt">{{ c.label }}</text>
					</view>
				</view>

				<text class="nsc-label">紧急程度</text>
				<view class="nsc-seg">
					<view v-for="u in urgencies" :key="u.id" class="nsc-seg-item" :class="['nsc-seg-' + u.color, { active: form.urgency === u.id }]" @tap="form.urgency = u.id">
						<text>{{ u.label }}</text>
					</view>
				</view>
			</view>

			<!-- 地点信息 -->
			<view class="nsc-card">
				<view class="nsc-sec-head">
					<image class="nsc-sec-icon-img" src="/static/icons/case-location-pin.png" mode="aspectFit"></image>
					<text class="nsc-sec-title">地点信息</text>
				</view>
				<text class="nsc-label">发现地点</text>
				<view class="nsc-loc-row">
					<input v-model="form.location" class="nsc-input nsc-input-flex" placeholder="输入地点或点击定位" placeholder-class="nsc-ph" />
					<view class="nsc-loc-btn" @tap="onLocate">
						<image class="nsc-loc-btn-ico" src="/static/icons/case-location-action.png" mode="aspectFit"></image>
						<text>定位</text>
					</view>
				</view>

				<text class="nsc-label">边境县（市、区）段</text>
				<view class="nsc-chips">
					<view v-for="b in borderSections" :key="b" class="nsc-chip" :class="{ active: form.borderSection === b }" @tap="form.borderSection = b">
						<text>{{ b }}</text>
					</view>
				</view>
			</view>

			<!-- 走私活物：物种信息 -->
			<view v-if="form.caseType === 'wild_live'" class="nsc-card">
				<view class="nsc-sec-head">
					<image class="nsc-sec-icon-img" src="/static/icons/case-live-animal.png" mode="aspectFit"></image>
					<text class="nsc-sec-title">活物与涉案信息</text>
				</view>
				<text class="nsc-label">疑似走私物种</text>
				<view class="nsc-grid3">
					<view v-for="s in speciesPresets" :key="s.id" class="nsc-spec" :class="{ active: form.speciesPreset === s.id }" @tap="toggleSpecies(s.id)">
						<text class="nsc-spec-ico">{{ s.icon }}</text>
						<text class="nsc-spec-txt">{{ s.label }}</text>
					</view>
				</view>
				<input v-model="form.speciesOther" class="nsc-input" placeholder="其他物种，手动输入" placeholder-class="nsc-ph" />

				<text class="nsc-label">保护等级 / CITES 附录</text>
				<view class="nsc-tags">
					<view v-for="p in protectionLevels" :key="p.id" class="nsc-tag" :class="{ active: form.protectionLevel === p.id }" @tap="form.protectionLevel = p.id">
						<text class="nsc-tag-txt">{{ p.label }}</text>
					</view>
				</view>

				<text class="nsc-label">预估数量</text>
				<view class="nsc-step-row">
					<view class="nsc-step-btn" @tap="bumpQty(-1)"><text>−</text></view>
					<text class="nsc-step-num">{{ form.quantity }}</text>
					<view class="nsc-step-btn" @tap="bumpQty(1)"><text>+</text></view>
					<text class="nsc-step-unit">头/只</text>
				</view>
			</view>

			<!-- 线索来源 -->
			<view class="nsc-card">
				<view class="nsc-sec-head">
					<image class="nsc-sec-icon-img" src="/static/icons/case-intel-clue.png" mode="aspectFit"></image>
					<text class="nsc-sec-title">发现与线索</text>
				</view>
				<text class="nsc-label">线索类型</text>
				<view class="nsc-tags">
					<view v-for="c in clueTypes" :key="c.id" class="nsc-tag" :class="{ active: form.clueType === c.id }" @tap="form.clueType = c.id">
						<image v-if="c.iconPath" class="nsc-tag-ico" :src="c.iconPath" mode="aspectFit"></image>
						<text class="nsc-tag-txt">{{ c.label }}</text>
					</view>
				</view>

				<text class="nsc-label">简要描述</text>
				<textarea v-model="form.description" class="nsc-textarea" placeholder="时间、地点、人员交通工具、与监测/卡口/视频线索的关联等…" placeholder-class="nsc-ph" maxlength="500" />
				<text class="nsc-counter">{{ form.description.length }}/500</text>
			</view>

			<!-- 关联信息 -->
			<view class="nsc-card nsc-card-last">
				<view class="nsc-sec-head">
					<image class="nsc-sec-icon-img" src="/static/icons/case-officer-badge.png" mode="aspectFit"></image>
					<text class="nsc-sec-title">关联信息</text>
				</view>
				<text class="nsc-label">负责人警号</text>
				<input v-model="form.officerId" class="nsc-input" placeholder-class="nsc-ph" />
				<text class="nsc-label">关联预警 ID（可选）</text>
				<input v-model="form.alertId" class="nsc-input" placeholder="输入关联预警 ID（可选）" placeholder-class="nsc-ph" />
			</view>

			<view class="nsc-footer-spacer"></view>
		</scroll-view>

		<!-- 底部操作栏 -->
		<view class="nsc-footer safe-bottom">
			<text class="nsc-draft" @tap="saveDraft">暂存草稿</text>
			<view class="nsc-submit" @tap="submitCase">
				<image class="nsc-submit-ico" src="/static/icons/case-submit-ledger.png" mode="aspectFit"></image>
				<text>提交台账（演示）</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue'

const DRAFT_KEY = 'ef_case_draft_v2'

const caseTypes = [
	{ id: 'wild_live', label: '走私活物', iconPath: '/static/icons/case-type-live-smuggling.png' },
	{ id: 'cross', label: '非法入境·其他', iconPath: '/static/icons/case-type-border-cross.png' }
]

const urgencies = [
	{ id: 'urgent',  label: '紧急', color: 'red' },
	{ id: 'high',    label: '高',   color: 'orange' },
	{ id: 'medium',  label: '中',  color: 'yellow' },
	{ id: 'low',     label: '低',  color: 'green' }
]

const borderSections = ['凭祥市', '东兴市', '宁明县', '龙州县', '大新县', '靖西市', '那坡县', '防城区']

const speciesPresets = [
	{ id: 'pangolin',      label: '穿山甲', icon: '🦔' },
	{ id: 'golden-monkey', label: '金丝猴', icon: '🐒' },
	{ id: 'python',        label: '蟒蛇',   icon: '🐍' },
	{ id: 'turtle',        label: '玳瑁',   icon: '🐢' },
	{ id: 'ivory',         label: '象牙',   icon: '🦣' },
	{ id: 'rhino',         label: '犀牛角', icon: '🦏' }
]

const protectionLevels = [
	{ id: 'national-level1', label: '国家一级保护' },
	{ id: 'national-level2', label: '国家二级保护' },
	{ id: 'cites-1',         label: 'CITES 附录I' },
	{ id: 'cites-2',         label: 'CITES 附录II' }
]

const clueTypes = [
	{ id: 'infrared',     label: '红外触发',   iconPath: '/static/icons/clue-type-infrared.png' },
	{ id: 'vibration',    label: '震动传感',   iconPath: '/static/icons/clue-type-vibration.png' },
	{ id: 'camera',       label: '视频监控',   iconPath: '/static/icons/clue-type-camera.png' },
	{ id: 'patrol',       label: '巡查发现',   iconPath: '/static/icons/clue-type-patrol.png' },
	{ id: 'intelligence', label: '情报线索',   iconPath: '/static/icons/clue-type-intelligence.png' }
]

const form = reactive({
	caseType: 'wild_live',
	title: '',
	urgency: 'high',
	location: '',
	borderSection: '凭祥市',
	speciesPreset: 'pangolin',
	speciesOther: '',
	protectionLevel: '',
	quantity: 1,
	clueType: 'infrared',
	description: '',
	officerId: '',
	alertId: ''
})

try {
	const raw = uni.getStorageSync(DRAFT_KEY)
	if (raw && typeof raw === 'object') {
		Object.assign(form, raw)
	}
} catch (e) { /* ignore */ }

function toggleSpecies(id) {
	form.speciesPreset = form.speciesPreset === id ? '' : id
}

function bumpQty(delta) {
	const n = form.quantity + delta
	form.quantity = n < 1 ? 1 : n > 9999 ? 9999 : n
}

function onBack() {
	uni.navigateBack()
}

function onLocate() {
	uni.showModal({
		title: '位置授权',
		content: '「热眼擒枭」需要使用位置信息来标记案事件发现地点。',
		confirmText: '去授权',
		cancelText: '取消',
		success: (res) => {
			if (!res.confirm) return
			uni.chooseLocation({
				success: (r) => {
					form.location = r.name || r.address || `${r.latitude},${r.longitude}`
					uni.showToast({ title: '位置已填入', icon: 'success' })
				},
				fail: (err) => {
					const msg = err.errMsg || ''
					if (msg.includes('auth deny') || msg.includes('cancel')) {
						uni.showToast({ title: '已取消选择', icon: 'none' })
					} else {
						uni.getLocation({
							type: 'gcj02',
							success: (r) => {
								form.location = `${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}`
								uni.showToast({ title: '已填入坐标（需确认地点）', icon: 'none' })
							},
							fail: () => uni.showToast({ title: '定位失败，请检查权限', icon: 'none' })
						})
					}
				}
			})
		}
	})
}

function saveDraft() {
	try {
		uni.setStorageSync(DRAFT_KEY, { ...form })
		uni.showToast({ title: '草稿已保存', icon: 'success' })
	} catch (e) {
		uni.showToast({ title: '保存失败', icon: 'none' })
	}
}

function submitCase() {
	if (!form.title.trim()) {
		uni.showToast({ title: '请填写案事件标题', icon: 'none' })
		return
	}
	uni.showModal({
		title: '提交确认',
		content: '确认将本条线索登记至边境活物走私防控业务台账？（当前为演示流程。）',
		success: (res) => {
			if (!res.confirm) return
			try {
				uni.removeStorageSync(DRAFT_KEY)
			} catch (e) { /* ignore */ }
			uni.showToast({ title: '已登记（演示）', icon: 'success' })
			setTimeout(() => uni.navigateBack(), 800)
		}
	})
}
</script>

<style lang="scss" scoped>
.nsc-page {
	min-height: 100vh;
	background: #060a14;
	padding-top: calc(44px + env(safe-area-inset-top));
	box-sizing: border-box;
}

.nsc-nav {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 calc(8px + env(safe-area-inset-left));
	background: #0a0f1d;
	border-bottom: 1px solid rgba(0, 212, 255, 0.15);
	z-index: 200;
}

.nsc-nav-left,
.nsc-nav-right {
	width: 44px;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.nsc-back-ico {
	width: 24px;
	height: 24px;
	display: block;
}

.nsc-nav-title {
	flex: 1;
	text-align: center;
	font-size: 17px;
	font-weight: 600;
	color: #eaf6ff;
}

.nsc-scroll {
	height: calc(100vh - 44px - env(safe-area-inset-top) - 140px - env(safe-area-inset-bottom));
	box-sizing: border-box;
	padding: 16px 16px 0;
}

.nsc-card {
	background: rgba(12, 27, 42, 0.82);
	border: 1px solid rgba(0, 212, 255, 0.18);
	border-radius: 16px;
	padding: 20px 16px;
	margin-bottom: 12px;
}

.nsc-card-last {
	margin-bottom: 0;
}

.nsc-sec-head {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 16px;
	min-height: 24px;
}

.nsc-sec-icon-img {
	width: 20px;
	height: 20px;
	flex-shrink: 0;
	display: block;
	transform: translateY(-0.5px);
}

.nsc-sec-title {
	font-size: 15px;
	font-weight: 700;
	color: #00d4ff;
}

.nsc-label {
	display: block;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.5);
	margin-bottom: 10px;
	margin-top: 6px;
}

.nsc-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-bottom: 6px;
}

.nsc-tag {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 14px;
	background: rgba(10, 15, 29, 0.9);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 999px;
	transition: border-color 0.2s, box-shadow 0.2s;
}

.nsc-tag.active {
	border-color: #00d4ff;
	box-shadow: 0 0 12px rgba(0, 212, 255, 0.2);
}

.nsc-tag-ico {
	width: 17px;
	height: 17px;
	flex-shrink: 0;
	display: block;
}

.nsc-tag-txt {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.8);
}

.nsc-input {
	width: 100%;
	height: 44px;
	padding: 0 14px;
	box-sizing: border-box;
	background: rgba(10, 15, 29, 0.9);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 10px;
	font-size: 14px;
	color: #fff;
	margin-bottom: 6px;
}

.nsc-input-flex {
	flex: 1;
	margin-bottom: 0;
}

.nsc-ph {
	color: rgba(255, 255, 255, 0.3);
}

.nsc-counter {
	display: block;
	text-align: right;
	font-size: 11px;
	color: rgba(255, 255, 255, 0.35);
	margin-bottom: 10px;
}

.nsc-seg {
	display: flex;
	gap: 8px;
	margin-bottom: 6px;
}

.nsc-seg-item {
	flex: 1;
	text-align: center;
	padding: 10px 4px;
	font-size: 13px;
	color: rgba(255, 255, 255, 0.6);
	background: rgba(10, 15, 29, 0.9);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 10px;
}

.nsc-seg-red.active    { border-color: #ff4d4f; color: #ff4d4f; background: rgba(255, 77, 79, 0.12); }
.nsc-seg-orange.active { border-color: #fa8c16; color: #ffb347; background: rgba(250, 140, 22, 0.12); }
.nsc-seg-yellow.active { border-color: #fadb14; color: #fadb14; background: rgba(250, 219, 20, 0.12); }
.nsc-seg-green.active  { border-color: #52c41a; color: #73d13d; background: rgba(82, 196, 26, 0.12); }

.nsc-loc-row {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 6px;
}

.nsc-loc-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 7px;
	padding: 0 16px;
	height: 44px;
	background: rgba(0, 212, 255, 0.12);
	border: 1px solid rgba(0, 212, 255, 0.4);
	border-radius: 10px;
	font-size: 13px;
	color: #7ae9ff;
	white-space: nowrap;
}

.nsc-loc-btn-ico {
	width: 17px;
	height: 17px;
	flex-shrink: 0;
	display: block;
}

.nsc-chips {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 6px;
}

.nsc-chip {
	padding: 8px 16px;
	background: rgba(10, 15, 29, 0.9);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 999px;
	font-size: 13px;
	color: rgba(255, 255, 255, 0.7);
	transition: border-color 0.2s, color 0.2s;
}

.nsc-chip.active {
	border-color: #00d4ff;
	color: #7ae9ff;
}

.nsc-grid3 {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 10px;
	margin-bottom: 12px;
}

.nsc-spec {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12px 6px;
	background: rgba(10, 15, 29, 0.85);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 12px;
	transition: border-color 0.2s;
}

.nsc-spec.active {
	border-color: rgba(0, 212, 255, 0.55);
}

.nsc-spec-ico {
	font-size: 28px;
	margin-bottom: 4px;
}

.nsc-spec-txt {
	font-size: 11px;
	color: rgba(255, 255, 255, 0.75);
}

.nsc-step-row {
	display: flex;
	align-items: center;
	gap: 14px;
}

.nsc-step-btn {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(10, 15, 29, 0.95);
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 10px;
	font-size: 22px;
	color: #fff;
}

.nsc-step-num {
	font-size: 20px;
	color: #fff;
	min-width: 44px;
	text-align: center;
}

.nsc-step-unit {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.45);
}

.nsc-textarea {
	width: 100%;
	min-height: 120px;
	padding: 12px;
	box-sizing: border-box;
	background: rgba(10, 15, 29, 0.9);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 10px;
	font-size: 14px;
	color: #fff;
	margin-bottom: 6px;
}

.nsc-footer-spacer {
	height: 20px;
}

.nsc-footer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 14px 20px;
	padding-bottom: calc(14px + env(safe-area-inset-bottom));
	background: rgba(10, 15, 29, 0.97);
	border-top: 1px solid rgba(0, 212, 255, 0.12);
	z-index: 100;
}

.safe-bottom {
	box-sizing: border-box;
}

.nsc-draft {
	font-size: 14px;
	color: #7ae9ff;
	padding: 10px 6px;
}

.nsc-submit {
	flex: 1;
	max-width: 300px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 14px 20px;
	background: linear-gradient(135deg, #ff4d4f, #cf1322);
	border-radius: 12px;
	font-size: 15px;
	font-weight: 700;
	color: #fff;
	box-shadow: 0 4px 16px rgba(207, 19, 34, 0.35);
}

.nsc-submit-ico {
	width: 18px;
	height: 18px;
	flex-shrink: 0;
	display: block;
	transform: translateY(-0.5px);
}
</style>
