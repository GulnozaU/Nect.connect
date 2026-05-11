import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchConversationReplies,
  fetchTweetMetrics,
  refreshXAccessToken,
} from "@/lib/x-twitter";

export type PostMetricsPayload = {
  impressions: number | null;
  likes: number;
  shares: number;
  comments: number;
  source: "x" | "none";
  error?: string;
};

export type CommentPayload = {
  id: string;
  /** X tweet id — use as `in_reply_to_tweet_id` when posting a reply. */
  tweetId: string;
  scheduledPostId: string;
  rootTweetId: string;
  platform: string;
  author: string;
  text: string;
  createdAt: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = user.id;

  const { data: posts, error: postsError } = await supabase
    .from("scheduled_posts")
    .select("id, platform, status, text, platform_post_id, created_at")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(15);

  if (postsError) {
    console.error("[analytics/insights] posts:", postsError.message);
    return NextResponse.json({ error: "Failed to load posts." }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("x_access_token, x_refresh_token, x_connected, linkedin_access_token, linkedin_connected")
    .eq("id", userId)
    .single();

  const metricsByPostId: Record<string, PostMetricsPayload> = {};
  const comments: CommentPayload[] = [];

  let xToken = profile?.x_access_token ?? null;
  const xRefresh = profile?.x_refresh_token ?? null;

  async function ensureXToken(): Promise<string | null> {
    if (xToken) return xToken;
    if (!xRefresh) return null;
    const refreshed = await refreshXAccessToken(xRefresh);
    if (!refreshed?.access_token) return null;
    xToken = refreshed.access_token;
    await supabase
      .from("profiles")
      .update({
        x_access_token: refreshed.access_token,
        x_refresh_token: refreshed.refresh_token ?? xRefresh,
      })
      .eq("id", userId);
    return xToken;
  }

  const list = posts ?? [];

  for (const p of list) {
    if (!p.platform_post_id) {
      metricsByPostId[p.id] = {
        impressions: null,
        likes: 0,
        shares: 0,
        comments: 0,
        source: "none",
        error: "No platform post id (published before tracking was enabled).",
      };
      continue;
    }

    if (p.platform === "x" && profile?.x_connected) {
      const token = await ensureXToken();
      if (!token) {
        metricsByPostId[p.id] = {
          impressions: null,
          likes: 0,
          shares: 0,
          comments: 0,
          source: "none",
          error: "X session expired. Reconnect X in Settings.",
        };
        continue;
      }

      let m = await fetchTweetMetrics(token, p.platform_post_id);
      if (!m) {
        const again = await ensureXToken();
        if (again && again !== token) {
          m = await fetchTweetMetrics(again, p.platform_post_id);
        }
      }

      if (m) {
        metricsByPostId[p.id] = {
          impressions: m.impressions,
          likes: m.likes,
          shares: m.shares,
          comments: m.comments,
          source: "x",
        };
      } else {
        metricsByPostId[p.id] = {
          impressions: null,
          likes: 0,
          shares: 0,
          comments: 0,
          source: "none",
          error: "Could not load X metrics for this post.",
        };
      }
      continue;
    }

    if (p.platform === "linkedin" && profile?.linkedin_connected) {
      // w_member_social alone does not expose member post analytics; show honest empty state in UI.
      metricsByPostId[p.id] = {
        impressions: null,
        likes: 0,
        shares: 0,
        comments: 0,
        source: "none",
        error:
          "LinkedIn post analytics require additional LinkedIn API access (member post analytics).",
      };
      continue;
    }

    metricsByPostId[p.id] = {
      impressions: null,
      likes: 0,
      shares: 0,
      comments: 0,
      source: "none",
    };
  }

  // X reply text (search) — best effort, first 5 X posts with ids
  const tokenForSearch = await ensureXToken();
  if (tokenForSearch) {
    const xPosts = list.filter((p) => p.platform === "x" && p.platform_post_id).slice(0, 5);
    for (const p of xPosts) {
      const replies = await fetchConversationReplies(tokenForSearch, p.platform_post_id!);
      for (const r of replies) {
        comments.push({
          id: `${p.id}-${r.id}`,
          tweetId: r.id,
          scheduledPostId: p.id,
          rootTweetId: p.platform_post_id!,
          platform: "x",
          author: r.authorUsername,
          text: r.text,
          createdAt: r.createdAt,
        });
      }
    }
  }

  comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ metricsByPostId, comments });
}
