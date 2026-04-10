

export const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
export const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
export const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export const LINKEDIN_OAUTH_SCOPES = ["openid", "profile", "email"].join(" ");

  export function getLinkedInRedirectUri(): string {
    const explicit = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI;
    if (explicit) return explicit;
  
  
    if (process.env.NODE_ENV === "production") {
      return "http://localhost:3001/api/auth/linkedin/callback";
    }
  
  
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/auth/linkedin/callback`;
    }
  
    return "http://localhost:3001/api/auth/linkedin/callback";
  }

