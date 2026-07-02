import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./index.js";
import {
  adminActions,
  bookings,
  listings,
  orders,
  payments,
  providerProfiles,
  services,
  uploads,
  users,
} from "./schema.js";

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

export async function createUpload(data: {
  userId: number;
  kind: string;
  mimeType: string;
  data: string;
}) {
  const [row] = await db.insert(uploads).values(data).returning({
    id: uploads.id,
    userId: uploads.userId,
    kind: uploads.kind,
    mimeType: uploads.mimeType,
    createdAt: uploads.createdAt,
  });
  return row;
}

export async function getUploadById(id: number) {
  const [row] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  return row ?? null;
}

/** Lightweight lookup (no base64 payload) for ownership checks. */
export async function getUploadMetaById(id: number) {
  const [row] = await db
    .select({
      id: uploads.id,
      userId: uploads.userId,
      kind: uploads.kind,
      mimeType: uploads.mimeType,
      createdAt: uploads.createdAt,
    })
    .from(uploads)
    .where(eq(uploads.id, id))
    .limit(1);
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Admin listing / booking / order / audit views
// ---------------------------------------------------------------------------

export async function getAdminListings() {
  return db
    .select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      condition: listings.condition,
      status: listings.status,
      views: listings.views,
      createdAt: listings.createdAt,
      sellerId: listings.sellerId,
      sellerName: users.name,
    })
    .from(listings)
    .innerJoin(users, eq(listings.sellerId, users.id))
    .orderBy(desc(listings.createdAt))
    .limit(200);
}

export async function getAdminBookings() {
  return db
    .select({
      id: bookings.id,
      scheduledAt: bookings.scheduledAt,
      status: bookings.status,
      totalAmount: bookings.totalAmount,
      clientId: bookings.customerId,
      clientName: users.name,
      providerName: providerProfiles.businessName,
      serviceName: services.name,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.customerId, users.id))
    .innerJoin(providerProfiles, eq(bookings.providerId, providerProfiles.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .orderBy(desc(bookings.scheduledAt))
    .limit(200);
}

export async function getAdminOrders() {
  const buyers = alias(users, "buyers");
  const sellers = alias(users, "sellers");
  return db
    .select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      buyerName: buyers.name,
      sellerName: sellers.name,
      listingTitle: listings.title,
      paymentStatus: payments.status,
    })
    .from(orders)
    .innerJoin(buyers, eq(orders.buyerId, buyers.id))
    .innerJoin(sellers, eq(orders.sellerId, sellers.id))
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .leftJoin(payments, eq(orders.paymentId, payments.id))
    .orderBy(desc(orders.createdAt))
    .limit(200);
}

export async function getAdminActions() {
  return db
    .select({
      id: adminActions.id,
      action: adminActions.action,
      targetType: adminActions.targetType,
      targetId: adminActions.targetId,
      metadata: adminActions.metadata,
      createdAt: adminActions.createdAt,
      adminId: adminActions.adminId,
      adminName: users.name,
    })
    .from(adminActions)
    .innerJoin(users, eq(adminActions.adminId, users.id))
    .orderBy(desc(adminActions.createdAt))
    .limit(200);
}

// ---------------------------------------------------------------------------
// Admin moderation mutations (audit-logged)
// ---------------------------------------------------------------------------

export async function adminSetListingStatus(data: {
  adminId: number;
  listingId: number;
  status: "active" | "removed";
}) {
  const [listing] = await db
    .update(listings)
    .set({ status: data.status, updatedAt: new Date() })
    .where(eq(listings.id, data.listingId))
    .returning();
  if (!listing) throw new Error("Listing not found");
  await db.insert(adminActions).values({
    adminId: data.adminId,
    action: data.status === "removed" ? "listing_removed" : "listing_restored",
    targetType: "listing",
    targetId: listing.id,
    metadata: { sellerId: listing.sellerId, title: listing.title },
  });
  return listing;
}

export async function adminSetUserVerified(data: {
  adminId: number;
  userId: number;
  isVerified: boolean;
}) {
  const [user] = await db
    .update(users)
    .set({ isVerified: data.isVerified, updatedAt: new Date() })
    .where(eq(users.id, data.userId))
    .returning();
  if (!user) throw new Error("User not found");
  await db.insert(adminActions).values({
    adminId: data.adminId,
    action: data.isVerified ? "user_verified" : "user_unverified",
    targetType: "user",
    targetId: user.id,
    metadata: { name: user.name },
  });
  return user;
}
