"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://YOUR_EC2_IP_HERE:8082";

type DeviceRegisterFormProps = {
  token: string | null;
};

export function DeviceRegisterForm({ token }: DeviceRegisterFormProps) {
  const [serial, setSerial] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!token) {
      setLoading(false);
      setError("You must be logged in to register a device.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/devices/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          device_id: serial.trim(),
          name: nickname.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Failed to register device");
      }

      setMessage("Device registered successfully ✅");
      setSerial("");
      setNickname("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 max-w-md border rounded-xl p-4 bg-slate-950/40 border-slate-700"
    >
      <h2 className="text-lg font-semibold text-white">Register a Device</h2>
      <p className="text-sm text-slate-400">
        Enter the serial number printed on your tracker to link it to your
        account.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-200">
          Serial Number
        </label>
        <input
          className="border rounded px-3 py-2 text-sm bg-slate-900 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="e.g. PICO-001"
          value={serial}
          onChange={(e) => setSerial(e.target.value.toUpperCase())}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-200">
          Nickname{" "}
          <span className="text-xs text-slate-500">(optional)</span>
        </label>
        <input
          className="border rounded px-3 py-2 text-sm bg-slate-900 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="My Pico 1"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md border px-4 py-2 text-sm font-medium text-white bg-cyan-600/80 border-cyan-500 hover:bg-cyan-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Registering…" : "Register Device"}
      </button>

      {message && <p className="text-sm text-green-400">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
