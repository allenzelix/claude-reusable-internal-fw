---
paths:
  - "**/migrations/**"
---

# Migration and RLS conventions

- Every migration file lives under `clients/<name>/migrations/` for
  exactly one client — never write a migration that touches another
  client's tables or Supabase project.
- Name files so they sort in application order:
  `0001_init.sql`, `0002_add_orders.sql`, etc. The migration runner
  (`packages/core/supabase/migration-runner.ts`) applies them in filename
  order and tracks applied ones in a `_migrations` table.
- Every table storing client-owned data (a contact, conversation, order,
  or anything not purely global reference data) gets a `client_id`
  (or equivalent tenant-scoping) column, has RLS enabled, and has
  explicit select/insert/update/delete policies scoped to that column —
  follow the pattern in `packages/core/supabase/rls-templates.sql`. Deny
  by default; RLS policies are the only thing that grants access.
- Index the isolation column — RLS-filtered queries hit it on every
  request.
- Migrations should be idempotent-safe to review (use `if not exists` /
  `if exists` where reasonable) but are not re-run automatically — the
  `_migrations` tracking table is what prevents re-application, not the
  SQL itself.
- Never hand-edit a migration file that's already been applied to a live
  project. Write a new migration instead.
