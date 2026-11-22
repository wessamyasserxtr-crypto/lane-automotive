create extension if not exists pgcrypto;

create table if not exists public.lane_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.lane_admin_users enable row level security;
revoke all on public.lane_admin_users from anon, authenticated;

create or replace function public.is_lane_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lane_admin_users where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_lane_admin() from public;
grant execute on function public.is_lane_admin() to authenticated;

create table if not exists public.showroom_state (
  id text primary key check (id = 'primary'),
  cars jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.showroom_state enable row level security;
grant select on public.showroom_state to anon, authenticated;
grant insert, update, delete on public.showroom_state to authenticated;

drop policy if exists "Public can read showroom catalog" on public.showroom_state;
create policy "Public can read showroom catalog"
  on public.showroom_state for select to anon, authenticated using (true);
drop policy if exists "LANE admins manage showroom data" on public.showroom_state;
create policy "LANE admins manage showroom data"
  on public.showroom_state for all to authenticated
  using ((select public.is_lane_admin()))
  with check ((select public.is_lane_admin()));

create table if not exists public.visit_bookings (
  id text primary key,
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 30),
  car_id text not null,
  visit_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed')),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.visit_bookings enable row level security;
grant insert on public.visit_bookings to anon, authenticated;
grant select, update, delete on public.visit_bookings to authenticated;

drop policy if exists "Visitors can submit pending visit requests" on public.visit_bookings;
create policy "Visitors can submit pending visit requests"
  on public.visit_bookings for insert to anon, authenticated
  with check (status = 'pending');
drop policy if exists "LANE admins view visit requests" on public.visit_bookings;
create policy "LANE admins view visit requests"
  on public.visit_bookings for select to authenticated
  using ((select public.is_lane_admin()));
drop policy if exists "LANE admins update visit requests" on public.visit_bookings;
create policy "LANE admins update visit requests"
  on public.visit_bookings for update to authenticated
  using ((select public.is_lane_admin()))
  with check ((select public.is_lane_admin()));
drop policy if exists "LANE admins delete visit requests" on public.visit_bookings;
create policy "LANE admins delete visit requests"
  on public.visit_bookings for delete to authenticated
  using ((select public.is_lane_admin()));
