-- Presence tracking (online users) for Grafana + UX
--
-- Goal:
-- - presence_current: latest "last seen" per user (for "online now")
-- - presence_events: append-only heartbeat events (for "online over time")

create table if not exists public.presence_current (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen timestamptz not null default now()
);

create table if not exists public.presence_events (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  seen_at timestamptz not null default now()
);

create index if not exists presence_events_seen_at_idx on public.presence_events (seen_at desc);
create index if not exists presence_events_user_seen_idx on public.presence_events (user_id, seen_at desc);

alter table public.presence_current enable row level security;
alter table public.presence_events enable row level security;

-- Allow authenticated users to upsert only their own presence_current row.
drop policy if exists "presence_current_insert_own" on public.presence_current;
create policy "presence_current_insert_own"
on public.presence_current
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "presence_current_update_own" on public.presence_current;
create policy "presence_current_update_own"
on public.presence_current
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Allow authenticated users to append only their own presence events.
drop policy if exists "presence_events_insert_own" on public.presence_events;
create policy "presence_events_insert_own"
on public.presence_events
for insert
to authenticated
with check (user_id = auth.uid());

