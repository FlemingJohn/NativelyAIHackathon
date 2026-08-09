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

export type IdeaCard = {
  id: string;
  problem: string;
  solution: string;
  why_now: string;
  business_model: string;
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
  match_rationale: string;
  skill_tags: string[];
};

export type InvestorLead = {
  id: string;
  firm: string;
  person: string | null;
  thesis_summary: string | null;
  portfolio_highlights: string[];
  outreach_angle: string | null;
  source_url: string | null;
};
