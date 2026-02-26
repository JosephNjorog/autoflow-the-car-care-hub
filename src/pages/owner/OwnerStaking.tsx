import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Coins, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OwnerStaking() {
  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="AVAX Staking" subtitle="Earn yield on your AVAX earnings • Powered by Suzaku" />

      {/* Coming Soon banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-primary/5 border border-primary/20 mb-8 flex items-start gap-4"
      >
        <div className="p-3 rounded-lg bg-primary/10 shrink-0">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-foreground mb-1">Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            AVAX staking via Suzaku liquid staking is on our roadmap. Once launched, business owners will be able to stake their AVAX earnings directly from AutoFlow and earn passive yield — without locking capital.
          </p>
        </div>
      </motion.div>

      {/* Informational: how it will work */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10"><Coins className="w-5 h-5 text-primary" /></div>
            <div>
              <h3 className="font-display text-foreground">How It Will Work</h3>
              <p className="text-xs text-muted-foreground">Suzaku liquid staking on Avalanche</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Stake AVAX', desc: 'Deposit your AVAX earnings from AutoFlow into the Suzaku liquid staking pool.' },
              { step: '2', title: 'Receive sAVAX', desc: 'Get liquid staking tokens (sAVAX) that represent your staked position and accrue rewards.' },
              { step: '3', title: 'Earn Yield', desc: 'Your AVAX earns staking rewards while sAVAX remains liquid and usable in DeFi.' },
              { step: '4', title: 'Unstake Anytime', desc: 'Redeem your sAVAX back to AVAX plus earned rewards at any time.' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{item.step}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border shadow-card">
          <h3 className="font-display text-foreground mb-4">Why Stake Your AVAX?</h3>
          <div className="space-y-4">
            {[
              { icon: <TrendingUp className="w-4 h-4 text-primary" />, title: 'Passive Yield', desc: 'Earn ~7% APY on your idle AVAX earnings without any active management.' },
              { icon: <Coins className="w-4 h-4 text-primary" />, title: 'Liquid Position', desc: 'sAVAX is fully liquid — use it in DeFi while still earning staking rewards.' },
              { icon: <ArrowRight className="w-4 h-4 text-primary" />, title: 'No Lock-Up', desc: 'Unstake any time. There are no minimum lock-up periods with Suzaku.' },
            ].map(b => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">{b.icon}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Powered by Suzaku:</strong> Liquid staking on Avalanche lets business owners earn passive yield on their AVAX payment earnings without locking capital. sAVAX remains transferable and composable across DeFi.
        </p>
      </div>
    </DashboardLayout>
  );
}
