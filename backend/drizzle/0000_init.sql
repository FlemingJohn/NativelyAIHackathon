CREATE TABLE "cofounder_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"headline" text,
	"profile_url" text,
	"match_rationale" text NOT NULL,
	"skill_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"problem" text NOT NULL,
	"solution" text NOT NULL,
	"why_now" text NOT NULL,
	"business_model" text NOT NULL,
	"source_citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investor_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"firm" text NOT NULL,
	"person" text,
	"thesis_summary" text,
	"portfolio_highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"outreach_angle" text,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"tam" text,
	"sam" text,
	"som" text,
	"methodology_notes" text,
	"competitors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"kpis" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"tool_name" text NOT NULL,
	"raw_response" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scrape_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "startup_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"domain" text,
	"idea_text" text,
	"stage" text,
	"target_market" text,
	"founder_skills" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"time_commitment" text,
	"budget" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cofounder_matches" ADD CONSTRAINT "cofounder_matches_profile_id_startup_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."startup_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_cards" ADD CONSTRAINT "idea_cards_profile_id_startup_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."startup_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investor_leads" ADD CONSTRAINT "investor_leads_profile_id_startup_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."startup_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_reports" ADD CONSTRAINT "market_reports_profile_id_startup_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."startup_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_cofounder_matches_profile_id" ON "cofounder_matches" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "ix_idea_cards_profile_id" ON "idea_cards" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "ix_investor_leads_profile_id" ON "investor_leads" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "ix_market_reports_profile_id" ON "market_reports" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "ix_scrape_cache_cache_key" ON "scrape_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX "ix_startup_profiles_owner_id" ON "startup_profiles" USING btree ("owner_id");