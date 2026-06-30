import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getConversationsByUser,
  getMessagesByConversation,
  getOrCreateConversation,
  sendMessage,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const chatRouter = router({
  conversations: protectedProcedure.query(({ ctx }) =>
    getConversationsByUser(ctx.user.id)
  ),

  messages: protectedProcedure
    .input(z.object({ conversationId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      const convos = await getConversationsByUser(ctx.user.id);
      const hasAccess = convos.some((c) => c.id === input.conversationId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });
      return getMessagesByConversation(input.conversationId, input.limit);
    }),

  startConversation: protectedProcedure
    .input(
      z.object({
        otherUserId: z.number(),
        type: z.enum(["booking", "listing", "general"]).default("general"),
        referenceId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.otherUserId === ctx.user.id)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot message yourself" });
      const convo = await getOrCreateConversation(
        ctx.user.id,
        input.otherUserId,
        input.type as "booking" | "listing" | "general",
        input.referenceId
      );
      return convo;
    }),

  send: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        body: z.string().optional(),
        imageUrl: z.string().optional(),
        type: z.enum(["text", "image", "offer_card", "booking_card"]).default("text"),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const convos = await getConversationsByUser(ctx.user.id);
      const hasAccess = convos.some((c) => c.id === input.conversationId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });
      if (!input.body && !input.imageUrl)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Message must have body or image" });

      await sendMessage({
        conversationId: input.conversationId,
        senderId: ctx.user.id,
        body: input.body,
        imageUrl: input.imageUrl,
        type: input.type,
        metadata: input.metadata as any,
      });

      return { success: true };
    }),
});
