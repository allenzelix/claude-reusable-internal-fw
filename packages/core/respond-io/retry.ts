export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  isRateLimited?: (error: unknown) => boolean;
}

function defaultIsRateLimited(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const err = error as { status?: number; statusCode?: number; response?: { status?: number } };
  const status = err.status ?? err.statusCode ?? err.response?.status;
  return status === 429;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exponential-backoff retry wrapper for outbound respond.io API calls.
 * Rate-limited failures (HTTP 429) get a longer floor delay than other
 * transient failures, since respond.io's rate limit windows are typically
 * on the order of seconds.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 5;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 15_000;
  const isRateLimited = options.isRateLimited ?? defaultIsRateLimited;

  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= maxAttempts) break;

      const rateLimited = isRateLimited(error);
      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.random() * backoff * 0.2;
      const delay = rateLimited ? Math.max(backoff, 2000) + jitter : backoff + jitter;

      await sleep(delay);
    }
  }

  throw lastError;
}
