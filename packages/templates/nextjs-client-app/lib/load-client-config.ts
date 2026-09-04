import type { ClientConfig } from '@internal/core/prompt-engine';

/**
 * Loads this client's config.ts. Assumes the standard onboarding layout:
 * this app scaffold lives at clients/<name>/app, and config.ts sits one
 * level up at clients/<name>/config.ts.
 */
export async function loadClientConfig(): Promise<ClientConfig> {
  const mod = await import('../../config');
  return mod.clientConfig;
}
