"""
设备接口路由（已修复）
修复：try-except、warning状态、字段对齐前端、输入验证、拓扑分组
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from app import db
from app.models import Device
import logging

logger = logging.getLogger(__name__)
devices_bp = Blueprint('devices', __name__)

VALID_STATUSES = {'online', 'offline', 'warning', 'error'}
VALID_TYPES    = {'camera-visible','camera-infrared','fiber','smell',
                  'water-monitor','air-monitor','soil-monitor'}


@devices_bp.route('/list', methods=['GET'])
@jwt_required()
def get_devices():
    try:
        page   = request.args.get('page', 1, type=int)
        limit  = min(request.args.get('limit', 20, type=int), 200)
        status = request.args.get('status')
        d_type = request.args.get('device_type') or request.args.get('type')
        q = Device.query.filter_by(is_active=True)
        if status:
            if status not in VALID_STATUSES:
                return jsonify({'message': f'无效状态: {status}'}), 400
            q = q.filter_by(status=status)
        if d_type:
            q = q.filter_by(type=d_type)
        pg = q.order_by(Device.updated_at.desc()).paginate(
            page=page, per_page=limit, error_out=False)
        return jsonify({'data': [d.to_dict() for d in pg.items],
                        'total': pg.total, 'page': page, 'limit': limit}), 200
    except Exception as e:
        logger.error(f'get_devices: {e}', exc_info=True)
        return jsonify({'message': '获取设备列表失败'}), 500


@devices_bp.route('/<int:device_id>', methods=['GET'])
@jwt_required()
def get_device(device_id):
    try:
        d = Device.query.get(device_id)
        if not d: return jsonify({'message': '设备不存在'}), 404
        return jsonify(d.to_dict()), 200
    except Exception as e:
        logger.error(f'get_device: {e}', exc_info=True)
        return jsonify({'message': '获取设备详情失败'}), 500


@devices_bp.route('', methods=['POST'])
@jwt_required()
def create_device():
    try:
        data = request.get_json(silent=True)
        if not data: return jsonify({'message': '请求体不能为空'}), 400
        name = (data.get('name') or '').strip()
        if not name: return jsonify({'message': '设备名称不能为空'}), 400
        d_type = data.get('type') or data.get('device_type', '')
        if d_type not in VALID_TYPES:
            return jsonify({'message': f'无效设备类型'}), 400
        serial = (data.get('serial_number') or '').strip() or None
        if serial and Device.query.filter_by(serial_number=serial).first():
            return jsonify({'message': '设备序列号已存在'}), 409
        device = Device(
            name=name, type=d_type,
            location=(data.get('location') or '未知位置')[:255],
            latitude=data.get('latitude'), longitude=data.get('longitude'),
            firmware_version=(data.get('firmware_version') or '')[:50] or None,
            model=(data.get('model') or '')[:100] or None,
            serial_number=serial,
            edge_node_id=(data.get('edge_node_id') or '')[:50] or None
        )
        db.session.add(device)
        db.session.commit()
        return jsonify({'message': '设备创建成功', 'device': device.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f'create_device: {e}', exc_info=True)
        return jsonify({'message': '创建设备失败'}), 500


@devices_bp.route('/<int:device_id>/heartbeat', methods=['PUT'])
@jwt_required()
def device_heartbeat(device_id):
    try:
        device = Device.query.get(device_id)
        if not device: return jsonify({'message': '设备不存在'}), 404
        data = request.get_json(silent=True) or {}
        device.last_heartbeat = datetime.utcnow()
        device.last_active    = datetime.utcnow()
        device.status         = 'online'
        bat = data.get('battery') if data.get('battery') is not None else data.get('battery_level')
        sig = data.get('signal')  if data.get('signal')  is not None else data.get('signal_strength')
        if bat is not None: device.battery         = max(0, min(100, int(bat)))
        if sig is not None: device.signal_strength = max(0, min(100, int(sig)))
        if data.get('latitude'):  device.latitude  = float(data['latitude'])
        if data.get('longitude'): device.longitude = float(data['longitude'])
        # 自动降级为 warning
        if device.battery is not None and device.battery < 20: device.status = 'warning'
        if device.signal_strength is not None and device.signal_strength < 40: device.status = 'warning'
        db.session.commit()
        return jsonify({'message': '心跳已记录', 'device': device.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f'device_heartbeat: {e}', exc_info=True)
        return jsonify({'message': '心跳记录失败'}), 500


@devices_bp.route('/<int:device_id>/status', methods=['PUT'])
@jwt_required()
def update_device_status(device_id):
    try:
        device = Device.query.get(device_id)
        if not device: return jsonify({'message': '设备不存在'}), 404
        data   = request.get_json(silent=True) or {}
        status = data.get('status', '')
        if status not in VALID_STATUSES:
            return jsonify({'message': f'无效状态，可选: {VALID_STATUSES}'}), 400
        device.status     = status
        device.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': '设备状态已更新', 'device': device.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f'update_device_status: {e}', exc_info=True)
        return jsonify({'message': '更新设备状态失败'}), 500


@devices_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_device_stats():
    try:
        total   = Device.query.count()
        online  = Device.query.filter_by(status='online').count()
        warning = Device.query.filter_by(status='warning').count()
        offline = Device.query.filter_by(status='offline').count()
        error   = Device.query.filter_by(status='error').count()
        by_type = {}
        for d in Device.query.all():
            by_type[d.type] = by_type.get(d.type, 0) + 1
        health = round((online / total * 100) if total > 0 else 0, 1)
        return jsonify({'total': total, 'online': online, 'warning': warning,
                        'offline': offline, 'error': error,
                        'by_type': by_type, 'health_score': health}), 200
    except Exception as e:
        logger.error(f'get_device_stats: {e}', exc_info=True)
        return jsonify({'message': '获取设备统计失败'}), 500


@devices_bp.route('/topology', methods=['GET'])
@jwt_required()
def get_topology():
    """获取设备拓扑（按edge_node_id分组）"""
    try:
        devices = Device.query.filter_by(is_active=True).all()
        edge_map = {}
        for d in devices:
            eid = d.edge_node_id or 'EDGE-DEFAULT'
            if eid not in edge_map:
                edge_map[eid] = {'id': eid, 'name': '边缘节点-' + eid,
                                 'status': 'online', 'deviceCount': 0, 'devices': []}
            edge_map[eid]['deviceCount'] += 1
            edge_map[eid]['devices'].append(d.to_dict())
            if d.status in ('warning', 'offline'):
                edge_map[eid]['status'] = d.status
        return jsonify({
            'edge_nodes': list(edge_map.values()),
            'devices':    [d.to_dict() for d in devices]
        }), 200
    except Exception as e:
        logger.error(f'get_topology: {e}', exc_info=True)
        return jsonify({'message': '获取拓扑失败'}), 500
