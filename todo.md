# Hafi Marketplace — Project TODO

## Backend & Database
- [x] Full-stack upgrade (web-db-user, tRPC, PostgreSQL/MySQL)
- [x] Database schema: users, listings, bookings, offers, orders, reviews, messages, conversations, notifications, providerProfiles, reports, services, walletTransactions
- [x] All 16 tables created in production database
- [x] listings router: create, list, search, get, update, delete, myListings, bump, favorite
- [x] offers router: create, respond (accept/decline/counter), mine, myReceivedOffers
- [x] bookings router: create, list, get, cancel, reschedule
- [x] orders router: create, list, get, confirm receipt, dispute
- [x] reviews router: create, list by listing, list by seller
- [x] chat router: conversations, messages, send
- [x] notifications router: mine, markAllRead
- [x] wallet router: balance, transactions, withdraw
- [x] users router: profile, updateProfile, uploadAvatar, providerProfile
- [x] admin router: stats, users, listings, reports, resolveReport
- [x] File upload via storagePut (S3) for listing images and avatars

## Frontend — Pages
- [x] Home / Splash screen (unauthenticated landing)
- [x] Marketplace Feed (search, category filters, grid/list toggle, masonry cards)
- [x] Item Detail (image carousel, offer flow, escrow info, seller card, reviews)
- [x] Create Listing (multi-step: photos → details → pricing → publish)
- [x] Seller Hub (wallet card, listings manager, offer inbox, analytics tab)
- [x] Seller Profile Page (public profile, listings grid, reviews)
- [x] Chat / Messages (conversation list + message thread)
- [x] Notifications (bell icon, mark all read, type icons)
- [x] Bookings (upcoming/past appointments, cancel/reschedule)
- [x] Profile (account info, edit profile, logout)

## Frontend — Components
- [x] AppLayout (responsive: desktop sidebar + mobile bottom nav + top header)
- [x] MarketplaceCard (masonry card with condition badge, heart, price)
- [x] FilterBottomSheet (price range, condition, category, distance)
- [x] OfferBottomSheet (make offer, quick % chips, counter-offer flow)
- [x] SellerProfile (rating, verified badge, stats, reviews)
- [x] BottomNav (5 tabs: Home, Marketplace, Bookings, Messages, Alerts)

## Design System
- [x] Purple (#6C3FC5) + Gold (#F5A623) brand palette
- [x] Poppins + Inter + Space Grotesk fonts
- [x] Responsive layout: desktop sidebar (240px) + mobile bottom nav (60px)
- [x] Smooth CSS transitions and hover states
- [x] Empty states with icons for all data-less views
- [x] Auth-gated pages with Sign In CTAs

## MVP features (completed 2026-07-02)
- [x] Home dashboard (post-login): featured listings, categories, loyalty points
- [x] Real-time chat with WebSockets (Socket.io) — web + mobile, typing + read receipts
- [x] Push notifications — Expo push delivery, preference-aware, dead-token auto-disable
- [x] Payment intents: demo instant + MTN MoMo / Airtel Money / Stripe simulated (real provider APIs pending)
- [x] Identity verification flow (ID photo upload → admin review queue → verified badge)
- [x] Listing Boost paid feature (RWF 1,000/day, ranks first, auto-expiry)
- [x] Bundle discount logic (same-seller rule, quoted + applied at checkout)
- [x] Admin panel UI (/admin: overview, verification, users, listings, bookings, orders, audit log)
- [x] Near Me: geolocation, Kigali district filters, Leaflet map (web), Open-in-Maps (mobile)
- [x] Loyalty points: earn on bookings/orders + redeem to wallet (1 pt = RWF 10)
- [x] Share listing to WhatsApp / X / copy link / native share

## Future
- [ ] Real MTN MoMo / Airtel / Stripe API integration + webhooks (simulate via commerce.simulatePaymentStatus today)
- [ ] Provider onboarding flow
- [ ] Web push (service worker) — mobile push works via Expo
- [ ] Loyalty redemption at checkout (currently redeems to wallet credit)
