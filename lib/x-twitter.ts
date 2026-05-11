/** X / Twitter API v2 helpers (OAuth user access token). */

import type { SupabaseClient } from "@supabase/supabase-js";

const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";

export type TweetMetrics = {
  impressions: number | null;
  likes: number;
  shares: number;
  comments: number;
};

export async function refreshXAccessToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token?: string } | null> {
  const id = process.env.X_CLIENT_ID;
  const secret = process.env.X_CLIENT_SECRET;
  if (!id || !secret) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: id,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; refresh_token?: string };
  if (!data.access_token) return null;
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

export async function fetchTweetMetrics(accessToken: string, tweetId: string): Promise<TweetMetrics | null> {
  const url = new URL(`https://api.twitter.com/2/tweets/${encodeURIComponent(tweetId)}`);
  url.searchParams.set(
    "tweet.fields",
    "public_metrics,non_public_metrics"
  );

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: {
      public_metrics?: {
        like_count?: number;
        reply_count?: number;
        retweet_count?: number;
        quote_count?: number;
      };
      non_public_metrics?: { impression_count?: number };
    };
  };

  const pm = json.data?.public_metrics;
  if (!pm) return null;

  const impressions = json.data?.non_public_metrics?.impression_count ?? null;
  const likes = pm.like_count ?? 0;
  const comments = pm.reply_count ?? 0;
  const shares = (pm.retweet_count ?? 0) + (pm.quote_count ?? 0);

  return { impressions, likes, shares, comments };
}

export type TweetReply = {
  id: string;
  text: string;
  authorUsername: string;
  authorName: string;
  createdAt: string;
};

/** Best-effort: recent search for thread replies (may fail on restricted API tiers). */
export async function fetchConversationReplies(
  accessToken: string,
  rootTweetId: string
): Promise<TweetReply[]> {
  const q = `conversation_id:${rootTweetId}`;
  const url = new URL("https://api.twitter.com/2/tweets/search/recent");
  url.searchParams.set("query", q);
  url.searchParams.set("max_results", "50");
  url.searchParams.set(
    "tweet.fields",
    "author_id,conversation_id,created_at,in_reply_to_user_id"
  );
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "name,username");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];

  const json = (await res.json()) as {
    data?: Array<{
      id: string;
      text: string;
      author_id: string;
      created_at?: string;
    }>;
    includes?: { users?: Array<{ id: string; username?: string; name?: string }> };
  };

  const users = new Map((json.includes?.users ?? []).map((u) => [u.id, u]));
  const out: TweetReply[] = [];

  for (const t of json.data ?? []) {
    if (t.id === rootTweetId) continue;
    const u = users.get(t.author_id);
    out.push({
      id: t.id,
      text: t.text,
      authorUsername: u?.username ? `@${u.username}` : t.author_id,
      authorName: u?.name ?? u?.username ?? "User",
      createdAt: t.created_at ?? "",
    });
  }

  out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return out;
}

export async function postTweetV2(accessToken: string, text: string): Promise<{
  ok: boolean;
  status: number;
  tweetId?: string;
  body: string;
}> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body };
  try {
    const json = JSON.parse(body) as { data?: { id?: string } };
    return { ok: true, status: res.status, tweetId: json.data?.id, body };
  } catch {
    return { ok: false, status: res.status, body };
  }
}

/** Refresh access token and persist on profile (server-side). */
export async function refreshXPersisted(
  supabase: SupabaseClient,
  userId: string,
  refreshToken: string
): Promise<string | null> {
  const refreshed = await refreshXAccessToken(refreshToken);
  if (!refreshed?.access_token) return null;
  await supabase
    .from("profiles")
    .update({
      x_access_token: refreshed.access_token,
      x_refresh_token: refreshed.refresh_token ?? refreshToken,
    })
    .eq("id", userId);
  return refreshed.access_token;
}
