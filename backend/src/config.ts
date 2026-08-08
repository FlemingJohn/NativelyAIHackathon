import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set -- copy .env.example to .env and fill it in`);
  }
  return value;
}

export const config = {
  aimlApiKey: process.env.AIML_API_KEY || "",
  aimlBaseUrl: process.env.AIML_BASE_URL || "https://api.aimlapi.com/v1",
  aimlFastModel: process.env.AIML_FAST_MODEL || "gpt-4o-mini",
  aimlReasoningModel: process.env.AIML_REASONING_MODEL || "gpt-4o",

  brightdataApiToken: process.env.BRIGHTDATA_API_TOKEN || "",
  brightdataWebUnlockerZone: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || "mcp_unlocker",

  /** Supabase Postgres connection string (Project Settings -> Database -> Connection string). */
  databaseUrl: required("DATABASE_URL"),

  port: Number(process.env.PORT || 8000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
} as const;
