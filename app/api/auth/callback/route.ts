import { NextRequest, NextResponse } from "next/server";

import { sanitizeRelativeNextPath } from "@/lib/safe-redirect";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const type = url.searchParams.get("type");

  const next = sanitizeRelativeNextPath(nextParam, "/dashboard");
  const finalPath = type === "recovery" ? "/auth/update-password" : next;

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth?error=auth_callback_failed", url.origin)
    );
  }

  const response = NextResponse.redirect(new URL(finalPath, url.origin));
  const supabase = createRouteHandlerSupabase(request, response);

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Code exchange failed:", error.message);
    return NextResponse.redirect(
      new URL("/auth?error=auth_callback_failed", url.origin)
    );
  }

  return response;
}
