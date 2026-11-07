import { describe, expect, it, vi } from "vitest";
import { retryWhileBusy } from "./retry";

const busy = new Error("busy");
const broken = new Error("broken");
const isBusy = (error: unknown) => error === busy;

/** A `wait` that does not really wait, and remembers how long it was asked to. */
function fakeWait() {
  const waits: number[] = [];
  return { waits, wait: async (ms: number) => void waits.push(ms) };
}

describe("retryWhileBusy", () => {
  it("returns the answer straight away when it is not busy", async () => {
    const { wait, waits } = fakeWait();
    const call = vi.fn().mockResolvedValue("done");
    expect(await retryWhileBusy(call, { isBusy, wait })).toBe("done");
    expect(call).toHaveBeenCalledTimes(1);
    expect(waits).toEqual([]);
  });

  it("waits and asks again while it is busy, then returns the answer", async () => {
    const { wait, waits } = fakeWait();
    const call = vi
      .fn()
      .mockRejectedValueOnce(busy)
      .mockRejectedValueOnce(busy)
      .mockResolvedValue("saved by someone else");
    const result = await retryWhileBusy(call, { isBusy, wait, delayMs: 1000 });
    expect(result).toBe("saved by someone else");
    expect(call).toHaveBeenCalledTimes(3);
    expect(waits).toEqual([1000, 1000]);
  });

  it("gives up after the number of attempts it was allowed, with the busy error", async () => {
    const { wait, waits } = fakeWait();
    const call = vi.fn().mockRejectedValue(busy);
    await expect(
      retryWhileBusy(call, { isBusy, wait, attempts: 4 }),
    ).rejects.toBe(busy);
    expect(call).toHaveBeenCalledTimes(4);
    expect(waits).toHaveLength(3);
  });

  it("does not retry any other error", async () => {
    const { wait, waits } = fakeWait();
    const call = vi.fn().mockRejectedValue(broken);
    await expect(retryWhileBusy(call, { isBusy, wait })).rejects.toBe(broken);
    expect(call).toHaveBeenCalledTimes(1);
    expect(waits).toEqual([]);
  });

  it("stops retrying as soon as a different error appears", async () => {
    const { wait } = fakeWait();
    const call = vi.fn().mockRejectedValueOnce(busy).mockRejectedValue(broken);
    await expect(retryWhileBusy(call, { isBusy, wait })).rejects.toBe(broken);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("waits about half a minute in all by default, enough for Gemini to finish", async () => {
    const { wait, waits } = fakeWait();
    const call = vi.fn().mockRejectedValue(busy);
    await expect(retryWhileBusy(call, { isBusy, wait })).rejects.toBe(busy);
    const total = waits.reduce((sum, ms) => sum + ms, 0);
    expect(total).toBeGreaterThanOrEqual(25_000);
    expect(total).toBeLessThanOrEqual(40_000);
  });
});
