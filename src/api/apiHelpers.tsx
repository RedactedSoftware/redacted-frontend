// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://YOUR_EC2_IP_HERE:8000'
const USE_MOCK_DATA = !process.env.NEXT_PUBLIC_API_URL // Use mock data if no API URL is configured

// Mock data generator for demo purposes
const generateMockDeviceData = () => {
  const now = Date.now()
  const baseLatitude = 37.7749
  const baseLongitude = -122.4194
  
  // Simulate slight movement
  const offset = (Math.sin(now / 10000) * 0.001)
  
  return {
    location: {
      latitude: baseLatitude + offset,
      longitude: baseLongitude + offset * 0.5,
    },
    speed: Math.abs(Math.sin(now / 5000) * 60), // 0-60 km/h
    direction: (now / 100) % 360, // Rotating heading
    temperature: 22 + Math.sin(now / 20000) * 5, // 17-27°C
    altitude: 100 + Math.sin(now / 15000) * 50, // 50-150m
    pressure: 1013 + Math.sin(now / 25000) * 10, // 1003-1023 hPa
    gnss: {
      satellites: 8 + Math.floor(Math.random() * 4),
      hdop: 1.2,
      fixQuality: 'RTK Fixed'
    },
    deviceStatus: {
      systemUptime: Math.floor(now / 1000),
      healthUptime: Math.floor(now / 1000) - 100,
      systemUptimeHuman: '2d 14h 32m',
      lastGnssFix: '2 seconds ago',
      signalStrength: 'Strong',
      cpuTemp: 45 + Math.random() * 10
    },
    cellular: {
      carrier: 'AT&T',
      signalStrength: -65 - Math.random() * 20,
      technology: '4G LTE'
    },
    imu: {
      trajectoryXY: Array.from({ length: 50 }, (_, i) => ({
        x: Math.sin(i / 10) * 0.5,
        y: Math.cos(i / 10) * 0.5
      })),
      trajectoryZ: Array.from({ length: 50 }, (_, i) => ({
        x: i / 50,
        z: Math.sin(i / 5) * 0.2
      }))
    },
    satellites: Array.from({ length: 12 }, (_, i) => ({
      prn: i + 1,
      snr: 20 + Math.random() * 25
    })),
    accelerometer: {
      x: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 2),
      y: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 2),
      z: Array.from({ length: 100 }, () => 9.8 + (Math.random() - 0.5) * 0.5)
    },
    gyroscope: {
      x: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 10),
      y: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 10),
      z: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 10)
    }
  }
}

export const fetchDeviceList = async () => {
  console.log('[v0] fetchDeviceList called, USE_MOCK_DATA:', USE_MOCK_DATA)
  
  if (USE_MOCK_DATA) {
    console.log('[v0] Using mock device list')
    return [
      { id: 'device-001', name: 'GPS Tracker 1' },
      { id: 'device-002', name: 'GPS Tracker 2' }
    ]
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/devices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[v0] Fetched device list from API:', data)
    return data
  } catch (error) {
    console.error('Error fetching device list:', error)
    // Fallback to mock data on error
    console.log('[v0] Falling back to mock device list')
    return [
      { id: 'device-001', name: 'GPS Tracker 1' },
      { id: 'device-002', name: 'GPS Tracker 2' }
    ]
  }
}

export const fetchDeviceData = async (deviceId: string) => {
  console.log('[v0] fetchDeviceData called for:', deviceId, 'USE_MOCK_DATA:', USE_MOCK_DATA)
  
  if (USE_MOCK_DATA) {
    const mockData = generateMockDeviceData()
    console.log('[v0] Using mock device data')
    return mockData
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/devices/${deviceId}/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[v0] Fetched device data from API:', data)
    return data
  } catch (error) {
    console.error('Error fetching device data:', error)
    // Fallback to mock data on error
    console.log('[v0] Falling back to mock device data')
    return generateMockDeviceData()
  }
}