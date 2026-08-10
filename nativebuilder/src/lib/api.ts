import type {
  CofounderMatch,
  IdeaCard,
  InvestorLead,
  MarketReport,
  SourcedVia,
  StartupProfile,
} from "./types";

/** Everything saved against a profile — what each module wrote, read back. */
export type ProfileFull = {
  profile: StartupProfile;
  idea_cards: IdeaCard[];
  market_report: MarketReport | null;
  matches: CofounderMatch[];
  leads: InvestorLead[];
};

/** Same shape as the Express-backed client this replaces -- every page keeps
 * calling api.generateIdeas(...) and never learns the backend moved. The only
 * difference is where the requests land: Supabase Edge Functions instead of
 * localhost:8000. */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Checked per request, not at module load. Throwing at import time would take
 * the whole bundle down -- including the landing page, which needs no backend
 * at all -- the moment someone opens the app before wiring Supabase up. */
function requireConfig(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured -- connect it in the Integrations panel, or set " +
        "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { url: baseUrl, key: anonKey } = requireConfig();
  const res = await fetch(`${baseUrl}/functions/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Works with both key formats: the legacy anon JWT (eyJ...) and the
      // newer publishable key (sb_publishable_...). Sent in both headers
      // because Edge Functions check Authorization and PostgREST checks apikey.
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
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

  /** Profile plus everything the modules saved, so a page can restore its
   * results instead of starting blank on every visit. */
  getProfileFull: (id: string) => request<ProfileFull>(`/profile/${id}/full`),

  updateProfile: (id: string, patch: Partial<StartupProfile>) =>
    request<StartupProfile>(`/profile/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  generateIdeas: (profileId: string, domain: string, interests: string) =>
    request<{ idea_cards: IdeaCard[]; sourced_via: SourcedVia }>("/idea", {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId, domain, interests }),
    }),

  researchMarket: (profileId: string, ideaText: string) =>
    request<{ market_report: MarketReport; sourced_via: SourcedVia }>("/market", {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId, idea_text: ideaText }),
    }),

  searchCofounders: (
    profileId: string,
    founderProfile: Record<string, unknown>,
    desiredComplement: string,
  ) =>
    request<{
      matches: CofounderMatch[];
      sourced_via: SourcedVia;
      profiles_found: number;
      profiles_enriched: number;
    }>("/cofounder", {
      method: "POST",
      body: JSON.stringify({
        profile_id: profileId,
        founder_profile: founderProfile,
        desired_complement: desiredComplement,
      }),
    }),

  searchInvestors: (profileId: string) =>
    request<{ leads: InvestorLead[]; sourced_via: SourcedVia }>("/investor", {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId }),
    }),
};

export type {
  CofounderMatch,
  IdeaCard,
  InvestorLead,
  MarketReport,
  SourcedVia,
  StartupProfile,
};
