import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createNotification,
  getOrderById,
  getOrdersByUser,
  updateListing,
  updateOrder,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const ordersRouter = router({
  mine: protectedProcedure.query(({ ctx }) => getOrdersByUser(ctx.user.id)),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.buyerId !== ctx.user.id && order.sellerId !== ctx.user.id && ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
      return order;
    }),

  // Buyer confirms receipt
  confirmDelivery: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.buyerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (order.status !== "shipped") throw new TRPCError({ code: "BAD_REQUEST", message: "Order must be shipped first" });

      await updateOrder(input.id, {
        status: "delivered",
        buyerConfirmedAt: new Date(),
      });

      // Schedule escrow release after 48h (simulated as immediate for now)
      await updateListing(order.listingId, { status: "sold" });

      await createNotification({
        userId: order.sellerId,
        type: "delivery_confirmed",
        title: "Delivery Confirmed",
        body: "Buyer confirmed receipt. Funds will be released to your wallet shortly.",
      });

      return { success: true };
    }),

  // Buyer raises dispute
  raiseDispute: protectedProcedure
    .input(z.object({ id: z.number(), reason: z.string().min(10) }))
    .mutation(async ({ input, ctx }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.buyerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await updateOrder(input.id, {
        status: "disputed",
        disputeRaisedAt: new Date(),
        disputeReason: input.reason,
      });

      await createNotification({
        userId: order.sellerId,
        type: "dispute_raised",
        title: "Dispute Raised",
        body: `Buyer raised a dispute: ${input.reason.slice(0, 100)}`,
      });

      return { success: true };
    }),

  // Seller marks as shipped
  markShipped: protectedProcedure
    .input(z.object({ id: z.number(), trackingNumber: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.sellerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await updateOrder(input.id, {
        status: "shipped",
        trackingNumber: input.trackingNumber,
      });

      await createNotification({
        userId: order.buyerId,
        type: "order_shipped",
        title: "Your Order Has Shipped",
        body: input.trackingNumber
          ? `Tracking: ${input.trackingNumber}`
          : "Your item is on its way!",
      });

      return { success: true };
    }),

  // Simulate MoMo payment
  pay: protectedProcedure
    .input(z.object({ id: z.number(), paymentMethod: z.enum(["momo", "airtel", "card", "wallet"]) }))
    .mutation(async ({ input, ctx }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.buyerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (order.status !== "pending_payment") throw new TRPCError({ code: "BAD_REQUEST" });

      const paymentRef = `HAFI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await updateOrder(input.id, {
        status: "paid",
        paymentMethod: input.paymentMethod,
        paymentRef,
      });

      await createNotification({
        userId: order.sellerId,
        type: "payment_received",
        title: "Payment Received",
        body: `Payment of RWF ${Number(order.amount).toLocaleString()} received. Please ship the item.`,
      });

      return { success: true, paymentRef };
    }),
});
