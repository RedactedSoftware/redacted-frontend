// API Configuration
import { API_BASE } from './constants';

// Safe JSON parser that validates content-type first
async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  if (!ct.includes("application/json")) {
    throw new Error(`Expected JSON but got ${ct}. Body: ${text.slice(0, 200)}`);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON: ${text.slice(0, 100)}`);
  }
}

// Fetch devices - token gated, bulletproof
export const fetchDeviceList = async () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    console.warn("❌ fetchDeviceList: No token available");
    return [];
  }

  const url = `${API_BASE}/api/devices`;
  console.log("📱 devices fetch:", url);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await safeJson(res);
    console.log('[v0] Fetched device list from API:', data);
    
    // Map backend response (device_id) to UI expectation (id)
    return data.map((d: any) => ({
      id: d.device_id,
      name: d.name ?? d.device_id,
      registered_at: d.registered_at,
    }));
  } catch (error) {
    console.error('❌ Error fetching device list:', error);
    throw error;
  }
};
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