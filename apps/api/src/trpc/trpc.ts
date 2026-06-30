import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getUserFromRequest, type AuthUser } from "../auth.js";

export async function createContext({ req }: CreateExpressContextOptions) {
  const user = await getUserFromRequest(req);
  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in" });
  }
  return next({ ctx: { ...ctx, user: ctx.user as AuthUser } });
});
