-- cashBot schema + RLS

-- Extensions
create extension if not exists pgcrypto;

-- =========================
-- profiles
-- =========================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  telegram_chat_id bigint unique,
  monthly_salary numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- =========================
-- telegram_link_codes (sync)
-- =========================
create table if not exists public.telegram_link_codes (
  code_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists telegram_link_codes_user_id_idx on public.telegram_link_codes(user_id);

alter table public.telegram_link_codes enable row level security;

-- Users can manage their own codes (web uses anon key)
create policy "telegram_link_codes_select_own"
on public.telegram_link_codes
for select
to authenticated
using (user_id = auth.uid());

create policy "telegram_link_codes_insert_own"
on public.telegram_link_codes
for insert
to authenticated
with check (user_id = auth.uid());

create policy "telegram_link_codes_delete_own"
on public.telegram_link_codes
for delete
to authenticated
using (user_id = auth.uid());

-- No update policy for users (only server/service role updates claimed_at)

-- =========================
-- transactions
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('expense', 'income');
  end if;
end $$;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  description text not null,
  category text not null,
  type public.transaction_type not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_created_at_idx on public.transactions(user_id, created_at desc);

alter table public.transactions enable row level security;

create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using (user_id = auth.uid());

create policy "transactions_insert_own"
on public.transactions
for insert
to authenticated
with check (user_id = auth.uid());

create policy "transactions_update_own"
on public.transactions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "transactions_delete_own"
on public.transactions
for delete
to authenticated
using (user_id = auth.uid());

-- =========================
-- auto-create profile on signup
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

