import React, { useState } from 'react'
import { Card, Row, Col, Switch, Button, Space, Tag, Modal, Form, Input, Select, message, Statistic } from 'antd'
import { GlobalOutlined, EnvironmentOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import './GIS.css'

const GIS = () => {
  const [layerSwitches, setLayerSwitches] = useState({
    infrared: true,
    vibration: true,
    visible: true,
    gps: true,
    drone: true,
    smell: true,
    boundary: true,
    patrol: true,
    hotspot: true
  })

  const [zoneModalVisible, setZoneModalVisible] = useState(false)
  const [markerModalVisible, setMarkerModalVisible] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)

  const zones = [
    { id: 'pingxiang', name: '凭祥友谊关', lat: 22.0150, lng: 106.7580, scale: 14, level: 'high', status: 'active', deviceCount: 18, alertCount: 12 },
    { id: 'dongxing', name: '东兴口岸', lat: 21.5400, lng: 107.9700, scale: 14, level: 'high', status: 'active', deviceCount: 15, alertCount: 8 },
    { id: 'longzhou', name: '龙州水口', lat: 22.4868, lng: 106.6719, scale: 13, level: 'mid', status: 'active', deviceCount: 12, alertCount: 5 },
    { id: 'jingxi', name: '靖西岳圩', lat: 23.1340, lng: 106.4170, scale: 13, level: 'mid', status: 'active', deviceCount: 10, alertCount: 6 },
    { id: 'napo', name: '那坡桂林', lat: 23.4245, lng: 105.8336, scale: 13, level: 'low', status: 'active', deviceCount: 8, alertCount: 3 }
  ]

  const hotspots = [
    { id: 1, name: '友谊关走私热点', lat: 22.1128, lng: 106.7612, level: 'critical', alertCount: 15 },
    { id: 2, name: '东兴口岸热点', lat: 21.5318, lng: 108.0325, level: 'warning', alertCount: 8 },
    { id: 3, name: '那坡边境热点', lat: 23.4245, lng: 105.8336, level: 'warning', alertCount: 5 }
  ]

  const layerOptions = [
    { key: 'infrared', name: '红外热成像', icon: 'IR', color: '#FF4D4F', desc: '红外触发点位' },
    { key: 'vibration', name: '振动光纤', icon: 'VIB', color: '#FFA940', desc: '光纤围栏震动' },
    { key: 'visible', name: '可见光摄像', icon: 'CAM', color: '#00D4FF', desc: '卡口可见光点位' },
    { key: 'gps', name: 'GPS定位', icon: 'GPS', color: '#73D13D', desc: '巡逻人员位置' },
    { key: 'drone', name: '无人机', icon: 'UAV', color: '#722ED1', desc: '无人机巡逻点位' },
    { key: 'smell', name: '气味传感', icon: 'SME', color: '#EC8F28', desc: '气味传感器点位' },
    { key: 'boundary', name: '界碑图层', icon: 'BM', color: '#00D4FF', desc: '中越边境界碑' },
    { key: 'patrol', name: '巡逻路线', icon: 'PTL', color: '#00D4FF', desc: '边境巡逻路径' },
    { key: 'hotspot', name: '走私热点圈', icon: 'HSP', color: '#FF4D4F', desc: '走私高频区域' }
  ]

  const getLevelTag = (level) => {
    const config = { high: { color: '#FF4D4F', text: '高风险' }, mid: { color: '#FFA940', text: '中风险' }, low: { color: '#73D13D', text: '低风险' } }
    const { color, text } = config[level] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const getHotspotTag = (level) => {
    const config = { critical: { color: '#FF4D4F', text: '紧急' }, warning: { color: '#FFA940', text: '警告' } }
    const { color, text } = config[level] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const getMapOption = () => ({
    tooltip: { trigger: 'item' },
    geo: {
      map: 'china',
      roam: true,
      label: { show: false },
      itemStyle: { areaColor: '#0C1B2A', borderColor: 'rgba(0, 212, 255, 0.3)' },
      emphasis: { label: { show: true, color: '#00D4FF' } }
    },
    series: [
      {
        name: '战区',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: zones.map(z => ({ name: z.name, value: [z.lng, z.lat], itemStyle: { color: z.level === 'high' ? '#FF4D4F' : z.level === 'mid' ? '#FFA940' : '#73D13D' } })),
        symbolSize: 16,
        label: { show: true, formatter: '{b}', position: 'right', color: '#EAF6FF', fontSize: 12 }
      },
      {
        name: '热点',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: hotspots.map(h => ({ name: h.name, value: [h.lng, h.lat] })),
        symbolSize: 12,
        showEffectOn: 'render',
        rippleEffect: { brushType: 'stroke', scale: 4 },
        itemStyle: { color: h => h.data.level === 'critical' ? '#FF4D4F' : '#FFA940' },
        label: { show: true, formatter: '{b}', position: 'right', color: '#EAF6FF', fontSize: 10 }
      }
    ]
  })

  const handleToggle = (key) => {
    setLayerSwitches(prev => ({ ...prev, [key]: !prev[key] }))
    message.success(`图层 ${layerOptions.find(l => l.key === key)?.name} 已${layerSwitches[key] ? '关闭' : '开启'}`)
  }

  return (
    <div className="gis-page">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="全局地图配置" className="map-card">
            <ReactECharts option={getMapOption()} style={{ height: 500 }} />
            <div className="map-legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: '#FF4D4F' }}></span>高风险战区</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: '#FFA940' }}></span>中风险战区</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: '#73D13D' }}></span>低风险战区</div>
              <div className="legend-item"><span className="legend-dot pulse" style={{ background: '#FF4D4F' }}></span>走私热点</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="图层配置" className="layers-card">
            <div className="layer-list">
              {layerOptions.map(layer => (
                <div key={layer.key} className="layer-item">
                  <div className="layer-info">
                    <span className="layer-icon" style={{ background: layer.color }}>{layer.icon}</span>
                    <div className="layer-text">
                      <span className="layer-name">{layer.name}</span>
                      <span className="layer-desc">{layer.desc}</span>
                    </div>
                  </div>
                  <Switch checked={layerSwitches[layer.key]} onChange={() => handleToggle(layer.key)} size="small" />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="战区管理" extra={<Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setZoneModalVisible(true)}>新增战区</Button>} className="zones-card">
            <div className="zones-list">
              {zones.map(zone => (
                <div key={zone.id} className="zone-item">
                  <div className="zone-header">
                    <span className="zone-name"><EnvironmentOutlined /> {zone.name}</span>
                    {getLevelTag(zone.level)}
                  </div>
                  <div className="zone-stats">
                    <span>设备: {zone.deviceCount}台</span>
                    <span>预警: {zone.alertCount}条</span>
                  </div>
                  <div className="zone-actions">
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setSelectedZone(zone); setZoneModalVisible(true) }}>编辑</Button>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />}>删除</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="走私热点管理" extra={<Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => setMarkerModalVisible(true)}>新增热点</Button>} className="hotspots-card">
            <div className="hotspots-list">
              {hotspots.map(hotspot => (
                <div key={hotspot.id} className="hotspot-item">
                  <div className="hotspot-header">
                    <span className="hotspot-name">{hotspot.name}</span>
                    {getHotspotTag(hotspot.level)}
                  </div>
                  <div className="hotspot-info">
                    <span>坐标: {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}</span>
                    <span>预警数: {hotspot.alertCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Modal title="战区配置" open={zoneModalVisible} onCancel={() => { setZoneModalVisible(false); setSelectedZone(null) }} footer={null} width={500}>
        <Form layout="vertical" initialValues={selectedZone || {}}>
          <Form.Item name="name" label="战区名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="lat" label="纬度" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
            <Col span={12}><Form.Item name="lng" label="经度" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
          </Row>
          <Form.Item name="level" label="风险等级"><Select options={[{ value: 'high', label: '高风险' }, { value: 'mid', label: '中风险' }, { value: 'low', label: '低风险' }]} /></Form.Item>
          <Form.Item><Button type="primary" block>保存</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GIS
