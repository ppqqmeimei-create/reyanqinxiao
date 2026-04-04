import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import MainLayout from './components/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/system/Users'
import Alerts from './pages/Alerts'
import Tasks from './pages/Tasks'
import Devices from './pages/Devices'
import Evidence from './pages/Evidence'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import GIS from './pages/GIS'
import { hasPermission } from './utils/permissions'

// 权限守卫组件
function PermissionGate({ permission, children }) {
  if (!hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

// 路由配置
const routes = [
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'system/users', element: <PermissionGate permission="user:manage"><Users /></PermissionGate> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'tasks', element: <Tasks /> },
      { path: 'devices', element: <Devices /> },
      { path: 'evidence', element: <Evidence /> },
      { path: 'stats', element: <Stats /> },
      { path: 'settings', element: <Settings /> },
      { path: 'gis', element: <GIS /> }
    ]
  }
]

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00D4FF',
          borderRadius: 8,
          colorBgContainer: '#0C1B2A',
          colorBgElevated: '#0C1B2A',
          colorBorder: 'rgba(0, 212, 255, 0.22)',
          colorText: '#EAF6FF',
          colorTextSecondary: '#8CA3B8'
        }
      }}
    >
      <BrowserRouter>
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element}>
              {route.children?.map((child, childIndex) => (
                <Route key={childIndex} index={child.index} path={child.path} element={child.element} />
              ))}
            </Route>
          ))}
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
