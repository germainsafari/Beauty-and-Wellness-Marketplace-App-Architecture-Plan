import { z } from "zod";
import { createPushToken } from "../../db/queries.js";
import { protectedProcedure, router } from "../trpc.js";

export const pushRouter = router({
  registerToken: protectedProcedure
    .input(z.object({ platform: z.string().min(2), token: z.string().min(8) }))
    .mutation(({ ctx, input }) => createPushToken({ ...input, userId: ctx.user.id })),
});
