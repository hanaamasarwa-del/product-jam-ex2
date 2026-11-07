// Code in this folder is imported by BOTH the browser (client/) and the
// server (server/). That means it can only use plain JavaScript and TypeScript:
// no `document`, no `window`, and nothing that only exists on Cloudflare.
//
// In practice this is where the Zod schemas live, so that the browser and the
// server agree on exactly what the data looks like.

/** The shape of every error the API returns. */
export type ApiError = {
  error: {
    /** Short and machine-readable, e.g. "not_found" or "invalid_input". */
    code: string;
    /** Safe to show to the user. */
    message: string;
    /**
     * Only on validation errors: which field was wrong and why, so a form
     * can show the message next to the right input.
     */
    fields?: Record<string, string>;
  };
};

/** True if `value` looks like an error body from our API. */
export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null) return false;
  const maybe = value as { error?: { code?: unknown; message?: unknown } };
  return (
    typeof maybe.error === "object" &&
    maybe.error !== null &&
    typeof maybe.error.code === "string" &&
    typeof maybe.error.message === "string"
  );
}

/*
 * Note: the Zod schemas are deliberately NOT re-exported here.
 *
 * Zod is a real download for the browser, and this file is imported by
 * client/lib/api.ts on every page. Re-exporting the schemas from here would
 * put Zod into the bundle for visitors who never open a form. Import
 * schemas from their own file instead:
 *
 *     import { createEventSchema } from "@shared/schemas/events";
 */
