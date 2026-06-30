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

## Deploy

- **API** → Render (`render.yaml`)
- **Web** → Vercel (`vercel.json`, set `VITE_API_URL`)
