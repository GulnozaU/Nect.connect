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
  LogIn,
  PenLine,
  CalendarDays,
  LayoutDashboard,
  FileText,
  BarChart2,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { PLATFORM_KEYS, type PlatformKey } from "@/lib/platforms";

const icons: Record<PlatformKey, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  x: Radio,
  reddit: MessageCircle,
  facebook: Facebook,
  linkedin: Linkedin,
};

const navItems = [
  { href: "/dashboard",          label: "Home",         icon: LayoutDashboard },
  { href: "/dashboard/create",   label: "Create Post",  icon: PenLine,  highlight: true },
  { href: "/dashboard/scheduled",label: "Scheduled",    icon: CalendarDays },
  { href: "/dashboard/drafts",   label: "Drafts",       icon: FileText },
  { href: "/dashboard/analytics",label: "Analytics",    icon: BarChart2 },
  { href: "/dashboard/settings", label: "Settings",     icon: Settings },
];

type Props = {
  isAuthenticated: boolean;
  connected: Record<PlatformKey, boolean>;
};

export function DashboardSidebar({ isAuthenticated, connected }: Props) {
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <aside className="m-4 flex w-72 shrink-0 flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      {/* Logo */}
      <div className="border-b border-white/10 p-5">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white hover:opacity-80 transition-opacity">
          <Sparkles className="h-4 w-4 text-[#F97316]" />
          Nect
        </Link>
      </div>

      {/* If NOT authenticated — show Log in prominently at top */}
      {!isAuthenticated && (
        <div className="p-3 border-b border-white/10">
          <Link
            href="/auth"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-3 text-sm font-bold text-black hover:bg-[#ea580c] transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Log in to Nect
          </Link>
          <Link
            href="/auth?next=/onboarding"
            className="mt-2 flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            Create free account
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#F97316]/15 text-[#F97316]"
                  : highlight
                  ? "text-zinc-200 hover:bg-white/8 hover:text-white"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", highlight && !active && "text-[#F97316]")} />
              {label}
              {highlight && !active && (
                <span className="ml-auto rounded-md bg-[#F97316]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F97316]">
                  New
                </span>
              )}
            </Link>
          );
        })}

        {/* Command Center */}
        <div className="mt-4 rounded-xl border border-white/8 bg-black/20 p-3">
          <p className="mb-2.5 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
            Channels
          </p>
          <div className="space-y-1">
            {PLATFORM_KEYS.map((platform) => {
              const Icon = icons[platform];
              const isConnected = connected[platform];
              return (
                <div
                  key={platform}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5"
                >
                  <span className={cn("flex items-center gap-2 text-xs", isConnected ? "text-zinc-300" : "text-zinc-600")}>
                    <Icon className="h-3.5 w-3.5" />
                    {platform === "x" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </span>
                  {isConnected ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      On
                    </span>
                  ) : (
                    <Link
                      href={isAuthenticated ? `/api/auth/${platform}` : `/auth?next=/dashboard&intent=connect`}
                      className="text-[10px] text-zinc-500 hover:text-[#F97316] transition-colors"
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

      {/* Bottom — only show when authenticated */}
      {isAuthenticated && (
        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center justify-center rounded-xl border border-white/8 px-4 py-2.5 text-sm text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}