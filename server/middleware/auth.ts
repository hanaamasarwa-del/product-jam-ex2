import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from "jose";
import type { AppEnv } from "../env";
import { fail } from "../lib/errors";

/*
 * How logging in works, from the server's side.
 *
 * When someone logs in, Supabase gives the browser a "token" - a long string
 * that says who they are, signed by Supabase so it cannot be faked. The
 * browser sends it with every request (client/lib/api.ts does this for you):
 *
 *     Authorization: Bearer eyJhbGci...
 *
 * Our job here is to check that signature. We do it ourselves, using
 * Supabase's public keys, so there is no extra round trip to Supabase on
 * every single request.
 */

type JwkSet = ReturnType<typeof createRemoteJWKSet>;

/*
 * A cache of Supabase's public keys, so we don't refetch them constantly.
 *
 * You will read elsewhere that server code must not keep anything in a
 * variable between requests, and that is right - Cloudflare can throw your
 * server away at any moment. This is the rare exception, and only because
 * nothing breaks if it disappears: these are public keys, and losing them
 * just means fetching them again. Never cache user data like this.
 */
const jwksByProject = new Map<string, JwkSet>();

function getJwks(supabaseUrl: string): JwkSet {
  let jwks = jwksByProject.get(supabaseUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
      {
        cacheMaxAge: 10 * 60_000,
        cooldownDuration: 30_000,
        timeoutDuration: 5_000,
      },
    );
    jwksByProject.set(supabaseUrl, jwks);
  }
  return jwks;
}

/**
 * Rejects the request with 401 unless it carries a valid login token.
 * If it does, the user is available to handlers as `c.get("user")`.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return fail(c, 401, "unauthorized", "You need to log in to see this.");
  }

  const token = header.slice("Bearer ".length);

  try {
    const { payload } = await jwtVerify(token, getJwks(c.env.SUPABASE_URL), {
      issuer: `${c.env.SUPABASE_URL}/auth/v1`,
    });

    if (typeof payload.sub !== "string") {
      return fail(
        c,
        401,
        "unauthorized",
        "We could not identify you. Please log in again.",
      );
    }

    c.set("user", {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
    });
  } catch (error) {
    // Expired, edited, or signed by someone who is not our Supabase project.
    if (error instanceof joseErrors.JOSEError) {
      return fail(
        c,
        401,
        "unauthorized",
        "Your session has expired. Please log in again.",
      );
    }
    // We could not reach Supabase to fetch the public keys, so we cannot tell
    // whether this token is genuine. That is not the user's fault and it is
    // not a bug in this handler - by far the most likely cause is a wrong or
    // missing SUPABASE_URL. Say so, instead of a blank 500.
    console.error("Could not fetch Supabase JWKS:", error);
    return fail(
      c,
      503,
      "auth_unavailable",
      "Could not verify your login right now. If this keeps happening, check that SUPABASE_URL is correct (.env locally, the Cloudflare dashboard in production).",
    );
  }

  await next();
});
