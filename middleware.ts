import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/auth" || pathname.startsWith("/auth/");
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isOnboarding = pathname === "/onboarding";

  let hasOnboarded = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_onboarded")
      .eq("id", user.id)
      .maybeSingle();
    hasOnboarded = Boolean(profile?.has_onboarded);
  }

  if (isDashboard && user && !hasOnboarded) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isOnboarding && user && hasOnboarded) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = hasOnboarded ? "/dashboard" : "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Supabase session middleware on OAuth callbacks so PKCE cookies are not touched mid-request.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
