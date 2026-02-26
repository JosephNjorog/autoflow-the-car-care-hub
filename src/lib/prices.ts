// Live price fetching utilities using public, key-free APIs

interface CryptoPrices {
  avaxUsd: number;
  usdtUsd: number;
  usdcUsd: number;
  avaxKes: number;
  kesPerUsd: number;
}

/**
 * Fetches live crypto prices (CoinGecko) and the KES exchange rate (open.er-api.com).
 * Both APIs are free and require no API key.
 */
export async function fetchLivePrices(): Promise<CryptoPrices> {
  const [cryptoRes, fxRes] = await Promise.all([
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2,tether,usd-coin&vs_currencies=usd'),
    fetch('https://open.er-api.com/v6/latest/USD'),
  ]);

  if (!cryptoRes.ok || !fxRes.ok) throw new Error('Price fetch failed');

  const crypto = await cryptoRes.json() as Record<string, { usd: number }>;
  const fx = await fxRes.json() as { rates: Record<string, number> };

  const avaxUsd = crypto['avalanche-2']?.usd ?? 0;
  const usdtUsd = crypto['tether']?.usd ?? 1;
  const usdcUsd = crypto['usd-coin']?.usd ?? 1;
  const kesPerUsd = fx.rates?.KES ?? 129.05;

  return {
    avaxUsd,
    usdtUsd,
    usdcUsd,
    avaxKes: avaxUsd * kesPerUsd,
    kesPerUsd,
  };
}
