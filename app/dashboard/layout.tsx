import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { cookies } from "next/headers";
import { hasXPlatformAccess } from "@/lib/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  
  // Try to create the client - if it's still red, check if your 
  // createClient helper needs (cookieStore) as an argument
  const supabase = await createClient(); 

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: any = null;

  if (user) {
    const { data } = await (supabase
      .from("profiles") as any)
      .select("x_connected, linkedin_connected, plan, pro_trial_ends_at")
      .eq("id", user.id)
      .maybeSingle();
    
    profile = data;
  }

  const xEntitled = profile ? hasXPlatformAccess(profile as { plan?: string | null; pro_trial_ends_at?: string | null }) : false;

  return (
    <div className="flex min-h-screen bg-black p-2">
      <DashboardSidebar
        isAuthenticated={Boolean(user)}
        xEntitled={xEntitled}
        connected={{
          // Fix: We must provide ALL keys that PlatformKey requires
          x: !!profile?.x_connected,
          linkedin: !!profile?.linkedin_connected,
          instagram: false, // Adding these to satisfy the Sidebar type
          reddit: false,
          facebook: false,
        }}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}