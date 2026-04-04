/**
 * zoneConfig.js — 广西边境五大战区配置及静态地图数据
 * 数据来源：参考"热眼擒枭"项目
 */

export const ZONE_LIST = [
	{ id: 'pingxiang', name: '凭祥友谊关', lat: 22.0150, lng: 106.7580, scale: 14, level: 'high', unit: '崇左支队' },
	{ id: 'dongxing',  name: '东兴口岸',   lat: 21.5400, lng: 107.9700, scale: 14, level: 'high', unit: '防城港支队' },
	{ id: 'longzhou',  name: '龙州水口',   lat: 22.4868, lng: 106.6719, scale: 13, level: 'mid',  unit: '崇左支队' },
	{ id: 'jingxi',    name: '靖西岳圩',   lat: 23.1340, lng: 106.4170, scale: 13, level: 'mid',  unit: '百色支队' },
	{ id: 'napo',      name: '那坡桂林',   lat: 23.4245, lng: 105.8336, scale: 13, level: 'low',  unit: '百色支队' }
]

// 界碑点位
export const BORDER_BOUNDARY_MARKERS = [
	{ id: 7001, lat: 21.5318, lng: 108.0325, type: 'boundary-marker', border: '东兴段', unit: '[防城港支队]', name: '中越边境1127号界碑' },
	{ id: 7002, lat: 22.1128, lng: 106.7612, type: 'boundary-marker', border: '凭祥段', unit: '[崇左支队]',   name: '中越边境1154号界碑' },
	{ id: 7003, lat: 22.4868, lng: 106.6719, type: 'boundary-marker', border: '龙州段', unit: '[崇左支队]',   name: '中越边境1168号界碑' },
	{ id: 7004, lat: 23.4245, lng: 105.8336, type: 'boundary-marker', border: '那坡段', unit: '[百色支队]',   name: '中越边境1189号界碑' },
	{ id: 7005, lat: 23.1340, lng: 106.4170, type: 'boundary-marker', border: '靖西段', unit: '[百色支队]',   name: '中越边境1176号界碑' }
]

// 联合执勤点
export const JOINT_DUTY_POINTS = [
	{ id: 8001, lat: 21.5380, lng: 107.9650, type: 'joint-duty', border: '东兴段', unit: '[防城港支队]', officers: 6,  name: '东兴口岸联合执勤点'  },
	{ id: 8002, lat: 22.1080, lng: 106.7620, type: 'joint-duty', border: '凭祥段', unit: '[崇左支队]',   officers: 8,  name: '凭祥浦寨联合执勤点'  },
	{ id: 8003, lat: 22.0150, lng: 106.7580, type: 'joint-duty', border: '凭祥段', unit: '[崇左支队]',   officers: 10, name: '友谊关联合执勤点'    },
	{ id: 8004, lat: 22.4868, lng: 106.6719, type: 'joint-duty', border: '龙州段', unit: '[崇左支队]',   officers: 5,  name: '水口口岸联合执勤点'  },
	{ id: 8005, lat: 23.4245, lng: 105.8336, type: 'joint-duty', border: '那坡段', unit: '[百色支队]',   officers: 4,  name: '那坡边境联合执勤点'  }
]

