<template>
	<view class="gis-page">
		<!-- 地图（态势条 / 左栏 / 底栏须置于 map 内 cover-view，否则真机易被原生地图遮挡点击） -->
		<map id="gisMap" class="map-canvas" :latitude="mapCenter.latitude" :longitude="mapCenter.longitude" :scale="mapScale" :markers="allMapMarkers" :polyline="allMapPolylines" :circles="allMapCircles" :show-location="true" :enable-zoom="true" :enable-scroll="true" :enable-rotate="false" @markertap="handleMarkerTap" @tap="handleMapTap" @regionchange="handleRegionChange">
			<!-- 态势条 -->
			<cover-view v-if="!mapOverlaysSuppressed" class="cv-situation-bar" :style="situationBarStyle">
				<!-- 第一行：地名 + 统计 + 响应等级 + 筛选胶囊 -->
				<cover-view class="cv-situation-row1">
					<cover-view class="cv-situation-left">
						<cover-view class="cv-situation-zone">
							<cover-image class="cv-zone-icon" :src="getIconSvg('gps')" mode="aspectFit"></cover-image>
							<cover-view class="cv-zone-text">{{ currentZone }}</cover-view>
						</cover-view>
						<cover-view class="cv-situation-divider"></cover-view>
						<cover-view class="cv-situation-stats">
							<cover-view class="cv-stat-item">
								<cover-view class="cv-stat-value cv-stat-online">{{ onlineCount }}</cover-view>
								<cover-view class="cv-stat-label">在线联勤</cover-view>
							</cover-view>
							<cover-view class="cv-stat-sep"></cover-view>
							<cover-view class="cv-stat-item">
								<cover-view class="cv-stat-value cv-stat-alert">{{ alertCount }}</cover-view>
								<cover-view class="cv-stat-label">今日异常</cover-view>
							</cover-view>
						</cover-view>
					</cover-view>
					<cover-view class="cv-situation-right">
						<cover-view class="cv-response-level" :class="'level-' + responseLevel">
							<cover-view class="cv-level-dot"></cover-view>
							<cover-view class="cv-level-text">{{ responseLevelText }}</cover-view>
						</cover-view>
						<cover-view v-if="layerTypeFilter" class="cv-filter-chip" @tap.stop="clearTypeFilter">
							<cover-image class="cv-filter-chip-icon" :src="getFilterSvgIcon" mode="aspectFit"></cover-image>
							<cover-view class="cv-filter-chip-text">{{ getFilterLabel }}</cover-view>
							<cover-view class="cv-filter-chip-close">✕</cover-view>
						</cover-view>
					</cover-view>
				</cover-view>
				<!-- 第二行：同步时间 -->
				<cover-view class="cv-sync-row">
					<cover-view class="cv-sync-dot"></cover-view>
					<cover-view class="cv-sync-text">数据同步：{{ syncTimeText }}</cover-view>
				</cover-view>
			<!-- 环境感知数据行（AI辅助数据：温湿度/气压/光照/风速） -->
			<cover-view class="cv-env-row">
				<cover-view class="cv-env-item">
					<cover-view class="cv-env-icon-text">🌡️</cover-view>
					<cover-view class="cv-env-value" :class="envTempClass">{{ currentEnvData.temp }}°</cover-view>
					<cover-view class="cv-env-label">温度</cover-view>
				</cover-view>
				<cover-view class="cv-env-sep"></cover-view>
				<cover-view class="cv-env-item">
					<cover-view class="cv-env-icon-text">💧</cover-view>
					<cover-view class="cv-env-value" :class="envHumidityClass">{{ currentEnvData.humidity }}%</cover-view>
					<cover-view class="cv-env-label">湿度</cover-view>
				</cover-view>
				<cover-view class="cv-env-sep"></cover-view>
				<cover-view class="cv-env-item">
					<cover-view class="cv-env-icon-text">🌬️</cover-view>
					<cover-view class="cv-env-value" :class="envWindClass">{{ currentEnvData.windSpeed }}m/s</cover-view>
					<cover-view class="cv-env-label">风速</cover-view>
				</cover-view>
				<cover-view class="cv-env-sep"></cover-view>
				<cover-view class="cv-env-item">
					<cover-view class="cv-env-icon-text">⬆️</cover-view>
					<cover-view class="cv-env-value">{{ currentEnvData.pressure }}hPa</cover-view>
					<cover-view class="cv-env-label">气压</cover-view>
				</cover-view>
				<cover-view class="cv-env-sep"></cover-view>
				<cover-view class="cv-env-badge" :class="'cv-env-' + currentEnvData.dayNightMode">
					<cover-view class="cv-env-badge-dot" :class="'dot-' + currentEnvData.dayNightMode"></cover-view>
					<cover-view class="cv-env-badge-text">{{ currentEnvData.dayNightModeText }}</cover-view>
				</cover-view>
			</cover-view>
		</cover-view>

			<!-- 盲区追踪提示气泡（影子追踪 V2.0） -->
			<cover-view v-if="blindZoneHint" class="cv-blindzone-hint">
				<cover-view class="cv-blindzone-icon">🔮</cover-view>
				<cover-view class="cv-blindzone-info">
					<cover-view class="cv-blindzone-title">{{ blindZoneHint.name }} 已进入盲区续追</cover-view>
					<cover-view class="cv-blindzone-meta">
						<cover-view class="cv-blindzone-tag">置信度 {{ blindZoneHint.confidence }}%</cover-view>
						<cover-view class="cv-blindzone-tag">{{ blindZoneHint.terrain }}地形</cover-view>
						<cover-view class="cv-blindzone-tag">自 {{ blindZoneHint.since }}</cover-view>
					</cover-view>
				</cover-view>
				<cover-view class="cv-blindzone-close" @tap.stop="blindZoneHint = null">✕</cover-view>
			</cover-view>

			<!-- 左侧分类切换 -->
			<cover-view v-if="!mapOverlaysSuppressed" class="cv-left-board" :style="leftPanelStyle">
				<!-- 顶部 Logo + 标题 -->
				<cover-view class="cv-left-header">
					<cover-image class="cv-left-logo" :src="getIconSvg('logo')" mode="aspectFit"></cover-image>
					<cover-view class="cv-left-title-wrap">
						<cover-view class="cv-left-title">热眼擒枭</cover-view>
						<cover-view class="cv-left-subtitle">边境活物走私防控引领者</cover-view>
					</cover-view>
				</cover-view>
				<!-- 分类切换按钮组 -->
				<cover-view class="cv-left-tabs">
					<cover-view
						v-for="tab in categoryTabs"
						:key="tab.value"
						class="cv-left-item"
						:class="{ active: activeCategory === tab.value }"
						@tap="handleCategoryChange(tab.value)"
					>
						<cover-view class="cv-left-icon-wrap">
							<cover-image class="cv-left-icon-img" :src="getIconSvg(tab.iconKey)" mode="aspectFit"></cover-image>
						</cover-view>
						<cover-view class="cv-left-label">{{ tab.label }}</cover-view>
						<cover-view class="cv-left-count">{{ getCategoryCount(tab.value) }}</cover-view>
					</cover-view>
				</cover-view>
				<!-- 底部标语 -->
				<cover-view class="cv-left-footer">
					<cover-view class="cv-left-slogan">{{ leftSloganText }}</cover-view>
				</cover-view>
			</cover-view>

			<!-- 右侧工具栏 -->
			<cover-view v-if="!mapOverlaysSuppressed" class="cv-controls" :style="rightToolbarStyle">
				<!-- 固定区：一键派警 -->
				<cover-view class="cv-btn" @tap="handleDispatchAction">
					<cover-image class="cv-btn-icon-img" :src="getIconSvg('dispatch')" mode="aspectFit"></cover-image>
					<cover-view class="cv-btn-text">一键派警</cover-view>
				</cover-view>

				<!-- 分类工具区：按 activeCategory 动态切换 -->
				<template v-for="action in currentRightToolbarActions" :key="action.key">
					<cover-view class="cv-btn" :class="{ 'cv-btn-active': action.active }" @tap="handleToolbarAction(action)">
						<cover-image class="cv-btn-icon-img" :src="getIconSvg(action.iconKey)" mode="aspectFit"></cover-image>
						<cover-view class="cv-btn-text">{{ action.label }}</cover-view>
					</cover-view>
				</template>

				<!-- 分隔线 -->
				<cover-view class="cv-toolbar-sep"></cover-view>

				<!-- 固定区：测距工具 -->
				<cover-view class="cv-btn" :class="{ 'cv-btn-active': measureMode }" @tap="handleMeasure">
					<cover-image class="cv-btn-icon-img" :src="getIconSvg('ruler')" mode="aspectFit"></cover-image>
					<cover-view class="cv-btn-text">测距</cover-view>
				</cover-view>
				<!-- 固定区：图层管理（带数字角标） -->
				<cover-view class="cv-btn" @tap="openLayerDrawer">
					<cover-image class="cv-btn-icon-img" :src="getIconSvg('layers')" mode="aspectFit"></cover-image>
					<cover-view class="cv-btn-text">图层</cover-view>
					<cover-view class="cv-btn-badge">{{ activeLayerCount }}</cover-view>
				</cover-view>
				<!-- 固定区：定位 -->
				<cover-view class="cv-btn" @tap="handleLocationAction">
					<cover-image class="cv-btn-icon-img" :src="getIconSvg('location')" mode="aspectFit"></cover-image>
					<cover-view class="cv-btn-text">定位</cover-view>
				</cover-view>
				<!-- 固定区：缩放控制 -->
				<cover-view class="cv-zoom">
					<cover-view class="cv-btn cv-zoom-btn" @tap="handleZoomIn"><cover-view class="cv-btn-text cv-zoom-text">+</cover-view></cover-view>
					<cover-view class="cv-zoom-divider"></cover-view>
					<cover-view class="cv-btn cv-zoom-btn" @tap="handleZoomOut"><cover-view class="cv-btn-text cv-zoom-text">-</cover-view></cover-view>
				</cover-view>
			</cover-view>

			<!-- 底部操作（cover-view + cover-text，保证真机可点） -->
			<cover-view v-if="!mapOverlaysSuppressed" class="cv-bottom-actions" :style="bottomActionsStyle">
				<cover-view
					v-for="action in currentBottomActions"
					:key="action.key"
					class="cv-bottom-btn"
					:class="[action.className, action.loading ? 'cv-bottom-btn-loading' : '']"
					@tap="handleBottomAction(action)"
				>
					<!-- loading 态显示转圈 -->
					<cover-view v-if="action.loading" class="cv-bottom-btn-spinner"></cover-view>
					<template v-else>
						<cover-image v-if="action.iconKey" class="cv-bottom-btn-icon" :src="getIconSvg(action.iconKey)" mode="aspectFit"></cover-image>
						<cover-view :style="bottomCoverTextLabelStyle">{{ action.label }}</cover-view>
					</template>
				</cover-view>
			</cover-view>

			<!-- 图层面板抽屉 -->
			<cover-view v-if="layerDrawerOpen && !mapOverlaysSuppressed" class="cv-drawer-mask" @tap="closeLayerDrawer">
				<cover-view class="cv-drawer-panel" @tap.stop>
					<cover-view class="cv-drawer-header">
						<cover-view class="cv-drawer-title">{{ getDrawerTitle }}</cover-view>
						<cover-view class="cv-drawer-subtitle">{{ getDrawerSubtitle }}</cover-view>
					</cover-view>
				<!-- 濒危物种图层详情 -->
					<template v-if="activeCategory === 'wildlife'">
						<cover-view class="cv-drawer-section">
							<cover-view class="cv-drawer-section-title">活物走私线索分布</cover-view>
							<cover-view class="cv-drawer-layer-row" v-for="item in wildlifeLayerStats" :key="item.type" @tap.stop="filterByType(item.type)">
								<cover-image class="cv-drawer-layer-icon" :src="getIconSvg(item.iconKey)" mode="aspectFit"></cover-image>
								<cover-view class="cv-drawer-layer-name">{{ item.label }}</cover-view>
								<cover-view class="cv-drawer-layer-count">{{ item.count }}</cover-view>
								<cover-view class="cv-drawer-layer-status" :class="'risk-' + item.riskLevel">{{ item.riskText }}</cover-view>
							</cover-view>
						</cover-view>
						<!-- 活物走私统计行（卡片式居中布局） -->
						<cover-view class="cv-drawer-stats-row">
							<cover-view class="cv-drawer-stats-inner">
								<cover-view class="cv-drawer-stat-card cv-drawer-stat-card-alert">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-red"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ wildlifeStats.pending }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">待核查</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-cyan"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ wildlifeStats.investigating }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">调查中</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card cv-drawer-stat-card-online">
									<cover-view class="cv-drawer-stat-accent"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ wildlifeStats.resolved }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">已处置</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-blue"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ wildlifeStats.route }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">涉案地区</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-yellow"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ wildlifeStats.risk }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">高风险</cover-view>
								</cover-view>
							</cover-view>
						</cover-view>
					</template>
					<!-- 边境入侵图层详情 -->
					<template v-else-if="activeCategory === 'border'">
						<cover-view class="cv-drawer-section">
							<cover-view class="cv-drawer-section-title">边境联防监测分布</cover-view>
							<cover-view class="cv-drawer-layer-row" v-for="item in borderLayerStats" :key="item.type" @tap.stop="filterByType(item.type)">
								<cover-image class="cv-drawer-layer-icon" :src="getIconSvg(item.iconKey)" mode="aspectFit"></cover-image>
								<cover-view class="cv-drawer-layer-name">{{ item.label }}</cover-view>
								<cover-view class="cv-drawer-layer-count">{{ item.count }}</cover-view>
								<cover-view class="cv-drawer-layer-status" :class="'status-' + item.status">{{ item.statusText }}</cover-view>
							</cover-view>
						</cover-view>
						<!-- 边境入侵统计行 -->
						<cover-view class="cv-drawer-stats-row">
							<cover-view class="cv-drawer-stats-inner">
								<cover-view class="cv-drawer-stat-card cv-drawer-stat-card-alert">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-red"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ borderStats.pending }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">待核查</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-cyan"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ borderStats.investigating }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">调查中</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card cv-drawer-stat-card-online">
									<cover-view class="cv-drawer-stat-accent"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ borderStats.resolved }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">已处置</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-blue"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ borderStats.route }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">涉案地区</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-yellow"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ borderStats.risk }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">高风险</cover-view>
								</cover-view>
							</cover-view>
						</cover-view>
					</template>
					<!-- 可疑车辆图层详情 -->
					<template v-else-if="activeCategory === 'vehicle'">
						<cover-view class="cv-drawer-section">
							<cover-view class="cv-drawer-section-title">可疑车辆追踪分布</cover-view>
							<cover-view class="cv-drawer-layer-row" v-for="item in vehicleLayerStats" :key="item.type" @tap.stop="filterByType(item.type)">
								<cover-image class="cv-drawer-layer-icon" :src="getIconSvg(item.iconKey)" mode="aspectFit"></cover-image>
								<cover-view class="cv-drawer-layer-name">{{ item.label }}</cover-view>
								<cover-view class="cv-drawer-layer-count">{{ item.count }}</cover-view>
								<cover-view class="cv-drawer-layer-status" :class="'risk-' + item.riskLevel || ('status-' + item.status)">{{ item.riskText || item.statusText }}</cover-view>
							</cover-view>
						</cover-view>
						<!-- 可疑车辆统计行 -->
						<cover-view class="cv-drawer-stats-row">
							<cover-view class="cv-drawer-stats-inner">
								<cover-view class="cv-drawer-stat-card cv-drawer-stat-card-alert">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-red"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ vehicleStats.pending }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">待核查</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-cyan"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ vehicleStats.investigating }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">调查中</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card cv-drawer-stat-card-online">
									<cover-view class="cv-drawer-stat-accent"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ vehicleStats.resolved }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">已处置</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-blue"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ vehicleStats.route }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">涉案地区</cover-view>
								</cover-view>
								<cover-view class="cv-drawer-stat-card">
									<cover-view class="cv-drawer-stat-accent cv-drawer-stat-accent-yellow"></cover-view>
									<cover-view class="cv-drawer-stat-cell-value">{{ vehicleStats.risk }}</cover-view>
									<cover-view class="cv-drawer-stat-cell-label">高风险</cover-view>
								</cover-view>
							</cover-view>
						</cover-view>
					</template>
					<cover-view class="cv-drawer-row cancel" @tap.stop="closeLayerDrawer">
						<cover-view class="cv-drawer-name">关闭</cover-view>
					</cover-view>
				</cover-view>
			</cover-view>

			<!-- 传感器/点位详情弹窗 -->
			<cover-view v-if="sensorPopupVisible && selectedSensor && !mapOverlaysSuppressed" class="sensor-popup-overlay" @tap="closeSensorPopup">
				<cover-view class="sensor-popup-card" @tap.stop>
					<cover-view class="spc-close" @tap="closeSensorPopup"><cover-view class="spc-close-text">x</cover-view></cover-view>
					<cover-view class="spc-header">
						<cover-view class="spc-type-icon"><cover-view class="spc-icon-emoji">{{ getSensorEmoji(selectedSensor.type) }}</cover-view></cover-view>
						<cover-view class="spc-title-group">
							<cover-view class="spc-name">{{ selectedSensor.name }}</cover-view>
							<cover-view class="spc-status-badge">
								<cover-view class="spc-status-dot" :class="'dot-' + selectedSensor.status"></cover-view>
								<cover-view class="spc-status-text">{{ getStatusText(selectedSensor.status) }}</cover-view>
							</cover-view>
						</cover-view>
					</cover-view>
					<cover-view class="spc-data-grid">
						<cover-view class="spc-data-item"><cover-view class="spc-label">边境段</cover-view><cover-view class="spc-value">{{ selectedSensor.border }}</cover-view></cover-view>
						<cover-view class="spc-data-item"><cover-view class="spc-label">责任单位</cover-view><cover-view class="spc-value">{{ selectedSensor.unit }}</cover-view></cover-view>
					</cover-view>
					<cover-view class="spc-data-grid">
						<cover-view class="spc-data-item"><cover-view class="spc-label">{{ popupMetricALabel }}</cover-view><cover-view class="spc-value">{{ selectedSensor.metricA || '-' }}</cover-view></cover-view>
						<cover-view class="spc-data-item"><cover-view class="spc-label">{{ popupMetricBLabel }}</cover-view><cover-view class="spc-value">{{ selectedSensor.metricB || '-' }}</cover-view></cover-view>
					</cover-view>
					<cover-view class="spc-data-grid">
						<cover-view class="spc-data-item"><cover-view class="spc-label">{{ popupRiskLabel }}</cover-view><cover-view class="spc-value" :class="'risk-value-' + riskLevelToClass(selectedSensor.risk_level)">{{ selectedSensor.risk_level || '中' }}</cover-view></cover-view>
						<cover-view class="spc-data-item"><cover-view class="spc-label">{{ popupTimeLabel }}</cover-view><cover-view class="spc-value">{{ selectedSensor.time || '实时' }}</cover-view></cover-view>
					</cover-view>
					<cover-view class="spc-actions">
						<cover-view class="spc-btn spc-btn-secondary" @tap="handlePopupSecondary"><cover-view class="spc-btn-text">{{ popupSecondaryText }}</cover-view></cover-view>
						<cover-view class="spc-btn spc-btn-primary" @tap="handlePopupPrimary"><cover-view class="spc-btn-text">{{ popupPrimaryText }}</cover-view></cover-view>
					</cover-view>
				</cover-view>
			</cover-view>
		</map>

		<!-- 一键派警确认弹窗 -->
		<view v-if="dispatchDialogVisible" class="dispatch-overlay" @tap="closeDispatchDialog">
			<view class="dispatch-dialog" @tap.stop>
				<view class="dispatch-header">
					<text class="dispatch-title">一键派警</text>
					<text class="dispatch-close" @tap="closeDispatchDialog">×</text>
				</view>
				<view class="dispatch-body">
					<view class="dispatch-info">
						<text class="dispatch-label">派警区域</text>
						<text class="dispatch-value">{{ currentZone }}</text>
					</view>
					<view class="dispatch-info">
						<text class="dispatch-label">在线力量</text>
						<text class="dispatch-value">{{ onlineCount }} 人</text>
					</view>
					<view class="dispatch-info">
						<text class="dispatch-label">响应等级</text>
						<text class="dispatch-value dispatch-level" :class="'level-text-' + responseLevel">{{ responseLevelText }}</text>
					</view>
				</view>
				<view class="dispatch-actions">
					<button class="dispatch-btn dispatch-btn-cancel" @tap="closeDispatchDialog">取消</button>
					<button class="dispatch-btn dispatch-btn-confirm" @tap="confirmDispatch">确认派警</button>
				</view>
			</view>
		</view>

		<!-- 边境防线 · 现场核验结果 -->
		<view v-if="verifyResultVisible && verifyResultData" class="dispatch-overlay" @tap="closeVerifyResult">
			<view class="dispatch-dialog trace-dialog verify-dispatch-dialog" @tap.stop>
				<view class="dispatch-header trace-header verify-dispatch-header" :class="'verify-dispatch-header-' + verifyResultData.statusClass">
					<view class="verify-dispatch-heading">
						<text class="verify-dispatch-kicker">边境防线 · 联动任务</text>
						<text class="dispatch-title">现场核验任务已下发</text>
					</view>
					<text class="dispatch-close" @tap="closeVerifyResult">×</text>
				</view>
				<view class="dispatch-body verify-dispatch-body">
					<view class="verify-task-card" :class="'verify-task-card-' + verifyResultData.statusClass">
						<view class="verify-task-top">
							<view>
								<text class="verify-task-code">{{ verifyResultData.workOrderCode }}</text>
								<text class="verify-task-title">边境现场核验任务已下发</text>
							</view>
							<view class="verify-task-badge" :class="'verify-task-badge-' + verifyResultData.statusClass">
								{{ verifyResultData.statusText }}
							</view>
						</view>
						<view class="verify-task-target-row">
							<view class="verify-task-target-main">
								<text class="verify-task-target-name">{{ verifyResultData.target.name }}</text>
								<text class="verify-task-target-meta">{{ verifyResultData.target.border }} · {{ verifyResultData.team }}</text>
							</view>
							<view class="verify-task-eta">
								<text class="verify-task-eta-label">预计到场</text>
								<text class="verify-task-eta-value">{{ verifyResultData.eta }}</text>
							</view>
						</view>
						<view class="verify-progress-box">
							<view class="verify-progress-head">
								<text class="verify-progress-title">任务推进中</text>
								<text class="verify-progress-percent">{{ verifyResultData.progress }}%</text>
							</view>
							<view class="verify-progress-track">
								<view class="verify-progress-fill" :class="'verify-progress-fill-' + verifyResultData.statusClass" :style="{ width: verifyResultData.progress + '%' }"></view>
							</view>
							<view class="verify-step-row">
								<view v-for="step in verifyResultData.steps" :key="step.label" class="verify-step-item" :class="{ done: step.done }">
									<view class="verify-step-dot"></view>
									<text class="verify-step-label">{{ step.label }}</text>
								</view>
							</view>
						</view>
					</view>
					<view class="verify-dispatch-grid">
						<view class="verify-dispatch-mini-card">
							<text class="verify-dispatch-mini-label">处置动作</text>
							<text class="verify-dispatch-mini-value">{{ verifyResultData.task }}</text>
						</view>
						<view class="verify-dispatch-mini-card">
							<text class="verify-dispatch-mini-label">下发时间</text>
							<text class="verify-dispatch-mini-value">{{ verifyResultData.reportTime }}</text>
						</view>
					</view>
				</view>
				<view class="dispatch-actions">
					<button class="dispatch-btn dispatch-btn-cancel" @tap="closeVerifyResult">稍后处理</button>
					<button class="dispatch-btn dispatch-btn-confirm" @tap="closeVerifyResult">继续态势研判</button>
				</view>
			</view>
		</view>

		<!-- 车辆布控 · 车辆核查结果 -->
		<view v-if="vehicleCheckVisible && vehicleCheckData" class="dispatch-overlay" @tap="closeVehicleCheck">
			<view class="dispatch-dialog trace-dialog verify-dispatch-dialog vehicle-dispatch-dialog" @tap.stop>
				<view class="dispatch-header trace-header verify-dispatch-header vehicle-dispatch-header" :class="'vehicle-dispatch-header-' + vehicleCheckData.statusClass">
					<view class="verify-dispatch-heading">
						<text class="verify-dispatch-kicker">车辆布控 · 联动核查</text>
						<text class="dispatch-title">车辆核查任务已下发</text>
					</view>
					<text class="dispatch-close" @tap="closeVehicleCheck">×</text>
				</view>
				<view class="dispatch-body verify-dispatch-body">
					<view class="verify-task-card vehicle-task-card" :class="'verify-task-card-' + vehicleCheckData.statusClass">
						<view class="verify-task-top">
							<view>
								<text class="verify-task-code">{{ vehicleCheckData.workOrderCode }}</text>
								<text class="verify-task-title">可疑目标核查流程已启动</text>
							</view>
							<view class="verify-task-badge" :class="'verify-task-badge-' + vehicleCheckData.statusClass">
								{{ vehicleCheckData.statusText }}
							</view>
						</view>
						<view class="verify-task-target-row">
							<view class="verify-task-target-main">
								<text class="verify-task-target-name">{{ vehicleCheckData.target.name }}</text>
								<text class="verify-task-target-meta">{{ vehicleCheckData.target.border }} · {{ vehicleCheckData.team }}</text>
							</view>
							<view class="verify-task-eta vehicle-task-eta">
								<text class="verify-task-eta-label">预计完成</text>
								<text class="verify-task-eta-value">{{ vehicleCheckData.eta }}</text>
							</view>
						</view>
						<view class="verify-progress-box">
							<view class="verify-progress-head">
								<text class="verify-progress-title">核查推进中</text>
								<text class="verify-progress-percent">{{ vehicleCheckData.progress }}%</text>
							</view>
							<view class="verify-progress-track">
								<view class="verify-progress-fill vehicle-progress-fill" :class="'verify-progress-fill-' + vehicleCheckData.statusClass" :style="{ width: vehicleCheckData.progress + '%' }"></view>
							</view>
							<view class="verify-step-row">
								<view v-for="step in vehicleCheckData.steps" :key="step.label" class="verify-step-item" :class="{ done: step.done }">
									<view class="verify-step-dot"></view>
									<text class="verify-step-label">{{ step.label }}</text>
								</view>
							</view>
						</view>
					</view>
					<view class="verify-dispatch-grid">
						<view class="verify-dispatch-mini-card vehicle-dispatch-mini-card">
							<text class="verify-dispatch-mini-label">核查动作</text>
							<text class="verify-dispatch-mini-value">{{ vehicleCheckData.action }}</text>
						</view>
						<view class="verify-dispatch-mini-card vehicle-dispatch-mini-card">
							<text class="verify-dispatch-mini-label">下发时间</text>
							<text class="verify-dispatch-mini-value">{{ vehicleCheckData.reportTime }}</text>
						</view>
					</view>
				</view>
				<view class="dispatch-actions">
					<button class="dispatch-btn dispatch-btn-cancel" @tap="closeVehicleCheck">稍后查看</button>
					<button class="dispatch-btn dispatch-btn-confirm vehicle-dispatch-confirm" @tap="closeVehicleCheck">继续布控研判</button>
				</view>
			</view>
		</view>

		<!-- 边境防线 · 轨迹核查时间选择 -->
		<view v-if="traceCheckVisible" class="dispatch-overlay" @tap="closeTraceCheck">
			<view class="dispatch-dialog trace-dialog" @tap.stop>
				<view class="dispatch-header trace-header">
					<text class="dispatch-title">轨迹核查</text>
					<text class="dispatch-close" @tap="closeTraceCheck">×</text>
				</view>
				<view class="dispatch-body">
					<view class="trace-target-card" v-if="lastMapSelection || selectedSensor">
						<text class="trace-target-name">{{ (lastMapSelection || selectedSensor).name }}</text>
						<text class="trace-target-meta">{{ (lastMapSelection || selectedSensor).border }} · {{ (lastMapSelection || selectedSensor).unit }}</text>
					</view>
					<view class="trace-section-title">筛选时间</view>
					<view class="trace-pill-group">
						<view
							v-for="item in traceTimeOptions"
							:key="item.value"
							class="trace-pill-item"
							:class="{ active: selectedTraceTime === item.value }"
							@tap="selectedTraceTime = item.value"
						>
							<view class="trace-pill-dot" :class="{ active: selectedTraceTime === item.value }"></view>
							<text class="trace-pill-label">{{ item.label }}</text>
						</view>
					</view>
					<view v-if="selectedTraceTime === 'custom'" class="trace-custom-box">
						<text class="trace-custom-label">自定义小时数</text>
						<input v-model="customTraceHours" class="trace-custom-input" type="number" placeholder="输入需要核查的小时数，如 36" placeholder-class="trace-custom-placeholder" />
					</view>
				</view>
				<view class="dispatch-actions">
					<button class="dispatch-btn dispatch-btn-cancel" @tap="closeTraceCheck">取消</button>
					<button class="dispatch-btn dispatch-btn-confirm" @tap="submitTraceCheck">开始核查</button>
				</view>
			</view>
		</view>

		<!-- ==================== 线索核验表单面板 ==================== -->
		<ClueVerifyPanel
			:visible="clueVerifyVisible"
			:clues="smugglingData"
			@close="clueVerifyVisible = false"
			@verify="handleClueVerify"
			@batch-verify="handleBatchClueVerify"
			@dispatch="handleClueDispatch"
		></ClueVerifyPanel>

		<!-- 风险画像详情面板 -->
		<RiskProfilePanel
			:visible="riskProfileVisible"
			:clues="smugglingData"
			@close="riskProfileVisible = false"
			@generate-report="handleGenerateReport"
			@export="handleExportProfile"
			@area-tap="handleProfileAreaTap"
		></RiskProfilePanel>
	</view>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { iconSvgUri } from './utils/iconSvgUri.js'
