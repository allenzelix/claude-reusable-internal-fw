---
name: client-onboarding
description: Scaffolds a brand-new client into this repo — copies the Next.js template, creates config.ts and CLAUDE.md, wires up respond.io flow IDs, sets up Supabase, and verifies the webhook responds. Use whenever the user wants to onboard, add, or set up a new client, or invokes /new-client.
---

# Client onboarding

Walk through these steps in order. Confirm the client's name (used for the
folder and package name, so ask for a short kebab-case slug, e.g.
`acme-dental`) before starting.

## 1. Copy the app scaffold

```bash
mkdir -p clients/<name>
cp -r packages/templates/nextjs-client-app clients/<name>/app
```

In `clients/<name>/app/package.json`, rename `"name"` from
`"client-app-template"` to `"<name>-app"` — this is what makes
`pnpm --filter <name>-app dev` work.

Any UI work beyond the scaffold — new pages, components, or layout
changes for this client — should go through the `frontend-developer`
subagent rather than being built ad hoc. It builds against the
`design-taste` skill automatically, so this client's UI gets the same
taste/critique pass as every other client's without having to remember to
invoke it manually.

## 2. Create config.ts

```bash
cp clients/_example/config.ts clients/<name>/config.ts
```

Fill in every field of `ClientConfig` for real — do not leave placeholder
text. If you don't have enough information for `tone`, `hardConstraints`,
`escalationTrigger`, or `dataGroundingRules` yet, ask the user rather than
guessing at business rules.

## 3. Create CLAUDE.md

```bash
cp clients/_example/CLAUDE.md clients/<name>/CLAUDE.md
```

Fill in Business domain, Tone/language rules, Hard constraints, and
Escalation rule to match `config.ts` (they should say the same thing in
prose vs. structured form). Leave "Known edge cases" empty.

## 4. respond.io flow IDs

Ask the user for each flow ID this client's agent will reference (at
minimum: the flow that hands a conversation to this agent, and the flow
used for human handoff on escalation). Record them in `clients/<name>/CLAUDE.md`
under "respond.io flow IDs". Flow IDs are configuration, not code — they
must never be hardcoded into `packages/core` or into the template.

## 5. Set up Supabase

Either create a new Supabase project for this client, or a new schema in a
shared project — ask the user which, since it affects billing and
isolation. Either way:

- Note the project URL and service role key; these go into
  `clients/<name>/app/.env.local` (never committed) as `SUPABASE_URL` /
  `SUPABASE_KEY`.
- Note the direct Postgres connection string — this is `SUPABASE_DB_URL`,
  used only by the migration runner, not by the app itself.

## 6. Run the migration runner

Write an initial migration (at minimum, whatever tables this client's
tools need, following `packages/core/supabase/rls-templates.sql`'s RLS
pattern — the `schema-migrator` subagent can help design this) into
`clients/<name>/migrations/0001_init.sql`, then:

```bash
SUPABASE_DB_URL=<connection string> pnpm --filter @internal/core migrate -- <name>
```

## 7. Confirm the webhook responds

With the client app running (`pnpm --filter <name>-app dev`) and
`RESPONDIO_WEBHOOK_SECRET` set in `.env.local`, send a signed test payload
to `POST /api/webhook/respond-io` and confirm a `200 OK`. If it 401s,
check the signature secret matches what's configured in the respond.io
workspace for this client (see the `respondio-integration` skill).

## Done

At this point `clients/<name>/` should contain `app/`, `config.ts`,
`CLAUDE.md`, `overrides/` (empty, copy `clients/_example/overrides/README.md`
in), and `migrations/`. Nothing in this process should have touched
`packages/core`.
