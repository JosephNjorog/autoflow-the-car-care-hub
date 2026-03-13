# AutoFlow — Milestones & Implementation Docs

> **Stack:** Vite + React 18 + TypeScript · Vercel Serverless Functions · Neon PostgreSQL · Avalanche C-Chain

---

## Shipped Milestones (Q1 2026)

### 1. Multi-Role Authentication
**Status:** ✅ Shipped

- JWT authentication (HS256, 7-day tokens)
- Four roles: `customer`, `detailer`, `owner`, `admin`
- Google OAuth 2.0 (callback at `/api/auth/google-callback`)
- Email/password registration with bcrypt hashing
- Forgot-password flow with time-limited reset tokens (SMTP via Brevo)
- Owner approval gating — owners must be approved by admin before accessing dashboard
- KYC submission endpoint (`POST /api/auth/submit-kyc`)

**Key files:**
- `api/auth/[[...slug]].ts` — all auth routes
- `api/_lib/auth.ts` — JWT sign/verify helpers
- `api/_lib/email.ts` — professional HTML email templates (8 templates)

---

### 2. Booking System + Escrow
**Status:** ✅ Shipped

**Status lifecycle:**
```
pending → confirmed → in_progress → awaiting_confirmation → completed
                                                          → cancelled
```

**Payment status lifecycle:**
```
pending → captured → released
```

- Customers book a service at a location with date/time
- Two payment timings: **Pay Now** (escrow at booking) and **Pay at Pickup** (pay when car is ready)
- Escrow auto-releases after 2 hours if customer doesn't confirm
- Lazy DB migrations — schema changes via `ALTER TABLE ADD COLUMN IF NOT EXISTS` wrapped in `.catch(() => {})`
- Staff assignment (both online detailers and offline owner_staff)
- Before/after photo upload via Cloudinary

**Key files:**
- `api/bookings/[[...slug]].ts` — full CRUD, status transitions, escrow logic
- `src/pages/customer/BookService.tsx` — booking wizard (browse → center → checkout → paying → confirmed)
- `src/pages/customer/CustomerBookings.tsx` — booking list with pay/confirm dialog

---

### 3. M-Pesa STK Push (Daraja API)
**Status:** ✅ Shipped

- `POST /api/payments/mpesa-stk` — pay-now flow: sends STK push to customer at booking time
- `POST /api/payments/mpesa-stk-pickup` — pay-at-pickup flow: customer-triggered STK push when car is ready
- `POST /api/payments/mpesa-callback` — Safaricom webhook updates transaction + booking status
- Frontend polling every 3 seconds (max 20 polls = 60 seconds timeout)
- Switch between sandbox and production via `MPESA_ENV=production` env var
- Phone normalisation: `07xx` → `2547xx`, strips `+`

**Env vars required:**
```
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_SHORTCODE
MPESA_PASSKEY
MPESA_ENV=production         # or leave unset for sandbox
```

**Key files:**
- `api/_lib/mpesa.ts` — shared Daraja helpers (`initiateStkPush`, `initiateB2CPayout`, `payoutOwnerShare`)
- `api/payments/[[...slug]].ts` — all payment route handlers

---

### 4. M-Pesa Escrow + B2C Owner Payout
**Status:** ✅ Shipped

When a customer confirms service completion (`PATCH /api/bookings/:id { confirmPickup: true }`):
1. Booking status → `completed`, payment_status → `released`
2. `payoutOwnerShare(ownerId, totalPaid, bookingId)` is called
3. Looks up owner's M-Pesa payout config (`mpesa_payout_type`, `mpesa_payout_till`, etc.)
4. Sends 90% to owner via Daraja B2C `BusinessPayment`

**B2C payout config options for owners:**
| Type | Description |
|------|-------------|
| `phone` | Send Money to a Safaricom number |
| `till` | Buy Goods / Till Number |
| `paybill` | Paybill with account number |

**Additional env vars for B2C:**
```
MPESA_INITIATOR_NAME        # Daraja B2C initiator username
MPESA_SECURITY_CREDENTIAL   # Encrypted credential from Daraja portal
```

> Note: B2C requires Safaricom activation (apply at developer.safaricom.co.ke). Without it, payout silently skips (escrow remains until manual payout).

---

### 5. USDT / USDC Payments on Avalanche C-Chain
**Status:** ✅ Shipped

**Payment paths:**
1. **Injected wallet** (MetaMask, Core Wallet, Trust Wallet) — via `window.ethereum`
2. **WDK in-app wallet** (Tether WDK embedded wallet, no extension needed)

**Smart contract path (if `VITE_AUTOFLOW_CONTRACT` is set):**
- Customer approves contract to spend tokens
- `payWithToken(bookingId, ownerWallet, tokenAddress, amount)` — atomic 90/10 split on-chain

**Fallback path (no contract):**
- Two direct ERC-20 transfers: 10% to AutoFlow wallet, 90% to owner wallet

