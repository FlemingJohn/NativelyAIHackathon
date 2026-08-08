import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const startupProfiles = pgTable(
  "startup_profiles",
  {
    id: id(),
    ownerId: text("owner_id").notNull(),
    domain: text("domain"),
    ideaText: text("idea_text"),
    stage: text("stage"),
    targetMarket: text("target_market"),
    founderSkills: jsonb("founder_skills").$type<Record<string, unknown>>().notNull().default({}),
    timeCommitment: text("time_commitment"),
    budget: text("budget"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ix_startup_profiles_owner_id").on(table.ownerId)],
);

export const ideaCards = pgTable(
  "idea_cards",
  {
    id: id(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => startupProfiles.id, { onDelete: "cascade" }),
    problem: text("problem").notNull(),
    solution: text("solution").notNull(),
    whyNow: text("why_now").notNull(),
    businessModel: text("business_model").notNull(),
    sourceCitations: jsonb("source_citations").$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (table) => [index("ix_idea_cards_profile_id").on(table.profileId)],
);

export const marketReports = pgTable(
  "market_reports",
  {
    id: id(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => startupProfiles.id, { onDelete: "cascade" }),
    tam: text("tam"),
    sam: text("sam"),
    som: text("som"),
    methodologyNotes: text("methodology_notes"),
    competitors: jsonb("competitors").$type<unknown[]>().notNull().default([]),
    kpis: jsonb("kpis").$type<unknown[]>().notNull().default([]),
    sourceCitations: jsonb("source_citations").$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (table) => [index("ix_market_reports_profile_id").on(table.profileId)],
);

export const cofounderMatches = pgTable(
  "cofounder_matches",
  {
    id: id(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => startupProfiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    headline: text("headline"),
    profileUrl: text("profile_url"),
    matchRationale: text("match_rationale").notNull(),
    skillTags: jsonb("skill_tags").$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (table) => [index("ix_cofounder_matches_profile_id").on(table.profileId)],
);

export const investorLeads = pgTable(
  "investor_leads",
  {
    id: id(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => startupProfiles.id, { onDelete: "cascade" }),
    firm: text("firm").notNull(),
    person: text("person"),
    thesisSummary: text("thesis_summary"),
    portfolioHighlights: jsonb("portfolio_highlights").$type<string[]>().notNull().default([]),
    outreachAngle: text("outreach_angle"),
    sourceUrl: text("source_url"),
    createdAt: createdAt(),
  },
  (table) => [index("ix_investor_leads_profile_id").on(table.profileId)],
);

export const scrapeCache = pgTable(
  "scrape_cache",
  {
    id: id(),
    cacheKey: text("cache_key").notNull().unique(),
    toolName: text("tool_name").notNull(),
    rawResponse: jsonb("raw_response").$type<unknown>().notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ix_scrape_cache_cache_key").on(table.cacheKey)],
);

export type StartupProfileRow = typeof startupProfiles.$inferSelect;
export type IdeaCardRow = typeof ideaCards.$inferSelect;
export type MarketReportRow = typeof marketReports.$inferSelect;
export type CofounderMatchRow = typeof cofounderMatches.$inferSelect;
export type InvestorLeadRow = typeof investorLeads.$inferSelect;
