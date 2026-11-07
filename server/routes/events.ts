import {
  createEventSchema,
  eventIdParamSchema,
  updateEventSchema,
} from "@shared/schemas/events";
import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "../env";
import { fail, validate } from "../lib/errors";
import { IMAGE_BUCKET, IMAGE_URL_TTL_SECONDS } from "../lib/storage";
import { createAdminClient } from "../lib/supabase";

/*
 * The example resource. Every other resource in your app should look like
 * this one. See docs/05-adding-a-feature.md.
 *
 * Five routes, and one rule running through all of them: an event belongs to
 * the person who made it, so every query is filtered by `c.get("user").id`.
 * The database will not do this for you - Row Level Security is on with no
 * policies, and the server's key bypasses it. Getting this filter right IS
 * the security of your app.
 */

/** The columns we send to the browser. Listed out so adding a private column later doesn't leak it. */
const COLUMNS =
  "id, owner_id, title, description, starts_at, image_path, created_at";

/** An event as it comes back from the database. */
type EventRow = { image_path: string | null };

/**
 * Adds a temporary `image_url` to each event, so the browser can show the
 * picture. The bucket is private, so the stored `image_path` cannot be
 * loaded on its own - it needs a signed link, and those expire, which is
 * why we make them fresh on every request instead of saving them.
 */
async function addImageUrls(
  supabase: ReturnType<typeof createAdminClient>,
  events: EventRow[],
) {
  const paths = events
    .map((event) => event.image_path)
    .filter((path) => path !== null);

  // Ask for all of them in one go, rather than one request per event.
  const signed = paths.length
    ? await supabase.storage
        .from(IMAGE_BUCKET)
        .createSignedUrls(paths, IMAGE_URL_TTL_SECONDS)
    : null;

  return events.map((event) => ({
    ...event,
    image_url:
      signed?.data?.find((item) => item.path === event.image_path)?.signedUrl ??
      null,
  }));
}

export const events = new Hono<AppEnv>()

  // GET /api/events - the logged-in user's events, soonest first.
  .get("/", async (c) => {
    const supabase = createAdminClient(c.env);
    const { data, error } = await supabase
      .from("events")
      .select(COLUMNS)
      .eq("owner_id", c.get("user").id)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("list events failed:", error);
      return fail(c, 500, "database_error", "Could not load the events.");
    }
    return c.json(await addImageUrls(supabase, data));
  })

  // GET /api/events/:id - one event.
  .get("/:id", validate("param", eventIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const supabase = createAdminClient(c.env);

    // Fetch without filtering by owner, so we can tell "does not exist"
    // apart from "exists but is not yours" and answer 404 vs 403.
    const { data, error } = await supabase
      .from("events")
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("get event failed:", error);
      return fail(c, 500, "database_error", "Could not load the event.");
    }
    if (!data) return fail(c, 404, "not_found", "Event not found.");
    if (data.owner_id !== c.get("user").id) {
      return fail(c, 403, "forbidden", "This event does not belong to you.");
    }

    const [withUrl] = await addImageUrls(supabase, [data]);
    return c.json(withUrl);
  })

  // POST /api/events - create one. Responds 201 with the new event.
  .post("/", validate("json", createEventSchema), async (c) => {
    const input = c.req.valid("json");
    const supabase = createAdminClient(c.env);

    const { data, error } = await supabase
      .from("events")
      // Note owner_id comes from the verified token, never from the request
      // body. If it came from the body, anyone could create events as anyone.
      .insert({ ...input, owner_id: c.get("user").id })
      .select(COLUMNS)
      .single();

    if (error) {
      console.error("create event failed:", error);
      return fail(c, 500, "database_error", "Could not create the event.");
    }
    const [created] = await addImageUrls(supabase, [data]);
    return c.json(created, 201);
  })

  // PATCH /api/events/:id - change some fields of one.
  .patch(
    "/:id",
    validate("param", eventIdParamSchema),
    validate("json", updateEventSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const supabase = createAdminClient(c.env);

      // An empty update is almost always a bug in the calling code.
      if (Object.keys(input).length === 0) {
        return fail(c, 400, "invalid_input", "No fields were sent to update.");
      }

      const denied = await assertOwned(c, id);
      if (denied) return denied;

      const { data, error } = await supabase
        .from("events")
        .update(input)
        .eq("id", id)
        .eq("owner_id", c.get("user").id)
        .select(COLUMNS)
        .single();

      if (error) {
        console.error("update event failed:", error);
        return fail(c, 500, "database_error", "Could not update the event.");
      }
      const [updated] = await addImageUrls(supabase, [data]);
      return c.json(updated);
    },
  )

  // DELETE /api/events/:id - remove one. Responds 204 with an empty body.
  .delete("/:id", validate("param", eventIdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const supabase = createAdminClient(c.env);

    const denied = await assertOwned(c, id);
    if (denied) return denied;

    // Find the image first, so we can tidy it up afterwards. Deleting the
    // row alone would leave the file sitting in storage forever, slowly
    // filling up the free tier with pictures nothing points at.
    const { data: existing } = await supabase
      .from("events")
      .select("image_path")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("owner_id", c.get("user").id);

    if (error) {
      console.error("delete event failed:", error);
      return fail(c, 500, "database_error", "Could not delete the event.");
    }

    if (existing?.image_path) {
      // The event is already gone, so a failure here is untidy, not broken.
      await supabase.storage.from(IMAGE_BUCKET).remove([existing.image_path]);
    }

    return c.body(null, 204);
  });

/**
 * Returns an error response if the event is missing or belongs to someone
 * else, and nothing at all if the caller owns it.
 *
 *     const denied = await assertOwned(c, id);
 *     if (denied) return denied;
 */
async function assertOwned(c: Context<AppEnv>, id: string) {
  const { data, error } = await createAdminClient(c.env)
    .from("events")
    .select("owner_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("ownership check failed:", error);
    return fail(c, 500, "database_error", "Something went wrong.");
  }
  if (!data) return fail(c, 404, "not_found", "Event not found.");
  if (data.owner_id !== c.get("user").id) {
    return fail(c, 403, "forbidden", "This event does not belong to you.");
  }
  return null;
}
