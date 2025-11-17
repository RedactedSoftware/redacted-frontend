import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './IMUChart.css'

function IMUChart({ data }) {
  // Sample data structure - replace with actual data from API
  const chartData = data || []

  return (
    <div className="card">
      <h2 className="card-title">IMU Trajectory Estimate (3D Position from Accel)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3d4a6e" />
          <XAxis dataKey="x" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" label={{ value: 'Y/Z', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ background: '#1e2742', border: '1px solid #3d4a6e', borderRadius: '8px' }}
          />
          <Legend />
          <Line type="monotone" dataKey="trajectoryXY" stroke="#3b82f6" name="Trajectory (XY)" />
          <Line type="monotone" dataKey="trajectoryZ" stroke="#ec4899" name="Trajectory (Z)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default IMUChart
