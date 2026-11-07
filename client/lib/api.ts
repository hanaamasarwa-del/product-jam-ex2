import { isApiError } from "@shared/index";
import { supabase } from "./supabase";

/**
 * Something went wrong talking to the server.
 *
 * `code` is a short machine-readable string like "unauthorized" or
 * "not_found". `message` is safe to show to the user.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  /** On a 400, which field was wrong and why - keyed by field name. */
  readonly fields?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/**
 * Calls our server.
 *
 *     const me = await api<{ id: string; email: string }>("/api/me");
 *     await api("/api/events", { method: "POST", body: { title: "Hi" } });
 *
 * It attaches the logged-in user's token automatically, sends and receives
 * JSON, and throws an ApiRequestError if the server says no.
 *
 * Use this for every request to /api/*. Do not call `fetch` directly - you
 * would have to remember the token every time.
 */
export async function api<T = unknown>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    /** A plain object - it gets turned into JSON for you. */
    body?: unknown;
    /** Use this instead of `body` when sending a file. */
    formData?: FormData;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { method = "GET", body, formData, signal } = options;

  // Ask Supabase for the current login token. It refreshes it if it expired.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  // When sending a file, let the browser set Content-Type itself - it has to
  // add a "boundary" value that we cannot know here.
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(path, {
    method,
    headers,
    body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
    signal,
  });

  // 204 means "done, nothing to send back" - for example after a DELETE.
  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiError(payload)) {
      throw new ApiRequestError(
        response.status,
        payload.error.code,
        payload.error.message,
        payload.error.fields,
      );
    }
    throw new ApiRequestError(
      response.status,
      "unexpected_error",
      `The server returned ${response.status}.`,
    );
  }

  return payload as T;
}
