import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Wallet, Copy, ExternalLink, ArrowUpDown, Shield, Zap, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchLivePrices } from '@/lib/prices';

export default function CustomerWallet() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'wallet' | 'prices' | 'history'>('wallet');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const { data: prices, isLoading: pricesLoading, refetch: refetchPrices, isFetching } = useQuery({
    queryKey: ['live-prices'],
    queryFn: fetchLivePrices,
    staleTime: 60_000,
    retry: 2,
  });

  const priceFeeds = prices ? [
    { pair: 'AVAX/USD', price: prices.avaxUsd, prefix: '$', decimals: 2 },
    { pair: 'USDT/USD', price: prices.usdtUsd, prefix: '$', decimals: 4 },
    { pair: 'USDC/USD', price: prices.usdcUsd, prefix: '$', decimals: 4 },
    { pair: 'AVAX/KES', price: prices.avaxKes, prefix: 'KES ', decimals: 2 },
  ] : [];

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({ title: 'Copied', description: 'Wallet address copied to clipboard.' });
    }
  };

  const handleConnect = (name: string) => {
    toast({ title: 'Connecting...', description: `Opening ${name} connection dialog via Tether WDK.` });
  };

  const handleRefresh = () => {
    refetchPrices().then(() => {
      toast({ title: 'Prices Updated', description: 'Live rates refreshed.' });
    });
  };

  return (
    <DashboardLayout>
      <PageHeader title="Crypto Wallet" subtitle="Powered by Tether WDK on Avalanche • Live rates via Chainlink" />

      <div className="flex gap-1 p-1 rounded-xl bg-muted mb-6 w-fit">
        {[
          { id: 'wallet' as const, label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
          { id: 'prices' as const, label: 'Live Prices', icon: <ArrowUpDown className="w-4 h-4" /> },
          { id: 'history' as const, label: 'Transactions', icon: <Shield className="w-4 h-4" /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'wallet' && (
          <motion.div key="wallet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10"><Wallet className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="font-display text-foreground">Crypto Wallet</p>
                  <p className="text-xs text-muted-foreground">Avalanche C-Chain • Tether WDK</p>
                </div>
              </div>
              {walletAddress ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/15 text-success border border-success/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Connected
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted flex items-center justify-between mb-4">
                    <code className="text-sm text-foreground">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</code>
                    <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground"><Copy className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open('https://snowtrace.io', '_blank')}><ExternalLink className="w-3 h-3 mr-1" /> Explorer</Button>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => { setWalletAddress(null); toast({ title: 'Wallet Disconnected' }); }}>Disconnect</Button>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">No wallet connected. Connect a wallet to pay with crypto.</p>
                  <Button onClick={() => handleConnect('Core Wallet')} variant="outline"><Wallet className="w-4 h-4 mr-2" /> Connect Wallet</Button>
                </div>
              )}
            </div>

            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-display text-foreground mb-1">Connect a Wallet</h3>
              <p className="text-xs text-muted-foreground mb-4">Powered by Tether Wallet Development Kit</p>
              <div className="space-y-3">
                {[
                  { name: 'Core Wallet', desc: 'Avalanche native wallet — recommended' },
                  { name: 'WalletConnect', desc: 'Connect any WC-compatible wallet' },
                  { name: 'MetaMask', desc: 'Popular browser extension wallet' },
                  { name: 'Coinbase Wallet', desc: 'Coinbase self-custody wallet' },
                ].map((w) => (
                  <div key={w.name} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.desc}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleConnect(w.name)}>Connect</Button>
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
                  <p className="text-xs text-muted-foreground mt-1">Real-time data from CoinGecko & open exchange rates</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>
              {pricesLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Fetching live prices...</span>
                </div>
              ) : !prices ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Failed to load prices. Check your connection and try again.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {priceFeeds.map((feed) => (
                    <div key={feed.pair} className="p-4 rounded-xl border border-border bg-muted/30 hover:shadow-card transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">{feed.pair}</span>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-accent" />
                          <span className="text-[10px] text-muted-foreground">Live</span>
                        </div>
                      </div>
                      <p className="text-2xl font-display text-foreground">
                        {feed.prefix}{feed.price.toLocaleString(undefined, { minimumFractionDigits: feed.decimals, maximumFractionDigits: feed.decimals })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-display text-foreground mb-4">On-Chain Transactions</h3>
              <div className="py-8 text-center text-muted-foreground">
                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No on-chain transactions yet.</p>
                <p className="text-xs mt-1">Connect a wallet and pay with crypto to see transactions here.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
