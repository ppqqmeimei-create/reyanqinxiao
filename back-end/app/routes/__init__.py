"""
路由初始化
"""
from app.routes.auth import auth_bp
from app.routes.alerts import alerts_bp
from app.routes.tasks import tasks_bp
from app.routes.devices import devices_bp
from app.routes.gis import gis_bp

__all__ = ['auth_bp', 'alerts_bp', 'tasks_bp', 'devices_bp', 'gis_bp']