// 红外哨位（27个设备）
export const INFRARED_SENTRY_POINTS = [
	// 防城港支队（东兴段）
	{ id: 9001, lat: 21.5450, lng: 107.9720, type: 'infrared-sentry', border: '东兴段', unit: '[防城港支队]', status: 'online',  trigger_today: 3, name: '东兴口岸红外相机A',  device_id: 'GX-IR-101' },
	{ id: 9002, lat: 21.5200, lng: 108.0100, type: 'infrared-sentry', border: '东兴段', unit: '[防城港支队]', status: 'warning', trigger_today: 6, name: '东兴口岸红外相机B',  device_id: 'GX-IR-102' },
	{ id: 9003, lat: 21.5550, lng: 107.9900, type: 'infrared-sentry', border: '东兴段', unit: '[防城港支队]', status: 'online',  trigger_today: 1, name: '东兴光纤传感器01',   device_id: 'GX-VIB-101' },
	{ id: 9004, lat: 21.6000, lng: 107.8500, type: 'infrared-sentry', border: '东兴段', unit: '[防城港支队]', status: 'online',  trigger_today: 0, name: '东兴光纤传感器02',   device_id: 'GX-VIB-102' },
	{ id: 9005, lat: 21.5380, lng: 107.9650, type: 'infrared-sentry', border: '东兴段', unit: '[防城港支队]', status: 'online',  trigger_today: 2, name: '东兴可见光摄像机01', device_id: 'GX-CAM-101' },
	{ id: 9006, lat: 21.5700, lng: 107.9200, type: 'infrared-sentry', border: '东兴段', unit: '[防城港支队]', status: 'offline', trigger_today: 0, name: '东兴可见光摄像机02', device_id: 'GX-CAM-102' },
	// 崇左支队（凭祥段）
	{ id: 9007, lat: 22.1128, lng: 106.7612, type: 'infrared-sentry', border: '凭祥段', unit: '[崇左支队]', status: 'warning', trigger_today: 7, name: '友谊关红外相机A',    device_id: 'GX-IR-201' },
	{ id: 9008, lat: 22.1080, lng: 106.7620, type: 'infrared-sentry', border: '凭祥段', unit: '[崇左支队]', status: 'online',  trigger_today: 2, name: '友谊关红外相机B',    device_id: 'GX-IR-202' },
	{ id: 9009, lat: 22.0900, lng: 106.7500, type: 'infrared-sentry', border: '凭祥段', unit: '[崇左支队]', status: 'online',  trigger_today: 1, name: '凭祥光纤传感器01',  device_id: 'GX-VIB-201' },
	{ id: 9010, lat: 22.0700, lng: 106.7400, type: 'infrared-sentry', border: '凭祥段', unit: '[崇左支队]', status: 'online',  trigger_today: 0, name: '凭祥光纤传感器02',  device_id: 'GX-VIB-202' },
	{ id: 9011, lat: 22.1050, lng: 106.7580, type: 'infrared-sentry', border: '凭祥段', unit: '[崇左支队]', status: 'online',  trigger_today: 3, name: '凭祥可见光摄像机01', device_id: 'GX-CAM-201' },
	{ id: 9012, lat: 22.1300, lng: 106.7800, type: 'infrared-sentry', border: '凭祥段', unit: '[崇左支队]', status: 'warning', trigger_today: 4, name: '凭祥可见光摄像机02', device_id: 'GX-CAM-202' },
	// 崇左支队（龙州段）
	{ id: 9013, lat: 22.4920, lng: 106.6800, type: 'infrared-sentry', border: '龙州段', unit: '[崇左支队]', status: 'online',  trigger_today: 1, name: '龙州水口红外相机',  device_id: 'GX-IR-203' },
	{ id: 9014, lat: 22.4868, lng: 106.6719, type: 'infrared-sentry', border: '龙州段', unit: '[崇左支队]', status: 'online',  trigger_today: 0, name: '龙州光纤传感器',    device_id: 'GX-VIB-203' },
	// 大新德天
	{ id: 9015, lat: 22.8500, lng: 106.6000, type: 'infrared-sentry', border: '大新段', unit: '[崇左支队]', status: 'online',  trigger_today: 2, name: '大新德天红外相机',  device_id: 'GX-IR-401' },
	{ id: 9016, lat: 22.8200, lng: 106.5800, type: 'infrared-sentry', border: '大新段', unit: '[崇左支队]', status: 'online',  trigger_today: 0, name: '大新光纤传感器',    device_id: 'GX-VIB-401' },
	{ id: 9017, lat: 22.8700, lng: 106.6200, type: 'infrared-sentry', border: '大新段', unit: '[崇左支队]', status: 'online',  trigger_today: 1, name: '大新可见光摄像机',  device_id: 'GX-CAM-401' },
	// 百色支队（那坡段）
	{ id: 9018, lat: 23.4300, lng: 105.8400, type: 'infrared-sentry', border: '那坡段', unit: '[百色支队]', status: 'warning', trigger_today: 5, name: '那坡红外相机A',      device_id: 'GX-IR-301' },
	{ id: 9019, lat: 23.4100, lng: 105.8200, type: 'infrared-sentry', border: '那坡段', unit: '[百色支队]', status: 'online',  trigger_today: 1, name: '那坡红外相机B',      device_id: 'GX-IR-302' },
	{ id: 9020, lat: 23.3872, lng: 105.8341, type: 'infrared-sentry', border: '那坡段', unit: '[百色支队]', status: 'online',  trigger_today: 0, name: '那坡光纤传感器01',  device_id: 'GX-VIB-301' },
	{ id: 9021, lat: 23.4500, lng: 105.8600, type: 'infrared-sentry', border: '那坡段', unit: '[百色支队]', status: 'offline', trigger_today: 0, name: '那坡光纤传感器02',  device_id: 'GX-VIB-302' },
	{ id: 9022, lat: 23.4245, lng: 105.8336, type: 'infrared-sentry', border: '那坡段', unit: '[百色支队]', status: 'online',  trigger_today: 2, name: '那坡可见光摄像机',  device_id: 'GX-CAM-301' },
	// 百色支队（靖西段）
	{ id: 9023, lat: 23.1400, lng: 106.4200, type: 'infrared-sentry', border: '靖西段', unit: '[百色支队]', status: 'online',  trigger_today: 2, name: '靖西红外相机A',      device_id: 'GX-IR-303' },
	{ id: 9024, lat: 23.1200, lng: 106.4000, type: 'infrared-sentry', border: '靖西段', unit: '[百色支队]', status: 'online',  trigger_today: 0, name: '靖西红外相机B',      device_id: 'GX-IR-304' },
	{ id: 9025, lat: 23.1340, lng: 106.4170, type: 'infrared-sentry', border: '靖西段', unit: '[百色支队]', status: 'online',  trigger_today: 1, name: '靖西光纤传感器01',  device_id: 'GX-VIB-303' },
	{ id: 9026, lat: 23.1600, lng: 106.4400, type: 'infrared-sentry', border: '靖西段', unit: '[百色支队]', status: 'warning', trigger_today: 3, name: '靖西光纤传感器02',  device_id: 'GX-VIB-304' },
	{ id: 9027, lat: 23.1450, lng: 106.4250, type: 'infrared-sentry', border: '靖西段', unit: '[百色支队]', status: 'online',  trigger_today: 0, name: '靖西可见光摄像机',  device_id: 'GX-CAM-302' }
]

