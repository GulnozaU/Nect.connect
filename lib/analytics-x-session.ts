import type { SupabaseClient } from "@supabase/supabase-js";
import { refreshXAccessToken } from "@/lib/x-twitter";

/** Returns a usable X bearer token, refreshing and persisting if the access token is empty but refresh exists. */
export async function getValidXAccessToken(
  supabase: SupabaseClient,
  userId: string,
  profile: { x_access_token: string | null; x_refresh_token: string | null } | null
): Promise<string | null> {
  let token = profile?.x_access_token ?? null;
  const refresh = profile?.x_refresh_token ?? null;
  if (token) return token;
  if (!refresh) return null;
  const refreshed = await refreshXAccessToken(refresh);
  if (!refreshed?.access_token) return null;
  await supabase
    .from("profiles")
    .update({
      x_access_token: refreshed.access_token,
      x_refresh_token: refreshed.refresh_token ?? refresh,
    })
    .eq("id", userId);
  return refreshed.access_token;
}
