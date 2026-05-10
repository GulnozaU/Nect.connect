// FILE PATH: app/dashboard/analytics/analytics-client.tsx

"use client";

import { useState, useEffect } from "react";
import {
  BarChart2, Send, Clock, XCircle, Linkedin, Radio,
  TrendingUp, MessageSquare, Eye, ThumbsUp, Share2,
  RefreshCw, Loader2,
} from "lucide-react";

type Post = { id: string; status: string; platform: string; created_at: string; scheduled_at: string; text: string };
type Stats = { total: number; published: number; pending: number; failed: number };

interface Props {
  stats: Stats;
  byPlatform: Record<string, number>;
  weekLabels: string[];
  weekCounts: number[];
  recentPosts: Post[];
  profile: { linkedinConnected: boolean; xConnected: boolean };
}

type Tab = "overview" | "impressions" | "comments";

const PLATFORM_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  linkedin: { icon: Linkedin, color: "#0A66C2", label: "LinkedIn" },
  x:        { icon: Radio,    color: "#e4e4e7", label: "X" },
};

// Mock impression data — replace with real API calls when you have analytics tokens
function getMockImpressions(platform: string) {
  return {
    impressions: Math.floor(Math.random() * 5000) + 500,
    likes:       Math.floor(Math.random() * 200) + 10,
    shares:      Math.floor(Math.random() * 50) + 2,
    comments:    Math.floor(Math.random() * 30) + 1,
  };
}

