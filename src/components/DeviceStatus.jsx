import React from 'react'
import './DeviceStatus.css'

function DeviceStatus({ data }) {
  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <div className="card device-status">
      <h2 className="card-title">Device Status</h2>
      <div className="status-list">
        <StatusItem label="System Uptime (s)" value={data?.systemUptime} />
        <StatusItem label="Health Uptime (s)" value={data?.healthUptime} />
        <StatusItem
          label="System Uptime (human)"
          value={data?.systemUptime ? formatUptime(data.systemUptime) : 'N/A'}
        />
        <StatusItem label="Last GNSS Fix" value={data?.lastGnssFix} />
        <StatusItem label="Signal Strength" value={data?.signalStrength} />
        <StatusItem label="CPU Temp (°C)" value={data?.cpuTemp} />
      </div>
    </div>
  )
}

function StatusItem({ label, value }) {
  const displayValue = value !== null && value !== undefined ? value : 'N/A'

  return (
    <div className="status-item">
      <span className="status-label">{label}</span>
      <span className="status-value">{displayValue}</span>
    </div>
  )
}

export default DeviceStatus
