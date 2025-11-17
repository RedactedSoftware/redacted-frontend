// src/components/MapPlaceholder.jsx
export default function MapPlaceholder() {
  return (
    <div
      style={{
        height: 380,
        borderRadius: 16,
        border: '1px solid #1f2937',
        background:
          'linear-gradient(180deg, rgba(17,24,39,1) 0%, rgba(15,23,42,1) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        overflow: 'hidden',
        position: 'relative',
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
        }}
      >
        GNSS Map & Satellite Sky Plot
      </div>

      {/* faux map tiles */}
      <div
        style={{
          position: 'absolute',
          inset: 16,
          borderRadius: 12,
          backgroundImage:
            'linear-gradient(#0b1220 1px, transparent 1px), linear-gradient(90deg, #0b1220 1px, transparent 1px)',
          backgroundSize: '28px 28px, 28px 28px',
          opacity: 0.5,
        }}
      />

      {/* crosshair + marker */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 14,
          height: 14,
          borderRadius: '9999px',
          background: '#60a5fa',
          boxShadow: '0 0 0 6px rgba(96,165,250,0.15)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 220,
          height: 220,
          borderRadius: '9999px',
          border: '1px dashed rgba(148,163,184,0.35)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 16,
          fontSize: 12,
          color: '#9ca3af',
          opacity: 0.9,
        }}
      >
        Waiting for GPS…
      </div>
    </div>
  );
}

