/** Shared X OAuth 2.0 (PKCE) redirect URI — must match X Developer Portal callback URL exactly. */

export function getXRedirectUri(requestUrl: string): string {
  const trimmed = process.env.X_REDIRECT_URI?.trim();
  if (trimmed) return trimmed;
  return `${new URL(requestUrl).origin}/api/auth/x/callback`;
}