import ClueVerifyPanel from './components/ClueVerifyPanel.vue'
import RiskProfilePanel from './components/RiskProfilePanel.vue'

// ==================== 设备适配 ====================
const systemInfo = ref({
	statusBarHeight: 20,
	safeAreaInsets: { top: 0, bottom: 0 },
	screenWidth: 375,
	screenHeight: 812
})

const situationBarStyle = computed(() => ({
	top: `${systemInfo.value.statusBarHeight + 10}px`
}))

const leftPanelStyle = computed(() => ({
	top: `${systemInfo.value.statusBarHeight + 90}px`
}))

const rightToolbarStyle = computed(() => ({
	top: `${systemInfo.value.statusBarHeight + 80}px`
}))

const bottomActionsStyle = computed(() => ({
	bottom: `${systemInfo.value.safeAreaInsets.bottom + 18}px`
}))

/** map 内 cover-view 文字必须全部用内联 px 样式，WXSS 类名在 cover-view/cover-text 内常不生效 */
const bottomCoverTextLabelStyle =
	'display:block;white-space:nowrap;color:#ffffff;font-size:12px;font-weight:bold;line-height:16px;text-align:center;width:100%;text-shadow:0 1px 2px #000000;'

// ==================== 环境感知数据（AI 辅助识别参数） ====================
// 温湿度、气压、光照、风速数据，用于红外热成像误差修正、恶劣天气预警增强、夜间模式自适应
const currentEnvData = ref({
	temp: 28,           // 环境温度（℃）
	humidity: 72,       // 相对湿度（%）
	pressure: 1008,     // 大气气压（hPa）
	illuminance: 850,   // 光照强度（lux）
	windSpeed: 3.2,     // 风速（m/s）
	weatherLevel: 'normal',  // 恶劣天气等级：normal / caution / warning / severe
	dayNightMode: 'day',     // 昼夜模式：day / dusk / night
	dayNightModeText: '白天'
})

// 根据光照强度自动计算昼夜模式
const dayNightModeTextMap = { day: '白天', dusk: '黄昏', night: '夜间' }

function updateDayNightMode() {
	const lux = currentEnvData.value.illuminance
	if (lux < 10) {
		currentEnvData.value.dayNightMode = 'night'
		currentEnvData.value.dayNightModeText = '夜间'
	} else if (lux < 100) {
		currentEnvData.value.dayNightMode = 'dusk'
		currentEnvData.value.dayNightModeText = '黄昏'
	} else {
		currentEnvData.value.dayNightMode = 'day'
		currentEnvData.value.dayNightModeText = '白天'
	}
}

watch(() => currentEnvData.value.illuminance, updateDayNightMode)
updateDayNightMode()

// 环境数据样式
const envTempClass = computed(() => {
	const t = currentEnvData.value.temp
	if (t >= 35) return 'env-hot'
	if (t >= 28) return 'env-warm'
	if (t <= 10) return 'env-cold'
	return ''
})

const envHumidityClass = computed(() => {
	const h = currentEnvData.value.humidity
	if (h >= 85) return 'env-humidity-high'
	if (h >= 70) return 'env-humidity-mid'
	return ''
})

const envWindClass = computed(() => {
	const w = currentEnvData.value.windSpeed
	if (w >= 10.7) return 'env-wind-severe'
	if (w >= 5.5) return 'env-wind-warning'
	return ''
})

// 定时更新模拟环境数据（实际项目中由传感器实时上报）
let envInterval = null
onMounted(() => {
	envInterval = setInterval(() => {
		currentEnvData.value.temp = Math.round((24 + Math.random() * 10) * 10) / 10
		currentEnvData.value.humidity = Math.round(50 + Math.random() * 45)
		currentEnvData.value.pressure = Math.round(990 + Math.random() * 30 * 10) / 10
		currentEnvData.value.illuminance = Math.round(Math.random() * 1200)
		currentEnvData.value.windSpeed = Math.round(Math.random() * 20 * 10) / 10
		updateDayNightMode()
	}, 10000)
})
onUnmounted(() => { if (envInterval) clearInterval(envInterval) })

