/* ═════════════════════════════════════════════════════════════════════
   FINOVA PRO - REAL-TIME WEBSOCKET BROADCASTER & EVENT SYNC ENGINE
   ═════════════════════════════════════════════════════════════════════ */

const WebSocket = require('ws');

let wss = null;
const clients = new Set();

function initRealtimeServer(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.userId = null;
    clients.add(ws);

    console.log(`⚡ Real-time client connected (Total Active: ${clients.size})`);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'AUTH') {
          ws.userId = data.userId;
          ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', message: 'Real-time WebSocket session authenticated' }));
        } else if (data.type === 'PING') {
          ws.isAlive = true;
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch (err) {
        console.error('Error parsing WS message:', err.message);
      }
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`🔌 Real-time client disconnected (Remaining: ${clients.size})`);
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err.message);
      clients.delete(ws);
    });

    // Send connection greeting
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to Finova Pro Real-Time Engine' }));
  });

  // Heartbeat ping interval to keep connections alive
  const interval = setInterval(() => {
    clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

function broadcastEvent(userId, eventType, data = {}) {
  if (!clients.size) return;

  const payload = JSON.stringify({
    type: eventType,
    userId,
    timestamp: new Date().toISOString(),
    data
  });

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      if (!userId || userId === '*' || ws.userId === userId) {
        ws.send(payload);
      }
    }
  });
}

module.exports = {
  initRealtimeServer,
  broadcastEvent
};
