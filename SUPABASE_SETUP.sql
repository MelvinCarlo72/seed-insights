-- Initial SeedInsights feedback table and customer/staff access policies
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  source text default 'QR customer form',
  date date default current_date,
  rating integer check (rating between 1 and 5),
  sentiment text check (sentiment in ('positive','negative','neutral')),
  score numeric,
  topic text default 'Other',
  created_at timestamptz default now()
);

alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
grant insert on public.feedback to anon;
create policy "Customers can submit feedback" on public.feedback
for insert to anon with check (char_length(trim(text)) > 0 and rating between 1 and 5);
grant select on public.feedback to authenticated;
create policy "Staff can view feedback" on public.feedback
for select to authenticated using (true);
