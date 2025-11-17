// src/realtime/wsClient.js
let socket = null;
let listeners = new Set();
let stopped = false;

const url = process.env.NEXT_PUBLIC_WS_URL || '';
let backoff = 1000;

function connect() {
  if (!url || stopped) return;

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      backoff = 1000;
    };

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        listeners.forEach((cb) => cb(msg));
      } catch {}
    };

    socket.onclose = () => {
      socket = null;
      if (stopped) return;
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 15000);
    };

    socket.onerror = () => {
      try { socket && socket.close(); } catch {}
    };
  } catch {
    setTimeout(connect, backoff);
    backoff = Math.min(backoff * 2, 15000);
  }
}

export function startWS() {
  stopped = false;
  if (!socket) connect();
}

export function stopWS() {
  stopped = true;
  try { socket && socket.close(); } catch {}
  socket = null;
}

export function onWSMessage(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

