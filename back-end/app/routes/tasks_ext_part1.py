"""
任务模块扩展接口 - 第1部分
证据上传、检查清单、采样记录
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from werkzeug.utils import secure_filename
import os

tasks_ext_bp = Blueprint('tasks_ext', __name__)

# ============================================
# 1. 证据上传接口
# ============================================

@tasks_ext_bp.route('/<int:task_id>/evidence', methods=['POST'])
@jwt_required()
def upload_evidence(task_id):
    """上传任务证据（照片、视频、录音）"""
    from app.models import Task
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    user_id = get_jwt_identity()
    
    # 获取上传的文件
    files = request.files.getlist('files')
    evidence_type = request.form.get('type', 'photo')
    description = request.form.get('description', '')
    latitude = request.form.get('latitude', type=float)
    longitude = request.form.get('longitude', type=float)
    
    if not files:
        return jsonify({'message': '没有上传文件'}), 400
    
    uploaded_evidence = []
    
    for file in files:
        if file.filename:
            # 保存文件
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            stored_name = f"{task_id}_{timestamp}_{filename}"
            file_path = os.path.join('uploads', 'evidence', stored_name)
            
            # 创建目录
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            
            # 保存到数据库（需要创建 TaskEvidence 模型）
            # evidence = TaskEvidence(...)
            # db.session.add(evidence)
            # uploaded_evidence.append(evidence)
    
    db.session.commit()
    
    return jsonify({
        'message': '证据上传成功',
        'count': len(files)
    }), 201

@tasks_ext_bp.route('/<int:task_id>/evidence', methods=['GET'])
@jwt_required()
def get_evidence_list(task_id):
    """获取任务证据列表"""
    from app.models import Task
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    # 查询证据列表
    # evidence_list = TaskEvidence.query.filter_by(task_id=task_id).all()
    
    return jsonify({
        'data': [],
        'total': 0
    }), 200

# ============================================
# 2. 检查清单接口
# ============================================

@tasks_ext_bp.route('/<int:task_id>/checklist', methods=['GET'])
@jwt_required()
def get_checklist(task_id):
    """获取任务检查清单"""
    from app.models import Task
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    # 查询检查清单
    # checklist = TaskChecklist.query.filter_by(task_id=task_id).all()
    
    return jsonify({
        'data': [],
        'total': 0
    }), 200

@tasks_ext_bp.route('/<int:task_id>/checklist', methods=['POST'])
@jwt_required()
def create_checklist_item(task_id):
    """创建检查清单项"""
    from app.models import Task
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    data = request.get_json()
    user_id = get_jwt_identity()
    
    # 创建检查项
    # item = TaskChecklist(...)
    # db.session.add(item)
    # db.session.commit()
    
    return jsonify({
        'message': '检查项创建成功'
    }), 201

@tasks_ext_bp.route('/<int:task_id>/checklist/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_checklist_item(task_id, item_id):
    """更新检查清单项"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    # 更新检查项
    # item = TaskChecklist.query.filter_by(id=item_id, task_id=task_id).first()
    # item.status = data.get('status')
    # db.session.commit()
    
    return jsonify({
        'message': '检查项更新成功'
    }), 200

# ============================================
# 3. 采样记录接口
# ============================================

@tasks_ext_bp.route('/<int:task_id>/samples', methods=['POST'])
@jwt_required()
def save_sample(task_id):
    """保存采样记录"""
    from app.models import Task
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    data = request.get_json()
    user_id = get_jwt_identity()
    
    # 生成采样编号
    sample_code = f"SAMPLE-{datetime.now().strftime('%Y%m%d%H%M%S')}-{task_id}"
    
    # 保存采样记录
    # sample = TaskSample(...)
    # db.session.add(sample)
    # db.session.commit()
    
    return jsonify({
        'message': '采样记录保存成功',
        'sample_code': sample_code
    }), 201

@tasks_ext_bp.route('/<int:task_id>/samples', methods=['GET'])
@jwt_required()
def get_samples(task_id):
    """获取任务采样记录列表"""
    from app.models import Task
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'message': '任务不存在'}), 404
    
    # 查询采样记录
    # samples = TaskSample.query.filter_by(task_id=task_id).all()
    
    return jsonify({
        'data': [],
        'total': 0
    }), 200
