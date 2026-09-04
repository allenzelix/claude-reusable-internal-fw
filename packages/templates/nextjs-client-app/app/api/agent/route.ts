import { composePrompt } from '@internal/core/prompt-engine';
import { runAgentLoop } from '@internal/core/agent-runtime';
import type { ModelMessage } from 'ai';
import { loadClientConfig } from '../../../lib/load-client-config';
// import { tools } from '../../../lib/tools'; // this client's tool implementations, incl. `escalate`

export async function POST(request: Request): Promise<Response> {
  const clientConfig = await loadClientConfig();
  const { messages } = (await request.json()) as { messages: ModelMessage[] };

  const systemPrompt = composePrompt(clientConfig);

  const result = await runAgentLoop({
    model: 'anthropic/claude-sonnet-5',
    systemPrompt,
    tools: {}, // replace with this client's ToolSet, including an `escalate` tool
    messages,
    onEscalate: async ({ reason }) => {
      console.log(`[${clientConfig.clientName}] escalation triggered: ${reason}`);
    },
  });

  return Response.json(result);
}
