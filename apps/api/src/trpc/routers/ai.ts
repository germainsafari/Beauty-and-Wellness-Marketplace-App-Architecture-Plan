import { z } from "zod";
import {
  addAiMessage,
  createAiSession,
  getAiMessages,
  getAiSessions,
  getNotifications,
  getWalletBalance,
  markAllNotificationsRead,
} from "../../db/queries.js";
import { chatWithAgent, getBeautySuggestions } from "../../services/aiAgent.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

export const aiRouter = router({
  sessions: protectedProcedure.query(({ ctx }) => getAiSessions(ctx.user.id)),

  messages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => getAiMessages(input.sessionId)),

  createSession: protectedProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const session = await createAiSession(ctx.user.id, input?.title);
      await addAiMessage(
        session.id,
        "assistant",
        "Hey bestie! 💜 I'm Hafi AI — your beauty concierge. Ask me about salon bookings, marketplace finds, skincare tips, or glow-up ideas!"
      );
      return session;
    }),

  chat: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        message: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await addAiMessage(input.sessionId, "user", input.message);

      const history = await getAiMessages(input.sessionId);
      const messages = history
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const reply = await chatWithAgent(messages, {
        name: ctx.user.name,
        location: ctx.user.location ?? undefined,
      });

      await addAiMessage(input.sessionId, "assistant", reply);
      return { reply };
    }),

  suggestions: publicProcedure
    .input(z.object({ query: z.string().default("") }))
    .query(({ input }) =>
      getBeautySuggestions(input.query || "beauty and wellness for young women in Rwanda")
    ),
});

export const notificationsRouter = router({
  mine: protectedProcedure.query(({ ctx }) => getNotifications(ctx.user.id)),
  markAllRead: protectedProcedure.mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),
});

export const walletRouter = router({
  balance: protectedProcedure.query(({ ctx }) => getWalletBalance(ctx.user.id)),
});
