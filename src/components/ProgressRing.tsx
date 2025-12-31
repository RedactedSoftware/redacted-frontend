import React from 'react'

interface ProgressRingProps {
  progress: number
  size?: number
  stroke?: number
  color?: string
  visible?: boolean
}

function ProgressRing({
  progress,
  size = 56,
  stroke = 3,
  color = 'rgba(0, 255, 160, 0.95)',
  visible = true
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, progress))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - clamped)
  const percent = Math.round(clamped * 100)

  return (
    <div
      className="progress-ring-container"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 500ms ease-out',
        pointerEvents: visible ? 'auto' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        {/* Background circle - dim track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* Progress circle - bright accent */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.25s ease-out' }}
        />
        {/* Center percentage text */}
        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fontWeight="700"
          fill="rgba(0, 255, 160, 0.9)"
          style={{ pointerEvents: 'none' }}
        >
          {percent}%
        </text>
      </svg>
    </div>
  )
}

export default ProgressRing
