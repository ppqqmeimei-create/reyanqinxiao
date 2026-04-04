import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Input, Select, Modal, Form, message, Card, Row, Col } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { userAPI } from '../utils/api'
import './Users.css'

const Users = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchUsers()
  }, [pagination.current, pagination.pageSize])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // 模拟数据
      setData([
        { id: 1, name: '张伟', badgeNumber: 'GX-001', role: 'commander', department: '崇左支队', status: 'active', lastLogin: '2026-04-04 08:30' },
        { id: 2, name: '李娜', badgeNumber: 'GX-002', role: 'investigator', department: '崇左支队', status: 'active', lastLogin: '2026-04-04 09:15' },
        { id: 3, name: '王强', badgeNumber: 'GX-003', role: 'frontline', department: '防城港支队', status: 'active', lastLogin: '2026-04-04 07:45' },
        { id: 4, name: '陈静', badgeNumber: 'GX-004', role: 'frontline', department: '百色支队', status: 'inactive', lastLogin: '2026-04-03 18:20' },
        { id: 5, name: '刘洋', badgeNumber: 'GX-005', role: 'investigator', department: '防城港支队', status: 'active', lastLogin: '2026-04-04 10:00' }
      ])
      setPagination({ ...pagination, total: 5 })
    } catch (error) {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <div className="user-avatar">{text.charAt(0)}</div>
          <div>
            <div className="user-name">{text}</div>
            <div className="user-badge">{record.badgeNumber}</div>
          </div>
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const config = {
          commander: { color: '#FF4D4F', text: '指挥调度' },
          investigator: { color: '#00D4FF', text: '侦查研判' },
          frontline: { color: '#73D13D', text: '一线执勤' },
          admin: { color: '#722ED1', text: '系统管理员' }
        }
        const { color, text } = config[role] || {}
        return <Tag color={color}>{text}</Tag>
      }
    },
    { title: '所属单位', dataIndex: 'department', key: 'department' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? '#73D13D' : '#8CA3B8'}>
          {status === 'active' ? '在线' : '离线'}
        </Tag>
      )
    },
    { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
        </Space>
      )
    }
  ]

  const handleEdit = (record) => {
    setEditingUser(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 ${record.name} 吗？`,
      onOk: () => {
        setData(data.filter(item => item.id !== record.id))
        message.success('删除成功')
      }
    })
  }

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingUser) {
        setData(data.map(item => item.id === editingUser.id ? { ...item, ...values } : item))
        message.success('更新成功')
      } else {
        setData([...data, { ...values, id: Date.now(), lastLogin: '-' }])
        message.success('创建成功')
      }
      setModalVisible(false)
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const roleOptions = [
    { value: 'commander', label: '指挥调度' },
    { value: 'investigator', label: '侦查研判' },
    { value: 'frontline', label: '一线执勤' },
    { value: 'admin', label: '系统管理员' }
  ]

  return (
    <div className="users-page">
      <Card title="用户管理" className="users-card">
        <div className="toolbar">
          <Space>
            <Input
              placeholder="搜索姓名/警号"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="筛选角色"
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
              style={{ width: 120 }}
              options={roleOptions}
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增用户</Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={(p) => setPagination({ ...pagination, ...p })}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="badgeNumber" label="警号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
          <Form.Item name="department" label="所属单位" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={editingUser ? '新密码（留空不修改）' : '密码'} rules={editingUser ? [] : [{ required: true }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
