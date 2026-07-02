import { and, desc, eq, gte, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "./index.js";
import {
  adminActions,
  aiMessages,
  aiSessions,
  bookings,
  boosts,
  bundleRules,
  conversations,
  favorites,
  listings,
  loyaltyLedger,
  messages,
  notifications,
  orders,
  offers,
  payments,
  providerProfiles,
  pushTokens,
  serviceCategories,
  services,
  users,
  verificationRequests,
} from "./schema.js";
import type { User } from "./schema.js";

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function getUserByPhone(phone: string) {
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return user ?? null;
}

export async function createUser(data: {
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  role?: "customer" | "provider" | "admin";
}) {
  const [user] = await db
    .insert(users)
    .values({
      name: data.name,
      phone: data.phone,
      email: data.email,
      location: data.location ?? "Kigali, Rwanda",
      role: data.role ?? "customer",
    })
    .returning();
  return user;
}

export async function ensureProviderProfile(userId: number, name: string) {
  const [existing] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  if (existing) return existing;
  const [profile] = await db
    .insert(providerProfiles)
    .values({
      userId,
      businessName: `${name.split(" ")[0]}'s Studio`,
      address: "Kigali, Rwanda",
    })
    .returning();
  return profile;
}

export async function getProviderByUserId(userId: number) {
  const [profile] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function getProviderDashboard(userId: number) {
  const profile = await getProviderByUserId(userId);
  if (!profile) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayBookings] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      and(
        eq(bookings.providerId, profile.id),
        gte(bookings.scheduledAt, today),
        lt(bookings.scheduledAt, tomorrow)
      )
    );

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const [weekRevenue] = await db
    .select({ total: sql<string>`coalesce(sum(${bookings.totalAmount}), 0)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.providerId, profile.id),
        eq(bookings.status, "completed"),
        gte(bookings.scheduledAt, weekAgo)
      )
    );

  const sellerListings = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listings)
    .where(and(eq(listings.sellerId, userId), eq(listings.status, "active")));

  const receivedOffers = await getOffersForSeller(userId);

  return {
    profile,
    todayAppointments: todayBookings?.count ?? 0,
    weekRevenue: weekRevenue?.total ?? "0",
    activeListings: sellerListings[0]?.count ?? 0,
    pendingOffers: receivedOffers.filter((o) => o.status === "pending").length,
  };
}

export async function getProviderBookings(providerId: number) {
  return db
    .select({ booking: bookings, service: services })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.providerId, providerId))
    .orderBy(bookings.scheduledAt);
}

export async function getAllProviders() {
  return db
    .select({ profile: providerProfiles, user: users })
    .from(providerProfiles)
    .innerJoin(users, eq(providerProfiles.userId, users.id));
}

export async function updateUser(id: number, data: Partial<User>) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function getListings(opts: {
  search?: string;
  categoryId?: number;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: number;
  limit?: number;
  offset?: number;
}) {
  const conditions = [eq(listings.status, "active")];

  if (opts.search) {
    conditions.push(
      or(
        ilike(listings.title, `%${opts.search}%`),
        ilike(listings.description, `%${opts.search}%`)
      )!
    );
  }
  if (opts.sellerId) conditions.push(eq(listings.sellerId, opts.sellerId));
  if (opts.condition) {
    conditions.push(eq(listings.condition, opts.condition as "new" | "like_new" | "good" | "fair"));
  }

  await expireOldBoosts();

  const rows = await db
    .select({
      listing: listings,
      seller: users,
    })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(and(...conditions))
    .orderBy(desc(listings.isBumped), desc(listings.createdAt))
    .limit(opts.limit ?? 20)
    .offset(opts.offset ?? 0);

  return rows.map(({ listing, seller }) => ({
    ...listing,
    seller: {
      id: seller.id,
      name: seller.name,
      avatarUrl: seller.avatarUrl,
      isVerified: seller.isVerified,
      location: seller.location,
    },
  }));
}

export async function expireOldBoosts() {
  await db
    .update(listings)
    .set({ isBumped: false })
    .where(and(eq(listings.isBumped, true), lt(listings.bumpedUntil, new Date())));
}

export async function getListingById(id: number) {
  const [row] = await db
    .select({ listing: listings, seller: users })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(eq(listings.id, id))
    .limit(1);

  if (!row) return null;
  return {
    ...row.listing,
    seller: {
      id: row.seller.id,
      name: row.seller.name,
      avatarUrl: row.seller.avatarUrl,
      isVerified: row.seller.isVerified,
      location: row.seller.location,
      bio: row.seller.bio,
    },
  };
}

export async function createListing(data: {
  sellerId: number;
  title: string;
  description?: string;
  price: string;
  originalPrice?: string | null;
  condition: "new" | "like_new" | "good" | "fair";
  brand?: string;
  size?: string;
  images?: string[];
  location?: string;
  isNegotiable?: boolean;
  tags?: string[];
}) {
  const [listing] = await db.insert(listings).values(data).returning();
  return listing;
}

export async function toggleFavorite(userId: number, listingId: number) {
  const [existing] = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
    .limit(1);

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return false;
  }
  await db.insert(favorites).values({ userId, listingId });
  return true;
}

export async function getFavoriteIds(userId: number) {
  const rows = await db.select().from(favorites).where(eq(favorites.userId, userId));
  return rows.map((r) => r.listingId);
}

export async function getServicesByProvider(userId: number) {
  const profile = await getProviderByUserId(userId);
  if (!profile) return [];
  return db
    .select({
      service: services,
      category: serviceCategories,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(eq(services.providerId, profile.id), eq(services.isActive, true)))
    .orderBy(services.name);
}

export async function getServices() {
  return db
    .select({
      service: services,
      provider: providerProfiles,
      category: serviceCategories,
    })
    .from(services)
    .innerJoin(providerProfiles, eq(services.providerId, providerProfiles.id))
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(eq(services.isActive, true));
}

export async function getServiceById(id: number) {
  const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return row ?? null;
}

export async function getBookingsByCustomer(customerId: number) {
  const rows = await db
    .select({
      booking: bookings,
      service: services,
      provider: providerProfiles,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(providerProfiles, eq(bookings.providerId, providerProfiles.id))
    .where(eq(bookings.customerId, customerId))
    .orderBy(desc(bookings.scheduledAt));

  return rows.map(({ booking, service, provider }) => ({
    ...booking,
    serviceName: service.name,
    providerName: provider.businessName,
  }));
}

export async function createBooking(data: {
  customerId: number;
  providerId: number;
  serviceId: number;
  scheduledAt: Date;
  durationMinutes: number;
  totalAmount: string;
  notes?: string;
}) {
  const [booking] = await db.insert(bookings).values(data).returning();
  return booking;
}

export async function updateBooking(
  id: number,
  data: Partial<{ status: typeof bookings.$inferSelect.status; scheduledAt: Date; cancellationReason: string }>,
  providerId?: number
) {
  if (providerId !== undefined) {
    const [row] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.providerId, providerId)))
      .limit(1);
    if (!row) throw new Error("Booking not found");
  }
  await db.update(bookings).set(data).where(eq(bookings.id, id));
  if (data.status === "completed") {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (booking) {
      await awardLoyaltyPoints(booking.customerId, Math.max(25, Math.floor(Number(booking.totalAmount) / 1000)), "booking_completed", "booking", booking.id);
    }
  }
}

export async function getProviderBookingsWithCustomer(providerId: number) {
  return db
    .select({ booking: bookings, service: services, customer: users })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(users, eq(bookings.customerId, users.id))
    .where(eq(bookings.providerId, providerId))
    .orderBy(bookings.scheduledAt);
}

export async function getConversationsByUser(userId: number) {
  const rows = await db
    .select()
    .from(conversations)
    .where(or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)))
    .orderBy(desc(conversations.lastMessageAt));

  const result = [];
  for (const conv of rows) {
    const otherId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
    const otherUser = await getUserById(otherId);
    const [lastMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conv.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    const unreadCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conv.id),
          eq(messages.isRead, false),
          sql`${messages.senderId} != ${userId}`
        )
      );

    result.push({
      ...conv,
      otherUser,
      lastMessage,
      unreadCount: unreadCount[0]?.count ?? 0,
    });
  }
  return result;
}

export async function getMessagesByConversation(conversationId: number, limit = 50) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(limit);
}

export async function sendMessage(data: {
  conversationId: number;
  senderId: number;
  body?: string;
  imageUrl?: string;
  type?: "text" | "image" | "offer_card" | "booking_card" | "ai";
}) {
  const [msg] = await db.insert(messages).values(data).returning();
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, data.conversationId));
  return msg;
}

export async function markConversationRead(conversationId: number, readerId: number) {
  await db
    .update(messages)
    .set({ isRead: true })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false),
        sql`${messages.senderId} != ${readerId}`
      )
    );
  const [remaining] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false),
        sql`${messages.senderId} != ${readerId}`
      )
    );
  return remaining?.count ?? 0;
}

export async function getOrCreateConversation(
  userId1: number,
  userId2: number,
  type: "booking" | "listing" | "general" = "general",
  referenceId?: number
) {
  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      or(
        and(eq(conversations.participant1Id, userId1), eq(conversations.participant2Id, userId2)),
        and(eq(conversations.participant1Id, userId2), eq(conversations.participant2Id, userId1))
      )
    )
    .limit(1);

  if (existing) return existing;

  const [convo] = await db
    .insert(conversations)
    .values({
      participant1Id: userId1,
      participant2Id: userId2,
      type,
      referenceId,
      lastMessageAt: new Date(),
    })
    .returning();
  return convo;
}

export async function getNotifications(userId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markAllNotificationsRead(userId: number) {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  body?: string;
  actionUrl?: string;
}) {
  await db.insert(notifications).values(data);
}

export async function createPushToken(data: {
  userId: number;
  platform: string;
  token: string;
}) {
  const [existing] = await db
    .select()
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, data.userId), eq(pushTokens.token, data.token)))
    .limit(1);
  if (existing) {
    const [updated] = await db
      .update(pushTokens)
      .set({ platform: data.platform, enabled: true, updatedAt: new Date() })
      .where(eq(pushTokens.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(pushTokens).values(data).returning();
  return created;
}

export async function createOffer(data: {
  listingId: number;
  buyerId: number;
  amount: string;
  message?: string;
}) {
  const [offer] = await db.insert(offers).values(data).returning();
  return offer;
}

export async function getOffersForSeller(sellerId: number) {
  const rows = await db
    .select({ offer: offers, listing: listings, buyer: users })
    .from(offers)
    .innerJoin(listings, eq(offers.listingId, listings.id))
    .innerJoin(users, eq(offers.buyerId, users.id))
    .where(eq(listings.sellerId, sellerId))
    .orderBy(desc(offers.createdAt));
  return rows.map(({ offer, listing, buyer }) => ({ ...offer, listing, buyer }));
}

export async function respondToOffer(
  offerId: number,
  sellerId: number,
  action: "accept" | "decline" | "counter",
  counterAmount?: string
) {
  const rows = await db
    .select({ offer: offers, listing: listings })
    .from(offers)
    .innerJoin(listings, eq(offers.listingId, listings.id))
    .where(and(eq(offers.id, offerId), eq(listings.sellerId, sellerId)))
    .limit(1);

  const row = rows[0];
  if (!row) throw new Error("Offer not found");

  if (action === "accept") {
    await db.update(offers).set({ status: "accepted" }).where(eq(offers.id, offerId));
    await db.update(listings).set({ status: "reserved" }).where(eq(listings.id, row.listing.id));
    await createNotification({
      userId: row.offer.buyerId,
      type: "offer_accepted",
      title: "Offer accepted!",
      body: `Your offer on "${row.listing.title}" was accepted.`,
    });
    return { status: "accepted" as const };
  }

  if (action === "decline") {
    await db.update(offers).set({ status: "declined" }).where(eq(offers.id, offerId));
    await createNotification({
      userId: row.offer.buyerId,
      type: "offer_declined",
      title: "Offer declined",
      body: `Your offer on "${row.listing.title}" was declined.`,
    });
    return { status: "declined" as const };
  }

  if (!counterAmount) throw new Error("Counter amount required");
  await db
    .update(offers)
    .set({ status: "countered", counterAmount })
    .where(eq(offers.id, offerId));
  await createNotification({
    userId: row.offer.buyerId,
    type: "offer_countered",
    title: "Counter offer received",
    body: `Seller countered with RWF ${Number(counterAmount).toLocaleString()} on "${row.listing.title}".`,
  });
  return { status: "countered" as const, counterAmount };
}

export async function updateProviderProfile(
  userId: number,
  data: {
    businessName?: string;
    description?: string;
    address?: string;
    name?: string;
    bio?: string;
    location?: string;
  }
) {
  const profile = await getProviderByUserId(userId);
  if (!profile) throw new Error("Merchant profile not found");

  if (data.name || data.bio || data.location) {
    await updateUser(userId, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
    });
  }

  const profileUpdate: Record<string, string> = {};
  if (data.businessName !== undefined) profileUpdate.businessName = data.businessName;
  if (data.description !== undefined) profileUpdate.description = data.description;
  if (data.address !== undefined) profileUpdate.address = data.address;

  const [updated] = await db
    .update(providerProfiles)
    .set(profileUpdate)
    .where(eq(providerProfiles.id, profile.id))
    .returning();

  return updated;
}

export async function getAiSessions(userId: number) {
  return db
    .select()
    .from(aiSessions)
    .where(eq(aiSessions.userId, userId))
    .orderBy(desc(aiSessions.updatedAt));
}

export async function createAiSession(userId: number, title?: string) {
  const [session] = await db
    .insert(aiSessions)
    .values({ userId, title: title ?? "Beauty Concierge" })
    .returning();
  return session;
}

export async function getAiMessages(sessionId: number) {
  return db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.sessionId, sessionId))
    .orderBy(aiMessages.createdAt);
}

export async function addAiMessage(sessionId: number, role: "user" | "assistant" | "system", content: string) {
  const [msg] = await db.insert(aiMessages).values({ sessionId, role, content }).returning();
  await db.update(aiSessions).set({ updatedAt: new Date() }).where(eq(aiSessions.id, sessionId));
  return msg;
}

export async function getWalletBalance(userId: number) {
  const user = await getUserById(userId);
  return { balance: user?.walletBalance ?? "0.00", loyaltyPoints: user?.loyaltyPoints ?? 0 };
}

export async function awardLoyaltyPoints(
  userId: number,
  points: number,
  reason: string,
  referenceType?: string,
  referenceId?: number
) {
  if (points === 0) return null;
  const user = await getUserById(userId);
  if (!user) return null;
  const next = (user.loyaltyPoints ?? 0) + points;
  await db.update(users).set({ loyaltyPoints: next, updatedAt: new Date() }).where(eq(users.id, userId));
  const [entry] = await db
    .insert(loyaltyLedger)
    .values({ userId, points, reason, referenceType, referenceId })
    .returning();
  return entry;
}

export async function getUserPayments(userId: number) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(30);
}

export async function getLoyaltyLedger(userId: number) {
  return db
    .select()
    .from(loyaltyLedger)
    .where(eq(loyaltyLedger.userId, userId))
    .orderBy(desc(loyaltyLedger.createdAt))
    .limit(50);
}

export async function createVerificationRequest(data: {
  userId: number;
  documentType: string;
  documentUrl: string;
}) {
  const [request] = await db
    .insert(verificationRequests)
    .values(data)
    .returning();
  await createNotification({
    userId: data.userId,
    type: "verification_submitted",
    title: "Verification submitted",
    body: "Your ID verification is waiting for admin review.",
  });
  return request;
}

export async function getMyVerificationRequests(userId: number) {
  return db
    .select()
    .from(verificationRequests)
    .where(eq(verificationRequests.userId, userId))
    .orderBy(desc(verificationRequests.createdAt));
}

export async function getPaymentById(id: number) {
  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return payment ?? null;
}

export async function createPaymentIntent(data: {
  userId: number;
  provider: "mtn_momo" | "airtel_money" | "stripe" | "demo";
  purpose: "booking" | "order" | "boost";
  referenceId?: number;
  amount: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}) {
  const externalReference = `hafi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const status = data.provider === "demo" ? "succeeded" : "processing";
  const [payment] = await db
    .insert(payments)
    .values({
      ...data,
      status,
      externalReference,
      metadata: data.metadata,
    })
    .returning();
  return payment;
}

export async function updatePaymentStatus(
  paymentId: number,
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded"
) {
  const [payment] = await db
    .update(payments)
    .set({ status, updatedAt: new Date() })
    .where(eq(payments.id, paymentId))
    .returning();
  if (!payment) return null;
  if (status === "succeeded") {
    if (payment.purpose === "order" && payment.referenceId) {
      const meta = payment.metadata as { bundle?: boolean; orderIds?: number[] } | null;
      if (meta?.bundle && Array.isArray(meta.orderIds) && meta.orderIds.length > 0) {
        await markBundlePaid(meta.orderIds, payment.id);
      } else {
        await markOrderPaid(payment.referenceId, payment.id);
      }
    }
    if (payment.purpose === "booking" && payment.referenceId) {
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, payment.referenceId)).limit(1);
      if (booking) {
        await createNotification({
          userId: booking.customerId,
          type: "payment_succeeded",
          title: "Payment received",
          body: `Your booking payment of RWF ${Number(payment.amount).toLocaleString()} succeeded.`,
          actionUrl: "/client/bookings",
        });
      }
    }
  }
  return payment;
}

