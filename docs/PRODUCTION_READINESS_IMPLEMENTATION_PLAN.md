# Hafi Production Readiness Implementation Plan

Last updated: 2026-07-05

This plan turns the current Hafi MVP into a production-ready beauty and wellness marketplace across API, web, and mobile. It is based on the current repo shape:

- API: `apps/api`, Express, tRPC, Socket.io, Drizzle, PostgreSQL, JWT bearer auth.
- Web: `apps/web`, Vite, React, React Router, Socket.io client.
- Mobile: `apps/mobile`, Expo SDK 54, React Native, SecureStore, Socket.io client.
- Domain: dual-role client/provider marketplace with bookings, listings, offers, payments, verification, chat, admin moderation, push, AI concierge, loyalty, and wallet.

The current app is a strong MVP, but it is still demo-oriented in several production-critical areas: phone-only auth without OTP, fallback JWT secrets, coarse roles, no permission table, demo payment state transitions, base64 uploads in Postgres, incomplete ownership checks, permissive CORS patterns, no rate limiting, limited observability, no test strategy, and no release gates.

## Reference Standards

Use these standards as implementation guardrails:

- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) for web/API security verification controls.
- [OWASP MASVS](https://mas.owasp.org/MASVS/) and [OWASP Mobile App Security](https://owasp.org/www-project-mobile-app-security/) for mobile app storage, network, platform, and privacy controls.
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) for authentication, authenticator lifecycle, sessions, and recovery.
- [SLSA](https://slsa.dev/) for source, dependency, build, and artifact integrity.

## Production Principles

1. Every mutation must prove identity, authorization, ownership, and idempotency where money or inventory can change.
2. Roles are not enough. Authorization must be permission-based and resource-aware.
3. Money, bookings, inventory, verification, and moderation are audit-led domains.
4. Uploads must move out of the primary database and into private object storage with signed URLs.
5. Realtime and push are convenience channels only; the database remains the source of truth.
6. Mobile secrets cannot be trusted. Treat all mobile clients as public clients.
7. Every release must pass automated security, regression, migration, and smoke checks.

## Phase 0: Immediate Production Blockers

Complete these before exposing real users or payments.

### Authentication

Current state:

- `apps/api/src/auth.ts` creates 30-day JWTs with `HS256`.
- `apps/api/src/env.ts` falls back to `hafi-dev-secret`.
- `auth.login` creates accounts by name and phone without OTP.
- Admin role is granted by a hardcoded phone number in `auth.login`.
- Web stores bearer tokens through `apps/web/src/lib/api.ts`; mobile uses SecureStore.

Required implementation:

- Remove the fallback JWT secret. Fail boot when `JWT_SECRET` is missing or shorter than 32 bytes in production.
- Replace demo phone login with OTP-backed auth:
  - `auth.startPhoneLogin(phone, purpose)` creates a short-lived challenge.
  - `auth.verifyPhoneLogin(phone, code, challengeId)` validates OTP and issues tokens.
  - Store hashed OTP codes, attempt counters, expiry, IP/device metadata, and consumed timestamp.
  - Rate limit by phone, IP, and device fingerprint.
- Add refresh-token rotation:
  - Access token TTL: 15 minutes.
  - Refresh token TTL: 30 days, stored hashed server-side.
  - Rotate refresh token on every refresh.
  - Revoke token family on reuse.
- Add session management:
  - `sessions` table with user, device label, created IP, last IP, user agent, last seen, revoked timestamp.
  - Web and mobile screens for "Active sessions" and "Sign out other devices".
- Remove hardcoded admin phone creation. Admin users must be created by a seed/admin command or a protected admin invite flow.
- Add account recovery controls:
  - Phone change requires re-authentication and OTP verification for both old and new phone when possible.
  - Email can be optional, but if added, verify ownership before use.

Acceptance criteria:

- Production boot fails without strong `JWT_SECRET`.
- A new user cannot create or sign in without OTP verification.
- Reusing a rotated refresh token revokes the whole session family.
- Admin role cannot be obtained by entering a special public phone number.

### Authorization and RBAC

Current state:

- User role enum is `customer`, `provider`, `admin`.
- `protectedProcedure` checks only authentication.
- `adminProcedure` checks only `ctx.user.role === "admin"`.
- Several routes rely on query helpers to enforce ownership, while some mutations do not visibly check ownership in the router.
- Socket.io allows any authenticated user to join any conversation room by ID.

Required implementation:

- Add permission-based RBAC tables:
  - `roles`: `id`, `key`, `name`, `description`, `isSystem`.
  - `permissions`: `id`, `key`, `description`, `resource`, `action`.
  - `role_permissions`: role to permission.
  - `user_roles`: user to role, optional `scopeType`, `scopeId`, `grantedById`, `expiresAt`.
- Keep simple user persona fields for UX, but move security decisions to permissions.
- Add authorization helpers in `apps/api/src/trpc/trpc.ts`:
  - `requirePermission(permissionKey)`.
  - `requireAnyPermission(permissionKeys)`.
  - `requireResourceOwner(loadResource, ownerSelector)`.
  - `requireMerchantProfileOwner(providerId)`.
- Enforce resource ownership in routers:
  - Booking cancellation: customer owns booking or provider owns provider profile.
  - Payment read/status: user owns payment, merchant owns related resource, or finance/admin permission.
  - Listing status edits: seller owns listing or moderator permission.
  - Offers: buyer owns sent offer; seller owns listing for received offer actions.
  - Verification documents: user owns document or verification reviewer permission.
  - Upload reads: owner/admin only unless explicitly public listing image.
- Fix Socket.io room joins:
  - On `chat:join`, query conversation membership before joining.
  - On typing/read events, verify the user is a participant.
  - Never emit sensitive payloads to rooms joined only by client-provided IDs.

Suggested permission keys:

| Role | Permissions |
| --- | --- |
| `customer` | `booking:create`, `booking:read_own`, `booking:cancel_own`, `listing:buy`, `listing:favorite`, `offer:create`, `chat:use`, `profile:update_own`, `verification:submit`, `payment:read_own` |
| `merchant` | `merchant:dashboard`, `service:manage_own`, `booking:read_provider`, `booking:confirm_provider`, `booking:cancel_provider`, `listing:create`, `listing:update_own`, `listing:delete_own`, `offer:respond_own_listing`, `bundle:manage_own`, `boost:create_own` |
| `support_agent` | `user:read_limited`, `booking:read_all`, `order:read_all`, `chat:moderate_limited`, `refund:request` |
| `verification_reviewer` | `verification:read_queue`, `verification:approve`, `verification:reject`, `upload:read_verification` |
| `moderator` | `listing:moderate`, `review:moderate`, `user:suspend`, `audit:read_moderation` |
| `finance_admin` | `payment:read_all`, `refund:approve`, `wallet:adjust`, `payout:manage`, `audit:read_finance` |
| `super_admin` | All permissions, role management, platform settings |

Acceptance criteria:

- Every protected mutation has an explicit permission and resource ownership rule.
- Admin UI can grant/revoke scoped roles without direct database edits.
- Audit log captures role changes, permission changes, and privileged reads.
- Socket.io rejects conversation joins for non-participants.

### Payments, Orders, Wallet, and Idempotency

Current state:

- `commerce.simulatePaymentStatus` can update any payment by ID.
- Demo payment providers exist alongside real-provider placeholders.
- Orders/payments are created directly from client requests.
- Wallet and loyalty are implemented but need ledger-grade controls.

Required implementation:

- Disable `simulatePaymentStatus` in production unless guarded by `payment:simulate` and `NODE_ENV !== "production"`.
- Add idempotency keys to payment/order/booking mutations:
  - `idempotency_keys`: user, endpoint, key, request hash, response snapshot, status, expiry.
  - Require `Idempotency-Key` for checkout, booking payment, boost payment, refund, wallet redemption.
- Integrate provider webhooks:
  - Stripe PaymentIntents and webhooks.
  - MTN MoMo and Airtel Money collection callbacks.
  - Verify webhook signatures/secrets.
  - Persist raw webhook event with dedupe key.
- Add state machines:
  - Payment: `pending -> processing -> succeeded|failed -> refunded|partially_refunded`.
  - Order: `pending_payment -> paid -> ready_for_pickup -> completed`, with dispute/refund branches.
  - Booking: `pending -> confirmed -> completed`, with cancellation/no-show branches.
- Add transactional inventory locking:
  - Buying a listing atomically reserves it.
  - Prevent duplicate purchase of same listing under concurrent requests.
  - Expire unpaid reservations.
- Add double-entry wallet ledger:
  - `wallet_accounts`, `wallet_entries`, `wallet_transactions`.
  - Never update balance without a ledger transaction.
  - Store reason, actor, reference type/id, before/after balance.

Acceptance criteria:

- Replaying checkout with the same idempotency key returns the same result.
- Duplicate concurrent listing purchases produce only one paid order.
- Production payment state changes only through verified provider webhook or privileged finance action.
- Wallet balance reconciles exactly from ledger entries.

### Uploads, Documents, and Media Safety

Current state:

- `uploads` table stores base64 file data.
- `GET /uploads/:id` is public if the ID is known.
- MIME type is accepted from client-provided metadata.

Required implementation:

- Move files to object storage:
  - S3, Cloudflare R2, or Render disk only for temporary MVP; prefer S3/R2.
  - Store metadata in `uploads`: owner, bucket key, byte size, detected MIME, SHA-256, visibility, scan status.
- Use server-generated signed upload URLs or multipart upload proxy.
- Validate files by content sniffing, not only declared MIME.
- Add malware scanning for verification PDFs/images and marketplace images.
- Split visibility:
  - Public listing images: served through CDN after validation.
  - Avatars: public after validation.
  - Verification documents: private, signed read URLs only for owner/reviewer/admin.
- Add image processing:
  - Strip EXIF metadata.
  - Generate thumbnails and responsive sizes.
  - Enforce image count and dimensions.

Acceptance criteria:

- Verification documents are not accessible by guessed numeric IDs.
- Upload records include checksum, storage key, detected MIME, size, scan status.
- Listing image delivery does not load base64 from Postgres.

## Phase 1: Security Hardening

### API Hardening

Implement:

- `helmet` security headers for Express.
- Strict CORS:
  - No `origin: true` in production.
  - Remove generic `origin.endsWith(".vercel.app")` unless explicitly needed for preview deployments.
  - If preview deployments are allowed, validate against a project-specific pattern.
- Rate limits:
  - Auth OTP start/verify.
  - tRPC mutation endpoints.
  - Uploads.
  - AI chat.
  - Socket.io connection attempts.
- Request size limits per route.
- Central error handling that avoids leaking stack traces.
- Structured logging with request ID, user ID, route, latency, status, and error code.
- Input normalization:
  - Phone numbers to E.164.
  - Currency values as integer minor units or Decimal, never floating-point arithmetic.
  - Search/query length caps and escaping.
- Pagination:
  - Require cursor or bounded offset/limit for all list endpoints.
  - Add database indexes for list filters.

Recommended packages:

- `helmet`
- `express-rate-limit` or Redis-backed limiter for multi-instance deployments.
- `pino` plus `pino-http`
- `nanoid` or `ulid` for request IDs and public references.

### Database Hardening

Implement:

- Unique indexes:
  - users phone where phone is not null.
  - favorites `(user_id, listing_id)`.
  - push tokens token.
  - provider profile user ID.
  - active bundle rule per seller if only one rule is allowed.
- Foreign key delete behavior:
  - Use `onDelete` intentionally.
  - Prefer soft deletes for users, listings, orders, bookings, and messages.
- Migration workflow:
  - Replace production `drizzle-kit push` with generated migrations.
  - Migration dry-run in CI.
  - Rollback/backfill playbooks for risky changes.
- Audit tables:
  - `audit_events`: actor, action, target, old values, new values, IP, user agent, request ID.
  - Use append-only writes.
- Data retention:
  - Define retention for OTP challenges, sessions, verification docs, chat, logs, and payment records.

### Frontend and Mobile Security

Web:

- Store access tokens in memory where possible and refresh via secure, httpOnly cookies if same-origin deployment is used.
- If separate API/web origins remain, keep refresh tokens out of localStorage.
- Add route guards for admin/merchant/client views based on permissions returned by `auth.me`.
- Add Content Security Policy in production.
- Avoid rendering user-provided HTML. If rich text is added, sanitize strictly.

Mobile:

- Continue using SecureStore for refresh tokens.
- Do not embed API secrets in Expo config.
- Add certificate pinning only if the app will ship outside Expo Go in a native build and the operations team can rotate pins safely.
- Add jailbreak/root detection only as a risk signal, not a sole blocker.
- Add biometric app unlock as optional defense for wallet/admin actions.
- Add privacy permission explanations for location, camera/photos, and notifications.
- Use EAS builds for production artifacts, not Expo Go.

## Phase 2: Reliability, Observability, and Operations

### Health Checks and Readiness

Replace `/health` with layered probes:

- `/health/live`: process is running.
- `/health/ready`: database connectivity, migration state, object storage, queue, and critical env vars.
- `/health/version`: commit SHA, build timestamp, app version, environment.

Acceptance criteria:

- Render health checks use liveness.
- Deploy smoke tests use readiness and version.
- Failed database connectivity marks readiness as failed.

### Background Jobs and Queues

Add a queue for:

- Payment webhook processing.
- Push notifications.
- Email/SMS OTP delivery.
- Image processing and malware scanning.
- Booking reminders.
- Reservation expiry.
- Boost expiry.
- AI async tasks and moderation scans.

Recommended approach:

- For MVP: PostgreSQL-backed job table with `FOR UPDATE SKIP LOCKED`.
- For scale: Redis/Valkey with BullMQ or a hosted queue.

Acceptance criteria:

- User-facing requests do not block on push, image processing, or external webhook retries.
- Jobs are retryable, idempotent, and have dead-letter visibility.

### Observability

Implement:

- OpenTelemetry instrumentation for Express, Postgres, and outbound HTTP.
- Error tracking with Sentry or equivalent for API, web, and mobile.
- Product analytics for conversion funnels:
  - Sign-up started/completed.
  - Search used.
  - Provider viewed.
  - Booking started/completed.
  - Listing created.
  - Checkout started/completed.
  - Message sent.
- Operational dashboards:
  - API p50/p95/p99 latency.
  - Error rate by route.
  - Database connection count and slow queries.
  - Payment success/failure.
  - OTP send/verify success.
  - Push delivery failures.
  - Queue lag and dead letters.

### Backup and Disaster Recovery

Implement:

- Daily automated Postgres backups.
- Point-in-time recovery if provider supports it.
- Object storage lifecycle and backup strategy.
- Quarterly restore drill.
- Runbook for:
  - Bad deploy rollback.
  - Compromised admin account.
  - Payment provider outage.
  - Database migration failure.
  - Push provider degradation.

## Phase 3: Product Features for Launch Quality

### Trust and Safety

Add:

- User report flows for listings, profiles, messages, bookings, and reviews.
- Moderation queue with reason categories and evidence.
- User suspension, listing takedown, and appeal workflow.
- Block user feature.
- Review system with verified booking/purchase badges.
- Merchant verification tiers:
  - Phone verified.
  - ID verified.
  - Business verified.
  - Address verified.
- Risk scoring:
  - New account high-value listings.
  - Repeated cancelled bookings.
  - Many failed payment attempts.
  - Spam-like messages.

### Booking Features

Add:

- Provider availability schedule.
- Service duration buffers.
- Calendar conflict detection.
- Reschedule requests.
- Cancellation policy per provider/service.
- Deposits and no-show fees.
- Staff members per provider.
- Multi-service bookings.
- Booking reminders by push/SMS/email.
- Provider calendar sync export or integration.

### Marketplace Features

Add:

- Shipping or pickup workflows.
- Escrow/buyer protection rules.
- Returns/disputes.
- Seller vacation mode.
- Inventory quantities for beauty products.
- Variant support: shade, size, color, scent, volume.
- Draft listings.
- Listing quality checklist.
- Saved searches and search alerts.
- Personalized recommendations.

### Merchant Operations

Add:

- Merchant onboarding checklist.
- Business profile completion score.
- Service catalog bulk editor.
- Staff and permission management under a merchant account.
- Revenue, booking, repeat-client, cancellation, and conversion analytics.
- Payout settings and payout history.
- Tax/invoice fields where relevant.
- Promotions and coupons.
- Customer notes and client history.

### Client Experience

Add:

- Saved providers.
- Recently viewed items/services.
- Favorite merchants.
- Beauty profile/preferences.
- Location radius search.
- Waitlist for fully booked providers.
- Refund/dispute center.
- Notification preferences by channel and topic.

### AI Concierge Production Controls

Current AI concierge should be hardened before launch:

- Add per-user and per-IP AI rate limits.
- Add spend limits by day and month.
- Store model, prompt version, latency, token usage, and cost.
- Add safety filters for medical claims and unsafe beauty advice.
- Make AI recommendations cite internal listings/providers when possible.
- Add a "handoff to merchant/support" flow.
- Add redaction for phone, payment, and verification data before model calls.

## Phase 4: Testing and Release Gates

### Test Coverage

Add:

- Unit tests for auth, RBAC, payment state machines, booking conflict logic, wallet ledger, and upload validation.
- Integration tests for all tRPC routers using a test database.
- Realtime tests for conversation membership enforcement.
- Web E2E tests with Playwright:
  - Sign in.
  - Client booking.
  - Marketplace purchase.
  - Merchant listing creation.
  - Admin verification approval.
- Mobile E2E smoke tests:
  - Use Detox or Maestro for production-like builds.
  - At minimum, cover sign in, marketplace browse, booking creation, chat, and profile.
- Contract tests for payment webhooks.
- Migration tests:
  - Apply migrations to empty DB.
  - Apply migrations to seeded previous-version DB.

### CI/CD

Add GitHub Actions or equivalent:

- Install with locked dependencies.
- Typecheck all workspaces.
- Lint.
- Unit and integration tests.
- Build API, web, and mobile JS bundle.
- Dependency audit.
- Secret scanning.
- SAST.
- Generate SBOM.
- Build provenance aligned with SLSA principles.
- Run `npm run verify:prod`.

Release gates:

- No critical/high dependency vulnerabilities without explicit risk acceptance.
- Migrations pass dry-run.
- Smoke tests pass against staging.
- Feature flags configured.
- Rollback plan written for risky releases.

## Phase 5: Infrastructure and Environment Strategy

### Environments

Create:

- Local.
- Preview per PR.
- Staging with production-like services and anonymized data.
- Production.

Rules:

- Separate databases, object stores, API keys, payment accounts, push credentials, and OpenAI keys per environment.
- Never use production payment/webhook secrets in preview.
- Seed only non-sensitive demo data outside production.
- Use environment-specific CORS allowlists.

### Deployment Shape

Short-term:

- Keep Render monolith for API + web only if traffic is low and same-origin simplicity is desired.

Production target:

- API service.
- Web static hosting/CDN.
- Worker service.
- Managed Postgres.
- Object storage/CDN.
- Redis/Valkey or queue provider.

### Feature Flags

Add a feature flag system for:

- Real payments by provider.
- AI concierge.
- Boosts.
- Wallet redemption.
- New RBAC enforcement rollout.
- Merchant analytics.
- Verification automation.

## Implementation Backlog

### Sprint 1: Lock the Front Door

- Remove default JWT secret and add env validation.
- Add OTP challenge tables and phone verification.
- Add refresh-token rotation and sessions.
- Remove hardcoded admin phone.
- Add auth rate limits.
- Add tests for auth lifecycle.

### Sprint 2: RBAC and Ownership

- Add role/permission schema and seed system roles.
- Add `requirePermission` and ownership helpers.
- Update all routers to use explicit authorization.
- Fix Socket.io conversation join authorization.
- Add admin role-management UI.
- Add audit events for privileged actions.

### Sprint 3: Money and Inventory

- Disable demo payment simulation in production.
- Add payment/order idempotency keys.
- Add payment webhook tables and verified handlers.
- Add listing reservation and transaction locking.
- Add wallet ledger tables and reconciliation check.
- Add payment/order state-machine tests.

### Sprint 4: Uploads and Verification

- Add object storage provider.
- Replace base64 uploads with storage keys and signed URLs.
- Add file type sniffing, checksums, and scan status.
- Add private verification document access.
- Add image thumbnails and EXIF stripping.

### Sprint 5: Reliability Foundation

- Add structured logging, request IDs, and central error handling.
- Add liveness/readiness/version endpoints.
- Add queue and worker.
- Move push, reminders, image processing, and webhook retries to jobs.
- Add Sentry/OpenTelemetry.
- Add dashboards and alerts.

### Sprint 6: Launch Product Completeness

- Add provider availability and conflict detection.
- Add cancellation/reschedule policies.
- Add review/report/block flows.
- Add merchant onboarding checklist and staff permissions.
- Add saved searches, saved providers, and notification preferences.
- Add support/dispute center.

## Code Hotspots to Review First

- `apps/api/src/env.ts`: production env validation and secret requirements.
- `apps/api/src/auth.ts`: token TTL, refresh tokens, session lookup.
- `apps/api/src/trpc/trpc.ts`: permission middleware.
- `apps/api/src/trpc/routers/auth.ts`: OTP login and admin bootstrap removal.
- `apps/api/src/trpc/routers/admin.ts`: permission-scoped admin actions.
- `apps/api/src/trpc/routers/commerce.ts`: payment simulation, idempotency, ownership checks.
- `apps/api/src/trpc/routers/bookings.ts`: booking ownership and provider actions.
- `apps/api/src/trpc/routers/listings.ts`: listing ownership, moderation, transaction rules.
- `apps/api/src/uploads.ts`: object storage and private access.
- `apps/api/src/realtime.ts`: conversation membership checks.
- `apps/web/src/context/AuthContext.tsx`: token storage and permission-aware route guards.
- `apps/mobile/src/context/AuthContext.tsx`: session refresh and mobile-safe storage.

## Production Done Definition

The app is production-ready when:

- Users authenticate through verified phone/email flows with revocable sessions.
- Every route and realtime event has permission and ownership enforcement.
- Payment, booking, listing, wallet, upload, and verification flows are auditable.
- Real payment providers are integrated through verified webhooks.
- Uploads are scanned, access-controlled, and stored outside Postgres.
- Health checks, logs, traces, metrics, alerts, backups, and runbooks exist.
- Web and mobile builds pass automated regression and security gates.
- Admin capabilities are scoped, audited, and protected from accidental misuse.
- Staging can exercise the full client, merchant, admin, payment, chat, push, and verification lifecycle before each production deploy.
