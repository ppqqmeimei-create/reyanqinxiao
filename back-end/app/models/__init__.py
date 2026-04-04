"""
数据模型初始化
"""
from app.models.user import User
from app.models.alert import Alert
from app.models.task import Task
from app.models.device import Device
from app.models.pollution_source import PollutionSource
from app.models.task_location import TaskLocation

__all__ = ['User', 'Alert', 'Task', 'Device', 'PollutionSource', 'TaskLocation']
