// POST /functions/v1/investor
//   in:  { profile_id }            reads domain/stage/tam off the profile
//   out: { leads: [] }
//
// Port of backend/src/routes/investor.ts.

import { handler, HttpError, json } from "../_shared/cors.ts";
import { db, getProfileOr404, insertRows } from "../_shared/db.ts";
import { cachedSearch, extractFacts, parseJson, signal, synthesize } from "../_shared/pipeline.ts";

const SYSTEM_PROMPT = `You are an investor-matching assistant. Given a startup's \
domain, stage, and market size, plus raw web signal about VC firms and their \
theses/portfolios, produce a JSON array of up to 5 investor leads: {firm, \
person, thesis_summary, portfolio_highlights: [], outreach_angle, source_url}. \
Only include entries that are actual investors or funds -- skip blogs, news \
sites and tool directories. outreach_angle must reference something real from \
the signal (a portfolio company, a stated thesis line), not a generic pitch. \
Respond with a JSON array only, no markdown fences.`;

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
      `Extract VC firm names, partners, and stated investment thesis for: ${profile.domain}`,
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
