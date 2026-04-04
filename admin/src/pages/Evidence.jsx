import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Card, Row, Col, Statistic, Input, Select, Modal, message } from 'antd'
import { SearchOutlined, EyeOutlined, DownloadOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { evidenceAPI } from '../utils/api'
import './Evidence.css'

const Evidence = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchEvidence()
  }, [statusFilter])

  const fetchEvidence = async () => {
    setLoading(true)
    try {
      setData([
        { id: 1, checkCode: 'EV-A3F2C1D9-103456', alertTitle: '友谊关走私案件', operator: '王强', badgeNumber: 'GX-003', captureTime: '2026-04-04 10:25:36', location: '凭祥友谊关', syncStatus: 'synced', fileSize: '2.3MB' },
        { id: 2, checkCode: 'EV-B4E3D2E1-103452', alertTitle: '东兴口岸例行巡查', operator: '李娜', badgeNumber: 'GX-002', captureTime: '2026-04-04 09:15:22', location: '东兴口岸', syncStatus: 'synced', fileSize: '1.8MB' },
        { id: 3, checkCode: 'EV-C5F4E3F2-103445', alertTitle: '靖西岳圩快速勘查', operator: '张伟', badgeNumber: 'GX-001', captureTime: '2026-04-04 08:30:15', location: '靖西岳圩', syncStatus: 'pending', fileSize: '3.1MB' },
        { id: 4, checkCode: 'EV-D6G5F4G3-103420', alertTitle: '龙州水口定点检查', operator: '刘洋', badgeNumber: 'GX-005', captureTime: '2026-04-03 16:45:08', location: '龙州水口', syncStatus: 'synced', fileSize: '2.7MB' },
        { id: 5, checkCode: 'EV-E7H6G5H4-103415', alertTitle: '友谊关走私案件', operator: '王强', badgeNumber: 'GX-003', captureTime: '2026-04-04 10:35:48', location: '凭祥友谊关', syncStatus: 'failed', fileSize: '1.5MB' },
        { id: 6, checkCode: 'EV-F8I7H6I5-103410', alertTitle: '那坡桂林持续巡逻', operator: '陈静', badgeNumber: 'GX-004', captureTime: '2026-04-04 07:20:33', location: '那坡桂林', syncStatus: 'synced', fileSize: '4.2MB' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getSyncStatusTag = (status) => {
    const config = {
      synced: { color: '#73D13D', text: '已同步' },
      pending: { color: '#FFA940', text: '待同步' },
      failed: { color: '#FF4D4F', text: '同步失败' }
    }
    const { color, text } = config[status] || {}
    return <Tag color={color}>{text}</Tag>
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '校验码', dataIndex: 'checkCode', key: 'checkCode', width: 180, render: (code) => <span className="check-code">{code}</span> },
    { title: '关联预警', dataIndex: 'alertTitle', key: 'alertTitle', ellipsis: true },
    { title: '执法人员', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '警号', dataIndex: 'badgeNumber', key: 'badgeNumber', width: 100, render: (b) => <span className="badge-number">{b}</span> },
    { title: '采集时间', dataIndex: 'captureTime', key: 'captureTime', width: 160 },
    { title: '位置', dataIndex: 'location', key: 'location', width: 100 },
    { title: '文件大小', dataIndex: 'fileSize', key: 'fileSize', width: 90 },
    { title: '同步状态', dataIndex: 'syncStatus', key: 'syncStatus', width: 100, render: (s) => getSyncStatusTag(s) },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedEvidence(record); setDetailVisible(true) }}>查看</Button>
          <Button type="text" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>下载</Button>
        </Space>
      )
    }
  ]

  const handleDownload = (record) => {
    message.success(`正在下载: ${record.checkCode}`)
  }

  const handleVerify = (record) => {
    Modal.confirm({
      title: '防伪校验',
      content: `校验码: ${record.checkCode}`,
      onOk: () => message.success('校验通过，证据未被篡改')
    })
  }

  const stats = {
    total: data.length,
    synced: data.filter(d => d.syncStatus === 'synced').length,
    pending: data.filter(d => d.syncStatus === 'pending').length,
    failed: data.filter(d => d.syncStatus === 'failed').length
  }

  return (
    <div className="evidence-page">
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}><Card><Statistic title="取证总数" value={stats.total} valueStyle={{ color: '#EAF6FF' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="已同步" value={stats.synced} valueStyle={{ color: '#73D13D' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="待同步" value={stats.pending} valueStyle={{ color: '#FFA940' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="同步失败" value={stats.failed} valueStyle={{ color: '#FF4D4F' }} /></Card></Col>
      </Row>

      <Card title="执法记录" className="evidence-card">
        <div className="toolbar">
          <Space>
            <Select
              placeholder="同步状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 120 }}
              options={[
                { value: 'synced', label: '已同步' },
                { value: 'pending', label: '待同步' },
                { value: 'failed', label: '同步失败' }
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchEvidence}>刷新</Button>
          </Space>
        </div>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title="取证详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>]}
        width={600}
      >
        {selectedEvidence && (
          <div className="evidence-detail">
            <Row gutter={[16, 16]}>
              <Col span={12}><div className="detail-item"><span className="label">校验码：</span><span className="check-code">{selectedEvidence.checkCode}</span></div></Col>
              <Col span={12}><div className="detail-item"><span className="label">同步状态：</span>{getSyncStatusTag(selectedEvidence.syncStatus)}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">关联预警：</span>{selectedEvidence.alertTitle}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">执法人员：</span>{selectedEvidence.operator}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">警号：</span><span className="badge-number">{selectedEvidence.badgeNumber}</span></div></Col>
              <Col span={12}><div className="detail-item"><span className="label">采集时间：</span>{selectedEvidence.captureTime}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">位置：</span>{selectedEvidence.location}</div></Col>
              <Col span={12}><div className="detail-item"><span className="label">文件大小：</span>{selectedEvidence.fileSize}</div></Col>
              <Col span={24}><div className="detail-item"><Button icon={<CheckCircleOutlined />} onClick={() => handleVerify(selectedEvidence)}>防伪校验</Button></div></Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Evidence
