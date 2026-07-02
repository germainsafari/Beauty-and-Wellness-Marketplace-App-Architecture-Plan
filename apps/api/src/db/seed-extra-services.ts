import "dotenv/config";
import { resolve } from "path";
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";

config({ path: resolve(process.cwd(), "../../.env") });

import { db } from "./index.js";
import { listings, providerProfiles, serviceCategories, services, users } from "./schema.js";

const EXTRA_IMAGES = [
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&q=80",
  "https://images.unsplash.com/photo-1600334129128-685c5582fd62?w=400&q=80",
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80",
  "https://images.unsplash.com/photo-1519415510236-718711f81606?w=400&q=80",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
  "https://images.unsplash.com/photo-1527799820374-dcf8d9a5e0a3?w=400&q=80",
];

async function ensureCategory(name: string, icon: string) {
  const [existing] = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.name, name))
    .limit(1);
  if (existing) return existing;
  const [created] = await db.insert(serviceCategories).values({ name, icon }).returning();
  return created;
}

async function ensureUser(data: {
  name: string;
  phone: string;
  role: "customer" | "provider" | "admin";
  location: string;
  bio: string;
  isVerified?: boolean;
  avatarUrl?: string;
}) {
  const [existing] = await db.select().from(users).where(eq(users.phone, data.phone)).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({
      name: data.name,
      phone: data.phone,
      role: data.role,
      location: data.location,
      bio: data.bio,
      isVerified: data.isVerified ?? true,
      avatarUrl: data.avatarUrl,
      walletBalance: "15000.00",
      loyaltyPoints: 200,
    })
    .returning();
  return created;
}

async function ensureProvider(
  userId: number,
  data: {
    businessName: string;
    description: string;
    address: string;
    latitude: string;
    longitude: string;
    rating: string;
    reviewCount: number;
  }
) {
  const [existing] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(providerProfiles)
    .values({ userId, ...data })
    .returning();
  return created;
}

