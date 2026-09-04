See root CLAUDE.md for global rules. This file covers client-specific context only.

## Business domain

Example Co is a placeholder client used to show the expected shape of a
real client folder. (Fill this in per real client: what the business
sells, who its customers are, and what the agent is for — booking,
support, lead qualification, etc.)

## Tone/language rules

Friendly, concise, professional. No emojis unless the client explicitly
asks for them. Primary language: English.

## Hard constraints (things the agent must never do)

- Never promise a delivery date without checking the order system
- Never make up a policy that is not in the provided knowledge base
- Never quote a price without checking the database

## Escalation rule

If the user is angry, asks for a refund, or explicitly asks for a human,
call the `escalate` tool with a brief reason and stop.

## respond.io flow IDs

- `flow_new_lead`: `REPLACE_WITH_REAL_FLOW_ID`
- `flow_support_handoff`: `REPLACE_WITH_REAL_FLOW_ID`

## Known edge cases

(Empty — this is a reference client with no production traffic. For a real
client, add an entry here each time a live conversation exposes a case
the prompt or tools didn't handle correctly: what happened, what the
agent should have done, and which file was changed to fix it.)
