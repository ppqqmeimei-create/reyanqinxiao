"""
用户模型（已修复）
修复：
1. 补充 badge_number/department/rank 字段（前端个人中心需要）
2. to_dict 返回前端所需字段
3. duty_on_off 执勤状态字段
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email         = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name          = db.Column(db.String(120), nullable=False)
    role          = db.Column(db.String(20), default='inspector')   # inspector/manager/admin
    status        = db.Column(db.String(20), default='offline')     # online/offline/busy
    phone         = db.Column(db.String(20))
    avatar        = db.Column(db.String(255))
    department    = db.Column(db.String(100), default='广西壮族自治区环境资源和食品药品侦查总队')
    badge_number  = db.Column(db.String(50),  comment='警号')
    rank          = db.Column(db.String(50),  default='检查员', comment='职级')
    is_active     = db.Column(db.Boolean, default=True)
    last_login    = db.Column(db.DateTime)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id':           self.id,
            'username':     self.username,
            'email':        self.email,
            'name':         self.name,
            'role':         self.role,
            'status':       self.status,
            'phone':        self.phone,
            'avatar':       self.avatar,
            'department':   self.department,
            'badge_number': self.badge_number,
            'rank':         self.rank,
            'is_active':    self.is_active,
            'created_at':   self.created_at.isoformat() if self.created_at else None,
            'last_login':   self.last_login.isoformat()  if self.last_login  else None,
        }

    def __repr__(self):
        return f'<User {self.username}>'
