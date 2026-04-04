import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import realtimeEventBus from '../services/realtimeEventBus.js';

const router = express.Router();

/**
 * GET /api/v1/fusion/stream
 * 指挥中心实时事件流（SSE）
 */
router.get('/stream', authenticate, authorize('admin', 'manager', 'inspector'), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send('connected', {
    client: req.user?.id,
    at: new Date().toISOString(),
    channels: ['warning:new', 'device:heartbeat']
  });

  const unsubscribeWarning = realtimeEventBus.subscribe('warning:new', (payload) => send('warning:new', payload));
  const unsubscribeHeartbeat = realtimeEventBus.subscribe('device:heartbeat', (payload) => send('device:heartbeat', payload));

  const ping = setInterval(() => {
    send('ping', { at: new Date().toISOString() });
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    unsubscribeWarning();
    unsubscribeHeartbeat();
    res.end();
  });
});

export default router;
