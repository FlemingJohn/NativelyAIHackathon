import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

/** Mirrors FastAPI's HTTPException: status + a `detail` string the frontend
 * surfaces verbatim in its error toasts. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(detail);
    this.name = "HttpError";
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ detail: "Not Found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ detail: err.detail });
    return;
  }
  if (err instanceof ZodError) {
    res.status(422).json({ detail: err.issues });
    return;
  }
  console.error(err);
  const detail = err instanceof Error ? err.message : "internal server error";
  res.status(500).json({ detail });
};
