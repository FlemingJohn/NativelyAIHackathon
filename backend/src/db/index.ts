import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { config } from "../config.js";
import * as schema from "./schema.js";

/** `prepare: false` is required when connecting through Supabase's transaction
 * pooler (port 6543), which doesn't support prepared statements. It's harmless
 * on the direct/session connection, so we set it unconditionally. */
const client = postgres(config.databaseUrl, { prepare: false, max: 10 });

export const db = drizzle(client, { schema });

export async function closeDb(): Promise<void> {
  await client.end();
}

export { schema };
