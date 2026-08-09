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
own profile, the gap they need filled, and candidate records scraped from \
LinkedIn, score and rank EVERY candidate you were given. Do not filter — a \
poor match is useful information, and the founder wants to see who was \
considered.

Return a JSON array, one item per candidate, sorted by fit_score descending:
{name, headline, profile_url, fit_score, fit_level, match_rationale, skill_tags: []}

  fit_score       0-100. How completely this person closes the stated gap.
  fit_level       "strong" (70+), "partial" (40-69), or "none" (under 40).
  match_rationale One or two sentences. For a strong or partial fit, name the
                  specific gap they close and cite something from their record.
                  For "none", say plainly what is missing — "technical like the
                  founder, duplicates existing strengths" is more useful than
                  silence.

Only include people who actually appear in the input. If it contains no real \
people, return an empty array rather than inventing names. Respond with a JSON \
array only, no markdown fences.`;

type RawMatch = {
  name?: string;
  headline?: string | null;
  profile_url?: string | null;
  fit_score?: number;
  fit_level?: string;
  match_rationale?: string;
  skill_tags?: string[];
};

const FIT_LEVELS = new Set(["strong", "partial", "none"]);

/** Trust the model's ordering only after re-deriving level from score — the two
 * disagree often enough that a "strong" badge on a score of 20 is a real risk. */
function normalize(m: RawMatch): Required<Pick<RawMatch, "fit_score">> & { fit_level: string } {
  const score = Math.max(0, Math.min(100, Math.round(Number(m.fit_score) || 0)));
  const stated = String(m.fit_level ?? "").toLowerCase();
  const derived = score >= 70 ? "strong" : score >= 40 ? "partial" : "none";
  return { fit_score: score, fit_level: FIT_LEVELS.has(stated) ? derived : derived };
}

/**
 * A Bright Data LinkedIn profile record is large — full experience and
 * education arrays, recommendations, activity. Eight of them run to tens of
 * thousands of characters, and `signal()` caps the extraction input at 8k, so
 * raw records arrive truncated mid-object and the extractor sees broken JSON.
 * That is why eight scraped profiles produced two candidates.
 *
 * Keep the fields that decide fit, drop the rest.
 */
function compactProfile(raw: unknown): Record<string, unknown> {
  const p = (raw ?? {}) as Record<string, any>;
  const experience = Array.isArray(p.experience) ? p.experience.slice(0, 4) : [];

  return {
    name: p.name ?? p.full_name ?? [p.first_name, p.last_name].filter(Boolean).join(" "),
    headline: p.position ?? p.headline ?? p.title ?? null,
    profile_url: p.url ?? p.input_url ?? p.linkedin_url ?? null,
    location: p.city ?? p.location ?? null,
    company: p.current_company?.name ?? p.current_company_name ?? null,
    about: typeof p.about === "string" ? p.about.slice(0, 400) : null,
    experience: experience.map((e: any) => ({
      title: e?.title ?? e?.position ?? null,
      company: e?.company ?? e?.subtitle ?? null,
      duration: e?.duration ?? null,
    })),
  };
}

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
    const evidence =
      candidateRecords.length > 0 ? candidateRecords.map(compactProfile) : results;

    // --- 3. extract ------------------------------------------------------
    // Extract EVERY person, not only the ones that look like a match. This pass
    // used to say "extract people matching <gap>", which meant the cheap model
    // silently filtered the list before synthesis could score it — eight
    // profiles scraped, two ever seen. Judging fit is the synthesis pass's job.
    const facts = await extractFacts(
      signal(evidence),
      `List every distinct person appearing in this data — all of them, whether ` +
        `or not they look relevant. For each: name, headline/current role, ` +
        `profile url, employer, and any skills or experience stated. Do not ` +
        `filter, rank or judge suitability. Only skip entries that name no ` +
        `actual person.`,
    );

    // --- 4. synthesize ---------------------------------------------------
    const output = await synthesize(
      SYSTEM_PROMPT,
      `Founder profile: ${JSON.stringify(payload.founder_profile ?? {})}\n` +
        `Gap to fill: ${desired}\n` +
        `Domain: ${domain}\n\n` +
        `Return one entry for EVERY person below — ${enrichedCount || "all"} were ` +
        `scraped and the founder expects to see all of them scored.\n\n` +
        `Candidate records (${enrichedCount > 0 ? "LinkedIn profiles" : "search snippets"}):\n` +
        JSON.stringify(facts),
    );
    const matches = parseJson<RawMatch[]>(output, []);

    await touchProfile(profile.id, { founder_skills: payload.founder_profile ?? {} });

    const rows = matches
      .map((m) => {
        const { fit_score, fit_level } = normalize(m);
        return {
          profile_id: profile.id,
          name: m.name ?? "",
          headline: m.headline ?? null,
          profile_url: m.profile_url ?? null,
          fit_score,
          fit_level,
          match_rationale: m.match_rationale ?? "",
          skill_tags: m.skill_tags ?? [],
        };
      })
      .sort((a, b) => b.fit_score - a.fit_score);

    const saved = await insertRows("cofounder_matches", rows);

    return json({
      matches: saved,
      sourced_via: provider,
      profiles_found: urls.length,
      profiles_enriched: enrichedCount,
    });
  }),
);
