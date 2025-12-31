import React from 'react'
import './MetricCard.css'

interface MetricCardProps {
  title: string
  value: string | number
  label?: string
  subtitle?: string
  helperText?: string
  variant?: 'default' | 'good' | 'warning' | 'bad'
  rightSlot?: React.ReactNode
}

function MetricCard({
  title,
  value,
  label,
  subtitle,
  helperText,
  variant = 'default',
  rightSlot
}: MetricCardProps) {
  return (
    <div className={`metric-card metric-card-${variant}`}>
      <div className="metric-card-header">
        <div className="metric-card-content">
          <h3 className="metric-title">{title}</h3>
          {subtitle && <p className="metric-subtitle">{subtitle}</p>}
          <div className="metric-value">{value}</div>
          {label && <div className="metric-label">{label}</div>}
          {helperText && <p className="metric-helper">{helperText}</p>}
        </div>
        {rightSlot && <div className="metric-card-right">{rightSlot}</div>}
      </div>
    </div>
  )
}

export default MetricCard
