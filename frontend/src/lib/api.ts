const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createProfile: (ownerId: string) =>
    request<StartupProfile>("/profile", {
      method: "POST",
      body: JSON.stringify({ owner_id: ownerId }),
    }),

  getProfile: (id: string) => request<StartupProfile>(`/profile/${id}`),

  updateProfile: (id: string, patch: Partial<StartupProfile>) =>
    request<StartupProfile>(`/profile/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  generateIdeas: (profileId: string, domain: string, interests: string) =>
    request<{ idea_cards: IdeaCard[] }>("/idea/generate", {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId, domain, interests }),
    }),

  researchMarket: (profileId: string, ideaText: string) =>
    request<{ market_report: MarketReport }>("/market/research", {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId, idea_text: ideaText }),
    }),

  searchCofounders: (
    profileId: string,
    founderProfile: Record<string, unknown>,
    desiredComplement: string
  ) =>
    request<{ matches: CofounderMatch[] }>("/cofounder/search", {
      method: "POST",
      body: JSON.stringify({
        profile_id: profileId,
        founder_profile: founderProfile,
        desired_complement: desiredComplement,
      }),
    }),

  searchInvestors: (profileId: string) =>
    request<{ leads: InvestorLead[] }>("/investor/search", {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId }),
    }),
};
