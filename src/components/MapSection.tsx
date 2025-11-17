'use client'

import React, { useEffect, useState } from 'react'
import './MapSection.css'

function MapSection({ location, timeFilter, onTimeFilterChange }: {
  location?: { latitude: number; longitude: number } | null
  timeFilter: string
  onTimeFilterChange: (filter: string) => void
}) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [L, setL] = useState<any>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)

  const defaultCenter = [0, 0]
  const center = location ? [location.latitude, location.longitude] : defaultCenter
  const hasLocation = location && location.latitude && location.longitude

  // Load Leaflet dynamically on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default)
        setMapLoaded(true)
      }).catch(err => {
        console.error('Failed to load Leaflet:', err)
      })
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !L || mapInstance) return

    const mapElement = document.getElementById('map')
    if (!mapElement) return

    const map = L.map('map').setView(center, hasLocation ? 13 : 2)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    setMapInstance(map)

    return () => {
      map.remove()
      setMapInstance(null)
    }
  }, [mapLoaded, L])

  // Update map center and marker when location changes
  useEffect(() => {
    if (!mapInstance || !L || !hasLocation) return

    mapInstance.setView(center, 13)

    // Remove old marker
    if (marker) {
      marker.remove()
    }

    // Add new marker
    const newMarker = L.marker(center).addTo(mapInstance)
      .bindPopup(`
        Current Location<br />
        Lat: ${location.latitude.toFixed(6)}<br />
        Lon: ${location.longitude.toFixed(6)}
      `)

    setMarker(newMarker)
  }, [location, mapInstance, L, hasLocation])

  return (
    <div className="card map-section">
      <div className="map-header">
        <h2 className="card-title">GNSS Map & Satellite Sky Plot</h2>
        <select
          className="time-filter"
          value={timeFilter}
          onChange={(e) => onTimeFilterChange(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>
      <div className="map-container">
        <div id="map" style={{ height: '100%', width: '100%', background: '#1a1f36' }}>
          {!mapLoaded && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#9ca3af' 
            }}>
              Loading map...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MapSection
