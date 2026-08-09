// POST /functions/v1/idea
//   in:  { profile_id, domain?, interests? }
//   out: { idea_cards: [] }
//
// Port of backend/src/routes/idea.ts.

import { handler, HttpError, json } from "../_shared/cors.ts";
import { getProfileOr404, insertRows, touchProfile } from "../_shared/db.ts";
import { cachedSearch, extractFacts, parseJson, signal, synthesize } from "../_shared/pipeline.ts";

const SYSTEM_PROMPT = `You are a startup ideation assistant. Given a founder's \
domain/interests and raw web signal (trending discussions, recent news), \
produce 3-5 idea cards as a JSON array, sorted strongest first. Each item:
{problem, solution, why_now, business_model, fit_score, source_citations: [urls actually used]}

  fit_score  0-100. How strongly the provided signal supports this being a real,
             urgent problem — evidence, not your enthusiasm. An idea the signal
             barely mentions scores low even if it sounds good.

Ground each "why_now" in something from the provided signal; don't invent \
trends. Respond with a JSON array only, no markdown fences.`;

type RawCard = {
  problem?: string;
  solution?: string;
  why_now?: string;
  business_model?: string;
  fit_score?: number;
  source_citations?: string[];
};

Deno.serve(
  handler(async (req) => {
    const payload = await req.json();
    const profile = await getProfileOr404(payload.profile_id);

    const domain = payload.domain || profile.domain;
    if (!domain) {
      throw new HttpError(400, "domain is required (either on the request or the profile)");
    }

    let query = `${domain} trends discussions problems 2026`;
    if (payload.interests) query += ` ${payload.interests}`;

    // 1. gather
    const { results, provider } = await cachedSearch("search_engine", query);

    // 2. extract
    const facts = await extractFacts(
      signal(results),
      `Extract recurring pain points, trends, and unmet needs in: ${domain}`,
    );

    // 3. synthesize
    const output = await synthesize(
      SYSTEM_PROMPT,
      `Domain: ${domain}\nInterests: ${payload.interests || "n/a"}\n` +
        `Clarifying answers: ${payload.answers_to_clarifying_questions || "n/a"}\n\n` +
        `Extracted signal:\n${JSON.stringify(facts)}`,
    );
    const cards = parseJson<RawCard[]>(output, []);

    await touchProfile(profile.id, { domain });

    const saved = await insertRows(
      "idea_cards",
      cards
        .map((c) => ({
          profile_id: profile.id,
          problem: c.problem ?? "",
          solution: c.solution ?? "",
          why_now: c.why_now ?? "",
          business_model: c.business_model ?? "",
          fit_score: Math.max(0, Math.min(100, Math.round(Number(c.fit_score) || 0))),
          source_citations: c.source_citations ?? [],
        }))
        .sort((a, b) => b.fit_score - a.fit_score),
    );

    return json({ idea_cards: saved, sourced_via: provider });
  }),
);