// ==================== 数据定义（模拟 · 广西 8 个边境县市区 + 口岸表，凭祥/东兴加密） ====================
const borderControlData = ref([
	// —— 凭祥市（重点 · 对越南谅山省 / 友谊关·铁路口岸） ——
	{id:10101,latitude:22.1882,longitude:106.7255,name:'友谊关口岸联勤卡口',type:'checkpoint',border:'凭祥市',unit:'崇左支队',status:'active',metricA:'一级口岸',metricB:'同登方向'},
	{id:10102,latitude:22.0658,longitude:106.7088,name:'凭祥铁路口岸查验',type:'checkpoint',border:'凭祥市',unit:'铁路专班',status:'on_duty',metricA:'班列3列/日',metricB:'H986 2台'},
	{id:10103,latitude:22.1042,longitude:106.7486,name:'浦寨货运查验点',type:'checkpoint',border:'凭祥市',unit:'口岸专班',status:'active',metricA:'布控12人',metricB:'布点3处'},
	{id:10104,latitude:22.0725,longitude:106.7285,name:'弄尧互市卡口',type:'checkpoint',border:'凭祥市',unit:'凭祥边境大队',status:'active',metricA:'警力10人',metricB:'X光机1台'},
	{id:10105,latitude:22.0918,longitude:106.7362,name:'弄怀互市巡组',type:'patrol',border:'凭祥市',unit:'边境管理队',status:'on_duty',metricA:'巡组3组',metricB:'无人机1架'},
	{id:10106,latitude:22.1795,longitude:106.7318,name:'友谊关快反巡组',type:'patrol',border:'凭祥市',unit:'特警快反',status:'active',metricA:'5分钟圈',metricB:'装甲1辆'},
	{id:10107,latitude:22.0388,longitude:106.6925,name:'油隘通道观察哨',type:'sentry',border:'凭祥市',unit:'隘口哨所',status:'active',metricA:'视频12路',metricB:'光纤震动'},
	{id:10108,latitude:22.0562,longitude:106.7158,name:'叫隘山界碑哨夜间越线预警',type:'sentry',border:'凭祥市',unit:'隘口哨所',status:'warning',metricA:'震动报警',metricB:'热成像异常'},
	// —— 东兴市（重点 · 对越南广宁省 / 东兴口岸·界碑一号） ——
	{id:10111,latitude:21.5558,longitude:107.9685,name:'东兴口岸主卡口',type:'checkpoint',border:'东兴市',unit:'防城港支队',status:'active',metricA:'一级口岸',metricB:'芒街方向'},
	{id:10112,latitude:21.5385,longitude:107.9788,name:'边民互市通道查验',type:'checkpoint',border:'东兴市',unit:'口岸专班',status:'on_duty',metricA:'高峰分流',metricB:'CT机1'},
	{id:10113,latitude:21.5318,longitude:107.9822,name:'东兴口岸巡防组',type:'patrol',border:'东兴市',unit:'防城港支队',status:'active',metricA:'警力8人',metricB:'热成像4台'},
	{id:10114,latitude:21.5125,longitude:107.9758,name:'北仑河口水上巡组',type:'patrol',border:'东兴市',unit:'水上巡逻队',status:'active',metricA:'快艇2艘',metricB:'人员6名'},
	{id:10115,latitude:21.5158,longitude:107.9685,name:'北仑河界碑执勤哨',type:'sentry',border:'东兴市',unit:'水上巡逻队',status:'active',metricA:'哨兵4人',metricB:'快艇2艘'},
	{id:10116,latitude:21.4812,longitude:108.0388,name:'大清国一号界碑执勤点',type:'sentry',border:'东兴市',unit:'竹山警务',status:'on_duty',metricA:'景点联防',metricB:'客流正常'},
	{id:10117,latitude:21.4985,longitude:108.0118,name:'万尾金滩海防哨海岸巡防',type:'sentry',border:'东兴市',unit:'海警工作站',status:'on_duty',metricA:'雷达开启',metricB:'AIS正常'},
	{id:10118,latitude:21.5885,longitude:108.0155,name:'江平镇沿海巡组',type:'patrol',border:'东兴市',unit:'沿海派出所',status:'active',metricA:'步巡+车巡',metricB:'无人机1'},
	// —— 宁明县（212km · 爱店·那花 / 对广宁·谅山） ——
	{id:10121,latitude:21.6752,longitude:107.0715,name:'爱店口岸联勤点',type:'checkpoint',border:'宁明县',unit:'崇左支队',status:'active',metricA:'二级口岸',metricB:'二类通道'},
	{id:10122,latitude:21.7025,longitude:107.1285,name:'那花通道卡口',type:'checkpoint',border:'宁明县',unit:'宁明边境大队',status:'active',metricA:'夜间补光',metricB:'车底镜'},
	{id:10123,latitude:21.9488,longitude:107.0788,name:'明江沿岸巡组',type:'patrol',border:'宁明县',unit:'巡特警',status:'on_duty',metricA:'河段3段',metricB:'摩托艇1'},
	// —— 龙州县（184km · 水口·平而关 / 对高平·谅山） ——
	{id:10131,latitude:22.3585,longitude:106.3522,name:'水口口岸一级卡口',type:'checkpoint',border:'龙州县',unit:'崇左支队',status:'active',metricA:'一级口岸',metricB:'驮隆方向'},
	{id:10132,latitude:22.2688,longitude:106.4585,name:'平而关互市巡组',type:'patrol',border:'龙州县',unit:'水口大队',status:'on_duty',metricA:'互市高峰',metricB:'便衣2组'},
	{id:10133,latitude:22.3225,longitude:106.3888,name:'下冻边境巡组',type:'patrol',border:'龙州县',unit:'边境派出所',status:'active',metricA:'便道7条',metricB:'视频联动'},
	// —— 大新县（43km · 硕龙·德天 / 对高平） ——
	{id:10141,latitude:22.8488,longitude:106.7188,name:'硕龙口岸查验岗',type:'checkpoint',border:'大新县',unit:'崇左支队',status:'active',metricA:'二级口岸',metricB:'板约瀑布方向'},
	{id:10142,latitude:22.8565,longitude:106.7325,name:'德天瀑布景区联勤',type:'patrol',border:'大新县',unit:'旅游警察',status:'active',metricA:'客流峰值',metricB:'生态巡护'},
	// —— 靖西市（152.5km · 龙邦·岳圩 / 对高平） ——
	{id:10151,latitude:22.8528,longitude:106.3935,name:'龙邦国际口岸卡口',type:'checkpoint',border:'靖西市',unit:'百色支队',status:'active',metricA:'一级口岸',metricB:'茶岭方向'},
	{id:10152,latitude:23.1288,longitude:106.4125,name:'岳圩通道查验点',type:'checkpoint',border:'靖西市',unit:'靖西大队',status:'on_duty',metricA:'货运高峰',metricB:'缉毒犬1'},
	{id:10153,latitude:23.0955,longitude:106.3822,name:'壬庄边境哨所',type:'sentry',border:'靖西市',unit:'百色支队',status:'active',metricA:'夜视正常',metricB:'无告警'},
	// —— 那坡县（206.5km · 平孟 / 对高平·河江） ——
	{id:10161,latitude:23.1285,longitude:105.8755,name:'平孟口岸联勤卡口',type:'checkpoint',border:'那坡县',unit:'百色支队',status:'active',metricA:'一级口岸',metricB:'朔河方向'},
	{id:10162,latitude:23.2525,longitude:105.9188,name:'百省边境巡组便道拦截待增援',type:'patrol',border:'那坡县',unit:'那坡大队',status:'warning',metricA:'便道预警',metricB:'待增援'},
	// —— 防城区（136km · 滩散·里火 / 对广宁） ——
	{id:10171,latitude:21.7825,longitude:108.2525,name:'滩散互市巡组',type:'patrol',border:'防城区',unit:'防城港支队',status:'active',metricA:'步巡4人',metricB:'视频联动'},
	{id:10172,latitude:21.6688,longitude:108.0488,name:'里火互市卡口',type:'checkpoint',border:'防城区',unit:'防城边境大队',status:'active',metricA:'互市高峰',metricB:'查验台2'}
])

const smugglingData = ref([
	// 凭祥
	{id:20101,latitude:22.1825,longitude:106.7288,name:'凭祥·友谊关货场活物夹藏预警',type:'live-transport',border:'凭祥市',unit:'情指中心',status:'pending',risk_level:'高',time:'07:20',metricA:'冷柜车2',metricB:'热成像异常'},
	{id:20104,latitude:22.0755,longitude:106.7355,name:'凭祥·弄尧互市冻品夹带',type:'live-transport',border:'凭祥市',unit:'打私专班',status:'investigating',risk_level:'中',time:'11:40',metricA:'冻柜3个',metricB:'X光复核'},
	// 东兴
	{id:20113,latitude:21.5088,longitude:107.9622,name:'东兴·北仑河夜航偷运预警',type:'live-transport',border:'东兴市',unit:'水上缉私',status:'pending',risk_level:'高',time:'05:30',metricA:'橡皮艇1',metricB:'夜间红外'},
	{id:20114,latitude:21.4925,longitude:108.0225,name:'东兴·竹山便道可疑车辆',type:'live-transport',border:'东兴市',unit:'边境大队',status:'investigating',risk_level:'中高',time:'22:18',metricA:'SUV 1',metricB:'绕关轨迹'},
	// 其他县
	{id:20123,latitude:22.8525,longitude:106.7255,name:'大新·硕龙游客携带象牙制品线索',type:'live-transport',border:'大新县',unit:'森林公安',status:'pending',risk_level:'高',time:'15:05',metricA:'纪念品店',metricB:'快检阳性'},
	{id:20126,latitude:23.1355,longitude:105.8825,name:'那坡·平孟非设关绕关',type:'live-transport',border:'那坡县',unit:'打私专班',status:'pending',risk_level:'中高',time:'04:12',metricA:'摩托2',metricB:'山林轨迹'},
	{id:20127,latitude:21.7755,longitude:108.2455,name:'防城·滩散互市冻品线索',type:'live-transport',border:'防城区',unit:'边境侦查',status:'investigating',risk_level:'中',time:'13:50',metricA:'泡沫箱20',metricB:'检疫证缺'},
	{id:20128,latitude:21.6945,longitude:107.0218,name:'宁明·爱店通道夜间活体转运',type:'live-transport',border:'宁明县',unit:'口岸情报中心',status:'resolved',risk_level:'高',time:'03:40',metricA:'厢式车1',metricB:'夜视联动锁定'},
	{id:20129,latitude:22.3562,longitude:106.3662,name:'龙州·水口河沿岸可疑活体包裹',type:'live-transport',border:'龙州县',unit:'联勤巡查组',status:'resolved',risk_level:'中',time:'21:10',metricA:'编织袋4',metricB:'水路接驳点'},
	{id:20130,latitude:22.8635,longitude:106.4018,name:'靖西·龙邦货运通道异常申报',type:'live-transport',border:'靖西市',unit:'口岸查验组',status:'investigating',risk_level:'中',time:'09:18',metricA:'报关单异常',metricB:'车辆回流轨迹'}
])

// ==================== 车辆布控模拟数据 ====================
/**
 * vehicleData：车辆布控分类下的地图模拟点位
 * 类型说明：
 *   vehicle  — 可疑车辆轨迹点（停靠/出没热点）
 *   boat     — 水上载具轨迹点（船舶航行轨迹）
 *   drone    — 无人机监控点（可调度无人机部署位置）
 */
const vehicleData = ref([
	// 可疑车辆（凭祥）
	{id:30101,latitude:22.1825,longitude:106.7315,name:'凭祥·友谊关冷链车异常停靠',type:'vehicle',border:'凭祥市',unit:'交警大队',status:'warning',risk_level:'高',time:'08:15',metricA:'冷链车·桂F8U***',metricB:'停留超30分钟'},
	{id:30102,latitude:22.1085,longitude:106.7482,name:'凭祥·浦寨货车通道异常',type:'vehicle',border:'凭祥市',unit:'口岸专班',status:'pending',risk_level:'中',time:'09:42',metricA:'货车·桂F2L***',metricB:'夜间反复通行'},
	{id:30103,latitude:22.0725,longitude:106.7285,name:'凭祥·弄尧便道违停',type:'vehicle',border:'凭祥市',unit:'边境管理队',status:'investigating',risk_level:'中高',time:'14:20',metricA:'SUV·桂FL5***',metricB:'多次往返便道'},
	// 可疑车辆（东兴）
	{id:30111,latitude:21.5412,longitude:107.9762,name:'东兴·互市通道可疑皮卡',type:'vehicle',border:'东兴市',unit:'边境大队',status:'pending',risk_level:'高',time:'06:55',metricA:'皮卡·桂PT8***',metricB:'后斗满载'},
	{id:30112,latitude:21.4958,longitude:108.0218,name:'东兴·竹山便道行驶轨迹',type:'vehicle',border:'东兴市',unit:'水上缉私',status:'warning',risk_level:'高',time:'22:30',metricA:'SUV·桂PN9***',metricB:'绕关可疑'},
	// 水上载具（北仑河 / 水口河）
	{id:30121,latitude:21.5525,longitude:107.9815,name:'北仑河口无牌快艇异常航迹',type:'boat',border:'东兴市',unit:'水上巡逻队',status:'active',risk_level:'中',time:'07:00',metricA:'木船·无牌',metricB:'AIS未开启'},
	{id:30122,latitude:21.5488,longitude:107.9855,name:'北仑河口船舶轨迹②',type:'boat',border:'东兴市',unit:'水上巡逻队',status:'active',risk_level:'中',time:'08:30',metricA:'快艇·桂防***',metricB:'航行轨迹异常'},
	{id:30131,latitude:22.3585,longitude:106.3522,name:'水口河水上载具',type:'boat',border:'龙州县',unit:'水口大队',status:'investigating',risk_level:'中',time:'10:15',metricA:'货船·桂F0R***',metricB:'可疑停靠'},
	// 无人机监控点
	{id:30141,latitude:22.1188,longitude:106.7688,name:'凭祥·友谊关无人机',type:'drone',border:'凭祥市',unit:'特警快反',status:'active',risk_level:'低',time:'--',metricA:'DJI M300',metricB:'在线·执行任务'},
	{id:30142,latitude:22.0658,longitude:106.7158,name:'凭祥·浦寨上空无人机',type:'drone',border:'凭祥市',unit:'边防支队',status:'active',risk_level:'低',time:'--',metricA:'DJI Mavic 3',metricB:'在线·巡查中'},
	{id:30143,latitude:21.5125,longitude:107.9758,name:'东兴·北仑河低空巡检无人机',type:'drone',border:'东兴市',unit:'水上巡逻队',status:'active',risk_level:'低',time:'--',metricA:'DJI M300',metricB:'在线·夜航模式'},
	{id:30144,latitude:22.8565,longitude:106.7325,name:'大新·德天景区无人机',type:'drone',border:'大新县',unit:'旅游警察',status:'standby',risk_level:'低',time:'--',metricA:'DJI Mavic 2',metricB:'待命·景区巡护'},
	{id:30145,latitude:21.5885,longitude:108.0155,name:'东兴·万尾金滩无人机',type:'drone',border:'东兴市',unit:'海警工作站',status:'active',risk_level:'低',time:'--',metricA:'DJI M300',metricB:'在线·海岸巡查'}
])

// ==================== ��警命名体系（走私防控业务域） ====================
const ALERT_LEVEL_META = {
	critical: { color: '#FF4D4F', label: '紧急', bg: 'rgba(255,77,79,0.1)', border: 'rgba(255,77,79,0.35)', pulse: true },
	high:     { color: '#FFA940', label: '高危', bg: 'rgba(255,169,64,0.1)', border: 'rgba(255,169,64,0.35)', pulse: false },
	warning:  { color: '#FAAD14', label: '关注', bg: 'rgba(250,173,20,0.1)', border: 'rgba(250,173,20,0.3)', pulse: false },
	medium:   { color: '#FAAD14', label: '关注', bg: 'rgba(250,173,20,0.1)', border: 'rgba(250,173,20,0.3)', pulse: false },
	low:      { color: '#73D13D', label: '一般', bg: 'rgba(115,209,61,0.08)', border: 'rgba(115,209,61,0.25)', pulse: false },
	handled:  { color: '#8c8c8c', label: '已办', bg: 'rgba(140,140,140,0.08)', border: 'rgba(140,140,140,0.2)', pulse: false }
}

const CATEGORY_TABS_META = {
	wildlife: {
		label: '物种情报',
		icon: '🦎',
		emptyEmoji: '🔍',
		emptyText: '暂无活物走私情报',
		emptyHint: '活物走私监测中...',
		criticalLabel: '紧急走私',
		warningLabel: '高危线索',
		color: '#FF4D4F'
	},
	border: {
		label: '边境防线',
		icon: '🛡',
		emptyEmoji: '🏔',
		emptyText: '暂无边境防线预警',
		emptyHint: '边境异常入侵监测中...',
		criticalLabel: '严重入侵',
		warningLabel: '可疑活动',
		color: '#FFA940'
	},
	vehicle: {
		label: '车辆布控',
		icon: '🚗',
		emptyEmoji: '🚙',
		emptyText: '暂无车辆布控预警',
		emptyHint: '嫌疑车辆轨迹追踪中...',
		criticalLabel: '重点布控',
		warningLabel: '轨迹异常',
		color: '#00D4FF'
	}
}

const categoryTabs = [
	{value:'wildlife', label:'走私情报', iconKey:'species',  tabIconKey:'species',  slogan:'活物走私 · 联动研判'},
	{value:'border',   label:'边境防线', iconKey:'patrol',   tabIconKey:'patrol',   slogan:'入境监测 · 联勤联动'},
	{value:'vehicle',  label:'车辆布控', iconKey:'vehicle',  tabIconKey:'vehicle',  slogan:'车辆追踪 · 轨迹布控'}
]

// ==================== 态势条数据 ====================
const zoneInfo = ref({
	name: '广西边境五大战区 · 活物走私防控',
	onlineCount: 68,
	alertCount: 9,
	responseLevel: 2
})

// ==================== 顶部状态栏数据（整合自参考项目 StatusHeader） ====================
const gpsSignal = ref(16)
const battery = ref(85)
const isOfflineMap = ref(false)
const nodeStatusVal = ref('online')
const currentTime = ref('')
let timeTimer = null

const getBatteryIcon = computed(() => {
	if (battery.value > 80) return '/static/icons/battery-3.png'
	if (battery.value > 50) return '/static/icons/battery-2.png'
	if (battery.value > 20) return '/static/icons/battery-1.png'
	return '/static/icons/battery-0.png'
})

