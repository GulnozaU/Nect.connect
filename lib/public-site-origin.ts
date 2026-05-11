/**
 * Browser origin for Supabase `redirectTo` / `emailRedirectTo`.
 * If `NEXT_PUBLIC_SITE_URL` is set (e.g. https://nect.com), it overrides
 * `window.location.origin` so redirects match Supabase "Redirect URLs"
 * (www vs apex, or visiting a hostname you did not allowlist).
 */
export function getPublicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol === "http:" || u.protocol === "https:") return u.origin;
    } catch {
      /* ignore invalid env */
    }
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
