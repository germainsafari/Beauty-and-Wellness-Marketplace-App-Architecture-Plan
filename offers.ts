import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createNotification,
  createOffer,
  createOrder,
  getListingById,
  getOfferById,
  getOffersByListing,
  getOffersByUser,
  getReceivedOffers,
  updateOffer,
  updateListing,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const offersRouter = router({
  // GET my offers (as buyer or seller)
  mine: protectedProcedure.query(({ ctx }) => getOffersByUser(ctx.user.id)),

  // GET offers received as seller
  myReceivedOffers: protectedProcedure.query(({ ctx }) => getReceivedOffers(ctx.user.id)),

  // GET offers on a listing
  byListing: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ input, ctx }) => {
      const listing = await getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      if (listing.sellerId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can view all offers" });
      return getOffersByListing(input.listingId);
    }),

  // POST — make an offer
  create: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        amount: z.number().positive(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const listing = await getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      if (listing.sellerId === ctx.user.id)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot make offer on your own listing" });
      if (listing.status !== "active")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Listing is not available" });

      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await createOffer({
        listingId: input.listingId,
        buyerId: ctx.user.id,
        sellerId: listing.sellerId,
        amount: String(input.amount),
        message: input.message,
        expiresAt,
      });

      await createNotification({
        userId: listing.sellerId,
        type: "new_offer",
        title: "New Offer Received",
        body: `Someone offered RWF ${input.amount.toLocaleString()} for "${listing.title}"`,
        actionUrl: `/marketplace/listing/${listing.id}`,
      });

      return { success: true };
    }),

  // PATCH — respond to offer (accept/decline/counter)
  respond: protectedProcedure
    .input(
      z.object({
        offerId: z.number(),
        action: z.enum(["accept", "decline", "counter"]),
        counterAmount: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const offer = await getOfferById(input.offerId);
      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.sellerId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });

      if (input.action === "accept") {
        await updateOffer(input.offerId, { status: "accepted" });
        // Create order with escrow
        const listing = await getListingById(offer.listingId);
        if (listing) {
          const platformFee = Number(offer.amount) * 0.05; // 5% platform fee
          const sellerPayout = Number(offer.amount) - platformFee;
          await createOrder({
            listingId: offer.listingId,
            buyerId: offer.buyerId,
            sellerId: offer.sellerId,
            offerId: offer.id,
            amount: offer.amount,
            platformFee: String(platformFee),
            sellerPayout: String(sellerPayout),
            status: "pending_payment",
          });
          await updateListing(offer.listingId, { status: "reserved" });
        }
        await createNotification({
          userId: offer.buyerId,
          type: "offer_accepted",
          title: "Offer Accepted!",
          body: `Your offer of RWF ${Number(offer.amount).toLocaleString()} was accepted. Proceed to payment.`,
          actionUrl: `/marketplace/orders`,
        });
      } else if (input.action === "decline") {
        await updateOffer(input.offerId, { status: "declined" });
        await createNotification({
          userId: offer.buyerId,
          type: "offer_declined",
          title: "Offer Declined",
          body: `Your offer was declined by the seller.`,
        });
      } else if (input.action === "counter" && input.counterAmount) {
        await updateOffer(input.offerId, {
          status: "countered",
          counterAmount: String(input.counterAmount),
        });
        await createNotification({
          userId: offer.buyerId,
          type: "offer_countered",
          title: "Counter Offer Received",
          body: `The seller countered with RWF ${input.counterAmount.toLocaleString()}`,
        });
      }

      return { success: true };
    }),
});