// 走私线索标记
export const BORDER_SMUGGLING_MARKERS = [
	{ id: 5001, lat: 21.5318, lng: 108.0325, type: 'checkpoint-anomaly', status: 'critical', icon: '/static/icons/alert-smuggling.png', border: '东兴段', species: '食蟹猴',    count: 12, level: 'CITES附录II', name: '卡口异常：万尾金滩疑似非法运输食蟹猴' },
	{ id: 5002, lat: 22.1128, lng: 106.7612, type: 'infrared-trigger',   status: 'critical', icon: '/static/icons/alert-smuggling.png', border: '凭祥段', species: '疑似穿山甲', count: 3,  level: '国家一级',    name: '红外触发：友谊关疑似穿山甲走私'       },
	{ id: 5003, lat: 23.4245, lng: 105.8336, type: 'intelligence',       status: 'warning',  icon: '/static/icons/alert-smuggling.png', border: '那坡段', species: '未知活体',   count: 0,  level: '未知',        name: '情报：那坡界碑处发现异常震动'          }
]

// 边境卡口设备（40+台）
export const BORDER_CONTROL_POINTS = [
	// 防城港支队（东兴段）
	{ id: 6001, lat: 21.5318, lng: 108.0325, type: 'checkpoint-camera', status: 'warning', icon: '/static/icons/checkpoint.png',     border_section: '东兴段', unit: '[防城港支队]', device_label: '边境卡口',   risk_score: 94, species_lead: '食蟹猴×12',  last_trigger: '2小时前',  name: '万尾金滩边境卡口',      device_id: 'GX-CAM-101' },
	{ id: 6002, lat: 21.5200, lng: 108.0100, type: 'infrared-camera',   status: 'warning', icon: '/static/icons/camera-infrared.png', border_section: '东兴段', unit: '[防城港支队]', device_label: '红外相机',   risk_score: 82, species_lead: '疑似活体',    last_trigger: '8分钟前',  name: '东兴口岸红外相机B',     device_id: 'GX-IR-102'  },
	{ id: 6003, lat: 21.5550, lng: 107.9900, type: 'fiber-vibration',   status: 'online',  icon: '/static/icons/fiber.png',          border_section: '东兴段', unit: '[防城港支队]', device_label: '震动光纤',   risk_score: 45, species_lead: '待核查',      last_trigger: '1天前',    name: '东兴竹山光纤传感器',    device_id: 'GX-VIB-101' },
	{ id: 6004, lat: 21.5700, lng: 107.9200, type: 'checkpoint-camera', status: 'error',   icon: '/static/icons/device-offline.png', border_section: '东兴段', unit: '[防城港支队]', device_label: '可见光摄像', risk_score: 20, species_lead: '—',           last_trigger: '2小时前',  name: '江平镇边境摄像机（故障）', device_id: 'GX-CAM-102' },
	// 崇左支队（凭祥段）
	{ id: 6005, lat: 22.1128, lng: 106.7612, type: 'infrared-camera',   status: 'warning', icon: '/static/icons/camera-infrared.png', border_section: '凭祥段', unit: '[崇左支队]', device_label: '红外相机',   risk_score: 96, species_lead: '穿山甲×3',   last_trigger: '5分钟前',  name: '友谊关红外相机A',       device_id: 'GX-IR-201'  },
	{ id: 6006, lat: 22.1080, lng: 106.7620, type: 'infrared-camera',   status: 'online',  icon: '/static/icons/camera-infrared.png', border_section: '凭祥段', unit: '[崇左支队]', device_label: '红外相机',   risk_score: 61, species_lead: '待核查',      last_trigger: '1分钟前',  name: '凭祥浦寨红外相机B',     device_id: 'GX-IR-202'  },
	{ id: 6007, lat: 22.0900, lng: 106.7500, type: 'fiber-vibration',   status: 'online',  icon: '/static/icons/fiber.png',          border_section: '凭祥段', unit: '[崇左支队]', device_label: '震动光纤',   risk_score: 38, species_lead: '—',           last_trigger: '刚刚',     name: '凭祥铁路光纤传感器01',  device_id: 'GX-VIB-201' },
	{ id: 6008, lat: 22.0700, lng: 106.7400, type: 'fiber-vibration',   status: 'online',  icon: '/static/icons/fiber.png',          border_section: '凭祥段', unit: '[崇左支队]', device_label: '震动光纤',   risk_score: 42, species_lead: '—',           last_trigger: '4分钟前',  name: '木棉河光纤传感器02',    device_id: 'GX-VIB-202' },
	{ id: 6009, lat: 22.1300, lng: 106.7800, type: 'checkpoint-camera', status: 'warning', icon: '/static/icons/checkpoint.png',     border_section: '凭祥段', unit: '[崇左支队]', device_label: '可见光摄像', risk_score: 70, species_lead: '疑似活体',    last_trigger: '12分钟前', name: '凭祥弄尧可见光摄像机',  device_id: 'GX-CAM-202' },
	// 崇左支队（龙州段）
	{ id: 6010, lat: 22.4920, lng: 106.6800, type: 'infrared-camera',   status: 'online',  icon: '/static/icons/camera-infrared.png', border_section: '龙州段', unit: '[崇左支队]', device_label: '红外相机',   risk_score: 55, species_lead: '待核查',      last_trigger: '3分钟前',  name: '龙州水口红外相机',      device_id: 'GX-IR-203'  },
	{ id: 6011, lat: 22.4868, lng: 106.6719, type: 'life-radar',        status: 'online',  icon: '/static/icons/smell.png',          border_section: '龙州段', unit: '[崇左支队]', device_label: '震动光纤',   risk_score: 61, species_lead: '待核查',      last_trigger: '1天前',    name: '龙州磨斗光纤传感器',    device_id: 'GX-VIB-203' },
	// 大新德天段
	{ id: 6012, lat: 22.8500, lng: 106.6000, type: 'infrared-camera',   status: 'online',  icon: '/static/icons/camera-infrared.png', border_section: '大新段', unit: '[崇左支队]', device_label: '红外相机',   risk_score: 48, species_lead: '—',           last_trigger: '6分钟前',  name: '大新德天红外相机',      device_id: 'GX-IR-401'  },
	{ id: 6013, lat: 22.8200, lng: 106.5800, type: 'fiber-vibration',   status: 'online',  icon: '/static/icons/fiber.png',          border_section: '大新段', unit: '[崇左支队]', device_label: '震动光纤',   risk_score: 35, species_lead: '—',           last_trigger: '刚刚',     name: '大新桃城光纤传感器',    device_id: 'GX-VIB-401' },
	{ id: 6014, lat: 22.8700, lng: 106.6200, type: 'checkpoint-camera', status: 'online',  icon: '/static/icons/checkpoint.png',     border_section: '大新段', unit: '[崇左支队]', device_label: '可见光摄像', risk_score: 40, species_lead: '—',           last_trigger: '5分钟前',  name: '大新硕龙口岸摄像机',    device_id: 'GX-CAM-401' },
	// 百色支队（那坡段）
	{ id: 6015, lat: 23.4300, lng: 105.8400, type: 'infrared-camera',   status: 'warning', icon: '/static/icons/camera-infrared.png', border_section: '那坡段', unit: '[百色支队]', device_label: '红外相机',   risk_score: 78, species_lead: '疑似活体',    last_trigger: '18分钟前', name: '那坡红外相机A',         device_id: 'GX-IR-301'  },
	{ id: 6016, lat: 23.4100, lng: 105.8200, type: 'infrared-camera',   status: 'online',  icon: '/static/icons/camera-infrared.png', border_section: '那坡段', unit: '[百色支队]', device_label: '红外相机',   risk_score: 52, species_lead: '待核查',      last_trigger: '5分钟前',  name: '那坡红外相机B',         device_id: 'GX-IR-302'  },
	{ id: 6017, lat: 23.3872, lng: 105.8341, type: 'fiber-vibration',   status: 'online',  icon: '/static/icons/fiber.png',          border_section: '那坡段', unit: '[百色支队]', device_label: '震动光纤',   risk_score: 44, species_lead: '—',           last_trigger: '刚刚',     name: '那坡县光纤传感器01',    device_id: 'GX-VIB-301' },
	{ id: 6018, lat: 23.4500, lng: 105.8600, type: 'fiber-vibration',   status: 'error',   icon: '/static/icons/device-offline.png', border_section: '那坡段', unit: '[百色支队]', device_label: '震动光纤',   risk_score: 10, species_lead: '—',           last_trigger: '45分钟前', name: '那坡弄化光纤传感器（故障）', device_id: 'GX-VIB-302' },
	{ id: 6019, lat: 23.4245, lng: 105.8336, type: 'checkpoint-camera', status: 'online',  icon: '/static/icons/checkpoint.png',     border_section: '那坡段', unit: '[百色支队]', device_label: '可见光摄像', risk_score: 58, species_lead: '待核查',      last_trigger: '7分钟前',  name: '那坡口岸摄像机',        device_id: 'GX-CAM-301' },
	// 百色支队（靖西段）
	{ id: 6020, lat: 23.1400, lng: 106.4200, type: 'infrared-camera',   status: 'online',  icon: '/static/icons/camera-infrared.png', border_section: '靖西段', unit: '[百色支队]', device_label: '红外相机',   risk_score: 50, species_lead: '待核查',      last_trigger: '刚刚',     name: '靖西岳圩红外相机A',     device_id: 'GX-IR-303'  },
	{ id: 6021, lat: 23.1200, lng: 106.4000, type: 'infrared-camera',   status: 'online',  icon: '/static/icons/camera-infrared.png', border_section: '靖西段', unit: '[百色支队]', device_label: '红外相机',   risk_score: 47, species_lead: '—',           last_trigger: '2分钟前',  name: '靖西边境红外相机B',     device_id: 'GX-IR-304'  },
	{ id: 6022, lat: 23.1340, lng: 106.4170, type: 'fiber-vibration',   status: 'online',  icon: '/static/icons/fiber.png',          border_section: '靖西段', unit: '[百色支队]', device_label: '震动光纤',   risk_score: 42, species_lead: '—',           last_trigger: '3分钟前',  name: '靖西龙邦光纤传感器01',  device_id: 'GX-VIB-303' },
	{ id: 6023, lat: 23.1600, lng: 106.4400, type: 'fiber-vibration',   status: 'warning', icon: '/static/icons/fiber.png',          border_section: '靖西段', unit: '[百色支队]', device_label: '震动光纤',   risk_score: 65, species_lead: '疑似震动',    last_trigger: '22分钟前', name: '靖西壬庄光纤传感器02',  device_id: 'GX-VIB-304' },
	{ id: 6024, lat: 23.1450, lng: 106.4250, type: 'checkpoint-camera', status: 'online',  icon: '/static/icons/checkpoint.png',     border_section: '靖西段', unit: '[百色支队]', device_label: '可见光摄像', risk_score: 39, species_lead: '—',           last_trigger: '4分钟前',  name: '靖西岳圩口岸摄像机',    device_id: 'GX-CAM-302' },
	// GPS 定位设备
	{ id: 6101, lat: 21.5420, lng: 107.9700, type: 'gps-device', status: 'online',  icon: '/static/icons/gps.png', border_section: '东兴段', unit: '[防城港支队]', device_label: 'GPS定位', risk_score: 0, species_lead: '—', last_trigger: '刚刚',    name: '东兴巡逻GPS-01',  device_id: 'GX-GPS-101' },
	{ id: 6102, lat: 22.1000, lng: 106.7550, type: 'gps-device', status: 'online',  icon: '/static/icons/gps.png', border_section: '凭祥段', unit: '[崇左支队]',   device_label: 'GPS定位', risk_score: 0, species_lead: '—', last_trigger: '2分钟前', name: '凭祥巡逻GPS-01',  device_id: 'GX-GPS-201' },
	{ id: 6103, lat: 23.1380, lng: 106.4180, type: 'gps-device', status: 'warning', icon: '/static/icons/gps.png', border_section: '靖西段', unit: '[百色支队]',   device_label: 'GPS定位', risk_score: 0, species_lead: '—', last_trigger: '9分钟前', name: '靖西巡逻GPS-01',  device_id: 'GX-GPS-301' },
	{ id: 6104, lat: 23.3900, lng: 105.8350, type: 'gps-device', status: 'online',  icon: '/static/icons/gps.png', border_section: '那坡段', unit: '[百色支队]',   device_label: 'GPS定位', risk_score: 0, species_lead: '—', last_trigger: '3分钟前', name: '那坡巡逻GPS-01',  device_id: 'GX-GPS-302' },
	{ id: 6105, lat: 22.4900, lng: 106.6820, type: 'gps-device', status: 'online',  icon: '/static/icons/gps.png', border_section: '龙州段', unit: '[崇左支队]',   device_label: 'GPS定位', risk_score: 0, species_lead: '—', last_trigger: '刚刚',    name: '龙州巡逻GPS-01',  device_id: 'GX-GPS-401' },
	// 无人机
	{ id: 6201, lat: 21.5460, lng: 107.9730, type: 'drone-device', status: 'online',  icon: '/static/icons/drone.png', border_section: '东兴段', unit: '[防城港支队]', device_label: '无人机', risk_score: 0, species_lead: '—', last_trigger: '5分钟前',  name: '东兴巡逻无人机A', device_id: 'GX-UAV-101' },
	{ id: 6202, lat: 22.1100, lng: 106.7600, type: 'drone-device', status: 'warning', icon: '/static/icons/drone.png', border_section: '凭祥段', unit: '[崇左支队]',   device_label: '无人机', risk_score: 0, species_lead: '—', last_trigger: '11分钟前', name: '凭祥无人机B',     device_id: 'GX-UAV-201' },
	{ id: 6203, lat: 23.1360, lng: 106.4160, type: 'drone-device', status: 'online',  icon: '/static/icons/drone.png', border_section: '靖西段', unit: '[百色支队]',   device_label: '无人机', risk_score: 0, species_lead: '—', last_trigger: '1分钟前',  name: '靖西无人机C',     device_id: 'GX-UAV-301' },
	// 气味传感器
	{ id: 6301, lat: 21.5390, lng: 107.9660, type: 'smell-device', status: 'online',  icon: '/static/icons-2/smell.png', border_section: '东兴段', unit: '[防城港支队]', device_label: '气味传感', risk_score: 0, species_lead: '—', last_trigger: '刚刚',    name: '东兴气味传感器-01', device_id: 'GX-SME-101' },
	{ id: 6302, lat: 22.1060, lng: 106.7590, type: 'smell-device', status: 'online',  icon: '/static/icons-2/smell.png', border_section: '凭祥段', unit: '[崇左支队]',   device_label: '气味传感', risk_score: 0, species_lead: '—', last_trigger: '2分钟前', name: '凭祥气味传感器-01', device_id: 'GX-SME-201' },
	{ id: 6303, lat: 23.1440, lng: 106.4240, type: 'smell-device', status: 'error',   icon: '/static/icons-2/smell.png', border_section: '靖西段', unit: '[百色支队]',   device_label: '气味传感', risk_score: 0, species_lead: '—', last_trigger: '1小时前', name: '靖西气味传感器-01', device_id: 'GX-SME-301' },
	{ id: 6304, lat: 22.4930, lng: 106.6810, type: 'smell-device', status: 'online',  icon: '/static/icons-2/smell.png', border_section: '龙州段', unit: '[崇左支队]',   device_label: '气味传感', risk_score: 0, species_lead: '—', last_trigger: '4分钟前', name: '龙州气味传感器-01', device_id: 'GX-SME-401' }
]

