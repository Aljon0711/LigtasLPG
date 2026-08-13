-- Soft-delete for emergency_contacts
-- Run in Supabase → SQL Editor if tables already exist

alter table public.emergency_contacts
  add column if not exists deleted_at timestamptz;

create index if not exists emergency_contacts_user_active_idx
  on public.emergency_contacts (user_id)
  where deleted_at is null;
