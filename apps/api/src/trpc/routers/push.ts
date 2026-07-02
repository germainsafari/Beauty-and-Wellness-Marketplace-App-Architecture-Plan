import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createPushToken } from "../../db/queries.js";
import { listUserPushTokens, setUserPushTokenEnabled } from "../../services/push.js";
import { protectedProcedure, router } from "../trpc.js";

export const pushRouter = router({
  registerToken: protectedProcedure
    .input(z.object({ platform: z.string().min(2), token: z.string().min(8) }))
    .mutation(({ ctx, input }) => createPushToken({ ...input, userId: ctx.user.id })),

  myTokens: protectedProcedure.query(({ ctx }) => listUserPushTokens(ctx.user.id)),

  setEnabled: protectedProcedure
    .input(z.object({ tokenId: z.number().int().positive(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await setUserPushTokenEnabled(ctx.user.id, input.tokenId, input.enabled);
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Push token not found" });
      }
      return updated;
    }),
});
