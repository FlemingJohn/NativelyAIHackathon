import { Router } from "express";

import { db } from "../db/index.js";
import { cofounderMatches } from "../db/schema.js";
import { cofounderSearchRequest } from "../schemas.js";
import { cofounderMatchOut } from "../serialize.js";
import * as pipeline from "../services/pipeline.js";
import { getProfileOr404, touchProfile } from "../services/profiles.js";
import * as webClient from "../services/webClient.js";

const SYNTHESIS_SYSTEM_PROMPT = `You are a cofounder-matching assistant. Given a \
founder's own profile, the complementary profile they're looking for, and raw \
candidate signal from the web, produce a JSON array of up to 5 candidates: \
{name, headline, profile_url, match_rationale, skill_tags: []}. \
match_rationale must explain the *complementary* fit (why this candidate \
covers what the founder is missing), not just similarity. Respond with a \
JSON array only, no markdown fences.`;

type RawCofounderMatch = {
  name?: string;
  headline?: string | null;
  profile_url?: string | null;
  match_rationale?: string;
  skill_tags?: string[];
};

/** Plain web search for now -- the richer LinkedIn people-search dataset
 * tool (brightdataClient.runDatasetTool) is on hold until Bright Data
 * access is unblocked, see bright-data.md. */
function gatherCandidates(domain: string, desiredComplement: string): Promise<unknown> {
  const query = `${desiredComplement} cofounder ${domain}`;
  return pipeline.cachedFetch({
    toolName: "search_engine",
    query,
    fetchFn: () => webClient.searchEngine(query),
  });
}

export const cofounderRouter = Router();

cofounderRouter.post("/search", async (req, res) => {
  const payload = cofounderSearchRequest.parse(req.body);
  const profile = await getProfileOr404(payload.profile_id);

  // 1. gather
  const raw = await gatherCandidates(profile.domain || "startup", payload.desired_complement);

  // 2. extract
  const facts = await pipeline.extractFacts(
    JSON.stringify(raw).slice(0, 8000),
    `Extract candidate people (name, headline, profile url) matching: ${payload.desired_complement}`,
  );

  // 3. synthesize
  const synthesis = await pipeline.synthesize(
    SYNTHESIS_SYSTEM_PROMPT,
    `Founder profile: ${JSON.stringify(payload.founder_profile)}\n` +
      `Looking for: ${payload.desired_complement}\n\n` +
      `Candidate signal:\n${JSON.stringify(facts)}`,
  );
  const matchesData = pipeline.parseJson<RawCofounderMatch[]>(synthesis, []);

  await touchProfile(profile.id, { founderSkills: payload.founder_profile });

  const rows = matchesData.map((match) => ({
    profileId: profile.id,
    name: match.name ?? "",
    headline: match.headline ?? null,
    profileUrl: match.profile_url ?? null,
    matchRationale: match.match_rationale ?? "",
    skillTags: match.skill_tags ?? [],
  }));
  const inserted = rows.length ? await db.insert(cofounderMatches).values(rows).returning() : [];

  res.json({ matches: inserted.map(cofounderMatchOut) });
});
