import { describe, expect, it } from 'vitest';
import { composePrompt } from './compose-prompt';
import type { ClientConfig } from './types';

const baseConfig: ClientConfig = {
  clientName: 'Acme Dental',
  domain: 'dental clinic booking and FAQs',
  tone: 'Warm, concise, professional. No emojis.',
  language: 'English',
  escalationTrigger: 'the user asks about a medical emergency or wants to speak to a human',
  hardConstraints: [
    'Never quote a price without checking the database',
    'Never diagnose a medical condition',
  ],
  dataGroundingRules: [
    'Never state an appointment slot is available without checking the calendar table',
  ],
};

describe('composePrompt', () => {
  it('includes the client name and domain in the role section', () => {
    const prompt = composePrompt(baseConfig);
    expect(prompt).toContain('Acme Dental');
    expect(prompt).toContain('dental clinic booking and FAQs');
  });

  it('includes every hard constraint', () => {
    const prompt = composePrompt(baseConfig);
    for (const constraint of baseConfig.hardConstraints) {
      expect(prompt).toContain(constraint);
    }
  });

  it('includes the escalation trigger', () => {
    const prompt = composePrompt(baseConfig);
    expect(prompt).toContain(baseConfig.escalationTrigger);
  });

  it('omits the hard constraints section when there are none', () => {
    const prompt = composePrompt({ ...baseConfig, hardConstraints: [] });
    expect(prompt).not.toContain('Hard constraints');
  });

  it('omits the data grounding section when there are no rules', () => {
    const prompt = composePrompt({ ...baseConfig, dataGroundingRules: [] });
    expect(prompt).not.toContain('Data grounding');
  });
});
