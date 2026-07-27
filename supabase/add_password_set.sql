-- Add password_set flag for Google signup flow
-- Run in Supabase SQL Editor if you already created tables

alter table public.profiles
  add column if not exists password_set boolean default false;

-- Existing email users: mark as having password set
-- (optional — only if you already have email/password users)
-- update public.profiles set password_set = true where password_set is distinct from true;
