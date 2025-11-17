import React from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import './CompassChart.css'

function CompassChart({ heading = 0 }) {
  // Create compass data with the current heading
  const data = [
    { direction: 'N (0°)', value: heading === 0 ? 1 : 0 },
    { direction: 'NE (45°)', value: heading === 45 ? 1 : 0 },
    { direction: 'E (90°)', value: heading === 90 ? 1 : 0 },
    { direction: 'SE (135°)', value: heading === 135 ? 1 : 0 },
    { direction: 'S (180°)', value: heading === 180 ? 1 : 0 },
    { direction: 'SW (225°)', value: heading === 225 ? 1 : 0 },
    { direction: 'W (270°)', value: heading === 270 ? 1 : 0 },
    { direction: 'NW (315°)', value: heading === 315 ? 1 : 0 },
  ]

  return (
    <div className="card compass-chart">
      <h2 className="card-title">Compass & Satellite Data Feed</h2>
      <div className="compass-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
          <span>Heading</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data}>
          <PolarGrid stroke="#3d4a6e" />
          <PolarAngleAxis
            dataKey="direction"
            tick={{ fill: '#fbbf24', fontSize: 12 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} />
          <Radar
            name="Heading"
            dataKey="value"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="heading-display">
        Current Heading: <strong>{heading}°</strong>
      </div>
    </div>
  )
}

export default CompassChart
