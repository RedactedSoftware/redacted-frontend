// src/components/AccelerometerChart.jsx

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function AccelerometerChart({ chartData }) {
  const data = Array.isArray(chartData) ? chartData : [];

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <h2 className="card-title">Accelerometer (X, Y, Z)</h2>
          <div style={{ height: 300, display: 'grid', placeItems: 'center', opacity: 0.7 }}>
            No accelerometer samples yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Accelerometer (X, Y, Z)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis label={{ value: 'g', angle: -90, position: 'insideLeft' }} />
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

