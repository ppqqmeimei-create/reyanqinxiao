import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';
const USERNAME = process.env.DEMO_USERNAME || 'admin';
const PASSWORD = process.env.DEMO_PASSWORD || '123456';
const DEMO_DEVICE_ID = process.env.DEMO_DEVICE_ID || 'DEV-IR-001';
const ASSIGNED_TO = Number(process.env.DEMO_ASSIGNED_TO || 1);

async function login() {
  const { data } = await axios.post(`${BASE_URL}/auth/login`, {
    username: USERNAME,
    password: PASSWORD
  });

  const token = data?.token || data?.data?.access_token;
  if (!token) {
    throw new Error('登录成功但未返回 token');
  }
  return token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function run() {
  console.log('[1/6] 登录获取令牌...');
  const token = await login();

  console.log('[2/6] 设备心跳上报...');
  await axios.post(
    `${BASE_URL}/sensing/heartbeat`,
    {
      device_id: DEMO_DEVICE_ID,
      battery: 82,
      signal_strength: 88,
      metadata: {
        edge_node: 'GX-NODE-03',
        scene: 'border-night'
      }
    },
    { headers: authHeaders(token) }
  );

  console.log('[3/6] 设备异常状态上报并触发预警...');
  const warningResp = await axios.post(
    `${BASE_URL}/sensing/status-report`,
    {
      device_id: DEMO_DEVICE_ID,
      anomaly_score: 22,
      confidence: 0.91,
      target_type: 'animal',
      species_name: '穿山甲',
      historical_case_count: 6,
      description: '红外连续触发并识别疑似活体目标'
    },
    { headers: authHeaders(token) }
  );

  const warningId = warningResp?.data?.data?.alert?.id;
  if (!warningId) {
    throw new Error('未获取到预警 ID，无法继续闭环流程');
  }

  console.log(`[4/6] 一键转任务, warning_id=${warningId} ...`);
  const createTaskResp = await axios.post(
    `${BASE_URL}/tasks/createFromWarning`,
    {
      warning_id: warningId,
      assigned_to: ASSIGNED_TO,
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    },
    { headers: authHeaders(token) }
  );

  const taskId = createTaskResp?.data?.data?.task?.id;
  if (!taskId) {
    throw new Error('未获取到 task_id，无法继续闭环流程');
  }

  console.log(`[5/6] 更新任务进度到完成, task_id=${taskId} ...`);
  await axios.put(
    `${BASE_URL}/tasks/updateProgress`,
    {
      task_id: taskId,
      progress: 100,
      notes: '现场核查完成，目标已控制并移交处置'
    },
    { headers: authHeaders(token) }
  );

  console.log('[6/6] 上传处置证据并查询聚合分析...');
  await axios.post(
    `${BASE_URL}/evidence/upload`,
    {
      task_id: taskId,
      warning_id: warningId,
      type: 'image',
      url: 'https://example.com/evidence/demo-border-001.jpg',
      description: '现场取证图像'
    },
    { headers: authHeaders(token) }
  );

  const aggregationResp = await axios.get(`${BASE_URL}/analysis/aggregation`, {
    headers: authHeaders(token),
    params: { hotspot_precision: 2, hotspot_limit: 5 }
  });

  console.log('✅ 闭环联调完成');
  console.log('预警ID:', warningId);
  console.log('任务ID:', taskId);
  console.log('聚合摘要:', {
    risk_distribution: aggregationResp?.data?.data?.risk_distribution?.length || 0,
    hotspot_areas: aggregationResp?.data?.data?.hotspot_areas?.length || 0,
    high_frequency_periods: aggregationResp?.data?.data?.high_frequency_periods?.length || 0
  });
}

run().catch((err) => {
  console.error('❌ 闭环联调失败:', err?.response?.data || err.message);
  process.exit(1);
});
