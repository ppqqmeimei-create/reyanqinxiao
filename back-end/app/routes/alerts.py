"""
预警接口路由
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models import Alert, User, Task

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/list', methods=['GET'])
@jwt_required()
def get_alerts():
    """获取预警列表"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    status = request.args.get('status')
    level = request.args.get('level')
    
    query = Alert.query
    
    if status:
        query = query.filter_by(status=status)
    if level:
        query = query.filter_by(level=level)
    
    # 按创建时间倒序
    alerts = query.order_by(Alert.created_at.desc()).paginate(page=page, per_page=limit)
    
    return jsonify({
        'data': [alert.to_dict() for alert in alerts.items],
        'total': alerts.total,
        'page': page,
        'limit': limit
    }), 200

@alerts_bp.route('/<int:alert_id>', methods=['GET'])
@jwt_required()
def get_alert(alert_id):
    """获取预警详情"""
    alert = Alert.query.get(alert_id)
    
    if not alert:
        return jsonify({'message': '预警不存在'}), 404
    
    return jsonify(alert.to_dict()), 200

@alerts_bp.route('', methods=['POST'])
@jwt_required()
def create_alert():
    """创建预警"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('level'):
        return jsonify({'message': '缺少必要字段'}), 400
    
    alert = Alert(
        title=data.get('title'),
        description=data.get('description'),
        level=data.get('level'),
        location=data.get('location', '未知位置'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        risk_score=data.get('risk_score', 0),
        source=data.get('source', 'manual')
    )
    
    db.session.add(alert)
    db.session.commit()
    
    return jsonify({
        'message': '预警创建成功',
        'alert': alert.to_dict()
    }), 201

@alerts_bp.route('/<int:alert_id>/assign', methods=['PUT'])
@jwt_required()
def assign_alert(alert_id):
    """分配预警给检查员"""
    data = request.get_json()
    
    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'message': '预警不存在'}), 404
    
    user_id = data.get('user_id')
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': '用户不存在'}), 404
    
    alert.assigned_to = user_id
    alert.status = 'processing'
    db.session.commit()
    
    return jsonify({
        'message': '预警已分配',
        'alert': alert.to_dict()
    }), 200

@alerts_bp.route('/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    """解决预警"""
    alert = Alert.query.get(alert_id)
    
    if not alert:
        return jsonify({'message': '预警不存在'}), 404
    
    alert.status = 'resolved'
    alert.resolved_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': '预警已解决',
        'alert': alert.to_dict()
    }), 200

@alerts_bp.route('/<int:alert_id>/ignore', methods=['PUT'])
@jwt_required()
def ignore_alert(alert_id):
    """忽略预警"""
    alert = Alert.query.get(alert_id)
    
    if not alert:
        return jsonify({'message': '预警不存在'}), 404
    
    alert.status = 'ignored'
    db.session.commit()
    
    return jsonify({
        'message': '预警已忽略',
        'alert': alert.to_dict()
    }), 200

@alerts_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_alert_stats():
    """获取预警统计"""
    total = Alert.query.count()
    critical = Alert.query.filter_by(level='critical').count()
    high = Alert.query.filter_by(level='high').count()
    medium = Alert.query.filter_by(level='medium').count()
    low = Alert.query.filter_by(level='low').count()
    
    pending = Alert.query.filter_by(status='pending').count()
    processing = Alert.query.filter_by(status='processing').count()
    resolved = Alert.query.filter_by(status='resolved').count()
    
    return jsonify({
        'total': total,
        'by_level': {
            'critical': critical,
            'high': high,
            'medium': medium,
            'low': low
        },
        'by_status': {
            'pending': pending,
            'processing': processing,
            'resolved': resolved
        }
    }), 200
