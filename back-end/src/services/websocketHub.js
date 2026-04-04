import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import realtimeEventBus from './realtimeEventBus.js';

let wss;

const ALLOWED_ROLES = new Set(['admin', 'manager', 'inspector']);

function safeSend(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function parseTokenFromReq(req) {
  const url = new URL(req.url, 'http://localhost');
  const queryToken = url.searchParams.get('token');
  if (queryToken) return queryToken;

  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

export function broadcastWebSocket(event, data) {
  if (!wss) return;

  const payload = { event, data, ts: new Date().toISOString() };
  wss.clients.forEach((client) => safeSend(client, payload));
}

export function initWebSocket(server, wsPath = '/api/v1/ws/command') {
  wss = new WebSocketServer({ server, path: wsPath });

  wss.on('connection', (ws, req) => {
    const token = parseTokenFromReq(req);
    if (!token) {
      safeSend(ws, { event: 'error', message: '未提供认证令牌' });
      ws.close(1008, 'unauthorized');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
      if (!ALLOWED_ROLES.has(decoded.role)) {
        safeSend(ws, { event: 'error', message: '无权限订阅实时指挥通道' });
        ws.close(1008, 'forbidden');
        return;
      }
      ws.user = decoded;
    } catch (error) {
      safeSend(ws, { event: 'error', message: '认证失败' });
      ws.close(1008, 'unauthorized');
      return;
    }

    safeSend(ws, {
      event: 'connected',
      data: { user_id: ws.user.id, role: ws.user.role, channels: ['warning:new', 'device:heartbeat'] },
      ts: new Date().toISOString()
    });

    ws.on('message', (raw) => {
      try {
        const message = JSON.parse(String(raw));
        if (message?.type === 'ping') {
          safeSend(ws, { event: 'pong', data: { at: new Date().toISOString() } });
        }
      } catch {
        safeSend(ws, { event: 'error', message: '消息格式错误，要求 JSON' });
      }
    });
  });

  realtimeEventBus.subscribe('warning:new', (payload) => broadcastWebSocket('warning:new', payload));
  realtimeEventBus.subscribe('device:heartbeat', (payload) => broadcastWebSocket('device:heartbeat', payload));

  return wss;
}
