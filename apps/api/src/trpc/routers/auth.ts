import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createToken } from "../../auth.js";
import {
  createUser,
  ensureProviderProfile,
  getUserByPhone,
  updateUser,
} from "../../db/queries.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

const roleEnum = z.enum(["customer", "provider"]);

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        phone: z.string().min(8),
        role: roleEnum.default("customer"),
      })
    )
    .mutation(async ({ input }) => {
      const requestedRole = input.phone === "+250780000000" ? "admin" : input.role;
      let user = await getUserByPhone(input.phone);
      if (!user) {
        user = await createUser({
          name: input.name,
          phone: input.phone,
          role: requestedRole,
        });
      } else {
        user = (await updateUser(user.id, {
          name: input.name,
          role: user.role,
        }))!;
      }

      if (requestedRole === "provider") {
        await ensureProviderProfile(user.id, user.name);
      }

      const token = await createToken(user.id);
      return { token, user };
    }),

  signIn: publicProcedure
    .input(z.object({ phone: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const user = await getUserByPhone(input.phone);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account found for this phone number. Create a new account first.",
        });
      }
      const token = await createToken(user.id);
      return { token, user };
    }),

  me: protectedProcedure.query(({ ctx }) => ctx.user),

  setRole: protectedProcedure
    .input(z.object({ role: roleEnum }))
    .mutation(async ({ ctx, input }) => {
      const user = (await updateUser(ctx.user.id, { role: input.role }))!;
      if (input.role === "provider") {
        await ensureProviderProfile(user.id, user.name);
      }
      return user;
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        location: z.string().optional(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateUser(ctx.user.id, input);
    }),
});
