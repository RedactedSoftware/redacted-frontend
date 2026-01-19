"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AuthForm from "./components/AuthForm";
import { DeviceRegisterForm } from "./components/DeviceRegisterForm";
import { MyDevicesList } from "./components/MyDevicesList";
import Header from "./components/Header";
import LegacyMetricCard from "./components/MetricCard.jsx";
import ProgressRing from "./components/ProgressRing";
import CompassChart from "./components/CompassChart";
import MagnetometerCompass from "./components/MagnetometerCompass";
import AccelerometerChart from "./components/AccelerometerChart";
import GyroscopeChart from "./components/GyroscopeChart";
import SatelliteChart from "./components/SatelliteChart";
import IMUChart from "./components/IMUChart";
import "./App.css";

type Telemetry = {
  device_id: string;
  device_ts: number | string;
  heading_deg: number;
  temp_c: number | null;
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

type TrainingLiveResponse = {
  device_id: string;
  window_s: number;
  sample_count: number;
  orientation: null | {
    pitch_deg: number | null;
    roll_deg: number | null;
    yaw_deg: number | null;
  };
  movement: null | {
    stability_score: number;
    micro_move_rate: number;
    gyro_mean?: number;
    gyro_std?: number;
    drift_deg?: number;
    drift_deg_per_s?: number;
    drift_dir: "left" | "right" | "center" | "unknown";
  };
  note?: string;
};

import { API_BASE, WS_BASE } from "./api/constants";

const WS_URL = WS_BASE;
const MAX_HISTORY = 25;

// Log env on startup
if (typeof window !== "undefined") {
  console.log("🔌 Env Check: NEXT_PUBLIC_WS_URL:", WS_URL);
  console.log("📡 Env Check: NEXT_PUBLIC_API_URL:", API_BASE);
}

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
  return "--";
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

  return "--";
}

function fmtDeg(v: number | null | undefined) {
  return typeof v === "number" && Number.isFinite(v) ? `${v.toFixed(2)}°` : "N/A";
}

function fmtNum(v: number | null | undefined, digits = 2) {
  return typeof v === "number" && Number.isFinite(v) ? v.toFixed(digits) : "N/A";
}

function getOrientationVariant(value: number | null | undefined): "good" | "warning" | "bad" | "default" {
  if (value === null || value === undefined) return "default";
  const abs = Math.abs(value);
  if (abs <= 5) return "good";
  if (abs <= 15) return "warning";
  return "bad";
}

function getStabilityVariant(value: number | null | undefined): "good" | "warning" | "bad" | "default" {
  if (value === null || value === undefined) return "default";
  if (value >= 80) return "good";
  if (value >= 50) return "warning";
  return "bad";
}

function getMicroMoveVariant(value: number | null | undefined): "good" | "warning" | "bad" | "default" {
  if (value === null || value === undefined) return "default";
  if (value <= 2) return "good";
  if (value <= 5) return "warning";
  return "bad";
}

function hasEnoughSamples(sampleCount: number | undefined): boolean {
  return typeof sampleCount === "number" && sampleCount >= 10;
}

