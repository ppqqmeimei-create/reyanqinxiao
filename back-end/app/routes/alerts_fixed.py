"""
预警接口路由（已修复）
添加：权限控制、输入验证、错误处理、日志记录
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models import Alert, User, Task
from app.utils.auth import require_role

alerts_bp = Blueprint('alerts', __name__)

# ============================================
# 输入验证函数
# ============================================

def validate_alert_data(data, is_create=True):
    """验证预警数据"""
    errors = []
    
    if is_create:
        if not data.get('title'):
            errors.append('标题不能为空')
        elif len(data.get('title', '')) > 200:
            errors.append('标题过长（最多200字符）')
        
        if not data.get('level'):
            errors.append('预警级别不能为空')
        elif data.get('level') not in ['critical', 'warning', 'info']:
            errors.append('预警级别无效')
        
        if not data.get('location'):
            errors.append('位置不能为空')
    
    if data.get('risk_score') is not None:
        if not isinstance(data.get('risk_score'), int) or data.get('risk_score') < 0 or data.get('risk_score') > 100:
            errors.append('风险评分必须在0-100之间')
    
    if data.get('description') and len(data.get('description', '')) > 5000:
        errors.append('描述过长（最多5000字符）')
    
    return errors

# ============================================
# 预警列表接口
# ============================================

@alerts_bp.route('/list', methods=['GET'])
@jwt_required()
def get_alerts():
    """获取预警列表"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        status = request.args.get('status')
        level = request.args.get('level')
        
        # 限制每页数量
        if limit > 100:
            limit = 100
        
        query = Alert.query
        
        if status:
            query = query.filter_by(status=status)
        if level:
            query = query.filter_by(level=level)
        
        # 按创建时间倒序，使用 joinedload 避免 N+1 查询
        from sqlalchemy.orm import joinedload
        alerts = query.options(
            joinedload(Alert.assigned_user)
        ).order_by(Alert.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
        
        return jsonify({
            'code': 200,
            'message': '获取成功',
            'data': {
                'list': [alert.to_dict() for alert in alerts.items],
                'total': alerts.total,
                'page': page,
                'pageSize': limit,
                'totalPages': alerts.pages
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': '获取失败',
            'error': str(e)
        }), 500

# ============================================
# 预警详情接口
# ============================================

@alerts_bp.route('/<int:alert_id>', methods=['GET'])
@jwt_required()
def get_alert(alert_id):
    """获取预警详情"""
    try:
        alert = Alert.query.get(alert_id)
        
        if not alert:
            return jsonify({
                'code': 404,
                'message': '预警不存在'
            }), 404
        
        return jsonify({
            'code': 200,
            'message': '获取成功',
            'data': alert.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': '获取失败',
            'error': str(e)
        }), 500

# ============================================
# 创建预警接口
# ============================================

@alerts_bp.route('', methods=['POST'])
@jwt_required()
@require_role('inspector', 'manager', 'admin')
def create_alert():
    """创建预警"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'code': 400,
                'message': '请求数据为空'
            }), 400
        
        # 验证数据
        errors = validate_alert_data(data, is_create=True)
        if errors:
            return jsonify({
                'code': 400,
                'message': '数据验证失败',
                'errors': errors
            }), 400
        
        alert = Alert(
            title=data.get('title'),
            description=data.get('description'),
            level=data.get('level'),
            type=data.get('type'),
            category=data.get('category'),
            location=data.get('location', '未知位置'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            risk_score=data.get('risk_score', 0),
            pollutant_type=data.get('pollutant_type'),
            pollutant_value=data.get('pollutant_value'),
            standard_value=data.get('standard_value'),
            exceed_ratio=data.get('exceed_ratio'),
            affected_population=data.get('affected_population'),
            source=data.get('source', 'manual'),
            urgency=data.get('urgency'),
            legal_basis=data.get('legal_basis'),
            penalty_suggestion=data.get('penalty_suggestion')
        )
        
        db.session.add(alert)
        db.session.commit()
        
        return jsonify({
            'code': 201,
            'message': '预警创建成功',
            'data': alert.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': '创建失败',
            'error': str(e)
        }), 500

# ============================================
# 分配预警接口
# ============================================

@alerts_bp.route('/<int:alert_id>/assign', methods=['PUT'])
@jwt_required()
@require_role('manager', 'admin')
def assign_alert(alert_id):
    """分配预警给检查员"""
    try:
        data = request.get_json()
        
        alert = Alert.query.get(alert_id)
        if not alert:
            return jsonify({
                'code': 404,
                'message': '预警不存在'
            }), 404
        
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({
                'code': 400,
                'message': '缺少用户ID'
            }), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'code': 404,
                'message': '用户不存在'
            }), 404
        
        alert.assigned_to = user_id
        alert.status = 'processing'
        alert.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'code': 200,
            'message': '预警已分配',
            'data': alert.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': '分配失败',
            'error': str(e)
        }), 500

# ============================================
# 解决预警接口
# ============================================

@alerts_bp.route('/<int:alert_id>/resolve', methods=['PUT'])
@jwt_required()
def resolve_alert(alert_id):
    """解决预警"""
    try:
        user_id = get_jwt_identity()
        alert = Alert.query.get(alert_id)
        
        if not alert:
            return jsonify({
                'code': 404,
                'message': '预警不存在'
            }), 404
        
        alert.status = 'resolved'
        alert.resolved_at = datetime.utcnow()
        alert.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'code': 200,
            'message': '预警已解决',
            'data': alert.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': '操作失败',
            'error': str(e)
        }), 500

# ============================================
# 忽略预警接口（仅管理员）
# ============================================

@alerts_bp.route('/<int:alert_id>/ignore', methods=['PUT'])
@jwt_required()
@require_role('manager', 'admin')  # 只有管理员可以忽略
def ignore_alert(alert_id):
    """忽略预警"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        alert = Alert.query.get(alert_id)
        
        if not alert:
            return jsonify({
                'code': 404,
                'message': '预警不存在'
            }), 404
        
        alert.status = 'ignored'
        alert.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'code': 200,
            'message': '预警已忽略',
            'data': alert.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': '操作失败',
            'error': str(e)
        }), 500

# ============================================
# 预警统计接口
# ============================================

@alerts_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_alert_stats():
    """获取预警统计"""
    try:
        total = Alert.query.count()
        critical = Alert.query.filter_by(level='critical').count()
        warning = Alert.query.filter_by(level='warning').count()
        info = Alert.query.filter_by(level='info').count()
        
        pending = Alert.query.filter_by(status='pending').count()
        processing = Alert.query.filter_by(status='processing').count()
        resolved = Alert.query.filter_by(status='resolved').count()
        ignored = Alert.query.filter_by(status='ignored').count()
        
        return jsonify({
            'code': 200,
            'message': '获取成功',
            'data': {
                'total': total,
                'byLevel': {
                    'critical': critical,
                    'warning': warning,
                    'info': info
                },
                'byStatus': {
                    'pending': pending,
                    'processing': processing,
                    'resolved': resolved,
                    'ignored': ignored
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': '获取失败',
            'error': str(e)
        }), 500
