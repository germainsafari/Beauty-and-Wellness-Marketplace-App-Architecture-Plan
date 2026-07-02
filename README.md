# Hafi — Beauty & Wellness Marketplace

Dual-role platform: **Client** (Booksy-style booking + Vinted-style shopping) and **Merchant** (salon business + seller hub).

## Feature docs

- [Booksy parity guide](./docs/BOOKSY_FEATURES.md)
- [Vinted parity guide](./docs/VINTED_FEATURES.md)
- [Deploy Render + Vercel](./DEPLOY.md)

## Run locally

```bash
npm install
npm run api          # http://localhost:3001
npm run web          # http://localhost:5173 — responsive web (not mobile frame)
npm run mobile       # Expo SDK 54 — scan QR in terminal for Expo Go
```

Or API + web: `npm run dev`

## Entry flow

1. Choose **Client** or **Merchant** at sign-in
2. **Client** → discover salons, marketplace, bookings, AI concierge
3. **Merchant** → dashboard, calendar, services, listings, offers, analytics
4. Switch modes anytime from Profile

## Web responsive layout

| Device | Client | Merchant |
|--------|--------|----------|
| Phone | Bottom nav | Bottom nav (dark) |
| Tablet | Sidebar + wide grid | Sidebar + dashboard cards |
| Desktop | 240px sidebar, max-w-7xl content | Dark sidebar, analytics layout |

## Expo Go (SDK 54)

- Upgraded to **Expo SDK 54** — compatible with current Expo Go
- Run `npm run mobile` in an **interactive terminal** to see the QR code
- `:8081` in browser = manifest JSON (normal, not the UI)

## Feature status (MVP)

| Feature | API | Web | Mobile |
|---------|-----|-----|--------|
| Admin console (tabs, moderation, audit log) | ✅ | ✅ | — |
| Post-login home dashboard | ✅ | ✅ | ✅ |
| Real-time chat (Socket.io, typing, read receipts) | ✅ | ✅ | ✅ |
| Push notifications (Expo push, auto-disable dead tokens) | ✅ | bell + prefs | ✅ |
| Payments (demo instant; MoMo/Airtel/Stripe simulated intents) | ✅ | ✅ | ✅ |
| Identity verification (photo upload → admin review) | ✅ | ✅ | ✅ |
| Boost listing (paid, ranked first, auto-expiry) | ✅ | ✅ | ✅ |
| Bundle discounts (same-seller, applied at checkout) | ✅ | ✅ | rule editor |
| Near Me (geolocation, Kigali districts, Leaflet map) | ✅ | ✅ | ✅ |
| Loyalty points (earn + redeem to wallet) | ✅ | ✅ | ✅ |
| Social sharing (WhatsApp / X / copy / native) | — | ✅ | ✅ |
| i18n (EN / RW / FR / SW) | ✅ | ✅ | ✅ |

Demo sign-in is phone-only. Accounts: admin `+250780000000`, clients `+250780000002` / `+250780000004`, merchants `+250780000001` / `+250780000003` — or use the one-tap demo buttons on the sign-in page.

## Deploy

- **Monolith** → one Render service serving web + API (see `DEPLOY.md` §0)
- **API** → Render (`render.yaml`)
- **Web** → Vercel (`vercel.json`, set `VITE_API_URL`)
