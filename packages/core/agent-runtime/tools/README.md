# Tools live per client, not here

`packages/core/agent-runtime` defines the tool-calling loop itself
(`agent-loop.ts`), but not a single tool implementation. Tool
implementations are inherently client-specific — a `check_appointment_slot`
tool queries one client's Supabase schema, a `lookup_order` tool queries
another client's. Putting any real tool here would violate the core/clients
split (see the root `CLAUDE.md`).

Where tools actually live: `clients/<name>/app/lib/tools.ts` (or similar),
built as an AI SDK `ToolSet` and passed into `runAgentLoop({ tools })`.

The one convention every client must follow: register a tool named
`escalate` (see `agent-loop.ts`'s `escalationToolName`, default
`'escalate'`) that the model calls when `ClientConfig.escalationTrigger`
is met. What that tool actually does (page a human, post to Slack, tag the
respond.io contact) is entirely up to the client.
