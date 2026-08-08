/**
 * Thin wrapper around Bright Data's REST APIs.
 *
 * Function names mirror the Bright Data MCP tool names 1:1 (see bright-data.md)
 * so this module can be swapped for a real MCP client later without touching
 * callers. Two request shapes:
 *
 * - Web Unlocker / SERP: synchronous, POST /request
 * - Datasets (web_data_* structured extractors): async trigger -> poll -> download
 */

import { config } from "../config.js";

const BASE_URL = "https://api.brightdata.com";

/** Per-platform dataset IDs (format gd_xxxxxxxxxxxx), looked up from the
 * Bright Data dashboard (Scraper Configuration tab). Fill in once the
 * account is provisioned -- see "Open items" in bright-data.md. */
export const DATASET_IDS: Record<string, string> = {
  web_data_linkedin_person_profile: "",
  web_data_linkedin_people_search: "",
  web_data_linkedin_company_profile: "",
  web_data_linkedin_posts: "",
  web_data_crunchbase_company: "",
  web_data_reddit_posts: "",
};

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${config.brightdataApiToken}`,
    "Content-Type": "application/json",
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureOk(response: Response, what: string): Promise<Response> {
  if (!response.ok) {
    throw new Error(`${what} failed: ${response.status} ${response.statusText}`);
  }
  return response;
}

/** Web Unlocker: fetch a single URL, bot-protection handled server-side. */
export async function fetchUrl(
  url: string,
  { zone, format = "raw" }: { zone?: string; format?: string } = {},
): Promise<string> {
  const response = await fetch(`${BASE_URL}/request`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ zone: zone ?? config.brightdataWebUnlockerZone, url, format }),
    signal: AbortSignal.timeout(60_000),
  });
  await ensureOk(response, "web unlocker request");
  return response.text();
}

export function scrapeAsMarkdown(url: string): Promise<string> {
  return fetchUrl(url, { format: "raw" });
}

/** SERP API: search results as parsed JSON (brd_json=1). */
export function searchEngine(
  query: string,
  { engine = "google", zone }: { engine?: "google" | "bing"; zone?: string } = {},
): Promise<string> {
  const engineUrls = {
    google: `https://www.google.com/search?q=${encodeURIComponent(query)}&brd_json=1`,
    bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}&brd_json=1`,
  };
  return fetchUrl(engineUrls[engine], { zone, format: "raw" });
}

/** Kick off an async Datasets collection job. Returns a snapshot_id. */
export async function triggerDataset(datasetId: string, inputs: unknown[]): Promise<string> {
  const response = await fetch(`${BASE_URL}/datasets/v3/trigger?dataset_id=${datasetId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(inputs),
    signal: AbortSignal.timeout(30_000),
  });
  await ensureOk(response, "dataset trigger");
  const body = (await response.json()) as { snapshot_id: string };
  return body.snapshot_id;
}

/** Poll until the snapshot is ready/failed, or throw. */
export async function pollSnapshot(
  snapshotId: string,
  { timeoutMs = 120_000, intervalMs = 3_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<string> {
  let elapsed = 0;
  while (elapsed < timeoutMs) {
    const response = await fetch(`${BASE_URL}/datasets/v3/progress/${snapshotId}`, {
      headers: headers(),
      signal: AbortSignal.timeout(30_000),
    });
    await ensureOk(response, "dataset progress");
    const { status } = (await response.json()) as { status?: string };
    if (status === "ready" || status === "failed") return status;
    await sleep(intervalMs);
    elapsed += intervalMs;
  }
  throw new Error(`snapshot ${snapshotId} not ready after ${timeoutMs}ms`);
}

export async function getSnapshotData(snapshotId: string): Promise<unknown[]> {
  const response = await fetch(`${BASE_URL}/datasets/v3/snapshot/${snapshotId}`, {
    headers: headers(),
    signal: AbortSignal.timeout(60_000),
  });
  await ensureOk(response, "dataset snapshot download");
  return (await response.json()) as unknown[];
}

/** Convenience: trigger + poll + download for a web_data_* tool. */
export async function runDatasetTool(
  toolName: string,
  inputs: unknown[],
  { timeoutMs = 120_000 }: { timeoutMs?: number } = {},
): Promise<unknown[]> {
  const datasetId = DATASET_IDS[toolName];
  if (!datasetId) {
    throw new Error(`no dataset_id configured for '${toolName}' -- set it in DATASET_IDS`);
  }
  const snapshotId = await triggerDataset(datasetId, inputs);
  const status = await pollSnapshot(snapshotId, { timeoutMs });
  if (status !== "ready") {
    throw new Error(`${toolName} snapshot ${snapshotId} ended with status=${status}`);
  }
  return getSnapshotData(snapshotId);
}
