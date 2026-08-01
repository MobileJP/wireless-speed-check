import { NextRequest, NextResponse } from "next/server";
import { addRoom, listRooms } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listRooms());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Room name is required" }, { status: 400 });
  }
  const room = await addRoom(name);
  return NextResponse.json(room, { status: 201 });
}
