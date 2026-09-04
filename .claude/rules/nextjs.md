---
paths:
  - "clients/**/app/**/*.tsx"
  - "packages/templates/**/*.tsx"
---

# Next.js app code conventions

- App Router only — no `pages/` directory, no `getServerSideProps`/`getStaticProps`.
- Server Components by default. Only add `'use client'` when the component
  needs browser state, effects, or event handlers — push those as low in
  the tree as possible rather than marking a whole page client-side.
- Route handlers (`app/api/**/route.ts`) do the minimal amount of work
  themselves: verify/parse input, delegate to `@internal/core` functions
  or this client's `lib/`, return a `Response`. Business logic does not
  live inline in a route handler.
- Import client-agnostic logic from `@internal/core/*` subpath exports
  (`@internal/core/respond-io`, `@internal/core/prompt-engine`,
  `@internal/core/agent-runtime`, `@internal/core/supabase`), not from
  deep relative paths into `packages/core`.
- Never import another client's `config.ts`, `overrides/`, or `app/` code
  — see `.claude/rules/client-isolation.md`.
- Env vars are read via `process.env.X` at the point of use (route
  handlers, `lib/`), not threaded through as component props.
