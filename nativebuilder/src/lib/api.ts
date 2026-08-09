import type {
  CofounderMatch,
  IdeaCard,
  InvestorLead,
  MarketReport,
  StartupProfile,
} from "./types";

/** Same shape as the Express-backed client this replaces -- every page keeps
 * calling api.generateIdeas(...) and never learns the backend moved. The only
 * difference is where the requests land: Supabase Edge Functions instead of
 * localhost:8000. */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase is not configured -- connect it in the Integrations panel, or set " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Works with both key formats: the legacy anon JWT (eyJ...) and the
      // newer publishable key (sb_publishable_...). Sent in both headers
      // because Edge Functions check Authorization and PostgREST checks apikey.
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      ...(init?.headers || {}),
    },
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
    request<{ idea_cards: IdeaCard[] }>("/idea", {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId, domain, interests }),
    }),

  researchMarket: (profileId: string, ideaText: string) =>
    request<{ market_report: MarketReport }>("/market", {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId, idea_text: ideaText }),
    }),

  searchCofounders: (
    profileId: string,
    founderProfile: Record<string, unknown>,
    desiredComplement: string,
  ) =>
    request<{ matches: CofounderMatch[] }>("/cofounder", {
      method: "POST",
      body: JSON.stringify({
        profile_id: profileId,
        founder_profile: founderProfile,
        desired_complement: desiredComplement,
      }),
    }),

  searchInvestors: (profileId: string) =>
    request<{ leads: InvestorLead[] }>("/investor", {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId }),
    }),
};

export type {
  CofounderMatch,
  IdeaCard,
  InvestorLead,
  MarketReport,
  StartupProfile,
};
