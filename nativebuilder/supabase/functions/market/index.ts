// POST /functions/v1/market
//   in:  { profile_id, idea_text }
//   out: { market_report: {} }
//
// Port of backend/src/routes/market.ts.

import { handler, json } from "../_shared/cors.ts";
import { getProfileOr404, insertRows, touchProfile } from "../_shared/db.ts";
import { cachedSearch, extractFacts, parseJson, signal, synthesize } from "../_shared/pipeline.ts";

const SYSTEM_PROMPT = `You are a startup market analyst. Given raw web research \
(search snippets and competitor page excerpts) about a startup idea, produce a \
market report as JSON with exactly these keys:
tam, sam, som (each a string estimate + one-line method note),
competitors (array of {name, summary, url}),
kpis (array of {name, why_it_matters}, chosen for this specific business model),
methodology_notes (string),
source_citations (array of urls actually used).
Respond with JSON only, no markdown fences.`;

type RawReport = {
  tam?: string | null;
  sam?: string | null;
  som?: string | null;
  methodology_notes?: string | null;
  competitors?: unknown[];
  kpis?: unknown[];
  source_citations?: string[];
};

Deno.serve(
  handler(async (req) => {
    const payload = await req.json();
    const profile = await getProfileOr404(payload.profile_id);
    const ideaText: string = payload.idea_text ?? "";

    // 1. gather
    const { results, provider } = await cachedSearch(
      "search_engine",
      `competitors AND market size: ${ideaText}`,
    );

    // 2. extract
    const facts = await extractFacts(
      signal(results),
      `Extract competitor names, pricing signals, and market-size mentions relevant to: ${ideaText}`,
    );

    // 3. synthesize
    const output = await synthesize(
      SYSTEM_PROMPT,
      `Startup idea: ${ideaText}\n\nExtracted facts:\n${JSON.stringify(facts)}`,
    );

    // On unparseable output keep the raw text rather than dropping the answer.
    const report = parseJson<RawReport | null>(output, null) ?? { methodology_notes: output };

    await touchProfile(profile.id, { idea_text: ideaText });

    const [saved] = await insertRows("market_reports", [
      {
        profile_id: profile.id,
        tam: report.tam ?? null,
        sam: report.sam ?? null,
        som: report.som ?? null,
        methodology_notes: report.methodology_notes ?? null,
        competitors: report.competitors ?? [],
        kpis: report.kpis ?? [],
        source_citations: report.source_citations ?? [],
      },
    ]);

    return json({ market_report: saved, sourced_via: provider });
  }),
);
