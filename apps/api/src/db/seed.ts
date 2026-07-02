import "dotenv/config";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), "../../.env") });

import { db } from "./index.js";
import {
  boosts,
  bundleRules,
  listings,
  loyaltyLedger,
  orders,
  payments,
  providerProfiles,
  pushTokens,
  serviceCategories,
  services,
  users,
  verificationRequests,
} from "./schema.js";
import { eq } from "drizzle-orm";
import { insertMerchantDemoData } from "./seed-demo-data.js";
import { insertClientDemoData } from "./seed-client-data.js";
import { insertExtraServicesData } from "./seed-extra-services.js";

const IMAGES = [
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80",
  "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80",
  "https://images.unsplash.com/photo-1631730486784-74757073e8f5?w=400&q=80",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80",
];

async function seed() {
  console.log("🌱 Seeding Hafi database...");

  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded, skipping.");
    process.exit(0);
  }

  const [amara, zara, lux, bella, admin] = await db
    .insert(users)
    .values([
      {
        name: "Amara Beauty",
        phone: "+250780000001",
        location: "Kigali, Rwanda",
        isVerified: true,
        role: "provider",
        walletBalance: "45000.00",
        loyaltyPoints: 1200,
        bio: "Professional MUA & beauty enthusiast 💜",
        avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&q=80",
      },
      {
        name: "Zara Glow",
        phone: "+250780000002",
        location: "Butare, Rwanda",
        walletBalance: "12000.00",
        loyaltyPoints: 450,
        bio: "Skincare lover ✨",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
      },
      {
        name: "Lux Hair Studio",
        phone: "+250780000003",
        location: "Kigali, Rwanda",
        isVerified: true,
        role: "provider",
        walletBalance: "89000.00",
        loyaltyPoints: 3400,
        bio: "Professional hair salon",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      },
      {
        name: "Bella Cosmetics",
        phone: "+250780000004",
        location: "Musanze, Rwanda",
        isVerified: true,
        walletBalance: "28000.00",
        loyaltyPoints: 890,
        bio: "Beauty blogger & collector 🌸",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
      },
      {
        name: "Hafi Admin",
        phone: "+250780000000",
        location: "Kigali, Rwanda",
        role: "admin",
        isVerified: true,
        walletBalance: "0.00",
        loyaltyPoints: 0,
        bio: "Hafi operations account",
      },
    ])
    .returning();

  const categories = await db
    .insert(serviceCategories)
    .values([
      { name: "Hair", icon: "💇‍♀️" },
      { name: "Nails", icon: "💅" },
      { name: "Makeup", icon: "💄" },
      { name: "Skincare", icon: "✨" },
      { name: "Lashes", icon: "👁️" },
      { name: "Massage", icon: "💆" },
    ])
    .returning();

  const [amaraProvider, luxProvider] = await db
    .insert(providerProfiles)
    .values([
      {
        userId: amara.id,
        businessName: "Amara Beauty Studio",
        description: "Premium makeup & glam services",
        address: "KN 4 Ave, Kigali",
        latitude: "-1.9441",
        longitude: "30.0619",
        rating: "4.9",
        reviewCount: 127,
      },
      {
        userId: lux.id,
        businessName: "Lux Hair Studio",
        description: "Braids, silk press, color & more",
        address: "Kacyiru, Kigali",
        latitude: "-1.9365",
        longitude: "30.0789",
        rating: "5.0",
        reviewCount: 212,
      },
    ])
    .returning();

  await db.insert(services).values([
    {
      providerId: amaraProvider.id,
      categoryId: categories[2].id,
      name: "Full Glam Makeup",
      description: "Event-ready full face glam",
      duration: 90,
      price: "25000.00",
    },
    {
      providerId: amaraProvider.id,
      categoryId: categories[3].id,
      name: "Skincare Consultation",
      description: "Personalized routine analysis",
      duration: 45,
      price: "15000.00",
    },
    {
      providerId: luxProvider.id,
      categoryId: categories[0].id,
      name: "Knotless Braids",
      description: "Medium length knotless braids",
      duration: 240,
      price: "45000.00",
    },
    {
      providerId: luxProvider.id,
      categoryId: categories[0].id,
      name: "Silk Press & Trim",
      description: "Silk press with trim",
      duration: 120,
      price: "18000.00",
    },
    {
      providerId: luxProvider.id,
      categoryId: categories[1].id,
      name: "Gel Manicure",
      description: "Long-lasting gel manicure",
      duration: 60,
      price: "12000.00",
    },
  ]);

  const insertedListings = await db.insert(listings).values([
    {
      sellerId: amara.id,
      title: "Charlotte Tilbury Pillow Talk Lipstick",
      description: "Iconic nude-pink lipstick. Used twice, 95% left. Original box included.",
      price: "12000.00",
      originalPrice: "18000.00",
      condition: "like_new",
      brand: "Charlotte Tilbury",
      images: [IMAGES[0], IMAGES[5]],
      location: "Kigali",
      isNegotiable: true,
      isBumped: true,
      tags: ["lipstick", "nude", "luxury"],
      likes: 47,
      views: 234,
    },
    {
      sellerId: lux.id,
      title: "Dyson Airwrap Complete Styler",
      description: "Complete set with all attachments. Barely used, original box.",
      price: "85000.00",
      condition: "good",
      brand: "Dyson",
      images: [IMAGES[2], IMAGES[4]],
      location: "Kigali",
      isNegotiable: false,
      tags: ["dyson", "hair tools"],
      likes: 203,
      views: 891,
    },
    {
      sellerId: bella.id,
      title: "La Mer Crème de la Mer 30ml",
      description: "Brand new, sealed. Authentic with receipt.",
      price: "32000.00",
      originalPrice: "55000.00",
      condition: "new",
      brand: "La Mer",
      images: [IMAGES[1], IMAGES[3]],
      location: "Musanze",
      isNegotiable: true,
      tags: ["skincare", "luxury"],
      likes: 89,
      views: 567,
    },
    {
      sellerId: zara.id,
      title: "The Ordinary Skincare Bundle",
      description: "5 serums: Niacinamide, HA, Vitamin C, AHA/BHA, Retinol. All sealed.",
      price: "18000.00",
      originalPrice: "28000.00",
      condition: "new",
      brand: "The Ordinary",
      images: [IMAGES[3], IMAGES[1]],
      location: "Butare",
      isNegotiable: true,
      tags: ["skincare", "bundle"],
      likes: 71,
      views: 389,
    },
    {
      sellerId: lux.id,
      title: "Professional Nail Lamp UV/LED 48W",
      description: "Used 3 months in home salon. Perfect condition.",
      price: "15000.00",
      condition: "like_new",
      brand: "Melodysusie",
      images: [IMAGES[4]],
      location: "Kigali",
      isBumped: true,
      tags: ["nails", "professional"],
      likes: 67,
      views: 445,
    },
    {
      sellerId: amara.id,
      title: "Chanel No. 5 Eau de Parfum 50ml",
      description: "Sealed, never opened. Duty-free purchase.",
      price: "45000.00",
      condition: "new",
      brand: "Chanel",
      images: [IMAGES[5]],
      location: "Kigali",
      tags: ["chanel", "perfume"],
      likes: 134,
      views: 678,
    },
  ]).returning();

  const [demoOrderPayment] = await db
    .insert(payments)
    .values({
      userId: zara.id,
      provider: "demo",
      purpose: "order",
      amount: "12600.00",
      currency: "RWF",
      status: "succeeded",
      externalReference: "demo_paid_order_001",
      phone: zara.phone,
    })
    .returning();

  await db.insert(orders).values({
    listingId: insertedListings[0].id,
    buyerId: zara.id,
    sellerId: amara.id,
    paymentId: demoOrderPayment.id,
    subtotal: "12000.00",
    protectionFee: "600.00",
    discountAmount: "0.00",
    totalAmount: "12600.00",
    status: "paid",
    pickupLocation: "Kimihurura, Kigali",
  });

  const boostExpiresAt = new Date(Date.now() + 7 * 86400000);
  const [boostPayment] = await db
    .insert(payments)
    .values({
      userId: lux.id,
      provider: "demo",
      purpose: "boost",
      referenceId: insertedListings[1].id,
      amount: "7000.00",
      currency: "RWF",
      status: "succeeded",
      externalReference: "demo_boost_001",
      phone: lux.phone,
    })
    .returning();

  await db.insert(boosts).values({
    listingId: insertedListings[1].id,
    sellerId: lux.id,
    paymentId: boostPayment.id,
    expiresAt: boostExpiresAt,
  });
  await db.update(listings).set({ isBumped: true, bumpedUntil: boostExpiresAt }).where(eq(listings.id, insertedListings[1].id));

  await db.insert(bundleRules).values([
    { sellerId: amara.id, minItems: 2, discountPercent: 10 },
    { sellerId: lux.id, minItems: 2, discountPercent: 15 },
  ]);

  await db.insert(verificationRequests).values([
    {
      userId: bella.id,
      documentType: "national_id",
      documentUrl: "https://example.com/demo/bella-national-id.jpg",
      status: "pending",
    },
    {
      userId: amara.id,
      documentType: "business_registration",
      documentUrl: "https://example.com/demo/amara-business-registration.pdf",
      status: "approved",
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  ]);

  await db.insert(loyaltyLedger).values([
    { userId: zara.id, points: 25, reason: "order_paid", referenceType: "order", referenceId: 1 },
    { userId: bella.id, points: 50, reason: "review_submitted", referenceType: "booking", referenceId: 1 },
    { userId: amara.id, points: 100, reason: "verified_merchant", referenceType: "verification", referenceId: 2 },
  ]);

  await db.insert(pushTokens).values([
    { userId: zara.id, platform: "expo", token: "ExponentPushToken[demo-zara]" },
    { userId: amara.id, platform: "web", token: "demo-web-token-amara" },
  ]);

  const insertedServices = await db
    .select()
    .from(services)
    .where(eq(services.providerId, amaraProvider.id));
  const luxServices = await db
    .select()
    .from(services)
    .where(eq(services.providerId, luxProvider.id));

  await insertMerchantDemoData({
    amaraId: amara.id,
    zaraId: zara.id,
    luxId: lux.id,
    bellaId: bella.id,
    amaraProviderId: amaraProvider.id,
    luxProviderId: luxProvider.id,
    amaraServiceIds: insertedServices.map((s) => s.id),
    luxServiceIds: luxServices.map((s) => s.id),
    amaraListingIds: insertedListings.filter((l) => l.sellerId === amara.id).map((l) => l.id),
    luxListingIds: insertedListings.filter((l) => l.sellerId === lux.id).map((l) => l.id),
  });

  await insertClientDemoData({
    zaraId: zara.id,
    bellaId: bella.id,
    listingIds: insertedListings.slice(0, 3).map((l) => l.id),
  });

  await insertExtraServicesData();

  console.log("✅ Seed complete!");
  console.log(`   Users: 5+ | Services: 19+ | Listings: 9+ | Bookings: 6 | Offers: 4`);
  console.log("   Client: Zara +250780000002 | Bella +250780000004");
  console.log("   Merchant: Amara +250780000001 | Lux +250780000003");
  console.log("   Admin: Hafi Admin +250780000000");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
