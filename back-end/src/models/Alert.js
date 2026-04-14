import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * 预警模型 - 边境活物走私智能防控系统专用
 * 
 * 重构说明（2026-04-08）：
 * - 移除食品/药品/环境监测相关内容
 * - 聚焦濒危物种走私预警
 * - 整合野生动物走私防控功能
 */

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: {
        args: [1, 200],
        msg: '标题长度必须在1-200个字符之间'
      }
    },
    comment: '预警标题'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '预警描述'
  },
  level: {
    type: DataTypes.ENUM('critical', 'warning', 'info'),
    defaultValue: 'warning',
    allowNull: false,
    comment: '预警级别：critical-紧急/warning-警告/info-提示'
  },
  risk_level: {
    type: DataTypes.STRING(32),
    comment: '风险等级：extreme-极高/high-高/medium-中/low-低'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'resolved', 'ignored'),
    defaultValue: 'pending',
    comment: '预警状态：pending-待处理/processing-处置中/resolved-已解决/ignored-已忽略'
  },
  
  // ==================== 走私预警核心类型 ====================
  type: {
    type: DataTypes.ENUM(
      'wildlife-smuggling',    // 活物走私预警 ⭐核心
      'border-intrusion',      // 边境入侵预警
      'suspicious-vehicle',     // 可疑车辆预警
      'checkpoint-anomaly',    // 卡口异常预警
      'illegal-transport',    // 非法运输预警
      'infrared-trigger',      // 红外触发预警
      'vibration-trigger'      // 振动触发预警
    ),
    allowNull: false,
    comment: '预警类型（走私防控方向）'
  },
  category: {
    type: DataTypes.ENUM(
      'wildlife',    // 野生动物走私 ⭐核心
      'border',     // 边境防控
      'vehicle',     // 可疑车辆
      'checkpoint'   // 卡口
    ),
    allowNull: false,
    comment: '预警分类（走私防控方向）'
  },
  
  // ==================== 物种相关信息 ====================
  species_type: {
    type: DataTypes.STRING(128),
    comment: '物种类型：穿山甲/食蟹猴/海龟/象牙/巨蜥/犀牛角等'
  },
  species_count: {
    type: DataTypes.INTEGER,
    comment: '涉案物种数量'
  },
  protection_level: {
    type: DataTypes.ENUM('国家一级', '国家二级', 'CITES附录I', 'CITES附录II', '其他'),
    comment: '保护级别'
  },
  target_type: {
    type: DataTypes.ENUM('person', 'vehicle', 'animal', 'goods', 'unknown'),
    defaultValue: 'unknown',
    comment: '目标类型：人/车辆/动物/货物'
  },
  
  // ==================== 边境地理信息 ====================
  border_section: {
    type: DataTypes.STRING(128),
    comment: '边境区段：凭祥友谊关/东兴口岸/龙州水口/靖西岳圩/那坡桂林'
  },
  smuggling_route: {
    type: DataTypes.STRING(500),
    comment: '疑似走私路线描述'
  },
  source_channel: {
    type: DataTypes.ENUM('device', 'manual', 'report', 'intelligence', 'other'),
    defaultValue: 'device',
    comment: '预警来源渠道'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '预警位置描述'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    comment: '纬度坐标'
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    comment: '经度坐标'
  },
  
  // ==================== 风险评估 ====================
  risk_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '走私风险评分 0-100'
  },
  confidence: {
    type: DataTypes.INTEGER,
    comment: 'AI置信度 0-100'
  },
  legal_basis: {
    type: DataTypes.STRING(500),
    comment: '执法法律依据'
  },
  
  // ==================== 执法相关信息（复用原污染字段语义） ====================
  // 以下字段语义复用：原"污染物类型"现为"生态异常类型"
  anomaly_type: {
    type: DataTypes.STRING(100),
    comment: '生态异常类型（复用水污染/空气污染等字段语义）'
  },
  anomaly_value: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '异常检测值（复用水质/气体等检测值语义）'
  },
  standard_value: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '标准参考值'
  },
  exceed_ratio: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '超标倍数'
  },
  
  // ==================== 案件关联 ====================
  case_id: {
    type: DataTypes.INTEGER,
    comment: '关联案件ID'
  },
  task_id: {
    type: DataTypes.INTEGER,
    comment: '关联任务ID'
  },
  evidence_count: {
    type: DataTypes.INTEGER,
    comment: '关联证据数量'
  },
  
  // ==================== 通用字段 ====================
  source: {
    type: DataTypes.ENUM('device', 'manual', 'hotline', 'social_media', 'enterprise'),
    defaultValue: 'device',
    comment: '预警来源'
  },
  urgency: {
    type: DataTypes.STRING(50),
    comment: '紧急程度'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '分配给（用户ID）'
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '创建者（用户ID）'
  },
  resolved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '解决者（用户ID）'
  },
  resolved_at: {
    type: DataTypes.DATE,
    comment: '解决时间'
  },
  resolution_notes: {
    type: DataTypes.TEXT,
    comment: '解决备注'
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['level'] },
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['category'] },
    { fields: ['species_type'] },
    { fields: ['protection_level'] },
    { fields: ['border_section'] },
    { fields: ['created_at'] },
    { fields: ['risk_score'] },
    { fields: ['latitude', 'longitude'] },
    { fields: ['type', 'level', 'category', 'created_at'] },
    { fields: ['latitude', 'longitude', 'risk_score'] },
    { fields: ['status', 'created_at'] }
  ],
  comment: '预警表 - 边境活物走私防控专用'
});

export default Alert;
