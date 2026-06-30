import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createBooking,
  createNotification,
  getAllProviders,
  getBookingsByCustomer,
  getServiceById,
  getServices,
  updateBooking,
} from "../../db/queries.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

export const bookingsRouter = router({
  services: publicProcedure.query(() => getServices()),

  providers: publicProcedure.query(() => getAllProviders()),

  mine: protectedProcedure.query(({ ctx }) => getBookingsByCustomer(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        serviceId: z.number(),
        scheduledAt: z.coerce.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = await getServiceById(input.serviceId);
      if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });

      const booking = await createBooking({
        customerId: ctx.user.id,
        providerId: service.providerId,
        serviceId: input.serviceId,
        scheduledAt: input.scheduledAt,
        durationMinutes: service.duration,
        totalAmount: service.price,
        notes: input.notes,
      });

      await createNotification({
        userId: ctx.user.id,
        type: "booking_confirmed",
        title: "Booking Requested ✨",
        body: `Your ${service.name} appointment is pending confirmation`,
        actionUrl: "/bookings",
      });

      return booking;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      await updateBooking(input.id, {
        status: "cancelled",
        cancellationReason: input.reason,
      });
      return { success: true };
    }),
});
