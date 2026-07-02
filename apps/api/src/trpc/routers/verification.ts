import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createVerificationRequest, getMyVerificationRequests } from "../../db/queries.js";
import { getUploadMetaById } from "../../db/queries-admin.js";
import { protectedProcedure, router } from "../trpc.js";

export const verificationRouter = router({
  mine: protectedProcedure.query(({ ctx }) => getMyVerificationRequests(ctx.user.id)),
  submit: protectedProcedure
    .input(
      z
        .object({
          documentType: z.enum(["national_id", "passport", "business_registration"]).default("national_id"),
          documentUrl: z.string().url().optional(),
          uploadId: z.number().int().positive().optional(),
        })
        .refine((value) => value.documentUrl || value.uploadId, {
          message: "Provide documentUrl or uploadId",
        })
    )
    .mutation(async ({ ctx, input }) => {
      let documentUrl = input.documentUrl;
      if (input.uploadId) {
        const upload = await getUploadMetaById(input.uploadId);
        if (!upload || upload.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Upload not found" });
        }
        documentUrl = `/uploads/${upload.id}`;
      }
      return createVerificationRequest({
        documentType: input.documentType,
        documentUrl: documentUrl!,
        userId: ctx.user.id,
      });
    }),
});
