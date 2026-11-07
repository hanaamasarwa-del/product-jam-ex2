import { Hono } from "hono";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AppEnv } from "../env";
import { requireAuth } from "./auth";

/*
 * The most important test in this project: it checks that a request
 * cannot reach a protected route without a real, unexpired token from
 * Supabase. If this breaks, anyone can read anyone's data.
 *
 * We do not talk to Supabase here. We make our own signing key, pretend
 * to be Supabase's public-key endpoint, and sign test tokens with it.
 */

const SUPABASE_URL = "https://example-project.supabase.co";
const ISSUER = `${SUPABASE_URL}/auth/v1`;
const USER_ID = "11111111-1111-4111-8111-111111111111";

/** Signs a token the way Supabase would. `expiresIn` accepts "1h", "-5m", ... */
let signToken: (expiresIn?: string) => Promise<string>;
/** Signs with the correct key but lets the test choose the issuer. */
let signWithIssuer: (issuer: string) => Promise<string>;
let app: Hono<AppEnv>;
const realFetch = globalThis.fetch;

beforeAll(async () => {
  // Supabase signs tokens with ES256. Make a matching key pair.
  const { privateKey, publicKey } = await generateKeyPair("ES256", {
    extractable: true,
  });
  const publicJwk = {
    ...(await exportJWK(publicKey)),
    kid: "test-key",
    alg: "ES256",
  };

  // Stand in for https://<project>.supabase.co/auth/v1/.well-known/jwks.json
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/.well-known/jwks.json")) {
      return Response.json({ keys: [publicJwk] });
    }
    throw new Error(`unexpected fetch in test: ${url}`);
  }) as typeof fetch;

  signToken = (expiresIn = "1h") =>
    new SignJWT({ email: "test@example.com" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(ISSUER)
      .setSubject(USER_ID)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(privateKey);

  signWithIssuer = (issuer: string) =>
    new SignJWT({ email: "test@example.com" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(issuer)
      .setSubject(USER_ID)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);

  app = new Hono<AppEnv>();
  app.use("/protected", requireAuth);
  app.get("/protected", (c) => c.json({ user: c.get("user") }));
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

/** Calls the protected route with whatever Authorization header we like. */
function call(authorization?: string) {
  return app.request(
    "/protected",
    authorization ? { headers: { Authorization: authorization } } : {},
    { SUPABASE_URL, SUPABASE_SECRET_KEY: "sb_secret_test" },
  );
}

describe("requireAuth", () => {
  it("lets a valid token through, and says who it is", async () => {
    const response = await call(`Bearer ${await signToken()}`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: { id: USER_ID, email: "test@example.com" },
    });
  });

  it("rejects a request with no Authorization header", async () => {
    const response = await call();
    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("unauthorized");
  });

  it("rejects a token that is not a token", async () => {
    expect((await call("Bearer not-a-token")).status).toBe(401);
  });

  it("rejects a token with a tampered signature", async () => {
    const token = await signToken();
    const tampered = token.slice(0, -3) + (token.endsWith("A") ? "B" : "A");
    expect((await call(`Bearer ${tampered}`)).status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const expired = await signToken("-5m"); // expired five minutes ago
    expect((await call(`Bearer ${expired}`)).status).toBe(401);
  });

  it("rejects a token from a different Supabase project", async () => {
    // Correctly signed, not expired - but `iss` points somewhere else.
    const wrongProject = await signWithIssuer(
      "https://someone-elses-project.supabase.co/auth/v1",
    );
    expect((await call(`Bearer ${wrongProject}`)).status).toBe(401);
  });

  it("rejects a token signed with the wrong key", async () => {
    const { privateKey } = await generateKeyPair("ES256", {
      extractable: true,
    });
    const forged = await new SignJWT({ email: "attacker@example.com" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(ISSUER)
      .setSubject(USER_ID)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);
    expect((await call(`Bearer ${forged}`)).status).toBe(401);
  });
});
