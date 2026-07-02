# Hafi MVP Execution Plan

Date: 2026-07-01

## Current Baseline

- Monorepo apps: `apps/api` Express/tRPC/Postgres, `apps/web` Vite React, `apps/mobile` Expo SDK 54.
- Verified clean on 2026-07-01:
  - `npm run web:build`
  - `npx tsc -p apps/api/tsconfig.json --noEmit`
  - `npx tsc -p apps/mobile/tsconfig.json --noEmit`
- Existing demo users from `npm run db:seed && npm run db:seed:demo`:
  - Client: Zara Glow, `+250780000002`
  - Client: Bella Cosmetics, `+250780000004`
  - Merchant: Amara Beauty, `+250780000001`
  - Merchant: Lux Hair Studio, `+250780000003`

## Market References

- Booksy positions itself around client discovery, 24/7 booking, appointment management, calendars, payments, client management, marketing, and reports: [Booksy Biz features](https://biz.booksy.com/en-us/features).
- Vinted centers buyer/seller marketplace flows: listings, search, buyer protection, offers, favorites, chat, order handling, paid visibility boosts, and wardrobe/showcase promotion: [Vinted help: Showcase](https://www.vinted.com/help/452-using-wardrobe-spotlight) and [Vinted how it works](https://www.vinted.com/how_it_works).
- Rwanda should be treated as mobile-money-first. Rwanda's FinScope 2024 reports about 86% of Rwandans own or have used mobile money, with registered mobile wallets rising to 77% of adults: [NISR FinScope Survey 2024](https://statistics.gov.rw/statistical-publications/business-establishment-finance-trade/finscope-survey-2024).
- GSMA reports mobile money merchant payments as the fastest-growing mobile-money use case in 2025: [GSMA State of the Industry Report](https://www.gsma.com/sotir/).

## Feature Parity Matrix

| Area | Booksy Equivalent | Vinted Equivalent | Hafi MVP Plan |
|---|---|---|---|
| Entry and roles | Client/business app split | Buyer/seller split | Keep client/merchant role switch; add admin role route and guards. |
| Discovery | Nearby providers, categories, profiles | Marketplace feed and search | Merge beauty services and beauty resale into one local discovery surface with tabs for services, products, and nearby providers. |
| Booking | 24/7 booking, calendar, reschedule, cancel, reminders | N/A | Complete booking lifecycle: slot availability, confirm, reschedule, cancel policy, reminders. |
| Merchant operations | Dashboard, calendar, services, clients, reports | Seller hub, listings, offers, wallet | Keep separate merchant shell; add client CRM, payment status, listing boost, order status, and analytics. |
| Chat | Client/provider messages | Buyer/seller messages | Upgrade persisted chat to Socket.io live delivery, typing/read states, and push triggers. |
| Payments | Online payments, receipts, no-show protection | Buyer protection, checkout, wallet | MVP should prioritize MTN MoMo/Airtel Money payment intents, then Stripe for cards/international users. |
| Trust | Reviews, verified profiles | Reviews, buyer protection | Add ID upload, verification review queue, verified badges, dispute basics, and review prompts. |
| Promotion | Marketing tools | Bumps/showcase | Add paid boost listing and salon promo campaign primitives. |
| Retention | Rebook, reminders | Favorites, follows | Add loyalty points, referral/social sharing, favorites, rebook, and bundles. |

## Rwanda-Specific Differentiators

1. Mobile-money-first checkout
   - Primary payment choices: MTN MoMo and Airtel Money.
   - Use phone-number payment requests and clear pending/confirmed/failed states.
   - Stripe remains optional for cards and diaspora purchases.

2. Kigali-first "Near Me"
   - Google Maps provider search with distance, district, and pickup/visit mode.
   - Default demo locations: Kigali, Kimihurura, Kacyiru, Remera, Nyamirambo, Nyarutarama.
   - Support "service at salon", "home visit", and "pickup point" because beauty commerce often mixes services and product handoff.

3. Low-friction trust
   - National ID/passport upload for merchants and high-value sellers.
   - Manual admin verification for MVP, with audit trail and status badges.
   - In-app chat warning against off-platform payment for buyer protection.

4. Beauty community layer
   - Bundle discounts for same-seller beauty products.
   - Event-ready packages: bridal makeup, hair, nails, lashes, products.
   - Loyalty points for booking completion, paid order completion, reviews, and referrals.

5. Lightweight performance
   - Optimize for mid-range Android phones and unstable mobile networks.
   - Paginate feeds, lazy-load images, cache API responses on mobile, keep screens usable while requests refresh.

## MVP Feature Workstreams

Each agent owns one feature until it is complete across API, web, mobile where relevant, seeded demo data, and tests.

| Agent | Feature | Deliverables | Acceptance Gate |
|---|---|---|---|
| Agent 1 | Admin panel | Active `/admin` route, admin role guard, dashboard cards, users/providers/listings/bookings/verification queues. | Admin demo login can approve/reject ID verification and inspect marketplace activity. |
| Agent 2 | Post-login home | Replace splash-like home with featured listings, nearby providers, upcoming bookings, loyalty points, recent offers. | Client demo user lands on useful dashboard within 2 seconds after login. |
| Agent 3 | Real-time chat | Socket.io server, authenticated rooms, live message push, typing/read state, web/mobile clients. | Two demo accounts see messages without refresh. |
| Agent 4 | Push notifications | Expo push tokens, web push-ready abstraction, notification preferences, triggers for booking/offer/chat/payment. | Expo Go device receives booking/offer/chat demo notifications. |
| Agent 5 | Payments | Payment tables, payment intent API, MTN MoMo/Airtel abstraction, Stripe fallback, webhook handlers, receipts. | Demo checkout can simulate MoMo success/failure and mark booking/order paid. |
| Agent 6 | Identity verification | Upload metadata, document status, admin review UI, verified badge rules. | Merchant uploads ID, admin approves, badge appears on profile/listings. |
| Agent 7 | Boost listing | Boost purchase flow, boosted ranking window, merchant boost UI, analytics counter. | Boosted demo listing ranks above normal active listings until expiry. |
| Agent 8 | Bundle discounts | Cart/bundle model, same-seller discount rules, offer integration, checkout totals. | Buyer can bundle two same-seller listings and see discounted total. |
| Agent 9 | Google Maps Near Me | Provider/listing geocoding, distance sort, map/list toggle, district filters. | User can sort Kigali demo providers by distance and view map pins. |
| Agent 10 | Loyalty and sharing | Points ledger, earn/redeem rules, referral/social share links, UI surfaces. | Completed booking/order grants points; share link opens correct listing/provider. |
| Agent 11 | Reliability/performance | API indexes, pagination, loading/error states, bundle analysis, image optimization. | Feed and dashboard stay responsive on mobile viewport and seeded demo DB. |
| Agent 12 | QA/deploy | Playwright smoke tests, API route tests, Expo checks, Render/Vercel env docs, demo script. | One command validates build, typecheck, seed assumptions, and critical flows. |

## Data Model Additions

Add tables or columns through Drizzle:

- `admin_actions`: admin audit log.
- `verification_requests`: user ID uploads, status, reviewer, reviewedAt.
- `payments`: booking/order/boost payment state, provider, amount, currency, external reference.
- `orders`: listing purchase lifecycle, buyer, seller, status, protection fee, delivery/pickup mode.
- `boosts`: listingId, paymentId, startsAt, expiresAt, scope.
- `bundle_rules`: sellerId, minItems, discountPercent.
- `loyalty_ledger`: userId, points, reason, reference type/id.
- `push_tokens`: userId, platform, token, enabled.
- `reviews`: strengthen existing route with booking/order reference enforcement.
- `locations`: normalized lat/lng for providers, listings, pickup points.

## Deployment Plan

1. Keep monolith API on Render for MVP.
   - One Express process: REST health, tRPC, Socket.io, webhook endpoints.
   - Postgres on Neon or Render Postgres.
   - Background jobs can start as cron-like in-process tasks only for MVP, then move to a worker if needed.

2. Keep web on Vercel.
   - Vite static build.
   - `VITE_API_URL` points to Render API.
   - Socket URL derived from API URL.

3. Keep Expo mobile app API-compatible.
   - Expo Go must work with LAN API locally.
   - Future Android/iOS deployment uses EAS with `EXPO_PUBLIC_API_URL` set per environment.

4. Render-only fallback.
   - If Vercel split becomes a blocker, serve `apps/web/dist` from Express in production and deploy one Render web service.

## Test Strategy

Absolute 100% bug-free cannot be guaranteed, but MVP can require a release gate that blocks known regressions:

- Unit/API: auth, listings, offers, bookings, payments, loyalty ledger, verification state transitions.
- Integration: seed DB, login as all demo users, create booking, accept booking, send chat, create offer, accept offer, simulate payment, approve verification.
- E2E web: Playwright desktop/tablet/mobile widths for client, merchant, admin.
- Mobile: TypeScript, Expo startup, key screen smoke checks, API connectivity error states.
- Performance: feed pagination, image lazy loading, API query timing, Lighthouse/mobile checks.
- Deployment: Render health, Vercel page load, CORS, Socket.io connection, webhook secret validation.

## Implementation Order

1. Baseline hardening
   - Add test runner and smoke tests.
   - Add admin route shell.
   - Normalize demo credentials and seed an admin user.

2. MVP trust and transaction core
   - Payments, orders, identity verification, admin review.
   - This unlocks real marketplace and booking use.

3. Retention and communication
   - Real-time chat, push notifications, loyalty points, social sharing.

4. Discovery and monetization
   - Google Maps Near Me, boost listing, bundle discounts, featured home dashboard.

5. Deploy and demo polish
   - Render/Vercel production config.
   - One repeatable demo script covering client, merchant, and admin flows.
