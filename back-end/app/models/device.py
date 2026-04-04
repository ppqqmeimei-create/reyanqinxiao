"""
设备模型（已修复对齐前端字段）
修复：
1. type 字段枚举含 warning 相关设备类型
2. status 枚举含 'warning'
3. 字段别名：battery（前端）= battery_level（旧后端），signal = signal_strength
4. to_dict 输出前端期望字段：device_id, type, battery, signal, last_active
"""
from datetime import datetime
from app import db


class Device(db.Model):
    __tablename__ = 'devices'

    id               = db.Column(db.Integer, primary_key=True)
    device_id        = db.Column(db.String(50), unique=True, comment='设备编号如CAM-001')
    name             = db.Column(db.String(100), nullable=False)
    type             = db.Column(db.Enum(
                           'camera-visible','camera-infrared','fiber','smell',
                           'water-monitor','air-monitor','soil-monitor'
                       ), nullable=False)
    status           = db.Column(db.Enum('online','offline','warning','error'),
                                 default='offline')
    location         = db.Column(db.String(255), default='未知位置')
    latitude         = db.Column(db.Float)
    longitude        = db.Column(db.Float)
    battery          = db.Column(db.Integer, default=100, comment='电量0-100')
    signal_strength  = db.Column(db.Integer, default=100, comment='信号强度0-100')
    edge_node_id     = db.Column(db.String(50), comment='所属边缘节点ID')
    last_active      = db.Column(db.DateTime, comment='最后活跃时间')
    last_heartbeat   = db.Column(db.DateTime, comment='最后心跳时间')
    firmware_version = db.Column(db.String(50))
    hardware_version = db.Column(db.String(50))
    manufacturer     = db.Column(db.String(100))
    model            = db.Column(db.String(100))
    serial_number    = db.Column(db.String(100), unique=True)
    installation_date= db.Column(db.Date)
    maintenance_date = db.Column(db.Date)
    is_active        = db.Column(db.Boolean, default=True)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow,
                                  onupdate=datetime.utcnow)

    def to_dict(self):
        """输出前端期望字段（device_id/type/battery/signal/last_active）"""
        return {
            'id':               self.id,
            'device_id':        self.device_id or str(self.id),
            'name':             self.name,
            'type':             self.type,
            'status':           self.status,
            'location':         self.location,
            'latitude':         self.latitude,
            'longitude':        self.longitude,
            'battery':          self.battery,           # 前端用 battery
            'battery_level':    self.battery,           # 兼容旧字段
            'signal':           self.signal_strength,   # 前端用 signal
            'signal_strength':  self.signal_strength,   # 兼容旧字段
            'edge_node_id':     self.edge_node_id,
            'last_active':      self.last_active.isoformat()    if self.last_active    else None,
            'last_heartbeat':   self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            'firmware_version': self.firmware_version,
            'model':            self.model,
            'serial_number':    self.serial_number,
            'is_active':        self.is_active,
            'created_at':       self.created_at.isoformat() if self.created_at else None,
            'updated_at':       self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Device {self.device_id or self.id}: {self.name}>'