function getCalibrationState(
  sampleCount: number | undefined,
  calibrationStartAt: number | null,
  locked: boolean,
  MIN_SAMPLES: number,
  CALIBRATION_TIMEOUT_MS: number
): {
  isCalibrating: boolean;
  isTimeoutFallback: boolean;
  calibrationPercent: number;
} {
  const samples = sampleCount ?? 0;
  const isCalibrating = !locked && samples < MIN_SAMPLES;
  
  if (!isCalibrating) {
    return { isCalibrating: false, isTimeoutFallback: false, calibrationPercent: 100 };
  }

  const elapsed = calibrationStartAt ? Date.now() - calibrationStartAt : 0;
  const isTimeoutFallback = elapsed >= CALIBRATION_TIMEOUT_MS;
  const calibrationPercent = Math.min(100, Math.round((samples / MIN_SAMPLES) * 100));

  return { isCalibrating, isTimeoutFallback, calibrationPercent };
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
  const [resetPaused, setResetPaused] = useState(false);
  const lastWSUpdateRef = useRef<number>(0); // track last WebSocket update time

  // Training live stats from WebSocket
  const [trainingStats, setTrainingStats] = useState<TrainingLiveResponse | null>(null);
  const [lastGoodTrainingStats, setLastGoodTrainingStats] = useState<TrainingLiveResponse | null>(null);
  const [trainingErr, setTrainingErr] = useState<string | null>(null);

  // Calibration state for tactical HUD
  const calibrationStartAtRef = useRef<number | null>(null);
  const lastDeviceIdRef = useRef<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [recentlyLocked, setRecentlyLocked] = useState(false);

  const MIN_SAMPLES = 6;
  const CALIBRATION_TIMEOUT_MS = 12000;

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

  const resolvedDeviceId = useMemo(() => {
    if (selectedDevice && selectedDevice.trim() !== "") {
      return selectedDevice;
    }
    if (last?.device_id) {
      return last.device_id;
    }
    return "";
  }, [selectedDevice, last?.device_id]);

  const envMissing = !WS_URL || WS_URL.trim().length === 0;
  const secureWsUrl = useMemo(() => getSecureWebSocketUrl(WS_URL), []);

  // WebSocket hookup (real-time streaming)
  useEffect(() => {
    if (envMissing || !token || resetPaused) return;

    console.log('🔌 WebSocket: Attempting to connect to:', secureWsUrl);
    console.log('🔌 WebSocket: Token present:', !!token);
    console.log('🔌 WebSocket: envMissing:', envMissing);

    const ws = new WebSocket(secureWsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WS connected successfully");
      setConnected(true);
    };
    ws.onerror = (err) => {
      console.error("❌ WS error event:", err);
      console.error("🔌 WebSocket readyState:", ws.readyState);
      console.error("🔌 WebSocket URL was:", secureWsUrl);
      setConnected(false);
    };
    ws.onclose = (event) => {
      console.log("❌ WS closed");
      console.log("🔌 WebSocket close code:", event.code);
      console.log("🔌 WebSocket close reason:", event.reason);
      setConnected(false);
    };

    ws.onmessage = (e) => {
      try {
        console.log("WS raw message:", e.data);
        const raw = JSON.parse(e.data);
        console.log("WS parsed:", raw);
        
        // ✅ Handle computed training stats pushed over WS
        if (raw && raw.type === "training_live") {
          // Accept training stats (device filtering will happen when user selects device)
          console.log("📊 Training stats from WS:", raw, "device_id:", raw.device_id, "sample_count:", raw.sample_count, "orientation:", raw.orientation, "movement:", raw.movement);
          
          // ✅ Handle calibration state
          const trainingData = raw as TrainingLiveResponse;
          
          // Reset calibration if device changed
          if (lastDeviceIdRef.current !== trainingData.device_id) {
            lastDeviceIdRef.current = trainingData.device_id;
            calibrationStartAtRef.current = null;
            setLocked(false);
            setRecentlyLocked(false);
          }
          
          // Start calibration timer on first message
          if (!calibrationStartAtRef.current && trainingData.sample_count < MIN_SAMPLES) {
            calibrationStartAtRef.current = Date.now();
          }
          
          // Lock when we reach minimum samples
          if (trainingData.sample_count >= MIN_SAMPLES && !locked) {
            setLocked(true);
            setRecentlyLocked(true);
            // Clear the lock badge after 1.5s
            setTimeout(() => setRecentlyLocked(false), 1500);
          }
          
          setTrainingStats(trainingData);
          // Only update lastGoodTrainingStats when sample_count >= MIN_SAMPLES
          if (trainingData.sample_count >= MIN_SAMPLES && trainingData.orientation && trainingData.movement) {
            setLastGoodTrainingStats(trainingData);
          }
          setTrainingErr(null);
          return;
        }

        const payload =
          raw && raw.type === "telemetry" && raw.payload ? raw.payload : raw;
        console.log("WS payload:", payload);

        

        const msg: Telemetry = {
          device_id: payload.device_id,
          device_ts: payload.device_ts ?? payload.timestamp ?? 0,
          heading_deg: payload.heading_deg ?? payload.heading ?? 0,
          temp_c: payload.temp_c ?? payload.temp ?? null,
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

  // Poll training stats from REST API as fallback
  useEffect(() => {
    if (!token || !resolvedDeviceId) return;

    const id = resolvedDeviceId.toLowerCase(); // DB uses lowercase
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(
          `${API_BASE}/api/training/live?device_id=${encodeURIComponent(id)}&window=120`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          if (!cancelled) {
            setTrainingErr(`HTTP ${res.status}: ${text.slice(0, 100)}`);
          }
          return;
        }

        // Read text first to validate content-type before JSON parsing
        const text = await res.text();
        const ct = res.headers.get("content-type") || "";
        
        if (!ct.includes("application/json")) {
          if (!cancelled) {
            setTrainingErr(`Expected JSON but got ${ct}`);
          }
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          if (!cancelled) {
            setTrainingErr(`Invalid JSON response: ${e}`);
          }
          return;
        }

        if (!cancelled) {
          console.log("📊 Training stats from REST poll:", data);
          setTrainingStats(data);
          // Only update lastGoodTrainingStats when sample_count >= MIN_SAMPLES
          if (data?.sample_count >= MIN_SAMPLES && data?.orientation && data?.movement) {
            setLastGoodTrainingStats(data);
          }
          setTrainingErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("training/live fetch failed:", e);
          setTrainingErr("training/live fetch failed");
        }
      }
    }

    tick();
    const t = setInterval(tick, 1000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [token, resolvedDeviceId]);

  function handleReset() {
    // Reset telemetry data
    setLast(null);
    setHistory([]);
    
    // Reset training data and calibration
    setTrainingStats(null);
    setLastGoodTrainingStats(null);
    setTrainingErr(null);
    setLocked(false);
    setRecentlyLocked(false);
    calibrationStartAtRef.current = null;
    lastDeviceIdRef.current = null;
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
    last && (last.temp_c != null || last.temperature != null)
      ? Number(formatNumber(last.temp_c ?? last.temperature, 1))
      : null;

  const locationLabel =
    last && last.lat != null && last.lon != null
      ? `${formatNumber(last.lat, 4)}, ${formatNumber(last.lon, 4)}`
      : "--";

  const directionDegValue =
    last && (last.direction != null || last.heading_deg != null)
      ? Number(formatNumber(last.direction ?? last.heading_deg, 0))
      : null;

  const directionDisplay =
    directionDegValue != null && Number.isFinite(directionDegValue)
      ? `${directionDegValue.toFixed(0)}`
      : "--";

  const metricSpeedDisplay =
    speedKmh != null ? formatNumber(speedKmh, 1) : "--";
  const imperialSpeedDisplay =
    speedKmh != null ? formatNumber(speedKmh * 0.621371, 1) : "--";

  const metricTempDisplay =
    temperatureC != null && Number.isFinite(temperatureC)
      ? temperatureC.toFixed(1)
      : "--";
  const imperialTempDisplay =
    temperatureC != null && Number.isFinite(temperatureC)
      ? ((temperatureC * 9) / 5 + 32).toFixed(1)
      : "--";

  const temperatureDisplay =
    metricUnit === "metric" ? metricTempDisplay : imperialTempDisplay;

  const speedDisplay =
    metricUnit === "metric" ? metricSpeedDisplay : imperialSpeedDisplay;

  const altitudeDisplay = last ? formatNumber(last.altitude, 1) : "--";
  const pressureDisplay = last ? formatNumber(last.pressure, 1) : "--";

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

        {/* Training live stats - fed from WebSocket with tactical HUD calibration */}
        <section className="metrics-grid">
          {(() => {
            // Use trainingStats if good enough, otherwise fall back to lastGoodTrainingStats
            const displayStats = 
              trainingStats && trainingStats.sample_count >= MIN_SAMPLES && 
              trainingStats.orientation && 
              trainingStats.movement
                ? trainingStats 
                : lastGoodTrainingStats;
            
            if (!displayStats) {
              return (
                <>
                  <LegacyMetricCard title="Forward / Backward Tilt" value="—" label="" />
                  <LegacyMetricCard title="Left / Right Tilt" value="—" label="" />
                  <LegacyMetricCard title="Rotational Twist" value="—" label="" />
                  <LegacyMetricCard title="Overall Steadiness" value="—" label="" />
                  <LegacyMetricCard title="Tiny Fidgets" value="—" label="" />
                  <LegacyMetricCard title="Aim Drift Direction" value="—" label="" />
                </>
              );
            }

            const cal = getCalibrationState(
              trainingStats?.sample_count ?? displayStats.sample_count,
              calibrationStartAtRef.current,
              locked,
              MIN_SAMPLES,
              CALIBRATION_TIMEOUT_MS
            );
            const isCalibrating = cal.isCalibrating;
            const isTimeoutFallback = cal.isTimeoutFallback;
            
            console.log("🎯 Training card render:", {
              sample_count: trainingStats?.sample_count ?? displayStats.sample_count,
              locked,
              isCalibrating,
              calibrationPercent: cal.calibrationPercent,
              usingFallback: trainingStats !== displayStats
            });

            return (
              <>
                <LegacyMetricCard
                  title="Forward / Backward Tilt"
                  value={isCalibrating ? "—" : fmtDeg(displayStats.orientation?.pitch_deg)}
                  label={isCalibrating ? "" : "°"}
                  subtitle={isCalibrating ? `CAL ${cal.calibrationPercent}%` : undefined}
                  helperText={isCalibrating ? (isTimeoutFallback ? "Low data rate. Move to stabilize." : "Stabilizing sensors…") : "Keep your arm level. Close to 0° is best."}
                  variant={isCalibrating ? "default" : getOrientationVariant(displayStats.orientation?.pitch_deg)}
                  rightSlot={<ProgressRing progress={cal.calibrationPercent / 100} visible={true} />}
                />
                <LegacyMetricCard
                  title="Left / Right Tilt"
                  value={isCalibrating ? "—" : fmtDeg(displayStats.orientation?.roll_deg)}
                  label={isCalibrating ? "" : "°"}
                  subtitle={isCalibrating ? `CAL ${cal.calibrationPercent}%` : undefined}
                  helperText={isCalibrating ? (isTimeoutFallback ? "Low data rate. Move to stabilize." : "Stabilizing sensors…") : "No sideways wrist rotation. Stay level."}
                  variant={isCalibrating ? "default" : getOrientationVariant(displayStats.orientation?.roll_deg)}
                  rightSlot={<ProgressRing progress={cal.calibrationPercent / 100} visible={true} />}
                />
                <LegacyMetricCard
                  title="Rotational Twist"
                  value={isCalibrating ? "—" : fmtDeg(displayStats.orientation?.yaw_deg)}
                  label={isCalibrating ? "" : "°"}
                  subtitle={isCalibrating ? `CAL ${cal.calibrationPercent}%` : undefined}
                  helperText={isCalibrating ? (isTimeoutFallback ? "Low data rate. Move to stabilize." : "Stabilizing sensors…") : "Lock your aim direction. Stop twisting."}
                  variant={isCalibrating ? "default" : getOrientationVariant(displayStats.orientation?.yaw_deg)}
                  rightSlot={<ProgressRing progress={cal.calibrationPercent / 100} visible={true} />}
                />
                <LegacyMetricCard
                  title="Overall Steadiness"
                  value={isCalibrating ? "—" : (recentlyLocked ? `${fmtNum(displayStats.movement?.stability_score)} ✓` : fmtNum(displayStats.movement?.stability_score))}
                  label={isCalibrating ? "" : "/ 100"}
                  subtitle={isCalibrating ? `CAL ${cal.calibrationPercent}%` : (recentlyLocked ? "LOCKED" : undefined)}
                  helperText={isCalibrating ? (isTimeoutFallback ? "Low sample rate. Send more telemetry." : "Hold steady. Locking on.") : "Higher is better. Aim for 80+. Relax and breathe."}
                  variant={isCalibrating ? "default" : (recentlyLocked ? "good" : getStabilityVariant(displayStats.movement?.stability_score))}
                  rightSlot={<ProgressRing progress={cal.calibrationPercent / 100} visible={true} />}
                />
                <LegacyMetricCard
                  title="Tiny Fidgets"
                  value={isCalibrating ? "—" : (recentlyLocked ? `${fmtNum(displayStats.movement?.micro_move_rate)} ✓` : fmtNum(displayStats.movement?.micro_move_rate))}
                  label={isCalibrating ? "" : "/ sec"}
                  subtitle={isCalibrating ? `CAL ${cal.calibrationPercent}%` : (recentlyLocked ? "LOCKED" : undefined)}
                  helperText={isCalibrating ? (isTimeoutFallback ? "Low sample rate. Send more telemetry." : "Hold steady. Locking on.") : "Lower is better. Still your hands and focus."}
                  variant={isCalibrating ? "default" : (recentlyLocked ? "good" : getMicroMoveVariant(displayStats.movement?.micro_move_rate))}
                  rightSlot={<ProgressRing progress={cal.calibrationPercent / 100} visible={true} />}
                />
                <LegacyMetricCard
                  title="Aim Drift Direction"
                  value={isCalibrating ? (isTimeoutFallback ? "LOW DATA" : "Calibrating…") : (displayStats.movement?.drift_dir === "left" ? "Drifting Left" : displayStats.movement?.drift_dir === "right" ? "Drifting Right" : displayStats.movement?.drift_dir === "center" ? "Centered ✓" : "—")}
                  label=""
                  subtitle={isCalibrating ? `CAL ${cal.calibrationPercent}%` : (recentlyLocked ? "LOCKED" : undefined)}
                  helperText={isCalibrating ? (isTimeoutFallback ? "Low sample rate. Send more telemetry." : "Hold steady. Locking on.") : (displayStats.movement?.drift_dir === "center" ? "Perfect! Your grip is balanced." : displayStats.movement?.drift_dir ? "Adjust your hand position to compensate." : "Analyzing your grip...")}
                  variant={isCalibrating ? "default" : (recentlyLocked ? "good" : (displayStats.movement?.drift_dir === "center" ? "good" : (displayStats.movement?.drift_dir ? "warning" : "default")))}
                  rightSlot={<ProgressRing progress={cal.calibrationPercent / 100} visible={true} />}
                />
              </>
            );
          })()}
        </section>

        {/* IMU + satellite signal */}
        <section className="two-column-grid">
          <IMUChart data={[]} />
          <SatelliteChart data={[]} />
        </section>

        {/* Magnetometer Compass */}
        <section className="full-width">
          <MagnetometerCompass
            mag_x={last?.mag_x ?? null}
            mag_y={last?.mag_y ?? null}
            mag_z={last?.mag_z ?? null}
          />
        </section>

        {/* Motion sensor charts */}
        <section className="two-column-grid">
          <AccelerometerChart chartData={accelChartData} />
          <GyroscopeChart chartData={gyroChartData} />
        </section>

        {/* Connection + timestamps summary */}
        <section className="full-width">
          <div className="card">
            <h2 className="card-title">Status</h2>
            <div className="status-list">
              <div className="status-item">
                <div className="status-label">Connection:</div>
                <div className="status-value">
                  {connected ? "🟢 Online" : "🔴 Offline"}
                </div>
              </div>
              <div className="status-item">
                <div className="status-label">Last Update:</div>
                <div className="status-value">{deviceTimestamp}</div>
              </div>
              <div className="status-item">
                <div className="status-label">Battery:</div>
                <div className="status-value">
                  {last ? `${formatNumber(last.battery_percent, 0)}%` : "N/A"}
                </div>
              </div>
              <div className="status-item">
                <div className="status-label">Signal:</div>
                <div className="status-value">{lastReceived}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}