import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

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
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  level: {
    type: DataTypes.ENUM('critical', 'warning', 'info'),
    defaultValue: 'warning',
    allowNull: false
  },
  risk_level: {
    type: DataTypes.STRING(32)
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'resolved', 'ignored'),
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('wildlife-track', 'habitat-damage', 'water-quality', 'border-anomaly', 'infrared-trigger', 'vehicle-sneak'),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('ecology', 'fooddrug', 'enforcement'),
    allowNull: false
  },
  species_type: {
    type: DataTypes.STRING(128),
    comment: '物种类型（如穿山甲、食蟹猴等），用于走私活物方向'
  },
  target_type: {
    type: DataTypes.ENUM('person', 'vehicle', 'animal', 'goods', 'unknown'),
    defaultValue: 'unknown'
  },
  border_section: {
    type: DataTypes.STRING(128)
  },
  source_channel: {
    type: DataTypes.ENUM('device', 'manual', 'report', 'intelligence', 'other'),
    defaultValue: 'device'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8)
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8)
  },
  risk_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  pollutant_type: {
    type: DataTypes.STRING(100),
    comment: '污染物类型（保留字段名，语义复用为生态异常类型）'
  },
  pollutant_value: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '检测值（复用为风险评分或物种数量）'
  },
  standard_value: {
    type: DataTypes.DECIMAL(10, 2)
  },
  exceed_ratio: {
    type: DataTypes.DECIMAL(10, 2)
  },
  affected_population: {
    type: DataTypes.INTEGER
  },
  source: {
    type: DataTypes.ENUM('device', 'manual', 'hotline', 'social_media', 'enterprise'),
    defaultValue: 'device'
  },
  urgency: {
    type: DataTypes.STRING(50)
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolved_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolved_at: {
    type: DataTypes.DATE
  },
  resolution_notes: {
    type: DataTypes.TEXT
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
    { fields: ['created_at'] },
    { fields: ['risk_score'] },
    { fields: ['latitude', 'longitude'] },
    { fields: ['type', 'level', 'category', 'created_at'] },
    { fields: ['latitude', 'longitude', 'risk_score'] },
    { fields: ['status', 'created_at'] }
  ]
});

export default Alert;
