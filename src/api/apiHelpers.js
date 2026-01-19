// src/api/apiHelpers.js

// Import API_BASE from constants
// Note: For .js files, we'll use process.env directly since ES modules aren't available
const BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

// Generic helper to call the backend
function api(url, init) {
  const full = `${BASE}${url}`;
  return fetch(full, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

// Devices list → normalize to { id, name }
export async function fetchDeviceList() {
  const res = await api(`/devices`);
  if (!res.ok) {
    throw new Error(`Failed to fetch devices: ${res.status} ${res.statusText}`);
  }
  const rows = await res.json(); // [{ device_id }]
  return rows.map((r) => ({ id: r.device_id, name: r.device_id }));
}

// Latest snapshot for cards (1 row → mapped to UI shape)
export async function fetchDeviceData(deviceId) {
  if (!deviceId) throw new Error("Missing deviceId");

  const res = await api(
    `/telemetry?device_id=${encodeURIComponent(deviceId)}&limit=1`
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch device data: ${res.status} ${res.statusText}`
    );
  }

  const arr = await res.json();
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

  const res = await api(
    `/telemetry?device_id=${encodeURIComponent(deviceId)}&limit=${limit}`
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch device series: ${res.status} ${res.statusText}`
    );
  }

  const arr = await res.json();
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

  const res = await api(
    `/telemetry?device_id=${encodeURIComponent(deviceId)}&limit=${limit}`
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch gyro series: ${res.status} ${res.statusText}`
    );
  }

  const arr = await res.json();
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

  const res = await api("/api/telemetry/my", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch my telemetry: ${res.status} ${res.statusText}`
    );
  }

  const rows = await res.json(); // array of telemetry rows
  return rows;
}