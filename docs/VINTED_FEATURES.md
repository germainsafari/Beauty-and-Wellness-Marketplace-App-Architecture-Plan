# Vinted Feature Parity — Hafi Marketplace Guide

Reference: [Vinted How it Works](https://www.vinted.com/how_it_works)

## Buyer (Client) Experience

| # | Vinted Feature | Hafi Status | Implementation |
|---|----------------|-------------|----------------|
| 1 | Feed with search & filters | ✅ | `/client/marketplace` |
| 2 | Category browse (beauty vertical) | ✅ | Category chips |
| 3 | Sort: trending, new, price | ✅ | Sort dropdown |
| 4 | Item grid (responsive masonry) | ✅ | CSS grid 2–6 cols |
| 5 | Item detail: photos, condition, brand | ✅ | `/client/marketplace/:id` |
| 6 | Seller mini-profile + rating | ✅ | Seller card |
| 7 | Buyer Protection badge | ✅ | Escrow banner |
| 8 | Make an offer (negotiate) | ✅ | Offer sheet + % chips |
| 9 | Buy Now (protected checkout) | 🔶 | Buy CTA + fee display |
| 10 | Favorites / wishlist | ✅ | Heart toggle |
| 11 | Message seller | ✅ | `/client/messages` |
| 12 | Order tracking | 🔶 | Orders tab |
| 13 | Refund / dispute flow | 🔶 | Dispute button |
| 14 | Reviews after purchase | 🔶 | Post-order review |
| 15 | Follow seller | ⬜ | Future |

## Seller (Merchant) Experience

| # | Vinted Feature | Hafi Status | Implementation |
|---|----------------|-------------|----------------|
| 1 | List item free (photos, title, price) | ✅ | `/merchant/listings/new` |
| 2 | Condition taxonomy | ✅ | new / like_new / good / fair |
| 3 | Category + brand + tags | ✅ | Listing form |
| 4 | Bump / boost visibility | 🔶 | Bump button (simulated) |
| 5 | Active / sold / reserved states | ✅ | Listing manager tabs |
| 6 | Offer inbox (accept/decline/counter) | ✅ | `/merchant/offers` |
| 7 | Earnings & wallet | ✅ | Merchant dashboard |
| 8 | Prepaid shipping label | ⬜ | Future (Rwanda logistics) |
| 9 | Seller stats (views, likes) | ✅ | Listing analytics |
| 10 | Bundle discount (same seller) | ⬜ | Future |
| 11 | Chat with buyers | ✅ | Messages (listing context) |
| 12 | Zero seller fees messaging | ✅ | Seller hub copy |

## Vinted UX Patterns Applied

- **Minimal chrome:** White cards, soft shadows, price-forward typography.
- **Trust layer:** Condition pills, verified badge, buyer protection always visible at checkout.
- **Negotiation-first:** Prominent "Make offer" when `isNegotiable`.
- **Responsive catalog:** 2-col phone → 3-col tablet → 4–6 col desktop.
- **Separate seller hub:** Not mixed with buyer feed (merchant `/merchant/listings`).

**Legend:** ✅ Implemented · 🔶 Partial · ⬜ Planned
