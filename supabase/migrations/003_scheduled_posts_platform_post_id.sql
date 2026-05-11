-- Store native platform id after publish (tweet id, LinkedIn ugc URN, etc.) for analytics.
alter table public.scheduled_posts
  add column if not exists platform_post_id text;

create index if not exists scheduled_posts_user_status_idx
  on public.scheduled_posts (user_id, status);
