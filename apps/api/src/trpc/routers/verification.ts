import { z } from "zod";
import { createVerificationRequest, getMyVerificationRequests } from "../../db/queries.js";
import { protectedProcedure, router } from "../trpc.js";

export const verificationRouter = router({
  mine: protectedProcedure.query(({ ctx }) => getMyVerificationRequests(ctx.user.id)),
  submit: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["national_id", "passport", "business_registration"]).default("national_id"),
        documentUrl: z.string().url(),
      })
    )
    .mutation(({ ctx, input }) => createVerificationRequest({ ...input, userId: ctx.user.id })),
});
