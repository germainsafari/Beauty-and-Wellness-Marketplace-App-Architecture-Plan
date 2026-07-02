import { z } from "zod";
import {
  getLoyaltyLedger,
  getMyOrders,
  getMyVerificationRequests,
  getNotifications,
  getUserById,
  getUserPayments,
  getWalletBalance,
  updateUser,
} from "../../db/queries.js";
import { protectedProcedure, router } from "../trpc.js";

const paymentProvider = z.enum(["mtn_momo", "airtel_money", "stripe", "demo"]);

export const profileRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const [wallet, notifications, orders, ledger, verification] = await Promise.all([
      getWalletBalance(ctx.user.id),
      getNotifications(ctx.user.id),
      getMyOrders(ctx.user.id),
      getLoyaltyLedger(ctx.user.id),
      getMyVerificationRequests(ctx.user.id),
    ]);
    const user = await getUserById(ctx.user.id);
    return {
      wallet,
      unreadNotifications: notifications.filter((n) => !n.isRead).length,
      orderCount: orders.length,
      loyaltyEntries: ledger.length,
      verificationStatus: verification[0]?.status ?? null,
      defaultPaymentProvider: user?.preferences?.defaultPaymentProvider ?? "demo",
    };
  }),

  setDefaultPayment: protectedProcedure
    .input(z.object({ provider: paymentProvider }))
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      const prefs = { ...(user?.preferences ?? {}), defaultPaymentProvider: input.provider };
      await updateUser(ctx.user.id, { preferences: prefs });
      return { success: true, provider: input.provider };
    }),

  paymentHistory: protectedProcedure.query(({ ctx }) => getUserPayments(ctx.user.id)),

  purchaseHistory: protectedProcedure.query(({ ctx }) => getMyOrders(ctx.user.id)),

  loyaltyActivity: protectedProcedure.query(({ ctx }) => getLoyaltyLedger(ctx.user.id)),
});

export const HELP_TOPICS = [
  {
    id: "booking",
    title: "How do I book a service?",
    body: "Open Discover or Bookings, pick a provider and service, then choose your date and time. You'll get a confirmation notification.",
  },
  {
    id: "marketplace",
    title: "How does buyer protection work?",
    body: "Pay through Hafi escrow when buying on Marketplace. A 5% protection fee applies. You can message the seller and make offers on negotiable items.",
  },
  {
    id: "payments",
    title: "Which payment methods are supported?",
    body: "MTN MoMo, Airtel Money, card via Stripe, and Demo instant pay for testing. Set your default method in Profile → Payment methods.",
  },
  {
    id: "verification",
    title: "How do I get verified?",
    body: "Upload a secure document URL (national ID or business registration) in Profile. Admin reviews within 24–48 hours.",
  },
  {
    id: "contact",
    title: "Contact Hafi support",
    body: "Email support@hafi.rw or message us in-app. For urgent booking issues, check Messages for your provider thread.",
  },
] as const;
