// FILE: app/api/scheduled-posts/[id]/route.ts
// PURPOSE: PATCH and DELETE for a single scheduled post.
//          PATCH /api/scheduled-posts/:id  → edit text and/or scheduled_at
//          DELETE /api/scheduled-posts/:id → delete post + remove Google Calendar event
//          Both verify the post belongs to the requesting user before touching it.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCalendarClient } from "@/lib/google-calendar";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { text, scheduled_at } = await request.json();

  if (!text && !scheduled_at) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("scheduled_posts")
    .select("id, user_id, google_calendar_event_id, status")
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!["pending", "scheduled"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Only pending or scheduled posts can be edited." },
      { status: 400 }
    );
  }

  const updates: Record<string, string> = {};
  if (text) updates.text = text.trim();
  if (scheduled_at) updates.scheduled_at = scheduled_at;

  const { error: updateError } = await supabase
    .from("scheduled_posts")
    .update(updates)
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update post." }, { status: 500 });
  }

  // Sync changes to Google Calendar event if one exists
  if (existing.google_calendar_event_id) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_connected"
        )
        .eq("id", user.id)
        .single();

      if (
        profile?.google_calendar_connected &&
        profile.google_calendar_access_token &&
        profile.google_calendar_refresh_token
      ) {
        const calendar = await getCalendarClient(
          profile.google_calendar_access_token,
          profile.google_calendar_refresh_token,
          profile.google_calendar_token_expiry
        );

        const patchBody: Record<string, unknown> = {};
        if (text) patchBody.description = text.trim();
        if (scheduled_at) {
          const start = new Date(scheduled_at);
          const end = new Date(start.getTime() + 15 * 60 * 1000);
          patchBody.start = { dateTime: start.toISOString() };
          patchBody.end = { dateTime: end.toISOString() };
        }

        await calendar.events.patch({
          calendarId: "primary",
          eventId: existing.google_calendar_event_id,
          requestBody: patchBody,
        });
      }
    } catch (calErr) {
      console.error("[scheduled-posts PATCH] Calendar sync failed:", calErr);
      // Non-fatal
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("scheduled_posts")
    .select("id, user_id, google_calendar_event_id")
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Delete the linked Google Calendar event first
  if (existing.google_calendar_event_id) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry, google_calendar_connected"
        )
        .eq("id", user.id)
        .single();

      if (
        profile?.google_calendar_connected &&
        profile.google_calendar_access_token &&
        profile.google_calendar_refresh_token
      ) {
        const calendar = await getCalendarClient(
          profile.google_calendar_access_token,
          profile.google_calendar_refresh_token,
          profile.google_calendar_token_expiry
        );

        await calendar.events.delete({
          calendarId: "primary",
          eventId: existing.google_calendar_event_id,
        });
      }
    } catch (calErr) {
      console.error("[scheduled-posts DELETE] Calendar delete failed:", calErr);
      // Non-fatal
    }
  }

  const { error: deleteError } = await supabase
    .from("scheduled_posts")
    .delete()
    .eq("id", params.id);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete post." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}