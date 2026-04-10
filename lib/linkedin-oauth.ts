export const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
export const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export const LINKEDIN_OAUTH_SCOPES = ["openid", "profile", "email"].join(" ");

export function getLinkedInRedirectUri(): string {
  let uri: string;

  
  if (typeof window !== "undefined") {
    uri = `${window.location.origin}/api/auth/linkedin/callback`;
  } else {
    uri = "http://localhost:3001/api/auth/linkedin/callback";
  }

  console.log("DEBUG: Sending Redirect URI to LinkedIn ->", uri);
  return uri;
}