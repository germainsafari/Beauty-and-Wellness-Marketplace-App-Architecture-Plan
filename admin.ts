import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getAllReports, getAllUsers, getPlatformStats, updateReport, updateUser } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin")
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const adminRouter = router({
  stats: adminProcedure.query(() => getPlatformStats()),

  users: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(({ input }) => getAllUsers(input.limit, input.offset)),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["customer", "provider", "admin"]) }))
    .mutation(async ({ input }) => {
      await updateUser(input.userId, { role: input.role });
      return { success: true };
    }),

  reports: adminProcedure.query(() => getAllReports()),

  resolveReport: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["reviewed", "resolved", "dismissed"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateReport(input.id, { status: input.status });
      return { success: true };
    }),
});
