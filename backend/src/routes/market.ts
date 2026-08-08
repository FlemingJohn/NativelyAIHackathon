import { Router } from "express";

import { db } from "../db/index.js";
import { marketReports } from "../db/schema.js";
import { marketResearchRequest } from "../schemas.js";
import { marketReportOut } from "../serialize.js";
import * as pipeline from "../services/pipeline.js";
import { getProfileOr404, touchProfile } from "../services/profiles.js";
import * as webClient from "../services/webClient.js";

const SYNTHESIS_SYSTEM_PROMPT = `You are a startup market analyst. Given raw web \
research (search snippets and competitor page excerpts) about a startup idea, \
produce a market report as JSON with exactly these keys:
tam, sam, som (each a string estimate + one-line method note),
competitors (array of {name, summary, url}),
kpis (array of {name, why_it_matters}, chosen for this specific business model),
methodology_notes (string),
source_citations (array of urls actually used).
Respond with JSON only, no markdown fences.`;

type RawMarketReport = {
  tam?: string | null;
  sam?: string | null;
  som?: string | null;
  methodology_notes?: string | null;
  competitors?: unknown[];
  kpis?: unknown[];
  source_citations?: string[];
};

export const marketRouter = Router();

marketRouter.post("/research", async (req, res) => {
  const payload = marketResearchRequest.parse(req.body);
  const profile = await getProfileOr404(payload.profile_id);

  // 1. gather (cached so repeat demo runs don't re-spend Bright Data credits)
  const serpRaw = await pipeline.cachedFetch({
    toolName: "search_engine",
    query: `competitors AND market size: ${payload.idea_text}`,
    fetchFn: () =>
      webClient.searchEngine(`competitors and market size for: ${payload.idea_text}`),
  });

  // 2. extract
  const facts = await pipeline.extractFacts(
    JSON.stringify(serpRaw).slice(0, 8000),
    `Extract competitor names, pricing signals, and market-size mentions relevant to: ${payload.idea_text}`,
  );

  // 3. synthesize
  const synthesis = await pipeline.synthesize(
    SYNTHESIS_SYSTEM_PROMPT,
    `Startup idea: ${payload.idea_text}\n\nExtracted facts:\n${JSON.stringify(facts)}`,
  );
  // On unparseable output, keep the raw text in methodology_notes rather than
  // dropping the model's answer entirely.
  const reportData = pipeline.parseJson<RawMarketReport | null>(synthesis, null) ?? {
    methodology_notes: synthesis,
  };

  await touchProfile(profile.id, { ideaText: payload.idea_text });

  const [report] = await db
    .insert(marketReports)
    .values({
      profileId: profile.id,
      tam: reportData.tam ?? null,
      sam: reportData.sam ?? null,
      som: reportData.som ?? null,
      methodologyNotes: reportData.methodology_notes ?? null,
      competitors: reportData.competitors ?? [],
      kpis: reportData.kpis ?? [],
      sourceCitations: reportData.source_citations ?? [],
    })
    .returning();

  res.json({ market_report: marketReportOut(report!) });
});
