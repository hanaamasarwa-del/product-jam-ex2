import { describe, expect, it, vi } from "vitest";
import { errorText, formatPictureDate, isExplanationBusy } from "./labels";

/** Looks like the browser's ApiRequestError, without importing the Supabase client. */
function apiError(message: string, code: string) {
  const error = new Error(message) as Error & { code: string };
  error.name = "ApiRequestError";
  error.code = code;
  return error;
}

describe("formatPictureDate", () => {
  it("writes a date out in words", () => {
    expect(formatPictureDate("2024-03-15", "en")).toBe("March 15, 2024");
  });

  it("shows the same day wherever the reader is", () => {
    for (const zone of [
      "Pacific/Honolulu",
      "Asia/Jerusalem",
      "Pacific/Auckland",
    ]) {
      vi.stubEnv("TZ", zone);
      expect(formatPictureDate("2024-03-15", "en"), zone).toBe(
        "March 15, 2024",
      );
    }
    vi.unstubAllEnvs();
  });

  it("gives back what it was given if it is not a date", () => {
    expect(formatPictureDate("soon", "en")).toBe("soon");
  });
});

describe("errorText", () => {
  it("shows the server's own message, which is written for people", () => {
    const error = apiError(
      "We could not get pictures from NASA right now.",
      "nasa_unavailable",
    );
    expect(errorText(error)).toBe(
      "We could not get pictures from NASA right now.",
    );
  });

  it("does not show 'Failed to fetch' when the network is down", () => {
    expect(errorText(new TypeError("Failed to fetch"))).toMatch(
      /Could not reach the server/,
    );
  });

  it("copes with something that is not an error at all", () => {
    expect(errorText(undefined)).toMatch(/Could not reach the server/);
    expect(errorText("oops")).toMatch(/Could not reach the server/);
  });
});

describe("isExplanationBusy", () => {
  it("is true only for the 409 'in progress' answer", () => {
    expect(isExplanationBusy(apiError("busy", "explanation_in_progress"))).toBe(
      true,
    );
    expect(isExplanationBusy(apiError("down", "gemini_unavailable"))).toBe(
      false,
    );
    expect(isExplanationBusy(new Error("explanation_in_progress"))).toBe(false);
    expect(isExplanationBusy(null)).toBe(false);
  });
});
