import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Wallet, Copy, ExternalLink, ArrowUpDown, Shield, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const mockPriceFeeds = [
  { pair: 'AVAX/USD', price: 38.42, change: '+2.14%', positive: true },
  { pair: 'USDT/USD', price: 1.0001, change: '+0.01%', positive: true },
  { pair: 'USDC/USD', price: 0.9999, change: '-0.01%', positive: false },
  { pair: 'AVAX/KES', price: 4957.18, change: '+1.89%', positive: true },
];

const mockTxHistory = [
  { id: 1, type: 'Payment', amount: '50.00 USDT', to: 'AutoFlow Westlands', date: '2026-02-24', status: 'confirmed', hash: '0xabc1...def4' },
  { id: 2, type: 'Payment', amount: '25.00 USDT', to: 'AutoFlow Karen', date: '2026-02-20', status: 'confirmed', hash: '0x789a...bc12' },
  { id: 3, type: 'Received', amount: '100.00 USDT', from: 'External Wallet', date: '2026-02-18', status: 'confirmed', hash: '0xdef4...5678' },
];

export default function CustomerWallet() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'wallet' | 'prices' | 'history'>('wallet');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText('0x1234567890abcdef1234567890abcdef12345678');
    toast({ title: 'Copied', description: 'Wallet address copied to clipboard.' });
  };

  const handleConnect = (name: string) => {
    toast({ title: 'Connecting...', description: `Opening ${name} connection dialog via Tether WDK.` });
  };

  const refreshPrices = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: 'Prices Updated', description: 'Live rates refreshed via Chainlink Data Feeds.' });
    }, 1500);
  };

  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="Crypto Wallet" subtitle="Powered by Tether WDK on Avalanche • Live rates via Chainlink" />

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted mb-6 w-fit">
        {[
          { id: 'wallet' as const, label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
          { id: 'prices' as const, label: 'Live Prices', icon: <ArrowUpDown className="w-4 h-4" /> },
          { id: 'history' as const, label: 'Transactions', icon: <Shield className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'wallet' && (
          <motion.div key="wallet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid lg:grid-cols-2 gap-6">
            {/* Connected wallet — Tether WDK */}
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10"><Wallet className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="font-display text-foreground">Connected Wallet</p>
                  <p className="text-xs text-muted-foreground">Avalanche C-Chain • Tether WDK</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/15 text-success border border-success/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Connected
                </span>
                <span className="text-[10px] text-muted-foreground">via Tether WDK</span>
              </div>
              <div className="p-3 rounded-lg bg-muted flex items-center justify-between mb-4">
                <code className="text-sm text-foreground">0x1234...5678</code>
                <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground"><Copy className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">AVAX Balance</span>
                  <span className="text-sm font-medium text-foreground">12.45 AVAX</span>
                </div>
                <div className="flex items-center justify-between py-2 bg-accent/5 -mx-2 px-2 rounded-lg border border-accent/10">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">USDT Balance</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/15 text-accent">TETHER</span>
                  </div>
                  <span className="text-sm font-display text-foreground">150.00 USDT</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">USDC Balance</span>
                  <span className="text-sm font-medium text-foreground">250.00 USDC</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open('https://snowtrace.io', '_blank')}><ExternalLink className="w-3 h-3 mr-1" /> Explorer</Button>
                <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => toast({ title: 'Wallet Disconnected' })}>Disconnect</Button>
              </div>
            </div>

            {/* Available wallets */}
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-display text-foreground mb-1">Connect a Wallet</h3>
              <p className="text-xs text-muted-foreground mb-4">Powered by Tether Wallet Development Kit</p>
              <div className="space-y-3">
                {[
                  { name: 'Core Wallet', desc: 'Avalanche native wallet — recommended', connected: true, badge: 'Active' },
                  { name: 'WalletConnect', desc: 'Connect any WC-compatible wallet', connected: false },
                  { name: 'MetaMask', desc: 'Popular browser extension wallet', connected: false },
                  { name: 'Coinbase Wallet', desc: 'Coinbase self-custody wallet', connected: false },
                ].map((w) => (
                  <div key={w.name} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.desc}</p>
                    </div>
                    {w.connected ? (
                      <span className="text-xs font-medium text-success">Connected</span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleConnect(w.name)}>Connect</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'prices' && (
          <motion.div key="prices" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-foreground">Live Price Feeds</h3>
                  <p className="text-xs text-muted-foreground mt-1">Real-time data from Chainlink Decentralized Oracles on Avalanche</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshPrices} disabled={isRefreshing}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {mockPriceFeeds.map((feed) => (
                  <div key={feed.pair} className="p-4 rounded-xl border border-border bg-muted/30 hover:shadow-card transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">{feed.pair}</span>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-accent" />
                        <span className="text-[10px] text-muted-foreground">Chainlink</span>
                      </div>
                    </div>
                    <p className="text-2xl font-display text-foreground">${feed.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
                    <span className={`text-xs font-medium ${feed.positive ? 'text-success' : 'text-destructive'}`}>{feed.change}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground"><strong className="text-foreground">How it works:</strong> Chainlink Data Feeds aggregate pricing data from multiple sources, providing tamper-proof, accurate exchange rates for KES ↔ crypto conversions during payment.</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-display text-foreground mb-4">On-Chain Transactions</h3>
              <div className="space-y-3">
                {mockTxHistory.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tx.type === 'Payment' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.type}: {tx.amount}</p>
                        <p className="text-xs text-muted-foreground">{tx.to || tx.from} • {tx.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-success">Confirmed</span>
                      <button onClick={() => window.open('https://snowtrace.io', '_blank')} className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
