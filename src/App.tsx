"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import AuthForm from "@/components/AuthForm";

type Telemetry = {
  device_id: string;
  device_ts: number | string;
  heading_deg: number;

  temp: number | null;
  // sometimes GNSS payload might use "temperature"
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

  // GNSS / env extras
  lat?: number | null;
  lon?: number | null;
  speed?: number | null; // km/h in our case
  altitude?: number | null; // meters
  pressure?: number | null; // hPa
  direction?: number | null; // degrees

  created_at: string | number;
  received_at: string | number;
};

// Next replaces this at build time; safe to use in client code
const WS_URL = (process.env.NEXT_PUBLIC_WS_URL as string) || "";
const MAX_HISTORY = 25;

function getSecureWebSocketUrl(url: string): string {
  if (!url) return url;

  // If the page is served over HTTPS, upgrade ws:// to wss://
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return url.replace(/^ws:/, "wss:");
  }

  return url;
}

// Safely format epoch seconds or fallback to raw string
function formatTimestamp(ts: number | string): string {
  if (typeof ts === "number" && Number.isFinite(ts)) {
    // assume epoch seconds
    return new Date(ts * 1000).toLocaleString();
  }

  if (typeof ts === "string") {
    const trimmed = ts.trim();

    // if it's all digits, treat as epoch seconds
    if (/^\d+$/.test(trimmed)) {
      const num = Number.parseInt(trimmed, 10);
      if (Number.isFinite(num)) {
        return new Date(num * 1000).toLocaleString();
      }
    }

    // otherwise assume it's already a human-readable timestamp
    return trimmed;
  }

  return "N/A";
}

// Safely format numbers with .toFixed, avoid crashing on null/undefined/non-number
function formatNumber(value: unknown, digits = 2): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(digits);
  }
  return "N/A";
}

