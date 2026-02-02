-- Presence ping RPC (bypasses RLS safely)
--
-- Why:
-- Some setups cause client-side upserts to hit RLS 403 even when authenticated.
-- This RPC runs as the table owner (SECURITY DEFINER) and uses auth.uid() so it
-- can only write for the currently-authenticated user.

create or replace function public.ping_presence(seen_at timestamptz default now())
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.presence_current (user_id, last_seen)
  values (auth.uid(), seen_at)
  on conflict (user_id) do update
  set last_seen = excluded.last_seen;

  insert into public.presence_events (user_id, seen_at)
  values (auth.uid(), seen_at);
end;
$$;

revoke all on function public.ping_presence(timestamptz) from public;
grant execute on function public.ping_presence(timestamptz) to authenticated;

