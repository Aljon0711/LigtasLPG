-- Push notification tokens (FCM) for LigtasLPG
-- Run in Supabase → SQL Editor

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text default 'android',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, token)
);

create index if not exists push_tokens_user_id_idx
  on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "Users can view own push tokens" on public.push_tokens;
drop policy if exists "Users can insert own push tokens" on public.push_tokens;
drop policy if exists "Users can update own push tokens" on public.push_tokens;
drop policy if exists "Users can delete own push tokens" on public.push_tokens;

create policy "Users can view own push tokens"
  on public.push_tokens for select using (auth.uid() = user_id);

create policy "Users can insert own push tokens"
  on public.push_tokens for insert with check (auth.uid() = user_id);

create policy "Users can update own push tokens"
  on public.push_tokens for update using (auth.uid() = user_id);

create policy "Users can delete own push tokens"
  on public.push_tokens for delete using (auth.uid() = user_id);
