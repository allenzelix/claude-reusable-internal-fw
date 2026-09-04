-- Reference RLS policies for a multi-tenant-safe table.
-- These are examples to copy into a client's own migration files under
-- clients/<name>/migrations/ — they are not run automatically, and this
-- file itself is never executed against a real project.
--
-- Convention: every table that stores tenant-owned data has a `client_id`
-- column, and RLS is enabled with policies scoped to that column. This
-- matters even for a single-client Supabase project, because the service
-- role key bypasses RLS entirely (used server-side by this framework's
-- agent runtime) — RLS here is the backstop for any client-facing anon/
-- authenticated key that might read this table directly in the future.

create table if not exists example_records (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

alter table example_records enable row level security;

-- Reject everything by default; only the policies below grant access.
-- Requires the requester's JWT to carry a `client_id` claim, set when
-- issuing tokens for that tenant (e.g. via a custom auth hook).

create policy "select own client rows"
  on example_records
  for select
  using (client_id = auth.jwt() ->> 'client_id');

create policy "insert own client rows"
  on example_records
  for insert
  with check (client_id = auth.jwt() ->> 'client_id');

create policy "update own client rows"
  on example_records
  for update
  using (client_id = auth.jwt() ->> 'client_id')
  with check (client_id = auth.jwt() ->> 'client_id');

create policy "delete own client rows"
  on example_records
  for delete
  using (client_id = auth.jwt() ->> 'client_id');

-- Index the isolation column — every RLS-filtered query hits it.
create index if not exists example_records_client_id_idx
  on example_records (client_id);
