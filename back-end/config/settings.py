"""
后端项目配置文件
"""
import os
from datetime import timedelta

class Config:
    """基础配置"""
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JSON_SORT_KEYS = False
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis配置
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # JWT配置
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # CORS配置
    CORS_ORIGINS = ['http://localhost:8080', 'http://localhost:5173']
    
    # 日志配置
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'logs/app.log'

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    TESTING = False
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    TESTING = False
    LOG_LEVEL = 'WARNING'

class TestingConfig(Config):
    """测试环境配置"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)

# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