export default function Page() {
  // 🔐 auth state
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // websocket + telemetry state (live)
  const [connected, setConnected] = useState(false);
  const [last, setLast] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // theme state
  const { theme: themeValue, setTheme, resolvedTheme } = useTheme();
  const currentTheme = (resolvedTheme ?? themeValue) as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔐 check authToken on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("authToken");
    if (stored) {
      setToken(stored);
    }
    setAuthChecked(true);
  }, []);

  const envMissing = !WS_URL || WS_URL.trim().length === 0;
  const secureWsUrl = useMemo(() => getSecureWebSocketUrl(WS_URL), []);

  // 🛰 WebSocket connection (only when logged in)
  useEffect(() => {
    if (envMissing || !token) return;

    console.log("WS_URL from env:", WS_URL);
    console.log("secureWsUrl used by client:", secureWsUrl);

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
        console.log("WS raw frame:", e.data);
        const raw = JSON.parse(e.data);

        // bridge sends: { type: "telemetry", topic, device_id, payload, received_at }
        const payload =
          raw && raw.type === "telemetry" && raw.payload ? raw.payload : raw;

        const msg: Telemetry = {
          // required
          device_id: payload.device_id,
          device_ts: payload.device_ts ?? payload.timestamp ?? 0,
          heading_deg: payload.heading_deg ?? payload.heading ?? 0,

          // core metrics
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

          // GNSS / env
          lat: payload.lat ?? payload.latitude ?? null,
          lon: payload.lon ?? payload.longitude ?? null,
          // NOTE: payload uses speed_kmh / altitude_m / pressure_hpa / direction_deg
          speed: payload.speed_kmh ?? payload.speed ?? null,
          altitude: payload.altitude_m ?? payload.altitude ?? null,
          pressure: payload.pressure_hpa ?? payload.pressure ?? null,
          direction: payload.direction_deg ?? payload.direction ?? null,

          created_at: payload.created_at ?? raw.created_at ?? "",
          received_at: raw.received_at ?? payload.received_at ?? "",
        };

        if (
          typeof msg.device_id === "string" &&
          !Number.isNaN(msg.heading_deg)
        ) {
          setLast(msg);
          setHistory((prev) => {
            const next = [msg, ...prev];
            if (next.length > MAX_HISTORY) next.pop();
            return next;
          });
        } else {
          console.warn("WS frame missing device_id or heading:", raw);
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

  // Logout helper: clear token and close websocket
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
    // keep authChecked true so UI shows login screen
    setAuthChecked(true);
  }

  const deviceTimestamp = last ? formatTimestamp(last.device_ts) : "N/A";
  const lastReceived = last ? formatTimestamp(last.received_at) : "N/A";

  // Speed is already km/h from speed_kmh
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

  // 🔐 auth gate — don’t render anything until we know if there’s a token
  if (!authChecked) {
    return null;
  }

  if (!token) {
    // no token yet → show login/signup
    return <AuthForm onAuth={setToken} />;
  }

  // ✅ logged in → show live dashboard
  return (
    <div className="min-h-screen bg-[#0f1729] text-white">
      <header className="border-b border-slate-700/30 bg-[#1a2438]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              GPS Tracker Dashboard (Live)
            </h1>
            <div className="flex flex-wrap gap-3 items-center">
              <select className="rounded-lg bg-[#2a3e5a] px-4 py-2 text-sm text-white border border-slate-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>{last?.device_id || "No devices available"}</option>
              </select>

              <button
                className="rounded-lg bg-[#2a3e5a] px-4 py-2 text-sm text-white border border-slate-600/30 hover:bg-[#344b68] transition-colors"
                onClick={() => {
                  setLast(null);
                  setHistory([]);
                }}
              >
                Reset dashboard
              </button>

              <a
                href="/history"
                className="rounded-lg bg-[#2a3e5a] px-4 py-2 text-sm text-white border border-slate-600/30 hover:bg-[#344b68] transition-colors"
              >
                View history
              </a>

              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white border border-red-700/30 hover:bg-red-700 transition-colors"
                onClick={handleLogout}
              >
                Logout
              </button>

              <button className="rounded-lg bg-[#2a3e5a] px-4 py-2 text-sm text-white border border-slate-600/30 hover:bg-[#344b68] transition-colors">
                °C / km/h
              </button>

              <button
                className="rounded-lg px-4 py-2 text-sm border border-slate-600/30 hover:opacity-90 transition-colors flex items-center gap-2"
                onClick={() =>
                  mounted &&
                  setTheme(currentTheme === "dark" ? "light" : "dark")
                }
                aria-pressed={mounted ? (currentTheme === "dark") : undefined}
              >
                {mounted ? (
                  <>
                    <span className="text-yellow-400">
                      {currentTheme === "dark" ? "🌙" : "☀️"}
                    </span>
                    {currentTheme === "dark" ? "Dark" : "Light"}
                  </>
                ) : (
                  <span className="text-sm">Theme</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-3 bg-[#0f1729]">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span
            className={`text-sm ${
              connected ? "text-green-400" : "text-red-400"
            }`}
          >
            {connected ? "Live updates: connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {envMissing && (
        <div className="px-6 py-4">
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
            <p className="text-sm text-red-200">
              Missing env: set{" "}
              <span className="font-mono font-semibold">
                NEXT_PUBLIC_WS_URL
              </span>
            </p>
          </div>
        </div>
      )}

      <main className="p-6 space-y-6">
        {/* Top metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="DEVICE ID" value={last?.device_id || "N/A"} unit="" />
          <MetricCard label="DEVICE TIMESTAMP" value={deviceTimestamp} unit="" />
          <MetricCard
            label="HEADING"
            value={last ? formatNumber(last.heading_deg, 1) : "N/A"}
            unit="°"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="TEMPERATURE" value={temperatureValue} unit="°C" />
          <MetricCard
            label="BATTERY"
            value={last ? formatNumber(last.battery_percent, 0) : "N/A"}
            unit="%"
          />
          <MetricCard label="LAST RECEIVED" value={lastReceived} unit="" />
        </div>

        {/* Map + Compass (first block) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                GNSS Map & Satellite Sky Plot
              </h2>
              <select className="rounded-lg bg-[#2a3e5a] px-4 py-2 text-sm text-white border border-slate-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Time</option>
                <option>Last Hour</option>
                <option>Last 24 Hours</option>
              </select>
            </div>
            <div className="aspect-[4/3] bg-[#0f1729] rounded-lg border border-slate-700/30 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center relative">
                <div className="absolute top-4 left-4 bg-[#1e2d44] rounded-full w-10 h-10 flex items-center justify-center border-2 border-white text-sm font-bold">
                  N
                </div>
                <p className="text-slate-500">
                  Map View (Integration Required)
                </p>
              </div>
            </div>
          </div>

          {/* Compass Section (SVG) */}
          <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Compass & Satellite Data Feed
            </h2>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-0.5 w-8 bg-red-500" />
                <span className="text-sm text-white">Heading</span>
              </div>

              <div className="relative w-full max-w-md aspect-square bg-[#1a2438] rounded-lg border border-slate-700/30 p-8">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2a3e5a" strokeWidth="0.2" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#2a3e5a" strokeWidth="0.2" />
                  <circle cx="50" cy="50" r="20" fill="none" stroke="#2a3e5a" strokeWidth="0.2" />
                  <circle cx="50" cy="50" r="10" fill="none" stroke="#2a3e5a" strokeWidth="0.2" />

                  <line x1="50" y1="10" x2="50" y2="90" stroke="#2a3e5a" strokeWidth="0.2" />
                  <line x1="10" y1="50" x2="90" y2="50" stroke="#2a3e5a" strokeWidth="0.2" />
                  <line x1="20" y1="20" x2="80" y2="80" stroke="#2a3e5a" strokeWidth="0.2" />
                  <line x1="80" y1="20" x2="20" y2="80" stroke="#2a3e5a" strokeWidth="0.2" />
                </svg>

                <div className="absolute left-1/2 top-4 -translate-x-1/2 text-xs font-bold text-yellow-400">
                  N (0°)
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-yellow-400">
                  E (90°)
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-400">
                  S (180°)
                </div>
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-bold text-yellow-400">
                  W (270°)
                </div>

                <div className="absolute left-[18%] top-[18%] text-[10px] font-semibold text-yellow-400">
                  NW (315°)
                </div>
                <div className="absolute right-[18%] top-[18%] text-[10px] font-semibold text-yellow-400">
                  NE (45°)
                </div>
                <div className="absolute right-[18%] bottom-[18%] text-[10px] font-semibold text-yellow-400">
                  SE (135°)
                </div>
                <div className="absolute left-[18%] bottom-[18%] text-[10px] font-semibold text-yellow-400">
                  SW (225°)
                </div>

                <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 z-10" />

                <div
                  className="absolute left-1/2 top-1/2 origin-bottom"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${
                      last?.heading_deg ?? 0
                    }deg)`,
                  }}
                >
                  <div className="h-16 w-0.5 bg-red-500 -translate-y-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GNSS / env metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="LOCATION" value={locationLabel} unit="" />
          <MetricCard
            label="SPEED"
            value={speedKmh != null ? formatNumber(speedKmh, 1) : "N/A"}
            unit="km/h"
          />
          <MetricCard label="DIRECTION" value={directionDeg} unit="°" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="TEMPERATURE (GNSS)" value={temperatureValue} unit="°C" />
          <MetricCard
            label="ALTITUDE"
            value={last ? formatNumber(last.altitude, 1) : "N/A"}
            unit="m"
          />
          <MetricCard
            label="PRESSURE"
            value={last ? formatNumber(last.pressure, 1) : "N/A"}
            unit="hPa"
          />
        </div>

        {/* Accelerometer & Gyroscope */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accelerometer */}
          <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Accelerometer (X, Y, Z)
            </h2>
            <div className="h-64 bg-[#1a2438] rounded-lg border border-slate-700/30 flex items-center justify-center relative">
              <div className="absolute top-4 right-4 flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 bg-red-500 rounded border-2 border-red-500" />
                  <span className="text-white">X (g)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 bg-green-500 rounded border-2 border-green-500" />
                  <span className="text-white">Y (g)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 bg-blue-500 rounded border-2 border-blue-500" />
                  <span className="text-white">Z (g)</span>
                </div>
              </div>
              {last ? (
                <div className="text-center">
                  <div className="text-red-400">
                    X: {formatNumber(last.accel_x)}
                  </div>
                  <div className="text-green-400">
                    Y: {formatNumber(last.accel_y)}
                  </div>
                  <div className="text-blue-400">
                    Z: {formatNumber(last.accel_z)}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No data</p>
              )}
            </div>
          </div>

          {/* Gyroscope */}
          <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Gyroscope (X, Y, Z)
            </h2>
            <div className="h-64 bg-[#1a2438] rounded-lg border border-slate-700/30 flex items-center justify-center relative">
              <div className="absolute top-4 right-4 flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 bg-red-500 rounded border-2 border-red-500" />
                  <span className="text-white">X (dps)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 bg-green-500 rounded border-2 border-green-500" />
                  <span className="text-white">Y (dps)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 bg-blue-500 rounded border-2 border-blue-500" />
                  <span className="text-white">Z (dps)</span>
                </div>
              </div>
              {last ? (
                <div className="text-center">
                  <div className="text-red-400">
                    X: {formatNumber(last.gyro_x)}
                  </div>
                  <div className="text-green-400">
                    Y: {formatNumber(last.gyro_y)}
                  </div>
                  <div className="text-blue-400">
                    Z: {formatNumber(last.gyro_z)}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No data</p>
              )}
            </div>
          </div>
        </div>

        {/* GNSS + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
            <h2 className="text-lg font-bold text-white mb-4">GNSS Details</h2>
            <div className="h-48 bg-[#1a2438] rounded-lg border border-slate-700/30 flex items-center justify-center">
              <p className="text-slate-500">No GNSS detail view implemented yet</p>
            </div>
          </div>

          <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Device Status</h2>
            <div className="space-y-3">
              <StatusRow label="System Uptime (s)" value="N/A" />
              <StatusRow label="Health Uptime (s)" value="N/A" />
              <StatusRow label="System Uptime (human)" value="N/A" />
              <StatusRow label="Last GNSS Fix" value={lastReceived} />
              <StatusRow label="Signal Strength" value="N/A" />
              <StatusRow label="CPU Temp (°C)" value="N/A" />
            </div>
          </div>
        </div>

        {/* Cellular */}
        <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Cellular Details</h2>
          <div className="h-32 bg-[#1a2438] rounded-lg border border-slate-700/30 flex items-center justify-center">
            <p className="text-slate-500">No cellular data available</p>
          </div>
        </div>

        {/* IMU trajectory + SNR placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              IMU Trajectory Estimate (3D Position from Accel)
            </h2>
            <div className="h-64 bg-[#1a2438] rounded-lg border border-slate-700/30 flex items-center justify-center relative">
              <div className="absolute top-4 right-4 flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 bg-blue-500 rounded border-2 border-blue-500" />
                  <span className="text-white">Trajectory (XY)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 bg-purple-500 rounded border-2 border-purple-500" />
                  <span className="text-white">Trajectory (Z)</span>
                </div>
              </div>
              <p className="text-slate-500">Chart visualization</p>
            </div>
          </div>

          <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Satellite Signal Strength (SNR by PRN)
            </h2>
            <div className="h-64 bg-[#1a2438] rounded-lg border border-slate-700/30 flex items-center justify-center relative">
              <div className="absolute top-4 right-4 flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-6 bg-cyan-400 rounded border-2 border-cyan-400" />
                  <span className="text-white">SNR (dB)</span>
                </div>
              </div>
              <p className="text-slate-500">Chart visualization</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6 text-center">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {label}
      </h3>
      <p className="text-4xl font-bold text-white mb-1">{value}</p>
      {unit && <p className="text-sm text-slate-400">{unit}</p>}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
      <span className="text-sm text-white font-medium">{label}</span>
      <span className="text-sm text-slate-400">{value}</span>
    </div>
  );
}
