import { getAllProviders, getListings, getServiceCategories, getServices } from "./queries.js";

export type AiSearchResults = {
  services: Awaited<ReturnType<typeof getServices>>;
  providers: Awaited<ReturnType<typeof getAllProviders>>;
  listings: Awaited<ReturnType<typeof getListings>>;
  matchedKeywords: string[];
};

const SYNONYMS: Record<string, string[]> = {
  electrician: ["electric", "electrician", "electrical", "wiring", "lighting", "power"],
  mechanic: ["mechanic", "auto", "car", "diagnostic", "oil", "vehicle", "garage"],
  plumbing: ["plumb", "plumber", "leak", "drain", "pipe", "water"],
  cleaning: ["clean", "cleaner", "sanitize", "home clean"],
  hair: ["hair", "braid", "salon", "silk press", "manicure"],
  makeup: ["makeup", "glam", "mua"],
  skincare: ["skincare", "skin", "facial"],
  lashes: ["lash", "lashes", "volume lash"],
  massage: ["massage", "spa", "wellness", "aromatherapy", "relaxation"],
  nails: ["nail", "manicure", "gel"],
};

function extractKeywords(query: string): string[] {
  const q = query.toLowerCase();
  const words = q.split(/[\s,?.!]+/).filter((w) => w.length > 2);
  const expanded = new Set(words);

  for (const [, terms] of Object.entries(SYNONYMS)) {
    if (terms.some((t) => q.includes(t))) {
      terms.forEach((t) => expanded.add(t));
    }
  }

  return [...expanded];
}

function haystackForService(row: Awaited<ReturnType<typeof getServices>>[number]) {
  return [
    row.service.name,
    row.service.description ?? "",
    row.provider.businessName,
    row.provider.description ?? "",
    row.provider.address,
    row.category?.name ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function haystackForProvider(row: Awaited<ReturnType<typeof getAllProviders>>[number]) {
  return [row.profile.businessName, row.profile.description ?? "", row.profile.address, row.user.name]
    .join(" ")
    .toLowerCase();
}

function haystackForListing(row: Awaited<ReturnType<typeof getListings>>[number]) {
  return [row.title, row.description ?? "", row.brand ?? "", row.location ?? "", ...(row.tags ?? [])]
    .join(" ")
    .toLowerCase();
}

function scoreMatch(haystack: string, keywords: string[], locationHint?: string): number {
  let score = 0;
  for (const k of keywords) {
    if (haystack.includes(k)) score += 2;
  }
  if (locationHint && haystack.includes(locationHint.toLowerCase())) score += 5;
  return score;
}

function extractLocation(query: string): string | undefined {
  const q = query.toLowerCase();
  const areas = [
    "remera",
    "kacyiru",
    "nyamirambo",
    "kiyovu",
    "nyarutarama",
    "kimihurura",
    "kigali",
    "butare",
    "musanze",
  ];
  return areas.find((a) => q.includes(a));
}

export async function searchCatalogForAi(
  query: string,
  userLocation?: string
): Promise<AiSearchResults> {
  const [allServices, allProviders, allListings] = await Promise.all([
    getServices(),
    getAllProviders(),
    getListings({ limit: 40 }),
  ]);

  const keywords = extractKeywords(query);
  const locationHint = extractLocation(query) ?? extractLocation(userLocation ?? "");

  const services = allServices
    .map((row) => ({ row, score: scoreMatch(haystackForService(row), keywords, locationHint) }))
    .filter(({ score }) => score > 0 || keywords.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ row }) => row);

  const providers = allProviders
    .map((row) => ({ row, score: scoreMatch(haystackForProvider(row), keywords, locationHint) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ row }) => row);

  const listings = allListings
    .map((row) => ({ row, score: scoreMatch(haystackForListing(row), keywords, locationHint) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ row }) => row);

  const finalServices =
    services.length > 0 ? services : keywords.length === 0 ? allServices.slice(0, 15) : allServices.slice(0, 8);

  return {
    services: finalServices,
    providers: providers.length > 0 ? providers : allProviders.slice(0, 6),
    listings: listings.length > 0 ? listings : allListings.slice(0, 6),
    matchedKeywords: keywords,
  };
}