const getBatteryColor = computed(() => {
	if (battery.value > 50) return '#73D13D'
	if (battery.value > 20) return '#FFA940'
	return '#FF4D4F'
})

const getNodeStatusClass = computed(() => {
	const map = { online: 'cv-dot-online', warning: 'cv-dot-warning', offline: 'cv-dot-off' }
	return map[nodeStatusVal.value] || 'cv-dot-online'
})

const nodeStatusText = computed(() => {
	const map = { online: '节点在线', warning: '节点异常', offline: '节点离线' }
	return map[nodeStatusVal.value] || '未知'
})

function updateClock() {
	const now = new Date()
	const h = String(now.getHours()).padStart(2, '0')
	const m = String(now.getMinutes()).padStart(2, '0')
	const s = String(now.getSeconds()).padStart(2, '0')
	currentTime.value = h + ':' + m + ':' + s
}

// ==================== 测距模式 ====================
const measureMode = ref(false)

// ==================== 工具栏操作函数 ====================
const activeLayerCount = computed(() => {
	let count = 0
	const cat = activeCategory.value
	if (cat === 'wildlife') count = smugglingData.value.length
	else if (cat === 'border') count = borderControlData.value.length
	else if (cat === 'vehicle') count = smugglingData.value.filter(d => d.type === 'vehicle').length
	return Math.min(count, 99)
})

function openLayerDrawer() {
	uni.vibrateShort()
	layerDrawerOpen.value = true
}

function handleDispatchAction() {
	uni.vibrateShort()
	dispatchDialogVisible.value = true
}

function handleQuickCase() {
	uni.vibrateShort()
	uni.navigateTo({ url: '/pages/GIS/new-smuggling-case' })
}

function handleMeasure() {
	uni.vibrateShort()
	measureMode.value = !measureMode.value
	uni.showToast({ title: measureMode.value ? '测距模式已开启' : '测距模式已关闭', icon: 'none' })
}

function handleLocationAction() {
	uni.vibrateShort()
	uni.getLocation({
		type: 'gcj02',
		success: (res) => {
			mapCenter.value = { latitude: res.latitude, longitude: res.longitude }
			gpsSignal.value = 16
			uni.showToast({ title: '已定位到当前位置', icon: 'success' })
		},
		fail: () => {
			uni.showToast({ title: 'GPS信号弱', icon: 'none' })
			gpsSignal.value = Math.floor(Math.random() * 5) + 8
		}
	})
}

function handleNodeStatusTap() {
	uni.vibrateShort()
	const nodes = [
		{ name: '凭祥友谊关节点', status: 'online' },
		{ name: '东兴口岸节点', status: 'online' },
		{ name: '靖西岳圩节点', status: 'warning' }
	]
	const names = nodes.map(n => n.name + ' (' + (n.status === 'online' ? '在线' : n.status === 'warning' ? '告警' : '离线') + ')')
	uni.showActionSheet({
		itemList: names,
		success: () => { uni.vibrateShort() }
	})
}

const currentZone = computed(() => zoneInfo.value.name)
const onlineCount = computed(() => zoneInfo.value.onlineCount)
const alertCount = computed(() => zoneInfo.value.alertCount)
const responseLevel = computed(() => zoneInfo.value.responseLevel)
const responseLevelText = computed(() => {
	const texts = { 1: '常态', 2: '关注', 3: '警戒', 4: '紧急' }
	return texts[zoneInfo.value.responseLevel] || '常态'
})

/** 模拟数据同步时间 */
const syncTime = ref('')
const syncTimeText = computed(() => syncTime.value || '—')

/** 当前筛选类型的文字标签 */
const filterLabelMap = {
	enforcement: { checkpoint: '联勤卡口', patrol: '巡查巡组', sentry: '边防哨点' },
	border:     { checkpoint: '联勤卡口', patrol: '巡查巡组', sentry: '边防哨点' },
	vehicle:    { vehicle: '可疑车辆', boat: '水上载具', drone: '无人机' },
	wildlife:   { 'live-transport': '活体走私' }
}
const getFilterLabel = computed(() => {
	const map = filterLabelMap[activeCategory.value] || {}
	return map[layerTypeFilter.value] || layerTypeFilter.value || ''
})
const getFilterIcon = computed(() => markerIconMap[layerTypeFilter.value] || '/static/icons/default.png')
const getFilterSvgIcon = computed(() => {
	const keyMap = { checkpoint:'checkpoint', patrol:'patrol', sentry:'sentry', 'live-transport':'food', vehicle:'checkpoint', boat:'patrol', drone:'sentry' }
	return getIconSvg(keyMap[layerTypeFilter.value] || 'default')
})

/** 左侧面板底部标语：随分类切换 */
const leftSloganText = computed(() => {
	const s = CATEGORY_TABS_META[activeCategory.value]
	return s ? s.label + ' · ' + s.emptyHint.replace('监测中...', '') : '边境活物走私防控引领者'
})

/** ==================== 右侧工具栏分类工具（按 activeCategory 切换） ==================== */
const rightToolbarActions = {
	wildlife: [
		{key:'clue',    label:'线索核验', iconKey:'clue-verify', onTap:()=>handleWildlifeClue()},
		{key:'case',    label:'线索登记', iconKey:'add-case',   onTap:()=>handleCreateCase()},
		{key:'profile', label:'风险画像', iconKey:'risk-profile', onTap:()=>handleWildlifeProfile()}
	],
	border: [
		{key:'verify', label:'现场核验', iconKey:'site-verify', onTap:()=>handleVerify()},
		{key:'trace',  label:'轨迹核查', iconKey:'trace',       onTap:()=>handleViewHistory()},
		{key:'risk',   label:'风险研判', iconKey:'risk-judge',  onTap:()=>handleDiagnose()}
	],
	vehicle: [
		{key:'check', label:'车辆核查', iconKey:'vehicle-check', onTap:()=>handleVehicleCheck()},
		{key:'trace', label:'轨迹追踪', iconKey:'trace',         onTap:()=>handleViewHistory()},
		{key:'risk',  label:'风险研判', iconKey:'risk-judge',    onTap:()=>handleDiagnose()}
	]
}

/** 当前右侧工具栏分类工具（computed 动态切换） */
const currentRightToolbarActions = computed(() => rightToolbarActions[activeCategory.value] || [])

/** 取消当前筛选（清空 filter，恢复显示全部） */
const clearTypeFilter = () => {
	feedbackTap()
	layerTypeFilter.value = null
	uni.showToast({ title: '已恢复全部态势', icon: 'none' })
}

/**
 * 统一定位权限前置说明
 * @param {string} purpose 弹窗中说明用途
 * @param {function} onGranted 授权成功后的回调（传入 { latitude, longitude }）
 * @param {function} [onDenied] 拒绝后的回调
 */
function requestLocation(purpose, onGranted, onDenied) {
	uni.showModal({
		title: '位置权限申请',
		content: `「热眼擒枭」需要获取您的位置信息，${purpose}。\n\n首次授权请在提示框选择「允许」，之后可在微信设置中管理位置权限。`,
		confirmText: '去授权',
		cancelText: '取消',
		success: (res) => {
			if (!res.confirm) {
				onDenied && onDenied()
				return
			}
			uni.getLocation({
				type: 'gcj02',
				success: (r) => onGranted(r),
				fail: (err) => {
					const msg = err.errMsg || ''
					if (msg.includes('auth deny') || msg.includes('auth reject')) {
						uni.showModal({
							title: '授权被拒绝',
							content: '请在微信中打开「发现 → 小程序 → 热眼擒枭 → … → 设置」，将「位置信息」设为「允许」。',
							showCancel: false
						})
					} else {
						uni.showToast({ title: '定位失败（' + (err.errMsg || '未知错误') + '）', icon: 'none', duration: 3000 })
					}
					onDenied && onDenied()
				}
			})
		}
	})
}

// ==================== 状态 ====================
const mapCenter = ref({latitude:22.105,longitude:106.757})
const mapScale = ref(11)
const activeCategory = ref('wildlife')
const sensorPopupVisible = ref(false)
const selectedSensor = ref(null)
/** 最近一次点选的地图要素（关闭弹窗后仍可用于底部「核查」等操作） */
const lastMapSelection = ref(null)
const layerDrawerOpen = ref(false)
const dispatchDialogVisible = ref(false)
const verifyResultVisible = ref(false)
const verifyResultData = ref(null)
const vehicleCheckVisible = ref(false)
const vehicleCheckData = ref(null)
const traceCheckVisible = ref(false)
const traceTimeOptions = [
	{ label: '24小时内', value: '24h' },
	{ label: '48小时内', value: '48h' },
	{ label: '72小时内', value: '72h' },
	{ label: '其他时间', value: 'custom' }
]
const selectedTraceTime = ref('24h')
const customTraceHours = ref('')
const bottomActionLoading = ref({})
/** 图层面板点选后的类型筛选（与当前态势分类联动） */
const layerTypeFilter = ref(null)
/** 线索核验面板显隐 */
const clueVerifyVisible = ref(false)
/** 风险画像面板显隐 */
const riskProfileVisible = ref(false)

/**
 * 全屏浮层打开时隐藏 map 内 cover-view。
 * 微信小程序：map 内 cover-view 为原生层，会盖住 map 外的普通 view，导致联动采样等面板被遮挡。
 */
const mapOverlaysSuppressed = computed(
	() =>
		dispatchDialogVisible.value ||
		verifyResultVisible.value ||
		vehicleCheckVisible.value ||
		traceCheckVisible.value ||
		clueVerifyVisible.value ||
		riskProfileVisible.value
)

/** 打开全屏浮层前收起地图内弹层，避免状态残留 */
function dismissMapChromeForPanel() {
	closeLayerDrawer()
	closeSensorPopup()
}

/** 地图当前视野范围（用于分片加载） */
const visibleRegion = ref({ latMin: 0, latMax: 90, lngMin: 0, lngMax: 180 })
const mapCtx = ref(null)

/**
 * 根据缩放级别决定视野半径（度数），scale 越大视野越小
 * scale 5 ≈ ±10°，scale 10 ≈ ±0.5°，scale 15 ≈ ±0.03°
 */
function regionRadiusForScale(scale) {
	const r = 180 / Math.pow(2, scale - 3)
	return Math.max(0.01, Math.min(r, 180))
}

// ==================== 图层统计 ====================
const enforcementLayerStats = computed(() => {
	const sentries = borderControlData.value.filter((d) => d.type === 'sentry')
	const sentryAlert = sentries.some((d) => d.status === 'warning')
	return [
		{type:'checkpoint',label:'联勤卡口',iconKey:'checkpoint',count:borderControlData.value.filter(d=>d.type==='checkpoint').length,status:'active',statusText:'在线'},
		{type:'patrol',label:'巡查巡组',iconKey:'patrol',count:borderControlData.value.filter(d=>d.type==='patrol').length,status:'active',statusText:'执勤中'},
		{type:'sentry',label:'边防哨点',iconKey:'sentry',count:sentries.length,status:sentryAlert?'warning':'active',statusText:sentryAlert?'告警':'正常'}
	]
})

const enforcementStats = computed(() => ({
	online: borderControlData.value.filter(d=>d.status==='active'||d.status==='on_duty').length,
	patrol: 42,
	alert: borderControlData.value.filter(d=>d.status==='warning').length,
	route: borderControlData.value.filter(d=>d.type==='patrol').length,
	sentry: borderControlData.value.filter(d=>d.type==='sentry'||d.type==='checkpoint').length
}))

/** 濒危物种线索统计 */
const wildlifeLayerStats = computed(() => [
	{type:'live-transport',label:'活物走私线索',iconKey:'food',count:smugglingData.value.filter(d=>d.type==='live-transport').length,riskLevel:'high',riskText:'高风险'}
])

/** 濒危物种统计 */
const wildlifeStats = computed(() => ({
	pending: smugglingData.value.filter(d=>d.status==='pending').length,
	investigating: smugglingData.value.filter(d=>d.status==='investigating').length,
	resolved: smugglingData.value.filter(d=>d.status==='handled'||d.status==='resolved').length,
	route: [...new Set(smugglingData.value.map(d=>d.border))].length,
	risk: smugglingData.value.filter(d=>d.risk_level==='高'||d.risk_level==='高风险').length
}))

/** 边境入侵统计 */
const borderStats = computed(() => ({
	pending: smugglingData.value.filter(d=>d.status==='pending').length,
	investigating: smugglingData.value.filter(d=>d.status==='investigating').length,
	resolved: smugglingData.value.filter(d=>d.status==='handled'||d.status==='resolved').length,
	route: [...new Set(smugglingData.value.map(d=>d.border))].length,
	risk: smugglingData.value.filter(d=>d.risk_level==='高'||d.risk_level==='高风险').length
}))

/** 边境入侵图层统计 */
const borderLayerStats = computed(() => [
	{type:'checkpoint',label:'联勤卡口',iconKey:'checkpoint',count:borderControlData.value.filter(d=>d.type==='checkpoint').length,status:'active',statusText:'在线'},
	{type:'patrol',label:'巡查巡组',iconKey:'patrol',count:borderControlData.value.filter(d=>d.type==='patrol').length,status:'active',statusText:'执勤中'},
	{type:'sentry',label:'边防哨点',iconKey:'sentry',count:borderControlData.value.filter(d=>d.type==='sentry').length,status:borderControlData.value.some(d=>d.type==='sentry'&&d.status==='warning')?'warning':'active',statusText:borderControlData.value.some(d=>d.type==='sentry'&&d.status==='warning')?'告警':'正常'}
])

/** 可疑车辆统计 */
const vehicleStats = computed(() => ({
	pending: smugglingData.value.filter(d=>d.status==='pending').length,
	investigating: smugglingData.value.filter(d=>d.status==='investigating').length,
	resolved: smugglingData.value.filter(d=>d.status==='handled'||d.status==='resolved').length,
	route: [...new Set(smugglingData.value.map(d=>d.border))].length,
	risk: smugglingData.value.filter(d=>d.risk_level==='高'||d.risk_level==='高风险').length
}))

/** 可疑车辆图层统计 */
const vehicleLayerStats = computed(() => [
	{type:'vehicle',label:'可疑车辆轨迹',iconKey:'checkpoint',count:8,riskLevel:'high',riskText:'重点关注'},
	{type:'boat',label:'水上载具',iconKey:'patrol',count:borderControlData.value.filter(d=>d.type==='patrol').length,status:'active',statusText:'正常'},
	{type:'drone',label:'无人机监控',iconKey:'sentry',count:5,status:'active',statusText:'在线'}
])

/** 图层标题 */
const getDrawerTitle = computed(() => ({
	enforcement: '执法巡查图层',
	border: '执法巡查图层',
	vehicle: '执法巡查图层',
	wildlife: '热眼擒枭预警图层'
}[activeCategory.value]))

const getDrawerSubtitle = computed(() => {
	const subtitles = {
		enforcement: '卡口哨点 · 巡查轨迹 · 联勤态势',
		border: '卡口哨点 · 巡查轨迹 · 联勤态势',
		vehicle: '卡口哨点 · 巡查轨迹 · 联勤态势',
		wildlife: '活物走私线索 · 影子追踪 · 联动研判'
	}
	return subtitles[activeCategory.value]
})

// ==================== 地图元素 ====================
// ==================== 地图轨迹线（按分类动态切换） ====================
/**
 * 物种情报（wildlife）：无折线，纯点位展示
 * 边境防线（border）：边境巡逻轨迹线（青色）
 * 车辆布控（vehicle）：车辆轨迹线（橙色）+ 水上载具轨迹（蓝色）+ 无人机飞行路径（紫色虚线）
 */
const patrolLines = computed(() => {
	const cat = activeCategory.value

	if (cat === 'wildlife') {
		// 走私情报：仅显示走私热点连接线（淡红色虚线），辅助点位感知
		return [
			// 凭祥→东兴走私热点带
			{ points: [
				{ latitude: 22.1825, longitude: 106.7288 },
				{ latitude: 21.5088, longitude: 107.9622 }
			], color: '#FF4D4F66', width: 2, dottedLine: true },
			// 凭祥内部热点
			{ points: [
				{ latitude: 22.1825, longitude: 106.7288 },
				{ latitude: 22.0755, longitude: 106.7355 }
			], color: '#FF4D4F44', width: 2, dottedLine: true }
		]
	}

	if (cat === 'border') {
		// 边境防线：边境巡逻轨迹（青色实线）
		return [
			// 凭祥友谊关巡逻线
			{ points: [
				{ latitude: 22.1188, longitude: 106.7688 },
				{ latitude: 22.1093, longitude: 106.7557 },
				{ latitude: 22.0962, longitude: 106.7421 }
			], color: '#00D4FFAA', width: 4, dottedLine: false },
			// 东兴北仑河巡逻线
			{ points: [
				{ latitude: 21.5525, longitude: 107.9815 },
				{ latitude: 21.5488, longitude: 107.9855 },
				{ latitude: 21.5158, longitude: 107.9685 }
			], color: '#00D4FFAA', width: 4, dottedLine: false },
			// 龙邦→岳圩边境段
			{ points: [
				{ latitude: 22.8528, longitude: 106.3935 },
				{ latitude: 23.1288, longitude: 106.4125 },
				{ latitude: 23.0955, longitude: 106.3822 }
			], color: '#00D4FF88', width: 3, dottedLine: false }
		]
	}

	if (cat === 'vehicle') {
		// 车辆布控：车辆轨迹（橙色）+ 水上载具（蓝色）+ 无人机路径（紫色虚线）
		return [
			// 凭祥车辆轨迹
			{ points: [
				{ latitude: 22.1825, longitude: 106.7315 },
				{ latitude: 22.1188, longitude: 106.7482 },
				{ latitude: 22.1085, longitude: 106.7482 }
			], color: '#FFA940CC', width: 5, dottedLine: false },
			// 东兴车辆轨迹
			{ points: [
				{ latitude: 21.5412, longitude: 107.9762 },
				{ latitude: 21.4958, longitude: 108.0218 }
			], color: '#FFA940CC', width: 5, dottedLine: false },
			// 北仑河水上载具轨迹
			{ points: [
				{ latitude: 21.5525, longitude: 107.9815 },
				{ latitude: 21.5488, longitude: 107.9855 }
			], color: '#1677FFAA', width: 4, dottedLine: false },
			// 无人机飞行路径（虚线）
			{ points: [
				{ latitude: 22.1188, longitude: 106.7688 },
				{ latitude: 22.1085, longitude: 106.7550 },
				{ latitude: 22.0962, longitude: 106.7480 }
			], color: '#722ED1CC', width: 3, dottedLine: true }
		]
	}

	// 默认：空
	return []
})

