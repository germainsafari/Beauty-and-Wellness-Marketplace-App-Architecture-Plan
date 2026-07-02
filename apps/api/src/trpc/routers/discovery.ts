import { z } from "zod";
import {
  getNearbyProviders,
  getServiceCategories,
  getServicesByProviderId,
} from "../../db/queries.js";
import { publicProcedure, router } from "../trpc.js";

export const discoveryRouter = router({
  categories: publicProcedure.query(() => getServiceCategories()),

  nearbyProviders: publicProcedure
    .input(z.object({ latitude: z.number().optional(), longitude: z.number().optional() }).optional())
    .query(({ input }) => getNearbyProviders(input ?? {})),

  providerServices: publicProcedure
    .input(z.object({ providerId: z.number() }))
    .query(({ input }) => getServicesByProviderId(input.providerId)),
});
