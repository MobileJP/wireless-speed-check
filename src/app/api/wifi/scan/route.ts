import { NextResponse } from "next/server";
import { scanWifi } from "@/lib/wifiScan";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const reading = await scanWifi();
    return NextResponse.json(reading);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "WiFi scan failed" },
      { status: 500 }
    );
  }
}
