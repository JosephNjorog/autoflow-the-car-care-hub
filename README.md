# AutoFlow — Web3-Powered Car Wash Management Platform

> **Built for the Avalanche Hackathon** | Multi-role SaaS platform connecting car wash businesses, customers, and detailers with on-chain payments, AI analytics, and real-time service tracking.

---

## 🌟 Overview

AutoFlow is a comprehensive car wash management platform built on **Avalanche C-Chain** that bridges traditional mobile money (M-Pesa) with Web3 payments, AI-powered business intelligence, and on-chain loyalty rewards. It serves four user roles:

| Role | Description |
|------|-------------|
| **Customer** | Book services, pay with M-Pesa or crypto, watch live video of their car being serviced, earn NFT loyalty rewards |
| **Detailer** | Manage jobs, stream live video to customers, upload before/after photos, track earnings |
| **Business Owner** | Manage locations, services, staff, view AI-powered analytics, stake AVAX earnings |
| **Super Admin** | Platform-wide oversight, user management, transaction auditing across all payment methods |

---

## 🔗 Hackathon Integrations (Priority Order)

### 1. 🟢 Tether WDK (Wallet Development Kit)
**Status:** Frontend UI Complete | **Backend:** Pending

The core crypto payment integration. Tether WDK enables USDT payments directly within the platform on Avalanche C-Chain.

**Frontend Implementation:**
- `src/pages/customer/CustomerWallet.tsx` — Wallet connection UI with Tether WDK branding, multi-wallet support (Core, MetaMask, WalletConnect, Coinbase), USDT/USDC/AVAX balance display
- `src/pages/customer/BookService.tsx` — USDT added as a payment method in the booking flow with real-time KES conversion
- `src/pages/customer/CustomerPayments.tsx` — Payment history showing crypto transaction hashes with Snowtrace explorer links

**Backend Requirements:**
- Integrate `@aspect-build/web3-react` or Tether WDK SDK for wallet connection
- Implement USDT transfer smart contract calls on Avalanche C-Chain
- STK Push equivalent for crypto: initiate payment → confirm on-chain → update booking status
- Webhook listener for on-chain transaction confirmations
- Store wallet addresses and transaction hashes in database

**Smart Contract Needs:**
- Payment escrow contract (hold USDT until service confirmed)
- Auto-release to business owner wallet on service completion
- Refund mechanism for cancelled bookings

---

### 2. 🔵 Chainlink Data Feeds
**Status:** Frontend UI Complete | **Backend:** Pending

Provides reliable, decentralized price feeds for accurate KES ↔ crypto conversions.

**Frontend Implementation:**
- `src/pages/customer/CustomerWallet.tsx` — Live price feeds tab showing AVAX/USD, USDT/USD, USDC/USD, AVAX/KES with Chainlink branding
- `src/pages/customer/BookService.tsx` — Real-time crypto equivalent shown during payment (e.g., "KES 3,000 ≈ 23.24 USDT via Chainlink")

**Backend Requirements:**
- Read Chainlink Price Feed contracts on Avalanche:
  - `AVAX/USD`: `0x0A77230d17318075983913bC2145DB16C7366156`
  - Deploy or use existing `USD/KES` feed (or use off-chain oracle for KES rate)
- Cache prices server-side (refresh every 30s) to minimize RPC calls
- Expose `/api/prices` endpoint for frontend consumption
- Calculate crypto amounts: `cryptoAmount = kesPrice / (usdKesRate * tokenUsdRate)`

**Edge Function:**
```typescript
// supabase/functions/get-prices/index.ts
// Read Chainlink AggregatorV3Interface for live prices
// Return { avaxUsd, usdtUsd, usdcUsd, usdKes, avaxKes }
```

---

### 3. 🧠 Kite AI
**Status:** Frontend UI Complete | **Backend:** Pending

AI-powered business intelligence running on the Kite AI blockchain network for decentralized, verifiable inference.

**Frontend Implementation:**
- `src/pages/owner/OwnerAIInsights.tsx` — Two-tab interface:
  - **Smart Insights**: AI-generated cards with dynamic pricing suggestions, customer retention alerts, staff optimization, and upsell recommendations (with confidence scores)
  - **AI Chat Assistant**: Conversational interface for querying business data ("Revenue this month?", "Top service by profit?", "Suggest pricing changes")

**Backend Requirements:**
- Integrate Kite AI inference API for natural language processing
- Build data pipeline: aggregate booking, revenue, and customer data → feed to AI model
- Implement insight generation:
  - **Dynamic Pricing**: Analyze demand patterns by time/day → suggest surge pricing
  - **Customer Retention**: Track booking frequency → flag at-risk customers
  - **Upsell Engine**: Analyze service co-occurrence → suggest bundles
