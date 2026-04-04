import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  device_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: {
        args: [1, 100],
        msg: '设备名称长度必须在1-100个字符之间'
      }
    }
  },
  type: {
    type: DataTypes.ENUM('camera-visible', 'camera-infrared', 'fiber', 'smell', 'water-monitor', 'air-monitor', 'soil-monitor'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'warning', 'error'),
    defaultValue: 'offline'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  battery: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    }
  },
  signal_strength: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 100
    }
  },
  edge_node_id: {
    type: DataTypes.STRING(50)
  },
  last_active: {
    type: DataTypes.DATE
  },
  last_heartbeat: {
    type: DataTypes.DATE
  },
  firmware_version: {
    type: DataTypes.STRING(50)
  },
  hardware_version: {
    type: DataTypes.STRING(50)
  },
  manufacturer: {
    type: DataTypes.STRING(100)
  },
  model: {
    type: DataTypes.STRING(100)
  },
  installation_date: {
    type: DataTypes.DATEONLY
  },
  maintenance_date: {
    type: DataTypes.DATEONLY
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'devices',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['device_id'], unique: true },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['latitude', 'longitude'] }
  ]
});

// 设备元数据子表
const DeviceMetadata = sequelize.define('DeviceMetadata', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'devices',
      key: 'id'
    }
  },
  ph: {
    type: DataTypes.DECIMAL(4, 2)
  },
  temperature: {
    type: DataTypes.DECIMAL(5, 2)
  },
  humidity: {
    type: DataTypes.DECIMAL(5, 2)
  },
  pm25: {
    type: DataTypes.DECIMAL(8, 2)
  },
  aqi: {
    type: DataTypes.INTEGER
  },
  heavy_metal: {
    type: DataTypes.DECIMAL(8, 4)
  },
  custom_data: {
    type: DataTypes.JSON
  },
  recorded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'device_metadata',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['device_id'] },
    { fields: ['recorded_at'] }
  ]
});

// 定义关联关系
Device.hasMany(DeviceMetadata, { foreignKey: 'device_id', as: 'metadata' });
DeviceMetadata.belongsTo(Device, { foreignKey: 'device_id' });

export { Device, DeviceMetadata };
export default Device;
