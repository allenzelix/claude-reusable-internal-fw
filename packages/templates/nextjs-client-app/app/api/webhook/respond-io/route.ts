import { handleRespondIoWebhook } from '@internal/core/respond-io';
import { loadClientConfig } from '../../../../lib/load-client-config';

export async function POST(request: Request): Promise<Response> {
  const clientConfig = await loadClientConfig();

  return handleRespondIoWebhook(
    request,
    { webhookSecret: process.env.RESPONDIO_WEBHOOK_SECRET! },
    async (message) => {
      // Wire this up to your agent logic — e.g. call POST /api/agent
      // internally, or enqueue a job. Core only guarantees a verified,
      // typed Message reaches this point; what happens next is this
      // client's business.
      console.log(`[${clientConfig.clientName}] inbound message`, message);
    }
  );
}
