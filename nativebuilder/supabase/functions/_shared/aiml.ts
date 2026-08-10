import { HttpError } from "./cors.ts";

/** AI/ML API (OpenAI-compatible). The key is an Edge Function secret, so it
 * never reaches the browser -- the one thing a client-side port couldn't do. */

const BASE_URL = Deno.env.get("AIML_BASE_URL") ?? "https://api.aimlapi.com/v1";
const FAST_MODEL = Deno.env.get("AIML_FAST_MODEL") ?? "gpt-4o-mini";
const REASONING_MODEL = Deno.env.get("AIML_REASONING_MODEL") ?? "gpt-4o";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Single-turn chat completion. reasoning=true picks the stronger model for
 * synthesis passes; leave it false for cheap extraction passes. */
export async function chat(
  messages: ChatMessage[],
  { reasoning = false }: { reasoning?: boolean } = {},
): Promise<string> {
  const apiKey = Deno.env.get("AIML_API_KEY");
  if (!apiKey) {
    throw new HttpError(500, "AIML_API_KEY is not set -- add it under Edge Functions -> Secrets");
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: reasoning ? REASONING_MODEL : FAST_MODEL,
      messages,
    }),
  });

  if (!response.ok) {
    throw new HttpError(502, `AI/ML API ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const body = await response.json();
  return body?.choices?.[0]?.message?.content ?? "";
}
