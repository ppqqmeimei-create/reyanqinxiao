import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Task = sequelize.define('Task', {
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
  type: {
    type: DataTypes.ENUM('quick-sampling', 'complete-sampling', 'inspection', 'monitoring'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  warning_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'alerts',
      key: 'id'
    }
  },
  alert_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'alerts',
      key: 'id'
    }
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  start_time: {
    type: DataTypes.DATE
  },
  end_time: {
    type: DataTypes.DATE
  },
  deadline: {
    type: DataTypes.DATE
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  notes: {
    type: DataTypes.TEXT
  },
  completion_notes: {
    type: DataTypes.TEXT
  },
  joint_case_no: {
    type: DataTypes.STRING(64)
  },
  joint_departments: {
    type: DataTypes.JSON
  },
  collaboration_status: {
    type: DataTypes.ENUM('none', 'pending', 'in-progress', 'done'),
    defaultValue: 'none'
  },
  collaboration_notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['priority'] },
    { fields: ['assigned_to'] },
    { fields: ['warning_id'] },
    { fields: ['alert_id'] },
    { fields: ['joint_case_no'] },
    { fields: ['collaboration_status'] },
    { fields: ['created_at'] }
  ]
});

// 任务证据子表
const TaskEvidence = sequelize.define('TaskEvidence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING(50)
  },
  url: {
    type: DataTypes.STRING(500)
  },
  description: {
    type: DataTypes.TEXT
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'task_evidence',
  timestamps: false,
  underscored: true
});

// 联合执法流转时间线
const TaskCollaborationFlow = sequelize.define('TaskCollaborationFlow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  from_status: {
    type: DataTypes.ENUM('none', 'pending', 'in-progress', 'done')
  },
  to_status: {
    type: DataTypes.ENUM('none', 'pending', 'in-progress', 'done'),
    allowNull: false
  },
  action: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  operator_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  department: {
    type: DataTypes.STRING(128)
  },
  notes: {
    type: DataTypes.TEXT
  },
  payload: {
    type: DataTypes.JSON
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'task_collaboration_flows',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['task_id', 'created_at'] },
    { fields: ['to_status', 'created_at'] }
  ]
});

// 任务检查清单子表
const TaskChecklist = sequelize.define('TaskChecklist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  item: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completed_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'task_checklist',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

// 定义关联关系
Task.hasMany(TaskEvidence, { foreignKey: 'task_id', as: 'evidence' });
TaskEvidence.belongsTo(Task, { foreignKey: 'task_id' });

Task.hasMany(TaskChecklist, { foreignKey: 'task_id', as: 'checklist' });
TaskChecklist.belongsTo(Task, { foreignKey: 'task_id' });

Task.hasMany(TaskCollaborationFlow, { foreignKey: 'task_id', as: 'collaborationFlows' });
TaskCollaborationFlow.belongsTo(Task, { foreignKey: 'task_id' });

export { Task, TaskEvidence, TaskChecklist, TaskCollaborationFlow };
export default Task;
