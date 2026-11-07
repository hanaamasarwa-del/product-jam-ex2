/*
 * What to do when the server says "someone else is already explaining this
 * picture" (409 explanation_in_progress).
 *
 * That is not a failure: it just means another request is waiting for Gemini
 * on the same date. If we wait a moment and ask again, the explanation is
 * usually saved by then and the server hands it back. So we ask again a few
 * times, and only give up if it stays busy for a long while.
 *
 * It takes `isBusy` and `wait` as arguments so it does not need the network
 * or real time to be tested.
 */

export type RetryOptions = {
  /** Is this error the "busy" one, worth waiting for? */
  isBusy: (error: unknown) => boolean;
  /** Resolves after the given number of milliseconds. */
  wait: (ms: number) => Promise<void>;
  /** How many times to try in all. */
  attempts?: number;
  delayMs?: number;
};

export async function retryWhileBusy<T>(
  call: () => Promise<T>,
  { isBusy, wait, attempts = 12, delayMs = 2500 }: RetryOptions,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      // Any other error, or running out of tries, is the caller's problem.
      if (!isBusy(error) || attempt >= attempts) throw error;
      await wait(delayMs);
    }
  }
}
