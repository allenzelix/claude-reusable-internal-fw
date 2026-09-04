---
name: respondio-integration
description: Reference for building or debugging respond.io integrations against this repo's packages/core/respond-io package — payload shapes, where secrets live, how retries/rate-limiting are configured. Use when writing a new client's webhook handling, adding an outbound respond.io call, or debugging a respond.io-related error.
---

# respond.io integration reference

## Where things live

- `packages/core/respond-io/types.ts` — `RespondIoWebhookEvent`,
  `RespondIoContact`, `RespondIoMessagePayload`, and the normalized
  `Message` type every client handler receives.
- `packages/core/respond-io/webhook-handler.ts` — `verifySignature`,
  `parseMessage`, and `handleRespondIoWebhook` (the function client apps
  call from `app/api/webhook/respond-io/route.ts`).
- `packages/core/respond-io/retry.ts` — `withRetry`, an exponential
  backoff wrapper for outbound calls to the respond.io API.

## Inbound: webhook payload shape

respond.io sends an event object with an `event` type
(`message.received`, `message.sent`, `contact.assignee_updated`, …), a
`contact`, and — for message events — a `message` block containing the
actual message payload and a `traffic` field (`incoming`/`outgoing`).
`parseMessage()` collapses this into the flat `Message` shape client code
actually works with. If a webhook is arriving but `parseMessage` returns
`null`, the event type isn't a message event — that's expected for e.g.
`contact.assignee_updated`.

**Payload shapes drift.** Before wiring a new client, pull a real sample
webhook payload from that client's respond.io workspace and diff it
against `types.ts`. Don't assume the shape matches what's typed here
without checking.

## Secrets

- `RESPONDIO_WEBHOOK_SECRET` — per client, set in
  `clients/<name>/app/.env.local`. Used by `verifySignature` to check the
  `x-respondio-signature` header (configurable via
  `WebhookHandlerConfig.signatureHeader` if a workspace uses a different
  header name).
- `RESPONDIO_API_KEY` — per client, used for outbound calls (sending
  messages, updating contacts). Never shared across clients, never
  committed.

Both live only in that client's `.env.local` / Vercel project env vars —
never in `packages/core` or the template.

## Outbound: retries and rate limiting

Wrap every outbound respond.io API call in `withRetry`:

```ts
import { withRetry } from '@internal/core/respond-io';

await withRetry(() => sendMessage(contactId, text), { maxAttempts: 5 });
```

`withRetry` classifies HTTP 429 responses as rate-limited and applies a
longer floor delay (2s+) before retrying, since respond.io's rate limit
windows are short. Non-429 failures use standard exponential backoff.
Override `isRateLimited` if a call site needs different classification
logic (e.g. respond.io's bulk-send endpoints may signal limits
differently — check the response body, not just status, if 429s aren't
being reported directly).

## Debugging

For anything beyond a quick lookup — a specific failing request,
suspected signature mismatch, or retry misbehavior — use the
`webhook-debugger` subagent, which works through signature verification,
retry/backoff, rate-limit handling, and payload shape mismatches
systematically.
