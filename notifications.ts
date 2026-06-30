import { z } from "zod";
import { getNotificationsByUser, markNotificationsRead } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const notificationsRouter = router({
  mine: protectedProcedure.query(({ ctx }) => getNotificationsByUser(ctx.user.id)),

  markAllRead: protectedProcedure.mutation(({ ctx }) =>
    markNotificationsRead(ctx.user.id)
  ),
});
