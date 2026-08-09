export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
};

export function preflight(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: CORS_HEADERS }) : null;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** Mirrors the Express HttpError -> `{detail}` body the frontend already parses. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(detail);
  }
}

/** Wraps a handler so thrown HttpErrors become responses instead of 500s. */
export function handler(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const pre = preflight(req);
    if (pre) return pre;
    try {
      return await fn(req);
    } catch (err) {
      if (err instanceof HttpError) return json({ detail: err.detail }, err.status);
      console.error(err);
      return json({ detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  };
}
