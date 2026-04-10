import { redirect } from "next/navigation";

import { OnboardingGate } from "@/components/onboarding-gate";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_onboarded, full_name, preferred_platforms")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.has_onboarded) {
    redirect("/dashboard");
  }

  return (
    <OnboardingGate
      initialFullName={profile?.full_name ?? ""}
      initialPlatforms={profile?.preferred_platforms ?? []}
    />
  );
}
