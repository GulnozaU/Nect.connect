

import { Suspense } from "react";
import Link from "next/link";
import { PenLine, ArrowRight, Sparkles } from "lucide-react";

import { LinkedInStatusBanner } from "@/components/linkedin-status-banner";
import DashboardClient from "@/app/dashboard/dashboard-client";
import { DashboardCommentsStrip } from "@/components/dashboard-comments-strip";
import { createClient } from "@/lib/supabase/server";
import { publishDuePosts } from "@/app/api/publish/duepublish/route";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { gcal?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fire due scheduled posts on every dashboard load — no cron needed
  if (user) {
    await publishDuePosts();
  }

  const profile = user
    ? (
        await supabase
          .from("profiles")
          .select(
            "full_name, linkedin_connected, x_connected, preferred_platforms, google_calendar_connected"
          )
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Suspense fallback={null}>
        <LinkedInStatusBanner />
      </Suspense>

      <h1 className="text-2xl font-semibold text-white">
        {user
          ? `Welcome back${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.`
          : "Welcome to Nect."}
      </h1>
      <p className="mt-1.5 text-sm text-zinc-500">
        {user
          ? "Your command stream is live. What do you want to post today?"
          : "You are in guest mode. Create an account to publish and connect channels."}
      </p>

      {user ? (
        <>
          {/* Quick action CTA */}
          <div className="mt-8 rounded-2xl border border-[#F97316]/20 bg-[#F97316]/[0.03] p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#F97316]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316]">
                AI Post Creator
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">
              What do you want to post about?
            </h2>
            <p className="text-sm text-zinc-500 mb-4">
              AI generates platform-perfect posts for LinkedIn, Instagram, X, and Reddit — all different, all native.
            </p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#ea580c] transition-colors"
            >
              <PenLine className="h-4 w-4" />
              Generate Posts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Post editor + scheduled calendar */}
          <DashboardClient
            preferredPlatforms={profile?.preferred_platforms ?? []}
            googleCalendarConnected={!!profile?.google_calendar_connected}
            gcalStatus={searchParams.gcal}
          />
          <DashboardCommentsStrip
            xConnected={!!profile?.x_connected}
            linkedinConnected={!!profile?.linkedin_connected}
          />
        </>
      ) : (
        <>
          <div className="mt-8 space-y-3">
            <textarea
              className="min-h-[280px] w-full resize-y bg-transparent text-lg leading-8 text-zinc-100 placeholder:text-zinc-700 focus:outline-none"
              placeholder="Write your next post here..."
              aria-label="Post draft editor"
              readOnly
            />
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>
                Preferred channels:{" "}
                <span className="text-zinc-700">Not selected</span>
              </span>
              <Link
                href="/auth?next=/dashboard&intent=publish"
                className="rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-black hover:bg-[#ea580c] transition-colors"
              >
                Create account to publish
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <h2 className="text-base font-semibold text-white">
              Ready to publish?
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              Create an account to use AI post generation, schedule content, and
              connect all your platforms.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/auth?next=/dashboard&intent=publish"
                className="rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#ea580c] transition-colors"
              >
                Create account
              </Link>
              <Link
                href="/auth?next=/dashboard"
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-white/20 hover:text-white transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}