**Token addresses:**
| Token | Mainnet | Fuji Testnet |
|-------|---------|--------------|
| USDT | `0x9702230A...` | `0x54258902...` (Circle test USDC) |
| USDC | `0xB97EF9Ef...` | `0x54258902...` |

**Env vars:**
```
VITE_AUTOFLOW_WALLET         # AutoFlow's Avalanche address (receives 10%)
VITE_AUTOFLOW_CONTRACT       # Deployed AutoFlowPayments.sol address (optional)
VITE_USE_TESTNET=true        # Use Fuji testnet (demo mode)
VITE_AVAX_RPC                # Custom RPC (optional, defaults to public)
```

**Key files:**
- `src/lib/crypto.ts` — full payment flow (`runCryptoPayment`, `sendSplitPaymentInjected`, `snowtraceUrl`)
- `src/lib/wdk.ts` — Tether WDK embedded wallet helpers

---

### 6. AutoFlowPayments Smart Contract
**Status:** ✅ Shipped — deployed on Avalanche C-Chain (Fuji testnet ready)

**Contract:** `contracts/AutoFlowPayments.sol` (Solidity 0.8.20)

**Key functions:**
```solidity
payWithToken(string bookingId, address businessWallet, address tokenAddress, uint256 amount)
payWithAVAX(string bookingId, address businessWallet) payable
previewSplit(uint256 amount) view returns (uint256 businessAmount, uint256 platformFee)
```

**Events:**
```solidity
PaymentProcessed(bookingId, businessWallet, token, totalAmount, businessAmount, platformFee, timestamp)
```

- Platform fee: 10% (1000 basis points), configurable by owner
- Rejects direct AVAX sends (must go through `payWithAVAX`)
- Admin functions: `setPlatformWallet`, `setPlatformFee`, `transferOwnership`

**Deploy commands:**
```bash
cd contracts
npm install
cp .env.example .env   # set DEPLOYER_PRIVATE_KEY, PLATFORM_WALLET, SNOWTRACE_API_KEY
npm run deploy:fuji    # Fuji testnet
npm run deploy:mainnet # Avalanche C-Chain mainnet
```

After deploy, set `VITE_AUTOFLOW_CONTRACT=<deployed address>` in Vercel env vars.

---

### 7. Tether WDK Embedded Wallet
**Status:** ✅ Shipped

- Browser-native self-custodial wallet (no extension required)
- 12-word BIP-39 mnemonic generation
- HD key derivation (BIP-44, Avalanche path `m/44'/9000'/0'/0/0`)
- Balance display for USDT and USDC
- Auto-wipes private key from memory after signing
- Stores encrypted seed in `localStorage`

**Key files:**
- `src/lib/wdk.ts` — wallet creation, balance fetch, `sendViaWDK`
- `src/components/WDKWallet.tsx` — wallet UI (create/restore/balance)

---

### 8. Owner Payment Settings
**Status:** ✅ Shipped

Owners configure payout preferences in their dashboard (`/owner/payments`):
- **M-Pesa payout type:** Send Money (phone), Buy Goods (Till), Paybill
- **Crypto wallet:** Avalanche address to receive 90% of crypto payments
- Settings saved via `PATCH /api/users/:id`
- SnowTrace link displayed for every on-chain transaction

