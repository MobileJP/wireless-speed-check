"use client";

import { useEffect, useState } from "react";
import type { Room, Scan } from "@/lib/types";

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const [scansRes, roomsRes] = await Promise.all([fetch("/api/scans"), fetch("/api/rooms")]);
    setScans(await scansRes.json());
    setRooms(await roomsRes.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  function roomName(roomId: string): string {
    return rooms.find((r) => r.id === roomId)?.name ?? "Unknown room";
  }

  async function removeScan(id: string) {
    await fetch(`/api/scans/${id}`, { method: "DELETE" });
    refresh();
  }

  async function syncToSheets() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/scans/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setMessage(
        data.synced === 0 ? "Everything is already synced." : `Synced ${data.synced} scan(s).`
      );
      refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const sorted = [...scans].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  const unsyncedCount = scans.filter((s) => !s.syncedAt).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">History</h1>
        <button
          onClick={syncToSheets}
          disabled={syncing}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {syncing ? "Syncing..." : `Sync to Google Sheets${unsyncedCount ? ` (${unsyncedCount})` : ""}`}
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-500">No scans yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((scan) => (
            <li
              key={scan.id}
              className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <div className="font-medium">{roomName(scan.roomId)}</div>
                <div className="text-xs text-slate-500">
                  {scan.signalPercent}%{scan.rssiDbm != null ? ` · ${scan.rssiDbm} dBm` : ""} ·{" "}
                  {new Date(scan.takenAt).toLocaleString()}
                  {scan.syncedAt ? " · synced" : " · not synced"}
                </div>
                {scan.notes && <div className="mt-1 text-xs text-slate-500">{scan.notes}</div>}
              </div>
              <button
                onClick={() => removeScan(scan.id)}
                className="text-sm text-slate-400 hover:text-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
