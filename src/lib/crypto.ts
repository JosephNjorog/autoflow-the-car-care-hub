import { BrowserProvider, Contract, parseUnits } from 'ethers';

// ─── Avalanche C-Chain Config ─────────────────────────────────────────────────

const AVALANCHE_CHAIN = {
  chainId: '0xA86A', // 43114
  chainName: 'Avalanche C-Chain',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: [import.meta.env.VITE_AVAX_RPC || 'https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io/'],
};

// USDT and USDC token addresses on Avalanche C-Chain mainnet
const TOKENS: Record<string, { address: string; decimals: number }> = {
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
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

// ─── Wallet Detection ─────────────────────────────────────────────────────────

export function isWalletAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum;
}

export function getWalletName(): string {
  if (!window.ethereum) return 'No wallet';
  if (window.ethereum.isTrust) return 'Trust Wallet';
  if (window.ethereum.isMetaMask) return 'MetaMask';
  return 'Web3 Wallet';
}

// ─── Connect Wallet ───────────────────────────────────────────────────────────

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error(
      'No crypto wallet found. Please install MetaMask or Trust Wallet, or use the mobile Trust Wallet app.'
    );
  }

  const provider = new BrowserProvider(window.ethereum);
  const accounts = (await provider.send('eth_requestAccounts', [])) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please unlock your wallet.');
  }

  return accounts[0];
}

// ─── Switch to Avalanche ──────────────────────────────────────────────────────

export async function switchToAvalanche(): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet found.');

  try {
    // First try switching (works if chain already added)
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AVALANCHE_CHAIN.chainId }],
    });
  } catch {
    // Chain not added — add it
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [AVALANCHE_CHAIN],
    });
  }
}

// ─── Send USDT / USDC Payment ─────────────────────────────────────────────────

export async function sendCryptoPayment(
  token: 'usdt' | 'usdc',
  usdAmount: number,
  recipientAddress: string
): Promise<string> {
  if (!window.ethereum) throw new Error('No wallet found.');

  const tokenInfo = TOKENS[token];
  if (!tokenInfo) throw new Error(`Unsupported token: ${token}`);

  if (!recipientAddress || recipientAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error('AutoFlow payment wallet not configured. Please contact support.');
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const contract = new Contract(tokenInfo.address, ERC20_ABI, signer);

  // Convert USD amount to token units (6 decimals for USDT/USDC)
  const amountInUnits = parseUnits(usdAmount.toFixed(6), tokenInfo.decimals);

  // Check balance
  const address = await signer.getAddress();
  const balance = await contract.balanceOf(address) as bigint;
  if (balance < amountInUnits) {
    const balanceFormatted = (Number(balance) / 10 ** tokenInfo.decimals).toFixed(2);
    throw new Error(
      `Insufficient ${token.toUpperCase()} balance. You have ${balanceFormatted} ${token.toUpperCase()}, need ${usdAmount.toFixed(2)}.`
    );
  }

  // Send the transfer
  const tx = await contract.transfer(recipientAddress, amountInUnits);
  const receipt = await tx.wait();

  return (receipt as { hash: string }).hash;
}

// ─── Full Payment Flow ────────────────────────────────────────────────────────

export type CryptoPaymentStep = 'idle' | 'connecting' | 'switching' | 'signing' | 'confirming';

export interface CryptoPaymentCallbacks {
  onStep: (step: CryptoPaymentStep) => void;
}

export async function runCryptoPayment(
  token: 'usdt' | 'usdc',
  usdAmount: number,
  callbacks: CryptoPaymentCallbacks
): Promise<string> {
  const recipientWallet = import.meta.env.VITE_AUTOFLOW_WALLET as string;

  callbacks.onStep('connecting');
  await connectWallet();

  callbacks.onStep('switching');
  await switchToAvalanche();

  callbacks.onStep('signing');
  const txHash = await sendCryptoPayment(token, usdAmount, recipientWallet);

  callbacks.onStep('confirming');
  // Brief pause for UX — tx.wait() already confirmed on-chain
  await new Promise(r => setTimeout(r, 800));

  callbacks.onStep('idle');
  return txHash;
}
