"""
任务接口路由
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models import Task, Alert, User

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/list', methods=['GET'])
@jwt_required()
def get_tasks():
    """获取任务列表"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    status = request.args.get('status')
    user_id = request.args.get('user_id', type=int)
    
    query = Task.query
    
    if status:
        query = query.filter_by(status=status)
    if user_id:
        query = query.filter_by(assigned_to=user_id)
    
    tasks = query.order_by(Task.created_at.desc()).paginate(page=page, per_page=limit)
    
    return jsonify({
        'data': [task.to_dict() for task in tasks.items],
        'total': tasks.total,
        'page': page,
        'limit': limit
    }), 200

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """获取任务详情"""
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    return jsonify(task.to_dict()), 200

@tasks_bp.route('', methods=['POST'])
@jwt_required()
def create_task():
    """创建任务"""
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'message': '缺少必要字段'}), 400
    
    task = Task(
        title=data.get('title'),
        description=data.get('description'),
        priority=data.get('priority', 'medium'),
        alert_id=data.get('alert_id'),
        assigned_to=data.get('assigned_to'),
        location=data.get('location'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        target_location=data.get('target_location'),
        target_latitude=data.get('target_latitude'),
        target_longitude=data.get('target_longitude')
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify({
        'message': '任务创建成功',
        'task': task.to_dict()
    }), 201

@tasks_bp.route('/<int:task_id>/location', methods=['PUT'])
@jwt_required()
def update_task_location(task_id):
    """更新任务位置"""
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    data = request.get_json()
    
    task.latitude = data.get('latitude')
    task.longitude = data.get('longitude')
    task.location = data.get('location')
    task.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': '位置已更新',
        'task': task.to_dict()
    }), 200

@tasks_bp.route('/<int:task_id>/progress', methods=['PUT'])
@jwt_required()
def update_task_progress(task_id):
    """更新任务进度"""
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    data = request.get_json()
    
    task.checklist_progress = data.get('progress', 0)
    task.evidence_count = data.get('evidence_count', 0)
    task.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': '进度已更新',
        'task': task.to_dict()
    }), 200

@tasks_bp.route('/<int:task_id>/complete', methods=['PUT'])
@jwt_required()
def complete_task(task_id):
    """完成任务"""
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    task.status = 'completed'
    task.completed_at = datetime.utcnow()
    task.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': '任务已完成',
        'task': task.to_dict()
    }), 200

@tasks_bp.route('/<int:task_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_task(task_id):
    """取消任务"""
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    task.status = 'cancelled'
    task.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': '任务已取消',
        'task': task.to_dict()
    }), 200

@tasks_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_task_stats():
    """获取任务统计"""
    total = Task.query.count()
    pending = Task.query.filter_by(status='pending').count()
    processing = Task.query.filter_by(status='processing').count()
    completed = Task.query.filter_by(status='completed').count()
    
    return jsonify({
        'total': total,
        'pending': pending,
        'processing': processing,
        'completed': completed,
        'completion_rate': round((completed / total * 100) if total > 0 else 0, 2)
    }), 200
