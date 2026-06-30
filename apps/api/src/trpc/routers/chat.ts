import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getConversationsByUser,
  getMessagesByConversation,
  getOrCreateConversation,
  sendMessage,
} from "../../db/queries.js";
import { protectedProcedure, router } from "../trpc.js";

export const chatRouter = router({
  conversations: protectedProcedure.query(({ ctx }) => getConversationsByUser(ctx.user.id)),

  messages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input, ctx }) => {
      const convos = await getConversationsByUser(ctx.user.id);
      if (!convos.some((c) => c.id === input.conversationId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getMessagesByConversation(input.conversationId);
    }),

  startConversation: protectedProcedure
    .input(
      z.object({
        otherUserId: z.number(),
        type: z.enum(["booking", "listing", "general"]).default("general"),
        referenceId: z.number().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      if (input.otherUserId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot message yourself" });
      }
      return getOrCreateConversation(ctx.user.id, input.otherUserId, input.type, input.referenceId);
    }),

  send: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        body: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const convos = await getConversationsByUser(ctx.user.id);
      if (!convos.some((c) => c.id === input.conversationId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await sendMessage({
        conversationId: input.conversationId,
        senderId: ctx.user.id,
        body: input.body,
      });
      return { success: true };
    }),
});
