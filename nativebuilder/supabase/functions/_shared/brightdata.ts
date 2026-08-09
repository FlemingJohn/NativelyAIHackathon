/**
 * Bright Data REST client.
 *
 * Two request shapes, both authenticated with a single API token:
 *
 *   Web Unlocker / SERP   synchronous   POST /request
 *   Web Scraper datasets  asynchronous  trigger -> poll -> download
 *
 * Docs: https://docs.brightdata.com/api-reference/rest-api/scraper/asynchronous-requests
 */

import type { SearchResult } from "./search-types.ts";

const BASE_URL = "https://api.brightdata.com";

/** Dataset ids from the LinkedIn scraper docs. Only Profiles is wired up so
 * far -- it's the one that turns a profile URL into structured person data,
 * which is what cofounder search needs. */
export const DATASETS = {
  linkedin_person_profile: "gd_l1viktl72bvl7bjuj0",
  linkedin_company_profile: "gd_l1vikfnt1wgvvqz95w",
  linkedin_jobs: "gd_lpfll7v5hcqtkxl6l",
  linkedin_posts: "gd_lyy3tktm25m4avu764",
} as const;

export function token(): string | undefined {
  return Deno.env.get("BRIGHTDATA_API_TOKEN") || undefined;
}

/** Bright Data is optional: without a token every module falls back to the
 * free search path, so the app still runs. */
export function isEnabled(): boolean {
  return Boolean(token());
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------- unlocker / serp ---

/** Web Unlocker: fetch any URL with bot protection handled server-side. */
export async function fetchUrl(
  url: string,
  { zone, format = "raw" }: { zone?: string; format?: string } = {},
): Promise<string> {
  const response = await fetch(`${BASE_URL}/request`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      zone: zone ?? Deno.env.get("BRIGHTDATA_WEB_UNLOCKER_ZONE") ?? "mcp_unlocker",
      url,
      format,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `bright data unlocker ${response.status}: ${(await response.text()).slice(0, 200)}`,
    );
  }
  return response.text();
}

type SerpOrganic = { link?: string; url?: string; title?: string; description?: string; snippet?: string };

/**
 * SERP API: Google results as parsed JSON.
 *
 * `brd_json=1` on the target URL makes Bright Data parse the SERP for us, so
 * there's no HTML scraping on our side — and unlike the DuckDuckGo fallback,
 * Google doesn't block it, which is what makes `site:` queries usable.
 */
export async function searchEngine(query: string, maxResults = 8): Promise<SearchResult[]> {
  const target = `https://www.google.com/search?q=${encodeURIComponent(query)}&brd_json=1`;
  const raw = await fetchUrl(target, {
    zone: Deno.env.get("BRIGHTDATA_SERP_ZONE") ?? Deno.env.get("BRIGHTDATA_WEB_UNLOCKER_ZONE") ?? "serp_api",
  });

  let parsed: { organic?: SerpOrganic[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("bright data SERP did not return JSON -- is brd_json=1 supported on this zone?");
  }

  return (parsed.organic ?? []).slice(0, maxResults).map((r) => ({
    title: r.title ?? "",
    url: r.link ?? r.url ?? "",
    snippet: r.description ?? r.snippet ?? "",
  }));
}

// ------------------------------------------------------------- datasets ---

export async function triggerDataset(
  datasetId: string,
  inputs: unknown[],
  params: Record<string, string> = {},
): Promise<string> {
  const qs = new URLSearchParams({ dataset_id: datasetId, format: "json", ...params });
  const response = await fetch(`${BASE_URL}/datasets/v3/trigger?${qs}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(inputs),
  });

  if (!response.ok) {
    throw new Error(
      `bright data trigger ${response.status}: ${(await response.text()).slice(0, 200)}`,
    );
  }
  const body = (await response.json()) as { snapshot_id?: string };
  if (!body.snapshot_id) throw new Error("bright data trigger returned no snapshot_id");
  return body.snapshot_id;
}

export async function pollSnapshot(
  snapshotId: string,
  { timeoutMs = 60_000, intervalMs = 4_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<"ready" | "failed" | "timeout"> {
  let waited = 0;
  while (waited < timeoutMs) {
    const response = await fetch(`${BASE_URL}/datasets/v3/progress/${snapshotId}`, {
      headers: headers(),
    });
    if (response.ok) {
      const { status } = (await response.json()) as { status?: string };
      if (status === "ready") return "ready";
      if (status === "failed") return "failed";
    }
    await sleep(intervalMs);
    waited += intervalMs;
  }
  // Deliberately not an throw: callers degrade to what they already have
  // rather than failing the whole request. Edge Functions have a wall clock.
  return "timeout";
}

export async function getSnapshot(snapshotId: string): Promise<unknown[]> {
  const response = await fetch(
    `${BASE_URL}/datasets/v3/snapshot/${snapshotId}?format=json`,
    { headers: headers() },
  );
  if (!response.ok) {
    throw new Error(`bright data snapshot ${response.status}`);
  }
  const body = await response.json();
  return Array.isArray(body) ? body : [body];
}

/** trigger -> poll -> download, with a hard time budget. Returns [] rather
 * than throwing when the job outlives the budget, so a slow dataset degrades
 * the answer instead of breaking the request. */
export async function runDataset(
  datasetId: string,
  inputs: unknown[],
  { timeoutMs = 60_000, params }: { timeoutMs?: number; params?: Record<string, string> } = {},
): Promise<unknown[]> {
  if (inputs.length === 0) return [];

  const snapshotId = await triggerDataset(datasetId, inputs, params);
  const status = await pollSnapshot(snapshotId, { timeoutMs });
  if (status !== "ready") {
    console.warn(`bright data dataset ${datasetId} ended as ${status}; continuing without it`);
    return [];
  }
  return getSnapshot(snapshotId);
}
