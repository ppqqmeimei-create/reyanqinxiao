"""
预警模型
"""
from datetime import datetime
from app import db

class Alert(db.Model):
    """预警模型"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    level = db.Column(db.String(20), nullable=False)  # critical, high, medium, low
    status = db.Column(db.String(20), default='pending')  # pending, processing, resolved, ignored
    location = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    risk_score = db.Column(db.Integer, default=0)
    source = db.Column(db.String(50))  # gis, sensor, manual, ai
    evidence_count = db.Column(db.Integer, default=0)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    
    # 关系
    assigned_user = db.relationship('User', backref='alerts')
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'level': self.level,
            'status': self.status,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'risk_score': self.risk_score,
            'source': self.source,
            'evidence_count': self.evidence_count,
            'assigned_to': self.assigned_to,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }
    
    def __repr__(self):
        return f'<Alert {self.title}>'
