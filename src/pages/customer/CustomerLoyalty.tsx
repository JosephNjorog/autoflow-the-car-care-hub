import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockLoyalty } from '@/data/mockData';
import { Star, Gift, TrendingUp, Shield, ExternalLink, Sparkles, Crown, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const nftTiers = [
  { name: 'Bronze', min: 0, color: 'from-amber-700 to-amber-600', icon: <Award className="w-6 h-6" />, perks: ['5% off all services', 'Points on every wash'], nftId: null },
  { name: 'Silver', min: 1000, color: 'from-gray-400 to-gray-300', icon: <Award className="w-6 h-6" />, perks: ['10% off all services', 'Priority booking', 'Free express wash monthly'], nftId: 'DH3-SLV-0042' },
  { name: 'Gold', min: 3000, color: 'from-accent to-yellow-500', icon: <Crown className="w-6 h-6" />, perks: ['15% off all services', 'Priority booking', 'Free full detail quarterly', 'VIP lounge access'], nftId: null },
  { name: 'Platinum', min: 5000, color: 'from-primary to-emerald-500', icon: <Sparkles className="w-6 h-6" />, perks: ['20% off all services', 'Priority booking', 'Free detail monthly', 'VIP lounge', 'Exclusive events'], nftId: null },
];

export default function CustomerLoyalty() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'rewards' | 'nft'>('rewards');
  const { totalPoints, tier, pointsToNextTier, history } = mockLoyalty;
  const currentTierIdx = nftTiers.findIndex(t => t.name === tier);
  const nextTier = nftTiers[currentTierIdx + 1];
  const progress = nextTier ? ((totalPoints - nftTiers[currentTierIdx].min) / (nextTier.min - nftTiers[currentTierIdx].min)) * 100 : 100;

  const mintNFT = () => {
    toast({ title: 'Minting NFT...', description: 'Your Silver membership NFT is being minted on Avalanche via DH3.' });
  };

  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="Loyalty & Rewards" subtitle="Earn points, unlock NFT membership tiers • Powered by DH3" />

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted mb-6 w-fit">
        {[
          { id: 'rewards' as const, label: 'Points & Tiers', icon: <Star className="w-4 h-4" /> },
          { id: 'nft' as const, label: 'NFT Membership', icon: <Shield className="w-4 h-4" /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'rewards' && (
        <>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Points card */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-primary text-primary-foreground">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-6 h-6" />
                <span className="text-sm font-medium opacity-70">Your Points</span>
              </div>
              <p className="text-5xl font-display mb-2">{totalPoints.toLocaleString()}</p>
              <p className="text-sm opacity-70 mb-6">{tier} Member</p>
              {nextTier && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span>{tier}</span>
                    <span>{pointsToNextTier} pts to {nextTier.name}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-primary-foreground/20">
                    <div className="h-2 rounded-full bg-primary-foreground/60 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Tiers */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-display text-foreground mb-4">Tier Benefits</h3>
              <div className="space-y-3">
                {nftTiers.map((t) => (
                  <div key={t.name} className={`flex items-center gap-3 p-3 rounded-lg ${t.name === tier ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs`}>
                      {t.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.min.toLocaleString()}+ pts</p>
                    </div>
                    {t.name === tier && <span className="ml-auto text-xs font-medium text-primary">Current</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="mt-6 p-5 rounded-xl bg-card border border-border shadow-card">
            <h3 className="font-display text-foreground mb-4">Points History</h3>
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.description}</p>
                    <p className="text-xs text-muted-foreground">{h.date}</p>
                  </div>
                  <span className="text-sm font-medium text-success">+{h.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'nft' && (
        <div className="space-y-6">
          {/* NFT membership card */}
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="relative p-6 rounded-xl border border-border shadow-card-hover overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 via-card to-gray-300/10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">DH3 Membership NFT</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" /> Minted
                  </span>
                </div>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-300 flex items-center justify-center text-white mb-4 shadow-lg">
                  <Award className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-display text-foreground mb-1">Silver Member</h3>
                <p className="text-sm text-muted-foreground mb-4">James Mwangi • Token #DH3-SLV-0042</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.open('https://snowtrace.io', '_blank')}>
                    <ExternalLink className="w-3 h-3 mr-1" /> View on Chain
                  </Button>
                </div>
              </div>
            </motion.div>

            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-display text-foreground mb-4">Your NFT Perks</h3>
              <div className="space-y-3">
                {nftTiers[currentTierIdx].perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
                      <span className="text-success text-xs">✓</span>
                    </div>
                    <span className="text-sm text-foreground">{perk}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-3 rounded-lg bg-accent/5 border border-accent/10">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Next tier: Gold</strong> — Earn {pointsToNextTier} more points to unlock Gold NFT with 15% discounts and free quarterly full detail.
                </p>
              </div>
            </div>
          </div>

          {/* All NFT tiers */}
          <div className="p-5 rounded-xl bg-card border border-border shadow-card">
            <h3 className="font-display text-foreground mb-4">All NFT Membership Tiers</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nftTiers.map((t, i) => (
                <div key={t.name} className={`p-4 rounded-xl border ${i <= currentTierIdx ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'}`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white mb-3`}>
                    {t.icon}
                  </div>
                  <h4 className="font-display text-foreground mb-1">{t.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{t.min.toLocaleString()}+ points</p>
                  <ul className="space-y-1">
                    {t.perks.slice(0, 3).map((p, j) => (
                      <li key={j} className="text-[11px] text-muted-foreground">• {p}</li>
                    ))}
                  </ul>
                  {i <= currentTierIdx && <span className="inline-block mt-2 text-[10px] font-bold text-primary">UNLOCKED</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground"><strong className="text-foreground">Powered by DH3:</strong> Your membership tier is stored as a soulbound NFT on Avalanche. It's verifiable, non-transferable, and proves your loyalty status on-chain. Future perks can include DAO voting and exclusive service access.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
