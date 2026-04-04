"""
污染源企业模型 (pollution_sources 表)
"""
from app import db
from datetime import datetime


class PollutionSource(db.Model):
    __tablename__ = 'pollution_sources'

    id                   = db.Column(db.Integer, primary_key=True)
    name                 = db.Column(db.String(200), nullable=False)
    type                 = db.Column(db.Enum('water-pollution','air-pollution',
                                             'soil-pollution','waste-pollution'),
                                     nullable=False)
    status               = db.Column(db.Enum('critical','warning','normal'),
                                     default='warning')
    risk_level           = db.Column(db.Enum('low','medium','high','critical'),
                                     default='medium')
    risk_score           = db.Column(db.Integer, default=0)
    latitude             = db.Column(db.Numeric(10, 8), nullable=False)
    longitude            = db.Column(db.Numeric(11, 8), nullable=False)
    address              = db.Column(db.String(500))
    region               = db.Column(db.String(100))
    pollutant_type       = db.Column(db.String(100))
    pollutant_value      = db.Column(db.Numeric(12, 4))
    standard_value       = db.Column(db.Numeric(12, 4))
    unit                 = db.Column(db.String(30))
    legal_basis          = db.Column(db.Text)
    license_number       = db.Column(db.String(100))
    legal_representative = db.Column(db.String(50))
    contact_phone        = db.Column(db.String(20))
    last_inspection_date = db.Column(db.Date)
    is_active            = db.Column(db.Boolean, default=True)
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at           = db.Column(db.DateTime, default=datetime.utcnow,
                                     onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id':              self.id,
            'name':            self.name,
            'type':            self.type,
            'status':          self.status,
            'risk_level':      self.risk_level,
            'risk_score':      self.risk_score,
            'latitude':        float(self.latitude)  if self.latitude  else None,
            'longitude':       float(self.longitude) if self.longitude else None,
            'address':         self.address,
            'region':          self.region,
            'pollutant_type':  self.pollutant_type,
            'pollutant_value': float(self.pollutant_value) if self.pollutant_value else None,
            'standard_value':  float(self.standard_value)  if self.standard_value  else None,
            'unit':            self.unit,
            'legal_basis':     self.legal_basis,
        }

    def __repr__(self):
        return f'<PollutionSource {self.id}: {self.name}>'
