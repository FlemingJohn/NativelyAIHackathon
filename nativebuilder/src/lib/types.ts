export type StartupProfile = {
  id: string;
  owner_id: string;
  domain: string | null;
  idea_text: string | null;
  stage: string | null;
  target_market: string | null;
  founder_skills: Record<string, unknown>;
  time_commitment: string | null;
  budget: string | null;
  created_at: string;
  updated_at: string;
};

/** One line of a score: what was assessed, what it earned, what it could earn.
 * The headline score is the sum of these, recomputed server-side. */
export type Criterion = { label: string; points: number; max: number };

export type IdeaCard = {
  id: string;
  problem: string;
  solution: string;
  why_now: string;
  business_model: string;
  fit_score: number;
  score_breakdown: Criterion[];
  source_citations: string[];
};

export type MarketReport = {
  id: string;
  tam: string | null;
  sam: string | null;
  som: string | null;
  methodology_notes: string | null;
  competitors: { name: string; summary: string; url?: string }[];
  kpis: { name: string; why_it_matters: string }[];
  source_citations: string[];
};

export type CofounderMatch = {
  id: string;
  name: string;
  headline: string | null;
  profile_url: string | null;
  fit_score: number;
  /** "strong" | "partial" | "none" — every candidate is returned, including
   * the ones that don't fit, because why they don't is useful. */
  fit_level: string;
  score_breakdown: Criterion[];
  match_rationale: string;
  skill_tags: string[];
};

/** Where a result's evidence came from. Returned by every module so the UI can
 * say it out loud rather than leaving provenance implicit. */
export type SourcedVia = "brightdata" | "cache";

export type InvestorLead = {
  id: string;
  firm: string;
  person: string | null;
  thesis_summary: string | null;
  portfolio_highlights: string[];
  outreach_angle: string | null;
  source_url: string | null;
};
