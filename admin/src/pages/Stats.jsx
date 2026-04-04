import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, DatePicker, Button, Select, Space } from 'antd'
import { BarChartOutlined, LineChartOutlined, PieChartOutlined, DownloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import './Stats.css'

const Stats = () => {
  const [trendData, setTrendData] = useState({})
  const [speciesData, setSpeciesData] = useState({})
  const [performanceData, setPerformanceData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStatsData()
  }, [])

  const fetchStatsData = () => {
    setLoading(true)
    setTrendData({
      dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      smuggling: [12, 19, 15, 22, 18, 25, 21],
      ecology: [8, 12, 10, 15, 13, 9, 11],
      fooddrug: [5, 7, 6, 8, 9, 5, 7]
    })
    setSpeciesData([
      { value: 35, name: '穿山甲' },
      { value: 28, name: '食蟹猴' },
      { value: 15, name: '海龟' },
      { value: 12, name: '象牙制品' },
      { value: 10, name: '其他' }
    ])
    setPerformanceData([
      { id: 1, name: '张伟', department: '崇左支队', completedTasks: 45, resolvedAlerts: 38, evidenceCount: 56, score: 98 },
      { id: 2, name: '李娜', department: '崇左支队', completedTasks: 42, resolvedAlerts: 35, evidenceCount: 48, score: 95 },
      { id: 3, name: '王强', department: '防城港支队', completedTasks: 38, resolvedAlerts: 32, evidenceCount: 41, score: 92 },
      { id: 4, name: '刘洋', department: '防城港支队', completedTasks: 35, resolvedAlerts: 30, evidenceCount: 38, score: 90 },
      { id: 5, name: '陈静', department: '百色支队', completedTasks: 30, resolvedAlerts: 25, evidenceCount: 32, score: 88 }
    ])
    setLoading(false)
  }

  const getTrendOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['走私预警', '生态预警', '食药预警'], textStyle: { color: '#8CA3B8' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.dates || [],
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
      { name: '走私预警', type: 'line', smooth: true, data: trendData.smuggling || [], lineStyle: { color: '#FF4D4F', width: 2 }, itemStyle: { color: '#FF4D4F' }, areaStyle: { color: 'rgba(255, 77, 79, 0.2)' } },
      { name: '生态预警', type: 'line', smooth: true, data: trendData.ecology || [], lineStyle: { color: '#73D13D', width: 2 }, itemStyle: { color: '#73D13D' }, areaStyle: { color: 'rgba(115, 209, 61, 0.2)' } },
      { name: '食药预警', type: 'line', smooth: true, data: trendData.fooddrug || [], lineStyle: { color: '#FFA940', width: 2 }, itemStyle: { color: '#FFA940' }, areaStyle: { color: 'rgba(255, 169, 64, 0.2)' } }
    ]
  })

  const getSpeciesOption = () => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#8CA3B8' } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: speciesData,
      itemStyle: { borderRadius: 6, borderColor: '#0C1B2A', borderWidth: 2 }
    }]
  })

  const getPerformanceOption = () => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['完成任务', '处置预警'], textStyle: { color: '#8CA3B8' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: performanceData.map(d => d.name),
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
      { name: '完成任务', type: 'bar', data: performanceData.map(d => d.completedTasks), itemStyle: { color: '#00D4FF', borderRadius: [4, 4, 0, 0] } },
      { name: '处置预警', type: 'bar', data: performanceData.map(d => d.resolvedAlerts), itemStyle: { color: '#FF4D4F', borderRadius: [4, 4, 0, 0] } }
    ]
  })

  const performanceColumns = [
    { title: '排名', key: 'rank', width: 60, render: (_, __, index) => index + 1 },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '所属单位', dataIndex: 'department', key: 'department' },
    { title: '完成任务', dataIndex: 'completedTasks', key: 'completedTasks', sorter: (a, b) => a.completedTasks - b.completedTasks },
    { title: '处置预警', dataIndex: 'resolvedAlerts', key: 'resolvedAlerts', sorter: (a, b) => a.resolvedAlerts - b.resolvedAlerts },
    { title: '取证数量', dataIndex: 'evidenceCount', key: 'evidenceCount' },
    { title: '绩效评分', dataIndex: 'score', key: 'score', render: (v) => <span style={{ color: v >= 95 ? '#73D13D' : v >= 90 ? '#00D4FF' : '#FFA940' }}>{v}</span> }
  ]

  const totalCompleted = performanceData.reduce((sum, d) => sum + d.completedTasks, 0)
  const totalResolved = performanceData.reduce((sum, d) => sum + d.resolvedAlerts, 0)
  const avgScore = performanceData.length > 0 ? Math.round(performanceData.reduce((sum, d) => sum + d.score, 0) / performanceData.length) : 0

  return (
    <div className="stats-page">
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}><Card><Statistic title="本周任务完成" value={totalCompleted} suffix="件" valueStyle={{ color: '#00D4FF' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="本周预警处置" value={totalResolved} suffix="件" valueStyle={{ color: '#73D13D' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="平均绩效评分" value={avgScore} suffix="分" valueStyle={{ color: avgScore >= 95 ? '#73D13D' : '#FFA940' }} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="参与人员" value={performanceData.length} suffix="人" valueStyle={{ color: '#EAF6FF' }} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}><Card title="预警趋势" className="chart-card"><ReactECharts option={getTrendOption()} style={{ height: 300 }} /></Card></Col>
        <Col xs={24} lg={10}><Card title="物种分析" className="chart-card"><ReactECharts option={getSpeciesOption()} style={{ height: 300 }} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}><Card title="人员绩效排名" className="chart-card"><Table columns={performanceColumns} dataSource={performanceData} rowKey="id" pagination={false} /></Card></Col>
      </Row>
    </div>
  )
}

export default Stats
