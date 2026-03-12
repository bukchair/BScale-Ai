/**
 * Multi-AI: Gemini, OpenAI, Claude.
 * Tries each provider in order and returns the first successful JSON response.
 */

import { GoogleGenAI } from "@google/genai";

export type AIKeys = { gemini?: string; openai?: string; claude?: string };

export function getAIKeysFromConnections(
  connections: { id: string; settings?: Record<string, string> }[]
): AIKeys {
  const gemini = connections.find((c) => c.id === "gemini")?.settings?.apiKey?.trim();
  const openai = connections.find((c) => c.id === "openai")?.settings?.apiKey?.trim();
  const claude = connections.find((c) => c.id === "claude")?.settings?.apiKey?.trim();
  return { gemini, openai, claude };
}

function parseJsonSafe<T>(text: string, fallback: T): T {
  if (!text || !text.trim()) return fallback;
  const raw = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function tryGemini(prompt: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return (response as any).text ?? "";
}

async function tryOpenAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || res.statusText);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  return text;
}

async function tryClaude(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || res.statusText);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "";
  return text;
}

/**
 * Run prompt with first available provider (Gemini → OpenAI → Claude).
 * Returns parsed JSON and which provider was used.
 */
export async function requestJSON<T = unknown>(
  prompt: string,
  keys: AIKeys
): Promise<{ data: T; provider: string }> {
  const errors: string[] = [];

  if (keys.gemini) {
    try {
      const text = await tryGemini(prompt, keys.gemini);
      const data = parseJsonSafe<T>(text, null as unknown as T);
      if (data != null) return { data, provider: "gemini" };
    } catch (e) {
      errors.push(`Gemini: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (keys.openai) {
    try {
      const text = await tryOpenAI(prompt, keys.openai);
      const data = parseJsonSafe<T>(text, null as unknown as T);
      if (data != null) return { data, provider: "openai" };
    } catch (e) {
      errors.push(`OpenAI: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (keys.claude) {
    try {
      const text = await tryClaude(prompt, keys.claude);
      const data = parseJsonSafe<T>(text, null as unknown as T);
      if (data != null) return { data, provider: "claude" };
    } catch (e) {
      errors.push(`Claude: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(
    "No AI provider responded successfully. " +
      (errors.length ? errors.join("; ") : "Add Gemini, OpenAI or Claude API key in Integrations.")
  );
}

/** Check if at least one AI key is configured */
export function hasAnyAIKey(keys: AIKeys): boolean {
  return !!(keys.gemini || keys.openai || keys.claude);
}