export async function buildAiCatalogContext(query: string, search: AiSearchResults): Promise<string> {
  const categories = await getServiceCategories();
  const locationHint = extractLocation(query);

  const categoryBlock = categories
    .map((c) => `- ${c.icon ?? "•"} ${c.name}`)
    .join("\n");

  const serviceBlock = search.services
    .map(
      (s) =>
        `• ${s.service.name} — RWF ${Number(s.service.price).toLocaleString()} (${s.service.duration} min) at ${s.provider.businessName}, ${s.provider.address} ★${s.provider.rating} [category: ${s.category?.name ?? "General"}]`
    )
    .join("\n");

  const providerBlock = search.providers
    .map(
      (p) =>
        `• ${p.profile.businessName} — ${p.profile.address}, ★${p.profile.rating} (${p.profile.reviewCount} reviews)${p.user.isVerified ? " ✓ Verified" : ""}. ${p.profile.description ?? ""}`
    )
    .join("\n");

  const listingBlock = search.listings
    .map(
      (l) =>
        `• ${l.title} — RWF ${Number(l.price).toLocaleString()} (${l.condition}, ${l.location ?? "Rwanda"})${l.brand ? `, brand: ${l.brand}` : ""}`
    )
    .join("\n");

  return `=== LIVE DATABASE (authoritative — use ONLY this data) ===
Query context: "${query}"${locationHint ? ` | Location focus: ${locationHint}` : ""}

SERVICE CATEGORIES:
${categoryBlock}

MATCHING SERVICES (${search.services.length}):
${serviceBlock || "None matched — show nearest providers below."}

PROVIDERS (${search.providers.length}):
${providerBlock || "No provider matches."}

MARKETPLACE LISTINGS (${search.listings.length}):
${listingBlock || "No listing matches."}

App navigation: Discover (book services) | Marketplace (buy items) | Bookings (appointments) | Messages (chat sellers/providers).`;
}

export function formatAiFallbackReply(
  query: string,
  search: AiSearchResults,
  userName?: string
): string {
  const greeting = userName ? `Hey ${userName.split(" ")[0]}! ` : "";
  const locationHint = extractLocation(query);

  const topServices = search.services.filter((s) => {
    if (!locationHint) return true;
    return haystackForService(s).includes(locationHint);
  });

  const servicesToShow = (topServices.length > 0 ? topServices : search.services).slice(0, 4);

  if (servicesToShow.length > 0) {
    const lines = servicesToShow.map(
      (s) =>
        `• **${s.service.name}** — RWF ${Number(s.service.price).toLocaleString()} at **${s.provider.businessName}** (${s.provider.address}, ★${s.provider.rating})`
    );
    return `${greeting}I found these in Hafi's live database${locationHint ? ` near **${locationHint}**` : ""}:\n\n${lines.join("\n")}\n\nOpen **Discover** to book, or **Bookings** to pick a date & time. Want me to compare prices or suggest alternatives?`;
  }

  if (search.providers.length > 0) {
    const lines = search.providers.slice(0, 3).map(
      (p) => `• **${p.profile.businessName}** — ${p.profile.address} (★${p.profile.rating})`
    );
    return `${greeting}Here are trusted providers on Hafi:\n\n${lines.join("\n")}\n\nTap **Discover** to see their full service menu and book.`;
  }

  return `${greeting}I searched Hafi but didn't find an exact match for "${query}". Try **Discover** to browse all categories — we have electricians, mechanics, salons, lash bars, massage, cleaning, and more. Or tell me a specific area like Remera or Kacyiru!`;
}
