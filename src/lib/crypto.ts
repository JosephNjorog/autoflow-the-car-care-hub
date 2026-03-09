/**
 * Crypto Payment Flow
 *
 * Two payment paths:
 *   1. Injected wallet (MetaMask, Core Wallet, Trust Wallet) — window.ethereum
 *   2. WDK in-app wallet (Tether WDK embedded wallet, no extension needed)
 *
 * Both send USDT or USDC on Avalanche C-Chain to the AutoFlow payment wallet.
 *
 * Set VITE_USE_TESTNET=true in .env.local to use Avalanche Fuji testnet
 * for demo/recording purposes. Fuji faucet: https://faucet.avax.network
 */

import { BrowserProvider, Contract, parseUnits } from 'ethers';
import { sendViaWDK, hasWDKWallet, type WDKPaymentStep } from './wdk';

// ─── Testnet flag ─────────────────────────────────────────────────────────────

export const USE_TESTNET = import.meta.env.VITE_USE_TESTNET === 'true';

// ─── Avalanche Chain Config ───────────────────────────────────────────────────

const AVALANCHE_MAINNET = {
  chainId: '0xA86A', // 43114
  chainName: 'Avalanche C-Chain',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: [import.meta.env.VITE_AVAX_RPC || 'https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io/'],
};

const AVALANCHE_FUJI = {
  chainId: '0xa869', // 43113
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

const AVALANCHE_CHAIN = USE_TESTNET ? AVALANCHE_FUJI : AVALANCHE_MAINNET;

// ─── Token Addresses ──────────────────────────────────────────────────────────

const TOKENS: Record<string, { address: string; decimals: number }> = USE_TESTNET
  ? {
      // Fuji Testnet — Circle's test USDC (works for both USDT + USDC demos)
      // Get test tokens at: https://faucet.circle.com → select Avalanche Fuji
      usdt: { address: '0x5425890298aed601595a70AB815c96711a31Bc65', decimals: 6 },
      usdc: { address: '0x5425890298aed601595a70AB815c96711a31Bc65', decimals: 6 },
    }
  : {
      // Avalanche C-Chain Mainnet
      usdt: { address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', decimals: 6 },
      usdc: { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
    };

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

// ─── Type Declaration for window.ethereum ────────────────────────────────────

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isTrust?: boolean;
      isCoinbaseWallet?: boolean;
      isCore?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

// ─── Wallet Detection ─────────────────────────────────────────────────────────

export function isInjectedWalletAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum;
}

/** @deprecated use isInjectedWalletAvailable */
export function isWalletAvailable(): boolean {
  return isInjectedWalletAvailable();
}

export function isWDKWalletAvailable(): boolean {
  return hasWDKWallet();
}

export function getInjectedWalletName(): string {
  if (!window.ethereum) return 'No wallet';
  if (window.ethereum.isCore) return 'Core Wallet';
  if (window.ethereum.isTrust) return 'Trust Wallet';
  if (window.ethereum.isMetaMask) return 'MetaMask';
  if (window.ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
  return 'Web3 Wallet';
}

// ─── Injected Wallet: Connect ────────────────────────────────────────────────

export async function connectInjectedWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error(
      'No crypto wallet found. Install Core Wallet (core.app), MetaMask, or Trust Wallet.'
    );
  }
  const provider = new BrowserProvider(window.ethereum);
  const accounts = (await provider.send('eth_requestAccounts', [])) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please unlock your wallet.');
  }
  return accounts[0];
}

// ─── Injected Wallet: Switch to Avalanche (mainnet or Fuji) ──────────────────

export async function switchToAvalanche(): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet found.');
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AVALANCHE_CHAIN.chainId }],
    });
  } catch {
    // Chain not added yet — add it
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [AVALANCHE_CHAIN],
    });
  }
}

// ─── Injected Wallet: Send USDT / USDC (single transfer) ─────────────────────

