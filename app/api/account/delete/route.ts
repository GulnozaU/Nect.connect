
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete user data from tables first (RLS handles ownership)
  await supabase.from("scheduled_posts").delete().eq("user_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  // Delete the auth user — requires service role key
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[delete account] Failed:", error.message);
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}