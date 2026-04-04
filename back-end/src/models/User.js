import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: {
      len: {
        args: [3, 30],
        msg: '用户名长度必须在3-30个字符之间'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: '请输入有效的邮箱地址'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [6, 255],
        msg: '密码长度至少6个字符'
      }
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: {
        args: [1, 50],
        msg: '姓名长度必须在1-50个字符之间'
      }
    }
  },
  role: {
    type: DataTypes.ENUM('inspector', 'manager', 'admin'),
    defaultValue: 'inspector'
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'busy'),
    defaultValue: 'offline'
  },
  phone: {
    type: DataTypes.STRING(20),
    validate: {
      is: {
        args: /^1[3-9]\d{9}$/,
        msg: '请输入有效的手机号'
      }
    }
  },
  avatar: {
    type: DataTypes.STRING(255)
  },
  department: {
    type: DataTypes.STRING(100)
  },
  badge_number: {
    type: DataTypes.STRING(50)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    // 密码加密钩子
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 实例方法：验证密码
User.prototype.comparePassword = async function(inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

// 实例方法：转换为 JSON 时排除密码
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

export default User;
