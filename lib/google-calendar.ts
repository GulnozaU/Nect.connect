import { google } from "googleapis";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI!
  );
}

export function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force refresh_token to be returned every time
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });
}

export async function getCalendarClient(
  accessToken: string,
  refreshToken: string,
  expiryDate: string | null
) {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate ? new Date(expiryDate).getTime() : undefined,
  });

  // Auto-refresh if expired
  client.on("tokens", (tokens) => {
    // Caller is responsible for persisting updated tokens
    if (tokens.access_token) {
      client.setCredentials(tokens);
    }
  });

  return google.calendar({ version: "v3", auth: client });
}