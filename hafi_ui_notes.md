# Hafi UI Notes from Uploaded PDF

## Source
- `/home/ubuntu/upload/HafiMobileApp.pdf`

## Pages 1-5 findings

| Page | Screen | Key findings |
|---|---|---|
| 1 | Splash | Centered Hafi logo on a strong green gradient background; clean, minimal launch state. |
| 2 | Onboarding 1 | Mobile-first onboarding card layout; rounded white card over soft mint illustration area; CTA button with rounded corners; clear benefit-driven copy focused on nearby service booking. |
| 3 | Onboarding 2 | Marketplace onboarding screen for local buying and selling; colorful illustration area; rounded orange CTA; supports dual app value proposition (services + commerce). |
| 4 | Auth signup | Phone-based account creation flow with country code, full name, social sign-in buttons (Google and Apple), large rounded inputs and CTA. |
| 5 | OTP verification | Six-digit verification flow with resend timer and large rounded confirmation button; implies phone verification is central to signup/login. |

## Design implications

| Theme area | Implication for architecture |
|---|---|
| Visual style | Modern, rounded, soft, mobile-native UI pattern that should be implemented consistently in shared design tokens. |
| Authentication | Phone OTP is a first-class auth path, alongside Google and Apple OAuth. |
| Product direction | The app combines service-booking and local marketplace flows from onboarding onward, so architecture should support both domains from the core data model. |
| UX | Friction should stay low with fast onboarding, strong CTA prominence, and simplified forms. |

## Palette note
The uploaded UI uses strong greens and warm accent colors. The user requested the final product direction to use a purple-and-gold palette, so the architecture document should preserve the same modern rounded UX language while allowing theme tokens to be updated.

## Pages 6-10 findings

| Page | Screen | Key findings |
|---|---|---|
| 6 | Home | Unified home feed combining services and marketplace items; search bar at top; location indicator; category shortcuts; horizontally scrollable service cards; trending items section; bottom navigation includes Home, Services, Market, Chat, Profile. |
| 7 | Discover | Map-based discovery view with category chips and provider list; geospatial search is a first-class discovery pattern. |
| 8 | Service detail / booking entry | Provider profile header, rating, distance, hours, service list with durations and prices, and add-to-booking actions. |
| 9 | Date/time selection | Calendar-based appointment selection with slot buttons; suggests provider availability is broken into discrete slots with live status. |
| 10 | Booking payment confirmation | Booking summary shows service fee and deposit percentage before confirmation; mobile money payment option visible in UI; payment collection can happen at booking time. |

## Additional architecture implications

| Theme area | Implication for architecture |
|---|---|
| Discovery | Search should support blended results or clearly separated domains for providers/services and marketplace items. |
| Geo features | Provider records need coordinates, searchable service areas, and map-friendly indexing. |
| Booking | Appointment model must support service duration, slot generation, deposit rules, booking status changes, and payment reconciliation. |
| Payments | Architecture should support multiple payment methods, including card providers and mobile money flows where relevant. |
| Navigation | Shared cross-module bottom navigation indicates chat and marketplace are core, not add-ons. |

## Pages 11-15 findings

| Page | Screen | Key findings |
|---|---|---|
| 11 | Marketplace feed | Dedicated marketplace tab with search, category chips, product grid cards, and bottom navigation parity with service flows. |
| 12 | Marketplace item detail | Product detail includes item condition, seller card with rating and location, description, message CTA, and buy CTA. |
| 13 | Sell / list item | Seller listing form includes photo upload, title, category, price, condition, and location before publishing. |
| 14 | Payment | Marketplace payment screen supports MTN Mobile Money, Airtel Money, and debit/credit card; emphasizes secure payment and buyer protection. |
| 15 | Account / bookings | Booking management screen groups appointments into upcoming, completed, and cancelled, with reschedule and cancel actions. |

## Additional architecture implications

| Theme area | Implication for architecture |
|---|---|
| Marketplace | Need item listing lifecycle, seller reputations, condition taxonomy, image handling, and location-aware catalog filtering. |
| Commerce messaging | Marketplace item pages include direct seller messaging, so chat must support marketplace and booking contexts. |
| Payments | Multi-method payment abstraction is required for both bookings and item purchases, with escrow/split considerations. |
| Order safety | Buyer protection language suggests dispute, refund, and moderation capabilities should be built into admin flows. |
| Account center | Customer profile area should aggregate orders, bookings, status history, and actions in one place. |

## Pages 16-20 findings

| Page | Screen | Key findings |
|---|---|---|
| 16 | Provider dashboard | Provider home emphasizes today's appointments, weekly appointment count, rating, revenue chart, and today's schedule. |
| 17 | Seller hub | Seller dashboard tracks active listings, total sales, earnings, and listing performance. |
| 18 | Chat | Unified messaging area includes both marketplace and booking conversations, searchable thread list, and real-time style chat composer. |
| 19 | Alerts / notifications | Notification center contains booking confirmations, chat alerts, payment receipts, and item engagement signals. |
| 20 | Profile | User profile can switch between buyer/customer and seller/provider contexts; includes personal info, payment methods, language, notifications, support, and logout. |

## Final architecture implications from UI brief

| Theme area | Implication for architecture |
|---|---|
| Multi-role system | Users can operate in multiple capacities, so role assignment should be flexible rather than hard-separated account silos. |
| Provider analytics | Event and transaction data must feed reporting views such as revenue, appointments, ratings, and listing performance. |
| Messaging | Chat needs conversation typing/context metadata to support both appointment threads and marketplace threads. |
| Notifications | Notification service must support multiple event sources and channels, plus in-app inbox storage. |
| Settings | Preferences, localization, payment method references, and profile switching should be modeled centrally at user/account level. |

