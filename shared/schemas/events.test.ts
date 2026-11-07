import { describe, expect, it } from "vitest";
import { createEventSchema, updateEventSchema } from "./events";

/*
 * These schemas decide what counts as a valid event, for both the browser
 * and the server. Testing them here means testing both at once.
 *
 * This file is also the shortest example of how to write a test in this
 * project. Copy its shape.
 */

const valid = {
  title: "Volunteer evening",
  starts_at: "2026-12-01T18:00:00.000Z",
};

describe("createEventSchema", () => {
  it("accepts a title and a date", () => {
    const result = createEventSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = createEventSchema.safeParse({ ...valid, title: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["title"]);
  });

  it("rejects a date that is not a date", () => {
    const result = createEventSchema.safeParse({
      ...valid,
      starts_at: "next tuesday",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["starts_at"]);
  });
});

describe("updateEventSchema", () => {
  it("accepts just one field", () => {
    expect(updateEventSchema.safeParse({ title: "New" }).success).toBe(true);
  });
});