- Store generated insights with timestamps and confidence scores
- Chat endpoint: accept natural language query → retrieve relevant data → generate response via Kite AI

**Edge Function:**
```typescript
// supabase/functions/ai-insights/index.ts
// POST { query: "revenue this month" }
// → Aggregate data from bookings/transactions tables
// → Send to Kite AI API for inference
// → Return structured response
```

---

### 4. 📹 Agora (Real-Time Video)
**Status:** Frontend UI Complete | **Backend:** Pending

Live video streaming between detailers and customers during active services.

**Frontend Implementation:**
- `src/pages/customer/CustomerLiveView.tsx` — Full video call interface with:
  - Live video feed area with PiP self-view
  - Video/audio controls (mute, camera toggle, screenshot, fullscreen)
  - Real-time chat sidebar with active booking info
  - LIVE indicator badge and call duration timer
- `src/pages/detailer/DetailerJobs.tsx` — "Go Live" button on in-progress jobs

**Backend Requirements:**
- Integrate Agora RTC SDK (`agora-rtc-sdk-ng`)
- Token server: generate Agora RTC tokens per booking session
- Channel naming: `autoflow-booking-{bookingId}`
- Role assignment: detailer = broadcaster, customer = audience (with optional upgrade to broadcaster)
- Recording: optionally store session recordings for dispute resolution
- Signaling: use Agora RTM for the in-call chat messages

**Edge Function:**
```typescript
// supabase/functions/agora-token/index.ts
// POST { bookingId, role: "publisher" | "subscriber" }
// → Validate booking is in_progress
// → Generate Agora RTC token with channel name
// → Return { token, channelName, uid }
```

