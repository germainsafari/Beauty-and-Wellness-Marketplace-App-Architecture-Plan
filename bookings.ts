import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createBooking,
  createNotification,
  getBookingById,
  getBookingsByCustomer,
  getBookingsByProvider,
  getProviderByUserId,
  getServiceById,
  updateBooking,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const bookingsRouter = router({
  // GET my bookings (as customer)
  mine: protectedProcedure.query(({ ctx }) => getBookingsByCustomer(ctx.user.id)),

  // GET provider's bookings
  providerBookings: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getProviderByUserId(ctx.user.id);
    if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Provider profile not found" });
    return getBookingsByProvider(profile.id);
  }),

  // GET booking by id
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.customerId !== ctx.user.id && booking.providerId !== ctx.user.id && ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
      return booking;
    }),

  // POST — create booking
  create: protectedProcedure
    .input(
      z.object({
        serviceId: z.number(),
        scheduledAt: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const service = await getServiceById(input.serviceId);
      if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });
      if (!service.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Service is not available" });

      await createBooking({
        customerId: ctx.user.id,
        providerId: service.providerId,
        serviceId: input.serviceId,
        scheduledAt: input.scheduledAt,
        durationMinutes: service.duration,
        totalAmount: service.price,
        notes: input.notes,
      });

      await createNotification({
        userId: service.providerId,
        type: "new_booking",
        title: "New Booking Request",
        body: `You have a new booking request for ${service.name}`,
        actionUrl: `/provider/bookings`,
      });

      return { success: true };
    }),

  // PATCH — update booking status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
        cancellationReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      const isCustomer = booking.customerId === ctx.user.id;
      const isProvider = booking.providerId === ctx.user.id;
      if (!isCustomer && !isProvider && ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });

      // Customers can only cancel
      if (isCustomer && !["cancelled"].includes(input.status))
        throw new TRPCError({ code: "FORBIDDEN", message: "Customers can only cancel bookings" });

      await updateBooking(input.id, {
        status: input.status,
        cancellationReason: input.cancellationReason,
      });

      const notifyUserId = isCustomer ? booking.providerId : booking.customerId;
      await createNotification({
        userId: notifyUserId,
        type: `booking_${input.status}`,
        title: `Booking ${input.status.charAt(0).toUpperCase() + input.status.slice(1)}`,
        body: `Your booking has been ${input.status}`,
        actionUrl: `/bookings/${input.id}`,
      });

      return { success: true };
    }),

  // PATCH — reschedule
  reschedule: protectedProcedure
    .input(z.object({ id: z.number(), scheduledAt: z.date() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.customerId !== ctx.user.id && booking.providerId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });

      await updateBooking(input.id, { scheduledAt: input.scheduledAt, status: "pending" });
      return { success: true };
    }),
});
