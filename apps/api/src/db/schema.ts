import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["customer", "provider", "admin"]);
export const conditionEnum = pgEnum("listing_condition", ["new", "like_new", "good", "fair"]);
export const listingStatusEnum = pgEnum("listing_status", ["active", "sold", "reserved", "removed"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);
export const offerStatusEnum = pgEnum("offer_status", ["pending", "accepted", "declined", "countered"]);
export const conversationTypeEnum = pgEnum("conversation_type", ["booking", "listing", "general", "ai"]);
export const messageTypeEnum = pgEnum("message_type", ["text", "image", "offer_card", "booking_card", "ai"]);
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "approved", "rejected"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["mtn_momo", "airtel_money", "stripe", "demo"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "succeeded", "failed", "refunded"]);
export const orderStatusEnum = pgEnum("order_status", ["pending_payment", "paid", "ready_for_pickup", "completed", "cancelled", "disputed", "refunded"]);
export const paymentPurposeEnum = pgEnum("payment_purpose", ["booking", "order", "boost"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  role: userRoleEnum("role").default("customer").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  preferences: jsonb("preferences").$type<{ defaultPaymentProvider?: string }>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const providerProfiles = pgTable("provider_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 500 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00").notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
});

export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 10 }),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providerProfiles.id).notNull(),
  categoryId: integer("category_id").references(() => serviceCategories.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  duration: integer("duration_minutes").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 12, scale: 2 }),
  condition: conditionEnum("condition").notNull(),
  categoryId: integer("category_id"),
  brand: varchar("brand", { length: 100 }),
  size: varchar("size", { length: 50 }),
  images: jsonb("images").$type<string[]>().default([]).notNull(),
  location: varchar("location", { length: 255 }),
  isNegotiable: boolean("is_negotiable").default(false).notNull(),
  isBumped: boolean("is_bumped").default(false).notNull(),
  bumpedUntil: timestamp("bumped_until"),
  status: listingStatusEnum("status").default("active").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  listingId: integer("listing_id").references(() => listings.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id).notNull(),
  buyerId: integer("buyer_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: offerStatusEnum("status").default("pending").notNull(),
  message: text("message"),
  counterAmount: decimal("counter_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  providerId: integer("provider_id").references(() => providerProfiles.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant1Id: integer("participant1_id").references(() => users.id).notNull(),
  participant2Id: integer("participant2_id").references(() => users.id).notNull(),
  type: conversationTypeEnum("type").default("general").notNull(),
  referenceId: integer("reference_id"),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  type: messageTypeEnum("type").default("text").notNull(),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  documentType: varchar("document_type", { length: 50 }).default("national_id").notNull(),
  documentUrl: text("document_url").notNull(),
  status: verificationStatusEnum("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedById: integer("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  provider: paymentProviderEnum("provider").default("demo").notNull(),
  purpose: paymentPurposeEnum("purpose").notNull(),
  referenceId: integer("reference_id"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("RWF").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  externalReference: varchar("external_reference", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id).notNull(),
  buyerId: integer("buyer_id").references(() => users.id).notNull(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  paymentId: integer("payment_id").references(() => payments.id),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  protectionFee: decimal("protection_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending_payment").notNull(),
  pickupLocation: varchar("pickup_location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const boosts = pgTable("boosts", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id).notNull(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  paymentId: integer("payment_id").references(() => payments.id),
  startsAt: timestamp("starts_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bundleRules = pgTable("bundle_rules", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  minItems: integer("min_items").default(2).notNull(),
  discountPercent: integer("discount_percent").default(10).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loyaltyLedger = pgTable("loyalty_ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  points: integer("points").notNull(),
  reason: varchar("reason", { length: 100 }).notNull(),
  referenceType: varchar("reference_type", { length: 50 }),
  referenceId: integer("reference_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { length: 30 }).notNull(),
  token: text("token").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: integer("target_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  kind: varchar("kind", { length: 30 }).default("verification").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  actionUrl: varchar("action_url", { length: 500 }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiSessions = pgTable("ai_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).default("Beauty Concierge").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => aiSessions.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
