"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AuthForm from "@/components/AuthForm";
import { DeviceRegisterForm } from "@/components/DeviceRegisterForm";
import { MyDevicesList } from "@/components/MyDevicesList";

type Telemetry = {
  device_id: string;
  device_ts: number | string;
  heading_deg: number;
  temp: number | null;
  temperature?: number | null;
  battery_percent: number | null;
  accel_x: number | null;
  accel_y: number | null;
  accel_z: number | null;
  gyro_x: number | null;
  gyro_y: number | null;
  gyro_z: number | null;
  mag_x: number | null;
  mag_y: number | null;
  mag_z: number | null;
  lat?: number | null;
  lon?: number | null;
  speed?: number | null;
  altitude?: number | null;
  pressure?: number | null;
  direction?: number | null;
  created_at: string | number;
  received_at: string | number;
};

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL as string) || "";
const MAX_HISTORY = 25;
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082"; // fallback for local

function getSecureWebSocketUrl(url: string): string {
  if (!url) return url;
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return url.replace(/^ws:/, "wss:");
  }
  return url;
}

function formatTimestamp(ts: number | string): string {
  if (typeof ts === "number" && Number.isFinite(ts)) {
    return new Date(ts * 1000).toLocaleString();
  }
  if (typeof ts === "string") {
    const trimmed = ts.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = Number.parseInt(trimmed, 10);
      if (Number.isFinite(num)) {
        return new Date(num * 1000).toLocaleString();
      }
    }
    return trimmed;
  }
  return "N/A";
}

function formatNumber(value: unknown, digits = 2): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(digits);
  }
  return "N/A";
}

/**
 * Poll the PUBLIC history endpoint (no auth needed)
 * and convert the newest row into Telemetry.
 */
async function fetchLatestTelemetry(): Promise<Telemetry | null> {
  try {
    const res = await fetch(`${API_BASE}/api/telemetry/history`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        "Failed to fetch latest telemetry:",
        res.status,
        res.statusText
      );
      return null;
    }

    const rows = (await res.json()) as any[];
    if (!rows || rows.length === 0) return null;

    const row = rows[0];

    const msg: Telemetry = {
      device_id: row.device_id,
      device_ts: row.device_ts ?? row.created_at ?? 0,
      heading_deg: row.heading_deg ?? 0,
      temp: row.temp ?? null,
      temperature: row.temperature ?? null,
      battery_percent: row.battery_percent ?? null,

      accel_x: row.accel_x ?? null,
      accel_y: row.accel_y ?? null,
      accel_z: row.accel_z ?? null,

      gyro_x: row.gyro_x ?? null,
      gyro_y: row.gyro_y ?? null,
      gyro_z: row.gyro_z ?? null,

      mag_x: row.mag_x ?? null,
      mag_y: row.mag_y ?? null,
      mag_z: row.mag_z ?? null,

      lat: row.latitude ?? row.lat ?? null,
      lon: row.longitude ?? row.lon ?? null,
      speed: row.speed_kmh ?? row.speed ?? null,
      altitude: row.altitude_m ?? row.altitude ?? null,
      pressure: row.pressure_hpa ?? row.pressure ?? null,
      direction: row.direction_deg ?? row.heading_deg ?? null,

      created_at: row.created_at ?? "",
      received_at: row.received_at ?? "",
    };

    return msg;
  } catch (err) {
    console.error("Error in fetchLatestTelemetry:", err);
    return null;
  }
}

