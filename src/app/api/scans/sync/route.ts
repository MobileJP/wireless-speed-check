import { NextResponse } from "next/server";
import { listRooms, listScans, markScansSynced } from "@/lib/store";
import { appendRowsToSheet } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST() {
  const scans = listScans().filter((s) => !s.syncedAt);
  if (scans.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  const rooms = new Map(listRooms().map((r) => [r.id, r.name]));

  try {
    await appendRowsToSheet(
      scans.map((s) => ({
        roomName: rooms.get(s.roomId) ?? "Unknown room",
        rssiDbm: s.rssiDbm,
        signalPercent: s.signalPercent,
        takenAt: s.takenAt,
        notes: s.notes,
      }))
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }

  const syncedAt = new Date().toISOString();
  markScansSynced(
    scans.map((s) => s.id),
    syncedAt
  );
  return NextResponse.json({ synced: scans.length });
}
