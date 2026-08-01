"use client";

import { useEffect, useState } from "react";
import type { Room, Scan } from "@/lib/types";

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

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

  const sorted = [...scans].sort((a, b) => b.takenAt.localeCompare(a.takenAt));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">History</h1>
        {/* File download, not a page navigation -- next/link would client-route it instead of letting the browser download it. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/scans/export"
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          Export CSV
        </a>
      </div>

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
