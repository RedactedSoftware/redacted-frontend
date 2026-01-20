// src/api/apiHelpers.js
// Safe JSON parser that validates content-type first
async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  if (!ct.includes("application/json")) {
    throw new Error(`Expected JSON but got ${ct}. Body: ${text.slice(0, 200)}`);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON: ${text.slice(0, 100)}`);
  }
}

// Devices list → token gated, bulletproof
export async function fetchDeviceList() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    console.warn("❌ fetchDeviceList: No token available");
    return [];
  }

  const url = '/api/devices';
  console.log("📱 devices fetch:", url);
  console.log("📱 devices fetch:", url);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await safeJson(res);
  return data.map((r) => ({ id: r.device_id, name: r.name ?? r.device_id, registered_at: r.registered_at }));
}

// Latest snapshot for cards (1 row → mapped to UI shape)
export async function fetchDeviceData(deviceId) {
  if (!deviceId) throw new Error("Missing deviceId");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No authentication token");

  const url = `/api/telemetry?device_id=${encodeURIComponent(deviceId)}&limit=1`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const arr = await safeJson(res);
  const r = arr[0] || {};

  return {
    location:
      r.lat != null && r.lon != null
        ? { latitude: r.lat, longitude: r.lon }
        : null,

    speed: r.speed ?? null,
    direction: r.heading ?? null,
    temperature: r.temp ?? null,
    altitude: r.altitude ?? null,
    pressure: r.pressure ?? null,

    gnss: {
      lastGnssFix: r.ts ? new Date(r.ts).toLocaleString() : null,
      signalStrength: r.rssi ?? null,
      cpuTemp: r.cpu_temp ?? null,
    },

    satellites: r.satellites ?? null,
    accelerometer: {
      x: r.accel_x ?? null,
      y: r.accel_y ?? null,
      z: r.accel_z ?? null,
    },
    gyroscope: {
      x: r.gyro_x ?? null,
      y: r.gyro_y ?? null,
      z: r.gyro_z ?? null,
    },
  };
}

// Timeseries for accelerometer charts
export async function fetchDeviceSeries(deviceId, limit = 200) {
  if (!deviceId) throw new Error("Missing deviceId");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No authentication token");

  const url = `/api/telemetry?device_id=${encodeURIComponent(deviceId)}&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const arr = await safeJson(res);
  return arr
    .map((r) => ({
      time: r.ts ? new Date(r.ts).toLocaleTimeString() : "",
      x: r.accel_x ?? null,
      y: r.accel_y ?? null,
      z: r.accel_z ?? null,
    }))
    .reverse();
}

// Timeseries for gyroscope charts
export async function fetchGyroSeries(deviceId, limit = 200) {
  if (!deviceId) throw new Error("Missing deviceId");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("No authentication token");

  const url = `/api/telemetry?device_id=${encodeURIComponent(deviceId)}&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const arr = await safeJson(res);
  return arr
    .map((r) => ({
      time: r.ts ? new Date(r.ts).toLocaleTimeString() : "",
      x: r.gyro_x ?? null,
      y: r.gyro_y ?? null,
      z: r.gyro_z ?? null,
    }))
    .reverse();
}

// Fetch all telemetry for the currently logged-in user (per-account history)
export async function fetchMyTelemetry(token) {
  if (!token) throw new Error("Missing auth token");

  const url = '/api/telemetry/my';
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const rows = await safeJson(res); // array of telemetry rows
  return rows;
}