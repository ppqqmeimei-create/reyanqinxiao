import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Card, Row, Col, Statistic, Progress, Switch, Modal, message } from 'antd'
import { PlusOutlined, ReloadOutlined, SettingOutlined, PoweroffOutlined } from '@ant-design/icons'
import { deviceAPI } from '../utils/api'
import './Devices.css'

const Devices = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    setLoading(true)
    try {
      setData([
        { id: 1, name: '友谊关红外相机A', deviceId: 'GX-IR-201', type: 'infrared', zone: '凭祥友谊关', status: 'warning', sensitivity: 85, battery: 72, signal: 95, lastHeartbeat: '2026-04-04 10:28', enabled: true },
        { id: 2, name: '友谊关红外相机B', deviceId: 'GX-IR-202', type: 'infrared', zone: '凭祥友谊关', status: 'online', sensitivity: 80, battery: 88, signal: 98, lastHeartbeat: '2026-04-04 10:29', enabled: true },
        { id: 3, name: '凭祥光纤传感器01', deviceId: 'GX-VIB-201', type: 'vibration', zone: '凭祥友谊关', status: 'online', sensitivity: 75, battery: 95, signal: 92, lastHeartbeat: '2026-04-04 10:30', enabled: true },
        { id: 4, name: '凭祥可见光摄像机01', deviceId: 'GX-CAM-201', type: 'visible', zone: '凭祥友谊关', status: 'offline', sensitivity: 70, battery: 15, signal: 0, lastHeartbeat: '2026-04-04 08:15', enabled: false },
        { id: 5, name: '东兴口岸红外相机A', deviceId: 'GX-IR-101', type: 'infrared', zone: '东兴口岸', status: 'online', sensitivity: 82, battery: 68, signal: 90, lastHeartbeat: '2026-04-04 10:27', enabled: true },
        { id: 6, name: '东兴光纤传感器01', deviceId: 'GX-VIB-101', type: 'vibration', zone: '东兴口岸', status: 'warning', sensitivity: 78, battery: 45, signal: 88, lastHeartbeat: '2026-04-04 10:25', enabled: true },
        { id: 7, name: '靖西岳圩红外相机A', deviceId: 'GX-IR-303', type: 'infrared', zone: '靖西岳圩', status: 'online', sensitivity: 88, battery: 82, signal: 94, lastHeartbeat: '2026-04-04 10:30', enabled: true },
        { id: 8, name: '那坡红外相机A', deviceId: 'GX-IR-301', type: 'infrared', zone: '那坡桂林', status: 'warning', sensitivity: 90, battery: 38, signal: 85, lastHeartbeat: '2026-04-04 10:26', enabled: true }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getTypeTag = (type) => {
    const config = {
      infrared: { color: '#FF4D4F', text: '红外相机' },
      vibration: { color: '#FFA940', text: '振动光纤' },
      visible: { color: '#00D4FF', text: '可见光摄像' },
      gps: { color: '#73D13D', text: 'GPS定位' },
      drone: { color: '#722ED1', text: '无人机' },
      smell: { color: '#EC8F28', text: '气味传感' }
    }
    const { color, text } = config[type] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const getStatusTag = (status) => {
    const config = {
      online: { color: '#73D13D', text: '在线' },
      warning: { color: '#FFA940', text: '警告' },
      offline: { color: '#8CA3B8', text: '离线' }
    }
    const { color, text } = config[status] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '设备名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '设备ID', dataIndex: 'deviceId', key: 'deviceId', width: 120, render: (id) => <span className="device-id">{id}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (t) => getTypeTag(t) },
    { title: '位置', dataIndex: 'zone', key: 'zone', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s) => getStatusTag(s) },
    { title: '灵敏度', dataIndex: 'sensitivity', key: 'sensitivity', width: 100, render: (v) => <Progress percent={v} size="small" strokeColor={v < 50 ? '#FFA940' : '#00D4FF'} /> },
    { title: '电量', dataIndex: 'battery', key: 'battery', width: 80, render: (v) => <span className={v < 20 ? 'battery-low' : ''}>{v}%</span> },
    { title: '信号', dataIndex: 'signal', key: 'signal', width: 80 },
    { title: '最后心跳', dataIndex: 'lastHeartbeat', key: 'lastHeartbeat', width: 140 },
    { title: '启用', dataIndex: 'enabled', key: 'enabled', width: 80, render: (v, record) => <Switch checked={v} onChange={(checked) => handleToggle(record, checked)} size="small" /> },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" onClick={() => { setSelectedDevice(record); setDetailVisible(true) }}>详情</Button>
          <Button type="text" size="small" icon={<SettingOutlined />} onClick={() => handleConfigure(record)}>配置</Button>
        </Space>
      )
    }
  ]

  const handleToggle = (record, checked) => {
    setData(data.map(item => item.id === record.id ? { ...item, enabled: checked } : item))
    message.success(`${record.name} 已${checked ? '启用' : '禁用'}`)
  }

  const handleConfigure = (record) => {
    Modal.confirm({
      title: '灵敏度调整',
      content: `调整 ${record.name} 的灵敏度？`,
      onOk: () => message.success('灵敏度已更新')
    })
  }

  const stats = {
    total: data.length,
    online: data.filter(d => d.status === 'online').length,
    warning: data.filter(d => d.status === 'warning').length,
    offline: data.filter(d => d.status === 'offline').length
  }

  return (
    <div className="devices-page">
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}><Card><Statistic title="设备总数" value={stats.total} valueStyle={{ color: '#EAF6FF' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="在线" value={stats.online} valueStyle={{ color: '#73D13D' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="警告" value={stats.warning} valueStyle={{ color: '#FFA940' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="离线" value={stats.offline} valueStyle={{ color: '#8CA3B8' }} /></Card></Col>
      </Row>

      <Card title="设备列表" className="devices-card">
        <div className="toolbar">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchDevices}>刷新</Button>
          </Space>
        </div>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title="设备详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>]}
        width={600}
      >
        {selectedDevice && (
          <div className="device-detail">
            <Row gutter={[16, 16]}>
              <Col span={12}><div className="detail-item"><span className="label">设备名称：</span>{selectedDevice.name}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">设备ID：</span>{selectedDevice.deviceId}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">类型：</span>{getTypeTag(selectedDevice.type)}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">状态：</span>{getStatusTag(selectedDevice.status)}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">灵敏度：</span>{selectedDevice.sensitivity}%</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">电量：</span>{selectedDevice.battery}%</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">信号强度：</span>{selectedDevice.signal}%</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">位置：</span>{selectedDevice.zone}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">最后心跳：</span>{selectedDevice.lastHeartbeat}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">启用状态：</span>{selectedDevice.enabled ? '已启用' : '已禁用'}</div></Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Devices
