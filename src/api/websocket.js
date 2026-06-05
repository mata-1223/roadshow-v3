// WebSocket 클라이언트
// dev: Vite proxy (location.host), prod: 환경변수 VITE_WS_BASE 사용
function wsUrl() {
  const explicit = import.meta.env.VITE_WS_BASE;
  if (explicit) {
    return explicit.replace(/\/$/, '') + '/ws';
  }
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}

export function createWebSocket(sessionId, handlers) {
  const ws = new WebSocket(wsUrl());

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'JOIN', session_id: sessionId }));
  };

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    const handler = handlers[msg.type];
    if (handler) handler(msg);
    if (handlers.any) handlers.any(msg);
  };

  ws.onerror = (ev) => {
    if (handlers.error) handlers.error(ev);
  };

  ws.onclose = () => {
    if (handlers.close) handlers.close();
  };

  return {
    sendBehavior(behaviorId, eventType, entity) {
      ws.send(JSON.stringify({
        type: 'BEHAVIOR',
        session_id:  sessionId,
        behavior_id: behaviorId,
        event_type:  eventType,
        entity:      entity,
      }));
    },
    close() { ws.close(); },
    raw: ws,
  };
}
