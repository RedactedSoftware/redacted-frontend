# GPS Tracker Dashboard

A real-time GPS tracking dashboard built with React that displays device location, metrics, and sensor data.

## Features

- 🗺️ Interactive map with device location
- 📊 Real-time metrics (speed, direction, temperature, altitude, pressure)
- 🧭 Compass visualization for heading direction
- 📈 Charts for IMU, satellite signal strength, accelerometer, and gyroscope data
- 🔄 Auto-refresh every 3 seconds
- 🌓 Dark/Light mode toggle
- 📏 Metric/Imperial unit toggle
- 📱 Responsive design

## Setup

1. Install dependencies:
bash
npm install

2. Configure your API endpoint:
   - Open `src/api/apiHelpers.js`
   - Replace `YOUR_EC2_IP_HERE` with your actual EC2 server IP or domain

3. Run the development server:
bash
npm run dev


4. Build for production:
bash
npm run build


## API Integration

The dashboard expects your backend API to provide the following endpoints:

### GET /api/devices
Returns a list of available devices:
json
[
  { "id": "device-1", "name": "GPS Tracker 1" },
  { "id": "device-2", "name": "GPS Tracker 2" }
]


### GET /api/device/:id/latest
Returns the latest data for a specific device:
json
{
  "location": { "latitude": 37.7749, "longitude": -122.4194 },
  "speed": 45.5,
  "direction": 90,
  "temperature": 22.5,
  "altitude": 150,
  "pressure": 1013.25,
  "deviceStatus": {
    "systemUptime": 86400,
    "healthUptime": 86400,
    "lastGnssFix": "2 minutes ago",
    "signalStrength": 85,
    "cpuTemp": 45.2
  },
  "gnss": {},
  "cellular": {},
  "imu": [],
  "satellites": [{ "prn": "G01", "snr": 42 }],
  "accelerometer": [{ "time": "12:00:00", "x": 0.1, "y": 0.2, "z": 9.8 }],
  "gyroscope": [{ "time": "12:00:00", "x": 0.5, "y": -0.3, "z": 0.1 }]
}


## Customization

- **Polling Interval**: Change the `3000` ms value in `src/App.jsx` (line ~42)
- **Map Tiles**: Modify the TileLayer URL in `src/components/MapSection.jsx`
- **Color Scheme**: Update CSS variables in component stylesheets
- **Chart Types**: Customize charts in respective component files

## Tech Stack

- React 18
- Vite
- Recharts (for data visualization)
- React-Leaflet (for maps)
- CSS for styling

## License

MIT

# redacted-frontend
YOOOO