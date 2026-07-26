"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Room, Scan } from "@/lib/types";

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [roomsRes, scansRes] = await Promise.all([fetch("/api/rooms"), fetch("/api/scans")]);
    setRooms(await roomsRes.json());
    setScans(await scansRes.json());
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    const name = newRoomName.trim();
    if (!name) return;
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setNewRoomName("");
    refresh();
  }

  async function removeRoom(id: string) {
    if (!confirm("Delete this room and all its scans?")) return;
    await fetch(`/api/rooms/${id}`, { method: "DELETE" });
    refresh();
  }

  function lastScanFor(roomId: string): Scan | undefined {
    return scans
      .filter((s) => s.roomId === roomId)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt))[0];
  }

  if (loading) return <p className="text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Rooms</h1>
      <p className="mb-4 text-sm text-slate-600">
        Walk to each room, scan it, and build up a signal-strength map of your home.
      </p>

      <form onSubmit={addRoom} className="mb-6 flex gap-2">
        <input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="e.g. Kitchen"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!newRoomName.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Add room
        </button>
      </form>

      {rooms.length === 0 ? (
        <p className="text-sm text-slate-500">No rooms yet — add one above to get started.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rooms.map((room) => {
            const last = lastScanFor(room.id);
            return (
              <li
                key={room.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <div className="font-medium">{room.name}</div>
                  <div className="text-xs text-slate-500">
                    {last
                      ? `Last scan: ${last.signalPercent}% · ${new Date(last.takenAt).toLocaleString()}`
                      : "Not scanned yet"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/scan/${room.id}`}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Scan
                  </Link>
                  <button
                    onClick={() => removeRoom(room.id)}
                    className="text-sm text-slate-400 hover:text-red-600"
                    aria-label={`Delete ${room.name}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
