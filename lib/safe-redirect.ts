/**
 * Restricts post-login redirects to same-origin paths (blocks open redirects).
 */
export function sanitizeRelativeNextPath(
  value: string | null | undefined,
  fallback: string
): string {
  if (!value || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (/[\0\r\n\\]/.test(trimmed)) return fallback;
  return trimmed;
}