// 巡逻路线
export const PATROL_ROUTES_BORDER = [
	{ points: [
		{ latitude: 21.5318, longitude: 108.0325 },
		{ latitude: 21.8000, longitude: 107.5000 },
		{ latitude: 22.1128, longitude: 106.7612 },
		{ latitude: 22.4868, longitude: 106.6719 },
		{ latitude: 23.1340, longitude: 106.4170 },
		{ latitude: 23.4245, longitude: 105.8336 }
	], color: '#00D4FF', width: 4, dottedLine: false }
]

// 走私热点圈
export const SMUGGLING_HOTSPOT_CIRCLES = [
	{ latitude: 21.5318, longitude: 108.0325, radius: 8000,  color: '#FF4D4F33', fillColor: '#FF4D4F1A', strokeWidth: 2 },
	{ latitude: 22.1128, longitude: 106.7612, radius: 10000, color: '#FF4D4F55', fillColor: '#FF4D4F22', strokeWidth: 2 },
	{ latitude: 23.4245, longitude: 105.8336, radius: 6000,  color: '#FFA94033', fillColor: '#FFA9401A', strokeWidth: 2 }
]

// 线索筛选配置
export const CLUE_FILTERS = [
	{ value: 'all',                label: '全部线索', icon: '/static/icons/全部线索.png'          },
	{ value: 'infrared-trigger',   label: '红外触发', icon: '/static/icons/camera-infrared.png'  },
	{ value: 'checkpoint-anomaly', label: '卡口异常', icon: '/static/icons/checkpoint.png'       },
	{ value: 'intelligence',       label: '情报线索', icon: '/static/icons/情报线索.png'        }
]

