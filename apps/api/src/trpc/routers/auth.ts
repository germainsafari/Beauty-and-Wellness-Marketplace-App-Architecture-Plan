import { z } from "zod";
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
      let user = await getUserByPhone(input.phone);
      if (!user) {
        user = await createUser({
          name: input.name,
          phone: input.phone,
          role: input.role,
        });
      } else {
        user = (await updateUser(user.id, {
          name: input.name,
          role: input.role,
        }))!;
      }

      if (input.role === "provider") {
        await ensureProviderProfile(user.id, user.name);
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
