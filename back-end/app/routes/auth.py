"""
认证接口路由（已修复）
修复：支持badge_number警号登录、全接口try-except、token键统一
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app import db
from app.models import User
import logging

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)
VALID_STATUSES = {'online', 'offline', 'busy'}


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'message': '请求体不能为空'}), 400
        # 支持 badge_number（警号）或 username 登录
        username = (data.get('username') or data.get('badge_number') or '').strip()
        password = data.get('password') or ''
        if not username or not password:
            return jsonify({'message': '缺少警号/用户名或密码'}), 400
        # 先按 badge_number 查，再按 username 查
        user = User.query.filter_by(badge_number=username).first()
        if not user:
            user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            return jsonify({'message': '警号或密码错误'}), 401
        if not user.is_active:
            return jsonify({'message': '账号已被禁用，请联系管理员'}), 403
        user.last_login = datetime.utcnow()
        user.status     = 'online'
        db.session.commit()
        t = create_access_token(identity=user.id, expires_delta=timedelta(days=7))
        return jsonify({'token': t, 'access_token': t, 'user': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f'login: {e}', exc_info=True)
        return jsonify({'message': '登录失败，请稍后重试'}), 500


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'message': '请求体不能为空'}), 400
        username = (data.get('username') or '').strip()
        email    = (data.get('email')    or '').strip()
        password = data.get('password') or ''
        if not username or not email or not password:
            return jsonify({'message': '缺少必要字段'}), 400
        if len(password) < 6:
            return jsonify({'message': '密码至少6位'}), 400
        if User.query.filter_by(username=username).first():
            return jsonify({'message': '用户名已存在'}), 409
        if User.query.filter_by(email=email).first():
            return jsonify({'message': '邮箱已被注册'}), 409
        user = User(
            username     = username,
            email        = email,
            name         = (data.get('name') or username).strip(),
            role         = data.get('role', 'inspector'),
            department   = (data.get('department') or '广西壮族自治区环境资源和食品药品侦查总队').strip(),
            badge_number = (data.get('badge_number') or '').strip() or None,
            rank         = (data.get('rank') or '检查员').strip()
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        logger.info(f'User registered: {username}')
        return jsonify({'message': '注册成功', 'user': user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f'register: {e}', exc_info=True)
        return jsonify({'message': '注册失败'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user    = User.query.get(user_id)
        if not user:
            return jsonify({'message': '用户不存在'}), 404
        return jsonify(user.to_dict()), 200
    except Exception as e:
        logger.error(f'get_current_user: {e}', exc_info=True)
        return jsonify({'message': '获取用户信息失败'}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    try:
        user_id = get_jwt_identity()
        user    = User.query.get(user_id)
        if user:
            user.status = 'offline'
            db.session.commit()
        return jsonify({'message': '登出成功'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f'logout: {e}', exc_info=True)
        return jsonify({'message': '登出失败'}), 500


@auth_bp.route('/update-status', methods=['PUT'])
@jwt_required()
def update_status():
    try:
        user_id = get_jwt_identity()
        data    = request.get_json(silent=True) or {}
        status  = data.get('status', '')
        if status not in VALID_STATUSES:
            return jsonify({'message': f'无效状态，可选: {VALID_STATUSES}'}), 400
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': '用户不存在'}), 404
        user.status = status
        db.session.commit()
        return jsonify({'message': '状态更新成功', 'user': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f'update_status: {e}', exc_info=True)
        return jsonify({'message': '状态更新失败'}), 500


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    """修改密码"""
    try:
        user_id  = get_jwt_identity()
        data     = request.get_json(silent=True) or {}
        old_pwd  = data.get('old_password', '')
        new_pwd  = data.get('new_password', '')
        if not old_pwd or not new_pwd:
            return jsonify({'message': '请提供旧密码和新密码'}), 400
        if len(new_pwd) < 6:
            return jsonify({'message': '新密码至少6位'}), 400
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': '用户不存在'}), 404
        if not user.check_password(old_pwd):
            return jsonify({'message': '原密码错误'}), 401
        user.set_password(new_pwd)
        db.session.commit()
        logger.info(f'Password changed for user {user_id}')
        return jsonify({'message': '密码修改成功'}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f'change_password: {e}', exc_info=True)
        return jsonify({'message': '修改密码失败'}), 500
