"""
任务位置轨迹模型 (task_locations 表)
"""
from app import db
from datetime import datetime


class TaskLocation(db.Model):
    __tablename__ = 'task_locations'

    id          = db.Column(db.BigInteger, primary_key=True)
    task_id     = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    latitude    = db.Column(db.Numeric(10, 8), nullable=False)
    longitude   = db.Column(db.Numeric(11, 8), nullable=False)
    accuracy    = db.Column(db.Numeric(8, 2))
    altitude    = db.Column(db.Numeric(8, 2))
    speed       = db.Column(db.Numeric(6, 2))
    heading     = db.Column(db.Numeric(6, 2))
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

    task = db.relationship('Task', backref=db.backref('locations', lazy='dynamic'))

    def to_dict(self):
        return {
            'id':          self.id,
            'task_id':     self.task_id,
            'latitude':    float(self.latitude),
            'longitude':   float(self.longitude),
            'accuracy':    float(self.accuracy)  if self.accuracy  else None,
            'altitude':    float(self.altitude)  if self.altitude  else None,
            'speed':       float(self.speed)     if self.speed     else None,
            'heading':     float(self.heading)   if self.heading   else None,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None,
        }

    def __repr__(self):
        return f'<TaskLocation task={self.task_id} ({self.latitude},{self.longitude})>'
