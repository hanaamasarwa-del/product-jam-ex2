import { z } from "zod";

/*
 * The rules for what an "event" looks like, written once and used by both
 * sides: the server checks every request against them before touching the
 * database, and the browser uses the types they produce.
 *
 * Writing them once is the point. If the two sides disagreed about what an
 * event is, you would get bugs that only show up in production.
 *
 * To add a field: add it here, add it to the migration in supabase/migrations/,
 * and it flows through to both sides automatically.
 */

/** A full event, as the API returns it. Dates are ISO strings. */
export const eventSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  starts_at: z.string(),
  image_path: z.string().nullable(),
  created_at: z.string(),

  /*
   * A temporary link the browser can load the image from. The server adds
   * it to every response; it is NOT a column in the database, because it
   * expires after an hour. Store image_path, display image_url.
   */
  image_url: z.string().nullable(),
});

/** What you must send to create one. The server fills in the rest. */
export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Please enter a title")
    .max(200, "The title is too long"),
  description: z
    .string()
    .trim()
    .max(2000, "The description is too long")
    .nullish(),
  starts_at: z.iso.datetime({ offset: true, message: "Invalid date" }),
  image_path: z.string().nullish(),
});

/** What you may send to change one: any of the fields above. */
export const updateEventSchema = createEventSchema.partial();

/** Just an id in the URL, e.g. /api/events/:id */
export const eventIdParamSchema = z.object({ id: z.uuid("Invalid id") });

// `z.infer` reads the TypeScript type straight off the schema above, so the
// type and the validation can never drift apart. Never hand-write these.
export type Event = z.infer<typeof eventSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
