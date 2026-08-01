import { NextResponse } from "next/server";
import { listRooms, listScans } from "@/lib/store";

export const dynamic = "force-dynamic";

const HEADER = [
  "Room",
  "Signal %",
  "RSSI (dBm)",
  "SSID",
  "Band",
  "Channel",
  "Radio Type",
  "Notes",
  "Taken At",
];

function csvCell(value: string | number | null): string {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const [rooms, scans] = await Promise.all([listRooms(), listScans()]);
  const roomName = new Map(rooms.map((r) => [r.id, r.name]));

  const lines = [HEADER.map(csvCell).join(",")];
  for (const scan of scans) {
    lines.push(
      [
        roomName.get(scan.roomId) ?? "Unknown room",
        scan.signalPercent,
        scan.rssiDbm,
        scan.ssid,
        scan.band,
        scan.channel,
        scan.radioType,
        scan.notes,
        scan.takenAt,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const csv = lines.join("\r\n");
  const filename = `wifi-scans-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
