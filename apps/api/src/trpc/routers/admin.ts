import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getAdminSummary,
  getAdminUsers,
  getAdminVerificationQueue,
  reviewVerificationRequest,
} from "../../db/queries.js";
import {
  adminSetListingStatus,
  adminSetUserVerified,
  getAdminActions,
  getAdminBookings,
  getAdminListings,
  getAdminOrders,
} from "../../db/queries-admin.js";
import { protectedProcedure, router } from "../trpc.js";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  summary: adminProcedure.query(() => getAdminSummary()),
  users: adminProcedure.query(() => getAdminUsers()),
  verificationQueue: adminProcedure.query(() => getAdminVerificationQueue()),
  listings: adminProcedure.query(() => getAdminListings()),
  bookings: adminProcedure.query(() => getAdminBookings()),
  orders: adminProcedure.query(() => getAdminOrders()),
  actions: adminProcedure.query(() => getAdminActions()),
  reviewVerification: adminProcedure
    .input(
      z.object({
        requestId: z.number(),
        status: z.enum(["approved", "rejected"]),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      reviewVerificationRequest({
        adminId: ctx.user.id,
        requestId: input.requestId,
        status: input.status,
        rejectionReason: input.rejectionReason,
      })
    ),
  setListingStatus: adminProcedure
    .input(
      z.object({
        listingId: z.number().int().positive(),
        status: z.enum(["active", "removed"]),
      })
    )
    .mutation(({ ctx, input }) =>
      adminSetListingStatus({
        adminId: ctx.user.id,
        listingId: input.listingId,
        status: input.status,
      })
    ),
  setUserVerified: adminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        isVerified: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) =>
      adminSetUserVerified({
        adminId: ctx.user.id,
        userId: input.userId,
        isVerified: input.isVerified,
      })
    ),
});
