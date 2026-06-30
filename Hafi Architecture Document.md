# Hafi Architecture Document
**Beauty & Wellness Booking Marketplace**

## 1. System Overview
Hafi is a dual-domain platform that merges a Booksy-style beauty and wellness booking engine with a Vinted-style peer-to-peer (C2C) marketplace. The system serves three primary user roles—Customer, Provider, and Admin—and is designed with a modern, modular architecture capable of supporting real-time scheduling, location-based discovery, and secure escrow payments.

### Tech Stack
*   **Frontend**: React Native (iOS + Android) for mobile, Next.js for web
*   **Backend**: Node.js with NestJS (TypeScript, modular monolith transitioning to microservices)
*   **Database**: PostgreSQL (Primary Relational Data) + Redis (Caching, Queues, WebSocket state)
*   **Storage**: Azure Blob Storage (Media and Images)
*   **Payments**: Stripe (Deposits, Full Payments, Escrow) + MOMO API (Mobile Money / Split Payments)
*   **Location**: Google Maps API
*   **Real-time**: Socket.io (Chat, Live Availability)
*   **Auth**: JWT + OAuth2 (Google, Apple, OTP via Twilio/Local SMS gateway)

---

## 2. Project Folder Structure (Monorepo)

To ensure shared types, unified tooling, and consistent deployment across both the frontend applications and backend services, Hafi uses a monorepo structure (e.g., managed by Nx or Turborepo).

```text
hafi-monorepo/
├── apps/
│   ├── mobile-app/               # React Native (Expo) application
│   │   ├── src/
│   │   │   ├── assets/           # Fonts, icons, purple/gold theme tokens
│   │   │   ├── components/       # Reusable UI (rounded cards, animated buttons)
│   │   │   ├── navigation/       # React Navigation setup (Bottom tabs: Home, Services, Market, Chat, Profile)
│   │   │   ├── screens/          # Screen components organized by domain
│   │   │   │   ├── auth/         # OTP, OAuth, Signup
│   │   │   │   ├── booking/      # Service discovery, Calendar slots, Checkout
│   │   │   │   ├── marketplace/  # C2C item feed, Item details, Listing creation
│   │   │   │   ├── chat/         # Unified messaging UI
│   │   │   │   ├── profile/      # User/Provider toggle, Settings, Bookings history
│   │   │   │   └── provider/     # Provider dashboard, Revenue charts
│   │   │   ├── store/            # Redux/Zustand state management
│   │   │   ├── services/         # API clients, WebSocket hooks
│   │   │   └── utils/            # Helpers, date formatting, geo-calculations
│   │   ├── app.json              # Expo config
│   │   └── package.json
│   │
│   ├── web-admin/                # Next.js application for Admin dashboard
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router (Dashboard, Users, Disputes, Payouts)
│   │   │   ├── components/       # Admin UI components
│   │   │   └── lib/              # API clients
│   │   └── package.json
│   │
│   └── backend-api/              # NestJS backend application
│       ├── src/
│       │   ├── core/             # Shared logic, Guards, Interceptors, Filters
│       │   ├── modules/          # Domain-driven modules
│       │   │   ├── auth/         # OTP verification, OAuth, JWT generation
│       │   │   ├── users/        # User profiles, Role management (Customer, Provider, Admin)
│       │   │   ├── services/     # Provider service catalog, Pricing, Durations
│       │   │   ├── bookings/     # Appointment logic, Calendar slots, Rescheduling
│       │   │   ├── marketplace/  # C2C product listings, Categories, Conditions
│       │   │   ├── payments/     # Stripe & MOMO integrations, Escrow, Commissions
│       │   │   ├── chat/         # Socket.io gateways, Message persistence
│       │   │   ├── reviews/      # Ratings, Verified booking checks
│       │   │   ├── notifications/# Push, SMS, Email orchestration
│       │   │   └── loyalty/      # Points accumulation and redemption logic
│       │   ├── database/         # TypeORM / Prisma entities and migrations
│       │   └── main.ts           # Entry point
│       ├── test/                 # E2E and integration tests
│       └── package.json
│
├── packages/                     # Shared internal libraries
│   ├── shared-types/             # TypeScript interfaces (DTOs, Enums) used by frontend and backend
│   ├── ui-kit/                   # Shared React components (if sharing between Web Admin and Mobile)
│   ├── eslint-config/            # Unified linting rules
│   └── tsconfig/                 # Base TypeScript configurations
│
├── docker-compose.yml            # Local dev environment (PostgreSQL, Redis)
├── package.json                  # Root workspace dependencies
└── turbo.json                    # Turborepo build pipeline configuration
```

## 3. Database Schema (PostgreSQL)

The database design follows a normalized relational model, separating the core user domain from the booking and marketplace domains, while linking them via shared keys. The schema supports the dual-role nature of users (buying and selling) and unifies the payment and messaging systems.

### Core Tables