export default function Page() {
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [connected, setConnected] = useState(false);
  const [last, setLast] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [refreshSeconds, setRefreshSeconds] = useState(3); // 1–5s

  // read token from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("authToken");
    if (stored) setToken(stored);
    setAuthChecked(true);
  }, []);

  const envMissing = !WS_URL || WS_URL.trim().length === 0;
  const secureWsUrl = useMemo(() => getSecureWebSocketUrl(WS_URL), []);

  // periodic refresh from REST API (1–5s) for demo stability
  useEffect(() => {
    if (!token) return; // only refresh when logged in

    let cancelled = false;

    const tick = async () => {
      const latest = await fetchLatestTelemetry();
      if (!latest || cancelled) return;

      setLast(latest);
      setHistory((prev) => {
        const next = [latest, ...prev];

        // de-dup by device_id + timestamp-ish
        const seen = new Set<string>();
        const deduped: Telemetry[] = [];
        for (const row of next) {
          const key = `${row.device_id}-${row.device_ts}`;
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(row);
          if (deduped.length >= MAX_HISTORY) break;
        }
        return deduped;
      });
    };

    // initial fetch
    tick();
    const id = setInterval(tick, refreshSeconds * 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token, refreshSeconds]);

  // WebSocket hookup (still used for real-time streaming)
  useEffect(() => {
    if (envMissing || !token) return;

    const ws = new WebSocket(secureWsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS connected");
      setConnected(true);
    };
    ws.onerror = (err) => {
      console.error("WS error:", err);
      setConnected(false);
    };
    ws.onclose = () => {
      console.log("WS closed");
      setConnected(false);
    };

    ws.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        const payload =
          raw && raw.type === "telemetry" && raw.payload ? raw.payload : raw;

        const msg: Telemetry = {
          device_id: payload.device_id,
          device_ts: payload.device_ts ?? payload.timestamp ?? 0,
          heading_deg: payload.heading_deg ?? payload.heading ?? 0,
          temp: payload.temp ?? null,
          temperature: payload.temperature ?? null,
          battery_percent: payload.battery_percent ?? null,
          accel_x: payload.accel_x ?? payload.accelerometer?.x ?? null,
          accel_y: payload.accel_y ?? payload.accelerometer?.y ?? null,
          accel_z: payload.accel_z ?? payload.accelerometer?.z ?? null,
          gyro_x: payload.gyro_x ?? payload.gyroscope?.x ?? null,
          gyro_y: payload.gyro_y ?? payload.gyroscope?.y ?? null,
          gyro_z: payload.gyro_z ?? payload.gyroscope?.z ?? null,
          mag_x: payload.mag_x ?? payload.magnetometer?.x ?? null,
          mag_y: payload.mag_y ?? payload.magnetometer?.y ?? null,
          mag_z: payload.mag_z ?? payload.magnetometer?.z ?? null,
          lat: payload.lat ?? payload.latitude ?? null,
          lon: payload.lon ?? payload.longitude ?? null,
          speed: payload.speed_kmh ?? payload.speed ?? null,
          altitude: payload.altitude_m ?? payload.altitude ?? null,
          pressure: payload.pressure_hpa ?? payload.pressure ?? null,
          direction: payload.direction_deg ?? payload.direction ?? null,
          created_at: payload.created_at ?? raw.created_at ?? "",
          received_at: raw.received_at ?? payload.received_at ?? "",
        };

        if (typeof msg.device_id === "string" && !Number.isNaN(msg.heading_deg)) {
          setLast(msg);
          setHistory((prev) => {
            const next = [msg, ...prev];
            if (next.length > MAX_HISTORY) next.pop();
            return next;
          });
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [envMissing, secureWsUrl, token]);

  function handleLogout() {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("authToken");
      }
    } catch {}
    try {
      wsRef.current?.close();
    } catch {}
    setToken(null);
    setAuthChecked(true);
  }

  if (!authChecked) return null;

  if (!token) {
    return <AuthForm onAuth={setToken} />;
  }

  const deviceTimestamp = last ? formatTimestamp(last.device_ts) : "N/A";
  const lastReceived = last ? formatTimestamp(last.received_at) : "N/A";
  const speedKmh =
    last && typeof last.speed === "number" && Number.isFinite(last.speed)
      ? last.speed
      : null;
  const locationLabel =
    last && last.lat != null && last.lon != null
      ? `${formatNumber(last.lat, 4)}, ${formatNumber(last.lon, 4)}`
      : "N/A";
  const directionDeg =
    last && (last.direction != null || last.heading_deg != null)
      ? formatNumber(last.direction ?? last.heading_deg, 0)
      : "N/A";
  const temperatureValue =
    last && (last.temp != null || last.temperature != null)
      ? formatNumber(last.temp ?? last.temperature, 1)
      : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10" />

      {/* Header */}
      <header className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/redacted.png"
                alt="AEGIS"
                className="h-12 w-auto drop-shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  AEGIS TRACKER
                </h1>
                <p className="text-xs text-slate-400">
                  Real-Time Telemetry Dashboard
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/50 rounded-lg border border-slate-700">
                <div
                  className={`h-2 w-2 rounded-full ${
                    connected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                <span
                  className={`text-sm ${
                    connected ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {connected ? "Connected" : "Offline"}
                </span>
              </div>

              <select className="px-4 py-2 bg-slate-950/50 rounded-lg border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:border-slate-600 transition-all">
                <option>{last?.device_id || "Select Device"}</option>
              </select>

              <button
                onClick={() => {
                  setLast(null);
                  setHistory([]);
                }}
                className="px-4 py-2 bg-slate-950/50 rounded-lg border border-slate-700 text-white text-sm hover:bg-slate-800 hover:border-slate-600 transition-all"
              >
                Reset
              </button>

              <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 rounded-lg border border-slate-700 text-xs text-slate-300">
                <span>Refresh</span>
                <select
                  className="bg-slate-900/80 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  value={refreshSeconds}
                  onChange={(e) => setRefreshSeconds(Number(e.target.value))}
                >
                  <option value={1}>1s</option>
                  <option value={2}>2s</option>
                  <option value={5}>5s</option>
                </select>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-white text-sm font-medium shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative p-6 space-y-6">
        {/* Devices: Registration + My Devices */}
        <Card title="Devices">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeviceRegisterForm token={token} />
            <MyDevicesList token={token} />
          </div>
        </Card>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="DEVICE ID"
            value={last?.device_id || "N/A"}
            unit=""
            icon="📡"
          />
          <MetricCard
            label="BATTERY"
            value={last ? formatNumber(last.battery_percent, 0) : "N/A"}
            unit="%"
            icon="🔋"
            color="cyan"
          />
          <MetricCard
            label="TEMPERATURE"
            value={temperatureValue}
            unit="°C"
            icon="🌡️"
            color="orange"
          />
          <MetricCard
            label="HEADING"
            value={last ? formatNumber(last.heading_deg, 1) : "N/A"}
            unit="°"
            icon="🧭"
            color="blue"
          />
        </div>

        {/* Map + Compass */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="GNSS Location">
            <div className="aspect-video bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-slate-400 mb-2">Map Integration Required</p>
                  <p className="text-sm text-slate-500">
                    Location: {locationLabel}
                  </p>
                </div>
              </div>
              <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-700">
                <div className="text-xs text-slate-400">Coordinates</div>
                <div className="text-sm text-white font-mono">
                  {locationLabel}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Compass & Direction">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-64 h-64">
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                >
                  <defs>
                    <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="45" fill="url(#compassGlow)" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="20"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                  <line
                    x1="50"
                    y1="10"
                    x2="50"
                    y2="90"
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                  <line
                    x1="10"
                    y1="50"
                    x2="90"
                    y2="50"
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                </svg>

                <div className="absolute left-1/2 top-2 -translate-x-1/2 text-xs font-bold text-cyan-400">
                  N
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-400">
                  E
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-cyan-400">
                  S
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-400">
                  W
                </div>

                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50 z-10" />

                <div
                  className="absolute left-1/2 top-1/2 origin-bottom transition-transform duration-300"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${
                      last?.heading_deg ?? 0
                    }deg)`,
                  }}
                >
                  <div className="h-20 w-1 bg-gradient-to-t from-cyan-500 to-cyan-300 -translate-y-20 rounded-full shadow-lg shadow-cyan-500/50" />
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-3xl font-bold text-cyan-400">
                  {last ? formatNumber(last.heading_deg, 1) : "0.0"}°
                </div>
                <div className="text-sm text-slate-400">Current Heading</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Motion sensors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Accelerometer (g)">
            <SensorDisplay
              x={last?.accel_x}
              y={last?.accel_y}
              z={last?.accel_z}
            />
          </Card>

          <Card title="Gyroscope (dps)">
            <SensorDisplay
              x={last?.gyro_x}
              y={last?.gyro_y}
              z={last?.gyro_z}
            />
          </Card>

          <Card title="Magnetometer (μT)">
            <SensorDisplay
              x={last?.mag_x}
              y={last?.mag_y}
              z={last?.mag_z}
            />
          </Card>
        </div>

        {/* GNSS data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="SPEED"
            value={speedKmh != null ? formatNumber(speedKmh, 1) : "N/A"}
            unit="km/h"
            icon="🚀"
            color="green"
          />
          <MetricCard
            label="ALTITUDE"
            value={last ? formatNumber(last.altitude, 1) : "N/A"}
            unit="m"
            icon="⛰️"
          />
          <MetricCard
            label="PRESSURE"
            value={last ? formatNumber(last.pressure, 1) : "N/A"}
            unit="hPa"
            icon="🌪️"
          />
          <MetricCard
            label="DIRECTION"
            value={directionDeg}
            unit="°"
            icon="➡️"
            color="purple"
          />
        </div>

        {/* Device status */}
        <Card title="Device Status & Telemetry">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <StatusRow label="Device Timestamp" value={deviceTimestamp} />
              <StatusRow label="Last Received" value={lastReceived} />
              <StatusRow
                label="Battery Level"
                value={
                  last ? `${formatNumber(last.battery_percent, 0)}%` : "N/A"
                }
              />
            </div>
            <div className="space-y-3">
              <StatusRow
                label="Temperature"
                value={`${temperatureValue}${
                  temperatureValue !== "N/A" ? " °C" : ""
                }`}
              />
              <StatusRow label="Location" value={locationLabel} />
              <StatusRow
                label="Signal Status"
                value={connected ? "Active" : "Disconnected"}
              />
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon,
  color = "slate",
}: {
  label: string;
  value: string;
  unit: string;
  icon?: string;
  color?: string;
}) {
  const colorClasses = {
    slate: "from-slate-800 to-slate-900 border-slate-700",
    cyan: "from-cyan-900/30 to-slate-900 border-cyan-700/50",
    orange: "from-orange-900/30 to-slate-900 border-orange-700/50",
    blue: "from-blue-900/30 to-slate-900 border-blue-700/50",
    green: "from-green-900/30 to-slate-900 border-green-700/50",
    purple: "from-purple-900/30 to-slate-900 border-purple-700/50",
  };

  return (
    <div
      className={`bg-gradient-to-br ${
        colorClasses[color as keyof typeof colorClasses]
      } backdrop-blur-sm border rounded-xl p-6 text-center shadow-xl hover:scale-105 transition-transform`}
    >
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {label}
      </h3>
      <p className="text-4xl font-bold text-white mb-1">{value}</p>
      {unit && <p className="text-sm text-slate-400">{unit}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-500" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function SensorDisplay({
  x,
  y,
  z,
}: {
  x: number | null | undefined;
  y: number | null | undefined;
  z: number | null | undefined;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
        <span className="text-sm text-slate-400">X-Axis</span>
        <span className="text-lg font-bold text-red-400">
          {formatNumber(x)}
        </span>
      </div>
      <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
        <span className="text-sm text-slate-400">Y-Axis</span>
        <span className="text-lg font-bold text-green-400">
          {formatNumber(y)}
        </span>
      </div>
      <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
        <span className="text-sm text-slate-400">Z-Axis</span>
        <span className="text-lg font-bold text-blue-400">
          {formatNumber(z)}
        </span>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg border border-slate-800">
      <span className="text-sm text-slate-400 font-medium">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
