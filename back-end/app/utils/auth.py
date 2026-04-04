"""
权限控制装饰器
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models import User

def require_role(*roles):
    """
    角色权限检查装饰器
    
    使用示例:
    @require_role('manager', 'admin')
    def some_function():
        pass
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({'message': '用户不存在'}), 404
            
            if user.role not in roles:
                return jsonify({'message': '权限不足'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
