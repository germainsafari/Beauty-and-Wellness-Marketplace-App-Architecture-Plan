import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  boostListing,
  buyListingNow,
  createPaymentIntent,
  getLoyaltyLedger,
  getMyOrders,
  getPaymentById,
  quoteBundle,
  updatePaymentStatus,
  upsertBundleRule,
} from "../../db/queries.js";
import { protectedProcedure, router } from "../trpc.js";

const paymentProvider = z.enum(["mtn_momo", "airtel_money", "stripe", "demo"]);

export const commerceRouter = router({
  buyNow: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        provider: paymentProvider.default("demo"),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await buyListingNow({ ...input, buyerId: ctx.user.id });
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Could not create order",
        });
      }
    }),

  payBooking: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        amount: z.number().positive(),
        provider: paymentProvider.default("demo"),
        phone: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createPaymentIntent({
        userId: ctx.user.id,
        provider: input.provider,
        purpose: "booking",
        referenceId: input.bookingId,
        amount: input.amount.toFixed(2),
        phone: input.phone,
      })
    ),

  simulatePaymentStatus: protectedProcedure
    .input(z.object({ paymentId: z.number(), status: z.enum(["succeeded", "failed", "refunded"]) }))
    .mutation(async ({ input }) => {
      const payment = await updatePaymentStatus(input.paymentId, input.status);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
      return payment;
    }),

  payment: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const payment = await getPaymentById(input.id);
    if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
    return payment;
  }),

  myOrders: protectedProcedure.query(({ ctx }) => getMyOrders(ctx.user.id)),

  boostListing: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        days: z.number().min(1).max(30).default(7),
        provider: paymentProvider.default("demo"),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await boostListing({ ...input, sellerId: ctx.user.id });
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Could not boost listing",
        });
      }
    }),

  saveBundleRule: protectedProcedure
    .input(z.object({ minItems: z.number().min(2).max(10), discountPercent: z.number().min(1).max(50) }))
    .mutation(({ ctx, input }) => upsertBundleRule({ ...input, sellerId: ctx.user.id })),

  quoteBundle: protectedProcedure
    .input(z.object({ listingIds: z.array(z.number()).min(1).max(10) }))
    .query(async ({ ctx, input }) => {
      try {
        return await quoteBundle(ctx.user.id, input.listingIds);
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Could not quote bundle",
        });
      }
    }),

  loyaltyLedger: protectedProcedure.query(({ ctx }) => getLoyaltyLedger(ctx.user.id)),
});
