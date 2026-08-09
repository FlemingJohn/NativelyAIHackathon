import { createClient } from "@supabase/supabase-js";

import { HttpError } from "./cors.ts";

/** Service-role client: these functions are the only thing touching the tables,
 * so RLS never has to be permissive for the browser. Both variables are
 * injected into every Edge Function by Supabase -- you don't set them. */
export const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StartupProfileRow = {
  id: string;
  owner_id: string;
  domain: string | null;
  idea_text: string | null;
  stage: string | null;
  target_market: string | null;
  founder_skills: Record<string, unknown>;
  time_commitment: string | null;
  budget: string | null;
  created_at: string;
  updated_at: string;
};

/** Postgres errors on a malformed uuid, so screen the id first and return the
 * same 404 a well-formed unknown id gets. */
export async function getProfileOr404(profileId: string): Promise<StartupProfileRow> {
  if (!UUID_RE.test(profileId ?? "")) throw new HttpError(404, "profile not found");

  const { data, error } = await db
    .from("startup_profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message);
  if (!data) throw new HttpError(404, "profile not found");
  return data as StartupProfileRow;
}

export async function touchProfile(
  profileId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  // updated_at is maintained by a trigger, so it can't drift from created_at.
  const { error } = await db.from("startup_profiles").update(patch).eq("id", profileId);
  if (error) throw new HttpError(500, error.message);
}

export async function insertRows<T>(table: string, rows: object[]): Promise<T[]> {
  if (rows.length === 0) return [];
  const { data, error } = await db.from(table).insert(rows).select();
  if (error) throw new HttpError(500, `could not save ${table}: ${error.message}`);
  return (data ?? []) as T[];
}
