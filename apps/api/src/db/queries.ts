import { and, desc, eq, gte, ilike, lt, or, sql } from "drizzle-orm";
import { db } from "./index.js";
import {
  aiMessages,
  aiSessions,
  bookings,
  conversations,
  favorites,
  listings,
  messages,
  notifications,
  offers,
  providerProfiles,
  serviceCategories,
  services,
  users,
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
