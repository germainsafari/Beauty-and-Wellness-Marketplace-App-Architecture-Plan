import "dotenv/config";
import { resolve } from "path";
import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";

config({ path: resolve(process.cwd(), "../../.env") });

import { db } from "./index.js";
import { aiSessions, bookings, favorites, listings, providerProfiles, services, users } from "./schema.js";
import { insertClientDemoData } from "./seed-client-data.js";
import { insertMerchantDemoData } from "./seed-demo-data.js";

const DEMO_PHONES = ["+250780000001", "+250780000002", "+250780000003", "+250780000004"];

async function seedDemo() {
  console.log("🌱 Seeding Hafi demo data (merchant + client)...");

  const demoUsers = await db.select().from(users).where(inArray(users.phone, DEMO_PHONES));
  if (demoUsers.length < 4) {
    console.error("Base users not found. Run `npm run db:seed` first.");
    process.exit(1);
  }

  const byPhone = Object.fromEntries(
    demoUsers.filter((u) => u.phone).map((u) => [u.phone!, u])
  );
  const amara = byPhone["+250780000001"];
  const zara = byPhone["+250780000002"];
  const lux = byPhone["+250780000003"];
  const bella = byPhone["+250780000004"];

  const [amaraProvider] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, amara.id))
    .limit(1);
  const [luxProvider] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, lux.id))
    .limit(1);

  if (!amaraProvider || !luxProvider) {
    console.error("Provider profiles missing. Run `npm run db:seed` first.");
    process.exit(1);
  }

  const amaraServiceRows = await db
    .select()
    .from(services)
    .where(eq(services.providerId, amaraProvider.id));
  const luxServiceRows = await db
    .select()
    .from(services)
    .where(eq(services.providerId, luxProvider.id));

  const allListings = await db.select().from(listings);
  const amaraListings = allListings.filter((l) => l.sellerId === amara.id);
  const luxListings = allListings.filter((l) => l.sellerId === lux.id);

  const existingBookings = await db.select().from(bookings).limit(1);
  if (existingBookings.length === 0) {
    await insertMerchantDemoData({
      amaraId: amara.id,
      zaraId: zara.id,
      luxId: lux.id,
      bellaId: bella.id,
      amaraProviderId: amaraProvider.id,
      luxProviderId: luxProvider.id,
      amaraServiceIds: amaraServiceRows.map((s) => s.id),
      luxServiceIds: luxServiceRows.map((s) => s.id),
      amaraListingIds: amaraListings.map((l) => l.id),
      luxListingIds: luxListings.map((l) => l.id),
    });
    console.log("   ✓ Merchant demo data (bookings, offers, messages)");
  } else {
    console.log("   · Merchant demo data already present");
  }

  const existingClient = await db.select().from(aiSessions).limit(1);
  if (existingClient.length === 0) {
    await insertClientDemoData({
      zaraId: zara.id,
      bellaId: bella.id,
      listingIds: allListings.slice(0, 3).map((l) => l.id),
    });
    console.log("   ✓ Client demo data (favorites, notifications, AI chat)");
  } else {
    console.log("   · Client demo data already present");
  }

  console.log("\n✅ Demo ready! Test credentials:\n");
  console.log("   CLIENT (mobile/web — choose Client mode)");
  console.log("   • Zara Glow        name: Zara Glow        phone: +250780000002");
  console.log("   • Bella Cosmetics  name: Bella Cosmetics  phone: +250780000004");
  console.log("\n   MERCHANT (mobile/web — choose Merchant mode)");
  console.log("   • Amara Beauty     name: Amara Beauty     phone: +250780000001");
  console.log("   • Lux Hair Studio  name: Lux Hair Studio  phone: +250780000003");
  process.exit(0);
}

seedDemo().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
