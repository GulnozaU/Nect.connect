-- Pro / trial flags for X and other paid features; in-app assistant chat history.

alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists pro_trial_ends_at timestamptz,
  add column if not exists pro_trial_used boolean not null default false;

comment on column public.profiles.plan is 'free | pro';
comment on column public.profiles.pro_trial_ends_at is 'When set and in the future, Pro trial features (e.g. X) are unlocked.';
comment on column public.profiles.pro_trial_used is 'True once a free Pro trial was started; prevents repeating the trial.';

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

alter table public.chat_messages enable row level security;

create policy "Users can read own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
