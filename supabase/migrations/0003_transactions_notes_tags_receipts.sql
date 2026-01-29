-- Transactions enhancements + receipts storage (run in Supabase SQL Editor)

-- 1) Add fields to transactions
alter table public.transactions
  add column if not exists notes text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists receipt_path text;

-- 2) Create private storage bucket for receipts (if not exists)
-- Note: Some Supabase projects may restrict direct inserts; if this fails,
-- create bucket "receipts" in the Storage UI.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- 3) RLS policies: users can manage only their own files under path "<uid>/..."
alter table storage.objects enable row level security;

drop policy if exists "receipts_select_own" on storage.objects;
create policy "receipts_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "receipts_insert_own" on storage.objects;
create policy "receipts_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "receipts_update_own" on storage.objects;
create policy "receipts_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "receipts_delete_own" on storage.objects;
create policy "receipts_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

