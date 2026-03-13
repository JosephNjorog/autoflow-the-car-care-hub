import { Link } from 'react-router-dom';
import {
  Brain, Coins, Zap, Shield, BarChart3, Globe, CheckCircle, Clock, Sparkles,
  ArrowLeft, Layers, ChevronRight, Lock, CreditCard, Video, Wallet, Key,
  MapPin, Star, Bell, Users, Camera, TrendingUp, ShieldCheck, FileCode2, Smartphone, SplitSquareVertical,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ── Shipped milestones ────────────────────────────────────────────────────────
const shippedItems = [
  {
    icon: Key,
    gradient: 'from-slate-500 to-slate-700',
    glow: 'shadow-slate-500/20',
    category: 'Auth & Roles',
    title: 'Multi-Role Authentication',
    description: 'JWT auth with four roles (customer, detailer, owner, admin), Google OAuth, password reset, and owner approval gating.',
  },
  {
    icon: ShieldCheck,
    gradient: 'from-teal-500 to-emerald-600',
    glow: 'shadow-teal-500/20',
    category: 'Booking & Escrow',
    title: 'Booking System + Escrow',
    description: 'Full booking lifecycle (pending → confirmed → in_progress → completed) with 2-hour escrow auto-release protecting customer funds.',
  },
  {
    icon: Zap,
    gradient: 'from-green-500 to-emerald-600',
    glow: 'shadow-green-500/20',
    category: 'Payments',
    title: 'M-Pesa STK Push',
    description: 'Safaricom Daraja API integration — real-time STK Push with async callback webhook and frontend polling.',
  },
  {
    icon: Coins,
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
    category: 'Web3 Payments',
    title: 'USDT / USDC on Avalanche',
    description: 'ERC-20 token payments via injected wallets (Core, MetaMask, Trust). Dual-transfer splits 10% to AutoPayKe, 90% to owner.',
  },
  {
    icon: Wallet,
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/20',
    category: 'Embedded Wallet',
    title: 'Tether WDK Wallet',
    description: 'Self-custodial browser wallet via Tether WDK — 12-word seed phrase, HD derivation, balance display, and private-key auto-wipe.',
  },
  {
    icon: TrendingUp,
    gradient: 'from-blue-500 to-sky-500',
    glow: 'shadow-blue-500/20',
    category: 'Oracles',
    title: 'Chainlink Price Feeds',
    description: 'On-chain AVAX/USDT/USDC prices from Chainlink AggregatorV3 contracts, with staleness guard and CoinGecko fallback.',
  },
  {
    icon: MapPin,
    gradient: 'from-rose-500 to-pink-600',
    glow: 'shadow-rose-500/20',
    category: 'Owner Tools',
    title: 'Business Management',
    description: 'Full CRUD for locations, services (28 templates), analytics dashboard with revenue/booking/customer charts.',
  },
  {
    icon: Star,
    gradient: 'from-yellow-500 to-amber-500',
    glow: 'shadow-yellow-500/20',
    category: 'Loyalty',
    title: 'Loyalty Points (4 Tiers)',
    description: 'Earn 1pt per KES 10 spent. Tiers: Bronze → Silver → Gold → Platinum. Points history and tier progress tracker.',
  },
  {
    icon: Users,
    gradient: 'from-indigo-500 to-blue-600',
    glow: 'shadow-indigo-500/20',
    category: 'Staff',
    title: 'Offline + Online Staff',
    description: 'Owners manage offline staff (no app account) and invite online detailers. Assign either type to any booking.',
  },
  {
    icon: Bell,
    gradient: 'from-cyan-500 to-sky-500',
    glow: 'shadow-cyan-500/20',
    category: 'Notifications',
    title: 'Email Notifications',
    description: '8 transactional email templates (booking confirmation, status updates, owner approval, detailer invites) via Brevo SMTP.',
  },
  {
    icon: Camera,
    gradient: 'from-fuchsia-500 to-purple-600',
    glow: 'shadow-fuchsia-500/20',
    category: 'Detailer Workflow',
    title: 'Before / After Photos',
    description: 'Detailers upload Cloudinary photos at job start and completion — stored per booking for quality documentation.',
  },
  {
    icon: ShieldCheck,
    gradient: 'from-slate-500 to-zinc-600',
    glow: 'shadow-slate-500/20',
    category: 'Admin',
    title: 'Admin & Owner Approvals',
    description: 'Admin dashboard with owner approval queue, user management, platform-wide transactions, and booking oversight.',
  },
  {
    icon: FileCode2,
    gradient: 'from-red-500 to-orange-500',
    glow: 'shadow-red-500/20',
    category: 'Smart Contract',
    title: 'AutoFlowPayments Contract',
    description: 'Solidity 0.8.20 smart contract on Avalanche C-Chain — atomic 90/10 token split with payWithToken and payWithAVAX. Hardhat deploy + SnowTrace verification.',
  },
  {
    icon: SplitSquareVertical,
    gradient: 'from-green-600 to-teal-600',
    glow: 'shadow-green-600/20',
    category: 'Payments',
    title: 'M-Pesa Escrow + B2C Payout',
    description: 'STK Push captures full payment into AutoPayKe escrow. On customer confirmation, 90% auto-paid to owner via Daraja B2C API. Works for both pay-now and pay-at-pickup.',
  },
  {
    icon: Smartphone,
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/20',
    category: 'Owner Tools',
    title: 'Owner Payment Settings',
    description: 'Owners configure M-Pesa payout type (Send Money / Till / Paybill) and link their Avalanche crypto wallet. SnowTrace links on every on-chain transaction.',
  },
];

// ── Upcoming roadmap items ────────────────────────────────────────────────────
const roadmapItems = [
  {
    quarter: 'Q2 2026',
    category: 'Live Features',
    icon: Video,
    gradient: 'from-sky-500 to-blue-600',
    glow: 'shadow-sky-500/25',
    status: 'in-progress' as const,
    title: 'Agora RTC Live View',
    description: 'Live video streaming between customer and detailer during service. Watch your car being cleaned in real-time for full peace of mind.',
    features: [
      'Real-time video stream from detailer device',
      'Customer-side live view in the app',
      'Session recording for dispute resolution',
      'Low-latency Agora SDK integration',
      'Auto-start on job status → in_progress',
    ],
  },
  {
    quarter: 'Q2 2026',
    category: 'AI & Intelligence',
    icon: Brain,
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/25',
    status: 'planned' as const,
    title: 'Kite AI Insights',
    description: 'Smart business analytics powered by Kite AI. Predict peak demand, optimise pricing dynamically, identify underperforming services, and get AI-generated recommendations.',
    features: [
      'Demand forecasting by location and season',
      'Dynamic pricing recommendations',
      'Customer churn prediction',
      'Revenue optimisation engine',
      'Automated performance reports',
    ],
  },
  {
    quarter: 'Q2 2026',
    category: 'Web3 Payments',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/25',
    status: 'in-progress' as const,
    title: 'Full Crypto Payment Suite',
    description: 'Expand on-chain payment infrastructure. Pay with AVAX directly, auto-convert to KES via Chainlink oracles, and build credit history on-chain.',
    features: [
      'AVAX direct payments (in addition to USDT/USDC)',
      'Cross-chain payments via bridges',
      'On-chain payment receipts & history',
      'Credit scoring from transaction history',
      'WalletConnect v2 for mobile wallets',
    ],
  },
  {
    quarter: 'Q2 2026',
    category: 'Analytics & Reporting',
    icon: BarChart3,
    gradient: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/25',
    status: 'in-progress' as const,
    title: 'Advanced Business Intelligence',
    description: 'Deep analytics for owners and the AutoPayKe network. Customer lifetime value, cohort analysis, location benchmarking, and detailer performance scoring.',
    features: [
      'Customer LTV and cohort analysis',
      'Location vs. network benchmarking',
      'Detailer performance scoring',
      'Predictive maintenance reminders',
      'Exportable reports (PDF/CSV)',
    ],
  },
  {
    quarter: 'Q2 2026',
    category: 'Payments',
    icon: CreditCard,
    gradient: 'from-emerald-500 to-green-600',
    glow: 'shadow-emerald-500/25',
    status: 'planned' as const,
    title: 'Stripe Card Payments',
    description: 'Add credit/debit card as a 4th payment method alongside M-Pesa, USDT, and USDC. Supports international customers and corporate bookings.',
    features: [
      'Stripe Checkout integration',
      'Visa, Mastercard, Amex support',
      'Saved cards for repeat customers',
      '3D Secure & fraud protection',
      'Card receipts via email',
    ],
  },
  {
    quarter: 'Q2 2026',
    category: 'Security',
    icon: Lock,
    gradient: 'from-slate-500 to-zinc-600',
    glow: 'shadow-slate-500/25',
    status: 'planned' as const,
    title: 'WDK Seed Encryption',
    description: 'Encrypt seed phrases stored in localStorage using WebCrypto AES-GCM with a user-set PIN — eliminating plaintext key exposure.',
    features: [
      'WebCrypto AES-GCM encryption',
      'User-defined PIN as encryption key',
      'Encrypted seed in localStorage (never plaintext)',
      'PIN prompt on each wallet unlock',
      'No PIN recovery — true self-custody',
    ],
  },
  {
    quarter: 'Q3 2026',
    category: 'DeFi & Staking',
    icon: Coins,
    gradient: 'from-red-500 to-rose-600',
    glow: 'shadow-red-500/25',
    status: 'planned' as const,
    title: 'Suzaku AVAX Liquid Staking',
    description: 'Put your AutoPayKe revenue to work. Stake AVAX through Suzaku Protocol directly from the platform and earn yields while your money waits.',
    features: [
      'One-click AVAX staking via Suzaku Protocol',
      'Liquid staking tokens (sAVAX) for instant liquidity',
      'Real-time APY tracking',
      'Auto-compound rewards',
      'DeFi yield dashboard for business owners',
    ],
  },
  {
    quarter: 'Q3 2026',
    category: 'Web3 Loyalty',
    icon: Star,
    gradient: 'from-yellow-500 to-amber-600',
    glow: 'shadow-yellow-500/25',
    status: 'planned' as const,
    title: 'DH3 Soulbound NFT Loyalty',
    description: 'Mint non-transferable soulbound NFTs representing your loyalty tier. Your Bronze → Platinum status lives on-chain and is verifiable anywhere.',
    features: [
      'ERC-5114 soulbound NFT per tier',
      'Auto-upgrade on tier promotion',
      'On-chain verification of loyalty status',
      'NFT-gated exclusive discounts',
      'Partner ecosystem access via NFT',
    ],
  },
  {
    quarter: 'Q3 2026',
    category: 'Security & Identity',
    icon: Shield,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/25',
    status: 'planned' as const,
    title: 'Decentralised Identity (DID)',
    description: 'Self-sovereign identity for customers and detailers. Verifiable credentials, portable reputation, and privacy-preserving KYC.',
    features: [
      'W3C DID standard compliance',
      'Portable detailer reputation across platforms',
      'On-chain certifications and badges',
      'Privacy-preserving KYC',
      'Integration with existing NFT membership',
    ],
  },
  {
    quarter: 'Q3 2026',
    category: 'Notifications',
    icon: Bell,
    gradient: 'from-orange-500 to-amber-500',
    glow: 'shadow-orange-500/25',
    status: 'planned' as const,
    title: 'FCM Push Notifications',
    description: 'Real-time push notifications on mobile and desktop via Firebase Cloud Messaging — booking updates, payment confirmations, and promotions.',
    features: [
      'Firebase Cloud Messaging integration',
      'Booking status push alerts',
      'Payment confirmation notifications',
      'Promotional campaigns for owners',
      'Granular user opt-in preferences',
    ],
  },
  {
    quarter: 'Q4 2026',
    category: 'Global Expansion',
    icon: Globe,
    gradient: 'from-cyan-500 to-sky-600',
    glow: 'shadow-cyan-500/25',
    status: 'planned' as const,
    title: 'Multi-Country Expansion',
    description: 'AutoPayKe goes beyond Kenya. Uganda, Tanzania, Rwanda, Nigeria — with local payment methods and multi-currency pricing.',
    features: [
      'Uganda, Tanzania, Rwanda, Nigeria launch',
      'MTN Mobile Money & Airtel Money integration',
      'Multi-currency pricing engine',
      'Local tax and compliance support',
      'Franchise / white-label offering',
    ],
  },
];

const statusConfig = {
  'planned': { label: 'Planned', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', Icon: Clock },
  'in-progress': { label: 'In Progress', dot: 'bg-sky-400 animate-pulse', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', Icon: Sparkles },
  'done': { label: 'Shipped', dot: 'bg-green-400', badge: 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300', Icon: CheckCircle },
} as const;

const upcomingQuarters = ['Q2 2026', 'Q3 2026', 'Q4 2026'];

const techStack = [
  { name: 'Avalanche C-Chain', desc: 'High-throughput, low-cost L1' },
  { name: 'Chainlink Oracles', desc: 'Real-time price feeds' },
  { name: 'Suzaku Protocol', desc: 'Liquid staking for AVAX' },
  { name: 'Kite AI', desc: 'Business intelligence engine' },
  { name: 'Tether WDK', desc: 'Wallet connectivity layer' },
  { name: 'DH3 NFT Standards', desc: 'Loyalty membership NFTs' },
];

export default function RoadmapPage() {
  const inProgressCount = roadmapItems.filter(r => r.status === 'in-progress').length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">AutoPayKe</span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/8 via-blue-600/4 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-sky-500/12 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              Built on Avalanche · Hackathon 2025 → Production 2026
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              The AutoPayKe{' '}
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                Product Roadmap
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From hackathon prototype to production platform. Here's everything we've shipped and everything coming next — built on Avalanche for real-world adoption across Africa.
            </p>
          </motion.div>

          {/* Stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mt-10"
          >
            {[
              { label: `${shippedItems.length} Milestones`, sub: 'already shipped', color: 'text-green-600 dark:text-green-400' },
              { label: `${inProgressCount} In Progress`, sub: 'shipping Q2 2026', color: 'text-sky-600 dark:text-sky-400' },
              { label: `${roadmapItems.length} Features`, sub: 'in the pipeline', color: 'text-foreground' },
            ].map((stat, i) => (
              <div key={i} className="px-5 py-3 rounded-xl bg-card border border-border text-center min-w-[130px]">
                <div className={`font-bold ${stat.color}`}>{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Shipped Section ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Q1 2026 — Shipped</h2>
              <p className="text-xs text-muted-foreground">{shippedItems.length} milestones delivered</p>
            </div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-green-500/30 to-transparent" />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <CheckCircle className="w-3 h-3" />
            Shipped
          </span>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {shippedItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 p-4 rounded-xl bg-card border border-border hover:border-green-500/30 hover:shadow-md transition-all duration-200"
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shrink-0 shadow-md ${item.glow}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.category}</p>
                  <h3 className="text-sm font-semibold text-foreground leading-tight mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Upcoming Timeline ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold text-foreground">What's Coming Next</h2>
          <p className="text-sm text-muted-foreground mt-1">The next three quarters of planned work.</p>
        </motion.div>

        {upcomingQuarters.map((quarter, qi) => {
          const items = roadmapItems.filter(r => r.quarter === quarter);
          return (
            <div key={quarter} className="mb-16">
              {/* Quarter header */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: qi * 0.1 }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-500/30">
                    {qi + 1}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{quarter}</h2>
                    <p className="text-xs text-muted-foreground">{items.length} feature{items.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              </motion.div>

              {/* Cards */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {items.map((item, i) => {
                  const status = statusConfig[item.status];
                  const Icon = item.icon;
                  const StatusIcon = status.Icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: qi * 0.1 + i * 0.08 + 0.1 }}
                      className="group relative flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300"
                    >
                      {/* Top gradient bar */}
                      <div className={`h-1 w-full bg-gradient-to-r ${item.gradient}`} />

                      <div className="flex flex-col flex-1 p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg ${item.glow}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{item.category}</p>
                              <h3 className="font-bold text-foreground leading-tight">{item.title}</h3>
                            </div>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="mb-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">{item.description}</p>

                        {/* Features */}
                        <ul className="space-y-2 border-t border-border pt-4">
                          {item.features.map((f, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <ChevronRight className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Tech Stack */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold mb-3">Built for the Avalanche Ecosystem</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
              Every feature is composable within the Avalanche ecosystem — high-throughput, low-cost, and built for real-world adoption across Africa and beyond.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                className="p-4 rounded-xl bg-card border border-border text-center hover:border-sky-500/30 transition-colors"
              >
                <div className="font-semibold text-sm text-foreground mb-1">{tech.name}</div>
                <div className="text-[11px] text-muted-foreground leading-snug">{tech.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8">
              AutoPayKe is live today. Book a car wash, manage your detailing business, or join as a partner.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-sky-500/25"
              >
                Get Started Free
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Layers className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-foreground">AutoFlow</span>
            <span>— The Car Care Hub</span>
          </div>
          <p>© {new Date().getFullYear()} AutoFlow. Built on Avalanche.</p>
        </div>
      </footer>
    </div>
  );
}
