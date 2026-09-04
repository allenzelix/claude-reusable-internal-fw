# Architecture

## Why the core/clients split exists

This framework runs the same class of system — a respond.io-connected AI
agent, backed by Supabase, deployed on Vercel — for multiple unrelated
businesses at once. Without a hard split, two failure modes show up fast:

1. **Fixes don't propagate.** A better retry/backoff strategy, a bug fix
   in signature verification, a better-structured prompt-composition
   function — discovered while working on one client — either has to be
   manually re-applied to every other client's copy, or (worse) never
   gets re-applied and clients silently drift out of sync in quality and
   correctness.
2. **Business logic leaks sideways.** Once one client's hardcoded rule
   ("if clientName === 'acme', do X") lands in shared code, every other
   client is now running code that was never written with them in mind.
   This is how a fix for one client becomes a regression for another.

The split solves both: `packages/core` is the only place logic is shared,
and it is contractually generic (see the golden rule in the root
`CLAUDE.md`) — anything that varies per client is forced through
`ClientConfig`, tool registration, or Supabase project/schema selection,
never a branch. `clients/<name>` is where everything specific to one
business lives, isolated enough that deleting a client folder should never
affect another client's behavior.

## Worked example: adding a new client end to end

Say you're onboarding "Acme Dental" (`acme-dental`), a dental clinic that
wants a respond.io-connected agent for appointment FAQs and booking
handoff.

1. **Copy the app scaffold.**
   `packages/templates/nextjs-client-app` → `clients/acme-dental/app`.
   Nothing in `packages/core` is touched — the template only imports from
   `@internal/core`'s public subpath exports.
2. **Write `clients/acme-dental/config.ts`**, a `ClientConfig` implementing
   `packages/core/prompt-engine/types.ts`: tone ("warm, reassuring, no
   medical claims"), domain, escalation trigger ("user describes a
   symptom or asks a medical question"), hard constraints ("never
   diagnose," "never quote a price without checking the database"), data
   grounding rules ("never confirm an appointment slot without checking
   the calendar table").
3. **Write `clients/acme-dental/CLAUDE.md`** — the human-readable version
   of the same rules, plus the specific respond.io flow IDs for this
   workspace.
4. **Write `clients/acme-dental/migrations/0001_init.sql`** — an
   `appointments` table with a `client_id`-scoped RLS policy, following
   `packages/core/supabase/rls-templates.sql`. Apply it with
   `packages/core/supabase/migration-runner.ts`.
5. **Write `clients/acme-dental/app/lib/tools.ts`** — this client's tool
   implementations (`check_appointment_slot`, `book_appointment`,
   `escalate`), built against Acme's own Supabase schema. These are
   registered into `runAgentLoop({ tools })` from
   `packages/core/agent-runtime`.
6. **Deploy** `clients/acme-dental/app` to its own Vercel project, with
   `SUPABASE_URL`, `SUPABASE_KEY`, `RESPONDIO_API_KEY`,
   `RESPONDIO_WEBHOOK_SECRET` set for that project.

At no point does this touch `packages/core`. If, midway through, you
notice `withRetry`'s default `maxAttempts` is too low for how
appointment-booking calls actually behave — that's a `packages/core`
change, made once, and every other client benefits immediately on their
next deploy.

## Core vs. `overrides/`: the decision test

**Test:** if this logic would break another client if it were moved into
`packages/core`, it belongs in `clients/<name>/overrides/`. If it's just
not built generically yet, build the generic version in `packages/core`
instead of reaching for an override as a shortcut.

Examples:

- *A client's CRM export uses a nonstandard CSV dialect.* This is a
  one-off parser only that client needs — `overrides/`. Building a
  "generic CSV parser" in core for one client's quirk would be premature
  abstraction with no second user.
- *You want retries to also treat HTTP 503 as transient, not just 429.*
  This is a general improvement to `withRetry` that helps every client —
  build it in `packages/core/respond-io/retry.ts` as a configurable
  default (or an `isRateLimited`-style predicate), not as a client-local
  copy of the retry function.
- *One client wants their agent to check inventory before confirming an
  order, but no other client has inventory at all.* The `check_inventory`
  tool itself is client-specific — `overrides/` or that client's `lib/tools.ts`
  is correct. But if you find yourself writing the same "call a tool,
  then re-verify its result before trusting it in the prompt" pattern for
  a second client, that pattern (not the specific tool) is a candidate for
  `packages/core/agent-runtime`.

## Versioning `packages/core`

There is no version tracking yet — every client currently consumes
`packages/core` directly via the workspace (`workspace:*`), so a change
takes effect for every client on their next deploy, with no way to pin an
older client to an older core behavior.

If/when that becomes a problem (a core change needs a migration period, or
a client needs to freeze on a known-good core version before a change
rolls out further):

1. Start actually bumping `packages/core/package.json`'s `version` field
   on meaningful changes (semver: patch for bug fixes, minor for
   backward-compatible additions like a new `ClientConfig` field, major
   for anything that changes an existing function's signature or
   behavior).
2. Replace `"@internal/core": "workspace:*"` in a client's `package.json`
   with a pinned version range once that client needs to stop tracking
   `main` directly — this only makes sense once `packages/core` is
   published somewhere workspace protocols can resolve a fixed version
   from (a private npm registry, or a git tag reference), which isn't
   set up yet.
3. Keep a changelog entry per core release describing what changed and
   which clients (if any) needed a config change to adopt it.
