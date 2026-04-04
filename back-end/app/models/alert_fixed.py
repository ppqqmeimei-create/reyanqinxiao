"""
预警模型（已修复）
"""
from datetime import datetime
from app import db

class Alert(db.Model):
    """预警模型"""
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    case_number = db.Column(db.String(50), unique=True)  # 案件编号
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    level = db.Column(db.String(20), nullable=False)  # critical, warning, info
    status = db.Column(db.String(20), default='pending')  # pending, processing, resolved, ignored
    type = db.Column(db.String(50))  # water-pollution, air-pollution, soil-pollution, waste-pollution
    category = db.Column(db.String(20))  # water, air, soil, waste
    location = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    risk_score = db.Column(db.Integer, default=0)
    pollutant_type = db.Column(db.String(100))  # 污染物类型
    pollutant_value = db.Column(db.Float)  # 污染物浓度
    standard_value = db.Column(db.Float)  # 标准值
    exceed_ratio = db.Column(db.Float)  # 超标倍数
    affected_population = db.Column(db.Integer)  # 影响人口
    source = db.Column(db.String(50))  # device, manual, hotline, social_media, enterprise
    urgency = db.Column(db.String(50))  # 紧急程度
    legal_basis = db.Column(db.Text)  # 法律依据
    penalty_suggestion = db.Column(db.Text)  # 处罚建议
    evidence_count = db.Column(db.Integer, default=0)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    
    # 关系
    assigned_user = db.relationship('User', backref='alerts')
    
    def to_dict(self):
        """转换为字典（使用驼峰命名匹配前端）"""
        return {
            'id': self.id,
            'caseNo': self.case_number,
            'title': self.title,
            'description': self.description,
            'level': self.level,
            'status': self.status,
            'type': self.type,
            'category': self.category,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'riskScore': self.risk_score,
            'pollutantType': self.pollutant_type,
            'pollutantValue': self.pollutant_value,
            'standardValue': self.standard_value,
            'exceedRatio': self.exceed_ratio,
            'affectedPopulation': self.affected_population,
            'source': self.source,
            'urgency': self.urgency,
            'legalBasis': self.legal_basis,
            'penaltySuggestion': self.penalty_suggestion,
            'evidenceCount': self.evidence_count,
            'assignedTo': self.assigned_to,
            'time': self.created_at.isoformat() if self.created_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'resolvedAt': self.resolved_at.isoformat() if self.resolved_at else None,
            'handled': self.status == 'ignored'
        }
    
    def __repr__(self):
        return f'<Alert {self.title}>'
