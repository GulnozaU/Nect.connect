import { Suspense } from "react";
import Link from "next/link";

import { LinkedInStatusBanner } from "@/components/linkedin-status-banner";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? (
        await supabase
          .from("profiles")
          .select("full_name, linkedin_connected, preferred_platforms")
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : null;

  return (
    <div className="mx-auto max-w-5xl px-8 py-12">
      <Suspense fallback={null}>
        <LinkedInStatusBanner />
      </Suspense>
      <h1 className="text-3xl font-semibold text-white">
        {user
          ? `Welcome back${profile?.full_name ? `, ${profile.full_name}` : ""}.`
          : "Welcome to Nect."}
      </h1>
      <p className="mt-3 text-zinc-400">
        {user
          ? "Your command stream is live. Write once and orchestrate every platform."
          : "You are in guest mode. Explore freely, then create an account to publish and connect channels."}
      </p>
      <div className="mt-8 space-y-3">
        <textarea
          className="min-h-[360px] w-full resize-y bg-transparent text-lg leading-8 text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          placeholder="Write your next post here..."
          aria-label="Post draft editor"
        />
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>
            Preferred channels:{" "}
            {profile?.preferred_platforms?.length
              ? profile.preferred_platforms.join(", ")
              : "Not selected"}
          </span>
          {user ? (
            <button
              type="button"
              className="rounded-md bg-[#F97316] px-4 py-2 text-sm font-semibold text-black hover:bg-[#ea580c]"
            >
              Publish
            </button>
          ) : (
            <Link
              href="/auth?next=/dashboard&intent=publish"
              className="rounded-md bg-[#F97316] px-4 py-2 font-semibold text-black hover:bg-[#ea580c]"
            >
              Create account to publish
            </Link>
          )}
        </div>
      </div>
      {!user ? (
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-medium text-white">Ready to publish?</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Create an account to publish posts and connect LinkedIn or other
            apps.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/auth?next=/dashboard&intent=publish"
              className="rounded-md bg-[#F97316] px-4 py-2 text-sm font-medium text-black hover:bg-[#ea580c]"
            >
              Create account to publish
            </Link>
            <Link
              href="/auth?next=/dashboard&intent=connect"
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:border-zinc-500"
            >
              Connect an app
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
