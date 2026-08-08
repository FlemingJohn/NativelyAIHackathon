/**
 * Row -> response-body mappers. These are the TypeScript equivalent of the
 * FastAPI `response_model` classes: they pin the exact snake_case shape the
 * frontend's types in frontend/src/lib/api.ts expect, and drop internal
 * columns (profile_id, created_at on child rows) that were never exposed.
 */

import type {
  CofounderMatchRow,
  IdeaCardRow,
  InvestorLeadRow,
  MarketReportRow,
  StartupProfileRow,
} from "./db/schema.js";

export function profileOut(row: StartupProfileRow) {
  return {
    id: row.id,
    owner_id: row.ownerId,
    domain: row.domain,
    idea_text: row.ideaText,
    stage: row.stage,
    target_market: row.targetMarket,
    founder_skills: row.founderSkills,
    time_commitment: row.timeCommitment,
    budget: row.budget,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function ideaCardOut(row: IdeaCardRow) {
  return {
    id: row.id,
    problem: row.problem,
    solution: row.solution,
    why_now: row.whyNow,
    business_model: row.businessModel,
    source_citations: row.sourceCitations,
  };
}

export function marketReportOut(row: MarketReportRow) {
  return {
    id: row.id,
    tam: row.tam,
    sam: row.sam,
    som: row.som,
    methodology_notes: row.methodologyNotes,
    competitors: row.competitors,
    kpis: row.kpis,
    source_citations: row.sourceCitations,
  };
}

export function cofounderMatchOut(row: CofounderMatchRow) {
  return {
    id: row.id,
    name: row.name,
    headline: row.headline,
    profile_url: row.profileUrl,
    match_rationale: row.matchRationale,
    skill_tags: row.skillTags,
  };
}

export function investorLeadOut(row: InvestorLeadRow) {
  return {
    id: row.id,
    firm: row.firm,
    person: row.person,
    thesis_summary: row.thesisSummary,
    portfolio_highlights: row.portfolioHighlights,
    outreach_angle: row.outreachAngle,
    source_url: row.sourceUrl,
  };
}
