require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    // ── Avalanche Fuji Testnet (test first) ───────────────────────────────────
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 25000000000, // 25 gwei
    },
    // ── Avalanche C-Chain Mainnet ─────────────────────────────────────────────
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 25000000000,
    },
  },
  // ── SnowTrace (Routescan) verification ───────────────────────────────────
  etherscan: {
    apiKey: {
      avalanche: process.env.SNOWTRACE_API_KEY || "verifyContract",
      fuji:      process.env.SNOWTRACE_API_KEY || "verifyContract",
    },
    customChains: [
      {
        network: "fuji",
        chainId: 43113,
        urls: {
          apiURL:     "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://testnet.snowtrace.io",
        },
      },
      {
        network: "avalanche",
        chainId: 43114,
        urls: {
          apiURL:     "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan",
          browserURL: "https://snowtrace.io",
        },
      },
    ],
  },
};
