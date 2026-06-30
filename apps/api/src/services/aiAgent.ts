import OpenAI from "openai";
import { ENV } from "../env.js";
import { getListings, getServices } from "../db/queries.js";

const SYSTEM_PROMPT = `You are Hafi AI — a friendly, trendy beauty & wellness concierge for young women in Rwanda and East Africa.

You help users with:
- Finding beauty services (hair, nails, lashes, makeup, massage, skincare)
- Shopping pre-loved beauty products on the Hafi marketplace (Vinted-style)
- Beauty tips, product recommendations, and salon etiquette
- Booking guidance and offer negotiation tips

Personality: Warm, Gen-Z friendly, use occasional emojis (not excessive). Know local context (Kigali, RWF pricing, MTN MoMo payments).

When recommending products or services, be specific. If you don't have data, suggest browsing the Marketplace or Bookings tabs in the app.

Keep responses concise (2-4 short paragraphs max unless listing multiple options).`;

let client: OpenAI | null = null;

function getClient() {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!client) {
    client = new OpenAI({ apiKey: ENV.openaiApiKey });
  }
  return client;
}

export async function chatWithAgent(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  userContext?: { name?: string; location?: string }
) {
  const openai = getClient();

  let contextBlock = "";
  try {
    const [listingSample, serviceSample] = await Promise.all([
      getListings({ limit: 5 }),
      getServices(),
    ]);

    const listingSummary = listingSample
      .slice(0, 5)
      .map((l) => `- ${l.title}: RWF ${l.price} (${l.condition}, ${l.location ?? "Rwanda"})`)
      .join("\n");

    const serviceSummary = serviceSample
      .slice(0, 5)
      .map((s) => `- ${s.service.name}: RWF ${s.service.price} at ${s.provider.businessName}`)
      .join("\n");

    contextBlock = `\n\nLive app data:\nTrending listings:\n${listingSummary || "No listings yet"}\n\nAvailable services:\n${serviceSummary || "No services yet"}`;
  } catch {
    contextBlock = "";
  }

  const systemContent =
    SYSTEM_PROMPT +
    (userContext?.name ? `\nUser name: ${userContext.name}` : "") +
    (userContext?.location ? `\nUser location: ${userContext.location}` : "") +
    contextBlock;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemContent }, ...messages],
    max_tokens: 800,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response. Try again! 💜";
}

export async function getBeautySuggestions(query: string) {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return 3 short beauty/wellness search suggestions as JSON array of strings only." },
      { role: "user", content: query },
    ],
    max_tokens: 150,
    temperature: 0.8,
  });

  const text = response.choices[0]?.message?.content ?? "[]";
  try {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0]) as string[]) : [];
  } catch {
    return ["Glow-up skincare routine", "Braids near me", "Pre-loved makeup deals"];
  }
}
