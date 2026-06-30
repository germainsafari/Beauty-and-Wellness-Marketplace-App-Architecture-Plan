import { aiMessages, aiSessions, favorites, notifications } from "./schema.js";
import { db } from "./index.js";

export async function insertClientDemoData(opts: {
  zaraId: number;
  bellaId: number;
  listingIds: number[];
}) {
  const { zaraId, bellaId, listingIds } = opts;

  await db.insert(favorites).values([
    { userId: zaraId, listingId: listingIds[0] },
    { userId: zaraId, listingId: listingIds[1] },
    { userId: bellaId, listingId: listingIds[2] },
  ]);

  await db.insert(notifications).values([
    {
      userId: zaraId,
      type: "booking",
      title: "Booking confirmed",
      body: "Amara Beauty confirmed your Full Glam Makeup for tomorrow 11:00 AM",
      actionUrl: "/client/bookings",
    },
    {
      userId: zaraId,
      type: "offer",
      title: "Offer sent",
      body: "Your offer of RWF 10,000 on Charlotte Tilbury Lipstick is pending",
      actionUrl: "/client/marketplace",
    },
    {
      userId: zaraId,
      type: "message",
      title: "New message from Amara Beauty",
      body: "Yes it is! I can do RWF 12,000 if you pick up in Kimihurura today.",
      actionUrl: "/client/messages",
    },
    {
      userId: bellaId,
      type: "booking",
      title: "Appointment today",
      body: "Skincare Consultation with Amara Beauty at 2:30 PM today",
      actionUrl: "/client/bookings",
    },
    {
      userId: bellaId,
      type: "booking",
      title: "Braids request pending",
      body: "Lux Hair Studio will confirm your Knotless Braids appointment soon",
      actionUrl: "/client/bookings",
    },
    {
      userId: bellaId,
      type: "offer",
      title: "Offer sent on Chanel No. 5",
      body: "Your offer of RWF 40,000 is awaiting seller response",
      actionUrl: "/client/marketplace",
    },
  ]);

  const [session] = await db
    .insert(aiSessions)
    .values({ userId: zaraId, title: "Skincare routine help" })
    .returning();

  await db.insert(aiMessages).values([
    {
      sessionId: session.id,
      role: "user",
      content: "What's a good morning skincare routine for oily skin in Kigali's climate?",
    },
    {
      sessionId: session.id,
      role: "assistant",
      content:
        "For oily skin in a humid climate like Kigali, I'd recommend:\n\n1. **Gentle gel cleanser** (CeraVe or The Ordinary)\n2. **Niacinamide 10%** serum — great for oil control\n3. **Lightweight SPF 50** — non-negotiable!\n4. **Oil-free moisturizer** in the evening\n\nWould you like product picks from our marketplace?",
    },
    {
      sessionId: session.id,
      role: "user",
      content: "Yes! Show me affordable options under RWF 20,000",
    },
    {
      sessionId: session.id,
      role: "assistant",
      content:
        "Check out **The Ordinary Skincare Bundle** on Hafi marketplace — 5 serums including Niacinamide and HA for RWF 18,000. Bella also has a great La Mer set if you want to splurge! 💜",
    },
  ]);
}