export async function buyListingNow(data: {
  listingId: number;
  buyerId: number;
  provider: "mtn_momo" | "airtel_money" | "stripe" | "demo";
  phone?: string;
}) {
  const listing = await getListingById(data.listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.seller.id === data.buyerId) throw new Error("Cannot buy your own listing");
  if (listing.status !== "active") throw new Error("Listing is not available");

  const subtotal = Number(listing.price);
  const protectionFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + protectionFee;

  const [order] = await db
    .insert(orders)
    .values({
      listingId: data.listingId,
      buyerId: data.buyerId,
      sellerId: listing.seller.id,
      subtotal: subtotal.toFixed(2),
      protectionFee: protectionFee.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      pickupLocation: listing.location ?? listing.seller.location ?? "Kigali",
    })
    .returning();

  const payment = await createPaymentIntent({
    userId: data.buyerId,
    provider: data.provider,
    purpose: "order",
    referenceId: order.id,
    amount: totalAmount.toFixed(2),
    phone: data.phone,
    metadata: { listingId: data.listingId },
  });

  await db.update(orders).set({ paymentId: payment.id }).where(eq(orders.id, order.id));
  if (payment.status === "succeeded") await markOrderPaid(order.id, payment.id);

  await createNotification({
    userId: listing.seller.id,
    type: "order_created",
    title: "New order",
    body: `${listing.title} has a new buyer.`,
    actionUrl: "/merchant/listings",
  });

  return { order: { ...order, paymentId: payment.id }, payment };
}

