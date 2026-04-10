import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const origin = new URL(request.url).origin;

  if (!user) {
    const to = new URL("/auth", origin);
    to.searchParams.set("next", "/dashboard");
    to.searchParams.set("intent", "connect");
    return NextResponse.redirect(to);
  }

  const to = new URL("/dashboard", origin);
  to.searchParams.set("connect", "x");
  to.searchParams.set("message", "X OAuth endpoint is scaffolded and ready for implementation.");
  return NextResponse.redirect(to);
}
