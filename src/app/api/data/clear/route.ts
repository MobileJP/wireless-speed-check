import { NextResponse } from "next/server";
import { clearAllData } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearAllData();
  return NextResponse.json({ ok: true });
}
