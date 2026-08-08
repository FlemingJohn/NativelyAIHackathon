import { desc, eq } from "drizzle-orm";
import { Router } from "express";

import { db } from "../db/index.js";
import { investorLeads, marketReports } from "../db/schema.js";
import { HttpError } from "../http/errors.js";
import { investorSearchRequest } from "../schemas.js";
import { investorLeadOut } from "../serialize.js";
import * as pipeline from "../services/pipeline.js";
import { getProfileOr404 } from "../services/profiles.js";
import * as webClient from "../services/webClient.js";

const SYNTHESIS_SYSTEM_PROMPT = `You are an investor-matching assistant. Given a \
startup's domain, stage, and market size, plus raw web signal about VC firms \
and their theses/portfolios, produce a JSON array of up to 5 investor leads: \
{firm, person, thesis_summary, portfolio_highlights: [], outreach_angle, \
source_url}. outreach_angle must reference something real from the signal \
(a portfolio company, a stated thesis line), not a generic pitch. Respond \
with a JSON array only, no markdown fences.`;

type RawInvestorLead = {
  firm?: string;
  person?: string | null;
  thesis_summary?: string | null;
  portfolio_highlights?: string[];
  outreach_angle?: string | null;
  source_url?: string | null;
};

export const investorRouter = Router();

investorRouter.post("/search", async (req, res) => {
  const payload = investorSearchRequest.parse(req.body);
  const profile = await getProfileOr404(payload.profile_id);
  if (!profile.domain) {
    throw new HttpError(400, "profile has no domain yet -- run idea/market research first");
  }

  const [latestReport] = await db
    .select()
    .from(marketReports)
    .where(eq(marketReports.profileId, profile.id))
    .orderBy(desc(marketReports.createdAt))
    .limit(1);

  const stage = profile.stage || "early stage";
  const query = `VC investors funding ${profile.domain} startups ${stage}`;

  // 1. gather
  const serpRaw = await pipeline.cachedFetch({
    toolName: "search_engine",
    query,
    fetchFn: () => webClient.searchEngine(query),
  });

  // 2. extract
  const facts = await pipeline.extractFacts(
    JSON.stringify(serpRaw).slice(0, 8000),
    `Extract VC firm names, partners, and stated investment thesis for: ${profile.domain}`,
  );

  // 3. synthesize
  const synthesis = await pipeline.synthesize(
    SYNTHESIS_SYSTEM_PROMPT,
    `Domain: ${profile.domain}\nStage: ${stage}\n` +
      `TAM (if known): ${latestReport?.tam ?? "unknown"}\n\n` +
      `Investor signal:\n${JSON.stringify(facts)}`,
  );
  const leadsData = pipeline.parseJson<RawInvestorLead[]>(synthesis, []);

  const rows = leadsData.map((lead) => ({
    profileId: profile.id,
    firm: lead.firm ?? "",
    person: lead.person ?? null,
    thesisSummary: lead.thesis_summary ?? null,
    portfolioHighlights: lead.portfolio_highlights ?? [],
    outreachAngle: lead.outreach_angle ?? null,
    sourceUrl: lead.source_url ?? null,
  }));
  const inserted = rows.length ? await db.insert(investorLeads).values(rows).returning() : [];

  res.json({ leads: inserted.map(investorLeadOut) });
});
