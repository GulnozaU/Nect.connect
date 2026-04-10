alter table public.profiles
  add column if not exists preferred_platforms text[] not null default '{}',
  add column if not exists x_connected boolean not null default false,
  add column if not exists instagram_connected boolean not null default false,
  add column if not exists reddit_connected boolean not null default false,
  add column if not exists facebook_connected boolean not null default false;
