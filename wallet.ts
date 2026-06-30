import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { addWalletTransaction, getWalletTransactions, getUserById, updateUser } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const walletRouter = router({
  transactions: protectedProcedure.query(({ ctx }) =>
    getWalletTransactions(ctx.user.id)
  ),

  balance: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return { balance: user?.walletBalance ?? "0.00" };
  }),

  withdraw: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        method: z.enum(["momo", "airtel"]),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const balance = Number(user.walletBalance);
      if (input.amount > balance)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient wallet balance" });

      const newBalance = balance - input.amount;
      await updateUser(ctx.user.id, { walletBalance: String(newBalance) });
      await addWalletTransaction({
        userId: ctx.user.id,
        type: "withdrawal",
        amount: String(input.amount),
        balance: String(newBalance),
        description: `Withdrawal to ${input.method.toUpperCase()} ${input.phoneNumber}`,
        status: "completed",
      });

      return { success: true, newBalance };
    }),
});
