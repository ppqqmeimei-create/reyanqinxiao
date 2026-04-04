"""
热眼擒枭后端应用初始化
"""
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='development'):
    """应用工厂函数"""
    app = Flask(__name__)
    
    # 配置
    if config_name == 'development':
        from config.settings import DevelopmentConfig
        app.config.from_object(DevelopmentConfig)
    elif config_name == 'production':
        from config.settings import ProductionConfig
        app.config.from_object(ProductionConfig)
    else:
        from config.settings import TestingConfig
        app.config.from_object(TestingConfig)
    
    # 初始化扩展
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # 注册蓝图
    with app.app_context():
        from app.routes import auth_bp, alerts_bp, tasks_bp, devices_bp, gis_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
        app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
        app.register_blueprint(devices_bp, url_prefix='/api/devices')
        app.register_blueprint(gis_bp, url_prefix='/api/gis')
        
        # 创建数据库表
        db.create_all()
    
    return app
