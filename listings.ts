import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createListing,
  deleteListing,
  getFavoriteIds,
  getListingById,
  getListings,
  getListingsByUser,
  getUserFavorites,
  toggleFavorite,
  updateListing,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const conditionEnum = z.enum(["new", "like_new", "good", "fair"]);

export const listingsRouter = router({
  // GET /listings — search + filter
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        categoryId: z.number().optional(),
        condition: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sellerId: z.number().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().default(0),
      })
    )
    .query(({ input }) => getListings(input)),

  // GET /listings/:id
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const listing = await getListingById(input.id);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      return listing;
    }),

  // POST /listings — create
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        description: z.string().optional(),
        price: z.number().positive(),
        originalPrice: z.number().optional(),
        condition: conditionEnum,
        categoryId: z.number().optional(),
        brand: z.string().optional(),
        size: z.string().optional(),
        images: z.array(z.string()).max(10).default([]),
        location: z.string().optional(),
        isNegotiable: z.boolean().default(false),
        isBumped: z.boolean().default(false),
        shippingOptions: z
          .array(z.object({ method: z.string(), price: z.number(), days: z.string() }))
          .default([]),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createListing({
        ...input,
        price: String(input.price),
        originalPrice: input.originalPrice ? String(input.originalPrice) : null,
        sellerId: ctx.user.id,
      });
      return { success: true };
    }),

  // PATCH /listings/:id — update
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        condition: conditionEnum.optional(),
        images: z.array(z.string()).optional(),
        isNegotiable: z.boolean().optional(),
        status: z.enum(["active", "sold", "reserved", "removed"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const listing = await getListingById(input.id);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      if (listing.sellerId !== ctx.user.id && ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
      const { id, price, ...rest } = input;
      await updateListing(id, { ...rest, ...(price ? { price: String(price) } : {}) });
      return { success: true };
    }),

  // DELETE /listings/:id
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const listing = await getListingById(input.id);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      if (listing.sellerId !== ctx.user.id && ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
      await deleteListing(input.id);
      return { success: true };
    }),

  // POST /listings/:id/favorite — toggle
  toggleFavorite: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const isFaved = await toggleFavorite(ctx.user.id, input.listingId);
      return { favorited: isFaved };
    }),

  // GET /listings/my — seller's own listings
  myListings: protectedProcedure.query(({ ctx }) => getListingsByUser(ctx.user.id)),

  // GET /listings/favorites
  myFavorites: protectedProcedure.query(({ ctx }) => getUserFavorites(ctx.user.id)),

  // GET /listings/favorite-ids
  myFavoriteIds: protectedProcedure.query(({ ctx }) => getFavoriteIds(ctx.user.id)),

  // POST /listings/:id/bump — paid bump (simulated)
  bump: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const listing = await getListingById(input.id);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      if (listing.sellerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const bumpedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await updateListing(input.id, { isBumped: true, bumpedUntil });
      return { success: true, bumpedUntil };
    }),

  // POST /upload-image — upload listing image
  uploadImage: protectedProcedure
    .input(z.object({ base64: z.string(), filename: z.string(), mimeType: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `listings/${ctx.user.id}/${Date.now()}-${input.filename}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
});
