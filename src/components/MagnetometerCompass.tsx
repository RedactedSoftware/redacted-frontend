import React from 'react';
import './MagnetometerCompass.css';

interface MagnetometerCompassProps {
  mag_x: number | null;
  mag_y: number | null;
  mag_z: number | null;
}

export default function MagnetometerCompass({
  mag_x,
  mag_y,
  mag_z,
}: MagnetometerCompassProps) {
  // Calculate heading from magnetometer data
  // Using arctangent of Y/X to get angle in degrees
  let heading = 0;
  
  if (mag_x != null && mag_y != null) {
    // atan2 returns radians, convert to degrees
    // atan2(y, x) gives angle from positive x-axis
    let angle = Math.atan2(mag_y, mag_x) * (180 / Math.PI);
    
    // Normalize to 0-360 range
    // In magnetometer coords: +X is East, +Y is North (typically)
    // So we need to adjust: heading = 90 - angle to align with compass convention
    heading = (90 - angle + 360) % 360;
  }

  return (
    <div className="magnetometer-compass-card">
      <h3 className="compass-title">Magnetometer Compass</h3>
      
      <div className="compass-container">
        <div className="compass-ring">
          {/* Cardinal directions */}
          <div className="cardinal north">N</div>
          <div className="cardinal east">E</div>
          <div className="cardinal south">S</div>
          <div className="cardinal west">W</div>
          
          {/* Intercardinal directions */}
          <div className="intercardinal ne">NE</div>
          <div className="intercardinal se">SE</div>
          <div className="intercardinal sw">SW</div>
          <div className="intercardinal nw">NW</div>
          
          {/* Degree markers */}
          <div className="degree-markers">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <div
                key={deg}
                className="degree-marker"
                style={{
                  transform: `rotate(${deg}deg) translateY(-95px)`,
                }}
              >
                <span style={{ transform: `rotate(${-deg}deg)` }}>{deg}°</span>
              </div>
            ))}
          </div>
          
          {/* Needle/Arrow pointing in heading direction */}
          <div
            className="compass-needle"
            style={{
              transform: `rotate(${heading}deg)`,
            }}
          >
            <div className="needle-head" />
            <div className="needle-tail" />
          </div>
        </div>
      </div>
      
      {/* Display values */}
      <div className="compass-info">
        <div className="heading-value">
          <strong>{heading.toFixed(1)}°</strong>
        </div>
        <div className="sensor-values">
          <div className="sensor-row">
            <span className="sensor-label">X:</span>
            <span className="sensor-val">{mag_x != null ? mag_x.toFixed(1) : '--'}</span>
          </div>
          <div className="sensor-row">
            <span className="sensor-label">Y:</span>
            <span className="sensor-val">{mag_y != null ? mag_y.toFixed(1) : '--'}</span>
          </div>
          <div className="sensor-row">
            <span className="sensor-label">Z:</span>
            <span className="sensor-val">{mag_z != null ? mag_z.toFixed(1) : '--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
