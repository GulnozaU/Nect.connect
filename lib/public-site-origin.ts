/**
 * Browser origin for Supabase `redirectTo` / `emailRedirectTo`.
 * If `NEXT_PUBLIC_SITE_URL` is set (e.g. https://nect.com), it overrides
 * `window.location.origin` so redirects match Supabase "Redirect URLs"
 * (www vs apex, or visiting a hostname you did not allowlist).
 *
 * If the env points at a leftover `*.vercel.app` preview (e.g. v0 Forge) but
 * the user is on another host (custom domain or a different deployment), using
 * that env would send OAuth to the wrong app. In that case we use the current
 * page origin instead.
 */
export function getPublicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw && typeof window !== "undefined") {
    try {
      const u = new URL(raw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return window.location.origin;
      }
      const envOrigin = u.origin;
      const here = window.location.origin;
      const envHost = u.hostname;
      const envIsVercelPreview =
        envHost.endsWith(".vercel.app") || envHost === "vercel.app";
      if (envIsVercelPreview && envOrigin !== here) {
        console.warn(
          "[auth] NEXT_PUBLIC_SITE_URL (%s) does not match this page (%s); using the current origin for OAuth redirects. Remove or fix NEXT_PUBLIC_SITE_URL in Vercel if this was unintentional.",
          envOrigin,
          here
        );
        return here;
      }
      return envOrigin;
    } catch {
      return window.location.origin;
    }
  }
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
