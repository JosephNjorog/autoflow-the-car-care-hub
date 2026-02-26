import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Brain, Coins, Zap, Shield, BarChart3, Globe, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const roadmapItems = [
  {
    category: 'AI & Intelligence',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-blue-500 to-indigo-600',
    badge: 'Q2 2026',
    status: 'planned',
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
    category: 'DeFi & Staking',
    icon: <Coins className="w-6 h-6" />,
    color: 'from-red-500 to-rose-600',
    badge: 'Q3 2026',
    status: 'planned',
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
    category: 'Web3 Payments',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-amber-500 to-orange-600',
    badge: 'Q2 2026',
    status: 'in-progress',
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
    category: 'Security & Identity',
    icon: <Shield className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Q3 2026',
    status: 'planned',
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
    category: 'Analytics & Reporting',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-purple-500 to-violet-600',
    badge: 'Q2 2026',
    status: 'in-progress',
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
    category: 'Global Expansion',
    icon: <Globe className="w-6 h-6" />,
    color: 'from-cyan-500 to-sky-600',
    badge: 'Q4 2026',
    status: 'planned',
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'planned': { label: 'Planned', color: 'bg-muted text-muted-foreground', icon: <Clock className="w-3 h-3" /> },
  'in-progress': { label: 'In Progress', color: 'bg-primary/10 text-primary', icon: <Sparkles className="w-3 h-3" /> },
  'done': { label: 'Shipped', color: 'bg-success/10 text-success', icon: <CheckCircle className="w-3 h-3" /> },
};

export default function RoadmapPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Product Roadmap"
        subtitle="What's coming next for AutoFlow — built on Avalanche"
      />

      <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>AutoFlow</strong> is building the future of car care on Avalanche. The features below were scoped for our hackathon submission and are actively in development. Each integration is designed to deliver real value to car wash owners, customers, and detailers in Africa and beyond.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {roadmapItems.map((item, i) => {
          const status = statusConfig[item.status];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{item.category}</p>
                    <h3 className="font-display text-foreground">{item.title}</h3>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="text-xs">{item.badge}</Badge>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                    {status.icon} {status.label}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>

              <ul className="space-y-1.5">
                {item.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-foreground">
                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-muted-foreground text-[8px]">→</span>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 p-5 rounded-xl bg-muted/50 border border-border">
        <h3 className="font-display text-foreground mb-2">Built for the Avalanche Ecosystem</h3>
        <p className="text-sm text-muted-foreground">AutoFlow leverages Avalanche's high-throughput, low-cost blockchain for payments, loyalty NFTs, and DeFi features. Our tech stack integrates Chainlink oracles, DH3 NFT standards, Tether WDK for wallet connectivity, Suzaku for liquid staking, and Kite AI for intelligent business insights — all composable within the Avalanche ecosystem.</p>
      </div>
    </DashboardLayout>
  );
}
