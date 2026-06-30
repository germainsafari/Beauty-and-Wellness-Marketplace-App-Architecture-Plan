import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createReview, getReviewsByReviewee } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const reviewsRouter = router({
  byUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getReviewsByReviewee(input.userId)),

  create: protectedProcedure
    .input(
      z.object({
        revieweeId: z.number(),
        type: z.enum(["booking", "listing"]),
        referenceId: z.number(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        body: z.string().optional(),
        images: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.revieweeId === ctx.user.id)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot review yourself" });
      await createReview({ ...input, reviewerId: ctx.user.id });
      return { success: true };
    }),
});
