import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getAdminSummary,
  getAdminUsers,
  getAdminVerificationQueue,
  reviewVerificationRequest,
} from "../../db/queries.js";
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
});
