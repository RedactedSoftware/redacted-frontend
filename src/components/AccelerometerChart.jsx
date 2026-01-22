import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";

/**
 * AccelerometerChart
 * Props:
 *   data: Array<any>  // flexible input formats supported
 *
 * Supported sample formats:
 *  - { time: "...", x: n, y: n, z: n }
 *  - { ts_unix: n, accel_x: n, accel_y: n, accel_z: n }
 *  - { device_ts: n, accelerometer: { x, y, z } }
 */
export default function AccelerometerChart({ data }) {
  const normalized = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    function toTimeLabel(s) {
      // Prefer explicit "time" string
      if (typeof s.time === "string" && s.time.length) return s.time;

      // ts_unix from DB in seconds
      if (Number.isFinite(s.ts_unix)) {
        return new Date(Number(s.ts_unix) * 1000).toLocaleTimeString();
      }

      // device_ts from pico: could be epoch seconds or ms depending on your code
      if (Number.isFinite(s.device_ts)) {
        const t = Number(s.device_ts);
        const ms = t > 1e12 ? t : t * 1000; // heuristic
        return new Date(ms).toLocaleTimeString();
      }

      // fallback: blank
      return "";
    }

    function toAxis(s, axis) {
      // already normalized
      if (Number.isFinite(s[axis])) return Number(s[axis]);

      // DB/API flat keys
      const flatKey = `accel_${axis}`;
      if (Number.isFinite(s[flatKey])) return Number(s[flatKey]);

      // WS nested
      if (s.accelerometer && Number.isFinite(s.accelerometer[axis])) return Number(s.accelerometer[axis]);

      return null;
    }

    const out = [];
    for (const s of data) {
      const x = toAxis(s, "x");
      const y = toAxis(s, "y");
      const z = toAxis(s, "z");
      // require at least one axis
      if (x == null && y == null && z == null) continue;

      out.push({
        timeLabel: toTimeLabel(s),
        x, y, z,
      });
    }
    return out;
  }, [data]);

  if (!normalized.length) {
    return (
      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <strong>Accelerometer</strong>
        <div style={{ marginTop: 8, color: "#666" }}>No accelerometer samples yet</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <strong>Accelerometer</strong>
      <div style={{ marginTop: 12, height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={normalized}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timeLabel" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="x" dot={false} />
            <Line type="monotone" dataKey="y" dot={false} />
            <Line type="monotone" dataKey="z" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
