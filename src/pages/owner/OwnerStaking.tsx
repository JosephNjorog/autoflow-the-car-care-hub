import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, StatCard } from '@/components/shared/SharedComponents';
import { Coins, TrendingUp, Clock, Shield, ArrowRight, Percent, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const mockStakingData = {
  stakedAvax: 25.5,
  rewardsEarned: 1.82,
  apy: 7.2,
  stakingPeriod: '30 days',
  nextReward: '2026-02-28',
  totalValueUSD: 1050.12,
};

const stakingHistory = [
  { id: 1, action: 'Staked', amount: '15.0 AVAX', date: '2026-01-25', status: 'active' },
  { id: 2, action: 'Reward', amount: '0.92 AVAX', date: '2026-02-10', status: 'claimed' },
  { id: 3, action: 'Staked', amount: '10.5 AVAX', date: '2026-02-15', status: 'active' },
  { id: 4, action: 'Reward', amount: '0.90 AVAX', date: '2026-02-25', status: 'pending' },
];

export default function OwnerStaking() {
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);

  const handleStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    setIsStaking(true);
    setTimeout(() => {
      setIsStaking(false);
      toast({ title: 'AVAX Staked!', description: `${stakeAmount} AVAX staked via Suzaku liquid staking on Avalanche.` });
      setStakeAmount('');
    }, 2000);
  };

  return (
    <DashboardLayout role="owner" userName="David Kamau">
      <PageHeader title="AVAX Staking" subtitle="Earn yield on your AVAX earnings • Powered by Suzaku" />

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Staked" value={`${mockStakingData.stakedAvax} AVAX`} icon={<Coins className="w-5 h-5" />} />
        <StatCard title="Rewards Earned" value={`${mockStakingData.rewardsEarned} AVAX`} icon={<TrendingUp className="w-5 h-5" />} trend={{ value: '+0.90 this month', positive: true }} />
        <StatCard title="Current APY" value={`${mockStakingData.apy}%`} icon={<Percent className="w-5 h-5" />} />
        <StatCard title="USD Value" value={`$${mockStakingData.totalValueUSD.toLocaleString()}`} icon={<Shield className="w-5 h-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Stake AVAX */}
        <div className="p-6 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10"><Coins className="w-5 h-5 text-primary" /></div>
            <div>
              <h3 className="font-display text-foreground">Stake AVAX</h3>
              <p className="text-xs text-muted-foreground">Earn yield through Suzaku liquid staking protocol</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount to Stake</Label>
              <div className="relative">
                <Input type="number" placeholder="0.00" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} className="pr-16" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">AVAX</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Available: 8.23 AVAX</span>
                <button onClick={() => setStakeAmount('8.23')} className="text-primary hover:underline">Max</button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Estimated APY</span>
                <span className="text-foreground font-medium">{mockStakingData.apy}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Est. Monthly Reward</span>
                <span className="text-foreground font-medium">{stakeAmount ? (parseFloat(stakeAmount) * (mockStakingData.apy / 100 / 12)).toFixed(4) : '0.0000'} AVAX</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">You Receive</span>
                <span className="text-foreground font-medium">{stakeAmount || '0.00'} sAVAX</span>
              </div>
            </div>

            <Button onClick={handleStake} disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || isStaking} className="w-full">
              {isStaking ? (
                <><Zap className="w-4 h-4 mr-2 animate-spin" /> Staking...</>
              ) : (
                <><ArrowRight className="w-4 h-4 mr-2" /> Stake AVAX</>
              )}
            </Button>
          </div>
        </div>

        {/* Staking overview */}
        <div className="p-6 rounded-xl bg-card border border-border shadow-card">
          <h3 className="font-display text-foreground mb-4">How Suzaku Staking Works</h3>
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
      </div>

      {/* Staking history */}
      <div className="mt-6 p-5 rounded-xl bg-card border border-border shadow-card">
        <h3 className="font-display text-foreground mb-4">Staking History</h3>
        <div className="space-y-3">
          {stakingHistory.map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tx.action === 'Staked' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                  {tx.action === 'Staked' ? <Coins className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.action}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-display text-foreground">{tx.amount}</p>
                <span className={`text-[10px] font-medium ${tx.status === 'active' ? 'text-success' : tx.status === 'claimed' ? 'text-muted-foreground' : 'text-accent'}`}>
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground"><strong className="text-foreground">Powered by Suzaku:</strong> Liquid staking on Avalanche lets business owners earn passive yield on their AVAX payment earnings without locking capital. sAVAX remains transferable and composable across DeFi.</p>
      </div>
    </DashboardLayout>
  );
}
