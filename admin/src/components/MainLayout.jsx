import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  AlertOutlined,
  ProjectOutlined,
  ApiOutlined,
  FileProtectOutlined,
  BarChartOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { getMenuPermissions } from '../utils/permissions'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const permissions = getMenuPermissions()

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    permissions.alerts && { key: '/alerts', icon: <AlertOutlined />, label: '预警管理' },
    permissions.tasks && { key: '/tasks', icon: <ProjectOutlined />, label: '任务管理' },
    permissions.devices && { key: '/devices', icon: <ApiOutlined />, label: '设备管理' },
    permissions.evidence && { key: '/evidence', icon: <FileProtectOutlined />, label: '执法记录' },
    permissions.stats && { key: '/stats', icon: <BarChartOutlined />, label: '数据统计' },
    permissions.users && { key: '/system/users', icon: <UserOutlined />, label: '用户管理' },
    { key: '/gis', icon: <EnvironmentOutlined />, label: 'GIS管理' },
    permissions.settings && { key: '/settings', icon: <SettingOutlined />, label: '系统设置' }
  ].filter(Boolean)

  const userMenu = (
    <Menu
      items={[
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: '个人信息',
          onClick: () => navigate('/settings')
        },
        { type: 'divider' },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: '退出登录',
          danger: true,
          onClick: () => {
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_user')
            navigate('/login')
          }
        }
      ]}
    />
  )

  const user = JSON.parse(localStorage.getItem('admin_user') || '{}')

  return (
    <Layout className="main-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        className="layout-sider"
      >
        <div className="logo-area">
          {collapsed ? (
            <span className="logo-text collapsed">热眼</span>
          ) : (
            <div className="logo-full">
              <span className="logo-title">热眼擒枭</span>
              <span className="logo-sub">管理后台</span>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="main-menu"
        />
      </Sider>
      <Layout>
        <Header className="layout-header">
          <div className="header-left">
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed)
            })}
          </div>
          <div className="header-right">
            <Badge count={3} size="small">
              <BellOutlined className="header-icon" />
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div className="user-info">
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="user-name">{user.name || '管理员'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="layout-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
