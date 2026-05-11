-- X OAuth tokens + user id (callback updates these; missing columns caused silent update failures.)
alter table public.profiles
  add column if not exists x_access_token text,
  add column if not exists x_refresh_token text,
  add column if not exists x_person_id text;
