import { Router } from "express";

import { db } from "../db/index.js";
import { ideaCards } from "../db/schema.js";
import { HttpError } from "../http/errors.js";
import { ideaGenerateRequest } from "../schemas.js";
import { ideaCardOut } from "../serialize.js";
import * as pipeline from "../services/pipeline.js";
import { getProfileOr404, touchProfile } from "../services/profiles.js";
import * as webClient from "../services/webClient.js";

const SYNTHESIS_SYSTEM_PROMPT = `You are a startup ideation assistant. Given a \
founder's domain/interests and raw web signal (trending discussions, recent \
news), produce 3-5 idea cards as a JSON array. Each item: {problem, solution, \
why_now, business_model, source_citations: [urls actually used]}. Ground each \
"why_now" in something from the provided signal, don't invent trends. Respond \
with a JSON array only, no markdown fences.`;

type RawIdeaCard = {
  problem?: string;
  solution?: string;
  why_now?: string;
  business_model?: string;
  source_citations?: string[];
};

export const ideaRouter = Router();

ideaRouter.post("/generate", async (req, res) => {
  const payload = ideaGenerateRequest.parse(req.body);
  const profile = await getProfileOr404(payload.profile_id);

  const domain = payload.domain || profile.domain;
  if (!domain) {
    throw new HttpError(400, "domain is required (either on the request or the profile)");
  }

  let query = `${domain} trends discussions problems 2026`;
  if (payload.interests) query += ` ${payload.interests}`;

  // 1. gather
  const serpRaw = await pipeline.cachedFetch({
    toolName: "search_engine",
    query,
    fetchFn: () => webClient.searchEngine(query),
  });

  // 2. extract
  const facts = await pipeline.extractFacts(
    JSON.stringify(serpRaw).slice(0, 8000),
    `Extract recurring pain points, trends, and unmet needs in: ${domain}`,
  );

  // 3. synthesize
  const synthesis = await pipeline.synthesize(
    SYNTHESIS_SYSTEM_PROMPT,
    `Domain: ${domain}\nInterests: ${payload.interests || "n/a"}\n` +
      `Clarifying answers: ${payload.answers_to_clarifying_questions || "n/a"}\n\n` +
      `Extracted signal:\n${JSON.stringify(facts)}`,
  );
  const cardsData = pipeline.parseJson<RawIdeaCard[]>(synthesis, []);

  await touchProfile(profile.id, { domain });

  const rows = cardsData.map((card) => ({
    profileId: profile.id,
    problem: card.problem ?? "",
    solution: card.solution ?? "",
    whyNow: card.why_now ?? "",
    businessModel: card.business_model ?? "",
    sourceCitations: card.source_citations ?? [],
  }));
  const inserted = rows.length ? await db.insert(ideaCards).values(rows).returning() : [];

  res.json({ idea_cards: inserted.map(ideaCardOut) });
});
