'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Vec3 = { x: number; y: number; z: number };
type Telemetry = {
  device_id: string;
  timestamp: number | string;
  heading_deg: number;
  accelerometer: Vec3;
  gyroscope: Vec3;
};

// Next replaces this at build time; safe to use in client code
const WS_URL = (process.env.NEXT_PUBLIC_WS_URL as string) || '';
const MAX_HISTORY = 25;

export default function App() {
  const [connected, setConnected] = useState(false);
  const [last, setLast] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const envMissing = !WS_URL || WS_URL.trim().length === 0;

  useEffect(() => {
    if (envMissing) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onerror = () => setConnected(false);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        // bridge sends { type:'telemetry', payload:{...} }
        const msg: Telemetry =
          raw && raw.type === 'telemetry' && raw.payload ? raw.payload : raw;

        if (typeof msg.device_id === 'string' && typeof msg.heading_deg === 'number') {
          setLast(msg);
          setHistory((prev) => {
            const next = [msg, ...prev];
            if (next.length > MAX_HISTORY) next.pop();
            return next;
          });
        }
      } catch {
        // ignore non-JSON / bad frames
      }
    };

    return () => {
      try { ws.close(); } catch {}
    };
  }, [envMissing]);

  const tsLabel = useMemo(() => {
    if (!last) return '';
    const n = typeof last.timestamp === 'string' ? parseInt(last.timestamp) : last.timestamp;
    if (!Number.isFinite(n)) return String(last.timestamp);
    return new Date(n * 1000).toLocaleString();
  }, [last]);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={{ margin: 0 }}>Live Telemetry</h1>
        <div style={s.status}>
          <span style={{ ...s.dot, background: connected ? '#22c55e' : '#ef4444' }} />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
          <code style={s.url}>{WS_URL || 'WS URL not set'}</code>
        </div>
      </header>

      {envMissing && (
        <div style={s.banner}>
          <strong>Missing env:</strong> set <code>NEXT_PUBLIC_WS_URL</code> in <code>.env.local</code>, e.g.{' '}
          <code>ws://3.21.230.207:8080</code>, then restart your dev server.
        </div>
      )}

      <section style={s.grid} aria-disabled={envMissing}>
        {/* Compass */}
        <div style={s.card}>
          <h2>Compass</h2>
          <div style={s.compassWrap}>
            <div style={s.compass}>
              <div style={s.nsew}>N</div>
              <div style={{ ...s.nsew, transform: 'translate(-50%, -50%) rotate(90deg)' }}>E</div>
              <div style={{ ...s.nsew, transform: 'translate(-50%, -50%) rotate(180deg)' }}>S</div>
              <div style={{ ...s.nsew, transform: 'translate(-50%, -50%) rotate(270deg)' }}>W</div>
              <div
                style={{
                  ...s.needle,
                  transform: `translateX(-50%) rotate(${last?.heading_deg ?? 0}deg)`,
                }}
              />
            </div>
            <div style={s.readout}>
              <KV k="Heading" v={last ? `${last.heading_deg.toFixed(1)}°` : '—'} />
              <KV k="Device" v={last?.device_id ?? '—'} />
              <KV k="Timestamp" v={last ? tsLabel : '—'} />
            </div>
          </div>
        </div>

        {/* Accelerometer */}
        <div style={s.card}>
          <h2>Accelerometer</h2>
          <XYZ data={last?.accelerometer} />
        </div>

        {/* Gyroscope */}
        <div style={s.card}>
          <h2>Gyroscope</h2>
          <XYZ data={last?.gyroscope} />
        </div>

        {/* Recent messages */}
        <div style={{ ...s.card, gridColumn: '1 / -1' }}>
          <h2>Recent Messages</h2>
          <div style={s.history}>
            {history.length === 0
              ? 'Waiting for telemetry…'
              : history.map((m, i) => (
                  <div key={i} style={s.msg}>
                    <code>{JSON.stringify(m)}</code>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div style={s.kv}>
      <span>{k}</span>
      <strong>{v}</strong>
    </div>
  );
}

function XYZ({ data }: { data?: Vec3 }) {
  return (
    <div style={s.xyz}>
      {['x', 'y', 'z'].map((axis) => (
        <div key={axis} style={s.axis}>
          <span>{axis}</span>
          <strong>{data ? (data as any)[axis].toFixed(2) : '—'}</strong>
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 20, background: '#0b1020', color: '#fff', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  status: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: '50%' },
  url: { background: '#111', padding: '4px 8px', borderRadius: 6 },
  banner: {
    background: '#3b1d1d',
    border: '1px solid #7f1d1d',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    marginTop: 12,
  },
  grid: { display: 'grid', gap: 20, gridTemplateColumns: 'repeat(12, 1fr)', marginTop: 20 },
  card: { gridColumn: 'span 6', padding: 20, background: '#111827', borderRadius: 12, border: '1px solid #1e293b' },
  compassWrap: { display: 'flex', gap: 20, alignItems: 'center' },
  compass: { width: 180, height: 180, borderRadius: '50%', position: 'relative', border: '2px solid #1e293b' },
  nsew: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 12 },
  needle: { position: 'absolute', left: '50%', top: 10, width: 3, height: 150, background: 'red', transformOrigin: '50% 85%' },
  readout: { display: 'grid', gap: 8, minWidth: 260 },
  kv: { padding: 8, borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' },
  xyz: { display: 'flex', gap: 20 },
  axis: { textAlign: 'center' },
  history: { maxHeight: 220, overflowY: 'auto', border: '1px solid #1e293b', borderRadius: 8, padding: 10 },
  msg: { padding: 6, marginBottom: 6, background: '#0f172a', borderRadius: 6 },
};

