import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createListing,
  createOffer,
  getFavoriteIds,
  getListingById,
  getListings,
  getOffersForSeller,
  toggleFavorite,
} from "../../db/queries.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

const conditionEnum = z.enum(["new", "like_new", "good", "fair"]);

export const listingsRouter = router({
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

  byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const listing = await getListingById(input.id);
    if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
    return listing;
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        description: z.string().optional(),
        price: z.number().positive(),
        originalPrice: z.number().optional(),
        condition: conditionEnum,
        brand: z.string().optional(),
        size: z.string().optional(),
        images: z.array(z.string()).max(10).default([]),
        location: z.string().optional(),
        isNegotiable: z.boolean().default(false),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const listing = await createListing({
        ...input,
        sellerId: ctx.user.id,
        price: String(input.price),
        originalPrice: input.originalPrice ? String(input.originalPrice) : null,
      });
      return listing;
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(({ input, ctx }) => toggleFavorite(ctx.user.id, input.listingId)),

  myFavoriteIds: protectedProcedure.query(({ ctx }) => getFavoriteIds(ctx.user.id)),

  myListings: protectedProcedure.query(({ ctx }) =>
    getListings({ sellerId: ctx.user.id, limit: 50 })
  ),

  createOffer: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        amount: z.number().positive(),
        message: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) =>
      createOffer({
        listingId: input.listingId,
        buyerId: ctx.user.id,
        amount: String(input.amount),
        message: input.message,
      })
    ),

  myReceivedOffers: protectedProcedure.query(({ ctx }) => getOffersForSeller(ctx.user.id)),
});
