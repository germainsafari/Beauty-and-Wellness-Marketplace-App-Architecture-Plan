import { z } from "zod";
import {
  getNearbyProviders,
  getProviderDistricts,
  getServiceCategories,
  getServicesByProviderId,
} from "../../db/queries.js";
import { publicProcedure, router } from "../trpc.js";

export const discoveryRouter = router({
  categories: publicProcedure.query(() => getServiceCategories()),

  districts: publicProcedure.query(() => getProviderDistricts()),

  nearbyProviders: publicProcedure
    .input(
      z
        .object({
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          district: z.string().min(1).max(100).optional(),
        })
        .optional()
    )
    .query(({ input }) => getNearbyProviders(input ?? {})),

  providerServices: publicProcedure
    .input(z.object({ providerId: z.number() }))
    .query(({ input }) => getServicesByProviderId(input.providerId)),
});
