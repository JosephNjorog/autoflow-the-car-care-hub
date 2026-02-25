import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { mockLoyalty } from '@/data/mockData';
import { Star, Gift, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function CustomerLoyalty() {
  const { totalPoints, tier, pointsToNextTier, history } = mockLoyalty;
  const tiers = [
    { name: 'Bronze', min: 0, color: 'bg-amber-700' },
    { name: 'Silver', min: 1000, color: 'bg-gray-400' },
    { name: 'Gold', min: 3000, color: 'bg-accent' },
    { name: 'Platinum', min: 5000, color: 'bg-primary' },
  ];
  const currentTierIdx = tiers.findIndex(t => t.name === tier);
  const nextTier = tiers[currentTierIdx + 1];
  const progress = nextTier ? ((totalPoints - tiers[currentTierIdx].min) / (nextTier.min - tiers[currentTierIdx].min)) * 100 : 100;

  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="Loyalty Rewards" subtitle="Earn points on every service" />

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
            {tiers.map((t, i) => (
              <div key={t.name} className={`flex items-center gap-3 p-3 rounded-lg ${t.name === tier ? 'bg-primary/10' : 'bg-muted/50'}`}>
                <div className={`w-3 h-3 rounded-full ${t.color}`} />
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
    </DashboardLayout>
  );
}
