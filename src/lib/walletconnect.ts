/**
 * Reown AppKit (WalletConnect v2) configuration
 *
 * Supports:
 *  - MetaMask, Core Wallet, Trust Wallet (injected)
 *  - WalletConnect QR code (desktop) → deep link (mobile)
 *  - Any wallet that supports WalletConnect v2
 *
 * Get your project ID at https://cloud.reown.com (free)
 * Set VITE_WALLETCONNECT_PROJECT_ID in your .env
 */

import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { avalanche, avalancheFuji } from '@reown/appkit/networks';

// Vite exposes only VITE_-prefixed vars to the browser.
// If you have NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, add an alias:
//   VITE_WALLETCONNECT_PROJECT_ID=<same value>  in .env.local
const PROJECT_ID =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ||
  '1d338d17086b9eebc7f0b3989b9ee422';

const USE_TESTNET = import.meta.env.VITE_USE_TESTNET === 'true';
const networks = USE_TESTNET
  ? [avalancheFuji, avalanche] as const
  : [avalanche, avalancheFuji] as const;

// Wagmi adapter for Avalanche
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: PROJECT_ID,
  ssr: false,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// App metadata
const metadata = {
  name: 'AutoPayKe',
  description: 'The car wash platform for Kenya — book, pay, and earn loyalty points.',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://autoflowbuzz.vercel.app',
  icons: ['https://autoflowbuzz.vercel.app/favicon.ico'],
};

// Create AppKit instance (singleton, call once at app startup)
let _modal: ReturnType<typeof createAppKit> | null = null;

export function getAppKit() {
  if (!_modal) {
    _modal = createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId: PROJECT_ID,
      metadata,
      features: {
        analytics: false,
        email: false,
        socials: [],
        swaps: false,
        onramp: false,
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#ffffff',
        '--w3m-border-radius-master': '12px',
      },
    });
  }
  return _modal;
}

// Open the connect wallet modal
export function openConnectModal() {
  getAppKit().open({ view: 'Connect' });
}

// Disconnect
export function disconnectWallet() {
  getAppKit().disconnect();
}
