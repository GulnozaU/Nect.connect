"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/platforms";

export async function completeOnboarding(
  fullName: string,
  preferredPlatforms: PlatformKey[]
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

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? undefined,
      full_name: fullName.trim(),
      preferred_platforms: sanitizedPlatforms,
      has_onboarded: true,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
}
