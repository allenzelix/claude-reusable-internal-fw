---
description: Run lint/tests, review code and security, and check for client-specific logic leaked into packages/core before deploying
---

Run, in order, and report the result of each before moving on:

1. **Lint and tests**

```bash
pnpm --filter @internal/core typecheck
pnpm --filter @internal/core test
```

2. **Core isolation check** — search `packages/core` for signs that
   client-specific logic has leaked in:

```bash
# any client folder name literally referenced in core
for c in clients/*/; do
  name=$(basename "$c")
  [ "$name" = "_example" ] && continue
  grep -rn "$name" packages/core && echo "VIOLATION: client name '$name' referenced in packages/core"
done

# hardcoded conditional branches keyed on a client identifier
grep -rn "clientName ===" packages/core
grep -rn "clientId ===" packages/core

# respond.io flow IDs or other suspiciously specific literals
grep -rnE "flow_[a-zA-Z0-9_]+" packages/core
```

3. **Report** — list every match found in step 2 as a violation with the
   file and line. For each, state whether it should be:
   - generalized into a new configurable field on `ClientConfig` /
     `AgentLoopOptions` (if the underlying need is legitimately generic), or
   - deleted from `packages/core` entirely and moved to the specific
     client's `config.ts` or `overrides/` (if it's genuinely one-off).

   If step 2 finds nothing, say so explicitly. Do not proceed to suggest
   a deploy is safe if step 1 failed — report the failure and stop.

4. **Code review** — invoke the `code-reviewer` subagent against the
   pending diff (`git diff`, staged and unstaged). It checks the diff
   against `.claude/rules/`, dead code, missing error handling, and
   untyped `any`, on top of the same isolation check as step 2.

5. **Security review** — invoke the `security-reviewer` subagent against
   the pending diff. Required if the diff touches auth, any `app/api/**`
   route, a webhook handler, a database query, or anything reading
   env/secrets — but run it on every `/deploy-check` regardless, since
   that's cheaper than missing one.

6. **Final report** — combine findings from steps 2, 4, and 5 into one
   list, most severe first. State plainly whether it's safe to deploy: no
   if step 1 failed, or if step 4/5 surfaced a high/critical finding that
   hasn't been addressed. Otherwise, list any medium/low findings as
   non-blocking notes.
