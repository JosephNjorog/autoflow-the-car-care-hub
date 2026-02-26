# AutoFlow — Web3-Powered Car Wash Management Platform

> **Avalanche Hackathon 2026** · Live at **[autoflowbuzz.vercel.app](https://autoflowbuzz.vercel.app)**

AutoFlow is a full-stack, multi-role SaaS platform that bridges traditional mobile money (M-Pesa) with Web3 payments on Avalanche C-Chain. It connects car wash businesses, customers, and detailers with a production backend, real USDT payments via Tether WDK, and live price feeds from Chainlink Data Feeds.

---

## Current Status

| Area | Status |
| ------ | -------- |
| Frontend — all 4 roles | ✅ Complete |
| Backend — Vercel Serverless API | ✅ Live in production |
| Database — Neon PostgreSQL | ✅ Live |
| M-Pesa STK Push payments | ✅ Working (Safaricom sandbox) |
| Tether WDK — embedded wallet | ✅ Integrated (`@tetherto/wdk`) |
| Tether WDK — USDT transfers on Avalanche | ✅ Integrated |
| Chainlink Data Feeds — on-chain prices | ✅ Live (AggregatorV3 on Avalanche) |
| Email (welcome, password reset) | ✅ Working (SMTP/Gmail) |
| Google OAuth | ✅ Working |
| Agora live video | 🔜 Roadmap |
| Kite AI insights | 🔜 Roadmap |
| Suzaku AVAX staking | 🔜 Roadmap |
| DH3 NFT loyalty | 🔜 Roadmap |

---

## Hackathon Integrations

### 1. Tether WDK — Self-Custodial Embedded Wallet ✅

The centrepiece crypto integration. We use the official `@tetherto/wdk` + `@tetherto/wdk-wallet-evm` packages to give every customer a self-custodial USDT wallet built directly into the app — no MetaMask or extensions required.

**Why this matters:** A Kenyan in the diaspora can create an AutoFlow wallet, fund it with USDT, and pay for a family member's car wash in Nairobi — no bank transfer, no M-Pesa roaming fees, just a wallet-to-wallet USDT transfer on Avalanche.

**What's implemented:**

| File | What it does |
| ------ | ------------- |
| [`src/lib/wdk.ts`](src/lib/wdk.ts) | Full WDK integration: create wallet via `WDK.getRandomSeedPhrase()`, restore from seed, read AVAX/USDT/USDC balances via `WalletAccountReadOnlyEvm`, send USDT via `account.transfer()` |
| [`src/lib/crypto.ts`](src/lib/crypto.ts) | Unified payment flow supporting both WDK embedded wallet and injected wallets (MetaMask, Core, Trust) |
| [`src/pages/customer/CustomerWallet.tsx`](src/pages/customer/CustomerWallet.tsx) | Wallet UI: create/restore WDK wallet with seed phrase reveal, live balance display, external wallet connect |
| [`src/pages/customer/BookService.tsx`](src/pages/customer/BookService.tsx) | USDT/USDC payment option at checkout with live KES/USD conversion |

**WDK wallet flow:**

```text
Customer clicks "Create Wallet"
  → WDK.getRandomSeedPhrase(12) generates BIP-39 seed phrase
  → WalletManagerEvm derives HD wallet address on Avalanche C-Chain
  → Seed stored in localStorage
  → User backs up seed phrase → wallet is ready to fund and use

Customer pays with USDT:
  → WalletManagerEvm(seed).getAccount(0) instantiates the account
  → Balance check via account.getTokenBalance(USDT_ADDRESS)
  → account.transfer({ token, recipient, amount }) executes on-chain
  → account.dispose() clears private key from memory immediately
  → Transaction hash stored against the booking record
```

---

### 2. Chainlink Data Feeds — On-Chain Price Oracle ✅

We read AVAX/USD, USDT/USD, and USDC/USD prices directly from Chainlink AggregatorV3 contracts deployed on Avalanche C-Chain. No API key, no centralised price API — verifiable on-chain data that business owners and customers can trust.

**Feed addresses used (Avalanche C-Chain Mainnet):**

| Feed | Contract Address |
| ------ | ---------- |
| AVAX/USD | `0xFF3EEb22B5E3dE6e705b44749C2559d704923FD` |
| USDT/USD | `0xEBE676ee90Fe1112671f19b6B7459bC678B67e8` |
| USDC/USD | `0xF096872672F44d6EBA71527d2277B5b7A1E4D63` |

**What's implemented:**

| File | What it does |
| ------ | ------------- |
| [`src/lib/prices.ts`](src/lib/prices.ts) | Reads `latestRoundData()` from each AggregatorV3 via `JsonRpcProvider`, validates freshness (rejects data >1h old), falls back to CoinGecko if RPC unavailable |
| [`src/pages/customer/CustomerWallet.tsx`](src/pages/customer/CustomerWallet.tsx) | Live prices tab — shows "Chainlink" or "CoinGecko fallback" source badge on each feed |
| [`src/pages/customer/BookService.tsx`](src/pages/customer/BookService.tsx) | Checkout shows live KES/USD rate for accurate crypto payment amounts |

KES/USD has no Chainlink feed on Avalanche, so we use `open.er-api.com` (free, no key) for that rate, combined with the on-chain AVAX/USD to produce a live AVAX/KES rate.

---

### 3. M-Pesa STK Push — Mobile Money Payments ✅

Real M-Pesa integration via Safaricom Daraja API. Customer enters their phone number at checkout, receives an STK Push on their phone, enters PIN, and the booking is confirmed automatically via webhook callback.

**Flow:**

```text
POST /api/payments/mpesa-stk
  → Initiates STK Push via Daraja API
  → Returns checkoutRequestId to poll against

POST /api/payments/mpesa-callback  (called by Safaricom)
  → Validates payment confirmation
  → Updates transaction status to 'completed'
  → Confirms the booking
  → Awards loyalty points (1 pt per KES 10 spent)
  → Sends notification to customer and business owner
```

---

### 4. Kite AI — AI Business Insights 🔜

AI-powered analytics for business owners, running on the Kite AI decentralised inference network. The UI is complete — owners see a Coming Soon page that outlines all 6 planned insight types: dynamic pricing, customer retention alerts, staff optimisation, upsell recommendations, AI chat assistant, and revenue forecasting. Backend integration with Kite AI's inference API is on the roadmap.

---

### 5. Suzaku — AVAX Liquid Staking 🔜

Business owners will stake AVAX earnings from AutoFlow into Suzaku's liquid staking pool to earn ~7% APY while receiving liquid sAVAX tokens. The UI is complete with a full explainer. Protocol integration is on the roadmap.

---

### 6. DH3 — Soulbound NFT Loyalty Tiers 🔜

On-chain loyalty membership NFTs (Bronze → Silver → Gold → Platinum) tied to customer wallet addresses, non-transferable (soulbound). The points system is live in the database and the full loyalty UI is built. NFT smart contract deployment and DH3 protocol integration are on the roadmap.

---

### 7. Agora — Live Video Check-In 🔜

Real-time video streaming so customers can watch their car being washed live. Full UI is built in `CustomerLiveView.tsx` and `DetailerJobs.tsx`. Agora RTC token generation and channel management are on the roadmap.

---

## Tech Stack

| Layer | Technology |
| ------- | ----------- |
| **Frontend** | React 18, TypeScript, Vite 5 |
| **UI** | Tailwind CSS, shadcn/ui, Radix UI primitives |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Routing** | React Router v6 |
| **Data fetching** | TanStack React Query |
| **Backend** | Vercel Serverless Functions (`@vercel/node`, TypeScript) |
| **Database** | Neon PostgreSQL (serverless, connection pooling) |
| **Auth** | JWT (`jsonwebtoken`), bcrypt passwords, Google OAuth 2.0 |
| **Email** | Nodemailer via Gmail SMTP (welcome, password reset) |
| **Blockchain** | Avalanche C-Chain (EVM, chain ID 43114) |
| **Wallet SDK** | `@tetherto/wdk` + `@tetherto/wdk-wallet-evm` |
| **Web3 library** | ethers.js v6 |
| **Price Oracle** | Chainlink AggregatorV3 (on-chain), CoinGecko fallback |
| **FX Rate** | open.er-api.com (KES/USD, free, no key) |
| **Mobile Money** | Safaricom M-Pesa Daraja API (STK Push) |
| **Deployment** | Vercel Hobby (12 serverless functions, at limit) |

---

## Architecture

### Request Flow

```text
Browser (React SPA)
  │
  ├─ API calls (fetch + Bearer JWT)
  │     └──► Vercel Serverless Functions ──► Neon PostgreSQL
  │              api/auth/[[...slug]].ts
  │              api/bookings/[[...slug]].ts
  │              api/payments/[[...slug]].ts
  │              api/services/[[...slug]].ts
  │              api/locations/[[...slug]].ts
  │              api/users/[[...slug]].ts
  │              api/vehicles/[[...slug]].ts
  │              api/detailer/[[...slug]].ts
  │              api/analytics/index.ts
  │              api/notifications/index.ts
  │              api/loyalty/index.ts
  │              api/admin/approvals.ts
  │
  ├─ Tether WDK (browser-side)
  │     └──► Avalanche C-Chain RPC ──► USDT ERC-20 Contract (0x9702230A...)
  │           @tetherto/wdk-wallet-evm        transfer() / balanceOf()
  │
  └─ Chainlink (browser-side)
        └──► Avalanche C-Chain RPC ──► AggregatorV3 contracts
              ethers JsonRpcProvider          latestRoundData()
```

### Serverless Routing Pattern

All grouped API routes use Vercel's `[[...slug]].ts` optional catch-all to stay within the 12-function Hobby plan limit:

```text
/api/auth/login            → api/auth/[[...slug]].ts      slug=['login']
/api/auth/register         → api/auth/[[...slug]].ts      slug=['register']
/api/bookings              → api/bookings/[[...slug]].ts  slug=[]
/api/bookings/:id          → api/bookings/[[...slug]].ts  slug=[':id']
/api/payments/mpesa-stk    → api/payments/[[...slug]].ts  slug=['mpesa-stk']
/api/payments/transactions → api/payments/[[...slug]].ts  slug=['transactions']
```

---

## Project Structure

```text
autoflow/
├── api/                             # Vercel Serverless Functions (12 total)
│   ├── _lib/
│   │   ├── auth.ts                  # generateToken, requireAuth, requireRole
│   │   ├── db.ts                    # Neon sql tagged template client
│   │   ├── cors.ts                  # CORS headers + OPTIONS preflight handler
│   │   └── email.ts                 # HTML email templates via Nodemailer
│   ├── auth/[[...slug]].ts          # login, register, me, forgot-password, Google OAuth, KYC
│   ├── bookings/[[...slug]].ts      # Full CRUD + status transitions
│   ├── services/[[...slug]].ts      # Service catalog CRUD
│   ├── locations/[[...slug]].ts     # Location CRUD
│   ├── users/[[...slug]].ts         # User management, /staff, /lookup
│   ├── vehicles/[[...slug]].ts      # Customer vehicle CRUD
│   ├── payments/[[...slug]].ts      # mpesa-stk, mpesa-callback, status, transactions
│   ├── detailer/[[...slug]].ts      # earnings, schedule
│   ├── analytics/index.ts           # Business analytics aggregation
│   ├── notifications/index.ts       # Notification read/mark-read
│   ├── loyalty/index.ts             # Points balance and history
│   ├── admin/approvals.ts           # Owner onboarding approval workflow
│   └── tsconfig.json
│
├── src/
│   ├── lib/
│   │   ├── api.ts                   # Typed fetch wrapper with auto Bearer token
│   │   ├── wdk.ts                   # Tether WDK: wallet lifecycle + USDT transfers
│   │   ├── crypto.ts                # Unified payment: WDK + injected wallet (MetaMask etc.)
│   │   ├── prices.ts                # Chainlink on-chain feeds + CoinGecko fallback
│   │   └── utils.ts                 # shadcn cn() helper
│   ├── contexts/
│   │   └── AuthContext.tsx          # JWT auth state, role-based routing
│   ├── components/
│   │   ├── layout/DashboardLayout.tsx
│   │   ├── shared/SharedComponents.tsx
│   │   └── ui/                      # shadcn/ui component library
│   └── pages/
│       ├── LandingPage.tsx
│       ├── LoginPage.tsx
│       ├── RegisterPage.tsx
│       ├── RoadmapPage.tsx
│       ├── SettingsPage.tsx
│       ├── ForgotPasswordPage.tsx
│       ├── customer/
│       │   ├── CustomerDashboard.tsx
│       │   ├── BookService.tsx          # 3-step booking + M-Pesa/USDT/USDC payment
│       │   ├── CustomerWallet.tsx       # WDK wallet + Chainlink live prices
│       │   ├── CustomerBookings.tsx
│       │   ├── CustomerPayments.tsx
│       │   ├── CustomerVehicles.tsx
│       │   ├── CustomerLiveView.tsx     # Agora video UI (backend pending)
│       │   └── CustomerLoyalty.tsx      # Points + NFT tier display
│       ├── detailer/
│       │   ├── DetailerDashboard.tsx
│       │   ├── DetailerJobs.tsx         # Job management + Go Live button
│       │   ├── DetailerSchedule.tsx
│       │   └── DetailerEarnings.tsx
│       ├── owner/
│       │   ├── OwnerDashboard.tsx
│       │   ├── OwnerAnalytics.tsx
│       │   ├── OwnerBookings.tsx
│       │   ├── OwnerServices.tsx
│       │   ├── OwnerLocations.tsx
│       │   ├── OwnerStaff.tsx
│       │   ├── OwnerPayments.tsx
│       │   ├── OwnerAIInsights.tsx      # Kite AI UI (backend pending)
│       │   └── OwnerStaking.tsx         # Suzaku UI (backend pending)
│       └── admin/
│           ├── AdminDashboard.tsx
│           ├── AdminUsers.tsx
│           ├── AdminBookings.tsx
│           ├── AdminTransactions.tsx
│           ├── AdminServices.tsx
│           └── AdminApprovals.tsx
│
├── vercel.json                      # outputDirectory + SPA fallback rewrite
├── .env.local                       # Local environment variables
└── package.json
```

---

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone <repo-url>
cd autoflow-the-car-care-hub
npm install
```

Create `.env.local` with the following variables:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=your-jwt-secret

# M-Pesa Daraja API (Safaricom sandbox)
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=...

# Email (Gmail SMTP with App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Avalanche / Tether WDK — no API key needed, uses public RPC
VITE_AVAX_RPC=https://api.avax.network/ext/bc/C/rpc
VITE_AUTOFLOW_WALLET=0x6D7df05eda7A6142503315DA1ef8Dc26714ed9a4
```

### Run

```bash
npm run dev        # Vite frontend — http://localhost:5173
npm run dev:api    # Vercel dev server for API — http://localhost:3000
npm run dev:full   # Both together
npm run build      # Production build
```

---

## Demo

**Live:** [https://autoflowbuzz.vercel.app](https://autoflowbuzz.vercel.app)

| Role | Registration | Notes |
| ------ | ------------- | ------- |
| Customer | Register → instant access | Full booking + payment flow |
| Detailer | Register → instant access | Job management, schedule |
| Business Owner | Register → admin approval required | Dashboard unlocked after approval |
| Admin | Contact team | Platform-wide management |

### Test M-Pesa (Sandbox)

Use phone number `254708374149` and any 6-digit PIN when the STK Push arrives.

### Test Crypto (WDK Wallet)

1. Go to **Wallet** → **AutoFlow Wallet (WDK)** → **Create Wallet**
2. Save your seed phrase
3. Fund the wallet address with USDT on Avalanche C-Chain
4. Book a service and choose USDT at checkout

---

## Payment Methods

| Method | Status | Details |
| -------- | -------- | --------- |
| M-Pesa STK Push | ✅ Live | Safaricom Daraja sandbox |
| USDT via WDK wallet | ✅ Live | Self-custodial, no MetaMask needed |
| USDT via MetaMask/Core | ✅ Live | Injected wallet on Avalanche C-Chain |
| USDC | ✅ Live | Same flow as USDT |
| Cash on Arrival | ✅ Live | Booking recorded, offline collection |
| Card (Stripe) | 🔜 Roadmap | — |

AutoFlow takes **10% commission** on all platform-processed payments. Detailers receive **40% of service price**; the remainder goes to the business owner.

---

## Database Schema (Key Tables)

```sql
users               id, email, password_hash, first_name, last_name, phone,
                    role, google_id, approval_status, wallet_address, is_verified

locations           id, owner_id, name, address, city, lat, lng, is_active

services            id, owner_id, location_id, name, category,
                    price_kes, duration_minutes, is_active

bookings            id, customer_id, detailer_id, service_id, location_id,
                    scheduled_date, scheduled_time, status, payment_status,
                    payment_method, total_amount

transactions        id, booking_id, customer_id, amount_kes, amount_usd,
                    method, status, mpesa_code, mpesa_checkout_request_id,
                    crypto_tx_hash, crypto_token, crypto_network

vehicles            id, customer_id, make, model, year, color, license_plate

detailer_schedules  detailer_id, day_of_week, start_time, end_time, is_available

loyalty_points      id, customer_id, booking_id, points, description

notifications       id, user_id, title, message, type, is_read

owner_applications  id, user_id, business_name, business_address,
                    id_doc_name, id_doc_data, photos, status
```

---

## Design System

| Token | Value | Usage |
| ------- | ------- | ------- |
| Primary | `hsl(152, 35%, 25%)` forest green | Buttons, links, active states |
| Accent | `hsl(36, 80%, 55%)` gold | Loyalty tiers, highlights |
| Font headings | DM Serif Display | Page titles, card headers |
| Font body | DM Sans | All body text, UI copy |
| Dark mode | Full — warm gold primary swaps in | Toggled via ThemeProvider |

---

## Roadmap

### Near Term

- [ ] Agora RTC token server → live video between customer and detailer
- [ ] Kite AI API → real AI insights from actual booking + revenue data
- [ ] Record `crypto_tx_hash` on bookings after WDK payment confirmation
- [ ] WDK seed encryption with WebCrypto AES-GCM before localStorage

### Smart Contracts (Avalanche Fuji Testnet)

- [ ] `AutoFlowMembership.sol` — soulbound ERC-721 for DH3 NFT loyalty tiers
- [ ] Payment escrow — hold USDT until service completion, then auto-release
- [ ] Suzaku staking wrapper — sAVAX deposit/withdrawal for owner yield

### Production Hardening

- [ ] Switch M-Pesa to live Daraja credentials
- [ ] API rate limiting
- [ ] Stripe card payments
- [ ] FCM push notifications

---

## License

Built for the Avalanche Hackathon 2026. All rights reserved.
