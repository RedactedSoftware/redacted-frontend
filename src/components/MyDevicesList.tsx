"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

type Device = {
  device_id: string;
  name: string | null;
  registered_at: string;
};

type MyDevicesListProps = {
  token: string | null;
};

export function MyDevicesList({ token }: MyDevicesListProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function loadDevices() {
    setLoading(true);
    setError(null);

    if (!token) {
      setLoading(false);
      setError("Not logged in.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/devices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Failed to load devices");
      }

      const json = (await res.json()) as Device[];
      setDevices(json);
    } catch (err: any) {
      setError(err.message || "Error loading devices");
    } finally {
      setLoading(false);
    }
  }

  async function deleteDevice(deviceId: string) {
    if (!window.confirm(`Are you sure you want to remove this device? This cannot be undone.`)) {
      return;
    }

    setDeleting(deviceId);
    setDeleteError(null);

    if (!token) {
      setDeleteError("Not logged in.");
      setDeleting(null);
      return;
    }

    try {
      console.log(`🗑️ Deleting device: ${deviceId}`);
      
      const res = await fetch(`${API_BASE}/api/devices/${deviceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(`🔍 Delete response status: ${res.status}`);

      if (!res.ok) {
        let errorMsg = "Failed to delete device";
        try {
          const text = await res.text();
          console.error("❌ Delete error response (text):", text);
          
          if (text) {
            const data = JSON.parse(text);
            errorMsg = (data as any).error || errorMsg;
          }
        } catch (e) {
          console.error("❌ Could not parse error response:", e);
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      console.log("✅ Delete successful:", data);

      // Remove device from list
      setDevices(devices.filter((d) => d.device_id !== deviceId));
    } catch (err: any) {
      console.error("🚨 Delete exception:", err);
      setDeleteError(err.message || "Error deleting device");
    } finally {
      setDeleting(null);
    }
  }

  useEffect(() => {
    void loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">My Devices</h2>
        <button
          type="button"
          onClick={() => void loadDevices()}
          className="text-xs border rounded px-2 py-1 border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading devices…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}

      {!loading && !error && devices.length === 0 && (
        <p className="text-sm text-slate-400">
          You haven&apos;t registered any devices yet.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {devices.map((d) => {
          console.log(`📱 Device item - name: "${d.name}", device_id: "${d.device_id}"`);
          return (
          <div
            key={d.device_id}
            className="border rounded-lg p-3 text-sm bg-slate-950/40 border-slate-700 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-semibold text-white">
                  {d.name || "Unnamed Device"}
                </div>
                <div className="text-xs text-slate-400">
                  Serial / ID:{" "}
                  <span className="font-mono text-slate-200">
                    {d.device_id}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Registered: {new Date(d.registered_at).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteDevice(d.device_id)}
                disabled={deleting === d.device_id}
                className="text-xs px-2 py-1 bg-red-900/40 border border-red-700 text-red-300 rounded hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {deleting === d.device_id ? "Deleting…" : "Remove"}
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
