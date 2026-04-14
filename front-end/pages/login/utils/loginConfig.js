// ===== 登录页面配置 =====
// 边境活物走私智能防控平台 - 用户维度与认证配置

// ===== 用户身份维度配置 =====
export const userCategories = [
  {
    value: 'frontline',
    label: '一线执勤',
    icon: '🛂',
    department: '边境反走私支队',
    description: '负责边境巡逻、走私预警响应、现场处置',
    role: 'frontline',
    permissions: ['view_alerts', 'respond_alert', 'update_status', 'view_map']
  },
  {
    value: 'investigator',
    label: '侦查研判',
    icon: '🕵️',
    department: '边境反走私侦查中心',
    description: '负责预警核查、情报分析、案件调查',
    role: 'investigator',
    permissions: ['view_alerts', 'investigate', 'create_case', 'view_stats', 'manage_evidence']
  },
  {
    value: 'commander',
    label: '指挥调度',
    icon: '📡',
    department: '边境反走私指挥中心',
    description: '负责预警分配、任务派发、资源调度',
    role: 'commander',
    permissions: ['view_all', 'dispatch_task', 'view_stats', 'manage_users', 'manage_devices', 'export_data']
  }
]

// ===== 生物识别配置 =====
export const biometricConfig = {
  enabled: true,
  defaultMethod: 'fingerprint',
  methods: [
    { key: 'fingerprint', name: '指纹识别', icon: '👆', description: '使用指纹传感器验证身份' },
    { key: 'face', name: '人脸识别', icon: '😊', description: '使用前置摄像头识别人脸' },
    { key: 'iris', name: '虹膜识别', icon: '👁️', description: '使用虹膜扫描仪验证身份' }
  ],
  timeout: 30000,
  retryLimit: 3
}

// ===== 登录安全配置 =====
export const securityConfig = {
  maxAttempts: 5,
  lockoutDuration: 60,
  sessionTimeout: 7200000,
  requireStrongPassword: true,
  minPasswordLength: 6,
  enableCaptcha: false,
  captchaThreshold: 3
}

// ===== 演示账号配置 =====
export const demoAccounts = [
  {
    name: '演示-边防执勤员',
    badgeNumber: 'BP-DEMO-001',
    role: 'frontline',
    category: 'frontline',
    rank: '边防执勤员',
    department: '广西边境执勤工作站'
  },
  {
    name: '演示-侦查分析员',
    badgeNumber: 'BP-DEMO-002',
    role: 'investigator',
    category: 'investigator',
    rank: '侦查分析员',
    department: '边境反走私侦查中心'
  },
  {
    name: '演示-指挥调度员',
    badgeNumber: 'BP-DEMO-003',
    role: 'commander',
    category: 'commander',
    rank: '指挥调度员',
    department: '广西边境反走私指挥中心'
  }
]

// ===== 角色权限映射 =====
export const rolePermissions = {
  frontline: [
    'view_dashboard',
    'view_alerts',
    'respond_alert',
    'view_map',
    'view_tasks',
    'update_task_status',
    'view_devices',
    'report_incident'
  ],
  investigator: [
    'view_dashboard',
    'view_alerts',
    'investigate_alert',
    'create_case',
    'manage_case',
    'view_tasks',
    'manage_tasks',
    'view_map',
    'view_stats',
    'manage_evidence',
    'view_devices',
    'view_reports'
  ],
  commander: [
    'view_dashboard',
    'view_alerts',
    'dispatch_alert',
    'manage_tasks',
    'view_map',
    'view_all_devices',
    'manage_devices',
    'view_stats',
    'export_data',
    'manage_users',
    'view_reports',
    'system_config',
    'manage_evidence',
    'manage_cases'
  ]
}

// ===== API 端点配置 =====
export const apiEndpoints = {
  login: '/api/v1/auth/login',
  logout: '/api/v1/auth/logout',
  biometric: '/api/v1/auth/biometric',
  refreshToken: '/api/v1/auth/refresh',
  currentUser: '/api/v1/auth/me',
  register: '/api/v1/auth/register'
}

// ===== 登录页「广西边境县（市、区）」覆盖示意标签 =====
// 凭祥、东兴为当前业务试点，在态势 / 预警 / 任务 / 设备模块中侧重展示，登录页仅展示全区覆盖范围
export const loginZoneTags = [
  { name: '龙州水口', color: '#00d4ff' },
  { name: '靖西岳圩', color: '#00d4ff' },
  { name: '那坡平孟', color: '#ffa940' },
  { name: '防城港片区', color: '#73d13d' },
  { name: '崇左边境线', color: '#ffa940' }
]

// 与 biometricConfig.methods 对齐，供登录页 Tab 使用
export const biometricMethods = biometricConfig.methods.map(({ key, name, icon }) => ({ key, name, icon }))

// ===== 登录页面主题配置 =====
export const loginTheme = {
  version: '3.0.0',
  /** 顶栏品牌区使用的 PNG，对应项目 front-end/static/logo.png（uni-app 根路径 /static/） */
  logoSrc: '/static/logo.png',
  platform: '边境活物走私智能防控平台',
  tagline: '热眼擒枭 —— 边境活物走私智能防控引领者',
  zones: loginZoneTags.map((z) => z.name),
  accentColor: '#00d4ff',
  bgColor: '#060a14',
  nodeCount: loginZoneTags.length
}
