
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BarChart2, Send, Clock, XCircle, Linkedin, Facebook, Radio, TrendingUp } from "lucide-react";

const PLATFORM_META: Record<string, { icon: React.ElementType; color: string }> = {
  linkedin: { icon: Linkedin, color: "#0A66C2" },
  facebook: { icon: Facebook, color: "#1877F2" },
  x:        { icon: Radio,    color: "#e4e4e7" },
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: posts } = await supabase
    .from("scheduled_posts")
    .select("id, status, platform, created_at, scheduled_at, text")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const all       = posts ?? [];
  const published = all.filter((p) => p.status === "published");
  const pending   = all.filter((p) => ["pending", "scheduled"].includes(p.status));
  const failed    = all.filter((p) => p.status === "failed");

  // Posts per platform
  const byPlatform = all.reduce<Record<string, number>>((acc, p) => {
    acc[p.platform] = (acc[p.platform] ?? 0) + 1;
    return acc;
  }, {});

  // Posts per week (last 8 weeks)
  const weeks: Record<string, number> = {};
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const key = `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    weeks[key] = 0;
  }
  published.forEach((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    const diffWeeks = Math.floor((now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks < 8) {
      const key = Object.keys(weeks)[7 - diffWeeks];
      if (key) weeks[key]++;
    }
  });

  const maxWeekVal = Math.max(...Object.values(weeks), 1);

  const stats = [
    { label: "Total posts",   value: all.length,       icon: BarChart2, color: "text-zinc-300" },
    { label: "Published",     value: published.length,  icon: Send,      color: "text-green-400" },
    { label: "Scheduled",     value: pending.length,    icon: Clock,     color: "text-[#F97316]" },
    { label: "Failed",        value: failed.length,     icon: XCircle,   color: "text-red-400" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">Your publishing activity across all platforms.</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <Icon className={`mb-3 h-4 w-4 ${color}`} />
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs text-zinc-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Publishing trend */}
      <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <TrendingUp className="h-4 w-4 text-[#F97316]" />
          Published posts — last 8 weeks
        </h2>
        {published.length === 0 ? (
          <p className="text-sm text-zinc-700">No published posts yet. Start publishing to see trends.</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {Object.entries(weeks).map(([label, count]) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-[#F97316]/60 transition-all hover:bg-[#F97316]"
                  style={{ height: `${Math.max((count / maxWeekVal) * 100, count > 0 ? 8 : 2)}%` }}
                  title={`${count} post${count !== 1 ? "s" : ""}`}
                />
                <span className="text-[8px] text-zinc-700 text-center leading-tight hidden sm:block">
                  {label.replace("Week of ", "")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By platform */}
      <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Posts by platform</h2>
        {Object.keys(byPlatform).length === 0 ? (
          <p className="text-sm text-zinc-700">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byPlatform).sort(([, a], [, b]) => b - a).map(([platform, count]) => {
              const meta = PLATFORM_META[platform];
              const Icon = meta?.icon ?? BarChart2;
              const pct  = Math.round((count / all.length) * 100);
              return (
                <div key={platform} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" style={{ color: meta?.color ?? "#999" }} />
                  <span className="w-20 text-xs capitalize text-zinc-500">{platform}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-white/5 h-2">
                    <div className="h-full rounded-full bg-[#F97316] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs text-zinc-500">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent posts */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Recent posts</h2>
        {all.length === 0 ? (
          <p className="text-sm text-zinc-700">No posts yet.</p>
        ) : (
          <div className="space-y-2">
            {all.slice(0, 10).map((post) => {
              const meta = PLATFORM_META[post.platform];
              const Icon = meta?.icon ?? BarChart2;
              const statusColor = post.status === "published" ? "text-green-500" : post.status === "failed" ? "text-red-500" : "text-zinc-500";
              return (
                <div key={post.id} className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta?.color ?? "#999" }} />
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

      {/* Platform impressions note */}
      <div className="mt-6 rounded-2xl border border-dashed border-white/8 p-6 text-center">
        <TrendingUp className="mx-auto mb-2 h-5 w-5 text-zinc-700" />
        <p className="text-sm text-zinc-600">Platform impressions and comments coming soon.</p>
        <p className="mt-1 text-xs text-zinc-700">
          LinkedIn, Facebook, and X APIs will be connected to pull real engagement data.
        </p>
      </div>
    </div>
  );
}