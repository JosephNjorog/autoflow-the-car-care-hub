import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import {
  Wallet, Copy, ExternalLink, ArrowUpDown, Shield, Zap, RefreshCw,
  Loader2, Eye, KeyRound, PlusCircle, RotateCcw, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchLivePrices } from '@/lib/prices';
import {
  createWDKWallet, restoreWDKWallet, loadWDKWallet, forgetWDKWallet, getWDKBalances,
  hasWDKWallet, type WDKWallet,
} from '@/lib/wdk';
import {
  connectInjectedWallet, isInjectedWalletAvailable, getInjectedWalletName,
} from '@/lib/crypto';

type ActiveTab = 'wallet' | 'prices' | 'history';
type WalletTab = 'wdk' | 'injected';

export default function CustomerWallet() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('wallet');
  const [walletTab, setWalletTab] = useState<WalletTab>('wdk');

  // ── WDK wallet state ────────────────────────────────────────────────────────
  const [wdkWallet, setWdkWallet] = useState<WDKWallet | null>(null);
  const [wdkBalances, setWdkBalances] = useState<{ avax: string; usdt: string; usdc: string } | null>(null);
  const [wdkLoading, setWdkLoading] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const [showRestore, setShowRestore] = useState(false);
  const [seedConfirmed, setSeedConfirmed] = useState(false);
  const [newSeedPhrase, setNewSeedPhrase] = useState('');

  // ── Injected wallet state ───────────────────────────────────────────────────
  const [injectedAddress, setInjectedAddress] = useState<string | null>(null);

  // ── Prices ──────────────────────────────────────────────────────────────────
  const { data: prices, isLoading: pricesLoading, refetch: refetchPrices, isFetching } = useQuery({
    queryKey: ['live-prices'],
    queryFn: fetchLivePrices,
    staleTime: 60_000,
    retry: 2,
  });

  // Load existing WDK wallet on mount
  useEffect(() => {
    if (hasWDKWallet()) {
      loadWDKWallet().then(w => {
        if (w) {
          setWdkWallet(w);
          refreshWdkBalances(w.address);
        }
      }).catch(console.error);
    }
  }, []);

  const refreshWdkBalances = async (address: string) => {
    try {
      const bal = await getWDKBalances(address);
      setWdkBalances(bal);
    } catch {
      // balance fetch is non-critical
    }
  };

  // ── WDK actions ─────────────────────────────────────────────────────────────

  const handleCreateWDK = async () => {
    setWdkLoading(true);
    try {
      const wallet = await createWDKWallet();
      setWdkWallet(wallet);
      setNewSeedPhrase(wallet.seedPhrase);
      setSeedConfirmed(false);
      setShowSeed(true);
      refreshWdkBalances(wallet.address);
      toast({ title: 'Wallet Created', description: "Write down your seed phrase — it's the only way to recover your wallet." });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setWdkLoading(false);
    }
  };

  const handleRestoreWDK = async () => {
    if (!seedInput.trim()) return;
    setWdkLoading(true);
    try {
      const wallet = await restoreWDKWallet(seedInput.trim());
      setWdkWallet(wallet);
      setSeedInput('');
      setShowRestore(false);
      refreshWdkBalances(wallet.address);
      toast({ title: 'Wallet Restored', description: 'Your AutoFlow wallet has been restored.' });
    } catch (err) {
      toast({ title: 'Restore Failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setWdkLoading(false);
    }
  };

  const handleDisconnectWDK = () => {
    forgetWDKWallet();
    setWdkWallet(null);
    setWdkBalances(null);
    setNewSeedPhrase('');
    setSeedConfirmed(false);
    toast({ title: 'Wallet Removed', description: 'AutoFlow wallet removed from this device.' });
  };

  // ── Injected wallet ──────────────────────────────────────────────────────────

  const handleConnectInjected = async (walletName: string) => {
    if (!isInjectedWalletAvailable()) {
      toast({
        title: 'No Wallet Detected',
        description: `Please install ${walletName} or open this page in your wallet's browser.`,
        variant: 'destructive',
      });
      return;
    }
    try {
      const address = await connectInjectedWallet();
      setInjectedAddress(address);
      toast({ title: 'Wallet Connected', description: `${getInjectedWalletName()} connected.` });
    } catch (err) {
      toast({ title: 'Connection Failed', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleRefreshPrices = () => {
    refetchPrices().then(() => {
      toast({ title: 'Prices Updated', description: 'Live rates refreshed from Chainlink.' });
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  const priceFeeds = prices ? [
    { pair: 'AVAX/USD', price: prices.avaxUsd, prefix: '$', decimals: 2 },
    { pair: 'USDT/USD', price: prices.usdtUsd, prefix: '$', decimals: 4 },
    { pair: 'USDC/USD', price: prices.usdcUsd, prefix: '$', decimals: 4 },
    { pair: 'AVAX/KES', price: prices.avaxKes, prefix: 'KES ', decimals: 2 },
  ] : [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Crypto Wallet"
        subtitle="Powered by Tether WDK on Avalanche • Live rates via Chainlink"
      />

      {/* Main tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted mb-6 w-fit">
        {([
          { id: 'wallet' as const, label: 'Wallet', icon: <Wallet className="w-4 h-4" /> },
          { id: 'prices' as const, label: 'Live Prices', icon: <ArrowUpDown className="w-4 h-4" /> },
          { id: 'history' as const, label: 'Transactions', icon: <Shield className="w-4 h-4" /> },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── WALLET TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'wallet' && (
          <motion.div key="wallet" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Wallet type selector */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted mb-6 w-fit">
              <button onClick={() => setWalletTab('wdk')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${walletTab === 'wdk' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}>
                AutoFlow Wallet <span className="text-[10px] ml-1 text-primary font-semibold">WDK</span>
              </button>
              <button onClick={() => setWalletTab('injected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${walletTab === 'injected' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground'}`}>
                External Wallet
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ── WDK (Tether WDK in-app wallet) ─────────────────────── */}
              {walletTab === 'wdk' && (
                <motion.div key="wdk" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="grid lg:grid-cols-2 gap-6">

                  {/* WDK Wallet Card */}
                  <div className="p-6 rounded-xl bg-card border border-border shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10"><Wallet className="w-5 h-5 text-primary" /></div>
                      <div>
                        <p className="font-display text-foreground flex items-center gap-2">
                          AutoFlow Wallet
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Tether WDK</span>
                        </p>
                        <p className="text-xs text-muted-foreground">Self-custodial • Avalanche C-Chain</p>
                      </div>
                    </div>

                    {wdkWallet ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/15 text-success border border-success/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Active
                          </span>
                        </div>

                        {/* Address */}
                        <div className="p-3 rounded-lg bg-muted flex items-center justify-between mb-3">
                          <code className="text-sm text-foreground">{wdkWallet.address.slice(0, 8)}...{wdkWallet.address.slice(-6)}</code>
                          <div className="flex gap-1">
                            <button onClick={() => copyToClipboard(wdkWallet.address, 'Address')} className="text-muted-foreground hover:text-foreground p-1"><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => window.open(`https://snowtrace.io/address/${wdkWallet.address}`, '_blank')} className="text-muted-foreground hover:text-foreground p-1"><ExternalLink className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>

                        {/* Balances */}
                        {wdkBalances && (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                              { label: 'AVAX', value: wdkBalances.avax },
                              { label: 'USDT', value: wdkBalances.usdt },
                              { label: 'USDC', value: wdkBalances.usdc },
                            ].map(b => (
                              <div key={b.label} className="p-2 rounded-lg bg-muted/50 text-center">
                                <p className="text-xs text-muted-foreground">{b.label}</p>
                                <p className="text-sm font-display text-foreground">{b.value}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Seed phrase reveal (after first creation) */}
                        {newSeedPhrase && !seedConfirmed && (
                          <div className="mb-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                            <div className="flex items-start gap-2 mb-3">
                              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                              <p className="text-xs text-destructive font-medium">Write down your seed phrase. This is the ONLY way to recover your wallet.</p>
                            </div>
                            {showSeed ? (
                              <>
                                <div className="grid grid-cols-3 gap-1.5 mb-3">
                                  {newSeedPhrase.split(' ').map((word, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-card rounded px-2 py-1 text-xs">
                                      <span className="text-muted-foreground w-4">{i + 1}.</span>
                                      <span className="font-mono text-foreground">{word}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="flex-1" onClick={() => copyToClipboard(newSeedPhrase, 'Seed phrase')}>
                                    <Copy className="w-3 h-3 mr-1" /> Copy
                                  </Button>
                                  <Button size="sm" className="flex-1" onClick={() => { setSeedConfirmed(true); setNewSeedPhrase(''); setShowSeed(false); }}>
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> I've saved it
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <Button size="sm" variant="outline" className="w-full" onClick={() => setShowSeed(true)}>
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Reveal Seed Phrase
                              </Button>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => refreshWdkBalances(wdkWallet.address)}>
                            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleDisconnectWDK}>
                            Remove
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Create a self-custodial USDT wallet powered by Tether WDK — no MetaMask or extensions needed.
                        </p>
                        {showRestore ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="Enter 12 or 24-word seed phrase..."
                              value={seedInput}
                              onChange={e => setSeedInput(e.target.value)}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1" disabled={!seedInput.trim() || wdkLoading} onClick={handleRestoreWDK}>
                                {wdkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5 mr-1" />}
                                Restore
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowRestore(false)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button className="flex-1" disabled={wdkLoading} onClick={handleCreateWDK}>
                              {wdkLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                              Create Wallet
                            </Button>
                            <Button variant="outline" className="flex-1" disabled={wdkLoading} onClick={() => setShowRestore(true)}>
                              <RotateCcw className="w-4 h-4 mr-2" /> Restore
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* WDK Info Card */}
                  <div className="p-6 rounded-xl bg-card border border-border shadow-card">
                    <h3 className="font-display text-foreground mb-1">Powered by Tether WDK</h3>
                    <p className="text-xs text-muted-foreground mb-5">Open-source, self-custodial wallet infrastructure by Tether</p>
                    <div className="space-y-4">
                      {[
                        { icon: <Shield className="w-4 h-4 text-primary" />, title: 'Self-Custodial', desc: 'Your private key never leaves your device. Only you control your funds.' },
                        { icon: <Zap className="w-4 h-4 text-primary" />, title: 'No Extension Needed', desc: 'Perfect for diaspora customers — works in any browser, no MetaMask required.' },
                        { icon: <Wallet className="w-4 h-4 text-primary" />, title: 'USDT on Avalanche', desc: 'Send USDT natively on Avalanche C-Chain for near-instant, low-fee payments.' },
                      ].map(f => (
                        <div key={f.title} className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">{f.icon}</div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{f.title}</p>
                            <p className="text-xs text-muted-foreground">{f.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Diaspora use case:</strong> A Kenyan in the UK can fund this wallet with USDT and pay for a family member's car wash in Nairobi — no M-Pesa, no bank transfer needed.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── External (Injected) Wallet ─────────────────────────── */}
              {walletTab === 'injected' && (
                <motion.div key="injected" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="grid lg:grid-cols-2 gap-6">

                  <div className="p-6 rounded-xl bg-card border border-border shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10"><Wallet className="w-5 h-5 text-primary" /></div>
                      <div>
                        <p className="font-display text-foreground">External Wallet</p>
                        <p className="text-xs text-muted-foreground">MetaMask · Core · Trust · Coinbase</p>
                      </div>
                    </div>

                    {injectedAddress ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/15 text-success border border-success/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Connected
                          </span>
                          <span className="text-xs text-muted-foreground">{getInjectedWalletName()}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-muted flex items-center justify-between mb-4">
                          <code className="text-sm text-foreground">{injectedAddress.slice(0, 8)}...{injectedAddress.slice(-6)}</code>
                          <div className="flex gap-1">
                            <button onClick={() => copyToClipboard(injectedAddress, 'Address')} className="text-muted-foreground hover:text-foreground p-1"><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => window.open(`https://snowtrace.io/address/${injectedAddress}`, '_blank')} className="text-muted-foreground hover:text-foreground p-1"><ExternalLink className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                          onClick={() => { setInjectedAddress(null); toast({ title: 'Wallet Disconnected' }); }}>
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <div className="py-4 text-center space-y-3">
                        <p className="text-sm text-muted-foreground">Connect your existing crypto wallet to pay with USDT or USDC.</p>
                        {!isInjectedWalletAvailable() && (
                          <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-2">
                            No wallet extension detected. Install Core Wallet (recommended for Avalanche) or MetaMask, or open this page in Trust Wallet's browser.
                          </p>
                        )}
                        <Button onClick={() => handleConnectInjected('your wallet')} variant="outline" className="w-full">
                          <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-xl bg-card border border-border shadow-card">
                    <h3 className="font-display text-foreground mb-1">Supported Wallets</h3>
                    <p className="text-xs text-muted-foreground mb-4">Any EIP-1193 compatible wallet on Avalanche C-Chain</p>
                    <div className="space-y-3">
                      {[
                        { name: 'Core Wallet', desc: 'Avalanche native — recommended for AVAX & USDT', recommended: true },
                        { name: 'MetaMask', desc: 'Most popular browser extension wallet' },
                        { name: 'Trust Wallet', desc: 'Open this page in the Trust Wallet in-app browser' },
                        { name: 'Coinbase Wallet', desc: 'Coinbase self-custody wallet' },
                      ].map(w => (
                        <div key={w.name} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{w.name}</p>
                              {w.recommended && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Recommended</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{w.desc}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleConnectInjected(w.name)}>Connect</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── LIVE PRICES TAB ─────────────────────────────────────────────── */}
        {activeTab === 'prices' && (
          <motion.div key="prices" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-foreground">Live Price Feeds</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-primary" />
                    {prices?.source === 'chainlink'
                      ? 'On-chain data from Chainlink AggregatorV3 on Avalanche'
                      : 'CoinGecko (Chainlink RPC unavailable — fallback active)'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshPrices} disabled={isFetching}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
                </Button>
              </div>

              {pricesLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Reading Chainlink feeds on Avalanche...</span>
                </div>
              ) : !prices ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Failed to load prices. Check your connection and try again.
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {priceFeeds.map((feed) => (
                      <div key={feed.pair} className="p-4 rounded-xl border border-border bg-muted/30 hover:shadow-card transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase">{feed.pair}</span>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-accent" />
                            <span className="text-[10px] text-muted-foreground">
                              {prices.source === 'chainlink' ? 'Chainlink' : 'CoinGecko'}
                            </span>
                          </div>
                        </div>
                        <p className="text-2xl font-display text-foreground">
                          {feed.prefix}{feed.price.toLocaleString(undefined, {
                            minimumFractionDigits: feed.decimals,
                            maximumFractionDigits: feed.decimals,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground text-right">
                    Crypto: {prices.source === 'chainlink' ? 'Chainlink AggregatorV3 (Avalanche C-Chain)' : 'CoinGecko'} · KES/USD: open.er-api.com
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TRANSACTIONS TAB ────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="p-6 rounded-xl bg-card border border-border shadow-card">
              <h3 className="font-display text-foreground mb-4">On-Chain Transactions</h3>
              <div className="py-8 text-center text-muted-foreground">
                <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No on-chain transactions yet.</p>
                <p className="text-xs mt-1">Pay with crypto on the Book Service page to see transactions here.</p>
                {wdkWallet && (
                  <Button variant="outline" size="sm" className="mt-4"
                    onClick={() => window.open(`https://snowtrace.io/address/${wdkWallet.address}`, '_blank')}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View on Snowtrace
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </DashboardLayout>
  );
}
