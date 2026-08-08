import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { config } from "../config.js";

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!client) {
    if (!config.aimlApiKey) {
      throw new Error("AIML_API_KEY is not set -- add it to backend/.env");
    }
    client = new OpenAI({ baseURL: config.aimlBaseUrl, apiKey: config.aimlApiKey });
  }
  return client;
}

export type ChatMessage = ChatCompletionMessageParam;

/** Single-turn chat completion. Use reasoning=true for synthesis passes
 * (idea generation, market sizing, ranking); leave false for cheap
 * extraction passes. */
export async function chat(
  messages: ChatMessage[],
  { reasoning = false }: { reasoning?: boolean } = {},
): Promise<string> {
  const model = reasoning ? config.aimlReasoningModel : config.aimlFastModel;
  const response = await getClient().chat.completions.create({ model, messages });
  return response.choices[0]?.message?.content ?? "";
}
