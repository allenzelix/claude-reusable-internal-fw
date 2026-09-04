---
description: Interactively scaffold a new client end to end
---

Ask the user, one at a time if not already given in their message:

1. Client name (short kebab-case slug, e.g. `acme-dental`) — this becomes
   the `clients/<name>` folder and the `<name>-app` package name.
2. Business domain — what the business does and who its customers are.
3. respond.io API key and the flow ID(s) this client's agent needs
   (at minimum: the flow handing conversations to the agent, and the
   human-handoff flow used on escalation).

Once you have all three, invoke the `client-onboarding` skill and follow
it step by step to scaffold the client. Do not skip steps in that skill
even if some information (e.g. Supabase project details) still needs to
be gathered along the way — ask for it when that step is reached rather
than blocking up front.
