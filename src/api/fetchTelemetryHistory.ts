import { API_BASE } from "../api/constants";
// frontend/api/fetchTelemetryHistory.ts
export type TelemetryHistoryItem = {
  uid: string;
  device_id: string;
  device_ts: number | null;
  heading_deg: number | null;
  accel_x: number | null;
  accel_y: number | null;
  accel_z: number | null;
  gyro_x: number | null;
  gyro_y: number | null;
  gyro_z: number | null;
  temp: number | null;
  battery_percent: number | null;
  created_at: string;
  received_at: string | null;
};

// Safe JSON parser
async function safeJson(res: Response) {
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

export async function fetchTelemetryHistory(): Promise<TelemetryHistoryItem[]> {
  const url = `${API_BASE}/api/telemetry/history`;
  console.log("📊 telemetry history fetch:", url);

  const res = await fetch(url);
  const data = await safeJson(res);

  // clean up numeric strings
  return data.map((row: any) => ({
    uid: row.uid,
    device_id: row.device_id,
    device_ts: row.device_ts ?? null,
    heading_deg: row.heading_deg == null ? null : Number(row.heading_deg),
    accel_x: row.accel_x == null ? null : Number(row.accel_x),
    accel_y: row.accel_y == null ? null : Number(row.accel_y),
    accel_z: row.accel_z == null ? null : Number(row.accel_z),
    gyro_x: row.gyro_x == null ? null : Number(row.gyro_x),
    gyro_y: row.gyro_y == null ? null : Number(row.gyro_y),
    gyro_z: row.gyro_z == null ? null : Number(row.gyro_z),
    temp: row.temp == null ? null : Number(row.temp),
    battery_percent:
      row.battery_percent == null ? null : Number(row.battery_percent),
    created_at: row.created_at,
    received_at: row.received_at,
  }));
}
