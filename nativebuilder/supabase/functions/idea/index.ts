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
{problem, solution, why_now, business_model, fit_score, score_breakdown: [],
 source_citations: [urls actually used]}

  fit_score       0-100, and it MUST equal the sum of the points below. This
                  measures how strongly the provided signal supports the problem
                  being real — evidence, not your enthusiasm. An idea the signal
                  barely mentions scores low even if it sounds good.
  score_breakdown Exactly these five criteria, in order, as {label, points, max}:
                    "Sources describing this problem"    max 30
                    "Repeated across different sources"  max 25
                    "Recent — last 12 months"            max 20
                    "Someone states they'd pay"          max 15
                    "No incumbent already solving it"    max 10
                  Award from the signal only. A criterion the signal says
                  nothing about scores 0.

Ground each "why_now" in something from the provided signal; don't invent \
trends. Respond with a JSON array only, no markdown fences.`;

type RawCard = {
  problem?: string;
  solution?: string;
  why_now?: string;
  business_model?: string;
  fit_score?: number;
  score_breakdown?: { label?: string; points?: number; max?: number }[];
  source_citations?: string[];
};

/** Same reasoning as the cofounder module: recompute the total from the parts,
 * so a card never shows a headline number its own breakdown contradicts. */
function scoreOf(c: RawCard) {
  const breakdown = (Array.isArray(c.score_breakdown) ? c.score_breakdown : [])
    .filter((x) => x && typeof x.label === "string")
    .map((x) => {
      const max = Math.max(0, Math.round(Number(x.max) || 0));
      return {
        label: String(x.label),
        points: Math.max(0, Math.min(max, Math.round(Number(x.points) || 0))),
        max,
      };
    });

  const summed = breakdown.reduce((t, x) => t + x.points, 0);
  const stated = Math.max(0, Math.min(100, Math.round(Number(c.fit_score) || 0)));

  return {
    fit_score: breakdown.length > 0 ? Math.min(100, summed) : stated,
    score_breakdown: breakdown,
  };
}

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
          ...scoreOf(c),
          source_citations: c.source_citations ?? [],
        }))
        .sort((a, b) => b.fit_score - a.fit_score),
    );

    return json({ idea_cards: saved, sourced_via: provider });
  }),
);
