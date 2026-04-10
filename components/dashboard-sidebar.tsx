"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Instagram,
  Linkedin,
  Radio,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/platforms";

const nav = [{ href: "/dashboard", label: "Overview" }];

type Props = {
  isAuthenticated: boolean;
  connected: Record<PlatformKey, boolean>;
};

const icons: Record<
  PlatformKey,
  React.ComponentType<{ className?: string }>
> = {
  instagram: Instagram,
  x: Radio,
  reddit: MessageCircle,
  facebook: Facebook,
  linkedin: Linkedin,
};

export function DashboardSidebar({ isAuthenticated, connected }: Props) {
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <aside className="m-4 flex w-80 shrink-0 flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="border-b border-white/10 p-5">
        <span className="flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="h-4 w-4 text-[#F97316]" />
          Nect
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-white/10 text-[#F97316]"
                : "text-zinc-400 hover:bg-white/10 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        ))}
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="mb-3 text-xs uppercase tracking-[0.16em] text-zinc-400">
            Command Center
          </p>
          <div className="space-y-2">
            {PLATFORM_KEYS.map((platform) => {
              const Icon = icons[platform];
              const isConnected = connected[platform];
              return (
                <div
                  key={platform}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                >
                  <span
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      isConnected ? "text-zinc-100" : "text-zinc-500"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {platform === "x"
                      ? "X"
                      : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </span>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      Connected
                    </span>
                  ) : (
                    <Link
                      href={
                        isAuthenticated
                          ? `/api/auth/${platform}`
                          : `/auth?next=/dashboard&intent=connect`
                      }
                      className="text-xs text-zinc-300 underline-offset-4 hover:text-white hover:underline"
                    >
                      Connect
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>
      <div className="border-t border-white/10 p-3">
        <Button asChild className="w-full bg-[#F97316] text-black hover:bg-[#ea580c]">
          <a
            href={
              isAuthenticated
                ? "/api/auth/linkedin"
                : "/auth?next=/dashboard&intent=connect"
            }
          >
            Connect LinkedIn
          </a>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="mt-2 w-full text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <a
            href={
              isAuthenticated
                ? "/dashboard?publish=ready"
                : "/auth?next=/dashboard&intent=publish"
            }
          >
            Publish
          </a>
        </Button>
        {isAuthenticated ? (
          <Button
            variant="ghost"
            className="mt-2 w-full text-zinc-400 hover:bg-white/10 hover:text-white"
            type="button"
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        ) : (
          <Button
            asChild
            variant="ghost"
            className="mt-2 w-full text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <a href="/auth?next=/dashboard">Sign in</a>
          </Button>
        )}
      </div>
    </aside>
  );
}
