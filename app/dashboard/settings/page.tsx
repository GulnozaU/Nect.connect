
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasXPlatformAccess } from "@/lib/subscription";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, linkedin_connected, facebook_connected, x_connected, google_calendar_connected, plan, pro_trial_ends_at, pro_trial_used")
    .eq("id", user.id)
    .maybeSingle();

  const row = profile as {
    plan?: string | null;
    pro_trial_ends_at?: string | null;
    pro_trial_used?: boolean | null;
  } | null;

  const billing = {
    plan: (row?.plan ?? "free").toLowerCase(),
    proTrialEndsAt: row?.pro_trial_ends_at ?? null,
    proTrialUsed: Boolean(row?.pro_trial_used),
    xEntitled: hasXPlatformAccess(row ?? {}),
  };

  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-5 py-10 text-sm text-zinc-500">Loading settings…</div>}>
      <SettingsClient
        user={{ id: user.id, email: user.email ?? "", name: profile?.full_name ?? "" }}
        connected={{
          linkedin:        !!profile?.linkedin_connected,
          x:               !!profile?.x_connected,
          googleCalendar:  !!profile?.google_calendar_connected,
        }}
        billing={billing}
      />
    </Suspense>
  );
}