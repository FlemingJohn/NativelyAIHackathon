// POST /functions/v1/cofounder
//   in:  { profile_id, founder_profile, desired_complement }
//   out: { matches: [], sourced_via: "brightdata" | "duckduckgo" | "cache" }
//
// The one module where the data source decides whether the feature works at
// all. A plain web search returns articles *about* cofounder matching; it
// cannot return people. So when Bright Data is available this runs two stages:
//
//   1. SERP API with a site:linkedin.com/in filter -> real profile URLs.
//      (Google blocks the free fallback outright, which is why `site:` queries
//      were useless before.)
//   2. LinkedIn Profiles dataset on those URLs -> structured person records:
//      name, headline, current role, experience.
//
// Without a token it degrades to the old single-stage search, which usually
// returns nothing — and says so rather than inventing names.

import { handler, json } from "../_shared/cors.ts";
import * as brightdata from "../_shared/brightdata.ts";
import { getProfileOr404, insertRows, touchProfile } from "../_shared/db.ts";
import { cachedSearch, extractFacts, parseJson, signal, synthesize } from "../_shared/pipeline.ts";

const SYSTEM_PROMPT = `You are a cofounder-matching assistant. Given a founder's \
own profile, the complementary profile they're looking for, and candidate \
records scraped from LinkedIn, produce a JSON array of up to 5 candidates: \
{name, headline, profile_url, match_rationale, skill_tags: []}. \
match_rationale must explain the *complementary* fit — name the specific gap \
this person closes, citing something from their actual record. If the input \
contains no real people, return an empty array rather than inventing names. \
Respond with a JSON array only, no markdown fences.`;

type RawMatch = {
  name?: string;
  headline?: string | null;
  profile_url?: string | null;
  match_rationale?: string;
  skill_tags?: string[];
};

/** Profile URLs out of SERP results, deduped and capped — each one costs a
 * dataset record, so this is the spend control. */
function linkedinProfileUrls(
  results: { url: string }[],
  limit = 8,
): { url: string }[] {
  const seen = new Set<string>();
  const urls: { url: string }[] = [];

  for (const r of results) {
    const match = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^/?#]+/i.exec(r.url ?? "");
    if (!match) continue;
    const clean = match[0].replace(/\/$/, "");
    if (seen.has(clean)) continue;
    seen.add(clean);
    urls.push({ url: clean });
    if (urls.length >= limit) break;
  }
  return urls;
}

Deno.serve(
  handler(async (req) => {
    const payload = await req.json();
    const profile = await getProfileOr404(payload.profile_id);
    const desired: string = payload.desired_complement ?? "";
    const domain = profile.domain || "startup";

    // --- 1. gather: find candidate profile URLs --------------------------
    // `site:` is the whole trick here, and it only works through the SERP API.
    const query = `site:linkedin.com/in ${desired} ${domain}`;
    const { results, provider } = await cachedSearch("cofounder_search", query);

    // --- 2. enrich: turn URLs into real profile records ------------------
    const urls = linkedinProfileUrls(results);
    const candidateRecords =
      urls.length > 0
        ? await brightdata.runDataset(
            brightdata.DATASETS.linkedin_person_profile,
            urls,
            { timeoutMs: 90_000 },
          )
        : [];
    const enrichedCount = candidateRecords.length;

    // If enrichment produced nothing (dataset slow or refused), reason over the
    // search results themselves rather than returning nothing at all.
    const evidence = candidateRecords.length > 0 ? candidateRecords : results;

    // --- 3. extract ------------------------------------------------------
    const facts = await extractFacts(
      signal(evidence),
      `Extract candidate people matching: ${desired}. For each, capture name, ` +
        `headline/current role, profile url, and the skills or experience that ` +
        `evidence them. Only include entries naming an actual person.`,
    );

    // --- 4. synthesize ---------------------------------------------------
    const output = await synthesize(
      SYSTEM_PROMPT,
      `Founder profile: ${JSON.stringify(payload.founder_profile ?? {})}\n` +
        `Looking for: ${desired}\n` +
        `Domain: ${domain}\n\n` +
        `Candidate records (${enrichedCount > 0 ? "LinkedIn profiles" : "search snippets"}):\n` +
        JSON.stringify(facts),
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

    return json({
      matches: saved,
      sourced_via: provider,
      profiles_enriched: enrichedCount,
    });
  }),
);
