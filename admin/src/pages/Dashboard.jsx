import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Progress, List, Avatar } from 'antd'
import {
  AlertOutlined,
  ApiOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { statsAPI, alertAPI, taskAPI, deviceAPI } from '../utils/api'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState({
    alerts: { total: 0, critical: 0, warning: 0, pending: 0 },
    tasks: { total: 0, inProgress: 0, completed: 0, pending: 0 },
    devices: { total: 0, online: 0, warning: 0, offline: 0 },
    evidence: { total: 0, pending: 0 }
  })
  const [recentAlerts, setRecentAlerts] = useState([])
  const [trendData, setTrendData] = useState({ dates: [], smuggling: [], ecology: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // 模拟数据（实际应调用API）
      setStats({
        alerts: { total: 156, critical: 12, warning: 43, pending: 89 },
        tasks: { total: 78, inProgress: 23, completed: 45, pending: 10 },
        devices: { total: 87, online: 72, warning: 10, offline: 5 },
        evidence: { total: 234, pending: 18 }
      })
      setRecentAlerts([
        { id: 1, type: '走私预警', level: 'critical', message: '友谊关红外触发 - 疑似穿山甲', time: '5分钟前', zone: '凭祥友谊关' },
        { id: 2, type: '走私预警', level: 'warning', message: '东兴口岸异常震动信号', time: '18分钟前', zone: '东兴口岸' },
        { id: 3, type: '生态预警', level: 'info', message: '水质传感器异常 - pH值偏低', time: '32分钟前', zone: '龙州水口' },
        { id: 4, type: '走私预警', level: 'critical', message: 'GPS轨迹异常 - 偏离巡逻路线', time: '45分钟前', zone: '靖西岳圩' },
        { id: 5, type: '生态预警', level: 'warning', message: '气味传感器检测到异常气味', time: '1小时前', zone: '那坡桂林' }
      ])
      setTrendData({
        dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        smuggling: [12, 19, 15, 22, 18, 25, 21],
        ecology: [8, 12, 10, 15, 13, 9, 11]
      })
    } catch (error) {
      console.error('获取仪表盘数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['走私预警', '生态预警'],
      textStyle: { color: '#8CA3B8' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.dates,
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8CA3B8' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
      axisLabel: { color: '#8CA3B8' },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.1)' } }
    },
    series: [
      {
        name: '走私预警',
        type: 'line',
        smooth: true,
        data: trendData.smuggling,
        lineStyle: { color: '#FF4D4F', width: 2 },
        itemStyle: { color: '#FF4D4F' },
        areaStyle: { color: 'rgba(255, 77, 79, 0.2)' }
      },
      {
        name: '生态预警',
        type: 'line',
        smooth: true,
        data: trendData.ecology,
        lineStyle: { color: '#73D13D', width: 2 },
        itemStyle: { color: '#73D13D' },
        areaStyle: { color: 'rgba(115, 209, 61, 0.2)' }
      }
    ]
  })

  const getLevelTag = (level) => {
    const config = {
      critical: { color: '#FF4D4F', text: '紧急' },
      warning: { color: '#FFA940', text: '警告' },
      info: { color: '#722ED1', text: '提示' }
    }
    const { color, text } = config[level] || config.info
    return <Tag color={color}>{text}</Tag>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="page-title">
          <EnvironmentOutlined /> 全局态势总览
        </h1>
        <p className="page-subtitle">实时监控边境活物走私与生态预警动态</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-alerts">
            <Statistic
              title={<span className="stat-title"><AlertOutlined /> 预警总数</span>}
              value={stats.alerts.total}
              valueStyle={{ color: '#FF4D4F' }}
              suffix={<span className="stat-suffix">/{stats.alerts.pending}待处理</span>}
            />
            <div className="stat-detail">
              <Tag color="#FF4D4F">紧急 {stats.alerts.critical}</Tag>
              <Tag color="#FFA940">警告 {stats.alerts.warning}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-tasks">
            <Statistic
              title={<span className="stat-title"><ProjectOutlined /> 任务总数</span>}
              value={stats.tasks.total}
              valueStyle={{ color: '#00D4FF' }}
              suffix={<span className="stat-suffix">/{stats.tasks.inProgress}进行中</span>}
            />
            <Progress
              percent={Math.round((stats.tasks.completed / stats.tasks.total) * 100)}
              strokeColor="#00D4FF"
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-devices">
            <Statistic
              title={<span className="stat-title"><ApiOutlined /> 设备在线</span>}
              value={stats.devices.online}
              valueStyle={{ color: '#73D13D' }}
              suffix={<span className="stat-suffix">/ {stats.devices.total}</span>}
            />
            <div className="stat-detail">
              <Tag color="#73D13D">在线 {stats.devices.online}</Tag>
              <Tag color="#FFA940">警告 {stats.devices.warning}</Tag>
              <Tag color="#8CA3B8">离线 {stats.devices.offline}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-evidence">
            <Statistic
              title={<span className="stat-title"><CheckCircleOutlined /> 取证记录</span>}
              value={stats.evidence.total}
              valueStyle={{ color: '#722ED1' }}
              suffix={<span className="stat-suffix">/{stats.evidence.pending}待同步</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* 趋势图和预警列表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="预警趋势" className="chart-card">
            <ReactECharts option={getTrendOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="最新预警" className="alert-list-card">
            <List
              dataSource={recentAlerts}
              renderItem={(item) => (
                <List.Item className="alert-item">
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={item.level === 'critical' ? <WarningOutlined /> : <ClockCircleOutlined />}
                        style={{ background: item.level === 'critical' ? '#FF4D4F' : item.level === 'warning' ? '#FFA940' : '#722ED1' }}
                      />
                    }
                    title={
                      <div className="alert-item-title">
                        {getLevelTag(item.level)}
                        <span className="alert-zone">{item.zone}</span>
                      </div>
                    }
                    description={
                      <div>
                        <p className="alert-message">{item.message}</p>
                        <span className="alert-time">{item.time}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
