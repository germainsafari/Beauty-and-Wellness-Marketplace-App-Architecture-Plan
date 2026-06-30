import {
  bookings,
  conversations,
  messages,
  notifications,
  offers,
} from "./schema.js";
import { db } from "./index.js";

export async function insertMerchantDemoData(opts: {
  amaraId: number;
  zaraId: number;
  luxId: number;
  bellaId: number;
  amaraProviderId: number;
  luxProviderId: number;
  amaraServiceIds: number[];
  luxServiceIds: number[];
  amaraListingIds: number[];
  luxListingIds: number[];
}) {
  const {
    amaraId,
    zaraId,
    luxId,
    bellaId,
    amaraProviderId,
    luxProviderId,
    amaraServiceIds,
    luxServiceIds,
    amaraListingIds,
    luxListingIds,
  } = opts;

  const now = new Date();
  const todayAt10 = new Date(now);
  todayAt10.setHours(10, 0, 0, 0);
  const todayAt14 = new Date(now);
  todayAt14.setHours(14, 30, 0, 0);
  const tomorrowAt11 = new Date(now);
  tomorrowAt11.setDate(tomorrowAt11.getDate() + 1);
  tomorrowAt11.setHours(11, 0, 0, 0);
  const threeDaysOut = new Date(now);
  threeDaysOut.setDate(threeDaysOut.getDate() + 3);
  threeDaysOut.setHours(15, 0, 0, 0);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(10, 0, 0, 0);
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  fourDaysAgo.setHours(16, 0, 0, 0);

  await db.insert(bookings).values([
    {
      customerId: zaraId,
      providerId: amaraProviderId,
      serviceId: amaraServiceIds[0],
      scheduledAt: todayAt10,
      durationMinutes: 90,
      totalAmount: "25000.00",
      status: "pending",
      notes: "Bridal trial — please use warm tones",
    },
    {
      customerId: bellaId,
      providerId: amaraProviderId,
      serviceId: amaraServiceIds[1],
      scheduledAt: todayAt14,
      durationMinutes: 45,
      totalAmount: "15000.00",
      status: "confirmed",
    },
    {
      customerId: zaraId,
      providerId: amaraProviderId,
      serviceId: amaraServiceIds[0],
      scheduledAt: tomorrowAt11,
      durationMinutes: 90,
      totalAmount: "25000.00",
      status: "confirmed",
    },
    {
      customerId: bellaId,
      providerId: luxProviderId,
      serviceId: luxServiceIds[0],
      scheduledAt: threeDaysOut,
      durationMinutes: 240,
      totalAmount: "45000.00",
      status: "pending",
      notes: "Medium length, natural color",
    },
    {
      customerId: zaraId,
      providerId: luxProviderId,
      serviceId: luxServiceIds[2],
      scheduledAt: twoDaysAgo,
      durationMinutes: 60,
      totalAmount: "12000.00",
      status: "completed",
    },
    {
      customerId: bellaId,
      providerId: amaraProviderId,
      serviceId: amaraServiceIds[0],
      scheduledAt: fourDaysAgo,
      durationMinutes: 90,
      totalAmount: "25000.00",
      status: "completed",
    },
  ]);

  await db.insert(offers).values([
    {
      listingId: amaraListingIds[0],
      buyerId: zaraId,
      amount: "10000.00",
      message: "Would you take 10,000? I can pick up today in Kigali.",
      status: "pending",
    },
    {
      listingId: amaraListingIds[1],
      buyerId: bellaId,
      amount: "40000.00",
      message: "Interested in the Chanel perfume — is it still available?",
      status: "pending",
    },
    {
      listingId: luxListingIds[0],
      buyerId: zaraId,
      amount: "75000.00",
      message: "Can we meet at Kacyiru for the Dyson?",
      status: "pending",
    },
    {
      listingId: luxListingIds[1],
      buyerId: bellaId,
      amount: "12000.00",
      status: "declined",
    },
  ]);

  await db.insert(notifications).values([
    {
      userId: amaraId,
      type: "booking",
      title: "New booking request",
      body: "Zara Glow requested Full Glam Makeup for today at 10:00 AM",
      actionUrl: "/merchant/calendar",
    },
    {
      userId: amaraId,
      type: "offer",
      title: "New offer on Charlotte Tilbury Lipstick",
      body: "Zara Glow offered RWF 10,000",
      actionUrl: "/merchant/offers",
    },
    {
      userId: amaraId,
      type: "offer",
      title: "New offer on Chanel No. 5",
      body: "Bella Cosmetics offered RWF 40,000",
      actionUrl: "/merchant/offers",
    },
    {
      userId: luxId,
      type: "booking",
      title: "New braids appointment",
      body: "Bella Cosmetics requested Knotless Braids",
      actionUrl: "/merchant/calendar",
    },
    {
      userId: luxId,
      type: "offer",
      title: "Offer on Dyson Airwrap",
      body: "Zara Glow offered RWF 75,000",
      actionUrl: "/merchant/offers",
    },
  ]);

  const [convo] = await db
    .insert(conversations)
    .values({
      participant1Id: zaraId,
      participant2Id: amaraId,
      type: "listing",
      referenceId: amaraListingIds[0],
      lastMessageAt: new Date(),
    })
    .returning();

  await db.insert(messages).values([
    {
      conversationId: convo.id,
      senderId: zaraId,
      body: "Hi Amara! Is the Pillow Talk lipstick still available?",
      type: "text",
    },
    {
      conversationId: convo.id,
      senderId: amaraId,
      body: "Yes it is! I can do RWF 12,000 if you pick up in Kimihurura today.",
      type: "text",
    },
    {
      conversationId: convo.id,
      senderId: zaraId,
      body: "Perfect — I also sent an offer for 10,000. Let me know!",
      type: "text",
    },
  ]);

  const [luxConvo] = await db
    .insert(conversations)
    .values({
      participant1Id: bellaId,
      participant2Id: luxId,
      type: "booking",
      lastMessageAt: new Date(),
    })
    .returning();

  await db.insert(messages).values([
    {
      conversationId: luxConvo.id,
      senderId: bellaId,
      body: "Hi! Can I bring my own hair bundles for the knotless braids?",
      type: "text",
    },
    {
      conversationId: luxConvo.id,
      senderId: luxId,
      body: "Absolutely — just make sure they're 24 inches. See you Wednesday!",
      type: "text",
      isRead: false,
    },
  ]);
}
