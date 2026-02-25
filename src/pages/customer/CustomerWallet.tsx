import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/SharedComponents';
import { Wallet, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomerWallet() {
  return (
    <DashboardLayout role="customer" userName="James Mwangi">
      <PageHeader title="Crypto Wallet" subtitle="Manage your wallet connection for stablecoin payments" />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Connected wallet */}
        <div className="p-6 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10"><Wallet className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-display text-foreground">Connected Wallet</p>
              <p className="text-xs text-muted-foreground">Avalanche C-Chain</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted flex items-center justify-between mb-4">
            <code className="text-sm text-foreground">0x1234...5678</code>
            <button className="text-muted-foreground hover:text-foreground"><Copy className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">AVAX Balance</span>
              <span className="text-sm font-medium text-foreground">12.45 AVAX</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">USDC Balance</span>
              <span className="text-sm font-medium text-foreground">250.00 USDC</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">USDT Balance</span>
              <span className="text-sm font-medium text-foreground">0.00 USDT</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" size="sm" className="flex-1"><ExternalLink className="w-3 h-3 mr-1" /> View on Explorer</Button>
            <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10">Disconnect</Button>
          </div>
        </div>

        {/* Available wallets */}
        <div className="p-6 rounded-xl bg-card border border-border shadow-card">
          <h3 className="font-display text-foreground mb-4">Connect Another Wallet</h3>
          <div className="space-y-3">
            {[
              { name: 'Core Wallet', desc: 'Avalanche native wallet', connected: true },
              { name: 'WalletConnect', desc: 'Connect any supported wallet', connected: false },
              { name: 'MetaMask', desc: 'Popular browser wallet', connected: false },
              { name: 'Coinbase Wallet', desc: 'Coinbase self-custody', connected: false },
            ].map((w) => (
              <div key={w.name} className="flex items-center gap-3 p-4 rounded-xl border border-border">
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
                  <Button variant="outline" size="sm">Connect</Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
