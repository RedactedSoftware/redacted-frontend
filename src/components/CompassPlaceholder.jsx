// src/components/CompassPlaceholder.jsx
export default function CompassPlaceholder() {
  return (
    <div
      style={{
        height: 380,
        borderRadius: 16,
        border: '1px solid #1f2937',
        background:
          'linear-gradient(180deg, rgba(17,24,39,1) 0%, rgba(15,23,42,1) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        padding: 16,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          fontSize: 12,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        Compass & Heading
      </div>

      <div
        style={{
          width: 260,
          height: 260,
          borderRadius: '50%',
          border: '1px solid rgba(148,163,184,0.35)',
          position: 'relative',
          boxShadow: '0 8px 24px rgba(2,6,23,0.45) inset',
        }}
      >
        {/* tick marks */}
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 2,
              height: i % 9 === 0 ? 18 : 10,
              background: 'rgba(148,163,184,0.6)',
              transformOrigin: 'center -105px',
              transform: `translate(-50%,-50%) rotate(${i * 10}deg)`,
            }}
          />
        ))}

        {/* needle (static placeholder) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%) rotate(20deg)',
            width: 4,
            height: 110,
            background: 'linear-gradient(180deg,#60a5fa,#1d4ed8)',
            borderRadius: 9999,
            boxShadow: '0 0 12px rgba(96,165,250,0.35)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 14,
            height: 14,
            borderRadius: '9999px',
            background: '#0b1220',
            border: '2px solid #93c5fd',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          fontSize: 12,
          color: '#9ca3af',
          opacity: 0.9,
        }}
      >
        Heading: 79° (placeholder)
      </div>
    </div>
  );
}

