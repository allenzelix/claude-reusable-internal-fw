import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseEnvConfig {
  url: string;
  serviceRoleKey: string;
}

/**
 * Typed Supabase client factory. Each client app calls this with its own
 * project's URL and service role key — packages/core never hardcodes a
 * project reference.
 */
export function createSupabaseClient(config: SupabaseEnvConfig): SupabaseClient {
  if (!config.url || !config.serviceRoleKey) {
    throw new Error('createSupabaseClient: url and serviceRoleKey are required');
  }

  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false },
  });
}
