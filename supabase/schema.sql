-- LigtasLPG: Full database schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Tables:
--   1. profiles            (users)
--   2. devices             (LPG IoT hardware)
--   3. device_settings     (sensitivity + notifications)
--   4. activity_logs       (safety / sensor events)
--   5. emergency_contacts  (SMS/call contacts)

-- ============================================
-- 1. PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  phone text,
  language text default 'en',
  dark_mode boolean default false,
  password_set boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================
-- 2. DEVICES
-- ============================================
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  hardware_id text not null,
  device_api_key text,
  firmware_version text default 'v1.0.0',
  wifi_ssid text,
  signal_strength text default 'unknown',
  valve_open boolean default false,
  system_status text default 'safe' check (system_status in ('safe', 'warning', 'critical', 'offline')),
  pressure_kpa numeric(8,2) default 0,
  pressure_volts numeric(8,3) default 0,
  flame_detected boolean default false,
  alarm_active boolean default false,
  emergency_latched boolean default false,
  pending_command text,
  command_updated_at timestamptz,
  uptime_seconds bigint default 0,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, hardware_id)
);

alter table public.devices enable row level security;

drop policy if exists "Users can view own devices" on public.devices;
drop policy if exists "Users can insert own devices" on public.devices;
drop policy if exists "Users can update own devices" on public.devices;
drop policy if exists "Users can delete own devices" on public.devices;

create policy "Users can view own devices"
  on public.devices for select using (auth.uid() = user_id);

create policy "Users can insert own devices"
  on public.devices for insert with check (auth.uid() = user_id);

create policy "Users can update own devices"
  on public.devices for update using (auth.uid() = user_id);

create policy "Users can delete own devices"
  on public.devices for delete using (auth.uid() = user_id);

-- ============================================
-- 3. DEVICE SETTINGS
-- ============================================
create table if not exists public.device_settings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null unique references public.devices (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  leak_sensitivity integer default 45 check (leak_sensitivity between 0 and 100),
  notify_push boolean default true,
  notify_sms boolean default false,
  notify_email boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.device_settings enable row level security;

drop policy if exists "Users can view own device settings" on public.device_settings;
drop policy if exists "Users can insert own device settings" on public.device_settings;
drop policy if exists "Users can update own device settings" on public.device_settings;
drop policy if exists "Users can delete own device settings" on public.device_settings;

create policy "Users can view own device settings"
  on public.device_settings for select using (auth.uid() = user_id);

create policy "Users can insert own device settings"
  on public.device_settings for insert with check (auth.uid() = user_id);

create policy "Users can update own device settings"
  on public.device_settings for update using (auth.uid() = user_id);

create policy "Users can delete own device settings"
  on public.device_settings for delete using (auth.uid() = user_id);

-- ============================================
-- 4. ACTIVITY LOGS
-- ============================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id uuid references public.devices (id) on delete set null,
  title text not null,
  description text,
  log_type text not null default 'info'
    check (log_type in ('safe', 'info', 'neutral', 'warning', 'critical')),
  icon text default 'info',
  icon_filled boolean default false,
  has_report boolean default false,
  pressure_kpa numeric(6,2),
  gas_ppm integer,
  created_at timestamptz default now()
);

create index if not exists activity_logs_user_created_idx
  on public.activity_logs (user_id, created_at desc);

alter table public.activity_logs enable row level security;

drop policy if exists "Users can view own logs" on public.activity_logs;
drop policy if exists "Users can insert own logs" on public.activity_logs;
drop policy if exists "Users can delete own logs" on public.activity_logs;

create policy "Users can view own logs"
  on public.activity_logs for select using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on public.activity_logs for insert with check (auth.uid() = user_id);

create policy "Users can delete own logs"
  on public.activity_logs for delete using (auth.uid() = user_id);

-- ============================================
-- 5. EMERGENCY CONTACTS
-- ============================================
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.emergency_contacts enable row level security;

drop policy if exists "Users can view own contacts" on public.emergency_contacts;
drop policy if exists "Users can insert own contacts" on public.emergency_contacts;
drop policy if exists "Users can update own contacts" on public.emergency_contacts;
drop policy if exists "Users can delete own contacts" on public.emergency_contacts;

create policy "Users can view own contacts"
  on public.emergency_contacts for select using (auth.uid() = user_id);

create policy "Users can insert own contacts"
  on public.emergency_contacts for insert with check (auth.uid() = user_id);

create policy "Users can update own contacts"
  on public.emergency_contacts for update using (auth.uid() = user_id);

create policy "Users can delete own contacts"
  on public.emergency_contacts for delete using (auth.uid() = user_id);
