"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

type Session = {
  id: string;
  device_id: string;
  started_at: string;
  ended_at: string;
  label: string | null;
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

function formatDuration(startedAt: string, endedAt: string): string {
  try {
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    const durationMs = end - start;
    const durationMins = Math.floor(durationMs / 60000);
    
    if (durationMins < 60) return `${durationMins} min`;
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    return `${hours}h ${mins}m`;
  } catch {
    return "N/A";
  }
}

export default function HistoryPage() {
  // theme
  const { theme: themeValue, setTheme, resolvedTheme } = useTheme();
  const currentTheme = (resolvedTheme ?? themeValue) as string;
  const [mounted, setMounted] = useState(false);

  // history data
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // load sessions from API
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found - please log in");
        }

        const API_BASE = process.env.NEXT_PUBLIC_API_URL;
        if (!API_BASE) {
          throw new Error("NEXT_PUBLIC_API_URL is not configured");
        }

        const response = await fetch(`${API_BASE}/api/sessions/history`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized - please log in");
          }
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
        }

        const data: Session[] = await response.json();

        if (!cancelled) {
          setSessions(data || []);
        }
      } catch (err: any) {
        console.error("Sessions load failed:", err);
        if (!cancelled) {
          const msg =
            err && err.message
              ? String(err.message)
              : "Failed to load session history";
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

  const totalSessions = sessions.length;
  const devices = Array.from(new Set(sessions.map((s) => s.device_id)));
  const firstTs = sessions[sessions.length - 1]?.started_at;
  const lastTs = sessions[0]?.started_at;

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const month = monthNames[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear().toString().slice(-2);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const dayName = dayNames[date.getUTCDay()];
    
    return {
      date: `${month} ${day}`,
      time: `${hours}:${minutes}`,
      full: `${dayName}, ${month} ${day}, ${year} ${hours}:${minutes}`
    };
  };

  return (
    <div className="min-h-screen bg-[#0f1729] text-white">
      <header className="border-b border-slate-700/30 bg-[#1a2438] sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Session History
            </h1>
            <p className="text-xs text-slate-400">
              View your recorded tracking sessions
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <a
              href="/map"
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-cyan-600/30 hover:shadow-cyan-600/50 hover:from-cyan-500 hover:to-cyan-400 transition-all duration-200 hover:translate-y-[-2px]"
            >
              <span className="text-lg">🗺️</span>
              <span className="hidden sm:inline">View Live Map</span>
              <span className="sm:hidden">Live Map</span>
            </a>
            <a
              href="/"
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 text-white font-medium text-xs sm:text-sm border border-slate-500/40 shadow-lg shadow-slate-700/30 hover:shadow-slate-700/50 hover:from-slate-600 hover:to-slate-500 transition-all duration-200 hover:translate-y-[-2px] hover:border-slate-500/60"
            >
              <span className="text-lg">📊</span>
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </a>

            <button
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600/30 text-white font-medium text-xs sm:text-sm hover:bg-slate-600/50 transition-all duration-200"
              onClick={() =>
                mounted &&
                setTheme(currentTheme === "dark" ? "light" : "dark")
              }
              aria-pressed={mounted ? (currentTheme === "dark") : undefined}
            >
              {mounted ? (
                <>
                  <span className="text-lg">
                    {currentTheme === "dark" ? "🌙" : "☀️"}
                  </span>
                  <span className="hidden sm:inline">
                    {currentTheme === "dark" ? "Dark" : "Light"}
                  </span>
                </>
              ) : (
                <span>Theme</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <SummaryCard
            label="Total Sessions"
            value={totalSessions.toString()}
            icon="📊"
            helper={totalSessions === 1 ? "1 recorded session" : `${totalSessions} recorded sessions`}
          />
          <SummaryCard
            label="Devices Tracked"
            value={devices.length.toString()}
            icon="📱"
            helper={devices.length === 1 ? "1 device" : `${devices.length} unique devices`}
          />
          <SummaryCard
            label="Time Span"
            value={firstTs && lastTs ? formatDateShort(firstTs).date : "—"}
            icon="📅"
            helper={firstTs && lastTs ? `${formatDateShort(firstTs).time} to ${formatDateShort(lastTs).time}` : "No sessions"}
          />
        </div>

        {/* Sessions list */}
        <section className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              📋 Your Sessions
            </h2>
            {loading && (
              <span className="text-xs text-slate-300 animate-pulse">Loading…</span>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No sessions recorded yet</p>
            </div>
          )}

          {!loading && !error && sessions.length > 0 && (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {sessions.map((session) => {
                const startInfo = formatDateShort(session.started_at);
                const endInfo = session.ended_at ? formatDateShort(session.ended_at) : null;
                const duration = session.ended_at ? formatDuration(session.started_at, session.ended_at) : "In progress";
                
                return (
                  <div
                    key={session.id}
                    className="bg-[#0f1729] border border-slate-700/40 rounded-lg p-3 sm:p-4 hover:border-cyan-500/50 hover:bg-[#152541] transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <div className="text-lg flex-shrink-0">🕐</div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-sm sm:text-base truncate">
                              {startInfo.date} at {startInfo.time}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {session.label || `Session ID: ${session.id}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 ml-6 sm:ml-7">
                          <span className="text-xs bg-slate-700/40 text-slate-300 px-2 py-1 rounded whitespace-nowrap">
                            📱 {session.device_id.substring(0, 12)}...
                          </span>
                          <span className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-1 rounded whitespace-nowrap">
                            ⏱️ {duration}
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl group-hover:translate-x-1 transition-transform flex-shrink-0 hidden sm:block">
                        →
                      </div>
                    </div>
                  </div>
                );
              })}
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
  icon,
  helper,
}: {
  label: string;
  value: string;
  icon?: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl bg-[#1e2d44] border border-slate-700/30 p-4 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </div>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {helper && (
        <div className="text-[11px] text-slate-400 leading-snug">
          {helper}
        </div>
      )}
    </div>
  );
}
