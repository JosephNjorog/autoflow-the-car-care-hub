# AutoFlow — Milestones & Roadmap

> **AutoFlow — The Car Care Hub** is a full-stack, multi-role SaaS platform enabling car wash businesses in Kenya to accept M-Pesa and Avalanche-based crypto payments. Built with React 18, Vercel Serverless Functions, and Neon PostgreSQL.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Milestones Achieved](#milestones-achieved)
   - [M1 · Core Platform & Authentication](#m1--core-platform--authentication)
   - [M2 · Booking System & Escrow Logic](#m2--booking-system--escrow-logic)
   - [M3 · M-Pesa Payment Integration](#m3--m-pesa-payment-integration)
   - [M4 · Crypto Payments on Avalanche](#m4--crypto-payments-on-avalanche)
   - [M5 · Tether WDK Embedded Wallet](#m5--tether-wdk-embedded-wallet)
   - [M6 · Chainlink On-Chain Price Feeds](#m6--chainlink-on-chain-price-feeds)
   - [M7 · Owner Business Management](#m7--owner-business-management)
   - [M8 · Detailer Workflow & Earnings](#m8--detailer-workflow--earnings)
   - [M9 · Customer Experience Layer](#m9--customer-experience-layer)
   - [M10 · Loyalty Points System](#m10--loyalty-points-system)
   - [M11 · Admin & Approvals System](#m11--admin--approvals-system)
   - [M12 · Email Notification System](#m12--email-notification-system)
   - [M13 · Analytics Dashboard](#m13--analytics-dashboard)
   - [M14 · Google OAuth](#m14--google-oauth)
   - [M15 · Staff Management (Offline + Online)](#m15--staff-management-offline--online)
   - [M16 · Photo Documentation (Before/After)](#m16--photo-documentation-beforeafter)
3. [Architecture Highlights](#architecture-highlights)
4. [Database Schema Summary](#database-schema-summary)
5. [Roadmap](#roadmap)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 18.3.1 |
| Language | TypeScript | 5.8.3 |
| Build Tool | Vite | 5.4.19 |
| Routing | React Router DOM | 6.30.1 |
| State / Data Fetching | TanStack React Query | 5.83.0 |
| UI Components | shadcn/ui + Radix UI | latest |
| Styling | Tailwind CSS | 3.4.17 |
| Animations | Framer Motion | 12.34.3 |
| Forms | React Hook Form | 7.61.1 |
| Charts | Recharts | 2.15.4 |
| Wallet SDK | @tetherto/wdk + wdk-wallet-evm | 1.0.0-beta |
| Blockchain Library | ethers.js | 6.16.0 |
| Backend | Vercel Serverless Functions (@vercel/node) | 5.1.6 |
| Database | Neon PostgreSQL (@neondatabase/serverless) | 0.10.4 |
| Authentication | jsonwebtoken + bcryptjs | 9.0.2 / 2.4.3 |
| Email | Nodemailer (Brevo SMTP) | 6.9.16 |
| Photo Storage | Cloudinary | API v2 |
| Deployment | Vercel Hobby (12-function limit) | — |

---

## Milestones Achieved

### M1 · Core Platform & Authentication

**Status: ✅ Shipped**

A complete multi-role authentication system from scratch, supporting four distinct user types with role-based access control.

**What was built:**
- JWT-based authentication (7-day expiry, auto-logout on 401)
- Four user roles: `customer`, `detailer`, `owner`, `admin`
- Email + password registration with bcrypt hashing
- Password reset flow via tokenized email links (1-hour expiry)
- Role-specific dashboard routing and protected routes
- Owner approval gating — owners start as `approval_status='pending'` and cannot access the dashboard until an admin approves them
- Persistent auth state via `localStorage` with auto-restore on page load
- `requireAuth()` middleware used across all 12 API endpoints

**Key files:**
- `api/auth/[[...slug]].ts` — login, register, me, forgot-password, google, google-callback, submit-kyc
- `api/_lib/auth.ts` — JWT helpers, `requireAuth()` middleware
- `src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`
- `src/components/ProtectedRoute.tsx` — Role guard HOC

---

### M2 · Booking System & Escrow Logic

**Status: ✅ Shipped**

A complete booking lifecycle system with escrow protection for customers — funds are held and only released after service completion.

**What was built:**
- 3-step booking wizard: browse services → select vehicle/time/payment → checkout
- Booking statuses: `pending → confirmed → in_progress → completed / cancelled`
- Payment statuses: `pending → captured → released / failed`
- **Escrow mechanism:** When M-Pesa/crypto payment is captured, funds are held (`payment_status='captured'`). They auto-release to `released` after 2 hours if the customer doesn't dispute — OR are manually released by the customer confirming completion
- Auto-release background job runs on every `GET /api/bookings` call (serverless-friendly pattern)
- `payment_timing` field: `'now'` (charge immediately) vs. `'pickup'` (charge at arrival)
- Transaction record created alongside every booking
- Notifications created for owners on new bookings
- Post-completion: customers can submit a rating (1–5) and written review

**Key files:**
- `api/bookings/[[...slug]].ts`
- `src/pages/BookService.tsx` — Booking wizard (37KB, most complex frontend component)
- `src/pages/CustomerBookings.tsx` — Booking history + review submission

---

### M3 · M-Pesa Payment Integration

**Status: ✅ Shipped**

Full Safaricom Daraja API integration — the most widely used payment method in Kenya.

**What was built:**
- M-Pesa STK Push initiation (`POST /api/payments/mpesa-stk`) — sends a payment prompt directly to the customer's phone
- Safaricom async webhook handler (`POST /api/payments/mpesa-callback`) — processes payment outcome, updates transaction and booking status, awards loyalty points, sends notifications
- Payment status polling: frontend polls `GET /api/payments/status` every 3 seconds (max 20 attempts) for real-time feedback without websockets
- M-Pesa code stored in `transactions.mpesa_code` for receipts
- Merchant Request ID and Checkout Request ID tracked for reconciliation
- Sandbox/production config via environment variables
- Graceful handling of Daraja API errors with user-facing messages

**Payment flow:**
```
Customer enters phone
  → POST /api/payments/mpesa-stk
  → Safaricom sends STK Push to phone
  → Frontend polls status every 3s
  → Customer approves on phone
  → Safaricom POSTs to /api/payments/mpesa-callback
  → booking.payment_status = 'captured'
  → Escrow period begins (2 hours)
```

**Key files:**
- `api/payments/[[...slug]].ts` — mpesa-stk, mpesa-callback, status, transactions
- `src/pages/BookService.tsx` — STK Push initiation + polling UI

---

### M4 · Crypto Payments on Avalanche

**Status: ✅ Shipped**

USDT and USDC payments on Avalanche C-Chain via injected wallets (MetaMask, Core, Trust Wallet).

**What was built:**
- ERC-20 token transfer using ethers.js v6
- Network detection + auto-switch to Avalanche C-Chain (`chainId: 0xa86a`)
- Dual-transfer: 10% fee to AutoFlow's wallet, 90% to service owner's registered wallet address
- If owner has no wallet registered, 100% goes to AutoFlow wallet (no funds lost)
- Transaction hash stored in `transactions.crypto_tx_hash` for on-chain verification
- Token support: USDT (`0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7`) and USDC (`0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`) on mainnet
- Fuji testnet support for development (both tokens: Circle's test token `0x5425890...`)
- KES price displayed in-app with real-time conversion

**Key files:**
- `src/lib/crypto.ts` — Injected wallet detection, chain switching, ERC-20 transfers
- `src/pages/BookService.tsx` — Crypto checkout UI

---

### M5 · Tether WDK Embedded Wallet

**Status: ✅ Shipped**

A self-custodial, browser-based wallet using Tether's WDK (Wallet Development Kit) — no browser extension required.

**What was built:**
- 12-word BIP-39 seed phrase generation via `WDK.getRandomSeedPhrase(12)`
- HD wallet derivation using `WalletManagerEvm(seed).getAccount(0)` → Avalanche C-Chain address
- Seed phrase stored in `localStorage` (encryption via WebCrypto AES-GCM is on the roadmap)
- UX: seed phrase displayed once with copy button + mandatory backup checkbox before funding is allowed
- Wallet restore from existing seed phrase
- Forget wallet (clears localStorage, no server state)
- Live balance display: AVAX, USDT, USDC fetched from Avalanche RPC
- Private key wiped from memory via `account.dispose()` immediately after every transaction
- WDK wallet also used for service payments in BookService.tsx checkout step

**Key files:**
- `src/lib/wdk.ts` — WDK initialization, wallet creation, transfer
- `src/pages/CustomerWallet.tsx` — Full wallet UI (29KB)

---

### M6 · Chainlink On-Chain Price Feeds

**Status: ✅ Shipped**

Real-time, verifiable price data fetched directly from Chainlink AggregatorV3 contracts on Avalanche C-Chain — not relying solely on centralized APIs.

**What was built:**
- Direct RPC calls to Chainlink price feed contracts:
  - AVAX/USD: `0xFF3EEb22B5E3dE6e705b44749C2559d704923FD`
  - USDT/USD: `0xEBE676ee90Fe1112671f19b6B7459bC678B67e8`
  - USDC/USD: `0xF096872672F44d6EBA71527d2277B5b7A1E4D63`
- Staleness check: rejects data older than 1 hour (`updatedAt` from `latestRoundData()`)
- Graceful fallback to CoinGecko REST API if Chainlink RPC is unavailable
- KES/USD rate from `open.er-api.com` (no API key needed; no Chainlink KES feed on Avalanche)
- Source badge in CustomerWallet.tsx: clearly shows "Chainlink" vs "CoinGecko" so users know data provenance
- Price used in BookService.tsx for crypto-to-KES conversion at checkout

**Key files:**
- `src/lib/prices.ts` — Chainlink ABI, multi-source price resolution, KES conversion

---

### M7 · Owner Business Management

**Status: ✅ Shipped**

Complete business management tooling for car wash owners — the primary revenue-generating user type on the platform.

**What was built:**
- **Locations CRUD:** Create/edit/delete business locations with name, address, city, latitude/longitude, active status. Locations appear to customers during booking.
- **Services CRUD:** Create/edit/delete services with name, description, price (KES), duration (minutes), category, image URL, active toggle. 28 global service templates available to seed.
- **Service Templates:** Pre-seeded on first API call. Categories: Exterior Wash, Interior Clean, Packages, Polish & Protection, Full Detail, Engine & Wheels, Glass & Upholstery. Prices KES 300–20,000.
- **Owner Bookings View:** See all bookings for services under owned locations. Filter by status. Assign a detailer or offline staff member to any booking.
- **Analytics Dashboard:** Charts for monthly revenue, bookings by status, top services by volume and revenue, customer growth over time.
- **Payments History:** View all transactions tied to owned services.
- **Wallet Address:** Owners register their Avalanche wallet address to receive 90% of crypto payments.

**Key files:**
- `api/locations/[[...slug]].ts`, `api/services/[[...slug]].ts`
- `src/pages/OwnerLocations.tsx`, `OwnerServices.tsx`, `OwnerBookings.tsx`, `OwnerAnalytics.tsx`

---

### M8 · Detailer Workflow & Earnings

**Status: ✅ Shipped**

A dedicated workflow for detailers — the field workers who execute car wash jobs.

**What was built:**
- **Job Management:** Detailers see only their assigned bookings. Job card shows customer name, vehicle, service, location, and scheduled time.
- **Status Transitions:** Detailer can move a job through: `confirmed → in_progress → completed`. Buttons appear contextually based on current status.
- **Before/After Photos:** Detailer uploads photos to Cloudinary before and after completing a job. URLs stored in `bookings.before_photos[]` and `bookings.after_photos[]`.
- **Schedule Management:** Weekly availability editor. Set working hours per day of week (Mon–Sat/Sun). Default schedule auto-created on registration: Mon–Fri 08:00–17:00.
- **Earnings Dashboard:** Shows 40% commission per completed job. Summary: today's earnings, this week's, lifetime total, and completed job count. Last 100 jobs displayed.
- Commission: Hard-coded at 40% of service price.

**Key files:**
- `api/detailer/[[...slug]].ts` — earnings, schedule
- `src/pages/DetailerJobs.tsx`, `DetailerSchedule.tsx`, `DetailerEarnings.tsx`

---

### M9 · Customer Experience Layer

**Status: ✅ Shipped**

The complete customer-facing product — from discovering services to completing a booking.

**What was built:**
- **BookService wizard (3 steps):**
  1. Browse locations and services with search + filter by category
  2. Select vehicle (or skip), date, time, payment method (M-Pesa / USDT / USDC)
  3. Checkout — enter M-Pesa phone or connect wallet, confirm payment timing
- **Vehicle Management:** Customers register vehicles (make, model, year, color, license plate). Vehicles are optionally attached to bookings.
- **Booking History:** View all past and upcoming bookings with status indicators. Cancel eligible bookings. Submit rating and review after completion.
- **Dashboard:** Quick stats — upcoming bookings count, total spent, loyalty tier, recent activity.
- **Payment timing choice:** "Pay now" or "Pay on arrival" — escrow is only captured after in-person service confirmation.

**Key files:**
- `src/pages/BookService.tsx`, `CustomerBookings.tsx`, `CustomerVehicles.tsx`, `CustomerDashboard.tsx`

---

### M10 · Loyalty Points System

**Status: ✅ Shipped**

A tiered loyalty programme that rewards customers for every wash booked through the platform.

**What was built:**
- Points awarded on M-Pesa payment capture: `ceil(amount / 10)` — 1 point per KES 10
- Points recorded in `loyalty_points` table with booking reference
- Four tiers: Bronze (0–999), Silver (1,000–2,999), Gold (3,000–4,999), Platinum (5,000+)
- Customer Loyalty page: current points, tier badge, progress bar to next tier, full points history
- `GET /api/loyalty` returns tier state, points to next level, and last 20 history entries

**Key files:**
- `api/loyalty/index.ts`
- `src/pages/CustomerLoyalty.tsx`

---

### M11 · Admin & Approvals System

**Status: ✅ Shipped**

Platform-level administration, including the owner onboarding approval workflow.

**What was built:**
- **Owner Approval Workflow:**
  1. Owner registers → `approval_status='pending'`, email sent to admin
  2. Admin views queue at `GET /api/admin/approvals`
  3. Admin approves or rejects via `PATCH /api/admin/approvals`
  4. Owner receives outcome email (approve → "Welcome to AutoFlow", reject → reason included)
- **User Management:** Admin can list all users, create users with any role (including pre-set passwords), soft-delete accounts
- **Transaction View:** Admin sees all transactions platform-wide — method breakdown, M-Pesa codes, crypto hashes
- **Global Service Management:** Admin can view/moderate all services across all owners
- **Platform Bookings:** High-level view of all bookings

**Key files:**
- `api/admin/approvals.ts`, `api/users/[[...slug]].ts`
- `src/pages/AdminApprovals.tsx`, `AdminUsers.tsx`, `AdminTransactions.tsx`

---

### M12 · Email Notification System

**Status: ✅ Shipped**

Professional transactional email system using Nodemailer with Brevo SMTP — responsive HTML templates for every key event.

**Templates implemented:**
| Trigger | Recipients | Content |
|---------|-----------|---------|
| Booking Confirmation | Customer | Service, location, date/time, payment method, booking ID |
| Booking Status Update | Customer | New status, next steps |
| Password Reset | User | Tokenized link (1-hour expiry) |
| Owner Pending | New owner | "Your application is under review" |
| Owner Approved | Owner | Welcome email, dashboard link |
| Owner Rejected | Owner | Rejection reason, support contact |
| Owner — New Booking | Owner | Customer name, service, scheduled time |
| Detailer Invite | New detailer | Temporary password, setup instructions |

**Key files:**
- `api/_lib/email.ts` — All HTML templates + `sendMail()` wrapper

---

### M13 · Analytics Dashboard

**Status: ✅ Shipped**

Data-driven insights for owners and admins, served from a single aggregated endpoint.

**What was built:**
- Revenue by month (last 6 months) — bar chart
- Bookings by status — pie/donut chart
- Top 10 services by booking count and revenue — ranked list
- Customer growth by month (new customers) — line chart
- KPIs: totalBookings, completedBookings, totalRevenue, avgRating
- Role-scoped: owners see only their own data; admins see platform-wide
- All data from a single `GET /api/analytics` endpoint (one DB round-trip for all metrics)

**Key files:**
- `api/analytics/index.ts`
- `src/pages/OwnerAnalytics.tsx`

---

### M14 · Google OAuth

**Status: ✅ Shipped**

Sign in with Google — accounts matched by email, new accounts auto-created on first sign-in.

**What was built:**
- `GET /api/auth/google` — builds Google OAuth 2.0 authorization URL and redirects
- `GET /api/auth/google-callback` — exchanges code for tokens, fetches profile, upserts user record, issues JWT
- Existing email accounts linked automatically (google_id stored on user)
- New accounts created as `customer` role by default
- Frontend: `LoginPage.tsx` listens for `?token=` in URL after OAuth callback, stores JWT
- Callback URI: `{APP_URL}/api/auth/google-callback`

**Key files:**
- `api/auth/[[...slug]].ts` (google + google-callback handlers)
- `src/pages/LoginPage.tsx`

---

### M15 · Staff Management (Offline + Online)

**Status: ✅ Shipped**

Owners can manage both off-platform staff (no app account) and registered detailers through a unified interface.

**What was built:**
- **Offline Staff** (`owner_staff` table): Add workers by name + optional phone + notes. No app account required. Total wash count tracked. Can be assigned to bookings as `staff_id`.
- **Online Detailers** (`owner_detailers` table): Invite existing detailers by email, or create new detailer accounts (temp password sent by email). Many-to-many relationship.
- Dual-tab UI in `OwnerStaff.tsx`: "Offline Staff" and "Online Detailers"
- Booking assignment: owner can assign either an offline staff member or an online detailer to any booking from `OwnerBookings.tsx`
- `GET /api/users/staff` — owner's offline staff list
- `GET /api/users/lookup?email=&role=detailer` — search detailers to invite

**Key files:**
- `api/users/[[...slug]].ts` (staff routes)
- `src/pages/OwnerStaff.tsx`

---

### M16 · Photo Documentation (Before/After)

**Status: ✅ Shipped**

Visual job documentation — detailers capture before/after photos at each job to provide proof of service quality.

**What was built:**
- Photo upload from `DetailerJobs.tsx` using Cloudinary unsigned upload preset
- Separate upload slots: "Before" photos (taken at arrival) and "After" photos (taken at completion)
- Multiple photos supported per slot (stored as `TEXT[]` array of Cloudinary URLs)
- Photos stored in `bookings.before_photos[]` and `bookings.after_photos[]`
- Cloudinary configured via `VITE_CLOUDINARY_CLOUD_NAME` + `VITE_CLOUDINARY_UPLOAD_PRESET`

**Key files:**
- `src/pages/DetailerJobs.tsx`

---

## Architecture Highlights

### API Architecture (12-Function Vercel Limit)

The project runs on Vercel's Hobby plan (max 12 serverless functions). All endpoints use the `[[...slug]].ts` optional catch-all pattern to group related routes into a single function file:

```
api/auth/[[...slug]].ts        → /api/auth/*
api/bookings/[[...slug]].ts    → /api/bookings, /api/bookings/:id
api/locations/[[...slug]].ts   → /api/locations, /api/locations/:id
api/services/[[...slug]].ts    → /api/services, /api/services/:id, /api/services/templates
api/users/[[...slug]].ts       → /api/users, /api/users/staff, /api/users/lookup, /api/users/:id
api/vehicles/[[...slug]].ts    → /api/vehicles, /api/vehicles/:id
api/payments/[[...slug]].ts    → /api/payments/mpesa-stk, /api/payments/mpesa-callback,
                                  /api/payments/status, /api/payments/transactions
api/detailer/[[...slug]].ts    → /api/detailer/earnings, /api/detailer/schedule
api/admin/approvals.ts         → /api/admin/approvals
api/analytics/index.ts         → /api/analytics
api/notifications/index.ts     → /api/notifications, /api/notifications/:id
api/loyalty/index.ts           → /api/loyalty
```

### Lazy Schema Migrations

Rather than running a dedicated migration tool, the API applies schema changes lazily on first request using `ALTER TABLE ... IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS` patterns wrapped in `.catch(() => {})`. This allows zero-downtime schema evolution without a migration pipeline.

### Payment Split (Crypto)

For injected wallet (MetaMask/Core) crypto payments, the platform performs a **dual-transfer** in a single transaction batch:
- 10% → `VITE_AUTOFLOW_WALLET` (platform commission)
- 90% → owner's registered `wallet_address` (if set), else 100% to AutoFlow

M-Pesa goes to a single shortcode; the 10%/90% split is handled at settlement time.

---

## Database Schema Summary

| Table | Purpose |
|-------|---------|
| `users` | All user types (customer, detailer, owner, admin) |
| `vehicles` | Customer-owned vehicles |
| `locations` | Business locations (owned by owners) |
| `services` | Service catalog entries (owned by owners) |
| `service_templates` | 28 global service templates (seeded once) |
| `bookings` | Core booking record with escrow state |
| `transactions` | Payment records (M-Pesa + crypto) |
| `notifications` | In-app notifications per user |
| `loyalty_points` | Points ledger per customer |
| `detailer_schedules` | Weekly availability per detailer (7 rows each) |
| `owner_detailers` | Many-to-many: owner ↔ online detailer |
| `owner_staff` | Offline staff (no app account) |
| `password_reset_tokens` | 1-hour expiry tokens for password resets |

---

## Roadmap

See [RoadmapPage.tsx](src/pages/RoadmapPage.tsx) for the interactive UI version.

### Q2 2026

| Feature | Status | Description |
|---------|--------|-------------|
| Agora RTC Live View | 🔧 In Progress | Live video streaming between customer and detailer during service. UI complete, Agora SDK integration pending. |
| Full Crypto Suite | 🔧 In Progress | Expand to AVAX direct payments + cross-chain support. |
| Advanced BI Dashboard | 🔧 In Progress | Customer LTV, cohort analysis, detailer performance scoring, CSV/PDF exports. |
| Kite AI Insights | 📋 Planned | AI-powered demand forecasting, dynamic pricing recommendations, churn prediction for owners. |
| WDK Seed Encryption | 📋 Planned | Encrypt seed phrases in localStorage with WebCrypto AES-GCM instead of plaintext storage. |
| Stripe Card Payments | 📋 Planned | Credit/debit card checkout as a 4th payment method. |

### Q3 2026

| Feature | Status | Description |
|---------|--------|-------------|
| Suzaku AVAX Liquid Staking | 📋 Planned | One-click AVAX staking for owners/detailers via Suzaku Protocol. Earn yield on platform revenue. UI complete. |
| DH3 Soulbound NFT Loyalty | 📋 Planned | Mint non-transferable NFTs representing loyalty tier (Bronze→Platinum). UI complete, smart contract pending. |
| FCM Push Notifications | 📋 Planned | Mobile push notifications via Firebase Cloud Messaging. |
| Decentralized Identity (DID) | 📋 Planned | W3C DID-based portable reputation for detailers. On-chain certifications. |
| API Rate Limiting | 📋 Planned | Redis-backed rate limiting on auth and payment endpoints. |

### Q4 2026

| Feature | Status | Description |
|---------|--------|-------------|
| Multi-Country Expansion | 📋 Planned | Uganda, Tanzania, Rwanda, Nigeria. MTN MoMo + Airtel Money integrations. Multi-currency pricing. |
| WalletConnect v2 | 📋 Planned | Mobile wallet support for iOS/Android via WalletConnect protocol. |
| Franchise / White-Label | 📋 Planned | Configurable white-label offering for large car wash chains. |
| Local Tax & Compliance | 📋 Planned | Per-country invoicing, VAT calculation, and compliance tooling. |
