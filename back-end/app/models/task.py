"""
任务模型
"""
from datetime import datetime
from app import db

class Task(db.Model):
    """任务模型"""
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, cancelled
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    alert_id = db.Column(db.Integer, db.ForeignKey('alerts.id'))
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    location = db.Column(db.String(255))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    target_location = db.Column(db.String(255))
    target_latitude = db.Column(db.Float)
    target_longitude = db.Column(db.Float)
    evidence_count = db.Column(db.Integer, default=0)
    checklist_progress = db.Column(db.Integer, default=0)  # 0-100
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # 关系
    alert = db.relationship('Alert', backref='tasks')
    assigned_user = db.relationship('User', backref='tasks')
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'alert_id': self.alert_id,
            'assigned_to': self.assigned_to,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'target_location': self.target_location,
            'target_latitude': self.target_latitude,
            'target_longitude': self.target_longitude,
            'evidence_count': self.evidence_count,
            'checklist_progress': self.checklist_progress,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
    
    def __repr__(self):
        return f'<Task {self.title}>'
