-- Recurring rules ("הוראות קבע") + RLS

create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  description text not null,
  category text not null,
  type public.transaction_type not null,
  frequency text not null check (frequency in ('monthly', 'weekly')),
  day_of_month int check (day_of_month between 1 and 31),
  day_of_week int check (day_of_week between 0 and 6),
  start_date date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists recurring_rules_user_id_idx on public.recurring_rules(user_id);

alter table public.recurring_rules enable row level security;

create policy "recurring_rules_select_own"
on public.recurring_rules
for select
to authenticated
using (user_id = auth.uid());

create policy "recurring_rules_insert_own"
on public.recurring_rules
for insert
to authenticated
with check (user_id = auth.uid());

create policy "recurring_rules_update_own"
on public.recurring_rules
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "recurring_rules_delete_own"
on public.recurring_rules
for delete
to authenticated
using (user_id = auth.uid());

