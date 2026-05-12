import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasXPlatformAccess } from "@/lib/subscription";

/** Starts a one-time 14-day Pro trial (unlocks X) if the user has not used it yet. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from("profiles")
    .select("plan, pro_trial_ends_at, pro_trial_used")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
  }

  const profile = row as {
    plan?: string | null;
    pro_trial_ends_at?: string | null;
    pro_trial_used?: boolean | null;
  };

  if (hasXPlatformAccess(profile)) {
    return NextResponse.json({
      ok: true,
      message: "You already have Pro or an active trial.",
      pro_trial_ends_at: profile.pro_trial_ends_at,
    });
  }

  if (profile.pro_trial_used) {
    return NextResponse.json(
      {
        error: "Free trial already used. Upgrade to Pro to connect X.",
        code: "trial_spent",
      },
      { status: 403 }
    );
  }

  const ends = new Date();
  ends.setDate(ends.getDate() + 14);

  const { error: upErr } = await supabase
    .from("profiles")
    .update({
      pro_trial_ends_at: ends.toISOString(),
      pro_trial_used: true,
    })
    .eq("id", user.id);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    pro_trial_ends_at: ends.toISOString(),
  });
}
