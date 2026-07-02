import { authRouter } from "./routers/auth.js";
import { adminRouter } from "./routers/admin.js";
import { commerceRouter } from "./routers/commerce.js";
import { discoveryRouter } from "./routers/discovery.js";
import { listingsRouter } from "./routers/listings.js";
import { bookingsRouter } from "./routers/bookings.js";
import { chatRouter } from "./routers/chat.js";
import { aiRouter, notificationsRouter, walletRouter } from "./routers/ai.js";
import { merchantRouter } from "./routers/merchant.js";
import { pushRouter } from "./routers/push.js";
import { profileRouter, HELP_TOPICS } from "./routers/profile.js";
import { verificationRouter } from "./routers/verification.js";
import { publicProcedure, router } from "./trpc.js";

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  listings: listingsRouter,
  bookings: bookingsRouter,
  chat: chatRouter,
  commerce: commerceRouter,
  discovery: discoveryRouter,
  ai: aiRouter,
  notifications: notificationsRouter,
  push: pushRouter,
  verification: verificationRouter,
  profile: profileRouter,
  help: router({ topics: publicProcedure.query(() => HELP_TOPICS) }),
  wallet: walletRouter,
  merchant: merchantRouter,
});

export type AppRouter = typeof appRouter;
