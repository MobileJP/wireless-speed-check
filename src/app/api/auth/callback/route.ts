import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const settingsUrl = new URL("/settings", request.nextUrl.origin);

  if (!code) {
    settingsUrl.searchParams.set("error", "Google did not return an auth code");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    await exchangeCodeForTokens(code);
    settingsUrl.searchParams.set("connected", "1");
  } catch (err) {
    settingsUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to connect Google"
    );
  }
  return NextResponse.redirect(settingsUrl);
}
