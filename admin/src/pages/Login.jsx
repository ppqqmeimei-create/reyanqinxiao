import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api'
import './Login.css'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const res = await authAPI.login(values)
      if (res.token) {
        localStorage.setItem('admin_token', res.token)
        localStorage.setItem('admin_user', JSON.stringify(res.user || {}))
        message.success('登录成功')
        navigate('/dashboard')
      }
    } catch (error) {
      message.error('登录失败：' + (error.response?.data?.message || '请检查账号密码'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-bg"></div>
      <Card className="login-card" bordered={false}>
        <div className="login-header">
          <div className="logo-icon">
            <UserOutlined />
          </div>
          <h1 className="login-title">热眼擒枭</h1>
          <p className="login-subtitle">边境活物走私智能防控系统 · 管理后台</p>
        </div>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名 / 警号"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="login-btn"
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
        <div className="login-footer">
          <p>本系统仅限授权管理人员使用</p>
        </div>
      </Card>
    </div>
  )
}

export default Login