// ==================== 盲区续追可视化数据（影子追踪 V2.0） ====================
// 模拟山林/隧道等监控盲区，及其内的追踪目标
const blindZones = ref([
	// 山林盲区（凭祥友谊关附近）
	{
		id: 'blind-001',
		name: '友谊关山林盲区',
		type: 'forest',
		terrainCoeff: 0.5, // 山林地形，速度衰减 50%
		polygon: [
			{latitude: 22.1850, longitude: 106.7200},
			{latitude: 22.1900, longitude: 106.7280},
			{latitude: 22.1860, longitude: 106.7350},
			{latitude: 22.1800, longitude: 106.7300},
		],
		color: 'rgba(255, 100, 50, 0.25)',
		borderColor: '#FF6432'
	},
		// 隧道盲区（东兴北仑河段）
	{
		id: 'blind-002',
		name: '北仑河隧道段',
		type: 'tunnel',
		terrainCoeff: 0.3, // 隧道受限，速度衰减 70%
		polygon: [
			{latitude: 21.5500, longitude: 107.9650},
			{latitude: 21.5520, longitude: 107.9700},
			{latitude: 21.5480, longitude: 107.9720},
			{latitude: 21.5460, longitude: 107.9680},
		],
		color: 'rgba(150, 80, 200, 0.25)',
		borderColor: '#9650C8'
	},
	// 凭祥·油隘便道盲区（凭祥市西南部）
	{
		id: 'blind-003',
		name: '油隘便道盲区',
		type: 'forest',
		terrainCoeff: 0.6,
		polygon: [
			{latitude: 22.0380, longitude: 106.6900},
			{latitude: 22.0420, longitude: 106.6980},
			{latitude: 22.0360, longitude: 106.7020},
			{latitude: 22.0320, longitude: 106.6940},
		],
		color: 'rgba(255, 100, 50, 0.18)',
		borderColor: '#FF6432'
	},
	// 东兴·竹山便道盲区（东兴市西北部）
	{
		id: 'blind-004',
		name: '竹山便道盲区',
		type: 'forest',
		terrainCoeff: 0.55,
		polygon: [
			{latitude: 21.4920, longitude: 108.0180},
			{latitude: 21.4960, longitude: 108.0280},
			{latitude: 21.4900, longitude: 108.0320},
			{latitude: 21.4860, longitude: 108.0220},
		],
		color: 'rgba(255, 100, 50, 0.18)',
		borderColor: '#FF6432'
	},
	// 东兴·万尾金滩盲区（海防监控盲区）
	{
		id: 'blind-005',
		name: '万尾金滩盲区',
		type: 'tunnel',
		terrainCoeff: 0.4,
		polygon: [
			{latitude: 21.5020, longitude: 108.0050},
			{latitude: 21.5060, longitude: 108.0150},
			{latitude: 21.4980, longitude: 108.0180},
			{latitude: 21.4940, longitude: 108.0080},
		],
		color: 'rgba(150, 80, 200, 0.18)',
		borderColor: '#9650C8'
	},
	// 凭祥·浦寨互市盲区（弄尧互市区）
	{
		id: 'blind-006',
		name: '浦寨互市盲区',
		type: 'forest',
		terrainCoeff: 0.7,
		polygon: [
			{latitude: 22.0720, longitude: 106.7260},
			{latitude: 22.0760, longitude: 106.7340},
			{latitude: 22.0700, longitude: 106.7380},
			{latitude: 22.0660, longitude: 106.7300},
		],
		color: 'rgba(255, 100, 50, 0.15)',
		borderColor: '#FF6432'
	}
])

// 模拟正在盲区内被追踪的目标（凭祥 + 东��多目标）
const shadowTrackingTargets = ref([
	// ===== 凭祥 =====
	{
		id: 1,
		name: '可疑人员A',
		speed: 2.5,
		direction: 45,
		lastPosition: { latitude: 22.1830, longitude: 106.7250 },
		lastUpdateTime: Date.now() - 30000,
		terrainCoeff: 0.5,
		confidence: 82,
		status: 'shadow-tracked',
		color: '#FF9500',
		shadowTrail: []
	},
	{
		id: 2,
		name: '可疑车辆①',
		speed: 8.0,
		direction: 120,
		lastPosition: { latitude: 22.0725, longitude: 106.7285 },
		lastUpdateTime: Date.now() - 45000,
		terrainCoeff: 0.7,
		confidence: 74,
		status: 'shadow-tracked',
		color: '#FF4D4F',
		shadowTrail: []
	},
	{
		id: 3,
		name: '走私团伙③',
		speed: 1.8,
		direction: 240,
		lastPosition: { latitude: 22.0390, longitude: 106.6940 },
		lastUpdateTime: Date.now() - 60000,
		terrainCoeff: 0.6,
		confidence: 91,
		status: 'shadow-tracked',
		color: '#FF9500',
		shadowTrail: []
	},
	// ===== 东兴 =====
	{
		id: 4,
		name: '可疑人员B',
		speed: 3.2,
		direction: 315,
		lastPosition: { latitude: 21.5508, longitude: 107.9685 },
		lastUpdateTime: Date.now() - 20000,
		terrainCoeff: 0.3,
		confidence: 67,
		status: 'shadow-tracked',
		color: '#FF9500',
		shadowTrail: []
	},
	{
		id: 5,
		name: '可疑人员C',
		speed: 2.0,
		direction: 80,
		lastPosition: { latitude: 21.4930, longitude: 108.0225 },
		lastUpdateTime: Date.now() - 50000,
		terrainCoeff: 0.55,
		confidence: 88,
		status: 'shadow-tracked',
		color: '#FF9500',
		shadowTrail: []
	},
	{
		id: 6,
		name: '水上可疑载具',
		speed: 5.5,
		direction: 180,
		lastPosition: { latitude: 21.5040, longitude: 108.0100 },
		lastUpdateTime: Date.now() - 35000,
		terrainCoeff: 0.4,
		confidence: 79,
		status: 'shadow-tracked',
		color: '#FF4D4F',
		shadowTrail: []
	}
])

// 影子追踪 V2.0：计算盲区目标预测轨迹
function calculateShadowTrail(target, blindZone) {
	const timeElapsed = (Date.now() - target.lastUpdateTime) / 1000 // 秒
	const terrainCoeff = blindZone.terrainCoeff || 1.0

	// 地形修正后的有效速度
	const effectiveSpeed = target.speed * terrainCoeff

	// 生成沿运动方向的多段预测点（每3秒一个点，共5段）
	const points = [{ ...target.lastPosition }]
	const rad = target.direction * Math.PI / 180

	for (let t = 3; t <= 15; t += 3) {
		const dist = effectiveSpeed * t
		const dLat = (dist * Math.cos(rad)) / 111000
		const dLng = (dist * Math.sin(rad)) / (111000 * Math.cos(target.lastPosition.latitude * Math.PI / 180))
		points.push({
			latitude: target.lastPosition.latitude + dLat,
			longitude: target.lastPosition.longitude + dLng
		})
	}
	return points
}

// 计算所有影子追踪轨迹的 polyline 配置
const shadowTrackPolylines = computed(() => {
	const lines = []
	shadowTrackingTargets.value.forEach(target => {
		if (target.status === 'shadow-tracked') {
			// 找到目标所在的盲区
			const zone = blindZones.value.find(z =>
				target.lastPosition.latitude >= Math.min(...z.polygon.map(p => p.latitude)) &&
				target.lastPosition.latitude <= Math.max(...z.polygon.map(p => p.latitude)) &&
				target.lastPosition.longitude >= Math.min(...z.polygon.map(p => p.longitude)) &&
				target.lastPosition.longitude <= Math.max(...z.polygon.map(p => p.longitude))
			)
			const trail = calculateShadowTrail(target, zone || { terrainCoeff: 1.0 })

			// 实测轨迹段（目标最后已知位置之前的轨迹）
			lines.push({
				points: [{ latitude: 22.1800, longitude: 106.7600 }, target.lastPosition],
				color: target.color + 'CC',
				width: 3,
				dottedLine: false
			})

			// 影子预测段（虚线，盲区内的预测轨迹）
			lines.push({
				points: trail,
				color: target.color + '66',
				width: 3,
				dottedLine: true
			})

			// 预测终点标记（半透明脉冲圆）
		}
	})
	return lines
})

// 影子追踪目标在地图上的标记点
const shadowTrackMarkers = computed(() => {
	return shadowTrackingTargets.value
		.filter(t => t.status === 'shadow-tracked')
		.map(target => ({
			id: target.id,
			latitude: target.lastPosition.latitude,
			longitude: target.lastPosition.longitude,
			width: 28,
			height: 28,
			iconPath: '/static/icons/sos.png',
			title: `影子追踪: ${target.name}`,
			callout: {
				content: `🔮影子追踪中 | 置信度 ${target.confidence}%`,
				color: '#FF9500',
				fontSize: 11,
				borderRadius: 6,
				padding: 6,
				display: 'ALWAYS',
				bgColor: 'rgba(20, 10, 0, 0.92)'
			}
		}))
})

// 将影子追踪折线合并到 patrolLines
const allMapPolylines = computed(() => {
	return [...patrolLines.value, ...shadowTrackPolylines.value]
})

// 将影子追踪标记合并到 displayMarkers
const allMapMarkers = computed(() => {
	return [...displayMarkers.value, ...shadowTrackMarkers.value]
})

// 盲区多边形渲染（使用 circles 近似多边形——取盲区中心点作为圆心，
// 实际多边形由 JS 端渲染提示文字，地图端用虚线圆模拟盲区范围）
const blindZoneCircles = computed(() => {
	return blindZones.value.map(zone => {
		const lats = zone.polygon.map(p => p.latitude)
		const lngs = zone.polygon.map(p => p.longitude)
		const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
		const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
		// 估算盲区半径
		const latRange = (Math.max(...lats) - Math.min(...lats)) * 111000
		const lngRange = (Math.max(...lngs) - Math.min(...lngs)) * 111000
		const radius = Math.max(latRange, lngRange) * 0.7

		return {
			id: zone.id,
			latitude: centerLat,
			longitude: centerLng,
			color: zone.borderColor + '88',
			fillColor: zone.color,
			radius,
			strokeWidth: 2,
			strokeColor: zone.borderColor
		}
	})
})

// 合并盲区圆到 riskCircles
const allMapCircles = computed(() => {
	return [...riskCircles.value, ...blindZoneCircles.value]
})

// ==================== 盲区提示气泡状态 ====================
const blindZoneHint = ref(null) // 当前显示的盲区提示
let blindZoneHintTimer = null

