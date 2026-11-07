import { SignJWT, exportJWK, generateKeyPair } from "jose";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

/*
 * Tests for /api/games, through the REAL app (server/index.ts), so they also
 * prove the routes sit behind the login check.
 *
 * Two things are faked, and nothing else:
 *   - Supabase's public-key endpoint, so we can sign test tokens (the same
 *     trick as server/middleware/auth.test.ts).
 *   - The database: a small in-memory table that understands the few calls
 *     games.ts makes. Its `.eq()` really filters, so if the route forgot to
 *     filter by owner, the isolation tests below would fail.
 */

type Row = Record<string, unknown>;

const db = vi.hoisted(() => ({
  rows: [] as Row[],
  clock: 0,
  failNext: false,
}));

vi.mock("../lib/supabase", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "games") throw new Error(`unexpected table: ${table}`);
      return {
        insert: (values: Row) => ({
          select: () => ({
            single: async () => {
              if (db.failNext) {
                db.failNext = false;
                return { data: null, error: { message: "boom" } };
              }
              const row = {
                id: crypto.randomUUID(),
                // Each row is one second later than the last, so "newest
                // first" has something to sort.
                created_at: new Date(
                  Date.UTC(2026, 10, 7, 12, 0, ++db.clock),
                ).toISOString(),
                ...values,
              };
              db.rows.push(row);
              return { data: row, error: null };
            },
          }),
        }),
        select: () => {
          const filters: [string, unknown][] = [];
          let newestFirst = false;
          const query = {
            eq: (column: string, value: unknown) => {
              filters.push([column, value]);
              return query;
            },
            order: (_column: string, options: { ascending: boolean }) => {
              newestFirst = !options.ascending;
              return query;
            },
            then: (resolve: (value: unknown) => unknown) => {
              if (db.failNext) {
                db.failNext = false;
                return resolve({ data: null, error: { message: "boom" } });
              }
              let found = db.rows.filter((row) =>
                filters.every(([column, value]) => row[column] === value),
              );
              if (newestFirst) found = [...found].reverse();
              return resolve({ data: found, error: null });
            },
          };
          return query;
        },
      };
    },
  }),
}));

// Imported after vi.mock, which vitest moves to the top anyway.
import app from "../index";

const SUPABASE_URL = "https://example-project.supabase.co";
const ENV = { SUPABASE_URL, SUPABASE_SECRET_KEY: "sb_secret_test" };
const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";

let signToken: (userId: string) => Promise<string>;
const realFetch = globalThis.fetch;

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair("ES256", {
    extractable: true,
  });
  const publicJwk = {
    ...(await exportJWK(publicKey)),
    kid: "test-key",
    alg: "ES256",
  };
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/.well-known/jwks.json")) {
      return Response.json({ keys: [publicJwk] });
    }
    throw new Error(`unexpected fetch in test: ${url}`);
  }) as typeof fetch;

  signToken = (userId) =>
    new SignJWT({ email: `${userId.slice(0, 4)}@test.dev` })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);
});

afterAll(() => {
  globalThis.fetch = realFetch;
});

beforeEach(() => {
  db.rows = [];
  db.clock = 0;
  db.failNext = false;
});