**Table: `users`**
Central table for all accounts. Users can act as customers, providers, or both.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `phone_number` | String | Unique | Primary login method |
| `email` | String | Unique, Nullable | Secondary contact |
| `full_name` | String | Not Null | Display name |
| `password_hash` | String | Nullable | Null for OAuth |
| `auth_provider` | Enum | Not Null | `LOCAL`, `GOOGLE`, `APPLE` |
| `role` | Enum | Not Null | `CUSTOMER`, `PROVIDER`, `ADMIN` |
| `loyalty_points` | Integer | Default: 0 | Points balance |
| `created_at` | Timestamp | Not Null | Creation time |
| `updated_at` | Timestamp | Not Null | Last update |

**Table: `provider_profiles`**
Details specific to users who offer services or sell items.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `user_id` | UUID | FK -> `users.id`, Unique | Link to base user |
| `business_name` | String | Not Null | Display name |
| `description` | Text | Nullable | Bio or details |
| `address` | String | Not Null | Physical location |
| `latitude` | Decimal | Not Null | For geo-search |
| `longitude` | Decimal | Not Null | For geo-search |
| `rating` | Decimal | Default: 0.0 | Aggregate score |
| `review_count` | Integer | Default: 0 | Total reviews |
| `stripe_account_id` | String | Nullable | Payment routing |
| `momo_account_number` | String | Nullable | Mobile money routing |

### Booking Domain

**Table: `service_categories`**
Taxonomy for booking services.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `name` | String | Unique | e.g., "Haircut", "Massage" |
| `icon_url` | String | Nullable | UI asset link |

**Table: `services`**
Specific offerings defined by providers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `provider_id` | UUID | FK -> `provider_profiles.id` | Owner |
| `category_id` | UUID | FK -> `service_categories.id` | Classification |
| `name` | String | Not Null | Display name |
| `description` | Text | Nullable | Details |
| `duration_minutes` | Integer | Not Null | For slot calculation |
| `price` | Decimal | Not Null | Base cost |
| `deposit_percentage` | Decimal | Default: 0 | Required upfront |
| `is_active` | Boolean | Default: true | Visibility flag |

**Table: `provider_availability`**
Weekly schedule configuration.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `provider_id` | UUID | FK -> `provider_profiles.id` | Owner |
| `day_of_week` | Integer | 0-6 | Sunday to Saturday |
| `start_time` | Time | Not Null | Shift start |
| `end_time` | Time | Not Null | Shift end |
| `is_available` | Boolean | Default: true | Working day flag |

**Table: `bookings`**
Appointments scheduled by customers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `customer_id` | UUID | FK -> `users.id` | Client |
| `provider_id` | UUID | FK -> `provider_profiles.id` | Service provider |
| `service_id` | UUID | FK -> `services.id` | Service booked |
| `scheduled_at` | Timestamp | Not Null | Start time |
| `end_time` | Timestamp | Not Null | Calculated end time |
| `status` | Enum | Not Null | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` |
| `total_price` | Decimal | Not Null | Final cost |
| `deposit_paid` | Decimal | Default: 0.0 | Amount prepaid |
| `created_at` | Timestamp | Not Null | Booking time |

### Marketplace Domain (C2C & B2C)

**Table: `marketplace_categories`**
Hierarchical taxonomy for physical items.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `name` | String | Unique | e.g., "Fashion", "Beauty" |
| `parent_id` | UUID | FK -> self, Nullable | For subcategories |

**Table: `marketplace_items`**
Products listed for sale by any user acting as a seller.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `seller_id` | UUID | FK -> `users.id` | Listing owner |
| `category_id` | UUID | FK -> `marketplace_categories.id` | Classification |
| `title` | String | Not Null | Display name |
| `description` | Text | Nullable | Item details |
| `price` | Decimal | Not Null | Asking price |
| `condition` | Enum | Not Null | `NEW`, `LIKE_NEW`, `GOOD`, `FAIR` |
| `status` | Enum | Not Null | `ACTIVE`, `PENDING_SALE`, `SOLD`, `HIDDEN` |
| `latitude` | Decimal | Not Null | For local discovery |
| `longitude` | Decimal | Not Null | For local discovery |
| `created_at` | Timestamp | Not Null | Listing time |

**Table: `item_images`**
Media gallery for marketplace items.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `item_id` | UUID | FK -> `marketplace_items.id` | Parent item |
| `image_url` | String | Not Null | CDN path |
| `is_primary` | Boolean | Default: false | Main thumbnail flag |

**Table: `orders`**
Purchases of marketplace items.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `buyer_id` | UUID | FK -> `users.id` | Purchaser |
| `seller_id` | UUID | FK -> `users.id` | Vendor |
| `item_id` | UUID | FK -> `marketplace_items.id` | Item bought |
| `status` | Enum | Not Null | `PENDING_PAYMENT`, `PAID`, `SHIPPED`, `DELIVERED`, `DISPUTED` |
| `total_amount` | Decimal | Not Null | Final cost |
| `platform_fee` | Decimal | Not Null | Commission |
| `created_at` | Timestamp | Not Null | Order time |

### Shared Domains (Payments, Chat, Reviews)

**Table: `transactions`**
Unified ledger for both bookings and marketplace orders.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `reference_type` | Enum | Not Null | `BOOKING`, `ORDER` |
| `reference_id` | UUID | Not Null | Points to `bookings.id` or `orders.id` |
| `user_id` | UUID | FK -> `users.id` | The payer |
| `amount` | Decimal | Not Null | Transaction value |
| `currency` | String | Default: 'RWF' | Currency code |
| `payment_method` | Enum | Not Null | `STRIPE`, `MOMO`, `AIRTEL` |
| `transaction_status` | Enum | Not Null | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED` |
| `external_txn_id` | String | Nullable | ID from Stripe/MOMO |
| `created_at` | Timestamp | Not Null | Record time |