function showBlindZoneHint(target) {
	blindZoneHint.value = {
		name: target.name,
		confidence: target.confidence,
		since: new Date(target.lastUpdateTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
		terrain: target.terrainCoeff < 0.5 ? '山林/隧道' : '丘陵'
	}
	if (blindZoneHintTimer) clearTimeout(blindZoneHintTimer)
	blindZoneHintTimer = setTimeout(() => { blindZoneHint.value = null }, 5000)
}
const riskCircles = ref([
	{latitude:22.1188,longitude:106.7688,color:'#FF4D4F33',fillColor:'#FF4D4F22',radius:800,strokeWidth:2}
])

function feedbackTap() {
	try {
		uni.vibrateShort({ type: 'light' })
	} catch (e) { /* 部分模拟器不支持 */ }
}

// ==================== 图层切换 ====================
// ecology / fooddrug 相关逻辑已移除（与环境监测、食药违法主线不符）
function tapEcologyLayer(kind) { /* 已废弃 */ }
function handleEcologyLocateSample() { /* 已废弃 */ }


// ==================== iconfont 图标解析 ====================
/** 根据图标 key 获取 SVG URI（用于 cover-image） */
const getIconSvg = (key) => iconSvgUri[key] || iconSvgUri['default'] || ''

const currentData = computed(() => {
	switch(activeCategory.value) {
		case 'wildlife': return smugglingData.value
		case 'border':   return borderControlData.value
		case 'vehicle':  return vehicleData.value
		default:         return smugglingData.value
	}
})
const currentActionButtons = computed(() => toolbarActionsByCategory[activeCategory.value])
const activeToolbarTitle = computed(() => {
	const titles = {wildlife:'研判工具',border:'执法工具',vehicle:'执法工具'}
	return titles[activeCategory.value]
})

// ==================== Marker 图标映射 ====================
const markerIconMap = {
	// 物种情报（wildlife）
	'live-transport': '/static/icons/food.png',
	// 边境防线（border）
	checkpoint:      '/static/icons/checkpoint.png',
	patrol:          '/static/icons/drone.png',
	sentry:          '/static/icons/boundary-marker.png',
	// 车辆布控（vehicle）
	vehicle:         '/static/icons/vehicle.png',
	boat:            '/static/icons/patrol.png',
	drone:           '/static/icons/drone.png'
}

const displayMarkers = computed(() => {
	// 1. 类型筛选
	const typeFiltered = layerTypeFilter.value
		? currentData.value.filter((d) => d.type === layerTypeFilter.value)
		: currentData.value
	// 2. 视野分片：只渲染落在当前地图可见范围内的点
	const { latMin, latMax, lngMin, lngMax } = visibleRegion.value
	const inView = typeFiltered.filter((d) => {
		return d.latitude >= latMin && d.latitude <= latMax
			&& d.longitude >= lngMin && d.longitude <= lngMax
	})
	// 视野外剩余点数提示（态势条已显示）
	return inView.map(item => ({
		id: item.id,
		latitude: item.latitude,
		longitude: item.longitude,
		width: 36,
		height: 36,
		iconPath: markerIconMap[item.type] || '/static/icons/default.png',
		title: item.name,
		callout: {
			content: item.name,
			color: '#EAF6FF',
			fontSize: 12,
			borderRadius: 6,
			padding: 6,
			display: 'ALWAYS',
			bgColor: 'rgba(8, 14, 24, 0.92)'
		}
	}))
})

// ==================== 底部按钮 ====================
const bottomActions = {
	wildlife: [
		{key:'dispatch',label:'一键派警',iconKey:'dispatch',className:'cv-bottom-btn-red',onTap:()=>openDispatchDialog()},
		{key:'clue',label:'线索核验',iconKey:'clue-verify',className:'cv-bottom-btn-blue',onTap:()=>handleWildlifeClue()},
		{key:'case',label:'线索登记',iconKey:'add-case',className:'cv-bottom-btn-dark',onTap:()=>handleCreateCase()}
	],
	border: [
		{key:'dispatch',label:'一键派警',iconKey:'dispatch',className:'cv-bottom-btn-red',onTap:()=>openDispatchDialog()},
		{key:'verify',label:'现场核验',iconKey:'site-verify',className:'cv-bottom-btn-blue',onTap:()=>handleVerify()},
		{key:'risk',label:'风险研判',iconKey:'risk-judge',className:'cv-bottom-btn-dark',onTap:()=>handleDiagnose()}
	],
	vehicle: [
		{key:'dispatch',label:'一键派警',iconKey:'dispatch',className:'cv-bottom-btn-red',onTap:()=>openDispatchDialog()},
		{key:'check',label:'车辆核查',iconKey:'vehicle-check',className:'cv-bottom-btn-blue',onTap:()=>handleVehicleCheck()},
		{key:'trace',label:'轨迹追踪',iconKey:'trace',className:'cv-bottom-btn-dark',onTap:()=>handleViewHistory()}
	]
}

const currentBottomActions = computed(() => bottomActions[activeCategory.value] || bottomActions.wildlife)

// ==================== 弹窗标签计算 ====================
const popupMetricALabel = computed(() => {
	const labels = {wildlife:'物种类型',border:'实时警力',vehicle:'车辆特征'}
	return labels[activeCategory.value]
})
const popupMetricBLabel = computed(() => {
	const labels = {wildlife:'涉案数量',border:'装备状态',vehicle:'轨迹方向'}
	return labels[activeCategory.value]
})
const popupRiskLabel = computed(() => {
	const labels = {wildlife:'风险等级',border:'风险等级',vehicle:'风险等级'}
	return labels[activeCategory.value]
})
const popupTimeLabel = computed(() => {
	const labels = {wildlife:'发现时间',border:'最后上报',vehicle:'发现时间'}
	return labels[activeCategory.value]
})
const popupSecondaryText = computed(() => {
	const texts = {wildlife:'线索核验',border:'轨迹核查',vehicle:'轨迹追踪'}
	return texts[activeCategory.value]
})
const popupPrimaryText = computed(() => {
	const texts = {wildlife:'立案研判',border:'联动研判',vehicle:'风险研判'}
	return texts[activeCategory.value]
})

// ==================== 方法 ====================
const getCategoryCount = (category) => {
	switch(category) {
		case 'wildlife': return smugglingData.value.length
		case 'border':   return borderControlData.value.length
		case 'vehicle':  return vehicleData.value.length
		default:         return smugglingData.value.length
	}
}

const handleCategoryChange = (category) => {
	activeCategory.value = category
	layerTypeFilter.value = null
	lastMapSelection.value = null
	closeLayerDrawer()
	closeSensorPopup()
}

const applyDrawerCategory = (category) => handleCategoryChange(category)

const handleLayerChange = () => { layerDrawerOpen.value = !layerDrawerOpen.value }
const closeLayerDrawer = () => { layerDrawerOpen.value = false }

const filterByType = (type) => {
	feedbackTap()
	layerTypeFilter.value = layerTypeFilter.value === type ? null : type
	const first = currentData.value.find((d) => d.type === type)
	if (first && layerTypeFilter.value) {
		mapCenter.value = { latitude: first.latitude, longitude: first.longitude }
		mapScale.value = 12
	}
	uni.showToast({
		title: layerTypeFilter.value ? '已筛选该类型并居中地图' : '已显示当前态势全部点位',
		icon: 'none'
	})
	closeLayerDrawer()
}

const getSensorEmoji = (type) => {
	const emojiMap = {
		checkpoint:'🛂',patrol:'🚓',sentry:'🎯',
		'live-transport':'📦',
		officer:'🛡️',smuggling:'🐾'
	}
	return emojiMap[type] || '📍'
}

const getStatusText = (status) => {
	const texts = {
		on_duty:'联勤在线',active:'运行正常',pending:'待核查',
		investigating:'研判中',warning:'异常波动'
	}
	return texts[status] || '未知'
}

/** 风险等级中文 -> WXSS 安全类名后缀（禁止中文类名，小程序编译器会报错） */
const riskLevelToClass = (level) => {
	const map = {
		高: 'high',
		中高: 'medium',
		中: 'medium',
		低: 'low',
		黄色: 'yellow',
		蓝色: 'blue',
		绿色: 'green'
	}
	return map[level] || 'medium'
}

function handleMarkerTap(e) {
	const m = currentData.value.find(item => item.id === e.detail.markerId)
	if (!m) return
	selectedSensor.value = m
	lastMapSelection.value = m
	sensorPopupVisible.value = true
	layerDrawerOpen.value = false
}

const closeSensorPopup = () => {
	sensorPopupVisible.value = false
	selectedSensor.value = null
}

const handleMapTap = () => {
	closeSensorPopup()
	closeLayerDrawer()
	lastMapSelection.value = null
}

function handleRegionChange(e) {
	const type = e.detail.type
	// 视野变化时更新可见范围（触发 computed 重算 displayMarkers）
	if (type === 'regionchange' || type === undefined) {
		// 用当前 mapCenter + scale 估算视野矩形（简单实用，无需 mapCtx）
		const { latitude, longitude } = mapCenter.value
		const r = regionRadiusForScale(mapScale.value)
		visibleRegion.value = {
			latMin: latitude - r,
			latMax: latitude + r,
			lngMin: longitude - r,
			lngMax: longitude + r
		}
	}
}

// 派警相关
const openDispatchDialog = () => {
	dispatchDialogVisible.value = true
}

const closeDispatchDialog = () => {
	dispatchDialogVisible.value = false
}

function closeVerifyResult() {
	verifyResultVisible.value = false
	verifyResultData.value = null
}

function closeVehicleCheck() {
	vehicleCheckVisible.value = false
	vehicleCheckData.value = null
}

function closeTraceCheck() {
	traceCheckVisible.value = false
	selectedTraceTime.value = '24h'
	customTraceHours.value = ''
}

function getTraceHoursValue() {
	if (selectedTraceTime.value === 'custom') {
		const parsed = parseInt(customTraceHours.value, 10)
		return Number.isFinite(parsed) && parsed > 0 ? parsed : null
	}
	const map = { '24h': 24, '48h': 48, '72h': 72 }
	return map[selectedTraceTime.value] || 24
}

function submitTraceCheck() {
	const hours = getTraceHoursValue()
	if (!hours) {
		uni.showToast({ title: '请输入有效的小时数', icon: 'none' })
		return
	}
	const target = lastMapSelection.value || selectedSensor.value
	traceCheckVisible.value = false
	uni.showLoading({ title: '加载轨迹数据...' })
	setTimeout(() => {
		uni.hideLoading()
		uni.showToast({
			title: target ? `已加载「${target.name}」近${hours}小时轨迹` : `已加载近${hours}小时轨迹记录`,
			icon: 'success'
		})
	}, 900)
}

const confirmDispatch = () => {
	uni.showLoading({title:'派警中...'})
	setTimeout(() => {
		uni.hideLoading()
		uni.showToast({title:'派警成功，已调度最近的巡组前往',icon:'success'})
		closeDispatchDialog()
		// 更新态势条数据模拟
		zoneInfo.value.alertCount++
	}, 1000)
}

const handleVehicleCheck = () => {
	feedbackTap()
	const target = lastMapSelection.value || selectedSensor.value
	if (!target) {
		uni.showModal({
			title: '车辆核查',
			content: '请先在地图上点击可疑车辆、水上载具或无人机点位，再发起核查。',
			showCancel: false
		})
		return
	}
	closeSensorPopup()
	closeLayerDrawer()
	const schemeMap = {
		vehicle: {
			team: '路面布控组',
			action: '调取过车记录与布控轨迹',
			eta: '4分钟',
			statusText: target.status === 'warning' ? '重点核查' : '已接入布控',
			statusClass: target.status === 'warning' ? 'warning' : 'active',
			progress: target.status === 'warning' ? 82 : 66,
			steps: [
				{ label: '轨迹锁定', done: true },
				{ label: '卡口比对', done: true },
				{ label: '联动拦截', done: target.status === 'warning' },
				{ label: '结果回传', done: false }
			]
		},
		boat: {
			team: '水域巡查组',
			action: '核验航迹与AIS数据',
			eta: '6分钟',
			statusText: '水域核验中',
			statusClass: 'active',
			progress: 61,
			steps: [
				{ label: '航迹回放', done: true },
				{ label: 'AIS核验', done: true },
				{ label: '水面贴靠', done: false },
				{ label: '结果回传', done: false }
			]
		},
		drone: {
			team: '低空巡控组',
			action: '核验飞行任务与回传画面',
			eta: '2分钟',
			statusText: '低空复核中',
			statusClass: 'active',
			progress: 74,
			steps: [
				{ label: '飞手确认', done: true },
				{ label: '画面回传', done: true },
				{ label: '目标复核', done: true },
				{ label: '结果回传', done: false }
			]
		}
	}
	const scheme = schemeMap[target.type] || schemeMap.vehicle
	vehicleCheckData.value = {
		target,
		workOrderCode: 'VC-' + String(Date.now()).slice(-6),
		reportTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
		...scheme
	}
	vehicleCheckVisible.value = true
}

// 现场核查：依赖最近一次点选要素
const handleVerify = () => {
	feedbackTap()
	const target = lastMapSelection.value
	if (!target) {
		uni.showModal({
			title: '现场核验',
			content: '请先在地图上点击卡口、巡组或哨位标记，再点「现场核验」发起核验流程。',
			showCancel: false
		})
		return
	}
	closeSensorPopup()
	closeLayerDrawer()
	verifyResultData.value = {
		target,
		workOrderCode: 'HC-' + String(Date.now()).slice(-6),
		eta: target.type === 'checkpoint' ? '3分钟' : target.type === 'patrol' ? '6分钟' : '8分钟',
		team: target.type === 'checkpoint' ? '口岸联勤组' : target.type === 'patrol' ? '边境巡防组' : '前沿哨点联络组',
		task: target.type === 'checkpoint' ? '卡口查验复核' : target.type === 'patrol' ? '巡线到点核验' : '哨位告警复勘',
		reportTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
		statusText: target.status === 'warning' ? '高优先下发' : '已下发联动',
		statusClass: target.status === 'warning' ? 'warning' : 'active',
		progress: target.status === 'warning' ? 86 : 68,
		steps: [
			{ label: '任务创建', done: true },
			{ label: '联动派发', done: true },
			{ label: '前往核验', done: target.status === 'warning' },
			{ label: '结果回传', done: false }
		]
	}
	verifyResultVisible.value = true
}

// 轨迹核查（修复）
const handleViewHistory = () => {
	feedbackTap()
	const target = lastMapSelection.value || selectedSensor.value
	if (!target) {
		uni.showModal({
			title: '轨迹核查',
			content: '请先在地图上点击要核查的卡口、巡组或哨点，再选择时间范围。',
			showCancel: false
		})
		return
	}
	closeSensorPopup()
	closeLayerDrawer()
	traceCheckVisible.value = true
}

const handleQuickDispatch = () => {
	feedbackTap()
	if (activeCategory.value === 'ecology') {
		dismissMapChromeForPanel()
		ecologyReportVisible.value = true
	} else {
		// 情报预警：保留简单确认
		uni.showModal({
			title: '联勤调度',
			content: '确认向当前片区联勤力量推送勤务指令？（演示）',
			success: (res) => {
				if (!res.confirm) return
				uni.showToast({ title: '已推送（演示）', icon: 'success' })
			}
		})
	}
}

const handleCreateCase = () => {
	uni.navigateTo({url:'/pages/GIS/new-smuggling-case'})
}

const handleLocation = () => {
	requestLocation(
		'用于在地图上定位当前位置，辅助开展执法巡查与现场核查',
		(r) => {
			mapCenter.value = { latitude: r.latitude, longitude: r.longitude }
			uni.showToast({ title: '已定位到当前位置', icon: 'success' })
		},
		() => uni.showToast({ title: '已取消定位', icon: 'none' })
	)
}

const handleZoomIn = () => {
	mapScale.value = Math.min(mapScale.value + 1, 18)
}

const handleZoomOut = () => {
	mapScale.value = Math.max(mapScale.value - 1, 5)
}

const handleAlertTask = () => {
	uni.switchTab({url:'/pages/Task/Task'})
}

const handleDiagnose = () => {
	feedbackTap()
	const pending = smugglingData.value.filter((d) => d.status === 'pending').length
	uni.showModal({
			title: '热眼擒枭风险画像（演示）',
			content: `全区活物走私模拟线索待核：${pending} 条；今日异常态势已同步至情报中心。是否跳转情报研判中心？`,
		confirmText: '去研判',
		cancelText: '留在地图',
		success: (res) => {
			if (res.confirm) {
				uni.navigateTo({ url: '/pages/Intelligence/Intelligence' })
			}
		}
	})
}

const handleWildlifeClue = () => {
	feedbackTap()
	dismissMapChromeForPanel()
	clueVerifyVisible.value = true
}

const handleWildlifeProfile = () => {
	feedbackTap()
	dismissMapChromeForPanel()
	riskProfileVisible.value = true
}

/** 处理单条线索核验 */
const handleClueVerify = ({ clue, status, result, riskLevel, remark }) => {
	const idx = smugglingData.value.findIndex(d => d.id === clue.id)
	if (idx !== -1) {
		smugglingData.value[idx] = { ...smugglingData.value[idx], status }
	}
}

/** 处理批量核验 */
const handleBatchClueVerify = ({ clues, status }) => {
	clues.forEach(clue => {
		const idx = smugglingData.value.findIndex(d => d.id === clue.id)
		if (idx !== -1) {
			smugglingData.value[idx] = { ...smugglingData.value[idx], status }
		}
	})
}

/** 处理线索推送研判席 */
const handleClueDispatch = ({ clues }) => {
	uni.showToast({ title: `已推送 ${clues.length} 条线索至情报研判中心`, icon: 'success' })
}

/** 处理研判报告生成 */
const handleGenerateReport = ({ title, type, sections, data }) => {
	const code = `RP-${String(Date.now()).slice(-6)}`
	uni.showModal({
		title: '研判报告已生成',
		content: `报告编号：${code}\n标题：${title}\n已保存至情报研判中心，是否前往查看？`,
		confirmText: '前往查看',
		cancelText: '留在地图',
		success: (res) => {
			if (res.confirm) {
				riskProfileVisible.value = false
				uni.navigateTo({ url: '/pages/Intelligence/Intelligence' })
			}
		}
	})
}

/** 处理风险画像图表导出 */
const handleExportProfile = ({ profileData, areas, types }) => {
	uni.showToast({ title: '图表导出成功（演示）', icon: 'success' })
}

/** 处理区域聚焦（从风险画像面板点击区域） */
const handleProfileAreaTap = (area) => {
	activeCategory.value = 'wildlife'
	layerTypeFilter.value = null
	const borderMap = {
		'凭祥': '凭祥市', '东兴': '东兴市', '宁明': '宁明县',
		'大新': '大新县', '靖西': '靖西市', '那坡': '那坡县',
		'龙州': '龙州县', '防城': '防城区'
	}
	const borderKey = borderMap[area.name] || area.name
	const first = smugglingData.value.find((d) => d.border === borderKey)
	if (first) {
		mapCenter.value = { latitude: first.latitude, longitude: first.longitude }
		mapScale.value = 12
	}
	uni.showToast({ title: `已聚焦至${area.name}片区`, icon: 'none' })
}

const handleToolbarAction = (action) => {
	if (action.onTap) {
		action.onTap()
	}
}

const handleBottomAction = (action) => {
	if (action.loading) return
	action.onTap()
}

const handlePopupSecondary = () => {
	return handleViewHistory()
}

const handlePopupPrimary = () => {
	if (activeCategory.value === 'border') {
		return handleVerify()
	}
	return handleCreateCase()
}

// ==================== 初始化 ====================
onLoad(() => {
	activeCategory.value = 'wildlife'
})

onMounted(() => {
	// 获取系统信息用于适配
	uni.getSystemInfo({
		success: (res) => {
			systemInfo.value = {
				statusBarHeight: res.statusBarHeight || 20,
				safeAreaInsets: res.safeAreaInsets || { top: 0, bottom: 0 },
				screenWidth: res.screenWidth || 375,
				screenHeight: res.screenHeight || 812
			}
		}
	})
	// 获取 map 实例（用于后续精确视野计算）
	mapCtx.value = uni.createMapContext('gisMap')
	// 模拟数据同步时间
	const now = new Date()
	syncTime.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

	// 启动实时时钟（参考项目 StatusHeader）
	updateClock()
	timeTimer = setInterval(updateClock, 1000)

	// 模拟 GPS 和电池实时更新
	setInterval(() => {
		gpsSignal.value = Math.floor(Math.random() * 5) + 12
		if (battery.value > 0) battery.value = Math.max(0, battery.value - 0.1)
	}, 3000)

	// 初始化视野
	handleRegionChange({ detail: { type: 'init' } })
})

onUnload(() => {
	if (timeTimer) clearInterval(timeTimer)
})
</script>

<style lang="scss">
.gis-page{position:relative;width:100vw;height:100vh;overflow:hidden;background:#07111d}.gis-page::before{content:'';position:fixed;inset:0;pointer-events:none;background:linear-gradient(to right,rgba(0,212,255,.05) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,212,255,.05) 1px,transparent 1px);background-size:120rpx 120rpx;opacity:.4}.map-canvas{width:100%;height:100%}.cv-situation-bar{position:absolute;left:50%;transform:translateX(-50%);z-index:120;display:flex;flex-direction:column;gap:6rpx;padding:14rpx 18rpx;border-radius:20rpx;background:#0c1524;border:1px solid rgba(0,212,255,.22);box-shadow:0 12rpx 28rpx rgba(0,0,0,.45);max-width:calc(100vw - 28rpx);box-sizing:border-box}.cv-situation-row1{display:flex;align-items:center;gap:12rpx;width:100%}.cv-situation-left{display:flex;align-items:center;gap:12rpx;flex:1;min-width:0;flex-wrap:wrap}.cv-situation-zone{display:flex;align-items:flex-start;gap:8rpx;flex-shrink:0;max-width:100%}.cv-zone-icon{width:26rpx;height:26rpx;opacity:.92;margin-top:2rpx}.cv-zone-text{font-size:22rpx;color:#eefaff;font-weight:700;line-height:1.35;white-space:normal;word-break:break-all;max-width:340rpx}.cv-situation-divider{width:1px;height:32rpx;background:rgba(255,255,255,.15);flex-shrink:0}.cv-situation-stats{display:flex;align-items:center;gap:12rpx;flex-shrink:0}.cv-stat-item{display:flex;align-items:center;gap:8rpx}.cv-stat-value{font-size:26rpx;font-weight:800}.cv-stat-online{color:#73d13d;text-shadow:0 0 8rpx rgba(115,209,61,.6)}.cv-stat-alert{color:#ff6b6b;text-shadow:0 0 8rpx rgba(255,107,107,.6)}.cv-stat-label{font-size:18rpx;color:rgba(179,220,255,.7);white-space:nowrap}.cv-stat-sep{width:1px;height:24rpx;background:rgba(255,255,255,.12);flex-shrink:0}.cv-situation-right{display:flex;align-items:center;gap:10rpx;flex-shrink:0}.cv-response-level{display:flex;align-items:center;gap:8rpx;padding:6rpx 14rpx;border-radius:999rpx;flex-shrink:0}.cv-level-dot{width:12rpx;height:12rpx;border-radius:50%}.cv-level-text{font-size:20rpx;font-weight:800;white-space:nowrap}.cv-filter-chip{display:flex;align-items:center;gap:6rpx;padding:5rpx 12rpx;border-radius:999rpx;background:rgba(0,212,255,.18);border:1px solid rgba(0,212,255,.4);flex-shrink:0}.cv-filter-chip-icon{width:18rpx;height:18rpx;opacity:.85}.cv-filter-chip-text{font-size:19rpx;font-weight:700;color:#7fe7ff;white-space:nowrap}.cv-filter-chip-close{font-size:17rpx;color:rgba(127,233,255,.65);padding-left:2rpx}.cv-sync-row{display:flex;align-items:center;gap:10rpx;width:100%}.cv-sync-dot{width:10rpx;height:10rpx;border-radius:50%;background:#73d13d;box-shadow:0 0 6rpx rgba(115,209,61,.8);flex-shrink:0;animation:pulse-dot 2s ease-in-out infinite}.cv-sync-text{font-size:17rpx;color:rgba(179,220,255,.5);white-space:nowrap}.cv-sync-sep{font-size:17rpx;color:rgba(255,255,255,.15)}.cv-response-level.level-1{background:rgba(115,209,61,.16);border:1px solid rgba(115,209,61,.3)}.cv-response-level.level-1 .cv-level-dot{background:#73d13d;box-shadow:0 0 8rpx rgba(115,209,61,.8)}.cv-response-level.level-1 .cv-level-text{color:#73d13d}.cv-response-level.level-2{background:rgba(0,212,255,.16);border:1px solid rgba(0,212,255,.3)}.cv-response-level.level-2 .cv-level-dot{background:#00d4ff;box-shadow:0 0 8rpx rgba(0,212,255,.8)}.cv-response-level.level-2 .cv-level-text{color:#00d4ff}.cv-response-level.level-3{background:rgba(255,169,64,.16);border:1px solid rgba(255,169,64,.3)}.cv-response-level.level-3 .cv-level-dot{background:#ffa940;box-shadow:0 0 8rpx rgba(255,169,64,.8)}.cv-response-level.level-3 .cv-level-text{color:#ffa940}.cv-response-level.level-4{background:rgba(255,77,79,.16);border:1px solid rgba(255,77,79,.3)}.cv-response-level.level-4 .cv-level-dot{background:#ff4d4f;box-shadow:0 0 8rpx rgba(255,77,79,.8);animation:pulse-dot 1s ease-in-out infinite}.cv-response-level.level-4 .cv-level-text{color:#ff4d4f}.cv-patrol-pill{position:fixed;top:18rpx;left:50%;transform:translateX(-50%);z-index:120;display:flex;align-items:center;gap:10rpx;padding:10rpx 16rpx;border-radius:999rpx;background:rgba(8,12,20,.96);border:1px solid rgba(255,255,255,.08);box-shadow:0 10rpx 26rpx rgba(0,0,0,.34)}.cv-patrol-mini-icon{width:22rpx;height:22rpx;opacity:.92}.cv-patrol-signal{width:14rpx;height:14rpx;border-radius:999rpx;background:#73d13d;box-shadow:0 0 10rpx rgba(115,209,61,.9);flex-shrink:0}.cv-patrol-text{font-size:22rpx;color:#eefaff;font-weight:700;white-space:nowrap}.cv-patrol-chip{padding:4rpx 12rpx;border-radius:999rpx;background:rgba(0,212,255,.16);border:1px solid rgba(0,212,255,.28);font-size:18rpx;font-weight:800;color:#7fe7ff;letter-spacing:1rpx}.cv-left-board{position:absolute;left:18rpx;z-index:120;display:flex;flex-direction:column;gap:14rpx;padding:12rpx;border-radius:22rpx;background:#0e1929;border:1px solid rgba(77,214,255,.25);box-shadow:0 14rpx 34rpx rgba(0,0,0,.4)}.cv-left-item{display:flex;align-items:center;gap:12rpx;min-width:180rpx;padding:14rpx 16rpx;border-radius:16rpx;background:#152536;border:1px solid rgba(111,207,255,.18);transition:all .2s ease;&:active{transform:scale(.97);opacity:.9}&.active{background:#123042;border-color:rgba(0,212,255,.55);box-shadow:0 0 0 2rpx rgba(0,212,255,.12),0 0 18rpx rgba(0,212,255,.2)}}.cv-left-icon{width:40rpx;height:40rpx;border-radius:10rpx;display:flex;align-items:center;justify-content:center;background:rgba(0,212,255,.12);border:1px solid rgba(0,212,255,.16);flex-shrink:0}.cv-left-icon-img{width:24rpx;height:24rpx}.cv-left-label{flex:1;font-size:24rpx;color:#f5fbff;font-weight:700;letter-spacing:.5rpx}.cv-left-count{min-width:42rpx;padding:4rpx 12rpx;border-radius:999rpx;background:rgba(0,212,255,.14);border:1px solid rgba(0,212,255,.2);font-size:22rpx;color:#6de8ff;font-weight:800;text-align:center}.cv-left-header{display:flex;align-items:center;gap:12rpx;padding:8rpx 6rpx;border-bottom:1px solid rgba(0,212,255,.12);margin-bottom:6rpx}.cv-left-logo{width:52rpx;height:52rpx;border-radius:12rpx;flex-shrink:0}.cv-left-title-wrap{display:flex;flex-direction:column;gap:2rpx;flex:1}.cv-left-title{font-size:28rpx;color:#f5fbff;font-weight:800;letter-spacing:1rpx}.cv-left-subtitle{font-size:18rpx;color:rgba(0,212,255,.6);font-weight:400}.cv-left-tabs{display:flex;flex-direction:column;gap:10rpx}.cv-left-icon-wrap{width:40rpx;height:40rpx;border-radius:10rpx;display:flex;align-items:center;justify-content:center;background:rgba(0,212,255,.12);border:1px solid rgba(0,212,255,.16);flex-shrink:0}.cv-left-footer{padding:8rpx 6rpx;border-top:1px solid rgba(0,212,255,.1);margin-top:4rpx}.cv-left-slogan{font-size:18rpx;color:rgba(0,212,255,.5);text-align:center;font-weight:400}.cv-controls{position:absolute;right:18rpx;z-index:120;display:flex;flex-direction:column;gap:12rpx;padding:12rpx 12rpx 18rpx;border-radius:28rpx;background:#e8f4fc;border:2rpx solid rgba(111,207,255,.35);box-shadow:0 18rpx 40rpx rgba(20,45,70,.2)}.cv-controls-title{padding:4rpx 8rpx 10rpx;font-size:20rpx;font-weight:800;color:#365268;text-align:center;letter-spacing:2rpx}.cv-btn{width:114rpx;min-height:108rpx;border-radius:22rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10rpx;background:linear-gradient(180deg,rgba(255,255,255,.86),rgba(237,248,255,.8));border:2rpx solid rgba(138,226,255,.32);box-shadow:0 8rpx 18rpx rgba(13,31,52,.12);transition:all .15s ease;&:active{transform:scale(.94);opacity:.85}}.cv-btn-icon-shell{width:42rpx;height:42rpx;border-radius:14rpx;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(18,201,255,.14),rgba(0,168,214,.08));border:1px solid rgba(0,212,255,.22)}.cv-btn-icon-img{width:24rpx;height:24rpx}.cv-btn-text{font-size:18rpx;font-weight:800;color:#65819a;text-align:center;line-height:1.2;padding:0 6rpx}.cv-sos{background:linear-gradient(180deg,rgba(255,236,238,.96),rgba(255,219,223,.88));border-color:rgba(255,77,79,.3); .cv-btn-icon-shell{background:rgba(255,77,79,.12);border-color:rgba(255,77,79,.2)} .cv-btn-text{color:#d94a55}}.cv-zoom{overflow:hidden;border-radius:22rpx;border:2rpx solid rgba(138,226,255,.32)}.cv-zoom-btn{min-height:62rpx;border-radius:0;background:rgba(255,255,255,.78);border:none}.cv-zoom-text{font-size:34rpx;color:#00a8d6}.cv-zoom-divider{height:2rpx;background:rgba(0,212,255,.16)}.cv-drawer-mask,.sensor-popup-overlay{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:flex-end;justify-content:center;padding:24rpx 20rpx calc(env(safe-area-inset-bottom) + 22rpx);background:rgba(0,0,0,.58);z-index:140}.cv-drawer-panel,.sensor-popup-card{width:100%;max-width:700rpx;padding:28rpx;border-radius:30rpx;background:#0d1826;border:1px solid rgba(0,212,255,.35);box-shadow:0 24rpx 60rpx rgba(0,0,0,.55)}.cv-drawer-header{margin-bottom:24rpx}.cv-drawer-title{font-size:32rpx;color:#f3fbff;font-weight:800}.cv-drawer-subtitle{margin-top:10rpx;font-size:22rpx;color:rgba(179,220,255,.7)}.cv-drawer-section{margin-bottom:20rpx}.cv-drawer-section-title{font-size:24rpx;color:#8ca3b8;font-weight:600;margin-bottom:14rpx;padding-left:4rpx}.cv-drawer-layer-row{display:flex;align-items:center;gap:14rpx;padding:18rpx 16rpx;margin-bottom:10rpx;border-radius:16rpx;background:#152a3d;border:1px solid rgba(0,212,255,.14);transition:all .15s ease;&:active{transform:scale(.98);opacity:.85}}.cv-drawer-layer-icon{width:44rpx;height:44rpx;border-radius:12rpx;display:flex;align-items:center;justify-content:center;background:rgba(0,212,255,.1);flex-shrink:0; image{width:28rpx;height:28rpx}}.cv-drawer-layer-name{flex:1;font-size:26rpx;color:#f5fbff;font-weight:600}.cv-drawer-layer-count{min-width:44rpx;padding:4rpx 12rpx;border-radius:999rpx;background:rgba(0,212,255,.14);font-size:22rpx;color:#00d4ff;text-align:center;font-weight:800}.cv-drawer-layer-status{padding:4rpx 12rpx;border-radius:999rpx;font-size:20rpx;font-weight:700;&.status-active{background:rgba(115,209,61,.16);color:#73d13d}&.status-warning{background:rgba(255,169,64,.16);color:#ffa940}&.status-pending{background:rgba(255,77,79,.16);color:#ff6b6b}&.risk.risk-high{background:rgba(255,77,79,.22);color:#ff6b6b;border:1px solid rgba(255,107,107,.35)}&.risk.risk-medium{background:rgba(255,169,64,.22);color:#ffa940;border:1px solid rgba(255,169,64,.35)}&.risk.high{background:rgba(255,77,79,.22);color:#ff6b6b}&.risk.medium{background:rgba(255,169,64,.22);color:#ffa940}}.cv-drawer-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx;margin-top:20rpx;padding-top:20rpx;border-top:1px solid rgba(255,255,255,.08)}.cv-drawer-stat-item{text-align:center;padding:16rpx 12rpx;border-radius:14rpx;background:#152a3d;border:1px solid rgba(255,255,255,.06)}.cv-drawer-stat-value{font-size:32rpx;font-weight:800;color:#f4fbff}.cv-drawer-stat-label{font-size:20rpx;color:#8ca3b8;margin-top:6rpx}.cv-drawer-row{display:flex;align-items:center;justify-content:space-between;padding:22rpx 20rpx;margin-bottom:14rpx;border-radius:18rpx;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);&.active{background:linear-gradient(135deg,rgba(0,212,255,.18),rgba(0,128,204,.12));border-color:rgba(0,212,255,.5)}&.cancel{justify-content:center;background:rgba(255,77,79,.08);border-color:rgba(255,77,79,.2)}}.cv-drawer-name{font-size:26rpx;color:#f4fbff;font-weight:700}.cv-drawer-count{min-width:50rpx;padding:4rpx 12rpx;border-radius:999rpx;background:rgba(0,212,255,.14);font-size:22rpx;color:#00d4ff;text-align:center;font-weight:800}.spc-close{position:absolute;right:26rpx;top:24rpx;width:52rpx;height:52rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08)}.spc-close-text{font-size:28rpx;color:#fff}.spc-header{display:flex;align-items:center;gap:16rpx;padding-right:68rpx;margin-bottom:20rpx}.spc-type-icon{width:82rpx;height:82rpx;border-radius:22rpx;display:flex;align-items:center;justify-content:center;background:#1a3a4d;border:1px solid rgba(0,212,255,.25)}.spc-icon-emoji{font-size:38rpx}.spc-title-group{display:flex;flex-direction:column;gap:10rpx;flex:1}.spc-name{font-size:30rpx;color:#f4fbff;font-weight:800}.spc-status-badge{align-self:flex-start;display:flex;align-items:center;gap:8rpx;padding:8rpx 14rpx;border-radius:999rpx;background:rgba(0,212,255,.12)}.spc-status-dot{width:12rpx;height:12rpx;border-radius:50%;background:#00d4ff;&.dot-active{background:#73d13d;box-shadow:0 0 8rpx rgba(115,209,61,.8)}&.dot-warning{background:#ffa940;box-shadow:0 0 8rpx rgba(255,169,64,.8)}&.dot-pending{background:#ff6b6b;box-shadow:0 0 8rpx rgba(255,107,107,.8)}}.spc-status-text{font-size:20rpx;color:#9ee8ff;font-weight:700}.spc-data-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12rpx;margin-bottom:14rpx}.spc-data-item{padding:18rpx;border-radius:18rpx;background:#152a3d;border:1px solid rgba(255,255,255,.1);display:flex;flex-direction:column;gap:8rpx}.spc-label{font-size:20rpx;color:rgba(187,216,240,.72)}.spc-value{font-size:24rpx;color:#f6fbff;font-weight:700;&.risk-value-high{color:#ff6b6b}&.risk-value-medium{color:#ffa940}&.risk-value-low{color:#73d13d}&.risk-value-yellow{color:#ffa940}&.risk-value-blue{color:#00d4ff}&.risk-value-green{color:#73d13d}}.spc-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14rpx;margin-top:20rpx}.spc-btn{min-height:82rpx;border-radius:18rpx;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.1);transition:all .15s ease;&:active{transform:scale(.97);opacity:.85}&.spc-btn-secondary{background:rgba(255,255,255,.05)}&.spc-btn-primary{background:#1a4a5c;border-color:rgba(0,212,255,.45)}}.spc-btn-text{font-size:24rpx;color:#f4fbff;font-weight:800}.cv-bottom-actions{position:absolute;left:18rpx;right:18rpx;display:flex;gap:12rpx;z-index:135;box-sizing:border-box}.cv-bottom-btn{flex:1;min-height:82rpx;border-radius:18rpx;display:flex;align-items:center;justify-content:center;box-shadow:0 10rpx 22rpx rgba(0,0,0,.4);transition:opacity .15s ease;&:active{opacity:.88}}.cv-bottom-btn-content{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;padding:8rpx 6rpx;box-sizing:border-box}.cv-bottom-btn-loading{opacity:.7}.cv-bottom-btn-spinner{width:32rpx;height:32rpx;border:3rpx solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.cv-bottom-btn-red{background:#c8303b}.cv-bottom-btn-blue{background:#007aaa}.cv-bottom-btn-dark{background:#141e30}.dispatch-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(3,8,18,.7);z-index:200;padding:40rpx}.dispatch-dialog{width:100%;max-width:600rpx;background:linear-gradient(180deg,rgba(10,18,34,.98),rgba(8,12,22,.96));border-radius:30rpx;border:1px solid rgba(0,212,255,.24);box-shadow:0 20rpx 56rpx rgba(0,0,0,.4);overflow:hidden}.dispatch-header{display:flex;align-items:center;justify-content:space-between;padding:28rpx 32rpx;background:linear-gradient(135deg,rgba(255,77,79,.12),rgba(255,77,79,.06));border-bottom:1px solid rgba(255,77,79,.2)}.dispatch-title{font-size:32rpx;font-weight:800;color:#fff}.dispatch-close{width:52rpx;height:52rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);font-size:32rpx;color:#fff}.dispatch-body{padding:32rpx}.dispatch-info{display:flex;justify-content:space-between;align-items:center;padding:20rpx 0;border-bottom:1px solid rgba(255,255,255,.06)}.dispatch-label{font-size:26rpx;color:#8ca3b8}.dispatch-value{font-size:28rpx;color:#f4fbff;font-weight:700}.dispatch-level{padding:4rpx 16rpx;border-radius:999rpx;font-size:22rpx;}.level-text-1{background:rgba(115,209,61,.2);color:#73d13d}.level-text-2{background:rgba(0,212,255,.2);color:#00d4ff}.level-text-3{background:rgba(255,169,64,.2);color:#ffa940}.level-text-4{background:rgba(255,77,79,.2);color:#ff4d4f}.dispatch-actions{display:flex;gap:20rpx;padding:24rpx 32rpx;background:rgba(0,0,0,.2)}.dispatch-btn{flex:1;height:88rpx;border-radius:20rpx;font-size:28rpx;font-weight:700;display:flex;align-items:center;justify-content:center;border:none;&.dispatch-btn-cancel{background:rgba(255,255,255,.08);color:#8ca3b8}&.dispatch-btn-confirm{background:linear-gradient(135deg,#ff4d4f,#ff1238);color:#fff}}@media(max-width:420px){.cv-zone-text{max-width:280rpx;font-size:20rpx}.cv-stat-label{font-size:16rpx}.cv-left-item{min-width:160rpx}.cv-situation-bar{max-width:calc(100vw - 24rpx);padding:10rpx 14rpx}.cv-filter-chip-text{font-size:17rpx}.cv-sync-text{font-size:15rpx}}@media(max-width:360px){.cv-zone-text{max-width:240rpx;font-size:19rpx}.cv-situation-divider{display:none}.cv-stat-value{font-size:22rpx}.cv-response-level{padding:4rpx 10rpx}.cv-response-level .cv-level-text{font-size:18rpx}.cv-btn{width:100rpx;min-height:96rpx}.cv-left-item{min-width:140rpx;padding:12rpx 14rpx}.cv-left-label{font-size:22rpx}.cv-filter-chip{padding:4rpx 8rpx}.cv-filter-chip-text{font-size:16rpx}.cv-sync-text{font-size:14rpx}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}

/* ==================== 边境防线弹层增强 ==================== */
.trace-dialog {
	max-width: 640rpx;
}
.trace-header {
	background: linear-gradient(135deg, rgba(0, 212, 255, 0.14), rgba(0, 122, 170, 0.08));
	border-bottom: 1px solid rgba(0, 212, 255, 0.2);
}
.verify-dispatch-dialog {
	border-color: rgba(0, 212, 255, 0.32);
}
.verify-dispatch-header {
	align-items: flex-start;
	padding-top: 24rpx;
	padding-bottom: 24rpx;
}
.verify-dispatch-header-warning {
	background: linear-gradient(135deg, rgba(255, 169, 64, 0.2), rgba(255, 122, 69, 0.08));
	border-bottom-color: rgba(255, 169, 64, 0.24);
}
.verify-dispatch-header-active {
	background: linear-gradient(135deg, rgba(0, 212, 255, 0.16), rgba(0, 122, 170, 0.08));
	border-bottom-color: rgba(0, 212, 255, 0.2);
}
.vehicle-dispatch-dialog {
	border-color: rgba(0, 212, 255, 0.36);
}
.vehicle-dispatch-header {
	background: linear-gradient(135deg, rgba(64, 196, 255, 0.18), rgba(0, 168, 255, 0.08));
}
.vehicle-dispatch-header-warning {
	background: linear-gradient(135deg, rgba(255, 169, 64, 0.22), rgba(255, 122, 69, 0.1));
	border-bottom-color: rgba(255, 169, 64, 0.26);
}
.vehicle-dispatch-header-active {
	background: linear-gradient(135deg, rgba(64, 196, 255, 0.18), rgba(0, 168, 255, 0.08));
	border-bottom-color: rgba(64, 196, 255, 0.22);
}
.verify-dispatch-heading {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}
.verify-dispatch-kicker {
	font-size: 20rpx;
	font-weight: 700;
	letter-spacing: 1rpx;
	color: rgba(234, 246, 255, 0.68);
}
.verify-dispatch-body {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}
.verify-task-card {
	padding: 22rpx;
	border-radius: 22rpx;
	background: linear-gradient(180deg, rgba(9, 22, 37, 0.96), rgba(11, 28, 44, 0.92));
	border: 1px solid rgba(0, 212, 255, 0.16);
	box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.04);
}
.verify-task-card-warning {
	border-color: rgba(255, 169, 64, 0.34);
	box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.04), 0 0 24rpx rgba(255, 169, 64, 0.1);
}
.verify-task-card-active {
	border-color: rgba(0, 212, 255, 0.24);
	box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.04), 0 0 24rpx rgba(0, 212, 255, 0.08);
}
.verify-task-top {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
	align-items: flex-start;
	margin-bottom: 20rpx;
}
.verify-task-code,
.verify-task-title,
.verify-task-target-name,
.verify-task-target-meta,
.verify-task-eta-label,
.verify-task-eta-value,
.verify-progress-title,
.verify-progress-percent,
.verify-step-label,
.verify-dispatch-mini-label,
.verify-dispatch-mini-value {
	display: block;
}
.verify-task-code {
	font-size: 20rpx;
	color: rgba(148, 193, 224, 0.72);
	margin-bottom: 8rpx;
}
.verify-task-title {
	font-size: 30rpx;
	font-weight: 800;
	color: #f4fbff;
	line-height: 1.35;
}
.verify-task-badge {
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	font-size: 20rpx;
	font-weight: 800;
	white-space: nowrap;
}
.verify-task-badge-warning {
	background: rgba(255, 169, 64, 0.16);
	color: #ffb15d;
	border: 1rpx solid rgba(255, 169, 64, 0.28);
}
.verify-task-badge-active {
	background: rgba(0, 212, 255, 0.14);
	color: #73e7ff;
	border: 1rpx solid rgba(0, 212, 255, 0.24);
}
.vehicle-task-card {
	border-color: rgba(64, 196, 255, 0.22);
	box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.04), 0 0 26rpx rgba(64, 196, 255, 0.08);
}
.verify-task-target-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 22rpx;
}
.verify-task-target-main {
	flex: 1;
	min-width: 0;
}
.verify-task-target-name {
	font-size: 28rpx;
	font-weight: 800;
	color: #f4fbff;
	margin-bottom: 8rpx;
}
.verify-task-target-meta {
	font-size: 22rpx;
	color: #8ca3b8;
}
.verify-task-eta {
	padding: 14rpx 16rpx;
	border-radius: 16rpx;
	background: rgba(255,255,255,0.04);
	border: 1rpx solid rgba(255,255,255,0.08);
	min-width: 140rpx;
}
.verify-task-eta-label {
	font-size: 18rpx;
	color: rgba(148, 193, 224, 0.68);
	margin-bottom: 6rpx;
}
.verify-task-eta-value {
	font-size: 28rpx;
	font-weight: 800;
	color: #00d4ff;
}
.vehicle-task-eta .verify-task-eta-value {
	color: #40c4ff;
}
.verify-progress-box {
	padding: 18rpx;
	border-radius: 18rpx;
	background: rgba(255,255,255,0.04);
	border: 1rpx solid rgba(255,255,255,0.08);
}
.verify-progress-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 14rpx;
}
.verify-progress-title {
	font-size: 22rpx;
	font-weight: 700;
	color: #dff6ff;
}
.verify-progress-percent {
	font-size: 22rpx;
	font-weight: 800;
	color: #f4fbff;
}
.verify-progress-track {
	height: 14rpx;
	border-radius: 999rpx;
	background: rgba(255,255,255,0.08);
	overflow: hidden;
}
.verify-progress-fill {
	height: 100%;
	border-radius: inherit;
	background: linear-gradient(90deg, #00d4ff, #27f0c7);
}
.verify-progress-fill-warning {
	background: linear-gradient(90deg, #ffa940, #ff7a45);
}
.verify-progress-fill-active {
	background: linear-gradient(90deg, #00d4ff, #27f0c7);
}
.vehicle-progress-fill {
	background: linear-gradient(90deg, #40c4ff, #00e5ff);
}
.verify-step-row {
	display: flex;
	justify-content: space-between;
	gap: 8rpx;
	margin-top: 18rpx;
}
.verify-step-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	opacity: 0.48;
}
.verify-step-item.done {
	opacity: 1;
}
.verify-step-dot {
	width: 18rpx;
	height: 18rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.16);
	border: 2rpx solid rgba(255,255,255,0.22);
}
.verify-step-item.done .verify-step-dot {
	background: #00d4ff;
	border-color: rgba(0, 212, 255, 0.4);
	box-shadow: 0 0 12rpx rgba(0, 212, 255, 0.35);
}
.verify-step-label {
	font-size: 18rpx;
	color: #c8dceb;
	text-align: center;
	line-height: 1.35;
}
.verify-dispatch-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14rpx;
}
.verify-dispatch-mini-card {
	padding: 18rpx;
	border-radius: 18rpx;
	background: rgba(255,255,255,0.04);
	border: 1rpx solid rgba(255,255,255,0.08);
}
.verify-dispatch-mini-label {
	font-size: 20rpx;
	color: #8ca3b8;
	margin-bottom: 10rpx;
}
.verify-dispatch-mini-value {
	font-size: 24rpx;
	font-weight: 700;
	color: #f4fbff;
	line-height: 1.4;
}
.vehicle-dispatch-mini-card {
	border-color: rgba(64, 196, 255, 0.14);
	background: rgba(64, 196, 255, 0.04);
}
.vehicle-dispatch-confirm {
	background: linear-gradient(135deg, #1d8dff, #00b8ff) !important;
}
.trace-value-accent {
	color: #00d4ff;
}
.trace-target-card {
	padding: 18rpx 20rpx;
	margin-bottom: 22rpx;
	border-radius: 18rpx;
	background: rgba(0, 212, 255, 0.08);
	border: 1px solid rgba(0, 212, 255, 0.16);
}
.trace-target-name {
	display: block;
	font-size: 28rpx;
	font-weight: 800;
	color: #f4fbff;
	margin-bottom: 8rpx;
}
.trace-target-meta {
	display: block;
	font-size: 22rpx;
	color: #8ca3b8;
}
.trace-section-title {
	font-size: 24rpx;
	font-weight: 700;
	color: #f4fbff;
	margin-bottom: 16rpx;
}
.trace-pill-group {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}
.trace-pill-item {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 14rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(255,255,255,0.04);
	border: 1px solid rgba(255,255,255,0.08);
	box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.04);
}
.trace-pill-item.active {
	background: linear-gradient(135deg, rgba(0, 212, 255, 0.18), rgba(0, 122, 170, 0.12));
	border-color: rgba(0, 212, 255, 0.38);
	box-shadow: 0 0 18rpx rgba(0, 212, 255, 0.14);
}
.trace-pill-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.24);
	box-shadow: inset 0 0 0 2rpx rgba(255,255,255,0.08);
}
.trace-pill-dot.active {
	background: #00d4ff;
	box-shadow: 0 0 12rpx rgba(0, 212, 255, 0.45);
}
.trace-pill-label {
	font-size: 24rpx;
	font-weight: 700;
	color: #f4fbff;
}
.trace-custom-box {
	margin-top: 18rpx;
	padding: 18rpx 20rpx;
	border-radius: 18rpx;
	background: rgba(255,255,255,0.04);
	border: 1px dashed rgba(0,212,255,0.24);
}
.trace-custom-label {
	display: block;
	font-size: 22rpx;
	color: #8ca3b8;
	margin-bottom: 12rpx;
}
.trace-custom-input {
	width: 100%;
	height: 78rpx;
	padding: 0 18rpx;
	border-radius: 14rpx;
	background: rgba(0,0,0,0.24);
	border: 1px solid rgba(255,255,255,0.1);
	font-size: 24rpx;
	color: #f4fbff;
	box-sizing: border-box;
}
.trace-custom-placeholder {
	color: #5a7a96;
	font-size: 22rpx;
}

