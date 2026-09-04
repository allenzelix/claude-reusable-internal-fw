import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Message, RespondIoWebhookEvent } from './types';

export interface WebhookHandlerConfig {
  webhookSecret: string;
  /** Header respond.io sends the HMAC signature in. Defaults to 'x-respondio-signature'. */
  signatureHeader?: string;
}

export type MessageHandler = (message: Message) => Promise<void> | void;

/**
 * Verifies an HMAC-SHA256 signature over the raw request body.
 * Confirm the exact header name and algorithm against your respond.io
 * workspace's webhook settings before relying on this in production.
 */
export function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== providedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

/** Maps a raw respond.io webhook event into this package's normalized Message shape. */
export function parseMessage(event: RespondIoWebhookEvent): Message | null {
  if (!event.message) return null;

  const { message, contact } = event;

  return {
    id: message.messageId,
    contactId: contact.id,
    contactName: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || undefined,
    channel: event.event,
    direction: message.traffic === 'incoming' ? 'inbound' : 'outbound',
    text: message.message.text ?? '',
    raw: event,
    receivedAt: new Date(message.timestamp * 1000),
  };
}

/**
 * Verifies, parses, and dispatches a respond.io webhook request.
 * Client apps call this from their `app/api/webhook/respond-io/route.ts`
 * and supply their own handler for what happens with each message.
 */
export async function handleRespondIoWebhook(
  request: Request,
  config: WebhookHandlerConfig,
  handler: MessageHandler
): Promise<Response> {
  const rawBody = await request.text();
  const signatureHeader = config.signatureHeader ?? 'x-respondio-signature';
  const signature = request.headers.get(signatureHeader);

  if (!verifySignature(rawBody, signature, config.webhookSecret)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let event: RespondIoWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  const message = parseMessage(event);
  if (!message) {
    // Not a message event (e.g. contact.assignee_updated) — acknowledge and skip.
    return new Response('OK', { status: 200 });
  }

  await handler(message);

  return new Response('OK', { status: 200 });
}
