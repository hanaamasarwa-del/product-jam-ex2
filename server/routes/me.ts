import { Hono } from "hono";
import type { AppEnv } from "../env";

/**
 * Who am I?
 *
 * Requires a login. The user comes from the auth middleware, which already
 * checked the token - so by the time we get here, `c.get("user")` is
 * trustworthy.
 */
export const me = new Hono<AppEnv>().get("/", (c) => {
  const user = c.get("user");
  return c.json({ id: user.id, email: user.email });
});
