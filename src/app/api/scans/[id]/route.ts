import { NextResponse } from "next/server";
import { deleteScan } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteScan(id);
  return NextResponse.json({ ok: true });
}
