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
source_citations (array of urls actually used),
positioning (object, described below).

POSITIONING — place the competitors and this idea on two axes.

Nothing in the research names the axes. Work out, from the competitor
descriptions themselves, the TWO questions that actually separate these
products. They differ completely by industry: carbon software splits on who
buys and how much is automated; developer tools split on whether you can sign
up alone and how much the tool covers; health software splits on who pays and
how close it gets to a medical decision. Never reuse an example — derive them.

Write every label in plain words a first-time founder reads without stopping.
Say "how you buy it", not "go-to-market". Say "medical decisions", not
"clinical decisioning".

positioning: {
  summary:  one sentence naming the two questions, plain language
  x_axis:   {name, low, high}   name is 2-4 words; low/high are the two extremes
  y_axis:   {name, low, high}
  you:      {x, y, why}         0-100 each. Score THIS idea on the same two
                                questions. why = one sentence quoting something
                                the idea actually says.
  competitors: [{name, x, y, why_x, why_y}]  one per competitor above, same names.
                                why_x and why_y are one short sentence each,
                                justified from that competitor's description.
}

Respond with JSON only, no markdown fences.`;

type Axis = { name?: string; low?: string; high?: string };
type Placed = { name?: string; x?: number; y?: number; why_x?: string; why_y?: string };

type RawReport = {
  tam?: string | null;
  sam?: string | null;
  som?: string | null;
  methodology_notes?: string | null;
  competitors?: unknown[];
  kpis?: unknown[];
  source_citations?: string[];
  positioning?: {
    summary?: string;
    x_axis?: Axis;
    y_axis?: Axis;
    you?: { x?: number; y?: number; why?: string };
    competitors?: Placed[];
  };
};

const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const axis = (a?: Axis) => ({
  name: String(a?.name ?? ""),
  low: String(a?.low ?? ""),
  high: String(a?.high ?? ""),
});

/**
 * Keep the positioning only when it's complete enough to draw honestly: both
 * axes named and at least two competitors placed. Half a chart invites the
 * reader to infer a shape from evidence that isn't there, so the UI would
 * rather show nothing.
 */
function normalizePositioning(p: RawReport["positioning"]) {
  if (!p) return null;

  const x = axis(p.x_axis);
  const y = axis(p.y_axis);
  const competitors = (Array.isArray(p.competitors) ? p.competitors : [])
    .filter((c) => c && typeof c.name === "string")
    .map((c) => ({
      name: String(c.name),
      x: clamp(c.x),
      y: clamp(c.y),
      why_x: String(c.why_x ?? ""),
      why_y: String(c.why_y ?? ""),
    }));

  if (!x.name || !y.name || competitors.length < 2) return null;

  return {
    summary: String(p.summary ?? ""),
    x_axis: x,
    y_axis: y,
    you: { x: clamp(p.you?.x), y: clamp(p.you?.y), why: String(p.you?.why ?? "") },
    competitors,
  };
}

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
        positioning: normalizePositioning(report.positioning) ?? {},
      },
    ]);

    return json({ market_report: saved, sourced_via: provider });
  }),
);
