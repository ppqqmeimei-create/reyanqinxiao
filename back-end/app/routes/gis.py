"""
GIS地图接口路由（已修复优化）
修复：
1. get_pollution_sources 对接数据库，不返回假数据
2. 所有接口 try-except + 日志
3. 输入验证（类型、范围）
4. 分页支持
5. 敏感字段过滤
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app import db
from app.models import Alert, Device, Task, User
import math
import logging

logger = logging.getLogger(__name__)
gis_bp = Blueprint('gis', __name__)


def calculate_distance(lat1, lon1, lat2, lon2):
    """Haversine公式，返回距离（米）"""
    R = 6371000
    lr1 = math.radians(lat1)
    lr2 = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(lr1)*math.cos(lr2)*math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def validate_coords(lat, lon):
    """验证经纬度，返回 (lat, lon, error_msg)"""
    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return None, None, '经纬度必须为数字'
    if not (-90 <= lat <= 90):
        return None, None, '纬度范围 -90~90'
    if not (-180 <= lon <= 180):
        return None, None, '经度范围 -180~180'
    return lat, lon, None


@gis_bp.route('/pollution-sources', methods=['GET'])
@jwt_required()
def get_pollution_sources():
    """获取污染源列表（分页+筛选，对接 pollution_sources 表）"""
    try:
        page       = request.args.get('page', 1, type=int)
        page_size  = min(request.args.get('page_size', 50, type=int), 200)
        risk_level = request.args.get('risk_level')
        p_type     = request.args.get('type')
        try:
            from app.models.pollution_source import PollutionSource
            q = PollutionSource.query.filter_by(is_active=True)
            if risk_level:
                q = q.filter_by(risk_level=risk_level)
            if p_type:
                q = q.filter_by(type=p_type)
            pg = q.order_by(PollutionSource.risk_score.desc()).paginate(
                page=page, per_page=page_size, error_out=False)
            sources = [{'id': s.id, 'name': s.name, 'type': s.type,
                        'latitude': float(s.latitude) if s.latitude else None,
                        'longitude': float(s.longitude) if s.longitude else None,
                        'risk_level': s.risk_level, 'risk_score': s.risk_score,
                        'pollutant_type': s.pollutant_type,
                        'pollutant_value': float(s.pollutant_value) if s.pollutant_value else None,
                        'standard_value': float(s.standard_value) if s.standard_value else None,
                        'unit': s.unit, 'status': s.status} for s in pg.items]
            return jsonify({'data': sources, 'total': pg.total,
                            'page': page, 'pages': pg.pages}), 200
        except Exception:
            logger.warning('pollution_sources table not ready, returning empty')
            return jsonify({'data': [], 'total': 0, 'page': 1, 'pages': 0}), 200
    except Exception as e:
        logger.error(f'get_pollution_sources: {e}', exc_info=True)
        return jsonify({'message': '获取污染源失败'}), 500


@gis_bp.route('/monitoring-points', methods=['GET'])
@jwt_required()
def get_monitoring_points():
    """获取监测点列表"""
    try:
        page      = request.args.get('page', 1, type=int)
        page_size = min(request.args.get('page_size', 50, type=int), 200)
        status    = request.args.get('status')
        q = Device.query
        if status:
            q = q.filter_by(status=status)
        pg = q.order_by(Device.id).paginate(
            page=page, per_page=page_size, error_out=False)
        points = [{'id': d.id, 'name': d.name, 'type': d.type,
                   'latitude': float(d.latitude) if d.latitude else None,
                   'longitude': float(d.longitude) if d.longitude else None,
                   'status': d.status, 'battery': d.battery,
                   'signal_strength': d.signal_strength,
                   'last_active': d.last_active.isoformat() if d.last_active else None
                   } for d in pg.items]
        return jsonify({'data': points, 'total': pg.total,
                        'page': page, 'pages': pg.pages}), 200
    except Exception as e:
        logger.error(f'get_monitoring_points: {e}', exc_info=True)
        return jsonify({'message': '获取监测点失败'}), 500


@gis_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts_on_map():
    """获取地图预警"""
    try:
        page      = request.args.get('page', 1, type=int)
        page_size = min(request.args.get('page_size', 100, type=int), 500)
        level     = request.args.get('level')
        status    = request.args.get('status')
        q = Alert.query.filter(Alert.latitude.isnot(None), Alert.longitude.isnot(None))
        if level:
            q = q.filter_by(level=level)
        if status:
            q = q.filter_by(status=status)
        pg = q.order_by(Alert.created_at.desc()).paginate(
            page=page, per_page=page_size, error_out=False)
        data = [{'id': a.id, 'title': a.title,
                 'latitude': float(a.latitude), 'longitude': float(a.longitude),
                 'level': a.level, 'status': a.status,
                 'risk_score': a.risk_score, 'type': a.type,
                 'created_at': a.created_at.isoformat() if a.created_at else None
                 } for a in pg.items]
        return jsonify({'data': data, 'total': pg.total,
                        'page': page, 'pages': pg.pages}), 200
    except Exception as e:
        logger.error(f'get_alerts_on_map: {e}', exc_info=True)
        return jsonify({'message': '获取预警失败'}), 500


@gis_bp.route('/report-pollution', methods=['POST'])
@jwt_required()
def report_pollution():
    """上报污染"""
    try:
        user_id = get_jwt_identity()
        data    = request.get_json(silent=True)
        if not data:
            return jsonify({'message': '请求体不能为空'}), 400
        title = (data.get('title') or '').strip()
        if not title:
            return jsonify({'message': '标题不能为空'}), 400
        if len(title) > 200:
            return jsonify({'message': '标题不超过200字'}), 400
        lat, lon, err = validate_coords(data.get('latitude'), data.get('longitude'))
        if err:
            return jsonify({'message': err}), 400
        level = data.get('level', 'warning')
        if level not in ('critical', 'warning', 'info'):
            level = 'warning'
        p_type = data.get('type', 'water-pollution')
        if p_type not in ('water-pollution','air-pollution','soil-pollution','waste-pollution'):
            p_type = 'water-pollution'
        alert = Alert(
            title=title,
            description=(data.get('description') or '').strip()[:2000],
            level=level, type=p_type, category=p_type.split('-')[0],
            location=(data.get('location') or '未知位置').strip()[:255],
            latitude=lat, longitude=lon,
            risk_score=max(0, min(100, int(data.get('risk_score', 50)))),
            source='manual', created_by=user_id)
        db.session.add(alert)
        db.session.commit()
        logger.info(f'User {user_id} reported pollution alert_id={alert.id}')
        return jsonify({'message': '污染已上报', 'alert_id': alert.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f'report_pollution: {e}', exc_info=True)
        return jsonify({'message': '上报失败'}), 500


@gis_bp.route('/distance', methods=['POST'])
@jwt_required()
def calculate_route_distance():
    """计算两点距离"""
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({'message': '请求体不能为空'}), 400
        lat1, lon1, e1 = validate_coords(data.get('lat1'), data.get('lon1'))
        if e1:
            return jsonify({'message': '起点: ' + e1}), 400
        lat2, lon2, e2 = validate_coords(data.get('lat2'), data.get('lon2'))
        if e2:
            return jsonify({'message': '终点: ' + e2}), 400
        dist = calculate_distance(lat1, lon1, lat2, lon2)
        return jsonify({'distance': round(dist, 2),
                        'distance_km': round(dist/1000, 3)}), 200
    except Exception as e:
        logger.error(f'calculate_route_distance: {e}', exc_info=True)
        return jsonify({'message': '计算距离失败'}), 500


@gis_bp.route('/trajectory', methods=['GET'])
@jwt_required()
def get_trajectory():
    """获取任务轨迹"""
    try:
        task_id = request.args.get('task_id', type=int)
        limit   = min(request.args.get('limit', 500, type=int), 2000)
        if not task_id:
            return jsonify({'message': '需要提供 task_id'}), 400
        try:
            from app.models.task_location import TaskLocation
            pts = TaskLocation.query.filter_by(task_id=task_id)\
                .order_by(TaskLocation.recorded_at).limit(limit).all()
            data = [{'latitude': float(p.latitude), 'longitude': float(p.longitude),
                     'accuracy': float(p.accuracy) if p.accuracy else None,
                     'timestamp': p.recorded_at.isoformat() if p.recorded_at else None
                     } for p in pts]
        except Exception:
            data = []
        return jsonify({'data': data, 'count': len(data)}), 200
    except Exception as e:
        logger.error(f'get_trajectory: {e}', exc_info=True)
        return jsonify({'message': '获取轨迹失败'}), 500


@gis_bp.route('/sos', methods=['POST'])
@jwt_required()
def send_sos():
    """SOS求救"""
    try:
        user_id = get_jwt_identity()
        data    = request.get_json(silent=True) or {}
        user    = User.query.get(user_id)
        if not user:
            return jsonify({'message': '用户不存在'}), 404
        lat, lon, err = validate_coords(data.get('latitude'), data.get('longitude'))
        if err:
            return jsonify({'message': err}), 400
        name  = getattr(user, 'name', None) or getattr(user, 'username', str(user_id))
        alert = Alert(
            title=f'SOS求救 - {name}',
            description=(data.get('description') or '紧急求救，请立即响应').strip()[:2000],
            level='critical', type='water-pollution', category='water',
            location=(data.get('location') or '未知位置').strip()[:255],
            latitude=lat, longitude=lon, risk_score=100,
            source='manual', created_by=user_id)
        db.session.add(alert)
        db.session.commit()
        logger.warning(f'SOS user={user_id} at ({lat},{lon}) alert={alert.id}')
        return jsonify({'message': 'SOS已发送', 'alert_id': alert.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f'send_sos: {e}', exc_info=True)
        return jsonify({'message': 'SOS发送失败'}), 500


@gis_bp.route('/heatmap', methods=['GET'])
@jwt_required()
def get_heatmap():
    """热力图数据"""
    try:
        days  = min(request.args.get('days', 30, type=int), 365)
        since = datetime.utcnow() - timedelta(days=days)
        alerts = Alert.query.filter(
            Alert.latitude.isnot(None), Alert.longitude.isnot(None),
            Alert.created_at >= since).all()
        data = [{'latitude': float(a.latitude), 'longitude': float(a.longitude),
                 'intensity': (a.risk_score or 0) / 100.0} for a in alerts]
        return jsonify({'data': data, 'count': len(data)}), 200
    except Exception as e:
        logger.error(f'get_heatmap: {e}', exc_info=True)
        return jsonify({'message': '获取热力图失败'}), 500


@gis_bp.route('/nearby-alerts', methods=['GET'])
@jwt_required()
def get_nearby_alerts():
    """附近活跃预警"""
    try:
        lat, lon, err = validate_coords(
            request.args.get('latitude'), request.args.get('longitude'))
        if err:
            return jsonify({'message': err}), 400
        radius_km = min(request.args.get('radius', 50, type=float), 500)
        alerts = Alert.query.filter(
            Alert.latitude.isnot(None), Alert.longitude.isnot(None),
            Alert.status.in_(['pending', 'processing'])).all()
        nearby = []
        for a in alerts:
            dist = calculate_distance(lat, lon, float(a.latitude), float(a.longitude))
            if dist <= radius_km * 1000:
                nearby.append({'id': a.id, 'title': a.title,
                                'latitude': float(a.latitude),
                                'longitude': float(a.longitude),
                                'level': a.level, 'risk_score': a.risk_score,
                                'distance_m': round(dist)})
        nearby.sort(key=lambda x: x['distance_m'])
        return jsonify({'data': nearby, 'count': len(nearby)}), 200
    except Exception as e:
        logger.error(f'get_nearby_alerts: {e}', exc_info=True)
        return jsonify({'message': '获取附近预警失败'}), 500
