import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

/**
 * Supabase client for Route Handlers that return a NextResponse (e.g. OAuth callback).
 * Binds Set-Cookie to the same response as the redirect so the session is persisted.
 */
export function createRouteHandlerSupabase(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
