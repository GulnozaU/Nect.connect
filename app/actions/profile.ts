"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/platforms";

export async function completeOnboarding(
  fullName: string,
  preferredPlatforms: PlatformKey[],
  options?: { startProTrial?: boolean }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in.");
  }

  const sanitizedPlatforms = preferredPlatforms.filter((platform) =>
    PLATFORM_KEYS.includes(platform)
  );

  const { data: existing } = await supabase
    .from("profiles")
    .select("pro_trial_used, pro_trial_ends_at, plan")
    .eq("id", user.id)
    .maybeSingle();

  const trialPayload: Record<string, unknown> = {};
  const wantsTrial = Boolean(options?.startProTrial);
  if (wantsTrial && !(existing as { pro_trial_used?: boolean } | null)?.pro_trial_used) {
    const ends = new Date();
    ends.setDate(ends.getDate() + 14);
    trialPayload.pro_trial_ends_at = ends.toISOString();
    trialPayload.pro_trial_used = true;
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? undefined,
      full_name: fullName.trim(),
      preferred_platforms: sanitizedPlatforms,
      has_onboarded: true,
      ...trialPayload,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
}
