// Shapes for respond.io webhook payloads and the normalized Message type
// this package hands to client code. Field names follow respond.io's
// webhook event format as of writing — re-verify against the current
// respond.io webhook docs for your workspace before wiring a new client,
// since third-party payload shapes can change without notice.

export interface RespondIoContact {
  id: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  countryCode?: string;
  language?: string;
  [key: string]: unknown;
}

export interface RespondIoMessagePayload {
  type: string; // e.g. 'text', 'image', 'attachment'
  text?: string;
  attachment?: {
    type: string;
    url: string;
  };
}

export interface RespondIoWebhookEvent {
  event: 'message.received' | 'message.sent' | 'contact.assignee_updated' | string;
  contact: RespondIoContact;
  message?: {
    messageId: string;
    channelMessageId?: string;
    contactId: number;
    traffic: 'incoming' | 'outgoing';
    message: RespondIoMessagePayload;
    timestamp: number; // unix seconds
  };
  [key: string]: unknown;
}

/** Normalized, typed message handed to a client's message handler. */
export interface Message {
  id: string;
  contactId: number;
  contactName?: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  text: string;
  raw: RespondIoWebhookEvent;
  receivedAt: Date;
}
