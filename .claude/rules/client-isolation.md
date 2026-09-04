---
paths:
  - "clients/**"
---

# Client isolation — strict

- Never import one client's `overrides/` into another client's code.
- Never reference another client's `config.ts` from anywhere except that
  client's own `app/`.
- Never copy a business rule, tone string, hard constraint, or flow ID
  from one client into `packages/core` without first generalizing it into
  a configurable option that every client can use — a hardcoded branch
  for one client is a golden-rule violation (see root `CLAUDE.md`).
- If two clients independently need the same non-generic logic, that's a
  signal it might actually belong in `packages/core` as a configurable
  option — flag it for a decision rather than silently duplicating it a
  third time.
- When in doubt whether something belongs in `packages/core` vs. a
  client's `overrides/`, use the test in
  `clients/_example/overrides/README.md`: would moving it to core break
  another client, or is it just not built generically yet?