export async function markOrderPaid(orderId: number, paymentId: number) {
  const [order] = await db
    .update(orders)
    .set({ status: "paid", paymentId, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  if (!order) return null;
  await db.update(listings).set({ status: "reserved" }).where(eq(listings.id, order.listingId));
  await awardLoyaltyPoints(order.buyerId, Math.max(20, Math.floor(Number(order.totalAmount) / 1000)), "order_paid", "order", order.id);
  return order;
}

export async function getMyOrders(userId: number) {
  return db
    .select({ order: orders, listing: listings, payment: payments })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .leftJoin(payments, eq(orders.paymentId, payments.id))
    .where(or(eq(orders.buyerId, userId), eq(orders.sellerId, userId)))
    .orderBy(desc(orders.createdAt));
}

export async function boostListing(data: {
  listingId: number;
  sellerId: number;
  provider: "mtn_momo" | "airtel_money" | "stripe" | "demo";
  phone?: string;
  days?: number;
}) {
  const [listing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, data.listingId), eq(listings.sellerId, data.sellerId)))
    .limit(1);
  if (!listing) throw new Error("Listing not found");

  const days = data.days ?? 7;
  const amount = (days * 1000).toFixed(2);
  const payment = await createPaymentIntent({
    userId: data.sellerId,
    provider: data.provider,
    purpose: "boost",
    referenceId: data.listingId,
    amount,
    phone: data.phone,
    metadata: { days },
  });
  const expiresAt = new Date(Date.now() + days * 86400000);
  const [boost] = await db
    .insert(boosts)
    .values({ listingId: data.listingId, sellerId: data.sellerId, paymentId: payment.id, expiresAt })
    .returning();
  await db
    .update(listings)
    .set({ isBumped: true, bumpedUntil: expiresAt, updatedAt: new Date() })
    .where(eq(listings.id, data.listingId));
  return { boost, payment };
}

