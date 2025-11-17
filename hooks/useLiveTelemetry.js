// hooks/useLiveTelemetry.js
'use client';

import { useEffect, useRef } from 'react';
import { startWS, onWSMessage } from '../src/realtime/wsClient';
import { fetchDeviceData } from '../src/api/apiHelpers';

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default function useLiveTelemetry(selectedDeviceId, setters) {
  const activeIdRef = useRef(selectedDeviceId);
  activeIdRef.current = selectedDeviceId;

  useEffect(() => {
    startWS();

    const handle = debounce(async (msg) => {
      if (!msg || msg.device_id !== activeIdRef.current) return;

      try {
        const latest = await fetchDeviceData(activeIdRef.current);
        setters.setDeviceData(latest);

        if (setters.appendAccelPoint && latest?.accelerometer) {
          setters.appendAccelPoint({
            time: new Date().toLocaleTimeString(),
            x: latest.accelerometer.x ?? null,
            y: latest.accelerometer.y ?? null,
            z: latest.accelerometer.z ?? null,
          });
        }
      } catch {}
    }, 150);

    const off = onWSMessage(handle);
    return () => off();
  }, [setters]);
}