export async function sendCryptoPaymentInjected(
  token: 'usdt' | 'usdc',
  usdAmount: number,
  recipientAddress: string
): Promise<string> {
  if (!window.ethereum) throw new Error('No wallet found.');

  const tokenInfo = TOKENS[token];
  if (!recipientAddress || recipientAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error('AutoFlow payment wallet not configured. Please contact support.');
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(tokenInfo.address, ERC20_ABI, signer);

  const amountInUnits = parseUnits(usdAmount.toFixed(6), tokenInfo.decimals);
  const address = await signer.getAddress();
  const balance = await contract.balanceOf(address) as bigint;

  if (balance < amountInUnits) {
    const balFmt = (Number(balance) / 10 ** tokenInfo.decimals).toFixed(2);
    const tokenLabel = token.toUpperCase();
    const faucetHint = USE_TESTNET
      ? ' Get test tokens at faucet.circle.com (select Avalanche Fuji).'
      : '';
    throw new Error(
      `Insufficient ${tokenLabel} balance. You have ${balFmt} ${tokenLabel}, need ${usdAmount.toFixed(2)}.${faucetHint}`
    );
  }

  const tx = await contract.transfer(recipientAddress, amountInUnits);
  const receipt = await tx.wait();
  return (receipt as { hash: string }).hash;
}

// ─── Injected Wallet: Split payment (10% AutoFlow, 90% owner) ────────────────

async function sendSplitPaymentInjected(
  token: 'usdt' | 'usdc',
  totalUsdAmount: number,
  autoflowWallet: string,
  ownerWallet: string,
): Promise<string> {
  if (!window.ethereum) throw new Error('No wallet found.');
  const tokenInfo = TOKENS[token];

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(tokenInfo.address, ERC20_ABI, signer);

  const totalInUnits = parseUnits(totalUsdAmount.toFixed(6), tokenInfo.decimals);
  const address = await signer.getAddress();
  const balance = await contract.balanceOf(address) as bigint;
  if (balance < totalInUnits) {
    const balFmt = (Number(balance) / 10 ** tokenInfo.decimals).toFixed(2);
    const faucetHint = USE_TESTNET
      ? ' Get test tokens at faucet.circle.com (select Avalanche Fuji).'
      : '';
    throw new Error(
      `Insufficient ${token.toUpperCase()} balance. You have ${balFmt}, need ${totalUsdAmount.toFixed(2)}.${faucetHint}`
    );
  }

  const autoflowAmount = parseUnits((totalUsdAmount * 0.10).toFixed(6), tokenInfo.decimals);
  const ownerAmount    = parseUnits((totalUsdAmount * 0.90).toFixed(6), tokenInfo.decimals);

  // 1. AutoFlow platform fee (10%)
  const tx1 = await contract.transfer(autoflowWallet, autoflowAmount);
  await tx1.wait();

  // 2. Car wash owner revenue (90%)
  const ownerTarget = ownerWallet && ownerWallet !== '0x0000000000000000000000000000000000000000'
    ? ownerWallet
    : autoflowWallet;
  const tx2 = await contract.transfer(ownerTarget, ownerAmount);
  const receipt2 = await tx2.wait();
  return (receipt2 as { hash: string }).hash;
}

// ─── Payment Steps ────────────────────────────────────────────────────────────

export type CryptoPaymentStep =
  | 'idle'
  | 'connecting'
  | 'switching'
  | 'signing'
  | 'confirming'
  | 'preparing';

export type PaymentWalletType = 'injected' | 'wdk';

export interface CryptoPaymentCallbacks {
  onStep: (step: CryptoPaymentStep) => void;
}

// ─── Full Payment Flow ────────────────────────────────────────────────────────

export async function runCryptoPayment(
  token: 'usdt' | 'usdc',
  usdAmount: number,
  callbacks: CryptoPaymentCallbacks,
  walletType: PaymentWalletType = 'injected',
  ownerWallet?: string,
): Promise<string> {
  const autoflowWallet = import.meta.env.VITE_AUTOFLOW_WALLET as string;

  if (walletType === 'wdk') {
    return sendViaWDK(token, usdAmount, autoflowWallet, {
      onStep: (step: WDKPaymentStep) => callbacks.onStep(step as CryptoPaymentStep),
    });
  }

  callbacks.onStep('connecting');
  await connectInjectedWallet();

  callbacks.onStep('switching');
  await switchToAvalanche();

  callbacks.onStep('signing');
  const effectiveOwnerWallet = ownerWallet || autoflowWallet;
  const txHash = await sendSplitPaymentInjected(token, usdAmount, autoflowWallet, effectiveOwnerWallet);

  callbacks.onStep('confirming');
  await new Promise(r => setTimeout(r, 800));

  callbacks.onStep('idle');
  return txHash;
}

export const connectWallet = connectInjectedWallet;
