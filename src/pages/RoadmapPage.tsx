import { Link } from 'react-router-dom';
import { Brain, Coins, Zap, Shield, BarChart3, Globe, CheckCircle, Clock, Sparkles, ArrowLeft, Layers, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const roadmapItems = [
  {
    quarter: 'Q2 2026',
    category: 'AI & Intelligence',
    icon: Brain,
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/25',
    status: 'planned' as const,
    title: 'Kite AI Insights',
    description: 'Smart business analytics powered by Kite AI. Predict peak demand, optimize pricing dynamically, identify underperforming services, and get AI-generated recommendations to grow your car wash business.',
    features: [
      'Demand forecasting by location and season',
      'Dynamic pricing recommendations',
      'Customer churn prediction',
      'Revenue optimization engine',
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
    description: 'Complete on-chain payment infrastructure. Pay with any EVM token, auto-convert to KES via Chainlink oracles, and build credit history on-chain.',
    features: [
      'AVAX, USDT, USDC, and more',
      'Chainlink price feeds for real-time conversion',
      'Cross-chain payments via bridges',
      'On-chain payment receipts',
      'Credit scoring from transaction history',
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
    description: 'Deep analytics dashboard for owners and the AutoFlow network. Customer lifetime value, cohort analysis, location benchmarking, and predictive maintenance scheduling.',
    features: [
      'Customer LTV and cohort analysis',
      'Location vs. network benchmarking',
      'Detailer performance scoring',
      'Predictive maintenance reminders',
      'Exportable reports (PDF/CSV)',
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
    description: 'Put your AutoFlow revenue to work. Stake AVAX through Suzaku Protocol directly from the platform and earn yields while your money waits. Liquid staking means you can unstake anytime.',
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
    category: 'Security & Identity',
    icon: Shield,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/25',
    status: 'planned' as const,
    title: 'Decentralized Identity (DID)',
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
    quarter: 'Q4 2026',
    category: 'Global Expansion',
    icon: Globe,
    gradient: 'from-cyan-500 to-sky-600',
    glow: 'shadow-cyan-500/25',
    status: 'planned' as const,
    title: 'Multi-Country Expansion',
    description: 'AutoFlow goes beyond Kenya. Support for multiple African countries, local payment methods (MTN MoMo, Airtel Money), and multi-currency pricing.',
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

const quarters = ['Q2 2026', 'Q3 2026', 'Q4 2026'];

const techStack = [
  { name: 'Avalanche C-Chain', desc: 'High-throughput, low-cost L1' },
  { name: 'Chainlink Oracles', desc: 'Real-time price feeds' },
  { name: 'Suzaku Protocol', desc: 'Liquid staking for AVAX' },
  { name: 'Kite AI', desc: 'Business intelligence engine' },
  { name: 'Tether WDK', desc: 'Wallet connectivity layer' },
  { name: 'DH3 NFT Standards', desc: 'Loyalty membership NFTs' },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">AutoFlow</span>
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
              The AutoFlow{' '}
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                Product Roadmap
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We're building the future of car care on Avalanche — crypto payments, AI analytics, liquid staking, and decentralized identity. Here's what's coming.
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
              { label: '6 Features', sub: 'in pipeline' },
              { label: '2 In Progress', sub: 'shipping Q2' },
              { label: '3 Quarters', sub: 'to full launch' },
            ].map((stat, i) => (
              <div key={i} className="px-5 py-3 rounded-xl bg-card border border-border text-center min-w-[120px]">
                <div className="font-bold text-foreground">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {quarters.map((quarter, qi) => {
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
              AutoFlow is live today. Book a car wash, manage your detailing business, or join as a partner.
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