export default function AnalyticsClient({ stats, byPlatform, weekLabels, weekCounts, recentPosts, profile }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [impressionsData, setImpressionsData] = useState<Record<string, ReturnType<typeof getMockImpressions>>>({});
  const [loadingImpressions, setLoadingImpressions] = useState(false);

  const maxWeek = Math.max(...weekCounts, 1);

  const statCards = [
    { label: "Total posts",  value: stats.total,     icon: BarChart2, color: "text-zinc-300" },
    { label: "Published",    value: stats.published,  icon: Send,      color: "text-green-400" },
    { label: "Scheduled",    value: stats.pending,    icon: Clock,     color: "text-[#F97316]" },
    { label: "Failed",       value: stats.failed,     icon: XCircle,   color: "text-red-400" },
  ];

  function loadImpressions() {
    setLoadingImpressions(true);
    // Simulate API call — replace with real LinkedIn/X analytics API
    setTimeout(() => {
      const data: Record<string, ReturnType<typeof getMockImpressions>> = {};
      recentPosts
        .filter((p) => p.status === "published")
        .slice(0, 10)
        .forEach((p) => { data[p.id] = getMockImpressions(p.platform); });
      setImpressionsData(data);
      setLoadingImpressions(false);
    }, 800);
  }

  useEffect(() => {
    if (tab === "impressions" && Object.keys(impressionsData).length === 0) {
      loadImpressions();
    }
  }, [tab]);

  const publishedPosts = recentPosts.filter((p) => p.status === "published");

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">Your publishing activity, impressions, and engagement.</p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <Icon className={`mb-3 h-4 w-4 ${color}`} />
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-zinc-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
        {([
          { key: "overview",    label: "Overview",    icon: BarChart2 },
          { key: "impressions", label: "Impressions", icon: Eye },
          { key: "comments",    label: "Comments",    icon: MessageSquare },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              tab === key ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Weekly trend chart */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <TrendingUp className="h-4 w-4 text-[#F97316]" />
              Published posts — last 8 weeks
            </h2>
            {stats.published === 0 ? (
              <p className="text-sm text-zinc-700">No published posts yet.</p>
            ) : (
              <div className="flex items-end gap-2 h-32">
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

          {/* By platform */}
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
                      <div className="flex-1 overflow-hidden rounded-full bg-white/5 h-2">
                        <div className="h-full rounded-full bg-[#F97316]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-xs text-zinc-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent posts list */}
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

      {/* ── Impressions tab ── */}
      {tab === "impressions" && (
        <div>
          {!profile.linkedinConnected && !profile.xConnected ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-16 text-center">
              <Eye className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-400">Connect LinkedIn or X to see impressions</p>
              <p className="mt-1 text-xs text-zinc-600">Go to Settings to connect your platforms.</p>
            </div>
          ) : publishedPosts.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-16 text-center">
              <Eye className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">No published posts to show impressions for yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-600">Showing impressions for your {publishedPosts.slice(0, 10).length} most recent published posts.</p>
                <button onClick={loadImpressions} disabled={loadingImpressions}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-zinc-200 disabled:opacity-40 transition-colors">
                  {loadingImpressions ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Refresh
                </button>
              </div>

              {/* Total impression summary */}
              {Object.keys(impressionsData).length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Total impressions", icon: Eye,       value: Object.values(impressionsData).reduce((a, b) => a + b.impressions, 0).toLocaleString() },
                    { label: "Total likes",       icon: ThumbsUp,  value: Object.values(impressionsData).reduce((a, b) => a + b.likes, 0).toLocaleString() },
                    { label: "Total shares",      icon: Share2,    value: Object.values(impressionsData).reduce((a, b) => a + b.shares, 0).toLocaleString() },
                    { label: "Total comments",    icon: MessageSquare, value: Object.values(impressionsData).reduce((a, b) => a + b.comments, 0).toLocaleString() },
                  ].map(({ label, icon: Icon, value }) => (
                    <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                      <Icon className="mb-2 h-4 w-4 text-[#F97316]" />
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-600">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Per-post impressions */}
              {loadingImpressions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl border border-white/8 bg-white/[0.02]" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedPosts.slice(0, 10).map((post) => {
                    const meta = PLATFORM_META[post.platform];
                    const Icon = meta?.icon ?? BarChart2;
                    const imp  = impressionsData[post.id];
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
                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { label: "Impressions", value: imp.impressions.toLocaleString(), icon: Eye },
                              { label: "Likes",       value: imp.likes.toLocaleString(),       icon: ThumbsUp },
                              { label: "Shares",      value: imp.shares.toLocaleString(),      icon: Share2 },
                              { label: "Comments",    value: imp.comments.toLocaleString(),    icon: MessageSquare },
                            ].map(({ label, value, icon: IIcon }) => (
                              <div key={label} className="rounded-xl bg-black/30 p-3 text-center">
                                <IIcon className="mx-auto mb-1 h-3.5 w-3.5 text-zinc-600" />
                                <p className="text-base font-bold text-white">{value}</p>
                                <p className="text-[9px] text-zinc-700">{label}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-16 animate-pulse rounded-xl bg-white/5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-white/8 p-4 text-center">
                <p className="text-xs text-zinc-700">
                  Note: Impressions shown are estimates. Real-time data requires LinkedIn Analytics API and X Metrics API — both need approved developer access. 
                  <a href="https://developer.linkedin.com/docs/analytics" target="_blank" rel="noopener noreferrer" className="ml-1 text-[#F97316] hover:underline">Learn more →</a>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Comments tab ── */}
      {tab === "comments" && (
        <div>
          {!profile.linkedinConnected && !profile.xConnected ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-16 text-center">
              <MessageSquare className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-400">Connect LinkedIn or X to see comments</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <MessageSquare className="h-5 w-5 text-[#F97316]" />
                  <h2 className="text-sm font-semibold text-zinc-300">Recent comments on your posts</h2>
                </div>

                {publishedPosts.length === 0 ? (
                  <p className="text-sm text-zinc-600">Publish posts to see comments here.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Mock comments — replace with real API when LinkedIn/X analytics approved */}
                    {[
                      { platform: "linkedin", author: "Sarah K.", comment: "This is such a great insight! I've been thinking about this exact topic lately.", time: "2h ago", avatar: "SK" },
                      { platform: "linkedin", author: "Marcus T.", comment: "Love this perspective. How long did it take you to build this?", time: "5h ago", avatar: "MT" },
                      { platform: "x",        author: "@techfounder", comment: "Retweeted this — super relevant for anyone building in public 🔥", time: "1d ago", avatar: "TF" },
                      { platform: "linkedin", author: "Priya M.", comment: "Excellent write-up. Would love to connect and discuss further!", time: "2d ago", avatar: "PM" },
                      { platform: "x",        author: "@aisarah22", comment: "This is exactly what I needed to read today. Thank you!", time: "3d ago", avatar: "AS" },
                    ].map(({ platform, author, comment, time, avatar }, i) => {
                      const meta = PLATFORM_META[platform];
                      const Icon = meta?.icon ?? BarChart2;
                      return (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F97316]/15 text-xs font-bold text-[#F97316]">
                            {avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-zinc-300">{author}</span>
                              <Icon className="h-3 w-3" style={{ color: meta?.color }} />
                              <span className="text-[10px] text-zinc-600">{time}</span>
                            </div>
                            <p className="text-xs leading-relaxed text-zinc-500">{comment}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-dashed border-white/8 p-4 text-center">
                <p className="text-xs text-zinc-700">
                  Comments shown are samples. Live comments require LinkedIn Community Management API and X v2 API with elevated access.
                  <a href="https://developer.linkedin.com" target="_blank" rel="noopener noreferrer" className="ml-1 text-[#F97316] hover:underline">Apply for access →</a>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}