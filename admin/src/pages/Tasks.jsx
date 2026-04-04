import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Card, Row, Col, Statistic, Progress, Timeline, Modal } from 'antd'
import { PlusOutlined, PlayCircleOutlined, CheckCircleOutlined, ReloadOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { taskAPI } from '../utils/api'
import './Tasks.css'

const Tasks = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      setData([
        { id: 1, title: '友谊关走私案件调查', type: 'complete-sampling', zone: '凭祥友谊关', priority: 'high', status: 'in_progress', assignee: '王强', progress: 65, startTime: '2026-04-04 08:00', deadline: '2026-04-04 18:00', alertId: 1 },
        { id: 2, title: '东兴口岸例行巡查', type: 'monitoring', zone: '东兴口岸', priority: 'normal', status: 'pending', assignee: '李娜', progress: 0, startTime: '2026-04-04 09:00', deadline: '2026-04-04 17:00', alertId: 2 },
        { id: 3, title: '靖西岳圩快速勘查', type: 'quick-sampling', zone: '靖西岳圩', priority: 'high', status: 'in_progress', assignee: '张伟', progress: 30, startTime: '2026-04-04 07:30', deadline: '2026-04-04 12:00', alertId: 4 },
        { id: 4, title: '龙州水口定点检查', type: 'inspection', zone: '龙州水口', priority: 'normal', status: 'completed', assignee: '刘洋', progress: 100, startTime: '2026-04-03 14:00', deadline: '2026-04-03 18:00', alertId: null },
        { id: 5, title: '那坡桂林持续巡逻', type: 'monitoring', zone: '那坡桂林', priority: 'low', status: 'pending', assignee: '陈静', progress: 0, startTime: '2026-04-04 06:00', deadline: '2026-04-05 06:00', alertId: 5 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getTypeTag = (type) => {
    const config = {
      'quick-sampling': { color: '#FF4D4F', text: '快速勘查' },
      'complete-sampling': { color: '#00D4FF', text: '完整取证' },
      'inspection': { color: '#FFA940', text: '定点检查' },
      'monitoring': { color: '#73D13D', text: '持续巡逻' }
    }
    const { color, text } = config[type] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const getPriorityTag = (priority) => {
    const config = {
      high: { color: '#FF4D4F', text: '高' },
      normal: { color: '#00D4FF', text: '中' },
      low: { color: '#8CA3B8', text: '低' }
    }
    const { color, text } = config[priority] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const getStatusTag = (status) => {
    const config = {
      pending: { color: '#8CA3B8', text: '待开始' },
      in_progress: { color: '#00D4FF', text: '进行中' },
      completed: { color: '#73D13D', text: '已完成' },
      cancelled: { color: '#8CA3B8', text: '已取消' }
    }
    const { color, text } = config[status] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '任务名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (type) => getTypeTag(type) },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, render: (p) => getPriorityTag(p) },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s) => getStatusTag(s) },
    { title: '位置', dataIndex: 'zone', key: 'zone', width: 120, render: (zone) => (<Space><EnvironmentOutlined style={{ color: '#00D4FF' }} />{zone}</Space>) },
    { title: '进度', dataIndex: 'progress', key: 'progress', width: 120, render: (p) => <Progress percent={p} size="small" strokeColor="#00D4FF" /> },
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" onClick={() => { setSelectedTask(record); setDetailVisible(true) }}>详情</Button>
          {record.status === 'pending' && <Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStart(record)}>开始</Button>}
          {record.status === 'in_progress' && <Button type="text" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record)}>完成</Button>}
        </Space>
      )
    }
  ]

  const handleStart = (record) => {
    setData(data.map(item => item.id === record.id ? { ...item, status: 'in_progress' } : item))
  }

  const handleComplete = (record) => {
    setData(data.map(item => item.id === record.id ? { ...item, status: 'completed', progress: 100 } : item))
  }

  const stats = {
    total: data.length,
    inProgress: data.filter(d => d.status === 'in_progress').length,
    completed: data.filter(d => d.status === 'completed').length,
    pending: data.filter(d => d.status === 'pending').length
  }

  return (
    <div className="tasks-page">
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}><Card><Statistic title="任务总数" value={stats.total} valueStyle={{ color: '#EAF6FF' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="进行中" value={stats.inProgress} valueStyle={{ color: '#00D4FF' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#73D13D' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="待开始" value={stats.pending} valueStyle={{ color: '#8CA3B8' }} /></Card></Col>
      </Row>

      <Card title="任务列表" className="tasks-card">
        <div className="toolbar">
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>新建任务</Button>
            <Button icon={<ReloadOutlined />} onClick={fetchTasks}>刷新</Button>
          </Space>
        </div>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title="任务详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>]}
        width={600}
      >
        {selectedTask && (
          <div className="task-detail">
            <Row gutter={[16, 16]}>
              <Col span={12}><div className="detail-item"><span className="label">任务名称：</span>{selectedTask.title}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">类型：</span>{getTypeTag(selectedTask.type)}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">优先级：</span>{getPriorityTag(selectedTask.priority)}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">状态：</span>{getStatusTag(selectedTask.status)}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">位置：</span>{selectedTask.zone}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">负责人：</span>{selectedTask.assignee}</div></Col>
              <Col span={24}><div className="detail-item"><span className="label">进度：</span><Progress percent={selectedTask.progress} /></div></Col>
              <Col span={12}><div className="detail-item"><span className="label">开始时间：</span>{selectedTask.startTime}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">截止时间：</span>{selectedTask.deadline}</div></Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Tasks
