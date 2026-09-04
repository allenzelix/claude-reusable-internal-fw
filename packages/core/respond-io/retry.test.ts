import { describe, expect, it, vi } from 'vitest';
import { withRetry } from './retry';

describe('withRetry', () => {
  it('returns the result on the first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries up to maxAttempts then throws the last error', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error('boom'));

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    const assertion = expect(promise).rejects.toThrow('boom');
    await vi.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it('recovers after a 429 once the rate limit clears', async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValueOnce('recovered');

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
