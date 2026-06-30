import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  blockUser,
  createProviderProfile,
  createReport,
  createService,
  getBlockedUsers,
  getCategories,
  getProviderByUserId,
  getReviewsByReviewee,
  getServicesByProvider,
  getUserById,
  seedCategories,
  unblockUser,
  updateProviderProfile,
  updateService,
  updateUser,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

export const usersRouter = router({
  // GET profile
  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const provider = await getProviderByUserId(ctx.user.id);
    return { ...user, providerProfile: provider || null };
  }),

  publicProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const provider = await getProviderByUserId(input.userId);
      const reviews = await getReviewsByReviewee(input.userId);
      const { walletBalance, idVerified, ...publicUser } = user;
      return { ...publicUser, providerProfile: provider || null, reviews };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        location: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await updateUser(ctx.user.id, input);
      return { success: true };
    }),

  uploadAvatar: protectedProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `avatars/${ctx.user.id}-${Date.now()}.jpg`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await updateUser(ctx.user.id, { avatarUrl: url });
      return { url };
    }),

  // Provider profile
  myProviderProfile: protectedProcedure.query(({ ctx }) =>
    getProviderByUserId(ctx.user.id)
  ),

  createProviderProfile: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(2),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await getProviderByUserId(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Provider profile already exists" });
      await createProviderProfile({ ...input, userId: ctx.user.id });
      await updateUser(ctx.user.id, { role: "provider" });
      return { success: true };
    }),

  updateProviderProfile: protectedProcedure
    .input(
      z.object({
        businessName: z.string().optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        workingHours: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await getProviderByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      await updateProviderProfile(profile.id, input as any);
      return { success: true };
    }),

  // Services
  myServices: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getProviderByUserId(ctx.user.id);
    if (!profile) return [];
    return getServicesByProvider(profile.id);
  }),

  createService: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        price: z.number().positive(),
        duration: z.number().positive(),
        categoryId: z.number().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const profile = await getProviderByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Create a provider profile first" });
      await createService({ ...input, price: String(input.price), providerId: profile.id });
      return { success: true };
    }),

  updateService: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        price: z.number().optional(),
        duration: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, price, ...rest } = input;
      await updateService(id, { ...rest, ...(price ? { price: String(price) } : {}) });
      return { success: true };
    }),

  // Categories
  categories: publicProcedure.query(async () => {
    await seedCategories();
    return getCategories();
  }),

  // Reports
  report: protectedProcedure
    .input(
      z.object({
        type: z.enum(["listing", "user", "review"]),
        targetId: z.number(),
        reason: z.string().min(5),
        details: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createReport({ ...input, reporterId: ctx.user.id });
      return { success: true };
    }),

  // Block/unblock
  block: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await blockUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  unblock: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await unblockUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  blockedList: protectedProcedure.query(({ ctx }) => getBlockedUsers(ctx.user.id)),
});
