// POST   /functions/v1/profile        create
// GET    /functions/v1/profile/:id     read
// PATCH  /functions/v1/profile/:id     update
//
// Port of backend/src/routes/profile.ts.

import { handler, HttpError, json } from "../_shared/cors.ts";
import { db, getProfileOr404 } from "../_shared/db.ts";

const PATCHABLE = [
  "domain",
  "idea_text",
  "stage",
  "target_market",
  "founder_skills",
  "time_commitment",
  "budget",
] as const;

/** Everything after /functions/v1/profile, e.g. "<uuid>" or "". */
function idFromPath(req: Request): string {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const i = parts.indexOf("profile");
  return i >= 0 ? (parts[i + 1] ?? "") : "";
}

Deno.serve(
  handler(async (req) => {
    const id = idFromPath(req);

    if (req.method === "POST") {
      const body = await req.json();
      if (!body?.owner_id) throw new HttpError(422, "owner_id is required");

      const { data, error } = await db
        .from("startup_profiles")
        .insert({
          owner_id: body.owner_id,
          domain: body.domain ?? null,
          idea_text: body.idea_text ?? null,
          stage: body.stage ?? null,
          target_market: body.target_market ?? null,
          founder_skills: body.founder_skills ?? {},
          time_commitment: body.time_commitment ?? null,
          budget: body.budget ?? null,
        })
        .select()
        .single();

      if (error) throw new HttpError(500, error.message);
      return json(data);
    }

    if (req.method === "GET") {
      return json(await getProfileOr404(id));
    }

    if (req.method === "PATCH") {
      const profile = await getProfileOr404(id);
      const body = await req.json();

      // Only keys the client actually sent are applied.
      const patch: Record<string, unknown> = {};
      for (const key of PATCHABLE) {
        if (key in body) patch[key] = body[key];
      }
      if (Object.keys(patch).length === 0) return json(profile);

      const { data, error } = await db
        .from("startup_profiles")
        .update(patch)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw new HttpError(500, error.message);
      return json(data);
    }

    throw new HttpError(405, `method ${req.method} not allowed`);
  }),
);
