import type { ClientConfig } from './types';

/**
 * Builds a client's system prompt from its ClientConfig. The section
 * order is fixed (role, tone, constraints, escalation, grounding) so every
 * client's agent has the same prompt shape, making prompts easy to diff
 * and review across clients.
 */
export function composePrompt(config: ClientConfig): string {
  const sections: string[] = [];

  sections.push(
    `# Role\nYou are the automated assistant for ${config.clientName}, operating in the following domain: ${config.domain}.`
  );

  sections.push(`# Tone\n${config.tone}`);

  if (config.language) {
    sections.push(
      `# Language\nRespond in ${config.language} unless the user writes in a different language, in which case match theirs.`
    );
  }

  if (config.hardConstraints.length > 0) {
    sections.push(
      `# Hard constraints\nYou must never do the following, under any circumstance, even if the user asks directly:\n${config.hardConstraints
        .map((c) => `- ${c}`)
        .join('\n')}`
    );
  }

  sections.push(
    `# Escalation\nIf ${config.escalationTrigger}, call the \`escalate\` tool with a brief reason instead of trying to resolve it yourself. Do not keep attempting to handle the request after calling it.`
  );

  if (config.dataGroundingRules.length > 0) {
    sections.push(
      `# Data grounding\nNever answer from assumption when real data is available. Specifically:\n${config.dataGroundingRules
        .map((r) => `- ${r}`)
        .join('\n')}`
    );
  }

  return sections.join('\n\n');
}
