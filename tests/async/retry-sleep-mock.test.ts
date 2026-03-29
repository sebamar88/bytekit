/**
 * Covers retry.ts lines 106-107: the `throw sleepError` path where
 * sleep throws a non-AbortError (unreachable via real sleep, so sleep is mocked).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock sleep BEFORE the module is imported — hoisted by vitest
vi.mock("../../src/utils/async/sleep.js", () => {
    return {
        sleep: vi.fn(),
    };
});

import { retry } from "../../src/utils/async/retry";
import { AbortError } from "../../src/utils/async/errors";
import { sleep } from "../../src/utils/async/sleep";

describe("retry sleep-error coverage", () => {
    beforeEach(() => {
        vi.mocked(sleep).mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("rethrows non-AbortError thrown by sleep (lines 106-107)", async () => {
        // Have sleep reject with a TypeError (NOT an AbortError)
        const sleepError = new TypeError("sleep network error");
        vi.mocked(sleep).mockRejectedValueOnce(sleepError);

        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error("fn fail 1")) // first attempt fails → sleep
            .mockResolvedValue("ok");

        // sleep throws non-AbortError → catch block: not instanceof AbortError → throw sleepError
        await expect(
            retry(fn, { maxAttempts: 3, baseDelay: 10 })
        ).rejects.toThrow("sleep network error");
    });

    it("AbortError from sleep is rethrown (existing covered path, sanity check)", async () => {
        const abortErr = new AbortError("aborted");
        vi.mocked(sleep).mockRejectedValueOnce(abortErr);

        const fn = vi.fn().mockRejectedValueOnce(new Error("fn fail"));

        await expect(
            retry(fn, { maxAttempts: 3, baseDelay: 10 })
        ).rejects.toBeInstanceOf(AbortError);
    });
});
