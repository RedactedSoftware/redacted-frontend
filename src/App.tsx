"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AuthForm from "@/components/AuthForm";
import { DeviceRegisterForm } from "@/components/DeviceRegisterForm";
import { MyDevicesList } from "@/components/MyDevicesList";
import Header from "@/components/Header";
import LegacyMetricCard from "@/components/MetricCard";
import DeviceStatusPanel from "@/components/DeviceStatus";
import MapSection from "@/components/MapSection";
import CompassChart from "@/components/CompassChart";
import AccelerometerChart from "@/components/AccelerometerChart";
import GyroscopeChart from "@/components/GyroscopeChart";
import SatelliteChart from "@/components/SatelliteChart";
import IMUChart from "@/components/IMUChart";
import "./App.css";

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

  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n.toFixed(digits);
    }
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
  const [darkMode, setDarkMode] = useState(true);
  const [metricUnit, setMetricUnit] = useState<"metric" | "imperial">("metric");
  const [selectedDevice, setSelectedDevice] = useState<string | "">("");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [resetPaused, setResetPaused] = useState(false);
  const lastWSUpdateRef = useRef<number>(0); // track last WebSocket update time

  // read token from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("authToken");
    if (stored) setToken(stored);
    setAuthChecked(true);
  }, []);

  // theme toggle: keep colors in sync with CSS variables
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const envMissing = !WS_URL || WS_URL.trim().length === 0;
  const secureWsUrl = useMemo(() => getSecureWebSocketUrl(WS_URL), []);

  // periodic refresh from REST API - DISABLED when WebSocket is active
  // The WebSocket provides real-time data, so REST polling would just overwrite with stale data
  // Only use REST API if WebSocket never connects (fallback for connectivity issues)
  useEffect(() => {
    if (!token || resetPaused || connected) return; // skip if connected to WebSocket or not logged in

    let cancelled = false;

    const tick = async () => {
      if (cancelled || connected) return; // re-check connection status
      
      const latest = await fetchLatestTelemetry();
      if (!latest || cancelled) return;

      console.log("REST API fallback poll updating with:", latest);
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
  }, [token, refreshSeconds, resetPaused, connected]);

  // WebSocket hookup (still used for real-time streaming)
  useEffect(() => {
    if (envMissing || !token || resetPaused) return;

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
        console.log("WS raw message:", e.data);
        const raw = JSON.parse(e.data);
        console.log("WS parsed:", raw);
        const payload =
          raw && raw.type === "telemetry" && raw.payload ? raw.payload : raw;
        console.log("WS payload:", payload);

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

        console.log("Final msg object:", msg);
        console.log("device_id type:", typeof msg.device_id, "value:", msg.device_id);
        console.log("heading_deg:", msg.heading_deg, "isNaN:", Number.isNaN(msg.heading_deg));
        
        if (typeof msg.device_id === "string" && !Number.isNaN(msg.heading_deg)) {
          console.log("✓ Validation passed, updating state from WebSocket");
          lastWSUpdateRef.current = Date.now(); // Mark that we got WS data
          setLast(msg);
          setHistory((prev) => {
            const next = [msg, ...prev];
            if (next.length > MAX_HISTORY) next.pop();
            return next;
          });
        } else {
          console.log("✗ Validation failed");
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

  function handleReset() {
    setLast(null);
    setHistory([]);
  }
 

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

  // Render logging
  console.log("🔄 Page component rendering, last state:", last);

  // derived UI values
  const deviceTimestamp = last ? formatTimestamp(last.device_ts) : "N/A";
  const lastReceived = last ? formatTimestamp(last.received_at) : "N/A";
  const speedKmh =
    last && typeof last.speed === "number" && Number.isFinite(last.speed)
      ? last.speed
      : null;

  const temperatureC =
    last && (last.temp != null || last.temperature != null)
      ? Number(formatNumber(last.temp ?? last.temperature, 1))
      : null;

  const locationLabel =
    last && last.lat != null && last.lon != null
      ? `${formatNumber(last.lat, 4)}, ${formatNumber(last.lon, 4)}`
      : "N/A";

  const directionDegValue =
    last && (last.direction != null || last.heading_deg != null)
      ? Number(formatNumber(last.direction ?? last.heading_deg, 0))
      : null;

  const directionDisplay =
    directionDegValue != null && Number.isFinite(directionDegValue)
      ? `${directionDegValue.toFixed(0)}`
      : "N/A";

  const metricSpeedDisplay =
    speedKmh != null ? formatNumber(speedKmh, 1) : "N/A";
  const imperialSpeedDisplay =
    speedKmh != null ? formatNumber(speedKmh * 0.621371, 1) : "N/A";

  const metricTempDisplay =
    temperatureC != null && Number.isFinite(temperatureC)
      ? temperatureC.toFixed(1)
      : "N/A";
  const imperialTempDisplay =
    temperatureC != null && Number.isFinite(temperatureC)
      ? ((temperatureC * 9) / 5 + 32).toFixed(1)
      : "N/A";

  const temperatureDisplay =
    metricUnit === "metric" ? metricTempDisplay : imperialTempDisplay;

  const speedDisplay =
    metricUnit === "metric" ? metricSpeedDisplay : imperialSpeedDisplay;

  const altitudeDisplay = last ? formatNumber(last.altitude, 1) : "N/A";
  const pressureDisplay = last ? formatNumber(last.pressure, 1) : "N/A";

  // simple device list for header dropdown – keeps "My Devices" logic unchanged
  const headerDevices =
    last?.device_id != null
      ? [{ id: last.device_id, name: last.device_id }]
      : [];

  const currentHeading =
    last && !Number.isNaN(last.heading_deg) ? last.heading_deg : 0;

  // chart-friendly history for accelerometer & gyroscope
  const accelChartData = history.map((row, idx) => ({
    time: idx.toString(),
    x: row.accel_x,
    y: row.accel_y,
    z: row.accel_z,
  }));

  const gyroChartData = history.map((row, idx) => ({
    time: idx.toString(),
    x: row.gyro_x,
    y: row.gyro_y,
    z: row.gyro_z,
  }));

  const locationForMap =
    last && last.lat != null && last.lon != null
      ? { latitude: last.lat, longitude: last.lon }
      : null;

  const deviceStatusData = {
    systemUptime: null,
    healthUptime: null,
    lastGnssFix: deviceTimestamp,
    signalStrength: connected ? "Active" : "Disconnected",
    cpuTemp: null,
  };

  return (
    <div className={`app ${darkMode ? "" : "light"}`}>
      <Header
        devices={headerDevices}
        selectedDevice={selectedDevice}
        onDeviceChange={(id: string) => setSelectedDevice(id)}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode((prev) => !prev)}
        metricUnit={metricUnit}
        onMetricToggle={() =>
          setMetricUnit((prev) => (prev === "metric" ? "imperial" : "metric"))
        }
        onReset={handleReset}
        onLogout={handleLogout}
        connected={connected}
      />

      <div className="dashboard">
        {/* Devices: Registration + My Devices */}
        <section className="full-width">
          <div className="card">
            <h2 className="section-title">Devices</h2>
            <div className="two-column-grid">
              <DeviceRegisterForm token={token} />
              <MyDevicesList token={token} />
            </div>
          </div>
        </section>

        {/* Key metrics row */}
        <section className="metrics-grid">
          <LegacyMetricCard
            title="Location"
            value={locationLabel}
            label="Last known coordinates"
          />
          <LegacyMetricCard
            title="Speed"
            value={speedDisplay}
            label={metricUnit === "metric" ? "km/h" : "mph"}
          />
          <LegacyMetricCard
            title="Direction (°)"
            value={directionDisplay}
            label="Heading"
          />
          <LegacyMetricCard
            title="Temperature"
            value={temperatureDisplay}
            label={metricUnit === "metric" ? "°C" : "°F"}
          />
          <LegacyMetricCard
            title="Altitude"
            value={altitudeDisplay}
            label="m"
          />
          <LegacyMetricCard
            title="Pressure"
            value={pressureDisplay}
            label="hPa"
          />
        </section>

        {/* GNSS details + device status */}
        <section className="two-column-grid">
          <div className="card">
            <h2 className="card-title">GNSS Details</h2>
            <div className="empty-state">
              {locationLabel === "N/A"
                ? "Waiting for GNSS data…"
                : `Tracking device at ${locationLabel}`}
            </div>
          </div>

          <DeviceStatusPanel data={deviceStatusData} />
        </section>

        {/* Map + compass / heading */}
        <section className="two-column-grid">
          <MapSection
            location={locationForMap ?? undefined}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
          />
          <CompassChart heading={currentHeading} />
        </section>

        {/* IMU + satellite signal */}
        <section className="two-column-grid">
          <IMUChart data={[]} />
          <SatelliteChart data={[]} />
        </section>

        {/* Motion sensor charts */}
        <section className="two-column-grid">
          <AccelerometerChart chartData={accelChartData} />
          <GyroscopeChart chartData={gyroChartData} />
        </section>

        {/* Connection + timestamps summary */}
        <section className="full-width">
          <div className="card">
            <h2 className="card-title">Connection & Telemetry Summary</h2>
            <div className="status-list">
              <div className="status-item">
                <span className="status-label">WebSocket Status</span>
                <span className="status-value">
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Device Timestamp</span>
                <span className="status-value">{deviceTimestamp}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Last Received</span>
                <span className="status-value">{lastReceived}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Battery Level</span>
                <span className="status-value">
                  {last ? `${formatNumber(last.battery_percent, 0)}%` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}