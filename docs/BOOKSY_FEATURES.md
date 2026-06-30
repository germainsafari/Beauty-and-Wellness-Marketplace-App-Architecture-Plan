# Booksy Feature Parity — Hafi Implementation Guide

Reference: [Booksy for Customers](https://biz.booksy.com/en-us/features/customer-app), [Booksy Biz](https://biz.booksy.com/en-us)

## Client App (Booksy for Customers)

| # | Booksy Feature | Hafi Status | Route / Component |
|---|----------------|-------------|-------------------|
| 1 | Role entry — client vs business | ✅ | `/` RoleSelection |
| 2 | Discover nearby providers (map/list) | ✅ | `/client/discover` |
| 3 | Search + category filters | ✅ | Discover filters |
| 4 | Provider profile (portfolio, reviews, hours) | ✅ | `/client/provider/:id` |
| 5 | Service catalog with duration & price | ✅ | Provider detail |
| 6 | Real-time slot picker / calendar booking | ✅ | Booking flow modal |
| 7 | Book 24/7 without phone calls | ✅ | `bookings.create` API |
| 8 | Upcoming & past appointments | ✅ | `/client/bookings` |
| 9 | Reschedule appointment | 🔶 | Cancel ✅, reschedule UI |
| 10 | Cancel (per salon policy) | ✅ | `bookings.cancel` |
| 11 | Rebook past service in seconds | ✅ | Rebook button |
| 12 | Appointment reminders | 🔶 | Notifications list |
| 13 | In-app secure payments | 🔶 | Payment UI placeholder |
| 14 | Payment history & receipts | 🔶 | Profile → Payments |
| 15 | Gift cards | ⬜ | Future |
| 16 | Book for friends/family | ⬜ | Future |
| 17 | Reviews after completed visit | 🔶 | Review prompt UI |
| 18 | Favorites / saved providers | 🔶 | Heart on provider |
| 19 | Special offers & deals | 🔶 | Home banners |
| 20 | AI beauty concierge | ✅ | `/client/ai` |
| 21 | Profile & notification settings | ✅ | `/client/profile` |

## Merchant App (Booksy Biz)

| # | Booksy Biz Feature | Hafi Status | Route / Component |
|---|-------------------|-------------|-------------------|
| 1 | Business dashboard (today's snapshot) | ✅ | `/merchant` |
| 2 | Revenue & appointments KPIs | ✅ | Dashboard cards |
| 3 | Customizable calendar | ✅ | `/merchant/calendar` |
| 4 | Today's schedule timeline | ✅ | Calendar day view |
| 5 | Appointment status (confirm/complete/no-show) | ✅ | Calendar actions |
| 6 | Service listings + photos | ✅ | `/merchant/services` |
| 7 | Add/edit services & pricing | ✅ | Service form |
| 8 | Client cards / CRM | ✅ | `/merchant/clients` |
| 9 | Client visit history | 🔶 | Client detail drawer |
| 10 | Online booking link / profile | ✅ | Public provider profile |
| 11 | No-show & cancellation policy | 🔶 | Settings |
| 12 | Checkout & payments | 🔶 | Checkout modal |
| 13 | Sales reports | ✅ | `/merchant/analytics` |
| 14 | Staff management | ⬜ | Future (multi-staff) |
| 15 | Inventory / retail products | ⬜ | Future |
| 16 | Marketing (promotions, blasts) | 🔶 | Analytics promos tab |
| 17 | Reviews management | 🔶 | Merchant reviews tab |
| 18 | Marketplace seller hub (Hafi+) | ✅ | `/merchant/listings` |
| 19 | Offer inbox (negotiations) | ✅ | `/merchant/offers` |
| 20 | Business profile settings | ✅ | `/merchant/profile` |

**Legend:** ✅ Implemented · 🔶 Partial · ⬜ Planned

## Design Principles (from Booksy)

- **Client:** Discovery-first, minimal steps to book, large imagery, trust signals (reviews, verified).
- **Merchant:** Data-dense dashboard on desktop; action-first on mobile; calendar is home base.
- **Shared:** Purple/gold Hafi brand; never mix client and merchant nav in same shell.