export async function upsertBundleRule(data: {
  sellerId: number;
  minItems: number;
  discountPercent: number;
}) {
  const [existing] = await db
    .select()
    .from(bundleRules)
    .where(eq(bundleRules.sellerId, data.sellerId))
    .limit(1);
  if (existing) {
    const [updated] = await db
      .update(bundleRules)
      .set({ minItems: data.minItems, discountPercent: data.discountPercent, isActive: true })
      .where(eq(bundleRules.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db.insert(bundleRules).values(data).returning();
  return created;
}

export async function quoteBundle(userId: number, listingIds: number[]) {
  const rows = await db
    .select({ listing: listings, seller: users })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(listingIds.length > 0 ? inArray(listings.id, listingIds) : sql`false`);
  if (rows.length === 0) return { items: [], subtotal: 0, discount: 0, total: 0, discountPercent: 0 };
  const sellerId = rows[0].listing.sellerId;
  if (!rows.every((r) => r.listing.sellerId === sellerId)) {
    throw new Error("Bundles must come from one seller");
  }
  if (sellerId === userId) throw new Error("Cannot bundle your own listings");
  const [rule] = await db
    .select()
    .from(bundleRules)
    .where(and(eq(bundleRules.sellerId, sellerId), eq(bundleRules.isActive, true)))
    .limit(1);
  const subtotal = rows.reduce((sum, r) => sum + Number(r.listing.price), 0);
  const discountPercent = rule && rows.length >= rule.minItems ? rule.discountPercent : 0;
  const discount = Math.round((subtotal * discountPercent) / 100);
  return {
    items: rows.map((r) => r.listing),
    subtotal,
    discount,
    total: subtotal - discount,
    discountPercent,
  };
}

export async function buyBundleNow(data: {
  listingIds: number[];
  buyerId: number;
  provider: "mtn_momo" | "airtel_money" | "stripe" | "demo";
  phone?: string;
}) {
  const ids = [...new Set(data.listingIds)];
  if (ids.length < 2) throw new Error("A bundle needs at least 2 items");

  const rows = await db
    .select({ listing: listings, seller: users })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(inArray(listings.id, ids));
  if (rows.length !== ids.length) throw new Error("Some listings were not found");

  const sellerId = rows[0].listing.sellerId;
  if (!rows.every((r) => r.listing.sellerId === sellerId)) {
    throw new Error("Bundles must come from one seller");
  }
  if (sellerId === data.buyerId) throw new Error("Cannot buy your own listings");
  const unavailable = rows.find((r) => r.listing.status !== "active");
  if (unavailable) throw new Error(`"${unavailable.listing.title}" is no longer available`);

  const [rule] = await db
    .select()
    .from(bundleRules)
    .where(and(eq(bundleRules.sellerId, sellerId), eq(bundleRules.isActive, true)))
    .limit(1);
  const discountPercent = rule && rows.length >= rule.minItems ? rule.discountPercent : 0;

  let subtotal = 0;
  let discount = 0;
  let protectionFee = 0;
  let totalAmount = 0;
  const createdOrders = [];
  for (const { listing, seller } of rows) {
    const price = Number(listing.price);
    const itemDiscount = Math.round((price * discountPercent) / 100);
    const itemFee = Math.round((price - itemDiscount) * 0.05);
    const itemTotal = price - itemDiscount + itemFee;
    subtotal += price;
    discount += itemDiscount;
    protectionFee += itemFee;
    totalAmount += itemTotal;

    const [order] = await db
      .insert(orders)
      .values({
        listingId: listing.id,
        buyerId: data.buyerId,
        sellerId,
        subtotal: price.toFixed(2),
        protectionFee: itemFee.toFixed(2),
        discountAmount: itemDiscount.toFixed(2),
        totalAmount: itemTotal.toFixed(2),
        pickupLocation: listing.location ?? seller.location ?? "Kigali",
      })
      .returning();
    createdOrders.push(order);
  }

  const orderIds = createdOrders.map((o) => o.id);
  const payment = await createPaymentIntent({
    userId: data.buyerId,
    provider: data.provider,
    purpose: "order",
    referenceId: orderIds[0],
    amount: totalAmount.toFixed(2),
    phone: data.phone,
    metadata: { bundle: true, orderIds, listingIds: ids, discountPercent },
  });

  await db.update(orders).set({ paymentId: payment.id }).where(inArray(orders.id, orderIds));
  let finalOrders: typeof createdOrders = createdOrders.map((o) => ({ ...o, paymentId: payment.id }));
  if (payment.status === "succeeded") {
    finalOrders = await markBundlePaid(orderIds, payment.id);
  }

  await createNotification({
    userId: sellerId,
    type: "order_created",
    title: "New bundle order",
    body: `${rows.length} of your items sold together${
      discountPercent > 0 ? ` with a ${discountPercent}% bundle discount` : ""
    }.`,
    actionUrl: "/merchant/listings",
  });

  return {
    orders: finalOrders,
    payment,
    quote: { subtotal, discount, discountPercent, protectionFee, total: totalAmount },
  };
}

export async function markBundlePaid(orderIds: number[], paymentId: number) {
  if (orderIds.length === 0) return [];
  const paid = await db
    .update(orders)
    .set({ status: "paid", paymentId, updatedAt: new Date() })
    .where(inArray(orders.id, orderIds))
    .returning();
  if (paid.length === 0) return [];
  await db
    .update(listings)
    .set({ status: "reserved" })
    .where(inArray(listings.id, paid.map((o) => o.listingId)));
  const total = paid.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  await awardLoyaltyPoints(
    paid[0].buyerId,
    Math.max(20, Math.floor(total / 1000)),
    "bundle_order_paid",
    "payment",
    paymentId
  );
  return paid;
}

export async function redeemLoyaltyPoints(userId: number, points: number) {
  if (!Number.isInteger(points) || points < 50) {
    throw new Error("Minimum redemption is 50 points");
  }
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  const currentPoints = user.loyaltyPoints ?? 0;
  if (currentPoints < points) {
    throw new Error(`Insufficient points: you have ${currentPoints}, tried to redeem ${points}`);
  }
  const creditedAmount = points * 10;
  const nextPoints = currentPoints - points;
  const nextBalance = (Number(user.walletBalance ?? "0") + creditedAmount).toFixed(2);
  await db
    .update(users)
    .set({ loyaltyPoints: nextPoints, walletBalance: nextBalance, updatedAt: new Date() })
    .where(eq(users.id, userId));
  await db.insert(loyaltyLedger).values({ userId, points: -points, reason: "redeemed" });
  return {
    loyaltyPoints: nextPoints,
    walletBalance: nextBalance,
    redeemedPoints: points,
    creditedAmount: creditedAmount.toFixed(2),
  };
}

export async function getAdminSummary() {
  const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const [listingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(listings);
  const [bookingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(bookings);
  const [paymentTotal] = await db
    .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.status, "succeeded"));
  const pendingVerification = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(verificationRequests)
    .where(eq(verificationRequests.status, "pending"));
  return {
    users: userCount?.count ?? 0,
    listings: listingCount?.count ?? 0,
    bookings: bookingCount?.count ?? 0,
    revenue: paymentTotal?.total ?? "0",
    pendingVerification: pendingVerification[0]?.count ?? 0,
  };
}

export async function getAdminUsers() {
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(100);
}

export async function getAdminVerificationQueue() {
  return db
    .select({ request: verificationRequests, user: users })
    .from(verificationRequests)
    .innerJoin(users, eq(verificationRequests.userId, users.id))
    .orderBy(desc(verificationRequests.createdAt));
}

export async function reviewVerificationRequest(data: {
  adminId: number;
  requestId: number;
  status: "approved" | "rejected";
  rejectionReason?: string;
}) {
  const [request] = await db
    .update(verificationRequests)
    .set({
      status: data.status,
      rejectionReason: data.rejectionReason,
      reviewedById: data.adminId,
      reviewedAt: new Date(),
    })
    .where(eq(verificationRequests.id, data.requestId))
    .returning();
  if (!request) throw new Error("Verification request not found");
  if (data.status === "approved") {
    await db.update(users).set({ isVerified: true, updatedAt: new Date() }).where(eq(users.id, request.userId));
  }
  await db.insert(adminActions).values({
    adminId: data.adminId,
    action: `verification_${data.status}`,
    targetType: "verification_request",
    targetId: request.id,
    metadata: { userId: request.userId, rejectionReason: data.rejectionReason },
  });
  await createNotification({
    userId: request.userId,
    type: `verification_${data.status}`,
    title: data.status === "approved" ? "Verification approved" : "Verification rejected",
    body: data.status === "approved" ? "Your Hafi verified badge is now active." : data.rejectionReason ?? "Please submit a clearer document.",
  });
  return request;
}

export async function getServiceCategories() {
  return db.select().from(serviceCategories).orderBy(serviceCategories.name);
}

export async function getServicesByProviderId(providerId: number) {
  return db
    .select({
      service: services,
      category: serviceCategories,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(and(eq(services.providerId, providerId), eq(services.isActive, true)))
    .orderBy(services.name);
}

export async function getNearbyProviders(opts: { latitude?: number; longitude?: number }) {
  const rows = await getAllProviders();
  return rows
    .map((row) => {
      const lat = Number(row.profile.latitude ?? -1.9441);
      const lng = Number(row.profile.longitude ?? 30.0619);
      const distanceKm =
        opts.latitude !== undefined && opts.longitude !== undefined
          ? haversineKm(opts.latitude, opts.longitude, lat, lng)
          : null;
      return { ...row, distanceKm };
    })
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
