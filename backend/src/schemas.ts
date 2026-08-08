import { z } from "zod";

/** Request bodies use the same snake_case field names the Python backend
 * exposed, so frontend/src/lib/api.ts works unchanged. */

export const startupProfileCreate = z.object({
  owner_id: z.string(),
  domain: z.string().nullish(),
  idea_text: z.string().nullish(),
  stage: z.string().nullish(),
  target_market: z.string().nullish(),
  founder_skills: z.record(z.unknown()).default({}),
  time_commitment: z.string().nullish(),
  budget: z.string().nullish(),
});

/** Every field optional -- only the keys actually present are applied, which is
 * the equivalent of pydantic's `model_dump(exclude_unset=True)`. */
export const startupProfileUpdate = z.object({
  domain: z.string().nullish(),
  idea_text: z.string().nullish(),
  stage: z.string().nullish(),
  target_market: z.string().nullish(),
  founder_skills: z.record(z.unknown()).optional(),
  time_commitment: z.string().nullish(),
  budget: z.string().nullish(),
});

export const ideaGenerateRequest = z.object({
  profile_id: z.string(),
  domain: z.string().nullish(),
  interests: z.string().nullish(),
  answers_to_clarifying_questions: z.string().nullish(),
});

export const marketResearchRequest = z.object({
  profile_id: z.string(),
  idea_text: z.string(),
});

export const cofounderSearchRequest = z.object({
  profile_id: z.string(),
  founder_profile: z.record(z.unknown()),
  desired_complement: z.string(),
});

export const investorSearchRequest = z.object({
  profile_id: z.string(),
});

export type StartupProfileCreate = z.infer<typeof startupProfileCreate>;
export type StartupProfileUpdate = z.infer<typeof startupProfileUpdate>;
export type IdeaGenerateRequest = z.infer<typeof ideaGenerateRequest>;
export type MarketResearchRequest = z.infer<typeof marketResearchRequest>;
export type CofounderSearchRequest = z.infer<typeof cofounderSearchRequest>;
export type InvestorSearchRequest = z.infer<typeof investorSearchRequest>;
