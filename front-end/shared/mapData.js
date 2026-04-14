/**
 * 共享地图数据
 * 统一管理「态势」与「设备」页面中所有点位设备数据。
 * 数据来源：态势页面 hardcode 数据 → 后续接入后端 API 时统一替换此处。
 */

// ==================== 执法巡查（联勤卡口 / 巡查巡组 / 边防哨点）====================
export const borderControlData = [
	// —— 凭祥市（重点 · 对越南谅山省 / 友谊关·铁路口岸） ——
	{id:10101,latitude:22.1882,longitude:106.7255,name:'友谊关口岸联勤卡口',type:'checkpoint',border:'凭祥市',unit:'崇左支队',status:'active',metricA:'一级口岸',metricB:'同登方向'},
	{id:10102,latitude:22.0658,longitude:106.7088,name:'凭祥铁路口岸查验',type:'checkpoint',border:'凭祥市',unit:'铁路专班',status:'on_duty',metricA:'班列3列/日',metricB:'H986 2台'},
	{id:10103,latitude:22.1042,longitude:106.7486,name:'浦寨货运查验点',type:'checkpoint',border:'凭祥市',unit:'口岸专班',status:'active',metricA:'布控12人',metricB:'布点3处'},
	{id:10104,latitude:22.0725,longitude:106.7285,name:'弄尧互市卡口',type:'checkpoint',border:'凭祥市',unit:'凭祥边境大队',status:'active',metricA:'警力10人',metricB:'X光机1台'},
	{id:10105,latitude:22.0918,longitude:106.7362,name:'弄怀互市巡组',type:'patrol',border:'凭祥市',unit:'边境管理队',status:'on_duty',metricA:'巡组3组',metricB:'无人机1架'},
	{id:10106,latitude:22.1795,longitude:106.7318,name:'友谊关快反巡组',type:'patrol',border:'凭祥市',unit:'特警快反',status:'active',metricA:'5分钟圈',metricB:'装甲1辆'},
	{id:10107,latitude:22.0388,longitude:106.6925,name:'油隘通道观察哨',type:'sentry',border:'凭祥市',unit:'隘口哨所',status:'active',metricA:'视频12路',metricB:'光纤震动'},
	{id:10108,latitude:22.0562,longitude:106.7158,name:'叫隘山界碑哨',type:'sentry',border:'凭祥市',unit:'隘口哨所',status:'warning',metricA:'震动报警',metricB:'热成像异常'},
	// —— 东兴市（重点 · 对越南广宁省 / 东兴口岸·界碑一号） ——
	{id:10111,latitude:21.5558,longitude:107.9685,name:'东兴口岸主卡口',type:'checkpoint',border:'东兴市',unit:'防城港支队',status:'active',metricA:'一级口岸',metricB:'芒街方向'},
	{id:10112,latitude:21.5385,longitude:107.9788,name:'边民互市通道查验',type:'checkpoint',border:'东兴市',unit:'口岸专班',status:'on_duty',metricA:'高峰分流',metricB:'CT机1'},
	{id:10113,latitude:21.5318,longitude:107.9822,name:'东兴口岸巡防组',type:'patrol',border:'东兴市',unit:'防城港支队',status:'active',metricA:'警力8人',metricB:'热成像4台'},
	{id:10114,latitude:21.5125,longitude:107.9758,name:'北仑河口水上巡组',type:'patrol',border:'东兴市',unit:'水上巡逻队',status:'active',metricA:'快艇2艘',metricB:'人员6名'},
	{id:10115,latitude:21.5158,longitude:107.9685,name:'北仑河界碑执勤哨',type:'sentry',border:'东兴市',unit:'水上巡逻队',status:'active',metricA:'哨兵4人',metricB:'快艇2艘'},
	{id:10116,latitude:21.4812,longitude:108.0388,name:'大清国一号界碑执勤点',type:'sentry',border:'东兴市',unit:'竹山警务',status:'on_duty',metricA:'景点联防',metricB:'客流正常'},
	{id:10117,latitude:21.4985,longitude:108.0118,name:'万尾金滩海防哨',type:'sentry',border:'东兴市',unit:'海警工作站',status:'on_duty',metricA:'雷达开启',metricB:'AIS正常'},
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
	{id:10162,latitude:23.2525,longitude:105.9188,name:'百省边境巡组',type:'patrol',border:'那坡县',unit:'那坡大队',status:'warning',metricA:'便道预警',metricB:'待增援'},
	// —— 防城区（136km · 滩散·里火 / 对广宁） ——
	{id:10171,latitude:21.7825,longitude:108.2525,name:'滩散互市巡组',type:'patrol',border:'防城区',unit:'防城港支队',status:'active',metricA:'步巡4人',metricB:'视频联动'},
	{id:10172,latitude:21.6688,longitude:108.0488,name:'里火互市卡口',type:'checkpoint',border:'防城区',unit:'防城边境大队',status:'active',metricA:'互市高峰',metricB:'查验台2'}
]

