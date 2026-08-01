import { NextRequest, NextResponse } from "next/server";
import { addScan, listScans } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listScans());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (typeof body.roomId !== "string" || typeof body.signalPercent !== "number") {
    return NextResponse.json(
      { error: "roomId and signalPercent are required" },
      { status: 400 }
    );
  }
  const scan = await addScan({
    roomId: body.roomId,
    ssid: body.ssid ?? null,
    signalPercent: body.signalPercent,
    rssiDbm: body.rssiDbm ?? null,
    band: body.band ?? null,
    channel: body.channel ?? null,
    radioType: body.radioType ?? null,
    receiveRateMbps: body.receiveRateMbps ?? null,
    transmitRateMbps: body.transmitRateMbps ?? null,
    notes: typeof body.notes === "string" ? body.notes : "",
    takenAt: new Date().toISOString(),
  });
  return NextResponse.json(scan, { status: 201 });
}
