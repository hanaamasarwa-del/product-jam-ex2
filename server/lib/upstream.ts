/*
 * Calling other servers (NASA, Gemini) safely.
 *
 * Another server can be slow, can be down, can reject our key, and can send us
 * something that is not what its docs promise. Our own users should never see
 * any of that raw: they get a clear answer from OUR server. So every failure
 * of an outside call is turned into an `UpstreamError`, and the route decides
 * which of our status codes it becomes.
 *
 * Careful: a NASA request has the API key in its URL. Never log a URL or an
 * outside server's whole answer; log only the service and what kind of
 * failure it was.
 */

export type UpstreamService = "nasa" | "gemini";

export type UpstreamKind =
  /** It did not answer in time. */
  | "timeout"
  /** It answered with an error, or we could not reach it at all. */
  | "unavailable"
  /** It answered, but not with what we can use. */
  | "invalid_response"
  /** It says what we asked for does not exist. */
  | "not_found";

export class UpstreamError extends Error {
  readonly service: UpstreamService;
  readonly kind: UpstreamKind;

  constructor(service: UpstreamService, kind: UpstreamKind, detail?: string) {
    super(`${service} ${kind}${detail ? `: ${detail}` : ""}`);
    this.name = "UpstreamError";
    this.service = service;
    this.kind = kind;
  }
}

function isTimeout(error: unknown): boolean {
  const name = (error as { name?: unknown } | null)?.name;
  return name === "TimeoutError" || name === "AbortError";
}

/**
 * `fetch`, but it gives up after `timeoutMs`, and any failure comes out as an
 * `UpstreamError`.
 */
export async function callUpstream(
  service: UpstreamService,
  url: URL | string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new UpstreamError(
      service,
      isTimeout(error) ? "timeout" : "unavailable",
    );
  }
}

/** Reads a JSON body. A body that is not JSON is an invalid response. */
export async function readJson(
  service: UpstreamService,
  response: Response,
): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    // Reading the body can also run out of time.
    throw new UpstreamError(
      service,
      isTimeout(error) ? "timeout" : "invalid_response",
      "body is not JSON",
    );
  }
}