/* ==================== 环境感知数据行样式 ==================== */
.cv-env-row {
	display: flex;
	align-items: center;
	gap: 6rpx;
	width: 100%;
	padding: 8rpx 10rpx;
	background: rgba(0, 212, 255, 0.05);
	border-radius: 10rpx;
	border: 1px solid rgba(0, 212, 255, 0.12);
}
.cv-env-item {
	display: flex;
	align-items: center;
	gap: 6rpx;
	flex-shrink: 0;
}
.cv-env-icon-text {
	font-size: 22rpx;
	flex-shrink: 0;
}
.cv-env-icon {
	width: 22rpx;
	height: 22rpx;
	opacity: 0.75;
}
.cv-env-value {
	font-size: 20rpx;
	font-weight: 700;
	color: #f4fbff;
	font-family: 'Courier New', monospace;
}
.cv-env-label {
	font-size: 16rpx;
	color: rgba(179, 220, 255, 0.5);
	white-space: nowrap;
}
.cv-env-sep {
	width: 1rpx;
	height: 22rpx;
	background: rgba(255, 255, 255, 0.1);
	flex-shrink: 0;
	margin: 0 4rpx;
}
.cv-env-badge {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	margin-left: auto;
	flex-shrink: 0;
}
.cv-env-badge.cv-env-day {
	background: rgba(255, 200, 50, 0.12);
	border: 1px solid rgba(255, 200, 50, 0.3);
}
.cv-env-badge.cv-env-dusk {
	background: rgba(255, 140, 50, 0.12);
	border: 1px solid rgba(255, 140, 50, 0.3);
}
.cv-env-badge.cv-env-night {
	background: rgba(80, 120, 200, 0.15);
	border: 1px solid rgba(80, 120, 200, 0.3);
}
.cv-env-badge-dot {
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
}
.cv-env-badge .dot-day {
	background: #FFC832;
	box-shadow: 0 0 8rpx rgba(255, 200, 50, 0.7);
}
.cv-env-badge .dot-dusk {
	background: #FF8C32;
	box-shadow: 0 0 8rpx rgba(255, 140, 50, 0.7);
}
.cv-env-badge .dot-night {
	background: #5080C8;
	box-shadow: 0 0 8rpx rgba(80, 120, 200, 0.7);
	animation: pulse-dot 1.5s ease-in-out infinite;
}
.cv-env-badge-text {
	font-size: 18rpx;
	font-weight: 700;
}
.cv-env-day .cv-env-badge-text { color: #FFC832; }
.cv-env-dusk .cv-env-badge-text { color: #FF8C32; }
.cv-env-night .cv-env-badge-text { color: #80A8FF; }

/* ==================== 盲区追踪提示气泡样式 ==================== */
.cv-blindzone-hint {
	display: flex;
	align-items: center;
	gap: 10rpx;
	width: 100%;
	padding: 10rpx 14rpx;
	margin-top: 6rpx;
	background: rgba(255, 149, 0, 0.1);
	border: 1px solid rgba(255, 149, 0, 0.35);
	border-radius: 10rpx;
}
.cv-blindzone-icon {
	font-size: 24rpx;
	flex-shrink: 0;
}
.cv-blindzone-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}
.cv-blindzone-title {
	font-size: 20rpx;
	color: #FFAA50;
	font-weight: 700;
}
.cv-blindzone-meta {
	display: flex;
	align-items: center;
	gap: 8rpx;
	flex-wrap: wrap;
}
.cv-blindzone-tag {
	font-size: 16rpx;
	color: rgba(255, 170, 80, 0.7);
	background: rgba(255, 149, 0, 0.08);
	padding: 2rpx 8rpx;
	border-radius: 6rpx;
}
.cv-blindzone-close {
	font-size: 20rpx;
	color: rgba(255, 149, 0, 0.6);
	flex-shrink: 0;
	padding: 4rpx 8rpx;
}
.env-hot { color: #FF6B6B !important; }
.env-warm { color: #FFA940 !important; }
.env-cold { color: #7FDBFF !important; }
.env-humidity-high { color: #FF4D4F !important; }
.env-humidity-mid { color: #FFA940 !important; }
.env-wind-severe { color: #FF4D4F !important; }
.env-wind-warning { color: #FFA940 !important; }

/* ==================== 顶部状态栏（整合自参考项目 StatusHeader） ==================== */
.cv-status-bar{position:fixed;top:0;left:0;right:0;z-index:130;display:flex;align-items:center;justify-content:space-between;height:80rpx;padding:12rpx 24rpx;padding-top:calc(12rpx + env(safe-area-inset-top));background:rgba(10,14,26,0.96);border-bottom:1px solid rgba(255,255,255,0.06);box-shadow:0 4rpx 20rpx rgba(0,0,0,0.3)}
.cv-status-left,.cv-status-right{display:flex;align-items:center;gap:16rpx;flex:1}
.cv-status-center{flex:1;display:flex;justify-content:center}
.cv-status-item{display:flex;align-items:center;gap:8rpx}
.cv-status-icon{width:28rpx;height:28rpx}
.cv-status-val{font-size:24rpx;font-weight:600;color:#ffffff;white-space:nowrap}
.cv-status-badge{display:flex;align-items:center;gap:8rpx;padding:6rpx 18rpx;border-radius:20rpx;background:rgba(26,31,46,0.85)}
.cv-status-badge-text{font-size:22rpx;font-weight:600;color:#ffffff}
.cv-offline{background:rgba(89,89,89,0.3)}
.cv-online{background:rgba(26,31,46,0.85)}
.cv-status-dot{width:14rpx;height:14rpx;border-radius:50%;flex-shrink:0}
.cv-dot-online{background:#73D13D;box-shadow:0 0 10rpx #73D13D}
.cv-dot-warning{background:#FFA940;box-shadow:0 0 10rpx #FFA940;animation:breathe 2s ease-in-out infinite}
.cv-dot-off{background:#595959}
.cv-time-display{font-size:28rpx;font-weight:700;color:#ffffff;font-family:Courier New,monospace}

/* ==================== 右侧工具栏增强（SOS脉冲 + 测距 + 图层角标） ==================== */
.cv-controls-title{padding:4rpx 8rpx 10rpx;font-size:20rpx;font-weight:800;color:#365268;text-align:center;letter-spacing:2rpx}

@keyframes sos-pulse{0%{box-shadow:0 8rpx 32rpx rgba(255,77,79,0.6)}50%{box-shadow:0 8rpx 32rpx rgba(255,77,79,0.9),0 0 0 20rpx rgba(255,77,79,0)}100%{box-shadow:0 8rpx 32rpx rgba(255,77,79,0.6)}}
.cv-sos-progress-ring{position:absolute;top:0;left:0;right:0;bottom:0;border-radius:22rpx;overflow:hidden;pointer-events:none}
.cv-sos-progress-fill{position:absolute;top:0;left:0;height:100%;background:rgba(255,255,255,0.15);transition:width 0.05s linear}
.cv-btn-active{background:linear-gradient(180deg,rgba(0,212,255,0.3),rgba(0,128,204,0.2)) !important;border-color:rgba(0,212,255,0.5) !important}
.cv-btn-active .cv-btn-icon-img{filter:brightness(1.3)}
.cv-btn-badge{position:absolute;top:-8rpx;right:-8rpx;min-width:32rpx;height:32rpx;padding:0 8rpx;background:#FF4D4F;border-radius:16rpx;display:flex;align-items:center;justify-content:center;font-size:20rpx;font-weight:700;color:#ffffff;border:2rpx solid #0a0e1a}

/* 呼吸灯动画 */
.breathing{animation:breathe 2s ease-in-out infinite}
@keyframes breathe{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.2)}}
</style>
