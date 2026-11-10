-- SeedInsights staff-only child profile database.
-- DESTRUCTIVE: this permanently removes all rows and the old feedback table.
-- Run using the Supabase SQL editor as a project administrator.

begin;

do $$
begin
  if to_regclass('public.feedback') is not null then
    execute 'delete from public.feedback';
    execute 'drop table public.feedback';
  end if;
end;
$$;

create table if not exists public.staff_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.staff_access enable row level security;
revoke all on public.staff_access from anon, authenticated;

create or replace function public.is_approved_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_access access_row
    where access_row.user_id = (select auth.uid())
      and access_row.is_active = true
  );
$$;
revoke all on function public.is_approved_staff() from public, anon;
grant execute on function public.is_approved_staff() to authenticated;

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) between 1 and 80),
  last_name text not null check (char_length(trim(last_name)) between 1 and 80),
  date_of_birth date,
  branch text check (branch is null or char_length(branch) <= 100),
  guardian_name text check (guardian_name is null or char_length(guardian_name) <= 160),
  guardian_relationship text check (guardian_relationship is null or char_length(guardian_relationship) <= 80),
  guardian_phone text check (guardian_phone is null or char_length(guardian_phone) <= 40),
  guardian_email text check (guardian_email is null or char_length(guardian_email) <= 254),
  enrolled_service text check (enrolled_service is null or char_length(enrolled_service) <= 180),
  developmental_goals text check (developmental_goals is null or char_length(developmental_goals) <= 3000),
  session_history text check (session_history is null or char_length(session_history) <= 5000),
  staff_notes text check (staff_notes is null or char_length(staff_notes) <= 3000),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.child_profiles enable row level security;
revoke all on public.child_profiles from anon, authenticated;
grant select, insert, update, delete on public.child_profiles to authenticated;

drop policy if exists "Approved staff manage child profiles" on public.child_profiles;
create policy "Approved staff manage child profiles"
on public.child_profiles
for all to authenticated
using (public.is_approved_staff())
with check (public.is_approved_staff());

create or replace function public.set_child_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists set_child_profile_updated_at on public.child_profiles;
create trigger set_child_profile_updated_at
before update on public.child_profiles
for each row execute function public.set_child_profile_updated_at();

commit;

-- After approved staff accounts exist in Supabase Auth, activate each account
-- by running this as an administrator with the staff member's exact email:
-- insert into public.staff_access (user_id)
-- select id from auth.users where lower(email) = lower('authorized.staff@example.com')
-- on conflict (user_id) do update set is_active = true;
