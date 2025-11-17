import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './SatelliteChart.css'

function SatelliteChart({ data }) {
  // Sample data structure - replace with actual data from API
  const chartData = data || []

  return (
    <div className="card">
      <h2 className="card-title">Satellite Signal Strength (SNR by PRN)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3d4a6e" />
          <XAxis dataKey="prn" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" label={{ value: 'SNR (dB)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ background: '#1e2742', border: '1px solid #3d4a6e', borderRadius: '8px' }}
          />
          <Legend />
          <Bar dataKey="snr" fill="#22d3ee" name="SNR (dB)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SatelliteChart
