/**
 * Live price fetching — Chainlink Data Feeds (primary) + CoinGecko fallback.
 *
 * AVAX/USD, USDT/USD, USDC/USD are read directly from Chainlink AggregatorV3
 * contracts on Avalanche C-Chain, giving us trust-minimised, verifiable prices
 * without relying on a centralised API.
 *
 * KES/USD has no Chainlink feed on Avalanche, so we use open.er-api.com (free).
 * CoinGecko is used as an automatic fallback if the RPC call fails.
 */

import { JsonRpcProvider, Contract } from 'ethers';

// ─── Config ───────────────────────────────────────────────────────────────────

const AVAX_RPC =
  (import.meta.env.VITE_AVAX_RPC as string | undefined) ||
  'https://api.avax.network/ext/bc/C/rpc';

// Chainlink AggregatorV3 addresses on Avalanche C-Chain Mainnet
// Source: https://docs.chain.link/data-feeds/price-feeds/addresses?network=avalanche
const CHAINLINK_FEEDS = {
  avaxUsd: '0xFF3EEb22B5E3dE6e705b44749C2559d704923FD',
  usdtUsd: '0xEBE676ee90Fe1112671f19b6B7459bC678B67e8',
  usdcUsd: '0xF096872672F44d6EBA71527d2277B5b7A1E4D63',
} as const;

// Minimal AggregatorV3Interface ABI
const AGGREGATOR_ABI = [
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() view returns (uint8)',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CryptoPrices {
  avaxUsd: number;
  usdtUsd: number;
  usdcUsd: number;
  avaxKes: number;
  kesPerUsd: number;
  source: 'chainlink' | 'coingecko';
}

// ─── Chainlink (primary) ──────────────────────────────────────────────────────

async function readChainlinkFeed(
  provider: JsonRpcProvider,
  address: string
): Promise<number> {
  const feed = new Contract(address, AGGREGATOR_ABI, provider);
  const [, answer, , updatedAt] = await feed.latestRoundData() as [bigint, bigint, bigint, bigint, bigint];
  const decimals = await feed.decimals() as bigint;

  // Reject stale data (older than 1 hour)
  const age = Math.floor(Date.now() / 1000) - Number(updatedAt);
  if (age > 3600) throw new Error(`Chainlink feed ${address} data is stale (${age}s old)`);

  return Number(answer) / 10 ** Number(decimals);
}

async function fetchChainlinkPrices(): Promise<Omit<CryptoPrices, 'avaxKes' | 'kesPerUsd' | 'source'>> {
  const provider = new JsonRpcProvider(AVAX_RPC);
  const [avaxUsd, usdtUsd, usdcUsd] = await Promise.all([
    readChainlinkFeed(provider, CHAINLINK_FEEDS.avaxUsd),
    readChainlinkFeed(provider, CHAINLINK_FEEDS.usdtUsd),
    readChainlinkFeed(provider, CHAINLINK_FEEDS.usdcUsd),
  ]);
  return { avaxUsd, usdtUsd, usdcUsd };
}

// ─── CoinGecko (fallback) ─────────────────────────────────────────────────────

async function fetchCoinGeckoPrices(): Promise<Omit<CryptoPrices, 'avaxKes' | 'kesPerUsd' | 'source'>> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2,tether,usd-coin&vs_currencies=usd'
  );
  if (!res.ok) throw new Error('CoinGecko fetch failed');
  const data = await res.json() as Record<string, { usd: number }>;
  return {
    avaxUsd: data['avalanche-2']?.usd ?? 0,
    usdtUsd: data['tether']?.usd ?? 1,
    usdcUsd: data['usd-coin']?.usd ?? 1,
  };
}

// ─── KES/USD (open.er-api.com, free, no key) ─────────────────────────────────

async function fetchKesRate(): Promise<number> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) return 129.05;
  const data = await res.json() as { rates: Record<string, number> };
  return data.rates?.KES ?? 129.05;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetches live crypto prices.
 *
 * Strategy:
 *   1. Try Chainlink on-chain feeds on Avalanche C-Chain (verifiable, trust-minimised)
 *   2. Fall back to CoinGecko if RPC is unreachable
 *   3. KES/USD always from open.er-api.com (no Chainlink KES feed on Avalanche)
 */
export async function fetchLivePrices(): Promise<CryptoPrices> {
  const [cryptoPrices, kesPerUsd] = await Promise.all([
    fetchChainlinkPrices().catch(async (err) => {
      console.warn('[prices] Chainlink read failed, falling back to CoinGecko:', err.message);
      return fetchCoinGeckoPrices();
    }),
    fetchKesRate(),
  ]);

  const source: 'chainlink' | 'coingecko' =
    'source' in cryptoPrices ? (cryptoPrices as CryptoPrices).source : 'chainlink';

  return {
    ...cryptoPrices,
    avaxKes: cryptoPrices.avaxUsd * kesPerUsd,
    kesPerUsd,
    source,
  };
}
