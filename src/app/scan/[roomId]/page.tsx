"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SignalMeter from "@/components/SignalMeter";
import type { Room, WifiReading } from "@/lib/types";

export default function ScanRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [scanning, setScanning] = useState(false);
  const [reading, setReading] = useState<WifiReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((rooms: Room[]) => setRoom(rooms.find((r) => r.id === roomId) ?? null));
  }, [roomId]);

  async function runScan() {
    setScanning(true);
    setError(null);
    setReading(null);
    try {
      const res = await fetch("/api/wifi/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      if (!data.connected) {
        setError("This device isn't connected to WiFi right now.");
      } else {
        setReading(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function saveAndContinue(goHome: boolean) {
    if (!reading || reading.signalPercent == null) return;
    setSaving(true);
    await fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        ssid: reading.ssid,
        signalPercent: reading.signalPercent,
        rssiDbm: reading.rssiDbm,
        band: reading.band,
        channel: reading.channel,
        radioType: reading.radioType,
        receiveRateMbps: reading.receiveRateMbps,
        transmitRateMbps: reading.transmitRateMbps,
        notes,
      }),
    });
    setSaving(false);
    if (goHome) {
      router.push("/");
    } else {
      setReading(null);
      setNotes("");
    }
  }

  if (!room) {
    return (
      <p className="text-sm text-slate-500">
        Room not found. <Link href="/" className="text-indigo-600">Back to rooms</Link>
      </p>
    );
  }

  return (
    <div>
      <Link href="/" className="mb-3 inline-block text-sm text-slate-500 hover:text-slate-900">
        &larr; Back to rooms
      </Link>
      <h1 className="mb-4 text-xl font-semibold">{room.name}</h1>

      {!reading && (
        <button
          onClick={runScan}
          disabled={scanning}
          className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {scanning ? "Scanning (taking 3 readings)..." : "Scan WiFi"}
        </button>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {reading && reading.signalPercent != null && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <SignalMeter signalPercent={reading.signalPercent} rssiDbm={reading.rssiDbm} />
            <dl className="mt-4 grid grid-cols-2 gap-y-1 text-sm text-slate-600">
              <dt>SSID</dt>
              <dd className="text-right">{reading.ssid ?? "—"}</dd>
              <dt>Band</dt>
              <dd className="text-right">{reading.band ?? "—"}</dd>
              <dt>Channel</dt>
              <dd className="text-right">{reading.channel ?? "—"}</dd>
              <dt>Radio type</dt>
              <dd className="text-right">{reading.radioType ?? "—"}</dd>
            </dl>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. near the microwave"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => saveAndContinue(true)}
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Save &amp; back to rooms
            </button>
            <button
              onClick={() => saveAndContinue(false)}
              disabled={saving}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Save &amp; scan again
            </button>
            <button
              onClick={runScan}
              disabled={saving || scanning}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Discard &amp; retest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
