/**
 * Everything that varies per client. `compose-prompt.ts` turns this into a
 * system prompt; nothing in packages/core should ever hardcode values that
 * belong here.
 */
export interface ClientConfig {
  clientName: string;
  /** What business this client is in — used to frame the agent's role. */
  domain: string;
  /** Tone/voice instructions, written as directives (e.g. "Warm, concise, no emojis"). */
  tone: string;
  /** Primary response language. */
  language: string;
  /** Condition under which the agent must stop and hand off to a human. */
  escalationTrigger: string;
  /** Things the agent must never do, regardless of what the user asks. */
  hardConstraints: string[];
  /** Rules forcing the agent to check real data instead of guessing. */
  dataGroundingRules: string[];
}
