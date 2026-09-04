# CLAUDE.md

## Purpose

This repo is a reusable internal framework for building AI agent/automation
systems (Next.js + Supabase + Vercel + respond.io) for multiple client
businesses. It is used by a single agent automation engineer who clones or
copies this repo's structure per engagement. The core/clients split exists
so that improvements made for one client (bug fixes, better retry logic,
prompt-composition improvements) automatically benefit every other client,
while nothing about a specific client's business rules, tone, or IDs can
ever leak into another client's deployment.

## Folder structure

```
packages/core/              generic, client-agnostic logic (respond.io, Supabase, prompt engine, agent runtime)
packages/templates/         app scaffolding meant to be copied into a new client, not imported directly
clients/<name>/app/         a specific client's Next.js app (copied from packages/templates)
clients/<name>/config.ts    that client's ClientConfig (tone, constraints, escalation rule, etc.)
clients/<name>/overrides/   one-off logic that only this client needs
clients/<name>/migrations/  that client's Supabase SQL migrations
clients/_example/           reference client showing the expected shape of a real client folder
docs/architecture.md        the reasoning behind the split, with a worked example
.claude/                    agents, skills, commands, and rules for working in this repo with Claude Code
```

## Golden rule

**Nothing client-specific may be added to `packages/core`.** No business
rules, no tone strings, no flow IDs, no hardcoded client names, no
`if (clientName === 'x')` branches. If a change to `packages/core` is
needed to support one client, it must be exposed as a configurable option
(a new field on `ClientConfig`, a new parameter, a new hook) that every
other client can also use or safely ignore — never a hardcoded branch for
one client.

## Common commands

```bash
# install all workspace dependencies
pnpm install

# run a specific client's app locally (from repo root)
pnpm --filter <client-name>-app dev

# run packages/core's test suite
pnpm --filter @internal/core test

# type-check packages/core
pnpm --filter @internal/core typecheck

# apply a client's pending Supabase migrations
pnpm --filter @internal/core migrate -- <client-name>

# scaffold a new client (interactive, via Claude Code)
# in a Claude Code session: /new-client
```

## Where things go

| If it is...                                              | It goes in...                          |
|------------------------------------------------------------|-----------------------------------------|
| Generic logic reusable by any client                       | `packages/core`                         |
| A client's tone, business rules, or respond.io flow IDs     | `clients/<name>/config.ts`              |
| A one-off exception that only client X needs               | `clients/<name>/overrides/`             |
| UI/app scaffold reused per client                           | `packages/templates`                    |

If you're unsure whether something is generic or client-specific, see the
decision test and worked examples in `docs/architecture.md`.

## Quality gates

Five subagents in `.claude/agents/` cover design, architecture, and
review. Each is discoverable via its `description` (several are
proactive), but here's the map:

| Subagent               | Invoked when...                                                          |
|-------------------------|---------------------------------------------------------------------------|
| `backend-architect`     | Designing a new API endpoint, DB schema, or service boundary              |
| `frontend-developer`    | Building/modifying UI in `clients/*/app` or `packages/templates` — applies the `design-taste` skill and its critique pass automatically |
| `security-reviewer`     | Proactively, after any change touching auth, API routes, webhooks, DB queries, or secrets |
| `code-reviewer`         | Proactively, before a commit or before `/deploy-check`                    |
| `performance-engineer`  | Reviewing `agent-runtime` changes, DB query patterns, or before scaling a client to production traffic |

`/deploy-check` runs `code-reviewer` and `security-reviewer` automatically
as part of its checklist, on top of lint/tests and the core-isolation
check.
