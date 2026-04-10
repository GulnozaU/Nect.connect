/**
 * LinkedIn OAuth 2.0 (OpenID Connect) — authorize and token URLs.
 * Scopes: openid, profile, email — userinfo returns `sub` (person id).
 */

export const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
export const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export const LINKEDIN_OAUTH_SCOPES = ["openid", "profile", "email"].join(" ");

export function getLinkedInRedirectUri(): string {
  const explicit = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;
  if (explicit) return explicit;

  if (process.env.NODE_ENV === "production") {
    return "https://v0-forge-five.vercel.app/api/auth/linkedin/callback";
  }
  return "http://localhost:3000/api/auth/linkedin/callback";
}
