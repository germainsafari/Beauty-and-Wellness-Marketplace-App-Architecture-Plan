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
import { AI_GREETINGS, isLocale } from "@hafi/i18n";
import { chatWithAgent, getBeautySuggestions } from "../../services/aiAgent.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

export const aiRouter = router({
  sessions: protectedProcedure.query(({ ctx }) => getAiSessions(ctx.user.id)),

  messages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ input }) => getAiMessages(input.sessionId)),

  createSession: protectedProcedure
    .input(
      z
        .object({
          title: z.string().optional(),
          locale: z.enum(["en", "rw", "fr", "sw"]).optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const locale = input?.locale && isLocale(input.locale) ? input.locale : "en";
      const session = await createAiSession(ctx.user.id, input?.title);
      await addAiMessage(session.id, "assistant", AI_GREETINGS[locale]);
      return session;
    }),

  chat: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        message: z.string().min(1).max(2000),
        locale: z.enum(["en", "rw", "fr", "sw"]).optional(),
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

      const locale = input.locale && isLocale(input.locale) ? input.locale : "en";
      const reply = await chatWithAgent(messages, {
        name: ctx.user.name,
        location: ctx.user.location ?? undefined,
        locale,
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
