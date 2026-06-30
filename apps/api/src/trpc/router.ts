import { authRouter } from "./routers/auth.js";
import { listingsRouter } from "./routers/listings.js";
import { bookingsRouter } from "./routers/bookings.js";
import { chatRouter } from "./routers/chat.js";
import { aiRouter, notificationsRouter, walletRouter } from "./routers/ai.js";
import { merchantRouter } from "./routers/merchant.js";
import { router } from "./trpc.js";

export const appRouter = router({
  auth: authRouter,
  listings: listingsRouter,
  bookings: bookingsRouter,
  chat: chatRouter,
  ai: aiRouter,
  notifications: notificationsRouter,
  wallet: walletRouter,
  merchant: merchantRouter,
});

export type AppRouter = typeof appRouter;
