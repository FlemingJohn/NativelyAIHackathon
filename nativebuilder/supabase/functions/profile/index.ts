// POST   /functions/v1/profile           create
// GET    /functions/v1/profile/:id        read
// GET    /functions/v1/profile/:id/full   read + everything the modules saved
// PATCH  /functions/v1/profile/:id        update

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

/** ["<uuid>", "full"] from /functions/v1/profile/<uuid>/full */
function pathParts(req: Request): { id: string; sub: string } {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const i = parts.indexOf("profile");
  return { id: i >= 0 ? (parts[i + 1] ?? "") : "", sub: i >= 0 ? (parts[i + 2] ?? "") : "" };
}

/**
 * Everything saved against a profile, newest first.
 *
 * Without this the app is write-only: each module saved its results and then
 * had no way to read them back, so a refresh looked like the work had been
 * lost. The limits keep a re-run from returning every historical row — the UI
 * shows the latest run, not an archive.
 */
async function fullProfile(profileId: string) {
  const profile = await getProfileOr404(profileId);

  const [ideas, reports, matches, leads] = await Promise.all([
    db.from("idea_cards").select("*").eq("profile_id", profileId)
      .order("created_at", { ascending: false }).limit(5),
    db.from("market_reports").select("*").eq("profile_id", profileId)
      .order("created_at", { ascending: false }).limit(1),
    db.from("cofounder_matches").select("*").eq("profile_id", profileId)
      .order("created_at", { ascending: false }).limit(5),
    db.from("investor_leads").select("*").eq("profile_id", profileId)
      .order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    profile,
    idea_cards: ideas.data ?? [],
    market_report: reports.data?.[0] ?? null,
    matches: matches.data ?? [],
    leads: leads.data ?? [],
  };
}

Deno.serve(
  handler(async (req) => {
    const { id, sub } = pathParts(req);

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
      return json(sub === "full" ? await fullProfile(id) : await getProfileOr404(id));
    }

    if (req.method === "PATCH") {
      const profile = await getProfileOr404(id);
      const body = await req.json();

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
