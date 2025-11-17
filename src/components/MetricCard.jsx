import React from 'react'
import './MetricCard.css'

function MetricCard({ title, value, label }) {
  return (
    <div className="metric-card">
      <h3 className="metric-title">{title}</h3>
      <div className="metric-value">{value}</div>
      {label && <div className="metric-label">{label}</div>}
    </div>
  )
}

export default MetricCard
