import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createService,
  deactivateService,
  getOffersForSeller,
  getProviderBookingsWithCustomer,
  getProviderByUserId,
  getProviderDashboard,
  getServicesByProvider,
  respondToOffer,
  updateBooking,
  updateProviderProfile,
  updateService,
} from "../../db/queries.js";
import { protectedProcedure, router } from "../trpc.js";

export const merchantRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const data = await getProviderDashboard(ctx.user.id);
    if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant profile not found" });
    return data;
  }),

  calendar: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getProviderByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
    const rows = await getProviderBookingsWithCustomer(profile.id);
    return rows.map(({ booking, service, customer }) => ({
      ...booking,
      serviceName: service.name,
      customerName: customer.name,
      customerPhone: customer.phone,
    }));
  }),

  services: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getProviderByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant profile not found" });
    const rows = await getServicesByProvider(ctx.user.id);
    return rows.map(({ service, category }) => ({
      ...service,
      categoryName: category?.name ?? null,
      categoryIcon: category?.icon ?? null,
    }));
  }),

  offers: protectedProcedure.query(({ ctx }) => getOffersForSeller(ctx.user.id)),

  respondToOffer: protectedProcedure
    .input(
      z.object({
        offerId: z.number(),
        action: z.enum(["accept", "decline", "counter"]),
        counterAmount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await respondToOffer(
          input.offerId,
          ctx.user.id,
          input.action,
          input.counterAmount !== undefined ? String(input.counterAmount) : undefined
        );
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Could not update offer",
        });
      }
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(2).optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        name: z.string().min(2).optional(),
        bio: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await updateProviderProfile(ctx.user.id, input);
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Could not update profile",
        });
      }
    }),

  updateBookingStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["confirmed", "completed", "cancelled", "no_show"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await getProviderByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN" });
      try {
        await updateBooking(input.id, { status: input.status }, profile.id);
      } catch {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }
      return { success: true };
    }),

  createService: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        description: z.string().optional(),
        duration: z.number().int().min(5).max(480),
        price: z.number().positive(),
        categoryId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await getProviderByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant profile not found" });
      return createService({
        providerId: profile.id,
        name: input.name,
        description: input.description,
        duration: input.duration,
        price: String(input.price),
        categoryId: input.categoryId ?? null,
      });
    }),

  updateService: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).max(255).optional(),
        description: z.string().optional(),
        duration: z.number().int().min(5).max(480).optional(),
        price: z.number().positive().optional(),
        categoryId: z.number().nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await getProviderByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant profile not found" });
      const { id, price, ...rest } = input;
      try {
        return await updateService(id, profile.id, {
          ...rest,
          ...(price !== undefined ? { price: String(price) } : {}),
        });
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Could not update service",
        });
      }
    }),

  deleteService: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const profile = await getProviderByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Merchant profile not found" });
      try {
        await deactivateService(input.id, profile.id);
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e instanceof Error ? e.message : "Could not remove service",
        });
      }
      return { success: true };
    }),
});
