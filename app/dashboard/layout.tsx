import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { type PlatformKey } from "@/lib/platforms";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultConnected: Record<PlatformKey, boolean> = {
    instagram: false,
    x: false,
    reddit: false,
    facebook: false,
    linkedin: false,
  };

  const connected = user
    ? (
        await supabase
          .from("profiles")
          .select(
            "instagram_connected, x_connected, reddit_connected, facebook_connected, linkedin_connected"
          )
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : null;

  return (
    <div className="flex min-h-screen bg-black p-2">
      <DashboardSidebar
        isAuthenticated={Boolean(user)}
        connected={{
          instagram: connected?.instagram_connected ?? defaultConnected.instagram,
          x: connected?.x_connected ?? defaultConnected.x,
          reddit: connected?.reddit_connected ?? defaultConnected.reddit,
          facebook: connected?.facebook_connected ?? defaultConnected.facebook,
          linkedin: connected?.linkedin_connected ?? defaultConnected.linkedin,
        }}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
