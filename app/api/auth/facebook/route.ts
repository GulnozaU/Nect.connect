
import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id:     process.env.FACEBOOK_APP_ID!,
    redirect_uri:  process.env.FACEBOOK_REDIRECT_URI!,
    scope:         "pages_show_list,pages_read_engagement,pages_manage_posts,publish_to_groups,user_posts",
    response_type: "code",
    state:         crypto.randomUUID(),
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  );
}
