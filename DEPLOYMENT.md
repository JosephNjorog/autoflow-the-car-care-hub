# AutoFlow — Deployment Guide

Full step-by-step guide to deploy AutoFlow to Vercel with all integrations.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables Overview](#environment-variables-overview)
3. [Database Setup (Neon)](#1-database-setup-neon)
4. [SMTP Email (Gmail)](#2-smtp-email-gmail)
5. [Google OAuth](#3-google-oauth)
6. [M-Pesa Daraja API](#4-m-pesa-daraja-api)
7. [Crypto Payments (Avalanche)](#5-crypto-payments-avalanche)
8. [Deploying to Vercel](#6-deploying-to-vercel)
9. [Post-Deploy Checklist](#7-post-deploy-checklist)
10. [Local Development](#8-local-development)

---

## Prerequisites

- Node.js 20+ and npm
- A [Vercel](https://vercel.com) account (free tier works)
- A [Neon](https://neon.tech) account (free tier works)
- A Gmail account for sending emails
- A Google Cloud account for Google OAuth (free)

---

## Environment Variables Overview

All variables that must be set in Vercel. Variables prefixed `VITE_` are exposed to the browser. All others are server-side only.

| Variable | Required | Where to Get It |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Dashboard |
| `JWT_SECRET` | ✅ | Generate randomly |
| `SMTP_HOST` | ✅ | `smtp.gmail.com` |
| `SMTP_PORT` | ✅ | `587` |
| `SMTP_USER` | ✅ | Your Gmail address |
| `SMTP_PASS` | ✅ | Gmail App Password |
| `GOOGLE_CLIENT_ID` | ✅ | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google Cloud Console |
| `MPESA_CONSUMER_KEY` | ✅ | Safaricom Daraja Portal |
| `MPESA_CONSUMER_SECRET` | ✅ | Safaricom Daraja Portal |
| `MPESA_SHORTCODE` | ✅ | Safaricom Daraja Portal |
| `MPESA_PASSKEY` | ✅ | Safaricom Daraja Portal |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your Vercel URL |
| `VITE_AUTOFLOW_WALLET` | ✅ | Your Avalanche wallet address |
| `VITE_AVAX_RPC` | Optional | Avalanche RPC provider |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Optional | Reown Cloud |

---

## 1. Database Setup (Neon)

**Cost:** Free (0.5 GB storage, generous for a startup)

1. Go to [neon.tech](https://neon.tech) and create an account
2. Click **New Project** → give it a name (e.g. `autoflow`)
3. Select region closest to your users (e.g. `us-east-1` or `eu-west-1`)
4. Click **Create Project**
5. In the dashboard, click **Connection string** → select **Pooled connection** → copy the URL
6. It looks like: `postgresql://neondb_owner:password@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`

**Run the schema:**
```bash
# From your project root
node --env-file=.env.local --import tsx db/migrate.ts
# or connect via psql and run db/schema.sql manually
```

Set env var:
```
DATABASE_URL=postgresql://neondb_owner:...@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 2. SMTP Email (Gmail)

**Cost:** Free

AutoFlow sends automated emails for registrations, bookings, approvals, etc.

### Get a Gmail App Password

> ⚠️ You **must** use an App Password, not your regular Gmail password. 2-Factor Authentication must be enabled.

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Scroll to **How you sign in to Google** → click **2-Step Verification** (enable if not already)
4. Go back to Security → scroll down to **App Passwords** (search for it if needed)
5. Click **App Passwords**
6. Under "Select app" choose **Mail**, under "Select device" choose **Other** → type `AutoFlow`
7. Click **Generate** → copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

Set env vars:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=xxxxxxxxxxxx
```

---

## 3. Google OAuth

**Cost:** Free

Allows users to sign in with their Google account.

### Create OAuth Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Click **APIs & Services** → **Library** → search for **Google+ API** → Enable it
4. Click **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen first if prompted:
   - User Type: **External**
   - App name: `AutoFlow`
   - Add your email as a test user
6. Application type: **Web application**
7. Name: `AutoFlow Web`
8. Under **Authorized redirect URIs**, add:
   - `http://localhost:8080/api/auth/google-callback` (local dev)
   - `https://your-app.vercel.app/api/auth/google-callback` (production — update after deploying)
9. Click **Create** → copy the **Client ID** and **Client Secret**

Set env vars:
```
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
```

---

## 4. M-Pesa Daraja API

**Cost:** Free for sandbox; production requires a Safaricom business account

M-Pesa STK Push lets customers pay directly from their phone.

### Sandbox Setup (Development & Testing)

1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke) and create an account
2. Click **My Apps** → **Add a new app**
3. Give it a name (e.g. `AutoFlow`)
4. Under APIs to subscribe to, check **Lipa Na M-PESA Sandbox**
5. Click **Create app**
6. From the app page, copy:
   - **Consumer Key**
   - **Consumer Secret**
7. Click **APIs** → **Lipa Na M-PESA** → scroll down to **Test Credentials**
   - Copy the **Lipa Na M-PESA Online Passkey**
   - The test **Business ShortCode** is `174379`

Set env vars:
```
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
```

### Sandbox Test Numbers

Use these phone numbers when testing STK Push:
- `254708374149` — always succeeds
- `254704700000` — always fails

### Production (Go Live)

1. Go to Safaricom Business (requires registered KE business)
2. Apply for **Lipa Na M-PESA Online** via [safaricom.co.ke/business](https://safaricom.co.ke/business)
3. You'll get a real shortcode and passkey
4. Change `MPESA_BASE` in `api/payments/mpesa-stk.ts` from `sandbox.safaricom.co.ke` to `api.safaricom.co.ke`

---

## 5. Crypto Payments (Avalanche)

**Cost:** Free (you just need an Avalanche wallet)

AutoFlow accepts USDT and USDC payments on Avalanche C-Chain. Customers need MetaMask or Trust Wallet installed.

### Token Addresses (Avalanche C-Chain Mainnet)

| Token | Contract Address |
|---|---|
| **USDT** (Tether) | `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7` |
| **USDC** | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |
| **AVAX** (native) | `0x0000...` (native gas token) |

These are the official token addresses — hardcoded in `src/lib/crypto.ts`.

### Create an AutoFlow Business Wallet

> This wallet receives all USDT/USDC payments from customers.

**Option A — Trust Wallet (recommended for mobile management):**
1. Download Trust Wallet on your phone
2. Create a new wallet → save the 12-word seed phrase securely (NEVER share it)
3. Tap **Receive** → search **Avalanche** → copy the address (starts with `0x`)

**Option B — MetaMask:**
1. Install the MetaMask browser extension at [metamask.io](https://metamask.io)
2. Create a new wallet → save the seed phrase
3. Copy your wallet address from the top (starts with `0x`)
4. Add Avalanche C-Chain network:
   - Network Name: `Avalanche C-Chain`
   - RPC URL: `https://api.avax.network/ext/bc/C/rpc`
   - Chain ID: `43114`
   - Currency Symbol: `AVAX`
   - Explorer: `https://snowtrace.io`

Set env var:
```
VITE_AUTOFLOW_WALLET=0xYourWalletAddressHere
```

### How Payments Work

1. Customer selects USDT or USDC at checkout
2. AutoFlow calculates the USD amount using the Chainlink feed rate (1 USD = ~129 KES, updated in `BookService.tsx`)
3. The customer's wallet (MetaMask/Trust Wallet browser) prompts them to approve the ERC-20 transfer
4. On confirmation, the exact USDT/USDC amount transfers directly to `VITE_AUTOFLOW_WALLET`
5. The booking is marked as paid

### Withdrawing Funds

- Install MetaMask or Trust Wallet and import your business wallet
- Connect to [app.uniswap.org](https://app.uniswap.org) to swap USDT → AVAX if needed
- Use [binance.com](https://binance.com) or [bybit.com](https://bybit.com) to off-ramp to KES

### Tether WDK (Advanced — Future)

Tether's Wallet Development Kit ([wdk.tether.to](https://wdk.tether.to)) is for wallet providers to natively support USDT features. For dApp payments (our use case), using `ethers.js` + `window.ethereum` is the correct approach and is already implemented.

### WalletConnect (Future Mobile Enhancement)

To support mobile wallets via QR code scan (no browser extension needed):
1. Go to [cloud.reown.com](https://cloud.reown.com) (formerly WalletConnect Cloud)
2. Create an account → **New Project** → Web
3. Copy the **Project ID**
4. Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id`
5. Install: `npm install @reown/appkit @reown/appkit-adapter-ethers`
6. Replace `window.ethereum` in `src/lib/crypto.ts` with AppKit modal

---

## 6. Deploying to Vercel

### Step 1 — Push to GitHub

```bash
git add -A
git commit -m "Initial AutoFlow deployment"
git push origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select your GitHub repo
3. Framework Preset: **Other** (not Next.js — this is Vite + Vercel Functions)
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy** (it will fail — that's fine, we still need to set env vars)

### Step 3 — Add Environment Variables

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add **every variable** from `.env.example`, one by one:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `JWT_SECRET` | A long random string (generate below) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your@gmail.com |
| `SMTP_PASS` | Your Gmail App Password |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `MPESA_CONSUMER_KEY` | From Safaricom Daraja |
| `MPESA_CONSUMER_SECRET` | From Safaricom Daraja |
| `MPESA_SHORTCODE` | `174379` (sandbox) |
| `MPESA_PASSKEY` | From Safaricom Daraja |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `VITE_AUTOFLOW_WALLET` | Your Avalanche wallet address |
| `NODE_ENV` | `production` |

**Generate a JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4 — Redeploy

1. After adding all env vars, go to **Deployments** → click your latest deployment → **Redeploy**
2. Or push any commit to trigger a new deployment

### Step 5 — Update OAuth Redirect URIs

After deployment, you'll have a URL like `https://autoflow-xyz.vercel.app`:

**Google OAuth:**
- Google Cloud Console → Credentials → your OAuth Client
- Add `https://autoflow-xyz.vercel.app/api/auth/google-callback` to Authorized Redirect URIs

**M-Pesa (production only):**
- The callback URL is automatically set to `https://your-app.vercel.app/api/payments/mpesa-callback`

### Step 6 — Run DB Migrations on Production

Connect to Neon's SQL editor and run `db/schema.sql`:
1. Neon Dashboard → your project → **SQL Editor**
2. Paste the contents of `db/schema.sql` and run

Or from local:
```bash
# Uses your .env.local DATABASE_URL which points to production Neon
node --env-file=.env.local --import tsx db/migrate.ts
```

---

## 7. Post-Deploy Checklist

- [ ] App loads at `https://your-app.vercel.app`
- [ ] Register a new customer account → welcome email received
- [ ] Register a new business owner → pending approval email received
- [ ] Login works (email + Google OAuth)
- [ ] Booking page loads locations
- [ ] M-Pesa STK Push sends to test number `254708374149`
- [ ] USDT payment prompts MetaMask/Trust Wallet (wallet extension required)
- [ ] Admin can approve/reject owners → approval email received
- [ ] Forgot password → reset email received
- [ ] Roadmap page loads at `/roadmap` (no login required)
- [ ] Error pages render correctly (wrong URL → SPA routing works)

---

## 8. Local Development

```bash
# 1. Clone and install
git clone https://github.com/your/autoflow.git
cd autoflow
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your actual values

# 3. Start everything (API server on :3000 + Vite on :8080)
npm run dev:full

# Or run separately in two terminals:
npm run dev:api   # API server (tsx watch dev-server.ts)
npm run dev       # Vite frontend
```

**Access:**
- Frontend: [http://localhost:8080](http://localhost:8080)
- API: [http://localhost:3000](http://localhost:3000) (proxied via Vite)

**Tech stack:**
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Vercel Serverless Functions (TypeScript, Node 20)
- Database: Neon (serverless PostgreSQL)
- Auth: JWT + bcrypt + Google OAuth
- Payments: Safaricom Daraja (M-Pesa) + ethers.js (USDT/USDC on Avalanche)
- Email: Nodemailer via Gmail SMTP
- Blockchain: Avalanche C-Chain, Chainlink price feeds (planned), Suzaku staking (roadmap)

---

## Integrations Summary — API Keys Needed

| Service | What It's For | Cost | Sign Up |
|---|---|---|---|
| **Neon** | PostgreSQL database | Free | [neon.tech](https://neon.tech) |
| **Gmail** | Sending transactional emails | Free | [gmail.com](https://gmail.com) |
| **Google Cloud** | Google OAuth (Sign in with Google) | Free | [console.cloud.google.com](https://console.cloud.google.com) |
| **Safaricom Daraja** | M-Pesa STK Push payments | Free sandbox | [developer.safaricom.co.ke](https://developer.safaricom.co.ke) |
| **Avalanche Wallet** | Receiving USDT/USDC payments | Free | MetaMask or Trust Wallet |
| **Reown (WalletConnect)** | Mobile wallet QR connect (future) | Free | [cloud.reown.com](https://cloud.reown.com) |
| **Chainlink** | Live USD→KES rate feed (planned) | Free read | [chain.link](https://chain.link) |
| **Suzaku** | AVAX liquid staking (roadmap Q3 2026) | N/A yet | [suzaku.network](https://suzaku.network) |
| **Kite AI** | Business analytics AI (roadmap Q2 2026) | N/A yet | [kiteai.xyz](https://kiteai.xyz) |
