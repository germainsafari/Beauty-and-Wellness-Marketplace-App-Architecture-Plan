import { ENV } from "../env.js";
import {
  buildAiCatalogContext,
  formatAiFallbackReply,
  searchCatalogForAi,
} from "../db/aiCatalog.js";
import { AI_LOCALE_INSTRUCTIONS, type Locale, isLocale } from "@hafi/i18n";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are Hafi AI — a local-services concierge for Rwanda and East Africa.

CRITICAL RULES:
1. You MUST ONLY recommend providers, services, and marketplace listings from the LIVE DATABASE section below.
2. If the database contains matching providers or services, list them with exact names, prices in RWF, addresses, and ratings. NEVER say you don't have data when matches exist.
3. For location queries (e.g. "Remera", "Kacyiru"), prioritize providers whose address or area matches.
4. Include actionable next steps: "Book via Discover → [Provider]" or "View in Marketplace".
5. Be warm, practical, and concise (2-4 short paragraphs, or a bullet list for multiple options).

You help with: beauty & wellness, electricians, mechanics, plumbers, cleaners, marketplace shopping, booking guidance, and offer tips.

Personality: Locally aware — Kigali/Rwanda, RWF pricing, MTN MoMo/Airtel Money.`;

let client: OpenAI | null = null;

function getClient() {
  if (!ENV.openaiApiKey) return null;
  if (!client) client = new OpenAI({ apiKey: ENV.openaiApiKey });
  return client;
}

export async function chatWithAgent(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  userContext?: { name?: string; location?: string; locale?: string }
) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const locale: Locale = userContext?.locale && isLocale(userContext.locale) ? userContext.locale : "en";
  const searchResults = await searchCatalogForAi(lastUser, userContext?.location);
  const catalogContext = await buildAiCatalogContext(lastUser, searchResults);

  const systemContent =
    SYSTEM_PROMPT +
    `\n${AI_LOCALE_INSTRUCTIONS[locale]}` +
    (userContext?.name ? `\nUser name: ${userContext.name}` : "") +
    (userContext?.location ? `\nUser location: ${userContext.location}` : "") +
    `\n\n${catalogContext}`;

  const openai = getClient();
  if (!openai) {
    return formatAiFallbackReply(lastUser, searchResults, userContext?.name);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemContent }, ...messages],
      max_tokens: 900,
      temperature: 0.4,
    });
    const reply = response.choices[0]?.message?.content;
    if (reply?.trim()) return reply;
  } catch {
    /* fall through to DB reply */
  }

  return formatAiFallbackReply(lastUser, searchResults, userContext?.name);
}

export async function getBeautySuggestions(query: string) {
  const openai = getClient();
  const defaults = [
    "Find an electrician near Remera",
    "Book a lash appointment this week",
    "Compare massage services in Kigali",
  ];

  if (!openai) return defaults;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return 3 short local service search suggestions as JSON array of strings only." },
        { role: "user", content: query },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });
    const text = response.choices[0]?.message?.content ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0]) as string[]) : defaults;
  } catch {
    return defaults;
  }
}
