'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Play, Pause, SkipBack, SkipForward, MapPin, Compass, Gauge, Navigation } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

type SessionData = {
  id: string
  deviceId: string
  deviceName: string
  startTime: string
  endTime: string
  dataPoints: Array<{
    timestamp: string
    lat: number
    lon: number
    speed: number
    altitude: number
    heading: number
  }>
}

// Mock sessions - replace with real API call later
const mockSessionsData: Record<string, SessionData> = {
  'sess-001': {
    id: 'sess-001',
    deviceId: 'PICO-001',
    deviceName: 'My Tracker',
    startTime: '2025-12-20T14:30:00Z',
    endTime: '2025-12-20T15:45:00Z',
    dataPoints: [
      { timestamp: '2025-12-20T14:30:00Z', lat: 37.7749, lon: -122.4194, speed: 0, altitude: 10, heading: 0 },
      { timestamp: '2025-12-20T14:31:00Z', lat: 37.7759, lon: -122.4184, speed: 15.2, altitude: 12, heading: 45 },
      { timestamp: '2025-12-20T14:32:00Z', lat: 37.7769, lon: -122.4174, speed: 32.5, altitude: 15, heading: 50 },
      { timestamp: '2025-12-20T14:33:00Z', lat: 37.7779, lon: -122.4164, speed: 48.3, altitude: 18, heading: 55 },
      { timestamp: '2025-12-20T14:34:00Z', lat: 37.7789, lon: -122.4154, speed: 65.5, altitude: 20, heading: 60 },
      { timestamp: '2025-12-20T15:45:00Z', lat: 37.8044, lon: -122.2712, speed: 0, altitude: 8, heading: 60 },
    ],
  },
  'sess-002': {
    id: 'sess-002',
    deviceId: 'PICO-001',
    deviceName: 'My Tracker',
    startTime: '2025-12-19T09:15:00Z',
    endTime: '2025-12-19T11:30:00Z',
    dataPoints: [
      { timestamp: '2025-12-19T09:15:00Z', lat: 37.7749, lon: -122.4194, speed: 0, altitude: 10, heading: 0 },
      { timestamp: '2025-12-19T09:45:00Z', lat: 37.7849, lon: -122.3894, speed: 72.4, altitude: 25, heading: 90 },
      { timestamp: '2025-12-19T11:00:00Z', lat: 37.7949, lon: -122.3294, speed: 88.2, altitude: 35, heading: 95 },
      { timestamp: '2025-12-19T11:30:00Z', lat: 37.5585, lon: -122.2711, speed: 0, altitude: 15, heading: 95 },
    ],
  },
  'sess-003': {
    id: 'sess-003',
    deviceId: 'PICO-002',
    deviceName: 'Backup Tracker',
    startTime: '2025-12-18T16:00:00Z',
    endTime: '2025-12-18T17:20:00Z',
    dataPoints: [
      { timestamp: '2025-12-18T16:00:00Z', lat: 37.7749, lon: -122.4194, speed: 0, altitude: 10, heading: 0 },
      { timestamp: '2025-12-18T16:40:00Z', lat: 37.7799, lon: -122.4094, speed: 55.8, altitude: 18, heading: 75 },
      { timestamp: '2025-12-18T17:20:00Z', lat: 37.7849, lon: -122.3994, speed: 0, altitude: 12, heading: 75 },
    ],
  },
}

function MapPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId') || ''
  const isSessionPlayback = !!sessionId

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(isSessionPlayback)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout>()
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const polylineRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [L, setL] = useState<any>(null)
  const [realtimeTelemetry, setRealtimeTelemetry] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Load session or setup real-time connection
  useEffect(() => {
    if (isSessionPlayback) {
      const timer = setTimeout(() => {
        if (sessionId && mockSessionsData[sessionId]) {
          setSession(mockSessionsData[sessionId])
        }
        setLoading(false)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || ''
      const secureWsUrl = typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? WS_URL.replace(/^ws:/, 'wss:')
        : WS_URL

      if (!secureWsUrl) {
        console.warn('⚠️ WebSocket URL not configured')
        return
      }

      try {
        const ws = new WebSocket(secureWsUrl)
        wsRef.current = ws

        ws.onmessage = (e) => {
          try {
            const raw = JSON.parse(e.data)
            const payload = raw?.type === 'telemetry' && raw?.payload ? raw.payload : raw
            setRealtimeTelemetry(payload)
          } catch (err) {
            console.error('WS parse error:', err)
          }
        }

        ws.onerror = (err) => console.error('❌ WS error:', err)
        ws.onclose = () => console.log('❌ WS closed')
      } catch (err) {
        console.error('Failed to connect WebSocket:', err)
      }

      return () => {
        wsRef.current?.close()
      }
    }
  }, [sessionId, isSessionPlayback])

  // Load Leaflet library
  useEffect(() => {
    if (typeof window !== 'undefined' && !L) {
      import('leaflet').then((leaflet) => {
        console.log('✓ Leaflet loaded successfully')
        setL(leaflet.default)
        setMapLoaded(true)
      }).catch(err => {
        console.error('Failed to load Leaflet:', err)
      })
    }
  }, [])

  // Initialize playback map when ready
  useEffect(() => {
    if (!isSessionPlayback || !mapLoaded || !L || mapInstanceRef.current || !session) return

    const mapElement = document.getElementById('playback-map')
    if (!mapElement) return

    try {
      console.log('Initializing playback map...')
      console.log('Playback map element dimensions:', mapElement.clientWidth, 'x', mapElement.clientHeight)
      
      const initialPoint = session.dataPoints[0]
      const map = L.map('playback-map', { zoomControl: true }).setView([initialPoint.lat, initialPoint.lon], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Force map to recalculate size
      setTimeout(() => {
        map.invalidateSize()
        console.log('Playback map size invalidated')
      }, 100)

      mapInstanceRef.current = map
      console.log('✓ Playback map initialized')

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      }
    } catch (err) {
      console.error('Failed to initialize playback map:', err)
    }
  }, [isSessionPlayback, mapLoaded, L, session])

  // Initialize real-time map when ready
  useEffect(() => {
    if (isSessionPlayback || !mapLoaded || !L || mapInstanceRef.current) return

    const mapElement = document.getElementById('live-map')
    if (!mapElement) {
      console.warn('Map element not found')
      return
    }

    try {
      console.log('Initializing live map...')
      console.log('Map element dimensions:', mapElement.clientWidth, 'x', mapElement.clientHeight)
      
      const map = L.map('live-map', { zoomControl: true }).setView([0, 0], 2)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Force map to recalculate size
      setTimeout(() => {
        map.invalidateSize()
        console.log('Map size invalidated')
      }, 100)

      mapInstanceRef.current = map
      console.log('✓ Live map initialized')

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }
      }
    } catch (err) {
      console.error('Failed to initialize live map:', err)
    }
  }, [isSessionPlayback, mapLoaded, L])

  // Update playback map marker
  useEffect(() => {
    if (!isSessionPlayback || !mapInstanceRef.current || !L || !session) return

    const currentPoint = session.dataPoints[currentIndex]
    
    mapInstanceRef.current.setView([currentPoint.lat, currentPoint.lon], 13)

    if (markerRef.current) {
      markerRef.current.remove()
    }

    const newMarker = L.marker([currentPoint.lat, currentPoint.lon], {
      title: `Position ${currentIndex + 1}`
    }).addTo(mapInstanceRef.current)
      .bindPopup(`
        <div style="color: black;">
          <strong>Position ${currentIndex + 1}</strong><br />
          Lat: ${currentPoint.lat.toFixed(6)}<br />
          Lon: ${currentPoint.lon.toFixed(6)}<br />
          Speed: ${currentPoint.speed.toFixed(1)} km/h<br />
          Altitude: ${currentPoint.altitude.toFixed(0)} m
        </div>
      `)

    markerRef.current = newMarker
  }, [currentIndex, isSessionPlayback, session, L])

  // Update real-time map marker
  useEffect(() => {
    if (isSessionPlayback || !mapInstanceRef.current || !L) return

    const lat = realtimeTelemetry?.lat ?? realtimeTelemetry?.latitude ?? null
    const lon = realtimeTelemetry?.lon ?? realtimeTelemetry?.longitude ?? null

    if (!lat || !lon) return

    mapInstanceRef.current.setView([lat, lon], 13)

    if (markerRef.current) {
      markerRef.current.remove()
    }

    const newMarker = L.marker([lat, lon]).addTo(mapInstanceRef.current)
      .bindPopup(`
        <div style="color: black;">
          <strong>Current Location</strong><br />
          Lat: ${lat.toFixed(6)}<br />
          Lon: ${lon.toFixed(6)}
        </div>
      `)

    markerRef.current = newMarker
  }, [realtimeTelemetry, isSessionPlayback, L])

  // Playback logic
  useEffect(() => {
    if (!isPlaying || !session) return

    playIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= session.dataPoints.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 500)

    return () => clearInterval(playIntervalRef.current)
  }, [isPlaying, session])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading session...</p>
        </div>
      </div>
    )
  }

  // Handle session playback mode
  if (isSessionPlayback) {
    if (!session) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg mb-4">Session not found</p>
            <Link
              href="/history"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 justify-center"
            >
              <ChevronLeft size={20} />
              Back to History
            </Link>
          </div>
        </div>
      )
    }

    const currentPoint = session.dataPoints[currentIndex]
    const progress = ((currentIndex + 1) / session.dataPoints.length) * 100

    return (
      <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-900/50 sticky top-0 z-10 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/history"
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
              >
                <ChevronLeft size={20} />
                Back to History
              </Link>
              <div className="h-6 w-px bg-slate-700"></div>
              <div>
                <h1 className="text-xl font-bold">{session.deviceName}</h1>
                <p className="text-sm text-slate-400">{session.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map area */}
          <div className="flex-1 bg-black border-b border-slate-700 overflow-hidden relative" style={{ minHeight: 0 }}>
            <div id="playback-map" style={{ 
              height: '100%', 
              width: '100%',
              position: 'relative',
              backgroundColor: '#000000'
            }}>
            </div>
            {!mapLoaded && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#9ca3af',
                zIndex: 400,
                textAlign: 'center'
              }}>
                <div style={{marginBottom: '10px'}}>Loading map...</div>
                <div style={{fontSize: '12px', color: '#6b7280'}}>Make sure you have an internet connection</div>
              </div>
            )}
          </div>

          {/* Info and controls panel */}
          <div className="bg-slate-900/50 border-t border-slate-700 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Current position info */}
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm flex items-center gap-1">
                      <MapPin size={14} /> Coordinates
                    </div>
                    <div className="font-mono text-cyan-400 text-sm mt-1">
                      {currentPoint.lat.toFixed(6)}, {currentPoint.lon.toFixed(6)}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm flex items-center gap-1">
                      <Gauge size={14} /> Speed
                    </div>
                    <div className="font-bold text-white text-lg">
                      {currentPoint.speed.toFixed(1)} km/h
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm flex items-center gap-1">
                      <Navigation size={14} /> Heading
                    </div>
                    <div className="font-bold text-white text-lg">
                      {currentPoint.heading.toFixed(0)}°
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm flex items-center gap-1">
                      <MapPin size={14} /> Altitude
                    </div>
                    <div className="font-bold text-white text-lg">
                      {currentPoint.altitude.toFixed(0)} m
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline and controls */}
              <div className="space-y-4">
                {/* Timeline */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">
                      {currentIndex + 1} / {session.dataPoints.length}
                    </span>
                    <span className="text-sm text-slate-400">
                      {new Date(session.startTime).toLocaleString()} →{' '}
                      {new Date(session.endTime).toLocaleString()}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setCurrentIndex(0)
                      setIsPlaying(false)
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-white"
                    title="Restart"
                  >
                    <SkipBack size={20} />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition text-white font-semibold flex items-center gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={20} />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        Play
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentIndex(Math.min(currentIndex + 1, session.dataPoints.length - 1))
                      setIsPlaying(false)
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-white"
                    title="Next"
                  >
                    <SkipForward size={20} />
                  </button>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max={session.dataPoints.length - 1}
                  value={currentIndex}
                  onChange={(e) => {
                    setCurrentIndex(parseInt(e.target.value))
                    setIsPlaying(false)
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Real-time map mode
  const lat = realtimeTelemetry?.lat ?? realtimeTelemetry?.latitude ?? null
  const lon = realtimeTelemetry?.lon ?? realtimeTelemetry?.longitude ?? null
  const speed = realtimeTelemetry?.speed_kmh ?? realtimeTelemetry?.speed ?? null
  const altitude = realtimeTelemetry?.altitude_m ?? realtimeTelemetry?.altitude ?? null
  const heading = realtimeTelemetry?.heading_deg ?? realtimeTelemetry?.heading ?? 0

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🗺️ Live Map</h1>
            <p className="text-sm text-slate-400">Real-time location tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition text-white font-semibold"
            >
              📊 View History
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-white font-semibold"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Map area */}
        <div className="flex-1 bg-black border-b border-slate-700 overflow-hidden relative" style={{ minHeight: 0 }}>
          <div id="live-map" style={{ 
            height: '100%', 
            width: '100%',
            position: 'relative',
            backgroundColor: '#000000'
          }}>
          </div>
          {!mapLoaded && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#9ca3af',
              zIndex: 400,
              textAlign: 'center'
            }}>
              <div style={{marginBottom: '10px'}}>Loading map...</div>
              <div style={{fontSize: '12px', color: '#6b7280'}}>Make sure you have an internet connection</div>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="bg-slate-900/50 border-t border-slate-700 p-6">
          <div className="max-w-6xl mx-auto">
            {lat && lon ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm flex items-center gap-1">
                      <MapPin size={14} /> Coordinates
                    </div>
                    <div className="font-mono text-cyan-400 text-sm mt-1">
                      {lat.toFixed(6)}, {lon.toFixed(6)}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm flex items-center gap-1">
                      <Gauge size={14} /> Speed
                    </div>
                    <div className="font-bold text-white text-lg">
                      {speed ? speed.toFixed(1) : 'N/A'} km/h
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm flex items-center gap-1">
                      <Navigation size={14} /> Heading
                    </div>
                    <div className="font-bold text-white text-lg">
                      {heading.toFixed(0)}°
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-slate-400 text-sm flex items-center gap-1">
                      <MapPin size={14} /> Altitude
                    </div>
                    <div className="font-bold text-white text-lg">
                      {altitude ? altitude.toFixed(0) : 'N/A'} m
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Last update: {realtimeTelemetry?.created_at ? new Date(realtimeTelemetry.created_at).toLocaleTimeString() : 'Waiting...'}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-lg text-slate-300">Waiting for GPS location...</p>
                <p className="text-sm text-slate-500">Make sure your tracker is connected and sending data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <MapPageContent />
    </Suspense>
  )
}
