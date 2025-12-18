"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://YOUR_EC2_IP_HERE:8082";

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

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">My Devices</h2>
        <button
          onClick={loadDevices}
          className="text-xs border rounded px-2 py-1 border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading devices…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && devices.length === 0 && (
        <p className="text-sm text-slate-400">
          You haven&apos;t registered any devices yet.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {devices.map((d) => (
          <div
            key={d.device_id}
            className="border rounded-lg p-3 text-sm bg-slate-950/40 border-slate-700 flex flex-col gap-1"
          >
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
        ))}
      </div>
    </div>
  );
}
