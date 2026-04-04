import React, { useState } from 'react'
import { Card, Form, Input, Button, Switch, Select, message, Tabs, Divider, Tag, Table, Space } from 'antd'
import { SaveOutlined, SettingOutlined, GlobalOutlined, BellOutlined, LockOutlined } from '@ant-design/icons'
import './Settings.css'

const Settings = () => {
  const [form] = Form.useForm()
  const [aiForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSaveSystem = async () => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      message.success('系统设置已保存')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAI = async () => {
    setLoading(true)
    try {
      const values = await aiForm.validateFields()
      message.success('AI模型设置已保存')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const logColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 120 },
    { title: '操作类型', dataIndex: 'action', key: 'action', width: 120 },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true }
  ]

  const mockLogs = [
    { id: 1, time: '2026-04-04 10:30:25', operator: '张伟', action: '系统配置', detail: '修改了预警置信度阈值: 85→88' },
    { id: 2, time: '2026-04-04 09:15:42', operator: '李娜', action: '用户管理', detail: '新增用户: 刘洋 (警号GX-005)' },
    { id: 3, time: '2026-04-04 08:45:18', operator: '系统', action: '设备管理', detail: '设备GX-CAM-201心跳超时，已标记离线' },
    { id: 4, time: '2026-04-04 08:30:00', operator: '王强', action: '权限变更', detail: '分配预警#1给张伟处理' },
    { id: 5, time: '2026-04-03 18:00:15', operator: '陈静', action: '任务管理', detail: '完成任务: 龙州水口定点检查' }
  ]

  const zoneItems = [
    { id: 'pingxiang', name: '凭祥友谊关', status: 'active', devices: 18 },
    { id: 'dongxing', name: '东兴口岸', status: 'active', devices: 15 },
    { id: 'longzhou', name: '龙州水口', status: 'active', devices: 12 },
    { id: 'jingxi', name: '靖西岳圩', status: 'active', devices: 10 },
    { id: 'napo', name: '那坡桂林', status: 'active', devices: 8 }
  ]

  const tabItems = [
    {
      key: 'system',
      label: <span><SettingOutlined /> 系统设置</span>,
      children: (
        <Form form={form} layout="vertical" initialValues={{ alertThreshold: 85, syncInterval: 300, mapProvider: 'gcj02' }}>
          <Form.Item name="alertThreshold" label="预警置信度阈值" help="置信度达到此值时自动推送预警">
            <Input type="number" suffix="%" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="syncInterval" label="同步间隔" help="移动端数据同步时间间隔">
            <Select style={{ width: 200 }} options={[
              { value: 60, label: '1分钟' },
              { value: 300, label: '5分钟' },
              { value: 600, label: '10分钟' },
              { value: 1800, label: '30分钟' }
            ]} />
          </Form.Item>
          <Form.Item name="mapProvider" label="地图坐标系">
            <Select style={{ width: 200 }} options={[
              { value: 'gcj02', label: '国测局坐标 (GCJ-02)' },
              { value: 'wgs84', label: 'GPS坐标 (WGS-84)' }
            ]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSaveSystem}>保存设置</Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'ai',
      label: <span><GlobalOutlined /> AI模型管理</span>,
      children: (
        <Form form={aiForm} layout="vertical" initialValues={{ modelVersion: 'v2.0.0', confidenceThreshold: 85, enableAutoAlert: true }}>
          <Form.Item name="modelVersion" label="当前模型版本">
            <Select style={{ width: 200 }} options={[
              { value: 'v2.0.0', label: 'FusionEngine Lite 2026.03' },
              { value: 'v1.5.0', label: 'FusionEngine Lite 2025.11' }
            ]} />
          </Form.Item>
          <Form.Item name="confidenceThreshold" label="AI研判置信度阈值">
            <Input type="number" suffix="分" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="enableAutoAlert" label="自动预警推送" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Divider />
          <h4>模型更新历史</h4>
          <Table
            columns={[
              { title: '版本', dataIndex: 'version', key: 'version' },
              { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime' },
              { title: '更新内容', dataIndex: 'content', key: 'content', ellipsis: true },
              { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'current' ? '#73D13D' : '#8CA3B8'}>{s === 'current' ? '当前' : '历史'}</Tag> }
            ]}
            dataSource={[
              { version: 'v2.0.0', updateTime: '2026-03-15', content: '新增多模态时空融合算法，支持红外+振动+可见光三路信号融合', status: 'current' },
              { version: 'v1.5.0', updateTime: '2025-11-20', content: '优化影子追踪V2.0算法，夜间识别率提升15%', status: 'history' }
            ]}
            rowKey="version"
            pagination={false}
            size="small"
          />
          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSaveAI}>保存设置</Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'zones',
      label: <span><GlobalOutlined /> 战区配置</span>,
      children: (
        <div className="zone-list">
          {zoneItems.map(zone => (
            <div key={zone.id} className="zone-item">
              <div className="zone-info">
                <span className="zone-name">{zone.name}</span>
                <span className="zone-devices">{zone.devices}台设备</span>
              </div>
              <Switch checked={zone.status === 'active'} />
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'logs',
      label: <span><LockOutlined /> 操作日志</span>,
      children: (
        <Table columns={logColumns} dataSource={mockLogs} rowKey="id" pagination={{ pageSize: 10 }} />
      )
    }
  ]

  return (
    <div className="settings-page">
      <Card title="系统设置" className="settings-card">
        <Tabs items={tabItems} />
      </Card>
    </div>
  )
}

export default Settings