/** Calls the API as `userId`, or with no login at all if it is undefined. */
async function call(
  userId: string | undefined,
  method: "GET" | "POST",
  body?: unknown,
  rawBody?: string,
) {
  const headers: Record<string, string> = {};
  if (userId) headers.Authorization = `Bearer ${await signToken(userId)}`;
  if (body !== undefined || rawBody !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const response = await app.request(
    "/api/games",
    {
      method,
      headers,
      body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
    },
    ENV,
  );
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const save = (userId: string | undefined, body: unknown) =>
  call(userId, "POST", body);
const list = (userId: string | undefined) => call(userId, "GET");

// Games used below. See shared/game/rules.test.ts for the board.
const X_WINS = [0, 4, 1, 5, 2]; // X: 0, 1, 2 across
const O_WINS = [0, 5, 1, 6, 15, 7]; // O: 5, 6, 7 across
const DRAW = [0, 2, 1, 3, 6, 4, 7, 5, 8, 10, 9, 11, 14, 12, 15, 13];

describe("POST /api/games: valid games", () => {
  it("saves a game X won, and answers 201 with the saved game", async () => {
    const { status, body } = await save(ALICE, { moves: X_WINS });
    expect(status).toBe(201);
    expect(body).toEqual({
      id: expect.any(String),
      owner_id: ALICE,
      moves: X_WINS,
      result: "x_wins",
      created_at: expect.any(String),
    });
    expect(db.rows).toHaveLength(1);
  });

  it("saves a game O won", async () => {
    const { status, body } = await save(ALICE, { moves: O_WINS });
    expect(status).toBe(201);
    expect(body.result).toBe("o_wins");
  });

  it("saves a draw", async () => {
    const { status, body } = await save(ALICE, { moves: DRAW });
    expect(status).toBe(201);
    expect(body.result).toBe("draw");
  });
});

describe("POST /api/games: cheating", () => {
  it("ignores a result sent by the browser and saves its own", async () => {
    const { status, body } = await save(ALICE, {
      moves: X_WINS,
      result: "o_wins",
    });
    expect(status).toBe(201);
    expect(body.result).toBe("x_wins");
    expect(db.rows[0]?.result).toBe("x_wins");
  });

  it("ignores an owner_id sent by the browser and uses the login", async () => {
    const { status, body } = await save(ALICE, {
      moves: X_WINS,
      owner_id: BOB,
    });
    expect(status).toBe(201);
    expect(body.owner_id).toBe(ALICE);
    expect(db.rows[0]?.owner_id).toBe(ALICE);
  });

  it("rejects a game 'won' in 2 moves with 400, and saves nothing", async () => {
    const { status, body } = await save(ALICE, { moves: [0, 1] });
    expect(status).toBe(400);
    expect(body.error.code).toBe("invalid_input");
    expect(body.error.fields.moves).toBeTruthy();
    expect(db.rows).toHaveLength(0);
  });

  it("rejects a game that did not end with 422, and saves nothing", async () => {
    // Six real moves, but nobody has three in a row and the board is not full.
    const { status, body } = await save(ALICE, { moves: [0, 4, 1, 5, 8, 9] });
    expect(status).toBe(422);
    expect(body.error.code).toBe("invalid_game");
    expect(db.rows).toHaveLength(0);
  });

  it("rejects a cell played twice with 422, naming the move", async () => {
    const { status, body } = await save(ALICE, { moves: [0, 4, 0, 5, 1, 6] });
    expect(status).toBe(422);
    expect(body.error.code).toBe("invalid_game");
    expect(body.error.message).toContain("Move 3");
    expect(db.rows).toHaveLength(0);
  });

  it("rejects a move after the game was already won with 422", async () => {
    const { status, body } = await save(ALICE, { moves: [...X_WINS, 10] });
    expect(status).toBe(422);
    expect(body.error.code).toBe("invalid_game");
    expect(body.error.message).toContain("Move 6");
    expect(db.rows).toHaveLength(0);
  });

  it("rejects a 17th move after a full board with 400, and saves nothing", async () => {
    // A move after a draw can only be a 17th move, and the shape check
    // refuses more than 16 before the replay even starts.
    const { status } = await save(ALICE, { moves: [...DRAW, 0] });
    expect(status).toBe(400);
    expect(db.rows).toHaveLength(0);
  });
});

describe("POST /api/games: invalid input", () => {
  const bad: [string, unknown][] = [
    ["no moves field", {}],
    ["moves is not a list", { moves: "0,4,1,5,2" }],
    ["moves is null", { moves: null }],
    ["a move is a string", { moves: [0, 4, "1", 5, 2] }],
    ["a move is not a whole number", { moves: [0, 4, 1.5, 5, 2] }],
    ["a cell below 0", { moves: [0, 4, -1, 5, 2] }],
    ["a cell above 15", { moves: [0, 4, 16, 5, 2] }],
    ["fewer than 5 moves", { moves: [0, 4, 1, 5] }],
    [
      "more than 16 moves",
      { moves: Array.from({ length: 17 }, (_, i) => i % 16) },
    ],
  ];

  it.each(bad)("answers 400 when %s", async (_name, payload) => {
    const { status, body } = await save(ALICE, payload);
    expect(status).toBe(400);
    expect(body.error.code).toBe("invalid_input");
    expect(db.rows).toHaveLength(0);
  });

  it("does not answer 200 or 201 for a body that is not JSON", async () => {
    const response = await call(ALICE, "POST", undefined, "{not json");
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(db.rows).toHaveLength(0);
  });
});

describe("GET /api/games", () => {
  it("lists the user's games, newest first", async () => {
    await save(ALICE, { moves: X_WINS });
    await save(ALICE, { moves: O_WINS });
    await save(ALICE, { moves: DRAW });

    const { status, body } = await list(ALICE);
    expect(status).toBe(200);
    expect(body.map((game: Row) => game.result)).toEqual([
      "draw",
      "o_wins",
      "x_wins",
    ]);
  });

  it("answers an empty list for a user with no games", async () => {
    const { status, body } = await list(ALICE);
    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  it("has no limit on how many games it returns", async () => {
    for (let i = 0; i < 120; i++) await save(ALICE, { moves: X_WINS });
    const { body } = await list(ALICE);
    expect(body).toHaveLength(120);
  });
});

describe("user isolation", () => {
  it("never shows one user's games to another", async () => {
    await save(ALICE, { moves: X_WINS });
    await save(ALICE, { moves: DRAW });

    const bob = await list(BOB);
    expect(bob.status).toBe(200);
    expect(bob.body).toEqual([]);

    const alice = await list(ALICE);
    expect(alice.body).toHaveLength(2);
  });

  it("keeps two users' lists apart when both have games", async () => {
    await save(ALICE, { moves: X_WINS });
    await save(BOB, { moves: O_WINS });
    await save(BOB, { moves: DRAW });

    const alice = await list(ALICE);
    const bob = await list(BOB);
    expect(alice.body.map((game: Row) => game.result)).toEqual(["x_wins"]);
    expect(bob.body.map((game: Row) => game.result)).toEqual([
      "draw",
      "o_wins",
    ]);
    expect(alice.body.every((game: Row) => game.owner_id === ALICE)).toBe(true);
    expect(bob.body.every((game: Row) => game.owner_id === BOB)).toBe(true);
  });
});

describe("login and failures", () => {
  it("answers 401 to both routes without a login", async () => {
    expect((await list(undefined)).status).toBe(401);
    expect((await save(undefined, { moves: X_WINS })).status).toBe(401);
    expect(db.rows).toHaveLength(0);
  });

  it("answers 500 database_error when saving fails", async () => {
    db.failNext = true;
    const { status, body } = await save(ALICE, { moves: X_WINS });
    expect(status).toBe(500);
    expect(body.error.code).toBe("database_error");
  });

  it("answers 500 database_error when listing fails", async () => {
    db.failNext = true;
    const { status, body } = await list(ALICE);
    expect(status).toBe(500);
    expect(body.error.code).toBe("database_error");
  });
});