**Table: `conversations`**
Chat threads linking users around a specific context.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `participant_one_id` | UUID | FK -> `users.id` | First user |
| `participant_two_id` | UUID | FK -> `users.id` | Second user |
| `context_type` | Enum | Not Null | `BOOKING`, `MARKETPLACE`, `GENERAL` |
| `context_id` | UUID | Nullable | ID of booking or item |
| `last_message_at` | Timestamp | Not Null | For sorting inbox |

**Table: `messages`**
Individual chat messages.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `conversation_id` | UUID | FK -> `conversations.id` | Parent thread |
| `sender_id` | UUID | FK -> `users.id` | Author |
| `content` | Text | Not Null | Message body |
| `is_read` | Boolean | Default: false | Read receipt flag |
| `created_at` | Timestamp | Not Null | Sent time |

**Table: `reviews`**
Unified review system for services and items.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique identifier |
| `reviewer_id` | UUID | FK -> `users.id` | Author |
| `target_type` | Enum | Not Null | `PROVIDER`, `ITEM`, `SELLER` |
| `target_id` | UUID | Not Null | Target entity ID |
| `reference_id` | UUID | Not Null | Booking/Order ID for verification |
| `rating` | Integer | 1-5 | Star score |
| `comment` | Text | Nullable | Review text |
| `created_at` | Timestamp | Not Null | Submission time |

## 4. REST API Endpoint Plan

The API is structured around domain-driven design principles. All endpoints expect `application/json` and return standard HTTP status codes. Authentication is handled via Bearer tokens (JWT).

### Authentication & Users
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/auth/request-otp` | Request SMS OTP for phone login | No |
| POST | `/api/v1/auth/verify-otp` | Verify OTP and return JWT | No |
| POST | `/api/v1/auth/oauth` | Login/Signup via Google/Apple token | No |
| GET | `/api/v1/users/me` | Get current user profile | Yes |
| PUT | `/api/v1/users/me` | Update profile settings | Yes |
| POST | `/api/v1/users/provider-onboard` | Upgrade customer to provider | Yes |

### Booking Domain
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/services/categories` | List service categories | No |
| GET | `/api/v1/providers/search` | Search providers by location/category | No |
| GET | `/api/v1/providers/:id` | Get provider profile and services | No |
| GET | `/api/v1/providers/:id/slots` | Get available time slots for a date | No |
| POST | `/api/v1/bookings` | Create a new appointment | Yes (Customer) |
| GET | `/api/v1/bookings` | List user's bookings (Upcoming/Past) | Yes |
| PUT | `/api/v1/bookings/:id/status` | Update booking status (Cancel/Complete) | Yes |
| GET | `/api/v1/provider/bookings` | List bookings for a provider | Yes (Provider) |

### Marketplace Domain
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/v1/marketplace/categories` | List item categories | No |
| GET | `/api/v1/marketplace/items` | Search/filter active items | No |
| GET | `/api/v1/marketplace/items/:id` | Get item details | No |
| POST | `/api/v1/marketplace/items` | Create a new item listing | Yes (Provider/Seller) |
| PUT | `/api/v1/marketplace/items/:id` | Update item listing | Yes (Owner) |
| POST | `/api/v1/marketplace/orders` | Create an order (Purchase item) | Yes (Customer) |
| GET | `/api/v1/marketplace/orders` | List user's buying/selling orders | Yes |
| PUT | `/api/v1/marketplace/orders/:id/status` | Update order status (Ship/Deliver) | Yes |

### Payments & Chat
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/v1/payments/intent` | Create Stripe/MOMO payment intent | Yes |
| POST | `/api/v1/payments/webhook` | Webhook for async payment status | No |
| GET | `/api/v1/chat/conversations` | List user's chat threads | Yes |
| GET | `/api/v1/chat/conversations/:id/messages` | Get messages in a thread | Yes |
| POST | `/api/v1/chat/messages` | Send a message (also via WebSocket) | Yes |

## References
[1] Booksy Architecture Case Study. Google Cloud. https://cloud.google.com/customers/booksy
[2] How to Build a Marketplace App Like Booksy. Ulan Software. https://ulansoftware.com/blog//how-to-build-marketplace-app-like-booksy
[3] Vinted Architecture and C2C Engineering. Ulan Software. https://ulansoftware.com/blog/how-to-build-second-hand-marketplace-like-vinted-technology