// ==================== 生态监测（水质 / 土壤 / 空气） ====================
// 已移除——生态监测数据与「边境活体野生动物走私防控」主线不符
// export const ecologyData = [ ... ]

// ==================== 走私活体野生动物线索（仅保留 live-transport 类型）====================
export const smugglingData = [
	// 凭祥
	{id:20101,latitude:22.1825,longitude:106.7288,name:'凭祥·友谊关货场活体疑点',type:'live-transport',border:'凭祥市',unit:'情指中心',status:'pending',risk_level:'高',time:'07:20',metricA:'冷柜车2',metricB:'气味异常'},
	{id:20104,latitude:22.0755,longitude:106.7355,name:'凭祥·弄尧互市冻品夹带',type:'live-transport',border:'凭祥市',unit:'打私专班',status:'investigating',risk_level:'中',time:'11:40',metricA:'冻柜3个',metricB:'X光复核'},
	// 东兴
	{id:20113,latitude:21.5088,longitude:107.9622,name:'东兴·北仑河走私活物预警',type:'live-transport',border:'东兴市',unit:'水上缉私',status:'pending',risk_level:'高',time:'05:30',metricA:'橡皮艇1',metricB:'夜间红外'},
	{id:20114,latitude:21.4925,longitude:108.0225,name:'东兴·竹山便道可疑车辆',type:'live-transport',border:'东兴市',unit:'边境大队',status:'investigating',risk_level:'中高',time:'22:18',metricA:'SUV 1',metricB:'绕关轨迹'},
	// 其他县
	{id:20123,latitude:22.8525,longitude:106.7255,name:'大新·硕龙游客携带象牙制品线索',type:'live-transport',border:'大新县',unit:'森林公安',status:'pending',risk_level:'高',time:'15:05',metricA:'纪念品店',metricB:'快检阳性'},
	{id:20126,latitude:23.1355,longitude:105.8825,name:'那坡·平孟非设关绕关',type:'live-transport',border:'那坡县',unit:'打私专班',status:'pending',risk_level:'中高',time:'04:12',metricA:'摩托2',metricB:'山林轨迹'},
	{id:20127,latitude:21.7755,longitude:108.2455,name:'防城·滩散互市冻品线索',type:'live-transport',border:'防城区',unit:'食药侦',status:'investigating',risk_level:'中',time:'13:50',metricA:'泡沫箱20',metricB:'检疫证缺'}
]

// ==================== 图标映射（仅保留与主线相关的图标）====================
export const markerIconMap = {
	// 边境执法
	checkpoint:           '/static/icons/checkpoint.png',
	patrol:               '/static/icons/drone.png',
	sentry:               '/static/icons/boundary-marker.png',
	// 走私活体
	'live-transport':     '/static/icons/food.png',
	// 设备类型
	'camera-infrared':   '/static/icons/camera-infrared.png',
	'camera-visible':     '/static/icons/camera-visible.png',
	fiber:                '/static/icons/fiber.png',
	smell:                '/static/icons/smell.png',
	'drone':              '/static/icons/drone.png'
}
