-- One-shot fix when remote `profiles` is missing columns (e.g. only 001 was applied).
-- Run in Supabase → SQL Editor, then try X connect again.
-- PostgREST "schema cache" errors clear after columns exist + reload below.

alter table public.profiles
  add column if not exists preferred_platforms text[] not null default '{}',
  add column if not exists x_connected boolean not null default false,
  add column if not exists instagram_connected boolean not null default false,
  add column if not exists reddit_connected boolean not null default false,
  add column if not exists facebook_connected boolean not null default false,
  add column if not exists x_access_token text,
  add column if not exists x_refresh_token text,
  add column if not exists x_person_id text,
  add column if not exists facebook_access_token text,
  add column if not exists facebook_person_id text,
  add column if not exists google_calendar_access_token text,
  add column if not exists google_calendar_refresh_token text,
  add column if not exists google_calendar_token_expiry timestamptz,
  add column if not exists google_calendar_connected boolean not null default false;

-- Tell PostgREST to pick up the new columns (fixes "could not find ... in the schema cache").
notify pgrst, 'reload schema';
