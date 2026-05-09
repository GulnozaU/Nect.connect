
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, linkedin_connected, facebook_connected, x_connected, google_calendar_connected")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <SettingsClient
      user={{ id: user.id, email: user.email ?? "", name: profile?.full_name ?? "" }}
      connected={{
        linkedin:        !!profile?.linkedin_connected,
        x:               !!profile?.x_connected,
        googleCalendar:  !!profile?.google_calendar_connected,
      }}
    />
  );
}