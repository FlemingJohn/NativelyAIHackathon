// POST /functions/v1/investor
//   in:  { profile_id }            reads domain/stage/tam off the profile
//   out: { leads: [] }
//
// Port of backend/src/routes/investor.ts.

import { handler, HttpError, json } from "../_shared/cors.ts";
import { db, getProfileOr404, insertRows } from "../_shared/db.ts";
import { cachedSearch, extractFacts, parseJson, signal, synthesize } from "../_shared/pipeline.ts";

const SYSTEM_PROMPT = `You are an investor-matching assistant. Given a startup's \
domain, stage, and market size, plus web research about the funding landscape, \
produce a JSON array of up to 5 investor leads: {firm, person, thesis_summary, \
portfolio_highlights: [], outreach_angle, source_url}.

The research will often be articles and roundups *listing* investors rather \
than the investors' own sites. That is fine and expected: name the funds \
mentioned inside those articles, and use the article as the source_url. What \
you must not do is treat the publication itself as the investor -- a blog, a \
news outlet or a tool directory is never a "firm".

Each firm must be a real investment fund or VC. outreach_angle should reference \
something concrete about that firm (a portfolio company, a stated focus). If \
the research names no actual funds, return an empty array. Respond with a JSON \
array only, no markdown fences.`;

type RawLead = {
  firm?: string;
  person?: string | null;
  thesis_summary?: string | null;
  portfolio_highlights?: string[];
  outreach_angle?: string | null;
  source_url?: string | null;
};

Deno.serve(
  handler(async (req) => {
    const payload = await req.json();
    const profile = await getProfileOr404(payload.profile_id);

    if (!profile.domain) {
      throw new HttpError(400, "profile has no domain yet -- run idea/market research first");
    }

    const stage = profile.stage || "early stage";
    const query = `VC firms investing in ${profile.domain} startups ${stage} portfolio thesis`;

    const { data: latest } = await db
      .from("market_reports")
      .select("tam")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 1. gather
    const { results, provider } = await cachedSearch("search_engine", query);

    // 2. extract
    const facts = await extractFacts(
      signal(results),
      `List every investment fund, VC firm or angel investor named anywhere in ` +
        `this material relating to ${profile.domain}. Include funds mentioned ` +
        `inside articles and roundups, not just ones with their own page here. ` +
        `For each, capture: firm name, any partner named, stated focus or thesis, ` +
        `portfolio companies mentioned, and the url it was found on.`,
    );

    // 3. synthesize
    const output = await synthesize(
      SYSTEM_PROMPT,
      `Domain: ${profile.domain}\nStage: ${stage}\n` +
        `TAM (if known): ${latest?.tam ?? "unknown"}\n\n` +
        `Investor signal:\n${JSON.stringify(facts)}`,
    );
    const leads = parseJson<RawLead[]>(output, []);

    const saved = await insertRows(
      "investor_leads",
      leads.map((l) => ({
        profile_id: profile.id,
        firm: l.firm ?? "",
        person: l.person ?? null,
        thesis_summary: l.thesis_summary ?? null,
        portfolio_highlights: l.portfolio_highlights ?? [],
        outreach_angle: l.outreach_angle ?? null,
        source_url: l.source_url ?? null,
      })),
    );

    return json({ leads: saved, sourced_via: provider });
  }),
);
