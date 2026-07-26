import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.redirect(getAuthUrl());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google auth is not configured";
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(message)}`, request.nextUrl.origin)
    );
  }
}
