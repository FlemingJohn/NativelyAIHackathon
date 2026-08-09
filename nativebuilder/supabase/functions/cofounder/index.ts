// POST /functions/v1/cofounder
//   in:  { profile_id, founder_profile, desired_complement }
//   out: { matches: [] }
//
// Port of backend/src/routes/cofounder.ts.

import { handler, json } from "../_shared/cors.ts";
import { getProfileOr404, insertRows, touchProfile } from "../_shared/db.ts";
import { cachedSearch, extractFacts, parseJson, signal, synthesize } from "../_shared/pipeline.ts";

const SYSTEM_PROMPT = `You are a cofounder-matching assistant. Given a founder's \
own profile, the complementary profile they're looking for, and raw candidate \
signal from the web, produce a JSON array of up to 5 candidates: {name, \
headline, profile_url, match_rationale, skill_tags: []}. match_rationale must \
explain the *complementary* fit (why this candidate covers what the founder is \
missing), not just similarity. If the signal contains no actual people, return \
an empty array rather than inventing names. Respond with a JSON array only, no \
markdown fences.`;

type RawMatch = {
  name?: string;
  headline?: string | null;
  profile_url?: string | null;
  match_rationale?: string;
  skill_tags?: string[];
};

Deno.serve(
  handler(async (req) => {
    const payload = await req.json();
    const profile = await getProfileOr404(payload.profile_id);
    const desired: string = payload.desired_complement ?? "";
    const domain = profile.domain || "startup";

    // 1. gather -- aimed at directories that list people. A plain search here
    // returns articles *about* cofounder matching, which is why it came back
    // empty; the real fix is the LinkedIn dataset (see bright-data.md).
    const query =
      `"${desired}" ${domain} cofounder profile ` +
      `site:linkedin.com/in OR site:wellfound.com OR site:ycombinator.com/cofounder-matching`;
    const results = await cachedSearch("search_engine", query);

    // 2. extract
    const facts = await extractFacts(
      signal(results),
      `Extract candidate people (name, headline, profile url) matching: ${desired}. ` +
        `Only include entries that name an actual person.`,
    );

    // 3. synthesize
    const output = await synthesize(
      SYSTEM_PROMPT,
      `Founder profile: ${JSON.stringify(payload.founder_profile ?? {})}\n` +
        `Looking for: ${desired}\n\n` +
        `Candidate signal:\n${JSON.stringify(facts)}`,
    );
    const matches = parseJson<RawMatch[]>(output, []);

    await touchProfile(profile.id, { founder_skills: payload.founder_profile ?? {} });

    const saved = await insertRows(
      "cofounder_matches",
      matches.map((m) => ({
        profile_id: profile.id,
        name: m.name ?? "",
        headline: m.headline ?? null,
        profile_url: m.profile_url ?? null,
        match_rationale: m.match_rationale ?? "",
        skill_tags: m.skill_tags ?? [],
      })),
    );

    return json({ matches: saved });
  }),
);
