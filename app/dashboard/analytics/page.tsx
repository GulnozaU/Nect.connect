// FILE PATH: app/dashboard/analytics/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsClient from "./analytics-client";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: posts } = await supabase
    .from("scheduled_posts")
    .select("id, status, platform, created_at, scheduled_at, text, platform_post_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("linkedin_access_token, linkedin_person_id, linkedin_connected, x_access_token, x_connected")
    .eq("id", user.id)
    .single();

  const all       = posts ?? [];
  const published = all.filter((p) => p.status === "published");
  const pending   = all.filter((p) => ["pending", "scheduled"].includes(p.status));
  const failed    = all.filter((p) => p.status === "failed");

  const byPlatform = all.reduce<Record<string, number>>((acc, p) => {
    acc[p.platform] = (acc[p.platform] ?? 0) + 1;
    return acc;
  }, {});

  // Weekly trend (last 8 weeks)
  const weekLabels: string[] = [];
  const weekCounts: number[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weekLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    const weekStart = new Date(d); weekStart.setDate(d.getDate() - 7);
    weekCounts.push(
      published.filter((p) => {
        const t = new Date(p.created_at);
        return t >= weekStart && t < d;
      }).length
    );
  }

  return (
    <AnalyticsClient
      stats={{ total: all.length, published: published.length, pending: pending.length, failed: failed.length }}
      byPlatform={byPlatform}
      weekLabels={weekLabels}
      weekCounts={weekCounts}
      recentPosts={all.slice(0, 20)}
      profile={{
        linkedinConnected: !!profile?.linkedin_connected,
        xConnected:        !!profile?.x_connected,
      }}
    />
  );
}