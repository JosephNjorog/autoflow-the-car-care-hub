/**
 * Tether WDK — Embedded Self-Custodial Wallet
 *
 * Uses @tetherto/wdk + @tetherto/wdk-wallet-evm to create and manage
 * a self-custodial USDT wallet on Avalanche C-Chain directly in the browser.
 *
 * This is the "no MetaMask needed" path — ideal for diaspora customers
 * who want to pay with USDT without installing a browser extension.
 */

import WDK from '@tetherto/wdk';
import WalletManagerEvm, { WalletAccountReadOnlyEvm } from '@tetherto/wdk-wallet-evm';
import { parseUnits } from 'ethers';

// ─── Config ───────────────────────────────────────────────────────────────────

const AVAX_RPC =
  (import.meta.env.VITE_AVAX_RPC as string | undefined) ||
  'https://api.avax.network/ext/bc/C/rpc';

// USDT on Avalanche C-Chain (Mainnet)
const USDT_ADDRESS = '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7';
const USDC_ADDRESS = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
const TOKEN_DECIMALS = 6;

const STORAGE_KEY = 'autoflow_wdk_seed';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WDKWallet {
  address: string;
  seedPhrase: string;
}

// ─── Seed storage (localStorage) ─────────────────────────────────────────────

function saveSeed(seed: string): void {
  localStorage.setItem(STORAGE_KEY, seed);
}

function loadSeed(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function forgetWDKWallet(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasWDKWallet(): boolean {
  return !!loadSeed();
}

// ─── Create or restore wallet ─────────────────────────────────────────────────

export async function createWDKWallet(): Promise<WDKWallet> {
  const seedPhrase = WDK.getRandomSeedPhrase(12);
  saveSeed(seedPhrase);
  const address = await getWDKAddress(seedPhrase);
  return { address, seedPhrase };
}

export async function restoreWDKWallet(seedPhrase: string): Promise<WDKWallet> {
  const words = seedPhrase.trim().split(/\s+/);
  if (words.length !== 12 && words.length !== 24) {
    throw new Error('Seed phrase must be 12 or 24 words.');
  }
  const address = await getWDKAddress(seedPhrase);
  saveSeed(seedPhrase);
  return { address, seedPhrase };
}

export async function loadWDKWallet(): Promise<WDKWallet | null> {
  const seed = loadSeed();
  if (!seed) return null;
  const address = await getWDKAddress(seed);
  return { address, seedPhrase: seed };
}

// ─── Address derivation ───────────────────────────────────────────────────────

async function getWDKAddress(seedPhrase: string): Promise<string> {
  const walletManager = new WalletManagerEvm(seedPhrase, { provider: AVAX_RPC });
  const account = await walletManager.getAccount(0);
  const address = account.address;
  account.dispose();
  return address;
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export async function getWDKBalances(address: string): Promise<{
  avax: string;
  usdt: string;
  usdc: string;
}> {
  const readOnly = new WalletAccountReadOnlyEvm(address, { provider: AVAX_RPC });

  const [avaxWei, usdtRaw, usdcRaw] = await Promise.all([
    readOnly.getBalance(),
    readOnly.getTokenBalance(USDT_ADDRESS),
    readOnly.getTokenBalance(USDC_ADDRESS),
  ]);

  const fmt = (raw: bigint, dec: number) =>
    (Number(raw) / 10 ** dec).toFixed(dec === 18 ? 4 : 2);

  return {
    avax: fmt(avaxWei, 18),
    usdt: fmt(usdtRaw, TOKEN_DECIMALS),
    usdc: fmt(usdcRaw, TOKEN_DECIMALS),
  };
}

// ─── USDT / USDC Transfer ─────────────────────────────────────────────────────

export type WDKPaymentStep = 'idle' | 'preparing' | 'signing' | 'confirming';

export interface WDKPaymentCallbacks {
  onStep: (step: WDKPaymentStep) => void;
}

/**
 * Send USDT or USDC via the WDK embedded wallet.
 *
 * @param token      - 'usdt' or 'usdc'
 * @param usdAmount  - amount in USD (converted to token base units automatically)
 * @param recipient  - AutoPayKe payment wallet address
 * @param callbacks  - optional step callbacks for UX feedback
 */
export async function sendViaWDK(
  token: 'usdt' | 'usdc',
  usdAmount: number,
  recipient: string,
  callbacks?: WDKPaymentCallbacks
): Promise<string> {
  const seed = loadSeed();
  if (!seed) throw new Error('No WDK wallet found. Please create or restore your wallet first.');

  if (!recipient || recipient === '0x0000000000000000000000000000000000000000') {
    throw new Error('AutoPayKe payment wallet not configured.');
  }

  const tokenAddress = token === 'usdt' ? USDT_ADDRESS : USDC_ADDRESS;
  const amountInUnits = parseUnits(usdAmount.toFixed(TOKEN_DECIMALS), TOKEN_DECIMALS);

  callbacks?.onStep('preparing');
  const walletManager = new WalletManagerEvm(seed, { provider: AVAX_RPC });
  const account = await walletManager.getAccount(0);

  try {
    // Check balance
    const balance = await account.getTokenBalance(tokenAddress);
    if (balance < amountInUnits) {
      const bal = (Number(balance) / 10 ** TOKEN_DECIMALS).toFixed(2);
      throw new Error(
        `Insufficient ${token.toUpperCase()} balance. You have ${bal} ${token.toUpperCase()}, need ${usdAmount.toFixed(2)}.`
      );
    }

    callbacks?.onStep('signing');
    const result = await account.transfer({
      token: tokenAddress,
      recipient,
      amount: amountInUnits,
    });

    callbacks?.onStep('confirming');
    // Brief UX pause — transfer() already awaits on-chain confirmation
    await new Promise(r => setTimeout(r, 800));

    callbacks?.onStep('idle');
    return result.hash;
  } finally {
    account.dispose();
  }
}
