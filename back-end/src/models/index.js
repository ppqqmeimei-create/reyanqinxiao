import User from './User.js';
import Alert from './Alert.js';
import { Task, TaskEvidence, TaskChecklist, TaskCollaborationFlow } from './Task.js';
import { Device, DeviceMetadata } from './Device.js';

// ==========================================
// 定义模型之间的关联关系
// ==========================================

// User 和 Alert 的关联
User.hasMany(Alert, { foreignKey: 'assigned_to', as: 'assignedAlerts' });
Alert.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });

User.hasMany(Alert, { foreignKey: 'created_by', as: 'createdAlerts' });
Alert.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Alert, { foreignKey: 'resolved_by', as: 'resolvedAlerts' });
Alert.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver' });

// User 和 Task 的关联
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });

User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Alert 和 Task 的关联
Alert.hasMany(Task, { foreignKey: 'alert_id', as: 'tasks' });
Task.belongsTo(Alert, { foreignKey: 'alert_id', as: 'alert' });

// 导出所有模型
export {
  User,
  Alert,
  Task,
  TaskEvidence,
  TaskChecklist,
  TaskCollaborationFlow,
  Device,
  DeviceMetadata
};

// 导出默认对象
export default {
  User,
  Alert,
  Task,
  TaskEvidence,
  TaskChecklist,
  TaskCollaborationFlow,
  Device,
  DeviceMetadata
};
