import React, { useState, useEffect } from "react";
import "./Header.css";

function Header({
  devices,
  selectedDevice,
  onDeviceChange,
  darkMode,
  onDarkModeToggle,
  metricUnit,
  onMetricToggle,
  onLogout,
  connected,
  onReset,
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">Aegis Tracker Dashboard</h1>
            <select
              className="device-select"
              value={selectedDevice || ""}
              onChange={(e) => onDeviceChange(e.target.value)}
            >
              {devices.length === 0 && (
                <option value="">No devices available</option>
              )}
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name || device.id}
                </option>
              ))}
            </select>
          </div>

          <div className="header-right">
            <div className={`ws-indicator ${connected ? "connected" : "disconnected"}`}>
              <span className="ws-dot" />
              <span className="ws-label">
                Bridge {connected ? "Online" : "Offline"}
              </span>
            </div>

            {/* Navigation links */}
            <a href="/map" className="nav-link" title="View live map">
              🗺️ Map
            </a>
            
            <button className="toggle-btn" onClick={onMetricToggle}>
              {metricUnit === "metric" ? "°C / km/h" : "°F / mph"}
            </button>
            <button className="toggle-btn" onClick={onDarkModeToggle}>
              {darkMode ? "🌙 Dark" : "☀️ Light"}
            </button>
            <button className="reset-btn" onClick={onReset}>
              Reset Dashboard
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navbar - visible only on small screens */}
      {isMobile && (
        <div className="mobile-bottom-navbar">
          <div className={`ws-indicator ${connected ? "connected" : "disconnected"}`}>
            <span className="ws-dot" />
            <span className="ws-label">{connected ? "Online" : "Offline"}</span>
          </div>
          <a href="/map" className="nav-link" title="View live map">
            🗺️ Map
          </a>
          <button className="toggle-btn" onClick={onMetricToggle} title={`Switch to ${metricUnit === "metric" ? "imperial" : "metric"}`}>
            {metricUnit === "metric" ? "°C" : "°F"}
          </button>
          <button className="toggle-btn" onClick={onDarkModeToggle} title="Toggle dark/light mode">
            {darkMode ? "🌙" : "☀️"}
          </button>
          <button className="reset-btn" onClick={onReset} title="Reset dashboard">
            Reset
          </button>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            Logout
          </button>
        </div>
      )}
    </>
  );
}

export default Header;