**DB columns added (lazy migration):**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_till TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_paybill TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mpesa_payout_account TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS crypto_wallet TEXT;
```

**Key files:**
- `src/pages/owner/OwnerPayments.tsx` — settings dialog + transactions table
- `api/users/[[...slug]].ts` — GET/PATCH with new payment fields

---

### 9. Owner Request-Payment (STK Push to Customer)
**Status:** ✅ Shipped

Owners can send an STK push to a customer's phone directly from the bookings view:
- Button: **Request Payment** on non-completed bookings where payment is pending
- Owner enters customer phone → customer receives STK push
- `POST /api/payments/request-payment` — owner/admin only, validates booking ownership

**Key files:**
- `src/pages/owner/OwnerBookings.tsx` — Request Payment button + dialog
- `api/payments/[[...slug]].ts` — `handleRequestPayment`

---

### 10. Business Management (Locations, Services, Analytics)
**Status:** ✅ Shipped

- Full CRUD for locations (name, address, city, lat/lng)
- 28 service templates across categories (Exterior, Interior, Full Detail, Specialty, Mobile)
- Owner analytics: revenue chart, bookings chart, customer stats, top services
- Revenue breakdown: gross vs. net (after 10% platform fee)

**Key files:**
- `api/locations/[[...slug]].ts`, `api/services/[[...slug]].ts`
- `api/analytics/index.ts`
- `src/pages/owner/OwnerLocations.tsx`, `src/pages/owner/OwnerServices.tsx`
- `src/pages/owner/OwnerAnalytics.tsx`

---

### 11. Detailer Workflow
**Status:** ✅ Shipped

- Detailer dashboard: assigned bookings, status controls
- Status transitions allowed for detailers: `in_progress`, `awaiting_confirmation`
- Upload before/after photos (Cloudinary)
- Earnings tracker: 40% commission on all completed bookings
- Schedule view with upcoming bookings

**Key files:**
- `src/pages/detailer/DetailerDashboard.tsx`
- `api/detailer/[[...slug]].ts` — earnings, schedule

---

### 12. Staff Management
**Status:** ✅ Shipped

- **Online detailers:** Registered users with `detailer` role, invited by owners
- **Offline staff:** `owner_staff` table — name, phone, notes, wash count. No app account required.
- Assign either type to any booking
- Staff list with activity stats

**DB schema:**
```sql
CREATE TABLE owner_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  total_washes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES owner_staff(id) ON DELETE SET NULL;
```

---

### 13. Loyalty Points (4 Tiers)
**Status:** ✅ Shipped

- Earn 1 point per KES 10 spent
- Tiers: Bronze (0) → Silver (1,000) → Gold (3,000) → Platinum (5,000)
- Points history and tier progress tracker

**Key files:**
- `api/loyalty/index.ts`
- `src/pages/customer/LoyaltyPage.tsx`

---

### 14. Chainlink Price Feeds (AVAX/KES)
**Status:** ✅ Shipped

- On-chain AVAX/USDT/USDC prices via Chainlink AggregatorV3
- 10-minute staleness guard
- CoinGecko fallback if Chainlink is stale/unavailable
- Used for live KES → USD conversion at checkout

**Key files:**
- `src/lib/prices.ts`

---

### 15. Notifications
**Status:** ✅ Shipped

- In-app notifications (bell icon)
- 8 email templates: booking confirmation, status updates, owner approval, detailer invite, payment confirmed
- `GET /api/notifications` — paginated list with unread count
- `PATCH /api/notifications/:id` — mark as read

---

### 16. Admin Dashboard
**Status:** ✅ Shipped

- Owner approval queue (approve / reject with email notification)
- User management (list, role filter, deactivate)
- Platform-wide booking oversight
- Transaction history across all users

**Key files:**
- `api/admin/approvals.ts`
- `src/pages/admin/AdminDashboard.tsx`

---

## Architecture Notes

### Vercel Serverless Function Limit (Hobby Plan: 12 max)
All routes use `[[...slug]].ts` catch-all pattern to stay within the 12-function limit:
```
api/bookings/[[...slug]].ts    → /api/bookings + /api/bookings/:id
api/payments/[[...slug]].ts    → /api/payments/mpesa-stk, mpesa-callback, status, transactions, request-payment, mpesa-stk-pickup
api/auth/[[...slug]].ts        → /api/auth/login, register, me, forgot-password, google, google-callback, submit-kyc
... (9 more catch-all handlers)
```

### Lazy Migrations Pattern
Schema changes are applied on first request with no manual intervention:
```typescript
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS crypto_wallet TEXT`.catch(() => {});
```

### Payment Architecture
```
Customer pays → AutoFlow escrow (STK push to AutoFlow shortcode)
     ↓ (on customer confirmation or 2hr auto-release)
Daraja B2C → Owner's M-Pesa (90%)
AutoFlow retains 10%

— OR for crypto —

Customer wallet → AutoFlowPayments.sol (approve + payWithToken)
     → Owner wallet (90%) + AutoFlow wallet (10%) atomically
```

---

## Environment Variables Reference

```env
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...

# Email (Brevo SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_USER=...
SMTP_PASS=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# App URL
NEXT_PUBLIC_APP_URL=https://autoflow.vercel.app

# M-Pesa (Daraja)
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
MPESA_ENV=production
MPESA_INITIATOR_NAME=...      # B2C only
MPESA_SECURITY_CREDENTIAL=... # B2C only

# Crypto (Avalanche)
VITE_AUTOFLOW_WALLET=0x...     # Receives 10% platform fee
VITE_AUTOFLOW_CONTRACT=0x...   # AutoFlowPayments.sol address
VITE_USE_TESTNET=false
VITE_AVAX_RPC=                 # Optional custom RPC

# Cloudinary (photo uploads)
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

---

## Upcoming Roadmap (Q2–Q4 2026)

| Quarter | Feature | Status |
|---------|---------|--------|
| Q2 2026 | Agora RTC Live View | In Progress |
| Q2 2026 | Full Crypto Payment Suite (AVAX, cross-chain) | In Progress |
| Q2 2026 | Advanced Business Intelligence | In Progress |
| Q2 2026 | Kite AI Insights | Planned |
| Q2 2026 | Stripe Card Payments | Planned |
| Q2 2026 | WDK Seed Encryption (WebCrypto AES-GCM) | Planned |
| Q3 2026 | Suzaku AVAX Liquid Staking | Planned |
| Q3 2026 | DH3 Soulbound NFT Loyalty | Planned |
| Q3 2026 | Decentralised Identity (DID) | Planned |
| Q3 2026 | FCM Push Notifications | Planned |
| Q4 2026 | Multi-Country Expansion (UG, TZ, RW, NG) | Planned |