// 工具栏配置
export const TOOLBAR_CONFIG = [
	{ id: 'dispatch',   icon: 'sos.png',       text: '一键派警', color: '#FF4D4F' },
	{ id: 'patrol',     icon: '巡逻路线.png', text: '巡逻路线', color: '#00D4FF' },
	{ id: 'location',   icon: 'location.png',  text: '定位',     color: '#00D4FF' },
	{ id: 'newcase',    icon: 'compass.png',   text: '新建案件', color: '#FF4D4F' }
]

// 图层开关配置
export const LAYER_SWITCHES = [
	{ key: 'infrared',  icon: '/static/icons/camera-infrared.png',  name: '红外热成像', desc: '红外触发点位 · 走私高风险',  enabled: true },
	{ key: 'vibration', icon: '/static/icons/fiber.png',           name: '振动光纤',   desc: '光纤围栏震动传感器',           enabled: true },
	{ key: 'visible',   icon: '/static/icons/camera-visible.png',  name: '可见光摄像', desc: '口岸卡口可见光点位',           enabled: true },
	{ key: 'gps',       icon: '/static/icons/gps.png',             name: 'GPS定位',    desc: '巡逻人员GPS实时位置',          enabled: true },
	{ key: 'drone',     icon: '/static/icons/drone.png',           name: '无人机',     desc: '无人机巡逻点位',               enabled: true },
	{ key: 'smell',     icon: '/static/icons-2/smell.png',         name: '气味传感',   desc: '口岸气味传感器点位',           enabled: true },
	{ key: 'boundary',  icon: '/static/icons/boundary-marker.png', name: '界碑图层',   desc: '中越边境界碑点位',             enabled: true },
	{ key: 'patrol',    icon: '/static/icons/巡逻路线.png',       name: '巡逻路线',   desc: '边境巡逻路径叠加层',           enabled: true },
	{ key: 'hotspot',   icon: '/static/icons/alert-smuggling.png', name: '走私热点圈', desc: '走私高频区域热点圆圈',         enabled: true }
]
