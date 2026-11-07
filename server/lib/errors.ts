import { zValidator } from "@hono/zod-validator";
import type { Context, ValidationTargets } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ZodType } from "zod";

/**
 * Every error response in this app has the same shape:
 *
 *   { "error": { "code": "not_found", "message": "No such event." } }
 *
 * Always use this helper instead of building an error response by hand, so the
 * browser only ever has to understand one format.
 */
export function fail(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
) {
  return c.json({ error: { code, message } }, status);
}

/**
 * The part of a Zod error we actually use. Written out rather than imported,
 * because Zod exposes several slightly different error types and this is the
 * shape all of them share.
 */
type ValidationFailure = {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
};

/**
 * Turns a Zod validation failure into our standard error body, with a
 * per-field breakdown the form can use:
 *
 *   { "error": { "code": "invalid_input", "message": "...",
 *                "fields": { "title": "Please enter a title" } } }
 *
 * Use it through `validate()` below rather than calling it directly.
 */
export function failValidation(c: Context, error: ValidationFailure) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    // issue.path is an array like ["title"]. Join it so nested fields read
    // as "address.city". Skip the rare issue that has no path at all.
    const key = issue.path.join(".");
    if (key && !(key in fields)) fields[key] = issue.message;
  }

  const first = error.issues[0]?.message ?? "The data sent is not valid";
  return c.json(
    { error: { code: "invalid_input", message: first, fields } },
    400,
  );
}

/**
 * Checks part of the request against a schema before your handler runs.
 *
 *     .post("/", validate("json", createEventSchema), (c) => {
 *       const input = c.req.valid("json"); // already checked, fully typed
 *     })
 *
 * If it doesn't match, the request stops here with a 400 and never reaches
 * your handler.
 */
export function validate<
  T extends ZodType,
  Target extends keyof ValidationTargets,
>(target: Target, schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) return failValidation(c, result.error);
  });
}