**Environment Variables Needed:**
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`

---

### 5. 🏆 DH3 (Decentralized Loyalty NFTs)
**Status:** Frontend UI Complete | **Backend:** Pending

On-chain loyalty program with soulbound NFT membership tiers.

**Frontend Implementation:**
- `src/pages/customer/CustomerLoyalty.tsx` — Two-tab interface:
  - **Points & Tiers**: Traditional points display with progress bar toward next tier
  - **NFT Membership**: Visual NFT card for current tier, perks list, all 4 tier NFTs (Bronze → Silver → Gold → Platinum), on-chain verification link

**Backend Requirements:**
- Deploy soulbound NFT smart contract on Avalanche (ERC-721 with transfer restrictions)
- Tier thresholds: Bronze (0 pts), Silver (1000), Gold (3000), Platinum (5000)
- Mint NFT on tier upgrade, burn previous tier NFT
- Metadata: store tier name, perks, customer ID, mint date
- Integration with DH3 protocol for decentralized identity verification
- On-chain perks verification: smart contract view function to check if address has valid tier NFT

**Smart Contract:**
```solidity
// AutoFlowMembership.sol
contract AutoFlowMembership is ERC721, Ownable {
    enum Tier { Bronze, Silver, Gold, Platinum }
    mapping(address => Tier) public memberTier;
    
    function upgradeTier(address member, Tier newTier) external onlyOwner {
        // Burn old, mint new with updated metadata
    }
    
    function _beforeTokenTransfer(...) internal override {
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
    }
}
```

---

### 6. 💰 Suzaku (Liquid Staking)
**Status:** Frontend UI Complete | **Backend:** Pending

AVAX liquid staking for business owners to earn yield on their payment earnings.

**Frontend Implementation:**
- `src/pages/owner/OwnerStaking.tsx` — Full staking dashboard:
  - Stats: total staked, rewards earned, APY, USD value
  - Stake form with amount input, max button, estimated rewards calculator
  - How-it-works explainer (Stake → sAVAX → Yield → Unstake)
  - Staking history with action type, amounts, and status

**Backend Requirements:**
- Integrate Suzaku liquid staking protocol SDK
- Implement stake/unstake transactions on Avalanche
- Track sAVAX balance and reward accrual
- Periodic reward distribution tracking
- Display real-time APY from Suzaku protocol

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Routing** | React Router v6 |
| **State** | TanStack React Query |
| **Blockchain** | Avalanche C-Chain (EVM) |
| **Backend (Planned)** | Supabase (PostgreSQL, Edge Functions, Auth, Storage) |
| **Payments** | M-Pesa STK Push, Tether WDK (USDT), USDC, Cash, Card |
| **AI** | Kite AI (decentralized inference) |
| **Video** | Agora RTC SDK |
| **Oracles** | Chainlink Data Feeds |
| **NFTs** | DH3 Protocol (soulbound membership tokens) |
| **DeFi** | Suzaku Liquid Staking (sAVAX) |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   └── DashboardLayout.tsx       # Multi-role sidebar layout with notifications
│   ├── shared/
│   │   └── SharedComponents.tsx      # StatCard, StatusBadge, PageHeader, EmptyState
│   ├── ui/                           # shadcn/ui component library
│   ├── ThemeProvider.tsx              # Dark/light mode via next-themes
│   └── ThemeToggle.tsx               # Animated sun/moon toggle
├── pages/
│   ├── LandingPage.tsx               # Public marketing page with hero
│   ├── LoginPage.tsx                 # Authentication
│   ├── RegisterPage.tsx              # Multi-role registration
│   ├── customer/
│   │   ├── CustomerDashboard.tsx     # Overview with upcoming bookings
│   │   ├── BookService.tsx           # 3-step booking flow (Tether/Chainlink)
│   │   ├── CustomerBookings.tsx      # Booking history
│   │   ├── CustomerLiveView.tsx      # Agora live video check-in
│   │   ├── CustomerVehicles.tsx      # Vehicle management
│   │   ├── CustomerLoyalty.tsx       # Points + DH3 NFT membership
│   │   ├── CustomerPayments.tsx      # Payment history (M-Pesa + crypto)
│   │   └── CustomerWallet.tsx        # Tether WDK wallet + Chainlink prices
│   ├── detailer/
│   │   ├── DetailerDashboard.tsx     # Job overview
│   │   ├── DetailerJobs.tsx          # Job management + Agora "Go Live"
│   │   ├── DetailerSchedule.tsx      # Weekly availability
│   │   └── DetailerEarnings.tsx      # Earnings tracking
│   ├── owner/
│   │   ├── OwnerDashboard.tsx        # Business overview with revenue chart
│   │   ├── OwnerAIInsights.tsx       # Kite AI insights + chat assistant
│   │   ├── OwnerStaking.tsx          # Suzaku AVAX liquid staking
│   │   ├── OwnerAnalytics.tsx        # Charts and analytics
│   │   ├── OwnerBookings.tsx         # All bookings management
│   │   ├── OwnerServices.tsx         # Service catalog management
│   │   ├── OwnerStaff.tsx            # Detailer management
│   │   ├── OwnerLocations.tsx        # Location management
│   │   └── OwnerPayments.tsx         # Revenue and payouts
│   └── admin/
│       ├── AdminDashboard.tsx        # Platform-wide overview
│       ├── AdminUsers.tsx            # User management
│       ├── AdminBookings.tsx         # All bookings
│       ├── AdminTransactions.tsx     # Financial audit (M-Pesa + crypto)
│       ├── AdminServices.tsx         # Service approval
│       └── AdminApprovals.tsx        # Business onboarding approvals
├── data/
│   └── mockData.ts                   # Comprehensive mock data
├── types/
│   └── index.ts                      # TypeScript interfaces
└── hooks/                            # Custom React hooks
```

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd autoflow

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`

### Demo Routes

| Role | URL | Demo User |
|------|-----|-----------|
| Landing | `/` | — |
| Customer | `/customer` | James Mwangi |
| Detailer | `/detailer` | Peter Ochieng |
| Owner | `/owner` | David Kamau |
| Admin | `/admin` | Sarah Njeri |

---

## 🔐 Backend Implementation Roadmap

### Phase 1: Core Infrastructure
1. Enable Supabase/Lovable Cloud
2. Set up database tables: users, vehicles, services, locations, bookings, transactions
3. Implement Row Level Security (RLS) policies per role
4. Authentication with email/password + wallet connect

### Phase 2: Payments (Tether + Chainlink)
1. Deploy payment escrow smart contract on Avalanche Fuji testnet
2. Integrate Tether WDK SDK for wallet connections
3. Set up Chainlink price feed reader contract
4. Build Edge Function for price caching
5. Implement M-Pesa STK Push via Safaricom Daraja API

### Phase 3: AI & Real-Time (Kite AI + Agora)
1. Build data aggregation pipeline for AI insights
2. Integrate Kite AI inference API
3. Set up Agora token server Edge Function
4. Implement video streaming in React components

### Phase 4: Loyalty & DeFi (DH3 + Suzaku)
1. Deploy soulbound NFT membership contract
2. Integrate DH3 protocol for identity
3. Connect Suzaku liquid staking for owner yields

---

## 🎨 Design System

- **Fonts**: DM Serif Display (headings) + DM Sans (body)
- **Colors**: Forest green primary (`hsl(152, 35%, 25%)`) + Gold accent (`hsl(36, 80%, 55%)`)
- **Dark mode**: Full dark theme with warm gold primary swap
- **Components**: shadcn/ui with custom design tokens
- **Animations**: Framer Motion throughout

---

## 📄 License

Built for the Avalanche Hackathon 2026. All rights reserved.
