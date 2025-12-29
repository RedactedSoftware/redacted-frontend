"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  fetchTelemetryHistory,
  TelemetryHistoryItem,
} from "@/api/fetchTelemetryHistory";

type HistoryRow = {
  uid: string;
  device_id: string;
  temp: number | string | null;
  battery_percent: number | null;
  received_at: string;
};

function formatNumber(value: unknown, digits = 1): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(digits);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n.toFixed(digits);
  }
  return "—";
}

export default function HistoryPage() {
  // theme
  const { theme: themeValue, setTheme, resolvedTheme } = useTheme();
  const currentTheme = (resolvedTheme ?? themeValue) as string;
  const [mounted, setMounted] = useState(false);

  // history data
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // load history on mount (no auth needed)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data: TelemetryHistoryItem[] = await fetchTelemetryHistory();

        if (!cancelled) {
          setRows(
            (data || []).map((r) => ({
              uid: r.uid,
              device_id: r.device_id,
              temp: r.temp,
              battery_percent: r.battery_percent,
              received_at: (r.received_at ?? r.created_at) as string,
            }))
          );
        }
      } catch (err: any) {
        console.error("History load failed:", err);
        if (!cancelled) {
          const msg =
            err && err.message
              ? String(err.message)
              : "Failed to load history";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalSamples = rows.length;
  const devices = Array.from(new Set(rows.map((r) => r.device_id)));
  const firstTs = rows[rows.length - 1]?.received_at;
  const lastTs = rows[0]?.received_at;

  return (
    <div className="min-h-screen bg-[#0f1729] text-white">
      <header className="border-b border-slate-700/30 bg-[#1a2438]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              GPS Tracker History
            </h1>
            <p className="text-xs text-slate-400">
              Past telemetry for all recorded devices
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <a
              href="/map"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-500 transition-colors"
            >
              🗺️ View Map
            </a>
            <a
              href="/"
              className="rounded-lg bg-[#2a3e5a] px-4 py-2 text-sm text-white border border-slate-600/30 hover:bg-[#344b68] transition-colors"
            >
              Back to live
            </a>

            <button
              className="rounded-lg px-4 py-2 text-sm border border-slate-600/30 hover:opacity-90 transition-colors flex items-center gap-2"
              onClick={() =>
                mounted &&
                setTheme(currentTheme === "dark" ? "light" : "dark")
              }
              aria-pressed={mounted ? (currentTheme === "dark") : undefined}
            >
              {mounted ? (
                <>
                  <span className="text-yellow-400">
                    {currentTheme === "dark" ? "🌙" : "☀️"}
                  </span>
                  {currentTheme === "dark" ? "Dark" : "Light"}
                </>
              ) : (
                <span className="text-sm">Theme</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Samples"
            value={totalSamples.toString()}
            helper="Rows of telemetry in history"
          />
          <SummaryCard
            label="Devices"
            value={devices.length.toString()}
            helper={devices.join(", ") || "No devices"}
          />
          <SummaryCard
            label="Time Range"
            value={
              firstTs && lastTs
                ? `${new Date(firstTs).toLocaleString()} → ${new Date(
                    lastTs
                  ).toLocaleString()}`
                : "N/A"
            }
            helper="Oldest to newest in this view"
          />
        </div>

        {/* History table */}
        <section className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              Telemetry history (raw)
            </h2>
            {loading && (
              <span className="text-xs text-slate-300">Loading…</span>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 mb-3">
              {error || "Error loading history"}
            </p>
          )}

          {!loading && !error && (
            <div className="max-h-[480px] overflow-auto border border-slate-700/50 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-[#111827] sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-left">Time</th>
                    <th className="p-2 text-left">Device</th>
                    <th className="p-2 text-left">Temp (°C)</th>
                    <th className="p-2 text-left">Battery (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.uid}>
                      <td className="p-2 border-t border-slate-700/40">
                        {row.received_at
                          ? new Date(row.received_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="p-2 border-t border-slate-700/40">
                        {row.device_id}
                      </td>
                      <td className="p-2 border-t border-slate-700/40">
                        {formatNumber(row.temp, 1)}
                      </td>
                      <td className="p-2 border-t border-slate-700/40">
                        {row.battery_percent == null
                          ? "—"
                          : `${row.battery_percent}%`}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-3 text-center text-slate-400 border-t border-slate-700/40"
                      >
                        No historical telemetry found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-4">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold text-white mb-1 truncate">{value}</div>
      {helper && (
        <div className="text-[11px] text-slate-400 leading-snug">
          {helper}
        </div>
      )}
    </div>
  );
}