async function ensureService(
  providerId: number,
  categoryId: number,
  data: { name: string; description: string; duration: number; price: string }
) {
  const [existing] = await db
    .select()
    .from(services)
    .where(and(eq(services.providerId, providerId), eq(services.name, data.name)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(services)
    .values({ providerId, categoryId, ...data })
    .returning();
  return created;
}

async function ensureListing(
  sellerId: number,
  data: {
    title: string;
    description: string;
    price: string;
    originalPrice?: string;
    condition: "new" | "like_new" | "good" | "fair";
    brand?: string;
    images: string[];
    location: string;
    isNegotiable?: boolean;
    tags: string[];
    likes?: number;
    views?: number;
  }
) {
  const [existing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.sellerId, sellerId), eq(listings.title, data.title)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(listings)
    .values({
      sellerId,
      ...data,
      isNegotiable: data.isNegotiable ?? false,
      likes: data.likes ?? 0,
      views: data.views ?? 0,
    })
    .returning();
  return created;
}

export async function insertExtraServicesData() {
  const lashes = await ensureCategory("Lashes", "👁️");
  const massage = await ensureCategory("Massage", "💆");
  const cleaning = await ensureCategory("Cleaning", "🧹");
  const electrician = await ensureCategory("Electrician", "⚡");
  const mechanic = await ensureCategory("Mechanic", "🔧");
  const plumbing = await ensureCategory("Plumbing", "🚿");

  const serena = await ensureUser({
    name: "Serena Lash Bar",
    phone: "+250780000008",
    role: "provider",
    location: "Kigali, Rwanda",
    bio: "Classic, volume & hybrid lash extensions",
    avatarUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=100&q=80",
  });
  const serenaProfile = await ensureProvider(serena.id, {
    businessName: "Serena Lash Bar",
    description: "Premium lash extensions, lifts & fills. Booksy-style precision appointments.",
    address: "Kiyovu, Kigali",
    latitude: "-1.9700",
    longitude: "30.0580",
    rating: "4.95",
    reviewCount: 89,
  });
  await ensureService(serenaProfile.id, lashes.id, {
    name: "Classic Lash Full Set",
    description: "Natural classic extensions, 2–3 week fill recommended",
    duration: 120,
    price: "35000.00",
  });
  await ensureService(serenaProfile.id, lashes.id, {
    name: "Volume Lash Full Set",
    description: "Dramatic volume fans for events & photos",
    duration: 150,
    price: "45000.00",
  });
  await ensureService(serenaProfile.id, lashes.id, {
    name: "Lash Lift & Tint",
    description: "Curl and tint your natural lashes",
    duration: 60,
    price: "18000.00",
  });

  const zen = await ensureUser({
    name: "Zen Wellness Spa",
    phone: "+250780000009",
    role: "provider",
    location: "Kigali, Rwanda",
    bio: "Swedish, deep tissue & aromatherapy massage",
    avatarUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&q=80",
  });
  const zenProfile = await ensureProvider(zen.id, {
    businessName: "Zen Wellness Spa",
    description: "Relaxation massage, sports recovery & couples packages in a calm studio.",
    address: "Nyarutarama, Kigali",
    latitude: "-1.9280",
    longitude: "30.1120",
    rating: "4.85",
    reviewCount: 156,
  });
  await ensureService(zenProfile.id, massage.id, {
    name: "Swedish Relaxation Massage",
    description: "60 min full-body relaxation",
    duration: 60,
    price: "22000.00",
  });
  await ensureService(zenProfile.id, massage.id, {
    name: "Deep Tissue Sports Massage",
    description: "Targeted muscle recovery",
    duration: 75,
    price: "28000.00",
  });
  await ensureService(zenProfile.id, massage.id, {
    name: "Aromatherapy Couples Session",
    description: "Side-by-side 90 min with essential oils",
    duration: 90,
    price: "55000.00",
  });

  const sparkle = await ensureUser({
    name: "Sparkle Home Clean",
    phone: "+250780000010",
    role: "provider",
    location: "Kigali, Rwanda",
    bio: "Deep cleaning for homes & offices",
    avatarUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&q=80",
  });
  const sparkleProfile = await ensureProvider(sparkle.id, {
    businessName: "Sparkle Home Clean",
    description: "Trusted home & office cleaning — move-in, deep clean, and regular visits.",
    address: "Remera, Kigali",
    latitude: "-1.9483",
    longitude: "30.1106",
    rating: "4.75",
    reviewCount: 42,
  });
  await ensureService(sparkleProfile.id, cleaning.id, {
    name: "Standard Home Clean",
    description: "2-bedroom apartment, kitchen & bathrooms",
    duration: 180,
    price: "25000.00",
  });
  await ensureService(sparkleProfile.id, cleaning.id, {
    name: "Deep Clean & Sanitize",
    description: "Move-in or post-renovation deep clean",
    duration: 240,
    price: "40000.00",
  });

  const kigaliElectric = await ensureUser({
    name: "Kigali Electricians",
    phone: "+250780000005",
    role: "provider",
    location: "Remera, Kigali",
    bio: "Licensed electrical repair team",
  });
  const electricProfile = await ensureProvider(kigaliElectric.id, {
    businessName: "Kigali Electricians",
    description: "Emergency wiring, lighting, sockets & breaker panel fixes.",
    address: "Remera, Kigali",
    latitude: "-1.9483",
    longitude: "30.1106",
    rating: "4.80",
    reviewCount: 86,
  });
  await ensureService(electricProfile.id, electrician.id, {
    name: "Emergency Electrical Repair",
    description: "Fast diagnosis and repair for power faults",
    duration: 90,
    price: "18000.00",
  });
  await ensureService(electricProfile.id, electrician.id, {
    name: "Lighting Installation",
    description: "Indoor or outdoor lighting safely installed",
    duration: 120,
    price: "25000.00",
  });

  const nyamiramboAuto = await ensureUser({
    name: "Nyamirambo Auto",
    phone: "+250780000006",
    role: "provider",
    location: "Nyamirambo, Kigali",
    bio: "Mobile mechanic for diagnostics & maintenance",
  });
  const autoProfile = await ensureProvider(nyamiramboAuto.id, {
    businessName: "Nyamirambo Auto",
    description: "Diagnostics, oil changes, brakes & roadside checks.",
    address: "Nyamirambo, Kigali",
    latitude: "-1.9822",
    longitude: "30.0388",
    rating: "4.70",
    reviewCount: 64,
  });
  await ensureService(autoProfile.id, mechanic.id, {
    name: "Car Diagnostic Visit",
    description: "On-site scan and mechanical inspection",
    duration: 60,
    price: "15000.00",
  });
  await ensureService(autoProfile.id, mechanic.id, {
    name: "Oil Change Service",
    description: "Oil and filter replacement labor",
    duration: 45,
    price: "12000.00",
  });

  const quickFix = await ensureUser({
    name: "QuickFix Plumbing",
    phone: "+250780000007",
    role: "provider",
    location: "Kacyiru, Kigali",
    bio: "Reliable plumbing for homes & offices",
  });
  const plumbingProfile = await ensureProvider(quickFix.id, {
    businessName: "QuickFix Plumbing",
    description: "Leaks, blocked drains, tap replacement & water heater checks.",
    address: "Kacyiru, Kigali",
    latitude: "-1.9365",
    longitude: "30.0789",
    rating: "4.90",
    reviewCount: 51,
  });
  await ensureService(plumbingProfile.id, plumbing.id, {
    name: "Leak Repair Visit",
    description: "Kitchen, bathroom, or pipe leak repair",
    duration: 75,
    price: "16000.00",
  });
  await ensureService(plumbingProfile.id, plumbing.id, {
    name: "Blocked Drain Service",
    description: "Clear sink, bathroom & outdoor blockages",
    duration: 90,
    price: "20000.00",
  });

  await ensureListing(serena.id, {
    title: "Lash Extension Aftercare Kit",
    description: "Sealed foam cleanser, spoolie brush & oil-free remover. Never opened.",
    price: "8000.00",
    originalPrice: "12000.00",
    condition: "new",
    brand: "Lashify",
    images: [EXTRA_IMAGES[0]],
    location: "Kigali",
    isNegotiable: true,
    tags: ["lashes", "aftercare"],
    likes: 23,
    views: 112,
  });
  await ensureListing(zen.id, {
    title: "Aromatherapy Essential Oil Set (6)",
    description: "Lavender, eucalyptus, peppermint & more. Used once in spa.",
    price: "14000.00",
    condition: "like_new",
    brand: "doTERRA",
    images: [EXTRA_IMAGES[1]],
    location: "Kigali",
    tags: ["wellness", "massage"],
    likes: 34,
    views: 189,
  });
  await ensureListing(sparkle.id, {
    title: "Kärcher SC3 Steam Cleaner",
    description: "Professional steam cleaner. Great for deep home sanitizing.",
    price: "95000.00",
    originalPrice: "145000.00",
    condition: "good",
    brand: "Kärcher",
    images: [EXTRA_IMAGES[2]],
    location: "Kigali",
    isNegotiable: true,
    tags: ["cleaning", "tools"],
    likes: 56,
    views: 302,
  });

  return {
    providers: 6,
    services: 14,
    listings: 3,
  };
}

async function main() {
  console.log("🌱 Seeding extra services & marketplace items...");
  const result = await insertExtraServicesData();
  console.log(`✅ Added up to ${result.providers} providers, ${result.services} services, ${result.listings} listings (idempotent).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Extra seed failed:", err);
  process.exit(1);
});
