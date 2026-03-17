/**
 * ConnectWallet — WalletConnect v2 powered by Reown AppKit
 *
 * Drop this anywhere in the app to get a "Connect Wallet" button that:
 *  - Shows a QR code on desktop
 *  - Deep-links to wallet apps on mobile
 *  - Supports MetaMask, Core, Trust Wallet, and 400+ WalletConnect wallets
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, ExternalLink, LogOut } from 'lucide-react';
import { openConnectModal, disconnectWallet, getAppKit } from '@/lib/walletconnect';
import { useAppKitAccount } from '@reown/appkit/react';

interface ConnectWalletProps {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  label?: string;
}

export default function ConnectWallet({
  size = 'default',
  variant = 'outline',
  className = '',
  label = 'Connect Wallet',
}: ConnectWalletProps) {
  const { address, isConnected } = useAppKitAccount();
  const [open, setOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [open]);

  if (!isConnected || !address) {
    return (
      <Button size={size} variant={variant} className={className} onClick={openConnectModal}>
        <Wallet className="w-4 h-4 mr-2" />
        {label}
      </Button>
    );
  }

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <Button size={size} variant={variant} className={className} onClick={() => setOpen(v => !v)}>
        <div className="w-2 h-2 rounded-full bg-success mr-2 shrink-0" />
        {short}
        <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground">Connected wallet</p>
            <p className="text-sm font-mono font-medium text-foreground truncate">{address}</p>
          </div>
          <button
            onClick={() => { setOpen(false); getAppKit().open({ view: 'Account' }); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            View on Explorer
          </button>
          <button
            onClick={() => { setOpen(false); disconnectWallet(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors border-t border-border"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
