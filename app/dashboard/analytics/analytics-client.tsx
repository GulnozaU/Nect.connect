// FILE PATH: app/dashboard/analytics/analytics-client.tsx

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart2, Send, Clock, XCircle, Linkedin, Radio,
  TrendingUp, MessageSquare, Eye, ThumbsUp, Share2,
  RefreshCw, Loader2, Rss, ExternalLink,
} from "lucide-react";

type Post = {
  id: string;
  status: string;
  platform: string;
  created_at: string;
  scheduled_at: string;
  text: string;
  platform_post_id?: string | null;
};
type Stats = { total: number; published: number; pending: number; failed: number };

type MetricsRow = {
  impressions: number | null;
  likes: number;
  shares: number;
  comments: number;
  source: string;
  error?: string;
};

type CommentRow = {
  id: string;
  tweetId: string;
  scheduledPostId: string;
  rootTweetId: string;
  platform: string;
  author: string;
  text: string;
  createdAt: string;
};

type FeedTweet = {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  replies: number;
  reposts: number;
};

type FeedResponse = {
  x: { tweets: FeedTweet[]; error?: string };
  linkedin: { available: boolean; message: string };
};

interface Props {
  stats: Stats;
  byPlatform: Record<string, number>;
  weekLabels: string[];
  weekCounts: number[];
  recentPosts: Post[];
  profile: { linkedinConnected: boolean; xConnected: boolean };
}

type Tab = "overview" | "feed" | "impressions" | "comments";

const PLATFORM_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  linkedin: { icon: Linkedin, color: "#0A66C2", label: "LinkedIn" },
  x:        { icon: Radio,    color: "#e4e4e7", label: "X" },
};

function formatInsightDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function AnalyticsClientInner({ stats, byPlatform, weekLabels, weekCounts, recentPosts, profile }: Props) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("overview");
  const [insights, setInsights] = useState<{
    metricsByPostId: Record<string, MetricsRow>;
    comments: CommentRow[];
  } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [replyDraftByTweet, setReplyDraftByTweet] = useState<Record<string, string>>({});
  const [replySendingTweetId, setReplySendingTweetId] = useState<string | null>(null);
  const [replyBanner, setReplyBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const maxWeek = Math.max(...weekCounts, 1);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "overview" || t === "feed" || t === "impressions" || t === "comments") {
      setTab(t);
    }
  }, [searchParams]);

  const loadInsights = useCallback(async () => {
    setLoadingInsights(true);
    setInsightsError(null);
    try {
      const res = await fetch("/api/analytics/insights");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load insights");
      setInsights({
        metricsByPostId: data.metricsByPostId ?? {},
        comments: data.comments ?? [],
      });
    } catch (e) {
      setInsights(null);
      setInsightsError(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const res = await fetch("/api/analytics/feed");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load feed");
      setFeed(data as FeedResponse);
    } catch (e) {
      setFeed(null);
      setFeedError(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "impressions" && tab !== "comments") return;
    if (loadingInsights) return;
    if (insights !== null) return;
    if (insightsError !== null) return;
    void loadInsights();
  }, [tab, insights, insightsError, loadingInsights, loadInsights]);

  useEffect(() => {
    if (tab !== "feed") return;
    if (loadingFeed) return;
    if (feed !== null) return;
    if (feedError !== null) return;
    void loadFeed();
  }, [tab, feed, feedError, loadingFeed, loadFeed]);

  async function submitReply(tweetId: string) {
    const text = (replyDraftByTweet[tweetId] ?? "").trim();
    if (!text) return;
    setReplySendingTweetId(tweetId);
    setReplyBanner(null);
    try {
      const res = await fetch("/api/analytics/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "x", inReplyToTweetId: tweetId, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reply failed");
      setReplyDraftByTweet((prev) => ({ ...prev, [tweetId]: "" }));
      setReplyBanner({ type: "ok", msg: "Reply posted on X." });
      setInsights(null);
      void loadInsights();
    } catch (e) {
      setReplyBanner({ type: "err", msg: e instanceof Error ? e.message : "Reply failed" });
    } finally {
      setReplySendingTweetId(null);
    }
  }

  const statCards = [
    { label: "Total posts",  value: stats.total,     icon: BarChart2, color: "text-zinc-300" },
    { label: "Published",    value: stats.published,  icon: Send,      color: "text-green-400" },
    { label: "Scheduled",    value: stats.pending,    icon: Clock,     color: "text-[#F97316]" },
    { label: "Failed",       value: stats.failed,     icon: XCircle,   color: "text-red-400" },
  ];

  const publishedPosts = recentPosts.filter((p) => p.status === "published");
  const metricsByPostId = insights?.metricsByPostId ?? {};

  const totalImpressions = Object.values(metricsByPostId).reduce(
    (a, b) => a + (typeof b.impressions === "number" ? b.impressions : 0),
    0
  );
  const totalLikes = Object.values(metricsByPostId).reduce((a, b) => a + b.likes, 0);
  const totalShares = Object.values(metricsByPostId).reduce((a, b) => a + b.shares, 0);
  const totalComments = Object.values(metricsByPostId).reduce((a, b) => a + b.comments, 0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">Publishing stats, live X feed, impressions, and thread replies.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <Icon className={`mb-3 h-4 w-4 ${color}`} />
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-zinc-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
        {([
          { key: "overview",    label: "Overview",    icon: BarChart2 },
          { key: "feed",        label: "Feed",        icon: Rss },
          { key: "impressions", label: "Impressions", icon: Eye },
          { key: "comments",    label: "Comments",    icon: MessageSquare },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`flex min-w-[calc(50%-4px)] flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium transition-all sm:min-w-0 ${
              tab === key ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}>
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {replyBanner && (
        <div
          className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
            replyBanner.type === "ok"
              ? "border-green-900/50 bg-green-950/40 text-green-300"
              : "border-red-900/50 bg-red-950/40 text-red-300"
          }`}
          role="status"
        >
          {replyBanner.msg}
        </div>
      )}

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <TrendingUp className="h-4 w-4 text-[#F97316]" />
              Published posts — last 8 weeks
            </h2>
            {stats.published === 0 ? (
              <p className="text-sm text-zinc-700">No published posts yet.</p>
            ) : (
              <div className="flex h-32 items-end gap-2">
                {weekCounts.map((count, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-t-md bg-[#F97316]/50 transition-all duration-300 hover:bg-[#F97316]"
                      style={{ height: `${Math.max((count / maxWeek) * 100, count > 0 ? 10 : 3)}%` }}
                      title={`${count} post${count !== 1 ? "s" : ""}`}
                    />
                    <span className="hidden text-[8px] text-zinc-700 sm:block">{weekLabels[i]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-300">Posts by platform</h2>
            {Object.keys(byPlatform).length === 0 ? (
              <p className="text-sm text-zinc-700">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byPlatform).sort(([, a], [, b]) => b - a).map(([platform, count]) => {
                  const meta = PLATFORM_META[platform];
                  const Icon = meta?.icon ?? BarChart2;
                  const pct  = Math.round((count / stats.total) * 100);
                  return (
                    <div key={platform} className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" style={{ color: meta?.color ?? "#999" }} />
                      <span className="w-20 text-xs capitalize text-zinc-500">{meta?.label ?? platform}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-xs text-zinc-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-300">Recent posts</h2>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-zinc-700">No posts yet.</p>
            ) : (
              <div className="space-y-2">
                {recentPosts.slice(0, 8).map((post) => {
                  const meta = PLATFORM_META[post.platform];
                  const Icon = meta?.icon ?? BarChart2;
                  const statusColor = post.status === "published" ? "text-green-500" : post.status === "failed" ? "text-red-400" : "text-zinc-500";
                  return (
                    <div key={post.id} className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta?.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-zinc-300">{post.text}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-600">
                          {new Date(post.scheduled_at ?? post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium capitalize ${statusColor}`}>{post.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Feed (X timeline + LinkedIn notice) ── */}
      {tab === "feed" && (
        <div className="space-y-5">
          {!profile.xConnected && !profile.linkedinConnected ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-16 text-center">
              <Rss className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">Connect X or LinkedIn in Settings to load a feed.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-600">Your recent posts on X (live API). LinkedIn feed in-app requires additional LinkedIn APIs.</p>
                <button type="button" onClick={() => { setFeed(null); setFeedError(null); void loadFeed(); }} disabled={loadingFeed}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-zinc-200 disabled:opacity-40">
                  {loadingFeed ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Refresh
                </button>
              </div>

              {feedError && (
                <p className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">{feedError}</p>
              )}

              {profile.xConnected && (
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-zinc-300" />
                    <h2 className="text-sm font-semibold text-zinc-200">X — your posts</h2>
                  </div>
                  {loadingFeed && !feed ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}
                    </div>
                  ) : feed?.x.error ? (
                    <p className="text-sm text-amber-200/90">{feed.x.error}</p>
                  ) : (feed?.x.tweets.length ?? 0) === 0 ? (
                    <p className="text-sm text-zinc-600">No tweets in the last fetch. New account or no posts yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {feed!.x.tweets.map((t) => (
                        <li key={t.id} className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
                          <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{t.text}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-zinc-600">
                            <span>{formatInsightDate(t.createdAt)}</span>
                            <span>{t.likes} likes</span>
                            <span>{t.replies} replies</span>
                            <span>{t.reposts} reposts</span>
                            <a
                              href={`https://x.com/i/web/status/${t.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto inline-flex items-center gap-1 text-[#F97316] hover:underline"
                            >
                              Open on X
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {profile.linkedinConnected && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                    <h2 className="text-sm font-semibold text-zinc-300">LinkedIn feed</h2>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-600">{feed?.linkedin.message}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Impressions ── */}
      {tab === "impressions" && (
        <div>
          {!profile.linkedinConnected && !profile.xConnected ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-16 text-center">
              <Eye className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-400">Connect LinkedIn or X to see impressions</p>
            </div>
          ) : publishedPosts.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-16 text-center">
              <Eye className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">No published posts to show impressions for yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-600">
                  Live metrics for X when tweet ids are stored. LinkedIn needs member post analytics on your LinkedIn app.
                </p>
                <button type="button" onClick={() => { setInsights(null); setInsightsError(null); void loadInsights(); }} disabled={loadingInsights}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-zinc-200 disabled:opacity-40">
                  {loadingInsights ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Refresh
                </button>
              </div>

              {insightsError && (
                <p className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">{insightsError}</p>
              )}

              {insights && Object.keys(metricsByPostId).length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Total impressions", icon: Eye, value: totalImpressions > 0 ? totalImpressions.toLocaleString() : "—" },
                    { label: "Total likes",       icon: ThumbsUp,  value: totalLikes.toLocaleString() },
                    { label: "Total shares",      icon: Share2,    value: totalShares.toLocaleString() },
                    { label: "Total replies",     icon: MessageSquare, value: totalComments.toLocaleString() },
                  ].map(({ label, icon: Icon, value }) => (
                    <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                      <Icon className="mb-2 h-4 w-4 text-[#F97316]" />
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-600">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {loadingInsights && !insights ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/8 bg-white/[0.02]" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedPosts.slice(0, 10).map((post) => {
                    const meta = PLATFORM_META[post.platform];
                    const Icon = meta?.icon ?? BarChart2;
                    const imp  = metricsByPostId[post.id];
                    return (
                      <div key={post.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                        <div className="mb-3 flex items-start gap-3">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta?.color }} />
                          <p className="line-clamp-2 flex-1 text-sm text-zinc-300">{post.text}</p>
                          <span className="shrink-0 text-[10px] text-zinc-600">
                            {new Date(post.scheduled_at ?? post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        {imp ? (
                          <>
                            <div className="grid grid-cols-4 gap-3">
                              {[
                                { label: "Impressions", value: imp.impressions != null ? imp.impressions.toLocaleString() : "—", icon: Eye },
                                { label: "Likes",       value: imp.likes.toLocaleString(),       icon: ThumbsUp },
                                { label: "Shares",      value: imp.shares.toLocaleString(),      icon: Share2 },
                                { label: "Replies",     value: imp.comments.toLocaleString(),    icon: MessageSquare },
                              ].map(({ label, value, icon: IIcon }) => (
                                <div key={label} className="rounded-xl bg-black/30 p-3 text-center">
                                  <IIcon className="mx-auto mb-1 h-3.5 w-3.5 text-zinc-600" />
                                  <p className="text-base font-bold text-white">{value}</p>
                                  <p className="text-[9px] text-zinc-700">{label}</p>
                                </div>
                              ))}
                            </div>
                            {imp.error && <p className="mt-2 text-[10px] text-zinc-600">{imp.error}</p>}
                          </>
                        ) : (
                          <div className="h-16 animate-pulse rounded-xl bg-white/5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Comments + reply ── */}
      {tab === "comments" && (
        <div>
          {!profile.linkedinConnected && !profile.xConnected ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-16 text-center">
              <MessageSquare className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-400">Connect X to reply to thread comments in Nect.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-600">
                  Replies to threads for posts you published through Nect (X). Reply uses your connected X account (max 280 characters).
                </p>
                <button type="button" onClick={() => { setInsights(null); setInsightsError(null); void loadInsights(); }} disabled={loadingInsights}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-zinc-200 disabled:opacity-40">
                  {loadingInsights ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Refresh
                </button>
              </div>

              {insightsError && (
                <p className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-300">{insightsError}</p>
              )}

              {profile.linkedinConnected && (
                <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-xs text-zinc-600">
                  <span className="font-medium text-zinc-400">LinkedIn:</span> comment threads are not available in-app with current LinkedIn scopes. Use LinkedIn for engagement there.
                </div>
              )}

              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-[#F97316]" />
                  <h2 className="text-sm font-semibold text-zinc-300">Thread replies (X)</h2>
                </div>

                {loadingInsights && !insights ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />)}
                  </div>
                ) : !profile.xConnected ? (
                  <p className="text-sm text-zinc-600">Connect X in Settings to load and reply to comments.</p>
                ) : publishedPosts.length === 0 ? (
                  <p className="text-sm text-zinc-600">Publish to X through Nect to track threads and replies here.</p>
                ) : (insights?.comments?.length ?? 0) === 0 ? (
                  <p className="text-sm text-zinc-600">
                    No thread replies returned. Add replies on X, ensure recent search access on your developer project, or publish the root post from Nect so we can match the thread.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {(insights?.comments ?? []).map((c) => (
                      <div key={c.id} className="rounded-xl border border-white/5 bg-black/20 p-4">
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F97316]/15 text-xs font-bold text-[#F97316]">
                            {c.author.replace(/^@/, "").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-zinc-300">{c.author}</span>
                              <Radio className="h-3 w-3 text-zinc-400" />
                              <span className="text-[10px] text-zinc-600">{formatInsightDate(c.createdAt)}</span>
                              <a
                                href={`https://x.com/i/web/status/${c.tweetId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto inline-flex items-center gap-1 text-[10px] text-[#F97316] hover:underline"
                              >
                                View
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <p className="text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap break-words">{c.text}</p>
                          </div>
                        </div>
                        <div className="mt-3 border-t border-white/5 pt-3 pl-11">
                          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-600">Reply on X</label>
                          <textarea
                            value={replyDraftByTweet[c.tweetId] ?? ""}
                            onChange={(e) =>
                              setReplyDraftByTweet((prev) => ({ ...prev, [c.tweetId]: e.target.value }))
                            }
                            placeholder="Write a reply…"
                            rows={2}
                            maxLength={280}
                            className="mb-2 w-full resize-y rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-[#F97316]/40 focus:outline-none"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-zinc-600">
                              {(replyDraftByTweet[c.tweetId] ?? "").length}/280
                            </span>
                            <button
                              type="button"
                              disabled={replySendingTweetId === c.tweetId || !(replyDraftByTweet[c.tweetId] ?? "").trim()}
                              onClick={() => void submitReply(c.tweetId)}
                              className="rounded-lg bg-[#F97316] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {replySendingTweetId === c.tweetId ? (
                                <span className="inline-flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Sending…
                                </span>
                              ) : (
                                "Send reply"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsClient(props: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-5 py-16 text-center text-sm text-zinc-500">Loading analytics…</div>}>
      <AnalyticsClientInner {...props} />
    </Suspense>
  );
}
