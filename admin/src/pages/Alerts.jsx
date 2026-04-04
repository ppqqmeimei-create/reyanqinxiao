import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Input, Select, Modal, Card, Row, Col, Statistic } from 'antd'
import { SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EnvironmentOutlined, AlertOutlined } from '@ant-design/icons'
import { alertAPI } from '../utils/api'
import './Alerts.css'

const Alerts = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [levelFilter, setLevelFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetchAlerts()
  }, [levelFilter, typeFilter])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      setData([
        { id: 1, level: 'critical', type: '走私预警', sensor: '红外热成像', zone: '凭祥友谊关', message: '友谊关红外触发 - 疑似穿山甲', confidence: 96, time: '2026-04-04 10:25', status: 'pending', assignee: null },
        { id: 2, level: 'critical', type: '走私预警', sensor: '振动光纤', zone: '东兴口岸', message: '东兴竹山区域异常震动信号', confidence: 88, time: '2026-04-04 10:07', status: 'assigned', assignee: '王强' },
        { id: 3, level: 'warning', type: '走私预警', sensor: '可见光摄像', zone: '靖西岳圩', message: '卡口异常 - 检测到可疑车辆', confidence: 75, time: '2026-04-04 09:46', status: 'resolved', assignee: '李娜' },
        { id: 4, level: 'warning', type: '生态预警', sensor: '气味传感', zone: '龙州水口', message: '水质传感器异常 - pH值偏低', confidence: 68, time: '2026-04-04 09:32', status: 'pending', assignee: null },
        { id: 5, level: 'info', type: '生态预警', sensor: '水质传感', zone: '那坡桂林', message: '水温异常升高0.5度', confidence: 45, time: '2026-04-04 09:00', status: 'ignored', assignee: null },
        { id: 6, level: 'critical', type: '走私预警', sensor: 'GPS定位', zone: '凭祥友谊关', message: 'GPS轨迹异常 - 偏离巡逻路线', confidence: 92, time: '2026-04-04 08:45', status: 'in_progress', assignee: '张伟' },
        { id: 7, level: 'warning', type: '走私预警', sensor: '红外热成像', zone: '东兴口岸', message: '东兴口岸红外触发 - 人员聚集', confidence: 72, time: '2026-04-04 08:30', status: 'pending', assignee: null },
        { id: 8, level: 'critical', type: '走私预警', sensor: '振动光纤', zone: '龙州水口', message: '水口区域持续震动 - 疑似挖掘', confidence: 91, time: '2026-04-04 08:15', status: 'assigned', assignee: '刘洋' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getLevelTag = (level) => {
    const config = {
      critical: { color: '#FF4D4F', text: '紧急' },
      warning: { color: '#FFA940', text: '警告' },
      info: { color: '#722ED1', text: '提示' }
    }
    const { color, text } = config[level] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const getStatusTag = (status) => {
    const config = {
      pending: { color: '#8CA3B8', text: '待处理' },
      assigned: { color: '#00D4FF', text: '已分配' },
      in_progress: { color: '#FFA940', text: '处理中' },
      resolved: { color: '#73D13D', text: '已解决' },
      ignored: { color: '#8CA3B8', text: '已忽略' }
    }
    const { color, text } = config[status] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => getLevelTag(level)
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    {
      title: '预警信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (text) => <span className="alert-message-cell">{text}</span>
    },
    { title: '传感器', dataIndex: 'sensor', key: 'sensor', width: 100 },
    {
      title: '位置',
      dataIndex: 'zone',
      key: 'zone',
      width: 120,
      render: (zone) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#00D4FF' }} />
          {zone}
        </Space>
      )
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (val) => (
        <span className={val >= 85 ? 'confidence-high' : val >= 70 ? 'confidence-mid' : 'confidence-low'}>
          {val}%
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedAlert(record); setDetailVisible(true) }} />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleAssign(record)} />
        </Space>
      )
    }
  ]

  const handleAssign = (record) => {
    Modal.confirm({
      title: '分配预警',
      content: `将预警分配给处理人员？`,
      onOk: () => {
        setData(data.map(item => item.id === record.id ? { ...item, status: 'assigned', assignee: '当前用户' } : item))
      }
    })
  }

  const stats = {
    total: data.length,
    critical: data.filter(d => d.level === 'critical').length,
    warning: data.filter(d => d.level === 'warning').length,
    pending: data.filter(d => d.status === 'pending').length
  }

  return (
    <div className="alerts-page">
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}>
          <Card className="stat-mini">
            <Statistic title="预警总数" value={stats.total} valueStyle={{ color: '#EAF6FF' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-mini critical">
            <Statistic title="紧急预警" value={stats.critical} valueStyle={{ color: '#FF4D4F' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-mini warning">
            <Statistic title="警告预警" value={stats.warning} valueStyle={{ color: '#FFA940' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-mini pending">
            <Statistic title="待处理" value={stats.pending} valueStyle={{ color: '#8CA3B8' }} />
          </Card>
        </Col>
      </Row>

      <Card title="预警列表" className="alerts-card">
        <div className="toolbar">
          <Space>
            <Select
              placeholder="预警等级"
              value={levelFilter}
              onChange={setLevelFilter}
              allowClear
              style={{ width: 100 }}
              options={[
                { value: 'critical', label: '紧急' },
                { value: 'warning', label: '警告' },
                { value: 'info', label: '提示' }
              ]}
            />
            <Select
              placeholder="预警类型"
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
              style={{ width: 120 }}
              options={[
                { value: '走私预警', label: '走私预警' },
                { value: '生态预警', label: '生态预警' }
              ]}
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAlerts}>刷新</Button>
        </div>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title="预警详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          <Button key="assign" type="primary" onClick={() => { handleAssign(selectedAlert); setDetailVisible(false) }}>分配处理</Button>
        ]}
        width={600}
      >
        {selectedAlert && (
          <div className="alert-detail">
            <Row gutter={[16, 16]}>
              <Col span={12}><div className="detail-item"><span className="label">预警等级：</span>{getLevelTag(selectedAlert.level)}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">预警类型：</span>{selectedAlert.type}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">传感器：</span>{selectedAlert.sensor}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">位置：</span>{selectedAlert.zone}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">置信度：</span>{selectedAlert.confidence}%</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">时间：</span>{selectedAlert.time}</div></Col>
              <Col span={24}><div className="detail-item"><span className="label">预警信息：</span>{selectedAlert.message}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">状态：</span>{getStatusTag(selectedAlert.status)}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">处理人：</span>{selectedAlert.assignee || '未分配'}</div></Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Alerts
