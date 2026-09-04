import { generateText, stepCountIs, type ModelMessage, type ToolSet } from 'ai';

export interface AgentLoopOptions {
  /** Model string routed through the Vercel AI Gateway, e.g. "anthropic/claude-sonnet-5". */
  model: string;
  systemPrompt: string;
  /** This client's tool implementations. packages/core defines none itself. */
  tools: ToolSet;
  messages: ModelMessage[];
  /** Max tool-calling steps before the loop force-stops. Defaults to 8. */
  maxSteps?: number;
  /**
   * Name of the tool the model should call to escalate (see
   * compose-prompt.ts, which instructs the model to call this tool rather
   * than trying to resolve an out-of-scope request itself). Every client
   * registers a tool with this name in `tools`. Defaults to 'escalate'.
   */
  escalationToolName?: string;
  onEscalate?: (context: { messages: ModelMessage[]; reason: string }) => void | Promise<void>;
}

export interface AgentLoopResult {
  messages: ModelMessage[];
  finalText: string;
  escalated: boolean;
  stopReason: 'stop' | 'max-steps' | 'escalation';
}

/**
 * Client-agnostic tool-calling loop. Takes an already-composed system
 * prompt (see prompt-engine/compose-prompt.ts), a client's tool
 * implementations, and message history, and runs until the model stops
 * calling tools, the step limit is hit, or the model calls the
 * escalation tool.
 *
 * Escalation is detected by tool call, not by scanning the model's text
 * output for a phrase — free text is too unreliable to gate a handoff on.
 */
export async function runAgentLoop(options: AgentLoopOptions): Promise<AgentLoopResult> {
  const maxSteps = options.maxSteps ?? 8;
  const escalationToolName = options.escalationToolName ?? 'escalate';

  const result = await generateText({
    model: options.model,
    system: options.systemPrompt,
    messages: options.messages,
    tools: options.tools,
    stopWhen: stepCountIs(maxSteps),
  });

  const responseMessages = result.response.messages;
  const finalText = result.text;
  const allMessages = [...options.messages, ...responseMessages];

  const allToolCalls = result.steps.flatMap((step) => step.toolCalls ?? []);
  const escalationCall = allToolCalls.find((call) => call.toolName === escalationToolName);
  const escalated = Boolean(escalationCall);

  if (escalationCall && options.onEscalate) {
    const input = escalationCall.input as Record<string, unknown> | undefined;
    const reason = typeof input?.reason === 'string' ? input.reason : JSON.stringify(input ?? {});
    await options.onEscalate({ messages: allMessages, reason });
  }

  return {
    messages: allMessages,
    finalText,
    escalated,
    stopReason: escalated ? 'escalation' : result.finishReason === 'stop' ? 'stop' : 'max-steps',
  };
}
