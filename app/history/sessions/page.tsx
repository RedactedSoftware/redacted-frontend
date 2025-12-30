"use client";

import { useEffect, useState } from "react";

type SessionRow = {
  id: number;
  device_id: string;
  started_at: string;
  ended_at: string | null;
  label: string | null;
};

export default function SessionsHistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found - please log in");
          return;
        }

        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082";

        const res = await fetch(`${API_BASE}/api/sessions/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error ${res.status}: ${text}`);
        }

        const data = (await res.json()) as SessionRow[];
        setSessions(data);
      } catch (e: any) {
        setError(e.message || "Failed to load sessions");
      }
    };

    load();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Session History</h1>

      {error && (
        <p style={{ color: "tomato", marginTop: 8 }}>
          {error}
        </p>
      )}

      {!error && sessions.length === 0 && (
        <p style={{ marginTop: 8 }}>No sessions found.</p>
      )}

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {sessions.map((s) => {
          const started = new Date(s.started_at);
          const ended = s.ended_at ? new Date(s.ended_at) : null;

          const durationMs = ended ? ended.getTime() - started.getTime() : null;
          const durationMin =
            durationMs == null ? null : Math.round(durationMs / 60000);

          return (
            <div
              key={s.id}
              style={{
                border: "1px solid #333",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Session #{s.id}</strong>
                <span>
                  {ended ? `${durationMin} min` : "In progress"}
                </span>
              </div>

              <div style={{ marginTop: 6 }}>
                <div>Device: {s.device_id}</div>
                <div>Start: {started.toLocaleString()}</div>
                <div>
                  End: {ended ? ended.toLocaleString() : "—"}
                </div>
                <div>Label: {s.label ?? "—"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
